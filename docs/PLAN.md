# Development plan

[Русский](PLAN.ru.md) | English

## Goal

Create a standalone plugin for Jitsi Meet 2.0.11146 that is installed as JavaScript without modifying or rebuilding Jitsi.

## Completed milestones

1. ✅ Create an isolated TypeScript project and documentation.
2. ✅ Implement adapters for `window.APP`, Redux, participants, and Jitsi video tracks.
3. ✅ Register a custom toolbar button and public API.
4. ✅ Implement Document Picture-in-Picture with up to four active participants.
5. ✅ Implement a one-participant Video Picture-in-Picture fallback.
6. ✅ Add Media Session Auto PiP and microphone, camera, return, and hangup controls.
7. ✅ Add unit, contract, and local Docker tests.
8. ✅ Build and validate a standalone minified bundle.
9. ✅ Run isolated Jitsi `stable-11146-1` in local Docker and verify the toolbar, BOSH, and multi-participant conferencing.
10. ✅ Implement native Chromium Auto PiP event reasons, capture state, and user diagnostics.
11. ✅ Re-register Auto PiP when local capture starts and expose readiness diagnostics.
12. ✅ Add a quiet-conference fallback that fills cards with connected remote participants.
13. ✅ Correct HTTP permission diagnostics, add protocol eligibility, and provide local HTTPS testing.
14. ✅ Suppress additional Auto PiP openings after the user manually closes the automatic window during a session.
15. ✅ Add a large active screen-share tile, including local desktop tracks.
16. ✅ Pin the local user to the first participant card and retain up to three active remote participants.
17. ✅ Normalize the grid to two or four positions with placeholders.
18. ✅ Establish responsive participant card proportions.
19. ✅ Reduce and then refine the initial Document PiP dimensions.
20. ✅ Keep a permanent screen-share slot above a participant grid.
21. ✅ Let two participant cards fill the height of the lower section.
22. ✅ Adopt the portrait `320×640` layout with equal screen-share and participant sections.
23. ✅ Replace visible empty-state text with accessible screen and participant icons.
24. ✅ Synchronize microphone and camera icons with their enabled and muted states.
25. ✅ Add dynamic conference and lobby participant counters.
26. ✅ Finalize the Russian counter label as `Участников: N · В лобби: M`.
27. ✅ Expose all PiP UI labels through `config.browserPip`.
28. ✅ Publish the project under the MIT License with authorship, contribution rules, package metadata, and a complete embedded license notice.
29. ✅ Add a complete English documentation set as the repository default, retain Russian `.ru.md` translations, and publish the readable `dist/jitsi-meet-pip.js` bundle alongside the minified build; release `1.2.10`.
30. ✅ Match the PiP hangup control to the current Jitsi toolbar SVG at runtime and refresh the local cache key; build `1.2.11`.
31. ✅ Replace runtime hangup-icon cloning with the plugin's own filled SVG and refresh the local cache key; build `1.2.12`.

## Completion criteria

- The plugin has no runtime dependencies and does not require rebuilding Jitsi.
- Existing Jitsi custom toolbar buttons are retained.
- Document PiP displays a large active share, the local participant, and up to three active remote participants in a two- or four-position lower grid.
- The bottom row updates conference and lobby participant counts dynamically.
- Speaker changes do not duplicate audio or leak attached tracks.
- Manual and automatic opening differ correctly when returning to Jitsi.
- Both readable and minified distribution bundles pass standalone checks.
- All checks run locally, and project-owned files stay inside `jitsi-meet-pip`.
