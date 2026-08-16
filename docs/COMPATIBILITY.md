# Compatibility

[Русский](COMPATIBILITY.ru.md) | English

## Jitsi Meet

Target version: `2.0.11146`, tag `stable/jitsi-meet_11146`, commit `48d96e4`.

Verified contracts:

- `index.html` includes `plugin.head.html` after `app.bundle.min.js`.
- `app.js` exposes `window.APP` with `API` and `conference`.
- `BaseApp` exposes the Redux store as `APP.store`.
- `customToolbarButtons` are automatically included in the toolbar button list.
- Redux handles `OVERWRITE_CONFIG` and recalculates custom toolbar buttons after the plugin's late synchronization.
- Clicking a custom button invokes `APP.API.notifyToolbarButtonClicked`.
- Redux exposes `features/base/participants`, `features/base/tracks`, `features/large-video`, `features/video-layout`, and `features/lobby.knockingParticipants`. The adapter understands active participants, the local desktop track, virtual remote screen-share participants, and the lobby queue.

These are internal Jitsi interfaces. After upgrading Jitsi, run `npm run test:contract`, the browser smoke test, and the `test/jitsi/` integration test.

## Browsers

| Capability | Chrome/Edge | Firefox with Document PiP | Safari |
| --- | --- | --- | --- |
| Multiple participants | Yes | When the API is available | No |
| Large screen share plus four participants | Yes | With Document PiP | No, screen share only |
| Custom controls | Yes | When the API is available | No, system controls |
| Manual opening | Yes | When the API is available | Yes |
| Auto PiP | Chrome/Edge 120+, HTTPS, active capture, and site permission | Feature detection | Not guaranteed |
| Video PiP fallback | Yes | Feature detection | Yes |

Capabilities are selected through feature detection rather than User-Agent matching.

Standalone-window labels do not follow the current Jitsi language. Configure them explicitly through `config.browserPip`; built-in defaults are Russian, and the default title is `PiP`.

## Limitations

- Jitsi must run as a top-level page; Document PiP is unavailable inside an iframe.
- Manual Document PiP requires a secure context, including trusted local HTTP loopback origins.
- Chromium Auto PiP applies stricter protocol checks and accepts only `https://` or `file://`; `http://localhost` and `http://127.0.0.1` are not eligible.
- Browser policy or Permissions Policy can disable PiP completely.
- If standard Video PiP has neither a camera track nor `canvas.captureStream`, the fallback is temporarily unavailable.
- Sharing the Jitsi tab itself can produce an expected recursive mirror effect.
- The top and bottom sections each occupy half of the content height above the controls. Four cards use a `2×2` grid; two cards use one row filling the lower section.
- The lobby count is limited to the `knockingParticipants` data Jitsi exposes to the current user; moderators normally receive the complete list.
- `preferInitialWindowPlacement` can force the initial `320×640` size only in Chrome 130+. Older Chromium versions may restore a user-selected size.
- Chromium controls the native Auto PiP request. The plugin cannot force it from `visibilitychange`.
- Chrome Auto PiP requires an active `getUserMedia` capture, a registered Media Session handler, and Automatic Picture-in-Picture site permission. Manual opening does not depend on capture.
