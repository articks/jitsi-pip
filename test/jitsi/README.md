# Локальный Jitsi с Browser PiP

Стек использует официальные Docker-образы `stable-11146-1` и существующий соседний compose-файл `jitsi-meet-docker/docker-compose.yml`, не изменяя его.

## Запуск

Из корня `jitsi-meet-pip`:

```bash
cp test/jitsi/.env.example test/jitsi/.env
# Замените CONFIG и PIP_PROJECT_DIR в test/jitsi/.env на абсолютные пути текущего checkout.

bash test/jitsi/generate-local-cert.sh

docker compose \
  --project-name jitsi-meet-pip-local \
  --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml \
  -f test/jitsi/override.yml \
  up -d web prosody jicofo jvb
```

Скрипт создаёт отдельный локальный CA и сертификат с SAN для `localhost` и
`127.0.0.1`. Файлы находятся только в игнорируемом каталоге
`test/jitsi/config/` и никуда не отправляются.

Чтобы Chrome признал HTTPS защищённым, откройте файл
`test/jitsi/config/local-ca/ca.crt` в Keychain Access, добавьте его в связку
ключей входа и установите для сертификата «Доверять всегда». Затем полностью
перезапустите Chrome.

Откройте `https://127.0.0.1:18443/`, создайте комнату и подключите второй
браузер или приватное окно. Кнопка «Картинка в картинке» появится в toolbar
после входа в комнату.

Стек использует относительный BOSH и отключает XMPP WebSocket. HTTP-порт
`http://127.0.0.1:18000/` также остаётся доступен для ручного PiP, но Chromium
намеренно запрещает Auto PiP для любой схемы `http://`, включая loopback.

## Проверка Auto PiP

1. Используйте обычное окно desktop Chrome/Edge, не инкогнито.
2. Убедитесь, что адрес начинается с `https://127.0.0.1:18443/` и Chrome не показывает ошибку сертификата.
3. Войдите в комнату, включите хотя бы микрофон или камеру и разрешите доступ.
4. Переключитесь на другую вкладку. При первом подходящем запуске Chromium показывает нативный запрос Automatic Picture-in-Picture.
5. Если запроса нет, вернитесь в Jitsi: плагин покажет подсказку о конкретном неподходящем условии.
6. Разрешение можно включить вручную: значок сведений о сайте возле адресной строки → «Автоматическая картинка в картинке» → «Разрешить».

После обновления плагина полностью перезагрузите комнату. Текущая тестовая сборка
подключается как `jitsi-meet-pip.min.js?v=1.1.4`, потому что Nginx Jitsi кеширует
файлы `/libs/` на один год.

В консоли страницы можно проверить готовность:

```js
JitsiBrowserPiP.version
JitsiBrowserPiP.getState().autoPiP
```

Перед переключением вкладки ожидаются `version === "1.1.4"`,
`protocolEligible === true`, `secureContext === true`,
`handlerRegistered === true`, `captureActive === true` и `ready === true`.

## Состояние и логи

```bash
docker compose --project-name jitsi-meet-pip-local --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml -f test/jitsi/override.yml ps

docker compose --project-name jitsi-meet-pip-local --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml -f test/jitsi/override.yml logs --tail=100
```

## Остановка

```bash
docker compose --project-name jitsi-meet-pip-local --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml -f test/jitsi/override.yml down
```

Все опубликованные TCP-порты и JVB UDP привязаны только к `127.0.0.1`. Конфигурация и данные находятся в `test/jitsi/config/`.

Если локальный CA больше не нужен, удалите сертификат
«Jitsi Meet PiP Local Development CA» через Keychain Access, а затем удалите
игнорируемый каталог `test/jitsi/config/local-ca/`.
