import { BehaviorSubject, Observable } from 'rxjs';
import { buffer, concatMap, debounceTime, filter, share, switchMap, tap } from 'rxjs/operators';

/**
 * Накапливает события в буфер и, после паузы в `dueTime` мс без новых событий,
 * обрабатывает их последовательно (без параллелизма) через `project`.
 *
 * Пока идёт обработка одной пачки, новые события копятся в следующую:
 * они не будут обработаны, пока предыдущая пачка не завершится (backpressure).
 */
export function bufferedConcatMap<TSrcItem, TRes>(
    project: (items: TSrcItem[]) => Observable<TRes>,
    dueTime = 500
): (src: Observable<TSrcItem>) => Observable<TRes> {
    return (src$: Observable<TSrcItem>) => {
        const bufferIsLocked$ = new BehaviorSubject<boolean>(false);
        const sharedSrc$ = src$.pipe(share());

        return sharedSrc$.pipe(
            buffer(
                sharedSrc$.pipe(
                    debounceTime(dueTime),
                    switchMap(() => bufferIsLocked$),
                    filter((isLocked) => !isLocked)
                )
            ),
            filter((items) => items.length > 0),
            tap(() => bufferIsLocked$.next(true)),
            concatMap((items) => project(items)),
            tap(() => bufferIsLocked$.next(false))
        );
    };
}
