import {Observable, of, throwError} from 'rxjs';
import {delay, mergeMap, retryWhen} from 'rxjs/operators';

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BACKOFF = 1000;

type RetryCallback = () => void;

export function retryWithBackoff<T>(url: string, delayMs: number, maxRetry = DEFAULT_MAX_RETRIES, backoffMs = DEFAULT_BACKOFF, callback: RetryCallback = null) {
    let retries = maxRetry;

    return (src: Observable<T>) =>
        src.pipe(
            retryWhen((errors: Observable<any>) => errors.pipe(
                mergeMap(error => {
                        const statusCode = (error.status ?? error.StatusCode);
                        if (statusCode !== 0 && (statusCode < 500 || statusCode > 600)) {
                            return throwError(error);
                        }

                        if (!!callback && retries === maxRetry)
                            callback();

                        retries--;
                        if (retries > 0) {
                            const backoffTime = delayMs + (maxRetry - retries - 1) * backoffMs;
                            console.warn(`Повтор запроса ${url} через ${backoffTime} мс...", "Осталось попыток: ${retries} Код ошибки: ${error.status}`, error);
                            return of(error).pipe(delay(backoffTime));
                        }
                        return throwError(error);
                    }
                ))));
}
