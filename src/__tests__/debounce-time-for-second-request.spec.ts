import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { debounceTimeForSecondRequest } from '../debounce-time-for-second-request';

describe('debounceTimeForSecondRequest', () => {
    let scheduler: TestScheduler;

    beforeEach(() => {
        scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    });

    it('отправляет первый запрос сразу, последующие — с debounce', () => {
        scheduler.run(({ cold, expectObservable }) => {
            const source = cold<number>('a-b-c--|', { a: 1, b: 2, c: 3 });
            const project = (value: number) => of(`P(${value})`);

            const result$ = debounceTimeForSecondRequest(source, project, 4);

            expectObservable(result$).toBe('a------(c|)', {
                a: 'P(1)',
                c: 'P(3)',
            });
        });
    });

    it('без повторных значений отдаёт только первый элемент', () => {
        scheduler.run(({ cold, expectObservable }) => {
            const source = cold<number>('a--|', { a: 42 });
            const project = (value: number) => of(value * 2);

            const result$ = debounceTimeForSecondRequest(source, project, 4);

            expectObservable(result$).toBe('a--|', { a: 84 });
        });
    });
});
