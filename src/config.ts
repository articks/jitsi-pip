import type {
    BrowserPiPConfig,
    JitsiGlobalConfig,
    JitsiHostWindow
} from './types';

export const BUTTON_ID = 'browser-pip';

export const TOOLBAR_ICON = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Crect x=%223%22 y=%224%22 width=%2218%22 height=%2216%22 rx=%222%22/%3E%3Crect x=%2212%22 y=%2211%22 width=%227%22 height=%226%22 rx=%221%22 fill=%22white%22 stroke=%22white%22/%3E%3C/svg%3E';

export const DEFAULT_CONFIG: BrowserPiPConfig = {
    autoOpen: true,
    buttonText: 'Картинка в картинке',
    cameraLabel: 'Камера',
    closeAutoOnReturn: true,
    disableCameraLabel: 'Выключить камеру',
    disableMicrophoneLabel: 'Выключить микрофон',
    enabled: true,
    enableCameraLabel: 'Включить камеру',
    enableMicrophoneLabel: 'Включить микрофон',
    hangupLabel: 'Завершить звонок',
    includeLocalScreenShare: true,
    lobbyLabel: 'В лобби',
    maxParticipants: 4,
    microphoneLabel: 'Микрофон',
    noActiveSpeakerLabel: 'Нет активного собеседника',
    noScreenShareLabel: 'Нет активной демонстрации',
    participantLabel: 'Участник',
    participantsLabel: 'Участников',
    returnToConferenceLabel: 'Вернуться в конференцию',
    screenShareLabel: 'Демонстрация',
    showScreenShare: true,
    waitingParticipantLabel: 'Ожидаем участника',
    windowTitle: 'PiP',
    youLabel: 'Вы'
};

function normalizeLabel(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function clampParticipants(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(parsed)) {
        return DEFAULT_CONFIG.maxParticipants;
    }

    return Math.min(4, Math.max(1, Math.trunc(parsed)));
}

export function normalizeConfig(config?: Partial<BrowserPiPConfig>): BrowserPiPConfig {
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

/**
 * Adds the plugin button before Jitsi consumes its global config.
 */
export function prepareJitsiConfig(host: JitsiHostWindow): BrowserPiPConfig {
    const root: JitsiGlobalConfig = host.config ?? {};
    const normalized = normalizeConfig(root.browserPip);

    host.config = root;
    root.browserPip = normalized;

    if (!normalized.enabled) {
        return normalized;
    }

    const buttons = Array.isArray(root.customToolbarButtons)
        ? [ ...root.customToolbarButtons ]
        : [];

    if (!buttons.some(button => button.id === BUTTON_ID)) {
        buttons.push({
            icon: TOOLBAR_ICON,
            id: BUTTON_ID,
            text: normalized.buttonText
        });
    }

    root.customToolbarButtons = buttons;

    return normalized;
}
