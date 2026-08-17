/*!
 * Jitsi Meet Browser PiP v1.2.13
 * https://github.com/articks/jitsi-pip
 *
 * MIT License
 *
 * Copyright (c) 2026 Dmitry Karasev <articks@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
"use strict";
(() => {
  // src/config.ts
  var BUTTON_ID = "browser-pip";
  var TOOLBAR_ICON = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Crect x=%223%22 y=%224%22 width=%2218%22 height=%2216%22 rx=%222%22/%3E%3Crect x=%2212%22 y=%2211%22 width=%227%22 height=%226%22 rx=%221%22 fill=%22white%22 stroke=%22white%22/%3E%3C/svg%3E";
  var DEFAULT_CONFIG = {
    autoOpen: true,
    buttonText: "\u041A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0432 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0435",
    cameraLabel: "\u041A\u0430\u043C\u0435\u0440\u0430",
    closeAutoOnReturn: true,
    disableCameraLabel: "\u0412\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043A\u0430\u043C\u0435\u0440\u0443",
    disableMicrophoneLabel: "\u0412\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D",
    enabled: true,
    enableCameraLabel: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043A\u0430\u043C\u0435\u0440\u0443",
    enableMicrophoneLabel: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D",
    hangupLabel: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0437\u0432\u043E\u043D\u043E\u043A",
    includeLocalScreenShare: true,
    lobbyLabel: "\u0412 \u043B\u043E\u0431\u0431\u0438",
    maxParticipants: 4,
    microphoneLabel: "\u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D",
    noActiveSpeakerLabel: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A\u0430",
    noScreenShareLabel: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0434\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u0438",
    participantLabel: "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A",
    participantsLabel: "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432",
    returnToConferenceLabel: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u0432 \u043A\u043E\u043D\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044E",
    screenShareLabel: "\u0414\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u044F",
    showScreenShare: true,
    waitingParticipantLabel: "\u041E\u0436\u0438\u0434\u0430\u0435\u043C \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430",
    windowTitle: "PiP",
    youLabel: "\u0412\u044B"
  };
  function normalizeLabel(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }
  function clampParticipants(value) {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_CONFIG.maxParticipants;
    }
    return Math.min(4, Math.max(1, Math.trunc(parsed)));
  }
  function normalizeConfig(config) {
    return {
      autoOpen: config?.autoOpen ?? DEFAULT_CONFIG.autoOpen,
      buttonText: normalizeLabel(config?.buttonText, DEFAULT_CONFIG.buttonText),
      cameraLabel: normalizeLabel(config?.cameraLabel, DEFAULT_CONFIG.cameraLabel),
      closeAutoOnReturn: config?.closeAutoOnReturn ?? DEFAULT_CONFIG.closeAutoOnReturn,
      disableCameraLabel: normalizeLabel(config?.disableCameraLabel, DEFAULT_CONFIG.disableCameraLabel),
      disableMicrophoneLabel: normalizeLabel(config?.disableMicrophoneLabel, DEFAULT_CONFIG.disableMicrophoneLabel),
      enabled: config?.enabled ?? DEFAULT_CONFIG.enabled,
      enableCameraLabel: normalizeLabel(config?.enableCameraLabel, DEFAULT_CONFIG.enableCameraLabel),
      enableMicrophoneLabel: normalizeLabel(config?.enableMicrophoneLabel, DEFAULT_CONFIG.enableMicrophoneLabel),
      hangupLabel: normalizeLabel(config?.hangupLabel, DEFAULT_CONFIG.hangupLabel),
      includeLocalScreenShare: config?.includeLocalScreenShare ?? DEFAULT_CONFIG.includeLocalScreenShare,
      lobbyLabel: normalizeLabel(config?.lobbyLabel, DEFAULT_CONFIG.lobbyLabel),
      maxParticipants: clampParticipants(config?.maxParticipants),
      microphoneLabel: normalizeLabel(config?.microphoneLabel, DEFAULT_CONFIG.microphoneLabel),
      noActiveSpeakerLabel: normalizeLabel(config?.noActiveSpeakerLabel, DEFAULT_CONFIG.noActiveSpeakerLabel),
      noScreenShareLabel: normalizeLabel(config?.noScreenShareLabel, DEFAULT_CONFIG.noScreenShareLabel),
      participantLabel: normalizeLabel(config?.participantLabel, DEFAULT_CONFIG.participantLabel),
      participantsLabel: normalizeLabel(config?.participantsLabel, DEFAULT_CONFIG.participantsLabel),
      returnToConferenceLabel: normalizeLabel(config?.returnToConferenceLabel, DEFAULT_CONFIG.returnToConferenceLabel),
      screenShareLabel: normalizeLabel(config?.screenShareLabel, DEFAULT_CONFIG.screenShareLabel),
      showScreenShare: config?.showScreenShare ?? DEFAULT_CONFIG.showScreenShare,
      waitingParticipantLabel: normalizeLabel(config?.waitingParticipantLabel, DEFAULT_CONFIG.waitingParticipantLabel),
      windowTitle: normalizeLabel(config?.windowTitle, DEFAULT_CONFIG.windowTitle),
      youLabel: normalizeLabel(config?.youLabel, DEFAULT_CONFIG.youLabel)
    };
  }
  function prepareJitsiConfig(host) {
    const root = host.config ?? {};
    const normalized = normalizeConfig(root.browserPip);
    host.config = root;
    root.browserPip = normalized;
    if (!normalized.enabled) {
      return normalized;
    }
    const buttons = Array.isArray(root.customToolbarButtons) ? [...root.customToolbarButtons] : [];
    if (!buttons.some((button) => button.id === BUTTON_ID)) {
      buttons.push({
        icon: TOOLBAR_ICON,
        id: BUTTON_ID,
        text: normalized.buttonText
      });
    }
    root.customToolbarButtons = buttons;
    return normalized;
  }

  // src/participants.ts
  function getRemoteParticipant(remote, id) {
    if (remote instanceof Map) {
      return remote.get(id);
    }
    return remote?.[id];
  }
  function getRemoteParticipants(remote) {
    if (remote instanceof Map) {
      return remote.values();
    }
    return Object.values(remote ?? {});
  }
  function isRealRemoteParticipant(participant) {
    return Boolean(participant && !participant.local && !participant.fakeParticipant);
  }
  function selectParticipantCounts(state) {
    const participants = state["features/base/participants"];
    let conference = participants?.local ? 1 : 0;
    for (const participant of getRemoteParticipants(participants?.remote)) {
      if (isRealRemoteParticipant(participant)) {
        conference += 1;
      }
    }
    const knockingParticipants = state["features/lobby"]?.knockingParticipants;
    return {
      conference,
      lobby: Array.isArray(knockingParticipants) ? knockingParticipants.length : 0
    };
  }
  function participantName(participant, fallback = "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A") {
    return participant.displayName?.trim() || participant.name?.trim() || fallback;
  }
  function participantInitials(participant, fallback = "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A") {
    const words = participantName(participant, fallback).split(/\s+/u).filter(Boolean);
    return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.slice(0, 2) || "U").toLocaleUpperCase();
  }
  function participantAvatar(participant) {
    return participant.loadableAvatarUrl || participant.avatarURL;
  }
  function selectActiveParticipants(state, limit) {
    const participants = state["features/base/participants"];
    if (!participants?.remote) {
      return [];
    }
    const ids = [];
    const add = (id) => {
      if (!id || ids.includes(id)) {
        return;
      }
      const participant = getRemoteParticipant(participants.remote, id);
      if (isRealRemoteParticipant(participant)) {
        ids.push(id);
      }
    };
    add(participants.dominantSpeaker);
    const active = participants.activeSpeakers || (participants.speakersList instanceof Map ? participants.speakersList.keys() : participants.speakersList?.map(([id]) => id));
    if (active) {
      for (const id of active) {
        add(id);
      }
    }
    for (const participant of getRemoteParticipants(participants.remote)) {
      if (isRealRemoteParticipant(participant)) {
        add(participant.id);
      }
    }
    return ids.slice(0, Math.min(4, Math.max(1, limit))).map((id) => getRemoteParticipant(participants.remote, id)).filter(isRealRemoteParticipant);
  }
  function selectCameraTrack(state, participantId) {
    const tracks = state["features/base/tracks"];
    if (!Array.isArray(tracks)) {
      return void 0;
    }
    const candidates = tracks.filter((track) => {
      const type = track.videoType || track.jitsiTrack?.getVideoType?.();
      const muted = track.muted ?? track.jitsiTrack?.isMuted?.();
      return track.participantId === participantId && track.mediaType === "video" && type !== "desktop" && type !== "screen" && !track.local && !muted && Boolean(track.jitsiTrack);
    });
    return candidates.find((track) => (track.videoType || track.jitsiTrack?.getVideoType?.()) === "camera")?.jitsiTrack || candidates[0]?.jitsiTrack;
  }
  function selectLocalCameraTrack(state) {
    const tracks = state["features/base/tracks"];
    if (!Array.isArray(tracks)) {
      return void 0;
    }
    const candidates = tracks.filter((track) => {
      const type = track.videoType || track.jitsiTrack?.getVideoType?.();
      const muted = track.muted ?? track.jitsiTrack?.isMuted?.();
      return track.local && track.mediaType === "video" && type !== "desktop" && type !== "screen" && !muted && Boolean(track.jitsiTrack);
    });
    return candidates.find((track) => (track.videoType || track.jitsiTrack?.getVideoType?.()) === "camera")?.jitsiTrack || candidates[0]?.jitsiTrack;
  }
  function selectParticipantsWithTracks(state, limit) {
    const normalizedLimit = Math.min(4, Math.max(1, limit));
    const local = state["features/base/participants"]?.local;
    const selected = [];
    if (local) {
      selected.push({
        participant: local,
        track: selectLocalCameraTrack(state)
      });
    }
    const remoteLimit = normalizedLimit - selected.length;
    if (remoteLimit > 0) {
      selected.push(...selectActiveParticipants(state, remoteLimit).map((participant) => ({
        participant,
        track: selectCameraTrack(state, participant.id)
      })));
    }
    return selected.slice(0, normalizedLimit);
  }
  function isScreenShareTrack(track) {
    const type = track.videoType || track.jitsiTrack?.getVideoType?.();
    return track.mediaType === "screenshare" || (track.mediaType === "video" || track.jitsiTrack?.getType?.() === "video") && (type === "desktop" || type === "screen");
  }
  function selectScreenShare(state, includeLocal = true, labels = {}) {
    const tracks = state["features/base/tracks"];
    if (!Array.isArray(tracks)) {
      return void 0;
    }
    const candidates = tracks.filter((track2) => {
      const muted = track2.muted ?? track2.jitsiTrack?.isMuted?.() ?? false;
      return Boolean(track2.jitsiTrack) && isScreenShareTrack(track2) && !muted && (includeLocal || !track2.local);
    });
    if (!candidates.length) {
      return void 0;
    }
    const participants = state["features/base/participants"];
    const latestRemoteShares = state["features/video-layout"]?.remoteScreenShares ?? [];
    const preferredIds = [
      state["features/large-video"]?.participantId,
      ...[...latestRemoteShares].reverse(),
      includeLocal ? participants?.localScreenShare?.id : void 0
    ].filter((id) => Boolean(id));
    const matchesId = (track2, id) => track2.participantId === id || track2.jitsiTrack?.getSourceName?.() === id;
    let selected;
    for (const id of preferredIds) {
      selected = candidates.find((track2) => matchesId(track2, id));
      if (selected) {
        break;
      }
    }
    selected ??= candidates[candidates.length - 1];
    const track = selected.jitsiTrack;
    const sourceName = track.getSourceName?.();
    const virtualParticipant = sourceName ? getRemoteParticipant(participants?.remote, sourceName) : void 0;
    const owner = selected.local ? participants?.local : getRemoteParticipant(participants?.remote, selected.participantId ?? "");
    const displayParticipant = virtualParticipant || owner;
    const local = Boolean(selected.local);
    const participantLabel = labels.participantLabel?.trim() || "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A";
    const screenShareLabel = labels.screenShareLabel?.trim() || "\u0414\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u044F";
    const youLabel = labels.youLabel?.trim() || "\u0412\u044B";
    return {
      id: sourceName || selected.participantId || (local ? "local-screen-share" : "screen-share"),
      label: local ? `${screenShareLabel} \u2014 ${youLabel}` : `${screenShareLabel} \u2014 ${displayParticipant ? participantName(displayParticipant, participantLabel) : participantLabel}`,
      local,
      track
    };
  }

  // src/styles.ts
  var DOCUMENT_PIP_STYLES = `
:root {
    color-scheme: dark;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #111827;
    color: #f9fafb;
}
* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
body { background: #111827; }
.jmp-root { display: grid; grid-template-rows: 1fr auto auto; width: 100%; height: 100%; min-width: 220px; }
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
.jmp-control svg.jmp-icon-fill { fill: currentColor; stroke: none; }
.jmp-control.is-muted { background: #f3f4f6; color: #111827; }
.jmp-control.is-danger { margin-left: 6px; background: #dc2626; }
.jmp-control.is-danger:hover { background: #b91c1c; }
.jmp-participant-counts { min-height: 29px; overflow: hidden; padding: 6px 10px 7px; border-top: 1px solid #374151; background: #0f172a; color: #cbd5e1; font-size: 11px; line-height: 15px; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.jmp-participant-counts strong { color: #fff; font-weight: 700; }
@media (max-height: 220px) {
    .jmp-content.has-screen-share { grid-template-rows: minmax(0, 1fr); }
    .jmp-content.has-screen-share .jmp-grid { display: none; }
    .jmp-controls { padding: 5px; }
    .jmp-control { width: 32px; height: 32px; }
}
`;
  var ICONS = {
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 10l4.5-2.5v9L15 14z"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>',
    cameraMuted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 10l4.5-2.5v9L15 14z"/><rect x="3" y="6" width="12" height="12" rx="2"/><path class="jmp-icon-slash" d="M3 3l18 18"/></svg>',
    hangup: '<svg class="jmp-icon-fill jmp-icon-hangup" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 16.8c-.7 0-1.2-.5-1.3-1.2l-.4-2.7c-.1-.8.3-1.5 1-1.9 5.7-3.3 13.5-3.3 19.2 0 .7.4 1.1 1.1 1 1.9l-.4 2.7c-.1.7-.7 1.2-1.4 1.2h-3.2c-.7 0-1.3-.5-1.4-1.2l-.3-2.1c-2.5-.8-5.3-.8-7.8 0l-.3 2.1c-.1.7-.7 1.2-1.4 1.2H3.4z"/></svg>',
    microphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>',
    microphoneMuted: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 10.8 5.9M12 18v3M9 21h6"/><path class="jmp-icon-slash" d="M3 3l18 18"/></svg>',
    participantPlaceholder: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/></svg>',
    return: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7l-5 5 5 5M4 12h10a6 6 0 0 1 6 6"/></svg>',
    screenSharePlaceholder: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
  };

  // src/plugin.ts
  var PLUGIN_VERSION = "1.2.13";
  function isAutoPiPProtocolEligible(protocol) {
    return protocol === "https:" || protocol === "file:";
  }
  var CONNECT_TIMEOUT_MS = 3e4;
  var CONNECT_RETRY_MS = 50;
  var JitsiMeetPiPPlugin = class {
    constructor(host, config) {
      this.host = host;
      this.config = config;
    }
    api;
    apiHadOwnNotify = false;
    apiOriginalNotify;
    automatic = false;
    connectDeadline = 0;
    connectTimer;
    controlButtons = /* @__PURE__ */ new Map();
    destroyed = false;
    documentContent;
    documentGrid;
    documentParticipantCounts;
    documentWindow;
    fallbackAttachedTrack;
    fallbackCanvas;
    fallbackCanvasKey;
    fallbackCanvasStream;
    fallbackVideo;
    autoPiPEventReceived = false;
    autoPiPHandlerRegistered = false;
    autoPiPHintShown = false;
    autoPiPLastError;
    autoPiPLastReason;
    autoPiPOpenFailed = false;
    autoPiPSuppressedByUser = false;
    closingFallbackProgrammatically = false;
    hiddenSinceLastAutoPiP = false;
    localCaptureActive = false;
    mediaSessionActions = /* @__PURE__ */ new Set();
    pending = false;
    pendingAutomatic = false;
    participantCounts = { conference: 0, lobby: 0 };
    screenShare;
    screenShareElements;
    selected = [];
    store;
    storeUnsubscribe;
    toolbarSyncing = false;
    tiles = /* @__PURE__ */ new Map();
    toast;
    toastTimer;
    waitingForBody = false;
    onBodyReady = () => {
      this.waitingForBody = false;
      this.ensureFallbackVideo();
      this.handleStoreChange();
    };
    onVisibilityChange = () => {
      if (this.host.document.visibilityState !== "visible") {
        if (this.config.autoOpen && !this.autoPiPSuppressedByUser) {
          this.hiddenSinceLastAutoPiP = true;
          this.autoPiPEventReceived = false;
          this.autoPiPOpenFailed = false;
        }
        return;
      }
      if (this.config.closeAutoOnReturn && this.automatic) {
        void this.close();
      }
      if (this.config.autoOpen && !this.autoPiPSuppressedByUser && this.hiddenSinceLastAutoPiP && (!this.autoPiPEventReceived || this.autoPiPOpenFailed) && !this.autoPiPHintShown && !this.getState().open) {
        this.autoPiPHintShown = true;
        this.showMessage(this.autoPiPOpenFailed ? "Chrome \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B Auto PiP. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \xAB\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0432 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0435\xBB \u0434\u043B\u044F \u0441\u0430\u0439\u0442\u0430." : !isAutoPiPProtocolEligible(this.host.location.protocol) ? "Chrome Auto PiP \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043F\u043E HTTP, \u0434\u0430\u0436\u0435 \u043D\u0430 127.0.0.1. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 Jitsi \u043F\u043E HTTPS; \u0440\u0443\u0447\u043D\u043E\u0439 PiP \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D." : this.host.isSecureContext !== true ? "Auto PiP \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0437\u0430\u0449\u0438\u0449\u0451\u043D\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 HTTPS \u0438\u043B\u0438 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 127.0.0.1/localhost." : !this.autoPiPHandlerRegistered ? "\u042D\u0442\u043E\u0442 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043B \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A Auto PiP. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 desktop Chrome \u0438\u043B\u0438 Edge." : this.hasActiveLocalCapture() ? "Chrome \u043D\u0435 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u043B Auto PiP. \u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \xAB\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0443 \u0432 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0435\xBB \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0441\u0430\u0439\u0442\u0430." : "\u0414\u043B\u044F Auto PiP \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u043A\u0430\u043C\u0435\u0440\u0443 \u0438\u043B\u0438 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D \u0438 \u0440\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0443.");
      }
      this.hiddenSinceLastAutoPiP = false;
    };
    start() {
      if (this.destroyed || !this.config.enabled) {
        return;
      }
      this.host.document.addEventListener("visibilitychange", this.onVisibilityChange);
      this.installMediaSessionHandlers();
      this.connectDeadline = Date.now() + CONNECT_TIMEOUT_MS;
      this.connectToJitsi();
    }
    getPublicApi() {
      return {
        close: () => this.close(),
        destroy: () => this.destroy(),
        getState: () => this.getState(),
        open: () => this.open(),
        version: PLUGIN_VERSION
      };
    }
    open() {
      return this.openInternal(false);
    }
    close() {
      this.pending = false;
      if (this.documentWindow) {
        const pipWindow = this.documentWindow;
        this.cleanupDocumentWindow();
        try {
          pipWindow.close();
        } catch (error) {
          this.log("warn", "Unable to close Document PiP window", error);
        }
      }
      const documentWithPiP = this.host.document;
      if (this.fallbackVideo && documentWithPiP.pictureInPictureElement === this.fallbackVideo && documentWithPiP.exitPictureInPicture) {
        this.closingFallbackProgrammatically = true;
        return documentWithPiP.exitPictureInPicture().catch((error) => this.log("warn", "Unable to exit Video PiP", error)).then(() => {
          this.automatic = false;
          this.closingFallbackProgrammatically = false;
        });
      }
      this.automatic = false;
      return Promise.resolve();
    }
    destroy() {
      if (this.destroyed) {
        return;
      }
      this.destroyed = true;
      void this.close();
      if (this.connectTimer !== void 0) {
        this.host.clearTimeout(this.connectTimer);
        this.connectTimer = void 0;
      }
      this.storeUnsubscribe?.();
      this.storeUnsubscribe = void 0;
      this.store = void 0;
      if (this.api) {
        if (this.apiHadOwnNotify) {
          this.api.notifyToolbarButtonClicked = this.apiOriginalNotify;
        } else {
          delete this.api.notifyToolbarButtonClicked;
        }
      }
      this.host.document.removeEventListener("visibilitychange", this.onVisibilityChange);
      if (this.waitingForBody) {
        this.host.document.removeEventListener("DOMContentLoaded", this.onBodyReady);
        this.waitingForBody = false;
      }
      this.cleanupMediaSessionHandlers();
      this.detachFallbackTrack();
      this.fallbackCanvasStream?.getTracks().forEach((track) => track.stop());
      this.fallbackCanvasStream = void 0;
      this.fallbackCanvas = void 0;
      this.fallbackVideo?.remove();
      this.fallbackVideo = void 0;
      if (this.toastTimer !== void 0) {
        this.host.clearTimeout(this.toastTimer);
      }
      this.toast?.remove();
      this.toast = void 0;
      this.participantCounts = { conference: 0, lobby: 0 };
      this.screenShare = void 0;
      this.selected = [];
    }
    getState() {
      const documentWithPiP = this.host.document;
      return {
        autoPiP: {
          captureActive: this.localCaptureActive,
          eventReceived: this.autoPiPEventReceived,
          handlerRegistered: this.autoPiPHandlerRegistered,
          lastError: this.autoPiPLastError,
          lastReason: this.autoPiPLastReason,
          protocolEligible: isAutoPiPProtocolEligible(this.host.location.protocol),
          ready: this.config.autoOpen && !this.autoPiPSuppressedByUser && this.localCaptureActive && this.autoPiPHandlerRegistered && isAutoPiPProtocolEligible(this.host.location.protocol) && this.host.isSecureContext === true,
          secureContext: this.host.isSecureContext === true,
          suppressedByUser: this.autoPiPSuppressedByUser
        },
        automatic: this.automatic,
        destroyed: this.destroyed,
        mode: this.getSupportedMode(),
        open: Boolean(this.documentWindow || this.fallbackVideo && documentWithPiP.pictureInPictureElement === this.fallbackVideo),
        participantCounts: { ...this.participantCounts },
        participants: this.selected.map(({ participant }) => participant.id),
        pending: this.pending,
        screenShare: this.screenShare ? {
          id: this.screenShare.id,
          label: this.screenShare.label,
          local: this.screenShare.local
        } : void 0
      };
    }
    connectToJitsi() {
      if (this.destroyed) {
        return;
      }
      const app = this.host.APP;
      if (!this.api && app?.API) {
        this.installToolbarHandler(app.API);
      }
      if (!this.store && app?.store) {
        this.store = app.store;
        this.storeUnsubscribe = this.store.subscribe(() => this.handleStoreChange());
        this.installMediaSessionHandlers();
        this.ensureFallbackVideo();
        this.handleStoreChange();
      }
      if (this.api && this.store) {
        return;
      }
      if (Date.now() >= this.connectDeadline) {
        this.log("error", "Jitsi APP.store/API were not available within 30 seconds");
        return;
      }
      this.connectTimer = this.host.setTimeout(() => this.connectToJitsi(), CONNECT_RETRY_MS);
    }
    installToolbarHandler(api) {
      this.api = api;
      this.apiHadOwnNotify = Object.prototype.hasOwnProperty.call(api, "notifyToolbarButtonClicked");
      this.apiOriginalNotify = api.notifyToolbarButtonClicked;
      const plugin = this;
      const original = this.apiOriginalNotify;
      api.notifyToolbarButtonClicked = function notifyToolbarButtonClicked(key, preventExecution) {
        if (key === BUTTON_ID) {
          void plugin.openInternal(false);
        }
        return original?.call(this, key, preventExecution);
      };
    }
    installMediaSessionHandlers() {
      const mediaSession = this.host.navigator.mediaSession;
      if (!mediaSession?.setActionHandler) {
        return;
      }
      this.installAutoPiPHandler(mediaSession);
      const handlers = {
        hangup: () => this.hangup(),
        togglecamera: () => this.toggleVideo(),
        togglemicrophone: () => this.toggleAudio()
      };
      for (const [action, handler] of Object.entries(handlers)) {
        try {
          mediaSession.setActionHandler(action, handler);
          this.mediaSessionActions.add(action);
        } catch {
        }
      }
    }
    installAutoPiPHandler(mediaSession) {
      const currentMediaSession = mediaSession ?? this.host.navigator.mediaSession;
      if (!currentMediaSession?.setActionHandler) {
        this.autoPiPHandlerRegistered = false;
        this.autoPiPLastError = "Media Session API \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D";
        return;
      }
      try {
        currentMediaSession.setActionHandler(
          "enterpictureinpicture",
          (details) => this.handleMediaSessionPiP(details)
        );
        this.mediaSessionActions.add("enterpictureinpicture");
        this.autoPiPHandlerRegistered = true;
        this.autoPiPLastError = void 0;
      } catch (error) {
        this.autoPiPHandlerRegistered = false;
        this.autoPiPLastError = this.formatError(error);
        this.log("warn", "Automatic Picture-in-Picture action is unavailable", error);
      }
    }
    cleanupMediaSessionHandlers() {
      const mediaSession = this.host.navigator.mediaSession;
      if (!mediaSession?.setActionHandler) {
        return;
      }
      for (const action of this.mediaSessionActions) {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {
        }
      }
      this.mediaSessionActions.clear();
      this.autoPiPHandlerRegistered = false;
    }
    handleMediaSessionPiP(details) {
      const reason = details?.enterPictureInPictureReason ?? details?.reason;
      const automatic = reason === "contentoccluded" || !reason && this.host.document.visibilityState !== "visible";
      this.autoPiPLastReason = reason ?? "unspecified";
      this.autoPiPLastError = void 0;
      if (automatic) {
        this.hiddenSinceLastAutoPiP = true;
        this.autoPiPEventReceived = true;
        this.autoPiPOpenFailed = false;
      }
      if (automatic && (!this.config.autoOpen || this.autoPiPSuppressedByUser)) {
        return;
      }
      void this.openInternal(automatic).then((opened) => {
        if (!automatic || opened) {
          return;
        }
        this.autoPiPOpenFailed = true;
        if (this.host.document.visibilityState === "visible" && !this.autoPiPHintShown) {
          this.autoPiPHintShown = true;
          this.showMessage("Chrome \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B Auto PiP. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \xAB\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0432 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0435\xBB \u0434\u043B\u044F \u0441\u0430\u0439\u0442\u0430.");
        }
      });
    }
    openInternal(automatic) {
      if (this.destroyed || !this.config.enabled || automatic && (!this.config.autoOpen || this.autoPiPSuppressedByUser)) {
        return Promise.resolve(false);
      }
      if (this.documentWindow && !this.documentWindow.closed) {
        return Promise.resolve(true);
      }
      const documentWithPiP = this.host.document;
      if (this.fallbackVideo && documentWithPiP.pictureInPictureElement === this.fallbackVideo) {
        return Promise.resolve(true);
      }
      if (this.pending) {
        return Promise.resolve(false);
      }
      const canUseDocumentPiP = this.isTopLevel() && typeof this.host.documentPictureInPicture?.requestWindow === "function";
      if (canUseDocumentPiP) {
        return this.openDocumentPiP(automatic);
      }
      if (this.supportsVideoPiP()) {
        return this.openVideoPiP(automatic);
      }
      if (!automatic) {
        this.showMessage(this.isTopLevel() ? "\u042D\u0442\u043E\u0442 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 Picture-in-Picture." : "Picture-in-Picture \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D: Jitsi \u043E\u0442\u043A\u0440\u044B\u0442 \u0432\u043D\u0443\u0442\u0440\u0438 iframe.");
      }
      return Promise.resolve(false);
    }
    openDocumentPiP(automatic) {
      const controller = this.host.documentPictureInPicture;
      if (!controller) {
        return Promise.resolve(false);
      }
      this.pending = true;
      this.pendingAutomatic = automatic;
      let request;
      try {
        request = controller.requestWindow({
          height: 480,
          preferInitialWindowPlacement: true,
          width: 240
        });
      } catch (error) {
        this.pending = false;
        this.handleOpenError(error, automatic);
        return Promise.resolve(false);
      }
      return request.then((pipWindow) => {
        this.pending = false;
        if (this.destroyed) {
          pipWindow.close();
          return false;
        }
        this.automatic = this.pendingAutomatic;
        this.documentWindow = pipWindow;
        this.setupDocumentWindow(pipWindow);
        this.updateDocumentScreenShare();
        this.updateDocumentParticipants();
        this.updateControlState();
        pipWindow.addEventListener("pagehide", () => {
          if (this.documentWindow === pipWindow) {
            if (this.automatic) {
              this.suppressAutoPiPForSession();
            }
            this.cleanupDocumentWindow();
          }
        }, { once: true });
        return true;
      }).catch((error) => {
        this.pending = false;
        this.handleOpenError(error, automatic);
        return false;
      });
    }
    openVideoPiP(automatic) {
      this.ensureFallbackVideo();
      const video = this.fallbackVideo;
      if (!video?.requestPictureInPicture) {
        return Promise.resolve(false);
      }
      if (video.readyState < 1) {
        if (!automatic) {
          this.showMessage("\u0412\u0438\u0434\u0435\u043E \u0434\u043B\u044F Picture-in-Picture \u0435\u0449\u0451 \u043F\u043E\u0434\u0433\u043E\u0442\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.");
        }
        return Promise.resolve(false);
      }
      this.pending = true;
      this.pendingAutomatic = automatic;
      let request;
      try {
        request = video.requestPictureInPicture();
      } catch (error) {
        this.pending = false;
        this.handleOpenError(error, automatic);
        return Promise.resolve(false);
      }
      return request.then(() => {
        this.pending = false;
        this.automatic = this.pendingAutomatic;
        return true;
      }).catch((error) => {
        this.pending = false;
        this.handleOpenError(error, automatic);
        return false;
      });
    }
    setupDocumentWindow(pipWindow) {
      const document = pipWindow.document;
      document.title = this.config.windowTitle;
      document.documentElement.lang = this.host.document.documentElement.lang || "ru";
      document.body.replaceChildren();
      const style = document.createElement("style");
      style.textContent = DOCUMENT_PIP_STYLES;
      document.head.appendChild(style);
      const root = document.createElement("div");
      const content = document.createElement("div");
      const screenShareRoot = document.createElement("div");
      const screenShareVideo = document.createElement("video");
      const screenShareLabel = document.createElement("div");
      const grid = document.createElement("div");
      const controls = document.createElement("div");
      const participantCounts = document.createElement("div");
      const conferenceCount = document.createElement("strong");
      const lobbyCount = document.createElement("strong");
      root.className = "jmp-root";
      content.className = "jmp-content has-screen-share";
      screenShareRoot.className = "jmp-screen-share is-empty";
      screenShareVideo.className = "jmp-screen-share-video";
      screenShareVideo.autoplay = true;
      screenShareVideo.hidden = true;
      screenShareVideo.muted = true;
      screenShareVideo.playsInline = true;
      screenShareLabel.className = "jmp-screen-share-label";
      screenShareLabel.innerHTML = ICONS.screenSharePlaceholder;
      screenShareRoot.setAttribute("aria-label", this.config.noScreenShareLabel);
      grid.className = "jmp-grid";
      controls.className = "jmp-controls";
      participantCounts.className = "jmp-participant-counts";
      participantCounts.setAttribute("aria-live", "polite");
      participantCounts.append(
        `${this.config.participantsLabel}: `,
        conferenceCount,
        ` \xB7 ${this.config.lobbyLabel}: `,
        lobbyCount
      );
      controls.append(
        this.createControl(document, "audio", this.config.microphoneLabel, ICONS.microphone, () => this.toggleAudio()),
        this.createControl(document, "video", this.config.cameraLabel, ICONS.camera, () => this.toggleVideo()),
        this.createControl(document, "return", this.config.returnToConferenceLabel, ICONS.return, () => {
          try {
            this.host.focus();
          } catch {
          }
          void this.close();
        }),
        this.createControl(
          document,
          "hangup",
          this.config.hangupLabel,
          ICONS.hangup,
          () => this.hangup(),
          true
        )
      );
      screenShareRoot.append(screenShareVideo, screenShareLabel);
      content.append(screenShareRoot, grid);
      root.append(content, controls, participantCounts);
      document.body.append(root);
      this.documentContent = content;
      this.documentGrid = grid;
      this.documentParticipantCounts = {
        conference: conferenceCount,
        lobby: lobbyCount
      };
      this.screenShareElements = {
        label: screenShareLabel,
        root: screenShareRoot,
        video: screenShareVideo
      };
      this.updateParticipantCountSummary();
    }
    createControl(document, action, label, icon, handler, danger = false) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `jmp-control${danger ? " is-danger" : ""}`;
      button.title = label;
      button.setAttribute("aria-label", label);
      button.innerHTML = icon;
      button.addEventListener("click", handler);
      this.controlButtons.set(action, button);
      return button;
    }
    handleStoreChange() {
      if (this.destroyed || !this.store) {
        return;
      }
      try {
        const state = this.store.getState();
        this.ensureToolbarButtonInStore();
        this.syncMediaSessionCaptureState();
        this.participantCounts = selectParticipantCounts(state);
        this.screenShare = this.config.showScreenShare ? selectScreenShare(state, this.config.includeLocalScreenShare, this.config) : void 0;
        this.selected = selectParticipantsWithTracks(
          state,
          this.config.maxParticipants
        );
        this.updateFallbackVideo();
        this.updateDocumentScreenShare();
        this.updateDocumentParticipants();
        this.updateParticipantCountSummary();
        this.updateControlState();
      } catch (error) {
        this.log("warn", "Unable to process Jitsi state update", error);
      }
    }
    getLocalCaptureState() {
      const tracks = this.store?.getState()["features/base/tracks"];
      let audioActive = false;
      let captureActive = false;
      let videoActive = false;
      if (!Array.isArray(tracks)) {
        return { audioActive, captureActive, videoActive };
      }
      for (const trackState of tracks) {
        const jitsiTrack = trackState.jitsiTrack;
        if (!trackState.local || !jitsiTrack || trackState.mediaType !== "audio" && trackState.mediaType !== "video") {
          continue;
        }
        const mediaTrack = jitsiTrack.getTrack?.();
        if (mediaTrack?.readyState === "ended") {
          continue;
        }
        captureActive = true;
        const muted = trackState.muted ?? jitsiTrack.isMuted?.() ?? false;
        if (trackState.mediaType === "audio") {
          audioActive ||= !muted;
        } else {
          videoActive ||= !muted;
        }
      }
      return { audioActive, captureActive, videoActive };
    }
    hasActiveLocalCapture() {
      return this.getLocalCaptureState().captureActive;
    }
    syncMediaSessionCaptureState() {
      const mediaSession = this.host.navigator.mediaSession;
      if (!mediaSession) {
        return;
      }
      const { audioActive, captureActive, videoActive } = this.getLocalCaptureState();
      const captureStarted = captureActive && !this.localCaptureActive;
      this.localCaptureActive = captureActive;
      if (captureStarted) {
        this.installAutoPiPHandler(mediaSession);
      }
      try {
        mediaSession.setMicrophoneActive?.(audioActive);
        mediaSession.setCameraActive?.(videoActive);
      } catch (error) {
        this.log("warn", "Unable to update Media Session capture state", error);
      }
    }
    /**
     * Jitsi loads config.js asynchronously and can replace window.config after
     * this standalone script has added its custom button. Synchronize the
     * button with Redux once APP.store exists, without replacing buttons added
     * by the deployment.
     */
    ensureToolbarButtonInStore() {
      const store = this.store;
      if (!store?.dispatch || this.toolbarSyncing) {
        return;
      }
      const state = store.getState();
      const currentConfig = state["features/base/config"];
      const currentButtons = currentConfig && typeof currentConfig === "object" && Array.isArray(currentConfig.customToolbarButtons) ? currentConfig.customToolbarButtons : [];
      if (currentButtons.some((button) => button.id === BUTTON_ID)) {
        return;
      }
      const customToolbarButtons = [
        ...currentButtons,
        {
          icon: TOOLBAR_ICON,
          id: BUTTON_ID,
          text: this.config.buttonText
        }
      ];
      this.toolbarSyncing = true;
      try {
        store.dispatch({
          config: { customToolbarButtons },
          type: "OVERWRITE_CONFIG"
        });
        if (this.host.config) {
          this.host.config.customToolbarButtons = customToolbarButtons;
        }
      } finally {
        this.toolbarSyncing = false;
      }
    }
    updateDocumentParticipants() {
      const grid = this.documentGrid;
      if (!grid || !this.documentWindow) {
        return;
      }
      const selectedIds = new Set(this.selected.map(({ participant }) => participant.id));
      for (const [id, tile] of this.tiles) {
        if (!selectedIds.has(id)) {
          this.detachTileTrack(tile);
          tile.root.remove();
          this.tiles.delete(id);
        }
      }
      grid.querySelectorAll(".jmp-placeholder, .jmp-empty").forEach((element) => element.remove());
      for (const item of this.selected) {
        let tile = this.tiles.get(item.participant.id);
        if (!tile) {
          tile = this.createTile(this.documentWindow.document, item.participant);
          this.tiles.set(item.participant.id, tile);
        }
        this.updateTile(tile, item);
        const expectedAtPosition = grid.children.item(this.selected.indexOf(item));
        if (expectedAtPosition !== tile.root) {
          grid.insertBefore(tile.root, expectedAtPosition);
        }
      }
      const visibleCount = this.selected.length > 2 ? 4 : 2;
      const placeholderCount = visibleCount - this.selected.length;
      for (let index = 0; index < placeholderCount; index += 1) {
        grid.appendChild(this.createParticipantPlaceholder(this.documentWindow.document));
      }
      grid.dataset.count = String(visibleCount);
    }
    createParticipantPlaceholder(document) {
      const root = document.createElement("div");
      const icon = document.createElement("div");
      root.className = "jmp-tile jmp-placeholder";
      root.setAttribute("aria-label", this.config.waitingParticipantLabel);
      icon.className = "jmp-placeholder-icon";
      icon.innerHTML = ICONS.participantPlaceholder;
      root.append(icon);
      return root;
    }
    updateDocumentScreenShare() {
      const elements = this.screenShareElements;
      const content = this.documentContent;
      if (!elements || !content) {
        return;
      }
      const selected = this.screenShare;
      if (!selected) {
        this.detachScreenShareTrack(elements);
        elements.root.hidden = false;
        elements.root.classList.add("is-empty");
        elements.root.setAttribute("aria-label", this.config.noScreenShareLabel);
        elements.video.hidden = true;
        elements.label.innerHTML = ICONS.screenSharePlaceholder;
        elements.label.removeAttribute("title");
        content.classList.add("has-screen-share");
        return;
      }
      if (elements.attachedTrack !== selected.track) {
        this.detachScreenShareTrack(elements);
        try {
          selected.track.attach(elements.video);
          elements.attachedTrack = selected.track;
          this.playVideo(elements.video);
        } catch (error) {
          this.log("warn", `Unable to attach screen share track ${selected.id}`, error);
        }
      }
      elements.label.textContent = selected.label;
      elements.label.title = selected.label;
      elements.root.setAttribute("aria-label", selected.label);
      elements.root.hidden = false;
      elements.root.classList.remove("is-empty");
      elements.video.hidden = false;
      content.classList.add("has-screen-share");
    }
    detachScreenShareTrack(elements) {
      if (elements.attachedTrack) {
        try {
          elements.attachedTrack.detach?.(elements.video);
        } catch (error) {
          this.log("warn", "Unable to detach screen share track", error);
        }
        elements.attachedTrack = void 0;
      }
      elements.video.srcObject = null;
    }
    createTile(document, participant) {
      const root = document.createElement("div");
      const video = document.createElement("video");
      const avatar = document.createElement("div");
      const avatarCircle = document.createElement("div");
      const name = document.createElement("div");
      root.className = "jmp-tile";
      root.classList.toggle("is-local", Boolean(participant.local));
      video.className = "jmp-video";
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      avatar.className = "jmp-avatar";
      avatarCircle.className = "jmp-avatar-circle";
      name.className = "jmp-name";
      avatar.appendChild(avatarCircle);
      root.append(avatar, video, name);
      return {
        avatar,
        avatarCircle,
        name,
        participantId: participant.id,
        root,
        video
      };
    }
    updateTile(tile, item) {
      const { participant, track } = item;
      const name = participantName(participant, this.config.participantLabel);
      tile.name.textContent = name;
      tile.name.title = name;
      if (tile.attachedTrack !== track) {
        this.detachTileTrack(tile);
        if (track) {
          try {
            track.attach(tile.video);
            tile.attachedTrack = track;
            this.playVideo(tile.video);
          } catch (error) {
            this.log("warn", `Unable to attach track for ${participant.id}`, error);
          }
        }
      }
      const hasVideo = Boolean(tile.attachedTrack);
      tile.video.hidden = !hasVideo;
      tile.avatar.hidden = hasVideo;
      if (!hasVideo) {
        this.renderTileAvatar(tile, participant);
      }
    }
    renderTileAvatar(tile, participant) {
      const url = participantAvatar(participant);
      const initials = participantInitials(participant, this.config.participantLabel);
      if (tile.avatarUrl === url && tile.avatarInitials === initials) {
        return;
      }
      tile.avatarCircle.replaceChildren();
      tile.avatarImage = void 0;
      tile.avatarInitials = initials;
      tile.avatarUrl = url;
      tile.avatarCircle.textContent = initials;
      if (!url) {
        return;
      }
      const image = tile.root.ownerDocument.createElement("img");
      image.alt = "";
      image.src = url;
      image.addEventListener("load", () => {
        tile.avatarCircle.replaceChildren(image);
        tile.avatarImage = image;
      }, { once: true });
      image.addEventListener("error", () => image.remove(), { once: true });
    }
    detachTileTrack(tile) {
      if (tile.attachedTrack) {
        try {
          tile.attachedTrack.detach?.(tile.video);
        } catch (error) {
          this.log("warn", `Unable to detach track for ${tile.participantId}`, error);
        }
        tile.attachedTrack = void 0;
      }
      tile.video.srcObject = null;
    }
    cleanupDocumentWindow() {
      if (this.screenShareElements) {
        this.detachScreenShareTrack(this.screenShareElements);
      }
      for (const tile of this.tiles.values()) {
        this.detachTileTrack(tile);
      }
      this.tiles.clear();
      this.controlButtons.clear();
      this.documentContent = void 0;
      this.documentGrid = void 0;
      this.documentParticipantCounts = void 0;
      this.documentWindow = void 0;
      this.screenShareElements = void 0;
      this.automatic = false;
    }
    updateParticipantCountSummary() {
      const elements = this.documentParticipantCounts;
      if (!elements) {
        return;
      }
      elements.conference.textContent = String(this.participantCounts.conference);
      elements.lobby.textContent = String(this.participantCounts.lobby);
    }
    ensureFallbackVideo() {
      if (this.fallbackVideo || this.destroyed) {
        return;
      }
      if (!this.host.document.body) {
        if (!this.waitingForBody) {
          this.waitingForBody = true;
          this.host.document.addEventListener("DOMContentLoaded", this.onBodyReady, { once: true });
        }
        return;
      }
      const video = this.host.document.createElement("video");
      video.id = "jitsi-meet-pip-fallback-video";
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      Object.assign(video.style, {
        height: "2px",
        left: "-10px",
        opacity: "0.001",
        pointerEvents: "none",
        position: "fixed",
        top: "-10px",
        width: "2px"
      });
      video.addEventListener("enterpictureinpicture", () => {
        this.pending = false;
        this.automatic = this.pendingAutomatic;
      });
      video.addEventListener("leavepictureinpicture", () => {
        this.pending = false;
        if (this.automatic && !this.closingFallbackProgrammatically) {
          this.suppressAutoPiPForSession();
        }
        this.automatic = false;
        this.closingFallbackProgrammatically = false;
      });
      this.host.document.body.appendChild(video);
      this.fallbackVideo = video;
      this.ensureFallbackCanvas();
    }
    ensureFallbackCanvas() {
      if (this.fallbackCanvas || !this.fallbackVideo) {
        return;
      }
      const canvas = this.host.document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      this.fallbackCanvas = canvas;
      if (typeof canvas.captureStream === "function") {
        try {
          this.fallbackCanvasStream = canvas.captureStream(1);
        } catch (error) {
          this.log("warn", "Canvas captureStream is unavailable", error);
        }
      }
    }
    updateFallbackVideo() {
      this.ensureFallbackVideo();
      if (!this.fallbackVideo) {
        return;
      }
      const item = this.selected.find(({ participant }) => !participant.local) ?? this.selected[0];
      const nextTrack = this.screenShare?.track ?? item?.track;
      if (this.fallbackAttachedTrack !== nextTrack) {
        this.detachFallbackTrack();
        if (nextTrack) {
          try {
            this.fallbackVideo.srcObject = null;
            nextTrack.attach(this.fallbackVideo);
            this.fallbackAttachedTrack = nextTrack;
          } catch (error) {
            this.log("warn", "Unable to attach fallback video track", error);
          }
        }
      }
      if (!this.fallbackAttachedTrack) {
        const canvasKey = item?.participant ? `${item.participant.id}:${participantName(item.participant, this.config.participantLabel)}` : "empty";
        if (this.fallbackCanvasKey !== canvasKey) {
          this.fallbackCanvasKey = canvasKey;
          this.drawFallbackCanvas(item?.participant);
        }
        if (this.fallbackCanvasStream && this.fallbackVideo.srcObject !== this.fallbackCanvasStream) {
          this.fallbackVideo.srcObject = this.fallbackCanvasStream;
        }
      }
      this.playVideo(this.fallbackVideo);
    }
    detachFallbackTrack() {
      if (this.fallbackAttachedTrack && this.fallbackVideo) {
        try {
          this.fallbackAttachedTrack.detach?.(this.fallbackVideo);
        } catch (error) {
          this.log("warn", "Unable to detach fallback track", error);
        }
      }
      this.fallbackAttachedTrack = void 0;
      if (this.fallbackVideo) {
        this.fallbackVideo.srcObject = null;
      }
    }
    playVideo(video) {
      try {
        const result = video.play();
        if (result && typeof result.catch === "function") {
          void result.catch(() => void 0);
        }
      } catch {
      }
    }
    drawFallbackCanvas(participant) {
      const canvas = this.fallbackCanvas;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }
      const name = participant ? participantName(participant, this.config.participantLabel) : this.config.noActiveSpeakerLabel;
      const initials = participant ? participantInitials(participant, this.config.participantLabel) : "\u2026";
      context.fillStyle = "#111827";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#315d8c";
      context.beginPath();
      context.arc(canvas.width / 2, 145, 76, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffffff";
      context.font = "700 52px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(initials, canvas.width / 2, 145);
      context.font = "28px sans-serif";
      context.fillText(name.slice(0, 38), canvas.width / 2, 270);
      const streamTrack = this.fallbackCanvasStream?.getVideoTracks()[0];
      streamTrack?.requestFrame?.();
    }
    updateControlState() {
      const conference = this.host.APP?.conference;
      const audioMuted = conference?.isLocalAudioMuted?.() ?? false;
      const videoMuted = conference?.isLocalVideoMuted?.() ?? false;
      this.setControlMuted("audio", audioMuted, audioMuted ? this.config.enableMicrophoneLabel : this.config.disableMicrophoneLabel);
      this.setControlMuted("video", videoMuted, videoMuted ? this.config.enableCameraLabel : this.config.disableCameraLabel);
    }
    setControlMuted(action, muted, label) {
      const button = this.controlButtons.get(action);
      if (!button) {
        return;
      }
      button.classList.toggle("is-muted", muted);
      if (action === "audio") {
        button.innerHTML = muted ? ICONS.microphoneMuted : ICONS.microphone;
      } else if (action === "video") {
        button.innerHTML = muted ? ICONS.cameraMuted : ICONS.camera;
      }
      button.setAttribute("aria-pressed", String(muted));
      button.setAttribute("aria-label", label);
      button.title = label;
    }
    toggleAudio() {
      try {
        this.host.APP?.conference?.toggleAudioMuted?.(false);
        this.updateControlState();
      } catch (error) {
        this.log("warn", "Unable to toggle microphone", error);
      }
    }
    toggleVideo() {
      try {
        this.host.APP?.conference?.toggleVideoMuted?.(false, true);
        this.updateControlState();
      } catch (error) {
        this.log("warn", "Unable to toggle camera", error);
      }
    }
    hangup() {
      try {
        this.host.APP?.conference?.hangup?.(false);
      } catch (error) {
        this.log("warn", "Unable to hang up", error);
      }
      void this.close();
    }
    suppressAutoPiPForSession() {
      this.autoPiPSuppressedByUser = true;
      this.hiddenSinceLastAutoPiP = false;
      this.autoPiPOpenFailed = false;
    }
    supportsVideoPiP() {
      const documentWithPiP = this.host.document;
      const prototype = this.host.HTMLVideoElement?.prototype;
      return documentWithPiP.pictureInPictureEnabled !== false && typeof prototype?.requestPictureInPicture === "function";
    }
    getSupportedMode() {
      if (this.isTopLevel() && typeof this.host.documentPictureInPicture?.requestWindow === "function") {
        return "document";
      }
      return this.supportsVideoPiP() ? "video" : "none";
    }
    isTopLevel() {
      try {
        return this.host.self === this.host.top;
      } catch {
        return false;
      }
    }
    handleOpenError(error, automatic) {
      if (automatic) {
        this.autoPiPLastError = this.formatError(error);
      }
      this.log("warn", "Picture-in-Picture request was rejected", error);
      if (!automatic) {
        const name = error instanceof DOMException ? error.name : "";
        const message = name === "NotAllowedError" ? "\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u0437\u0430\u043F\u0440\u0435\u0442\u0438\u043B Picture-in-Picture. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0435\u0433\u043E \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u0441\u0430\u0439\u0442\u0430." : "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C Picture-in-Picture.";
        this.showMessage(message);
      }
    }
    formatError(error) {
      if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
      }
      return String(error);
    }
    showMessage(message) {
      if (!this.host.document.body) {
        this.log("warn", message);
        return;
      }
      this.toast?.remove();
      const toast = this.host.document.createElement("div");
      toast.textContent = message;
      toast.setAttribute("role", "status");
      Object.assign(toast.style, {
        background: "rgba(17, 24, 39, .96)",
        borderRadius: "8px",
        bottom: "88px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, .35)",
        color: "#fff",
        font: "14px/1.4 sans-serif",
        left: "50%",
        maxWidth: "420px",
        padding: "11px 15px",
        position: "fixed",
        textAlign: "center",
        transform: "translateX(-50%)",
        zIndex: "100000"
      });
      this.host.document.body.appendChild(toast);
      this.toast = toast;
      if (this.toastTimer !== void 0) {
        this.host.clearTimeout(this.toastTimer);
      }
      this.toastTimer = this.host.setTimeout(() => {
        toast.remove();
        if (this.toast === toast) {
          this.toast = void 0;
        }
      }, 5e3);
    }
    log(level, message, error) {
      const logger = this.host.console?.[level] ?? console[level];
      logger.call(this.host.console, `[JitsiBrowserPiP] ${message}`, error ?? "");
    }
  };

  // src/index.ts
  function bootstrap(host) {
    if (host.JitsiBrowserPiP) {
      host.console.warn("[JitsiBrowserPiP] Plugin is already loaded.");
      return;
    }
    const config = prepareJitsiConfig(host);
    const plugin = new JitsiMeetPiPPlugin(host, config);
    host.JitsiBrowserPiP = plugin.getPublicApi();
    plugin.start();
  }
  if (typeof window !== "undefined") {
    bootstrap(window);
  }
})();
