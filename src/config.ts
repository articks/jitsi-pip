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
    closeAutoOnReturn: true,
    enabled: true,
    maxParticipants: 4
};

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
        buttonText: typeof config?.buttonText === 'string' && config.buttonText.trim()
            ? config.buttonText.trim()
            : DEFAULT_CONFIG.buttonText,
        closeAutoOnReturn: config?.closeAutoOnReturn ?? DEFAULT_CONFIG.closeAutoOnReturn,
        enabled: config?.enabled ?? DEFAULT_CONFIG.enabled,
        maxParticipants: clampParticipants(config?.maxParticipants)
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
