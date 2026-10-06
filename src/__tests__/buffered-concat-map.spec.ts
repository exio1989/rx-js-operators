import { Observable, of, Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { bufferedConcatMap } from '../buffered-concat-map';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('bufferedConcatMap', () => {
    let scheduler: TestScheduler;

    beforeEach(() => {
        scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    });

    it('накапливает значения и отдаёт их одним массивом после паузы', () => {
        scheduler.run(({ cold, expectObservable }) => {
            const source = cold<string>('a-b---|', { a: 'x', b: 'y' });

            const result$ = source.pipe(bufferedConcatMap((items) => of(items), 3));

            expectObservable(result$).toBe('-----a|', { a: ['x', 'y'] });
        });
    });

    it('обрабатывает пачки последовательно, не параллеля их', async () => {
        const results: string[][] = [];
        let releaseProject: (() => void) | undefined;

        const project = (items: string[]) =>
            new Observable<string[]>((observer) => {
                results.push([...items]);
                releaseProject = () => {
                    observer.next(items);
                    observer.complete();
                };
            });

        const source$ = new Subject<string>();
        source$.pipe(bufferedConcatMap(project, 20)).subscribe();

        source$.next('a');
        source$.next('b');
        await sleep(40);
        expect(results).toEqual([['a', 'b']]);

        source$.next('c');
        await sleep(40);
        expect(results.length).toBe(1);

        releaseProject!();
        await sleep(40);
        expect(results).toEqual([['a', 'b'], ['c']]);
    });
});
