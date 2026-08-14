# Совместимость

## Jitsi Meet

Целевая версия: `2.0.11146`, tag `stable/jitsi-meet_11146`, commit `48d96e4`.

Проверяемые контракты:

- `index.html` подключает `plugin.head.html` после `app.bundle.min.js`.
- `app.js` публикует `window.APP` с `API` и `conference`.
- `BaseApp` публикует Redux store как `APP.store`.
- `customToolbarButtons` автоматически включаются в список кнопок toolbar.
- Redux обрабатывает `OVERWRITE_CONFIG` и пересчитывает custom toolbar buttons после поздней синхронизации плагина.
- Нажатие custom button вызывает `APP.API.notifyToolbarButtonClicked`.
- Redux содержит `features/base/participants`, `features/base/tracks`, `features/large-video` и `features/video-layout`; адаптер понимает активных участников, локальный desktop track и виртуальные remote screen-share participants.

Это внутренние интерфейсы Jitsi. После обновления необходимо запустить `npm run test:contract`, browser smoke-test и интеграционный тест `test/jitsi/`.

## Браузеры

| Возможность | Chrome/Edge | Firefox с Document PiP | Safari |
| --- | --- | --- | --- |
| Несколько участников | Да | При наличии API | Нет |
| Большая демонстрация + 4 участника | Да | При наличии Document PiP | Нет, только демонстрация |
| Собственные кнопки | Да | При наличии API | Нет, системные |
| Ручное открытие | Да | При наличии API | Да |
| Auto PiP | Chrome/Edge 120+, HTTPS, активный захват и разрешение сайта | Feature detection | Не гарантируется |
| Video PiP fallback | Да | Feature detection | Да |

Точные возможности определяются feature detection, а не User-Agent.

## Ограничения

- Требуется top-level страница Jitsi; Document PiP запрещён из iframe.
- Ручной Document PiP доступен в secure context, включая локальные HTTP loopback origins.
- Auto PiP Chromium имеет отдельную более строгую проверку и принимает только `https://` или `file://`; `http://localhost` и `http://127.0.0.1` не подходят.
- Политика браузера или Permissions Policy может полностью запретить PiP.
- Если стандартный Video PiP не получил ни camera track, ни `canvas.captureStream`, fallback временно недоступен.
- При демонстрации самой вкладки Jitsi в PiP может возникать ожидаемый эффект рекурсивного «зеркала».
- Верхняя и нижняя секции занимают по половине доступной высоты над панелью управления. Четыре карточки используют сетку `2×2`, две — один ряд на всю высоту нижней секции.
- Принудительный возврат к начальному размеру `320×640` через `preferInitialWindowPlacement` поддерживается Chrome 130+; более старый Chromium может восстановить ранее выбранный пользователем размер.
- Нативный запрос Auto PiP контролируется Chromium. Плагин не может принудительно показать его из `visibilitychange`.
- Для Auto PiP Chrome требует одновременно живой `getUserMedia` capture, зарегистрированный Media Session handler и разрешение «Автоматическая картинка в картинке». Ручное открытие плагина от capture не зависит.
