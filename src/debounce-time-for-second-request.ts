import { merge, Observable } from 'rxjs';
import { debounceTime, first, skip, switchMap } from 'rxjs/operators';

/**
 * Отправляет первый запрос сразу, а все последующие — только после
 * паузы `dueTime` мс с момента последнего события (debounce).
 *
 * Полезно для поиска: первый ввод обрабатываем мгновенно,
 * дальнейшие нажатия клавиш не спамят сервер.
 */
export function debounceTimeForSecondRequest<TValue, O extends Observable<any>>(
    src: Observable<TValue>,
    project: (value: TValue, index: number) => O,
    dueTime: number
): Observable<O> {
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
