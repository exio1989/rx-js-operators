import { defer, firstValueFrom, of, throwError } from 'rxjs';
import { retryWithBackoff } from '../retry-with-backoff';

describe('retryWithBackoff', () => {
    it('ретраит 5xx и в итоге получает результат', async () => {
        let attempts = 0;
        const source$ = defer(() => {
            attempts++;
            return attempts < 3 ? throwError(() => ({ status: 500 })) : of('ok');
        });

        const result = await firstValueFrom(
            source$.pipe(retryWithBackoff({ maxRetries: 3, delayMs: 1, backoffMs: 1 }))
        );

        expect(result).toBe('ok');
        expect(attempts).toBe(3);
    });

    it('не ретраит 4xx', async () => {
        let attempts = 0;
        const source$ = defer(() => {
            attempts++;
            return throwError(() => ({ status: 404 }));
        });

        await expect(
            firstValueFrom(
                source$.pipe(retryWithBackoff({ maxRetries: 3, delayMs: 1, backoffMs: 1 }))
            )
        ).rejects.toEqual({ status: 404 });

        expect(attempts).toBe(1);
    });

    it('ретраит сетевые ошибки (status 0)', async () => {
        let attempts = 0;
        const source$ = defer(() => {
            attempts++;
            return attempts < 2 ? throwError(() => ({ status: 0 })) : of('ok');
        });

        const result = await firstValueFrom(
            source$.pipe(retryWithBackoff({ maxRetries: 3, delayMs: 1, backoffMs: 1 }))
        );

        expect(result).toBe('ok');
        expect(attempts).toBe(2);
    });

    it('ретраит ошибки без статуса', async () => {
        let attempts = 0;
        const source$ = defer(() => {
            attempts++;
            return attempts < 2 ? throwError(() => new Error('network down')) : of('ok');
        });

        const result = await firstValueFrom(
            source$.pipe(retryWithBackoff({ maxRetries: 3, delayMs: 1, backoffMs: 1 }))
        );

        expect(result).toBe('ok');
        expect(attempts).toBe(2);
    });

    it('сдаётся после исчерпания maxRetries и вызывает onRetry на каждом повторе', async () => {
        const onRetry = vi.fn();
        const source$ = defer(() => throwError(() => ({ status: 500 })));

        await expect(
            firstValueFrom(
                source$.pipe(retryWithBackoff({ maxRetries: 2, delayMs: 1, backoffMs: 1, onRetry }))
            )
        ).rejects.toEqual({ status: 500 });

        expect(onRetry).toHaveBeenCalledTimes(2);
    });
});
