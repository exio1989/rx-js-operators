import {BehaviorSubject, Observable} from 'rxjs'
import {buffer, concatMap, debounceTime, filter, share, switchMap, tap} from 'rxjs/operators';

export function bufferedConcatMap<TSrcItem, O extends Observable<any>>(project: (items: TSrcItem[]) => O): (src: Observable<TSrcItem>) => Observable<O>{
    return (src$: Observable<TSrcItem>) => {
        const bufferIsLocked$ = new BehaviorSubject<boolean>(false);
        const sharedSrc$ = src$.pipe(share());

        return sharedSrc$.pipe(
            buffer(
                sharedSrc$.pipe(
                    debounceTime(500),
                    switchMap(() => bufferIsLocked$),
                    filter(isLocked=> !isLocked)
                )
            ),
            filter(items=>items.length > 0),
            tap(() => bufferIsLocked$.next(true)),
            concatMap( items =>  project(items)),
            tap(() => bufferIsLocked$.next(false))
        );
    };
}
