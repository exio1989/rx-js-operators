# rx-js-operators

Коллекция кастомных RxJS-операторов для нестандартных случаев, которых нет в стандартной библиотеке.

## Установка и запуск

```bash
npm install
npm test          # запуск тестов
npm run typecheck # проверка типов
```

## Операторы

### `bufferedConcatMap(project, dueTime?)`

Накапливает события в буфер и, после паузы `dueTime` мс без новых событий, обрабатывает их **последовательно** (без параллелизма) через `project`. Пока идёт обработка одной пачки, новые события копятся в следующую — backpressure без потери данных.

```ts
import { bufferedConcatMap } from 'rx-js-operators';

const saveBatch = (items: string[]) => http.post('/bulk', items);

source$.pipe(
    bufferedConcatMap(saveBatch, 500)
);
```

### `debounceTimeForSecondRequest(src, project, dueTime)`

Первый запрос отправляет сразу, а все последующие — только после паузы `dueTime` мс с момента последнего события. Удобно для поиска: первый ввод уходит мгновенно, дальнейшие нажатия не спамят сервер.

```ts
import { debounceTimeForSecondRequest } from 'rx-js-operators';

debounceTimeForSecondRequest(searchInput$, (query) => http.get(`/search?q=${query}`), 300);
```

### `retryWithBackoff(config)`

Повторяет запрос при сетевых ошибках (`status 0`) и серверных ошибках 5xx с линейным backoff: `delay = delayMs + (attempt - 1) * backoffMs`. Ошибки 4xx пробрасываются сразу.

```ts
import { retryWithBackoff } from 'rx-js-operators';

http.get('/api/data').pipe(
    retryWithBackoff({
        maxRetries: 5,
        delayMs: 1000,
        backoffMs: 1000,
        onRetry: (error, attempt) => console.warn(`retry #${attempt}`, error),
    })
);
```

Параметры `RetryWithBackoffConfig`:

| Поле        | Тип                       | По умолчанию | Описание                                  |
|-------------|---------------------------|--------------|-------------------------------------------|
| `maxRetries`| `number`                  | `5`          | Максимальное число повторов               |
| `delayMs`   | `number`                  | `1000`       | Базовая задержка перед первым повтором    |
| `backoffMs` | `number`                  | `1000`       | Прирост задержки на каждый следующий повтор|
| `onRetry`   | `(error, attempt) => void`| —            | Колбэк перед каждым повтором              |
| `retryable` | `(error) => boolean`      | 5xx + сетевые| Предикат «стоит ли ретраить»              |

## Требования

- Node.js 16+
- RxJS 7

## Лицензия

MIT
