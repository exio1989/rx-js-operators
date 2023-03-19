import {merge, Observable} from 'rxjs';
import {debounceTime, first, skip, switchMap} from 'rxjs/operators';
import {CommonFunctions} from '../common-functions';

export function debounceTimeForSecondRequest<TValue, O extends Observable<any>>(src: Observable<TValue>, project: (value: TValue, index: number) => O, dueTime: number) {
    return merge(
        src.pipe(
            first(),
            switchMap(project)
        ),
        src.pipe(
            skip(1),
            debounceTime(dueTime),
            switchMap(project)
        )
    );
}
