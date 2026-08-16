# Architecture and product decisions

[Русский](DECISIONS.ru.md) | English

## Architecture

- The plugin is distributed as standalone IIFE bundles and does not import code from the Jitsi build.
- Integration uses the Jitsi global objects `window.APP`, `APP.store`, `APP.API`, and `APP.conference`.
- The button is first added to the global `config.customToolbarButtons` array and later synchronized with `features/base/config` through `OVERWRITE_CONFIG`. Jitsi loads `config.js` asynchronously and can replace the global object after a standalone script has executed. Existing custom buttons are retained.
- The plugin wraps `APP.API.notifyToolbarButtonClicked` and always invokes the original method.
- Source code is divided into small TypeScript modules, while esbuild produces one IIFE per distribution variant.
- A regular build produces a readable `dist/jitsi-meet-pip.js` and a minified `dist/jitsi-meet-pip.min.js`. Both contain the same code, public API, and embedded MIT notice.

## Participants and media

- The first card in the lower grid is the local user. Remaining positions are assigned to real remote participants.
- The remote dominant speaker has first priority, followed by `activeSpeakers` or `speakersList` in Jitsi order. Remaining positions are filled with other remote participants in join order so a quiet conference does not produce an empty PiP window.
- The configured maximum is clamped to four cards.
- The lower grid always contains two or four positions. An odd number of real cards is completed with a non-media placeholder excluded from the public participant list.
- Content is split into two equal-height sections: a permanent screen-share slot above and the participant grid below.
- Four cards form a `2×2` grid. Two cards use one row and fill the lower section vertically.
- Without an active desktop track, the screen-share slot displays only a screen icon. Starting or stopping a share changes only the slot contents, not the window layout.
- Empty participant positions display only a participant icon. Empty-state text remains available through `aria-label`.
- Document PiP requests an initial portrait size of `320×640` with `preferInitialWindowPlacement: true`, preventing Chrome 130+ from restoring an old user-selected size.
- Each lower card, including the local card, uses an unmuted camera video track. Shared video is not used.
- An active desktop or screen track is displayed in the large upper tile. Remote and local tracks are supported; selection follows the Jitsi large stage and `remoteScreenShares` ordering.
- A local share reuses the existing Jitsi desktop track and never starts another `getDisplayMedia` capture or connection.
- PiP videos are muted. Conference audio remains in the main document.
- Missing camera video is replaced by an avatar or initials.
- Microphone and camera icons follow the current Jitsi state. Muted states use crossed-out SVG icons and update `title` and `aria-label` with the available action.
- The bottom row shows the number of real conference participants, including the local user, and the length of `features/lobby.knockingParticipants`. Both values use the same Redux subscription as the tiles and are exposed through `getState().participantCounts`.
- PiP labels are independent of Jitsi i18n. Standalone configuration covers the toolbar, window title, controls, tiles, empty states, and counters. Whitespace-only values fall back to built-in Russian labels; the default title is `PiP`.
- Auto PiP diagnostic toasts are internal plugin messages rather than window labels.

## Browsers

- Document PiP is the preferred mode and contains the custom HTML interface.
- Video PiP is the fallback and displays the active screen share or one dominant speaker.
- Auto PiP is not emulated from `visibilitychange`, because opening without browser-approved activation is rejected. The plugin uses Media Session `enterpictureinpicture`.
- The `contentoccluded` reason represents automatic tab occlusion; `useraction` represents a request from Chrome media UI. Both `enterPictureInPictureReason` and `reason` are accepted for compatibility.
- The plugin registers Media Session after `APP.store` appears and again when a live local camera or microphone track becomes available. It also synchronizes `setMicrophoneActive` and `setCameraActive` when supported.
- If the browser does not send an Auto PiP event, a one-time diagnostic about active capture or site permission is displayed after returning to Jitsi.
- `JitsiBrowserPiP.getState().autoPiP` exposes readiness diagnostics without attempting to read or bypass browser permission.
- Protocol eligibility is checked separately. Chromium rejects Auto PiP on every `http://` origin, including loopback, before invoking Media Session, so the plugin explicitly requires HTTPS instead of suggesting another permission request.
- Automatically opened PiP closes when the user returns to Jitsi; manually opened PiP remains open.
- Manually closing an automatically opened window suppresses subsequent Auto PiP for the current conference instance. Programmatic close-on-return is not treated as a refusal, and manual opening remains available.
- Document PiP does not run in an iframe. The plugin reports the limitation without attempting to bypass browser security.

## Security and operations

- Participant names are inserted with `textContent`, never dynamic HTML.
- Destroying the plugin restores the wrapped API method, removes subscriptions, and detaches media tracks.
- Deployment, publication, pushing, or mutation of external servers is outside normal plugin operation.

## License

- Source code, documentation, and both standalone bundles are licensed under the MIT License. The copyright holder is `Dmitry Karasev <articks@gmail.com>`.
- Copies and substantial portions must retain `Copyright (c) 2026 Dmitry Karasev <articks@gmail.com>` and the MIT License text.
- The build script embeds the complete `LICENSE` text in a legal comment in every distribution bundle.
- The plugin does not redistribute Jitsi Meet and is not presented as an official Jitsi component.
