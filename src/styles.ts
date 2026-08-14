export const DOCUMENT_PIP_STYLES = `
:root {
    color-scheme: dark;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #111827;
    color: #f9fafb;
}
* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
body { background: #111827; }
.jmp-root { display: grid; grid-template-rows: 1fr auto; width: 100%; height: 100%; min-width: 260px; }
.jmp-content { display: grid; grid-template-rows: minmax(0, 1fr); min-height: 0; background: #030712; }
.jmp-content.has-screen-share { grid-template-rows: repeat(2, minmax(0, 1fr)); }
.jmp-screen-share { position: relative; min-width: 0; min-height: 0; margin: 4px 4px 0; overflow: hidden; border: 1px solid #374151; border-radius: 8px; background: #090d16; }
.jmp-screen-share[hidden] { display: none; }
.jmp-screen-share-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #090d16; }
.jmp-screen-share-label { position: absolute; left: 10px; bottom: 9px; max-width: calc(100% - 20px); overflow: hidden; padding: 4px 8px; border-radius: 5px; background: rgba(3, 7, 18, .78); font-size: 12px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.jmp-screen-share.is-empty { border-style: dashed; background: linear-gradient(145deg, #151f2e, #090d16); }
.jmp-screen-share.is-empty .jmp-screen-share-label { inset: 0; display: grid; place-items: center; max-width: none; padding: 24px; background: transparent; color: #9ca3af; }
.jmp-screen-share.is-empty .jmp-screen-share-label svg { width: clamp(54px, 20vw, 76px); height: clamp(54px, 20vw, 76px); fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.jmp-grid { display: grid; place-items: center; align-content: center; gap: 4px; min-height: 0; padding: 4px; background: #030712; }
.jmp-grid[data-count="1"] { grid-template-columns: 1fr; }
.jmp-grid[data-count="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: minmax(0, 1fr); }
.jmp-grid[data-count="3"], .jmp-grid[data-count="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }
.jmp-tile { position: relative; width: 100%; height: 100%; max-width: 100%; max-height: 100%; min-width: 0; min-height: 0; overflow: hidden; border-radius: 8px; background: #1f2937; }
.jmp-grid[data-count="2"] .jmp-tile { height: 100%; }
.jmp-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; background: #111827; }
.jmp-tile.is-local .jmp-video { transform: scaleX(-1); }
.jmp-avatar { position: absolute; inset: 0; display: grid; place-items: center; background: linear-gradient(145deg, #263b55, #111827); }
.jmp-avatar-circle { display: grid; place-items: center; width: min(40%, 104px); aspect-ratio: 1; border-radius: 50%; background: #315d8c; font-size: clamp(22px, 9vw, 42px); font-weight: 700; color: white; overflow: hidden; }
.jmp-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
.jmp-name { position: absolute; left: 8px; right: 8px; bottom: 7px; overflow: hidden; padding: 3px 7px; border-radius: 5px; background: rgba(3, 7, 18, .72); font-size: 12px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.jmp-placeholder { display: grid; place-content: center; justify-items: center; border: 1px dashed #4b5563; background: linear-gradient(145deg, #182131, #111827); color: #9ca3af; }
.jmp-placeholder-icon { display: grid; place-items: center; width: clamp(38px, 8vw, 58px); aspect-ratio: 1; border: 1px solid #4b5563; border-radius: 50%; background: #1f2937; color: #cbd5e1; font-size: clamp(24px, 5vw, 36px); font-weight: 300; line-height: 1; }
.jmp-placeholder-icon svg { width: 62%; height: 62%; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.jmp-controls { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 10px; background: #111827; border-top: 1px solid #374151; }
.jmp-control { display: grid; place-items: center; width: 38px; height: 38px; padding: 0; border: 0; border-radius: 50%; background: #374151; color: #fff; cursor: pointer; }
.jmp-control:hover { background: #4b5563; }
.jmp-control:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
.jmp-control svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.jmp-control.is-muted { background: #f3f4f6; color: #111827; }
.jmp-control.is-danger { margin-left: 6px; background: #dc2626; }
.jmp-control.is-danger:hover { background: #b91c1c; }
@media (max-height: 220px) {
    .jmp-content.has-screen-share { grid-template-rows: minmax(0, 1fr); }
    .jmp-content.has-screen-share .jmp-grid { display: none; }
    .jmp-controls { padding: 5px; }
    .jmp-control { width: 32px; height: 32px; }
}
`;

export const ICONS = {
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 10l4.5-2.5v9L15 14z"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>',
    cameraMuted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 10l4.5-2.5v9L15 14z"/><rect x="3" y="6" width="12" height="12" rx="2"/><path class="jmp-icon-slash" d="M3 3l18 18"/></svg>',
    hangup: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15c4.2-3.2 9.8-3.2 14 0"/><path d="M5 15l-2 3M19 15l2 3"/></svg>',
    microphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>',
    microphoneMuted: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 10.8 5.9M12 18v3M9 21h6"/><path class="jmp-icon-slash" d="M3 3l18 18"/></svg>',
    participantPlaceholder: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></svg>',
    return: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l-5 5 5 5M4 12h10a6 6 0 0 1 6 6"/></svg>',
    screenSharePlaceholder: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
} as const;
