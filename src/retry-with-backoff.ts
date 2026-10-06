import { Observable, timer, throwError } from 'rxjs';
import { retry } from 'rxjs/operators';

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_DELAY_MS = 1000;
const DEFAULT_BACKOFF_MS = 1000;

export interface RetryWithBackoffConfig {
    /** Максимальное число повторов. По умолчанию 5. */
    maxRetries?: number;
    /** Базовая задержка перед первым повтором, мс. По умолчанию 1000. */
    delayMs?: number;
    /** Прирост задержки на каждый следующий повтор, мс. По умолчанию 1000. */
    backoffMs?: number;
    /** Вызывается перед каждым повтором: (error, attempt). */
    onRetry?: (error: unknown, attempt: number) => void;
    /** Предикат: какие ошибки стоит ретраить. По умолчанию сетевые и 5xx. */
    retryable?: (error: unknown) => boolean;
}

/**
 * Повторяет запрос при сетевых ошибках (status 0) и серверных ошибках 5xx,
 * с линейным backoff: задержка = delayMs + (attempt - 1) * backoffMs.
 *
 * Ошибки 4xx (и всё, что не подходит под предикат) пробрасываются сразу.
 */
export function retryWithBackoff<T>(config: RetryWithBackoffConfig = {}) {
    const {
        maxRetries = DEFAULT_MAX_RETRIES,
        delayMs = DEFAULT_DELAY_MS,
        backoffMs = DEFAULT_BACKOFF_MS,
        onRetry,
        retryable = isRetryableError,
    } = config;

    return (src: Observable<T>): Observable<T> =>
        src.pipe(
            retry({
                count: maxRetries,
                delay: (error: unknown, retryCount: number) => {
                    if (!retryable(error)) {
                        return throwError(() => error);
                    }

                    const backoffTime = delayMs + (retryCount - 1) * backoffMs;
                    onRetry?.(error, retryCount);
                    return timer(backoffTime);
                },
            })
        );
}

function isRetryableError(error: unknown): boolean {
    const statusCode = getStatusCode(error);
    if (statusCode === undefined || statusCode === 0) {
        return true;
    }
    return statusCode >= 500 && statusCode < 600;
}

function getStatusCode(error: unknown): number | undefined {
    if (error == null) {
        return undefined;
    }
    const e = error as Record<string, unknown>;
    return (e.status ?? e.statusCode ?? e.StatusCode) as number | undefined;
}
