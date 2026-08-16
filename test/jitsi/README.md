# Local Jitsi with Browser PiP

[Русский](README.ru.md) | English

This stack uses the official `stable-11146-1` Docker images and the adjacent `jitsi-meet-docker/docker-compose.yml` file without modifying it.

## Start

From the `jitsi-meet-pip` root:

```bash
cp test/jitsi/.env.example test/jitsi/.env
# Replace CONFIG and PIP_PROJECT_DIR in test/jitsi/.env with absolute paths for this checkout.

bash test/jitsi/generate-local-cert.sh

docker compose \
  --project-name jitsi-meet-pip-local \
  --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml \
  -f test/jitsi/override.yml \
  up -d web prosody jicofo jvb
```

The certificate script creates a dedicated local CA and a certificate with SAN entries for `localhost` and `127.0.0.1`. Files remain under the ignored `test/jitsi/config/` directory and are not uploaded anywhere.

To make Chrome treat the origin as secure, open `test/jitsi/config/local-ca/ca.crt` in Keychain Access, add it to the login keychain, set the certificate to Always Trust, and fully restart Chrome.

Open `https://127.0.0.1:18443/`, create a room, and join it from another browser or private window. The Picture-in-Picture button appears in the toolbar after joining.

The stack uses relative BOSH and disables XMPP WebSocket. `http://127.0.0.1:18000/` remains available for manual PiP, but Chromium intentionally rejects Auto PiP for every `http://` origin, including loopback.

## Auto PiP verification

1. Use a regular desktop Chrome or Edge window, not Incognito or InPrivate.
2. Confirm the address begins with `https://127.0.0.1:18443/` and Chrome reports no certificate error.
3. Join a room, enable at least the microphone or camera, and grant capture permission.
4. Switch to another tab. On the first eligible attempt, Chromium displays its native Automatic Picture-in-Picture permission prompt.
5. If no prompt appears, return to Jitsi. The plugin displays a diagnostic for the missing condition.
6. Permission can be enabled manually through the site controls next to the address bar: Automatic Picture-in-Picture → Allow.

After updating the plugin, fully reload the room. The test page loads `jitsi-meet-pip.min.js?v=1.2.10`, because Jitsi Nginx caches files under `/libs/` for one year.

Inspect readiness in the page console:

```js
JitsiBrowserPiP.version
JitsiBrowserPiP.getState().autoPiP
```

Before switching tabs, expect `version === "1.2.10"`, `protocolEligible === true`, `secureContext === true`, `handlerRegistered === true`, `captureActive === true`, and `ready === true`.

## PiP 1.2.10 window verification

1. Fully reload the room and confirm `JitsiBrowserPiP.version === "1.2.10"`.
2. Open PiP and confirm your card is first. With the camera disabled, the card must show your name and initials.
3. With one or three real cards, confirm the unused position contains only a participant icon; the final grid must contain two or four positions.
4. Share another window, the whole screen, or a tab, locally or remotely. The share must appear in the upper half above the participant grid.
5. Inspect `JitsiBrowserPiP.getState().screenShare`; a local share must report `local === true`.
6. Stop sharing. The track must detach, and the upper slot must return to the unlabeled screen icon without changing the outer layout.
7. Confirm four cards form a `2×2` grid and two cards form one row filling the lower section vertically.
8. Chrome 130+ should open near `320×640`; the browser may constrain the size to available screen space. Older Chromium versions may restore a user-selected size.
9. Toggle microphone and camera from both Jitsi and PiP. Enabled states must use regular icons and muted states crossed-out icons.
10. Verify the bottom `Participants: N · In lobby: M` row using English `config.browserPip` labels. Values must change without reopening PiP when participants join or leave and lobby users appear or are admitted.
11. Change several label fields in `plugin.head.html`, fully reload the room, and verify the toolbar, PiP title, control tooltips, share label, and counters. The complete field list is in the root [README](../../README.md).

Sharing the Jitsi tab itself produces an expected recursive mirror effect.

## Status and logs

```bash
docker compose --project-name jitsi-meet-pip-local --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml -f test/jitsi/override.yml ps

docker compose --project-name jitsi-meet-pip-local --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml -f test/jitsi/override.yml logs --tail=100
```

## Stop

```bash
docker compose --project-name jitsi-meet-pip-local --env-file test/jitsi/.env \
  -f ../jitsi-meet-docker/docker-compose.yml -f test/jitsi/override.yml down
```

All published TCP ports and JVB UDP bind only to `127.0.0.1`. Configuration and data remain under `test/jitsi/config/`.

If the local CA is no longer needed, remove “Jitsi Meet PiP Local Development CA” through Keychain Access, then delete the ignored `test/jitsi/config/local-ca/` directory.
