import { BUTTON_ID, TOOLBAR_ICON } from './config';
import {
    participantAvatar,
    participantInitials,
    participantName,
    selectParticipantsWithTracks,
    selectScreenShare
} from './participants';
import { DOCUMENT_PIP_STYLES, ICONS } from './styles';
import type {
    BrowserPiPConfig,
    JitsiApi,
    JitsiBrowserPiPPublicApi,
    JitsiCustomToolbarButton,
    JitsiHostWindow,
    JitsiParticipant,
    JitsiStore,
    JitsiTrack,
    PiPMode,
    PiPState,
    SelectedParticipant,
    SelectedScreenShare
} from './types';

export const PLUGIN_VERSION = '1.2.5';

export function isAutoPiPProtocolEligible(protocol: string): boolean {
    return protocol === 'https:' || protocol === 'file:';
}

interface TileElements {
    avatar: HTMLDivElement;
    avatarCircle: HTMLDivElement;
    avatarImage?: HTMLImageElement;
    avatarInitials?: string;
    avatarUrl?: string;
    attachedTrack?: JitsiTrack;
    name: HTMLDivElement;
    participantId: string;
    root: HTMLDivElement;
    video: HTMLVideoElement;
}

interface ScreenShareElements {
    attachedTrack?: JitsiTrack;
    label: HTMLDivElement;
    root: HTMLDivElement;
    video: HTMLVideoElement;
}

type ToolbarNotify = (key: string, preventExecution?: boolean) => unknown;

interface MediaSessionPiPActionDetails {
    action?: string;
    enterPictureInPictureReason?: string;
    reason?: string;
}

type MediaSessionHandler = (details?: MediaSessionPiPActionDetails) => void;

type PiPMediaSession = MediaSession & {
    setActionHandler: (action: string, handler: MediaSessionHandler | null) => void;
    setCameraActive?: (active: boolean) => void;
    setMicrophoneActive?: (active: boolean) => void;
};

const CONNECT_TIMEOUT_MS = 30_000;
const CONNECT_RETRY_MS = 50;

export class JitsiMeetPiPPlugin {
    private api?: JitsiApi;
    private apiHadOwnNotify = false;
    private apiOriginalNotify?: ToolbarNotify;
    private automatic = false;
    private connectDeadline = 0;
    private connectTimer?: number;
    private controlButtons = new Map<string, HTMLButtonElement>();
    private destroyed = false;
    private documentContent?: HTMLDivElement;
    private documentGrid?: HTMLDivElement;
    private documentWindow?: Window;
    private fallbackAttachedTrack?: JitsiTrack;
    private fallbackCanvas?: HTMLCanvasElement;
    private fallbackCanvasKey?: string;
    private fallbackCanvasStream?: MediaStream;
    private fallbackVideo?: HTMLVideoElement;
    private autoPiPEventReceived = false;
    private autoPiPHandlerRegistered = false;
    private autoPiPHintShown = false;
    private autoPiPLastError?: string;
    private autoPiPLastReason?: string;
    private autoPiPOpenFailed = false;
    private autoPiPSuppressedByUser = false;
    private closingFallbackProgrammatically = false;
    private hiddenSinceLastAutoPiP = false;
    private localCaptureActive = false;
    private mediaSessionActions = new Set<string>();
    private pending = false;
    private pendingAutomatic = false;
    private screenShare?: SelectedScreenShare;
    private screenShareElements?: ScreenShareElements;
    private selected: SelectedParticipant[] = [];
    private store?: JitsiStore;
    private storeUnsubscribe?: () => void;
    private toolbarSyncing = false;
    private tiles = new Map<string, TileElements>();
    private toast?: HTMLDivElement;
    private toastTimer?: number;
    private waitingForBody = false;

    private readonly onBodyReady = () => {
        this.waitingForBody = false;
        this.ensureFallbackVideo();
        this.handleStoreChange();
    };

    private readonly onVisibilityChange = () => {
        if (this.host.document.visibilityState !== 'visible') {
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

        if (this.config.autoOpen
                && !this.autoPiPSuppressedByUser
                && this.hiddenSinceLastAutoPiP
                && (!this.autoPiPEventReceived || this.autoPiPOpenFailed)
                && !this.autoPiPHintShown
                && !this.getState().open) {
            this.autoPiPHintShown = true;
            this.showMessage(this.autoPiPOpenFailed
                ? 'Chrome отклонил Auto PiP. Проверьте разрешение «Автоматическая картинка в картинке» для сайта.'
                : !isAutoPiPProtocolEligible(this.host.location.protocol)
                    ? 'Chrome Auto PiP не работает по HTTP, даже на 127.0.0.1. Откройте Jitsi по HTTPS; ручной PiP остаётся доступен.'
                    : this.host.isSecureContext !== true
                    ? 'Auto PiP требует защищённый контекст HTTPS или локальный адрес 127.0.0.1/localhost.'
                    : !this.autoPiPHandlerRegistered
                        ? 'Этот браузер не зарегистрировал обработчик Auto PiP. Используйте актуальный desktop Chrome или Edge.'
                        : this.hasActiveLocalCapture()
                            ? 'Chrome не запустил Auto PiP. Разрешите «Автоматическую картинку в картинке» в настройках сайта.'
                            : 'Для Auto PiP сначала включите камеру или микрофон и разрешите доступ браузеру.');
        }

        this.hiddenSinceLastAutoPiP = false;
    };

    constructor(
            private readonly host: JitsiHostWindow,
            private readonly config: BrowserPiPConfig
    ) {}

    start(): void {
        if (this.destroyed || !this.config.enabled) {
            return;
        }

        this.host.document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.installMediaSessionHandlers();
        this.connectDeadline = Date.now() + CONNECT_TIMEOUT_MS;
        this.connectToJitsi();
    }

    getPublicApi(): JitsiBrowserPiPPublicApi {
        return {
            close: () => this.close(),
            destroy: () => this.destroy(),
            getState: () => this.getState(),
            open: () => this.open(),
            version: PLUGIN_VERSION
        };
    }

    open(): Promise<boolean> {
        return this.openInternal(false);
    }

    close(): Promise<void> {
        this.pending = false;

        if (this.documentWindow) {
            const pipWindow = this.documentWindow;

            this.cleanupDocumentWindow();

            try {
                pipWindow.close();
            } catch (error) {
                this.log('warn', 'Unable to close Document PiP window', error);
            }
        }

        const documentWithPiP = this.host.document as Document & {
            exitPictureInPicture?: () => Promise<void>;
            pictureInPictureElement?: Element | null;
        };

        if (this.fallbackVideo
                && documentWithPiP.pictureInPictureElement === this.fallbackVideo
                && documentWithPiP.exitPictureInPicture) {
            this.closingFallbackProgrammatically = true;

            return documentWithPiP.exitPictureInPicture()
                .catch(error => this.log('warn', 'Unable to exit Video PiP', error))
                .then(() => {
                    this.automatic = false;
                    this.closingFallbackProgrammatically = false;
                });
        }

        this.automatic = false;

        return Promise.resolve();
    }

    destroy(): void {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        void this.close();

        if (this.connectTimer !== undefined) {
            this.host.clearTimeout(this.connectTimer);
            this.connectTimer = undefined;
        }

        this.storeUnsubscribe?.();
        this.storeUnsubscribe = undefined;
        this.store = undefined;

        if (this.api) {
            if (this.apiHadOwnNotify) {
                this.api.notifyToolbarButtonClicked = this.apiOriginalNotify;
            } else {
                delete this.api.notifyToolbarButtonClicked;
            }
        }

        this.host.document.removeEventListener('visibilitychange', this.onVisibilityChange);

        if (this.waitingForBody) {
            this.host.document.removeEventListener('DOMContentLoaded', this.onBodyReady);
            this.waitingForBody = false;
        }

        this.cleanupMediaSessionHandlers();
        this.detachFallbackTrack();
        this.fallbackCanvasStream?.getTracks().forEach(track => track.stop());
        this.fallbackCanvasStream = undefined;
        this.fallbackCanvas = undefined;
        this.fallbackVideo?.remove();
        this.fallbackVideo = undefined;

        if (this.toastTimer !== undefined) {
            this.host.clearTimeout(this.toastTimer);
        }
        this.toast?.remove();
        this.toast = undefined;
        this.screenShare = undefined;
        this.selected = [];
    }

    getState(): PiPState {
        const documentWithPiP = this.host.document as Document & {
            pictureInPictureElement?: Element | null;
        };

        return {
            autoPiP: {
                captureActive: this.localCaptureActive,
                eventReceived: this.autoPiPEventReceived,
                handlerRegistered: this.autoPiPHandlerRegistered,
                lastError: this.autoPiPLastError,
                lastReason: this.autoPiPLastReason,
                protocolEligible: isAutoPiPProtocolEligible(this.host.location.protocol),
                ready: this.config.autoOpen
                    && !this.autoPiPSuppressedByUser
                    && this.localCaptureActive
                    && this.autoPiPHandlerRegistered
                    && isAutoPiPProtocolEligible(this.host.location.protocol)
                    && this.host.isSecureContext === true,
                secureContext: this.host.isSecureContext === true,
                suppressedByUser: this.autoPiPSuppressedByUser
            },
            automatic: this.automatic,
            destroyed: this.destroyed,
            mode: this.getSupportedMode(),
            open: Boolean(this.documentWindow
                || (this.fallbackVideo && documentWithPiP.pictureInPictureElement === this.fallbackVideo)),
            participants: this.selected.map(({ participant }) => participant.id),
            pending: this.pending,
            screenShare: this.screenShare
                ? {
                    id: this.screenShare.id,
                    label: this.screenShare.label,
                    local: this.screenShare.local
                }
                : undefined
        };
    }

    private connectToJitsi(): void {
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
            // Re-register after Jitsi has initialized its own Media Session integration.
            this.installMediaSessionHandlers();
            this.ensureFallbackVideo();
            this.handleStoreChange();
        }

        if (this.api && this.store) {
            return;
        }

        if (Date.now() >= this.connectDeadline) {
            this.log('error', 'Jitsi APP.store/API were not available within 30 seconds');
            return;
        }

        this.connectTimer = this.host.setTimeout(() => this.connectToJitsi(), CONNECT_RETRY_MS);
    }

    private installToolbarHandler(api: JitsiApi): void {
        this.api = api;
        this.apiHadOwnNotify = Object.prototype.hasOwnProperty.call(api, 'notifyToolbarButtonClicked');
        this.apiOriginalNotify = api.notifyToolbarButtonClicked;

        const plugin = this;
        const original = this.apiOriginalNotify;

        api.notifyToolbarButtonClicked = function notifyToolbarButtonClicked(key, preventExecution) {
            if (key === BUTTON_ID) {
                // requestWindow()/requestPictureInPicture() must be invoked in this synchronous click stack.
                void plugin.openInternal(false);
            }

            return original?.call(this, key, preventExecution);
        };
    }

    private installMediaSessionHandlers(): void {
        const mediaSession = this.host.navigator.mediaSession as PiPMediaSession;

        if (!mediaSession?.setActionHandler) {
            return;
        }

        this.installAutoPiPHandler(mediaSession);

        const handlers: Record<string, MediaSessionHandler> = {
            hangup: () => this.hangup(),
            togglecamera: () => this.toggleVideo(),
            togglemicrophone: () => this.toggleAudio()
        };

        for (const [ action, handler ] of Object.entries(handlers)) {
            try {
                mediaSession.setActionHandler(action, handler);
                this.mediaSessionActions.add(action);
            } catch {
                // Browser supports Media Session, but not this particular conferencing action.
            }
        }
    }

    private installAutoPiPHandler(mediaSession?: PiPMediaSession): void {
        const currentMediaSession = mediaSession
            ?? this.host.navigator.mediaSession as PiPMediaSession;

        if (!currentMediaSession?.setActionHandler) {
            this.autoPiPHandlerRegistered = false;
            this.autoPiPLastError = 'Media Session API недоступен';
            return;
        }

        try {
            currentMediaSession.setActionHandler(
                'enterpictureinpicture',
                details => this.handleMediaSessionPiP(details)
            );
            this.mediaSessionActions.add('enterpictureinpicture');
            this.autoPiPHandlerRegistered = true;
            this.autoPiPLastError = undefined;
        } catch (error) {
            this.autoPiPHandlerRegistered = false;
            this.autoPiPLastError = this.formatError(error);
            this.log('warn', 'Automatic Picture-in-Picture action is unavailable', error);
        }
    }

    private cleanupMediaSessionHandlers(): void {
        const mediaSession = this.host.navigator.mediaSession as PiPMediaSession;

        if (!mediaSession?.setActionHandler) {
            return;
        }

        for (const action of this.mediaSessionActions) {
            try {
                mediaSession.setActionHandler(action, null);
            } catch {
                // Ignore unsupported actions during cleanup.
            }
        }
        this.mediaSessionActions.clear();
        this.autoPiPHandlerRegistered = false;
    }

    private handleMediaSessionPiP(details?: MediaSessionPiPActionDetails): void {
        const reason = details?.enterPictureInPictureReason ?? details?.reason;
        const automatic = reason === 'contentoccluded'
            || (!reason && this.host.document.visibilityState !== 'visible');

        this.autoPiPLastReason = reason ?? 'unspecified';
        this.autoPiPLastError = undefined;

        if (automatic) {
            this.hiddenSinceLastAutoPiP = true;
            this.autoPiPEventReceived = true;
            this.autoPiPOpenFailed = false;
        }

        if (automatic && (!this.config.autoOpen || this.autoPiPSuppressedByUser)) {
            return;
        }

        // A useraction reason comes from Chrome's media controls and should
        // behave like a manually opened window. contentoccluded is Auto PiP.
        void this.openInternal(automatic).then(opened => {
            if (!automatic || opened) {
                return;
            }

            this.autoPiPOpenFailed = true;

            if (this.host.document.visibilityState === 'visible' && !this.autoPiPHintShown) {
                this.autoPiPHintShown = true;
                this.showMessage('Chrome отклонил Auto PiP. Проверьте разрешение «Автоматическая картинка в картинке» для сайта.');
            }
        });
    }

    private openInternal(automatic: boolean): Promise<boolean> {
        if (this.destroyed
                || !this.config.enabled
                || (automatic && (!this.config.autoOpen || this.autoPiPSuppressedByUser))) {
            return Promise.resolve(false);
        }

        if (this.documentWindow && !this.documentWindow.closed) {
            return Promise.resolve(true);
        }

        const documentWithPiP = this.host.document as Document & {
            pictureInPictureElement?: Element | null;
        };

        if (this.fallbackVideo && documentWithPiP.pictureInPictureElement === this.fallbackVideo) {
            return Promise.resolve(true);
        }

        if (this.pending) {
            return Promise.resolve(false);
        }

        const canUseDocumentPiP = this.isTopLevel()
            && typeof this.host.documentPictureInPicture?.requestWindow === 'function';

        if (canUseDocumentPiP) {
            return this.openDocumentPiP(automatic);
        }

        if (this.supportsVideoPiP()) {
            return this.openVideoPiP(automatic);
        }

        if (!automatic) {
            this.showMessage(this.isTopLevel()
                ? 'Этот браузер не поддерживает Picture-in-Picture.'
                : 'Picture-in-Picture недоступен: Jitsi открыт внутри iframe.');
        }

        return Promise.resolve(false);
    }

    private openDocumentPiP(automatic: boolean): Promise<boolean> {
        const controller = this.host.documentPictureInPicture;

        if (!controller) {
            return Promise.resolve(false);
        }

        this.pending = true;
        this.pendingAutomatic = automatic;

        let request: Promise<Window>;

        try {
            // Do not insert an await before this call: it must keep the toolbar click activation.
            request = controller.requestWindow({
                height: 640,
                preferInitialWindowPlacement: true,
                width: 320
            });
        } catch (error) {
            this.pending = false;
            this.handleOpenError(error, automatic);
            return Promise.resolve(false);
        }

        return request.then(pipWindow => {
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

            pipWindow.addEventListener('pagehide', () => {
                if (this.documentWindow === pipWindow) {
                    if (this.automatic) {
                        this.suppressAutoPiPForSession();
                    }
                    this.cleanupDocumentWindow();
                }
            }, { once: true });

            return true;
        }).catch(error => {
            this.pending = false;
            this.handleOpenError(error, automatic);
            return false;
        });
    }

    private openVideoPiP(automatic: boolean): Promise<boolean> {
        this.ensureFallbackVideo();
        const video = this.fallbackVideo as HTMLVideoElement & {
            requestPictureInPicture?: () => Promise<unknown>;
        };

        if (!video?.requestPictureInPicture) {
            return Promise.resolve(false);
        }

        if (video.readyState < 1) {
            if (!automatic) {
                this.showMessage('Видео для Picture-in-Picture ещё подготавливается. Повторите попытку.');
            }
            return Promise.resolve(false);
        }

        this.pending = true;
        this.pendingAutomatic = automatic;

        let request: Promise<unknown>;

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
        }).catch(error => {
            this.pending = false;
            this.handleOpenError(error, automatic);
            return false;
        });
    }

    private setupDocumentWindow(pipWindow: Window): void {
        const document = pipWindow.document;

        document.title = 'Jitsi Meet — Picture-in-Picture';
        document.documentElement.lang = this.host.document.documentElement.lang || 'ru';
        document.body.replaceChildren();

        const style = document.createElement('style');

        style.textContent = DOCUMENT_PIP_STYLES;
        document.head.appendChild(style);

        const root = document.createElement('div');
        const content = document.createElement('div');
        const screenShareRoot = document.createElement('div');
        const screenShareVideo = document.createElement('video');
        const screenShareLabel = document.createElement('div');
        const grid = document.createElement('div');
        const controls = document.createElement('div');

        root.className = 'jmp-root';
        content.className = 'jmp-content has-screen-share';
        screenShareRoot.className = 'jmp-screen-share is-empty';
        screenShareVideo.className = 'jmp-screen-share-video';
        screenShareVideo.autoplay = true;
        screenShareVideo.hidden = true;
        screenShareVideo.muted = true;
        screenShareVideo.playsInline = true;
        screenShareLabel.className = 'jmp-screen-share-label';
        screenShareLabel.innerHTML = ICONS.screenSharePlaceholder;
        screenShareRoot.setAttribute('aria-label', 'Нет активной демонстрации');
        grid.className = 'jmp-grid';
        controls.className = 'jmp-controls';

        controls.append(
            this.createControl(document, 'audio', 'Микрофон', ICONS.microphone, () => this.toggleAudio()),
            this.createControl(document, 'video', 'Камера', ICONS.camera, () => this.toggleVideo()),
            this.createControl(document, 'return', 'Вернуться в конференцию', ICONS.return, () => {
                try {
                    this.host.focus();
                } catch {
                    // Browser may deny focusing the opener.
                }
                void this.close();
            }),
            this.createControl(document, 'hangup', 'Завершить звонок', ICONS.hangup, () => this.hangup(), true)
        );

        screenShareRoot.append(screenShareVideo, screenShareLabel);
        content.append(screenShareRoot, grid);
        root.append(content, controls);
        document.body.append(root);
        this.documentContent = content;
        this.documentGrid = grid;
        this.screenShareElements = {
            label: screenShareLabel,
            root: screenShareRoot,
            video: screenShareVideo
        };
    }

    private createControl(
            document: Document,
            action: string,
            label: string,
            icon: string,
            handler: () => void,
            danger = false
    ): HTMLButtonElement {
        const button = document.createElement('button');

        button.type = 'button';
        button.className = `jmp-control${danger ? ' is-danger' : ''}`;
        button.title = label;
        button.setAttribute('aria-label', label);
        button.innerHTML = icon;
        button.addEventListener('click', handler);
        this.controlButtons.set(action, button);

        return button;
    }

    private handleStoreChange(): void {
        if (this.destroyed || !this.store) {
            return;
        }

        try {
            this.ensureToolbarButtonInStore();
            this.syncMediaSessionCaptureState();
            this.screenShare = this.config.showScreenShare
                ? selectScreenShare(this.store.getState(), this.config.includeLocalScreenShare)
                : undefined;
            this.selected = selectParticipantsWithTracks(
                this.store.getState(),
                this.config.maxParticipants
            );
            this.updateFallbackVideo();
            this.updateDocumentScreenShare();
            this.updateDocumentParticipants();
            this.updateControlState();
        } catch (error) {
            this.log('warn', 'Unable to process Jitsi state update', error);
        }
    }

    private getLocalCaptureState(): {
        audioActive: boolean;
        captureActive: boolean;
        videoActive: boolean;
    } {
        const tracks = this.store?.getState()['features/base/tracks'];
        let audioActive = false;
        let captureActive = false;
        let videoActive = false;

        if (!Array.isArray(tracks)) {
            return { audioActive, captureActive, videoActive };
        }

        for (const trackState of tracks) {
            const jitsiTrack = trackState.jitsiTrack;

            if (!trackState.local || !jitsiTrack
                    || (trackState.mediaType !== 'audio' && trackState.mediaType !== 'video')) {
                continue;
            }

            const mediaTrack = jitsiTrack.getTrack?.();

            if (mediaTrack?.readyState === 'ended') {
                continue;
            }

            captureActive = true;
            const muted = trackState.muted ?? jitsiTrack.isMuted?.() ?? false;

            if (trackState.mediaType === 'audio') {
                audioActive ||= !muted;
            } else {
                videoActive ||= !muted;
            }
        }

        return { audioActive, captureActive, videoActive };
    }

    private hasActiveLocalCapture(): boolean {
        return this.getLocalCaptureState().captureActive;
    }

    private syncMediaSessionCaptureState(): void {
        const mediaSession = this.host.navigator.mediaSession as PiPMediaSession;

        if (!mediaSession) {
            return;
        }

        const { audioActive, captureActive, videoActive } = this.getLocalCaptureState();
        const captureStarted = captureActive && !this.localCaptureActive;

        this.localCaptureActive = captureActive;

        // Chrome's reference flow registers enterpictureinpicture after
        // getUserMedia becomes active. Re-arm it on that transition as Jitsi
        // may initialize its own Media Session handlers in the meantime.
        if (captureStarted) {
            this.installAutoPiPHandler(mediaSession);
        }

        try {
            mediaSession.setMicrophoneActive?.(audioActive);
            mediaSession.setCameraActive?.(videoActive);
        } catch (error) {
            this.log('warn', 'Unable to update Media Session capture state', error);
        }
    }

    /**
     * Jitsi loads config.js asynchronously and can replace window.config after
     * this standalone script has added its custom button. Synchronize the
     * button with Redux once APP.store exists, without replacing buttons added
     * by the deployment.
     */
    private ensureToolbarButtonInStore(): void {
        const store = this.store;

        if (!store?.dispatch || this.toolbarSyncing) {
            return;
        }

        const state = store.getState();
        const currentConfig = state['features/base/config'];
        const currentButtons: JitsiCustomToolbarButton[] = currentConfig
            && typeof currentConfig === 'object'
            && Array.isArray((currentConfig as { customToolbarButtons?: unknown }).customToolbarButtons)
            ? (currentConfig as { customToolbarButtons: JitsiCustomToolbarButton[] }).customToolbarButtons
            : [];

        if (currentButtons.some(button => button.id === BUTTON_ID)) {
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
                type: 'OVERWRITE_CONFIG'
            });

            if (this.host.config) {
                this.host.config.customToolbarButtons = customToolbarButtons;
            }
        } finally {
            this.toolbarSyncing = false;
        }
    }

    private updateDocumentParticipants(): void {
        const grid = this.documentGrid;

        if (!grid || !this.documentWindow) {
            return;
        }

        const selectedIds = new Set(this.selected.map(({ participant }) => participant.id));

        for (const [ id, tile ] of this.tiles) {
            if (!selectedIds.has(id)) {
                this.detachTileTrack(tile);
                tile.root.remove();
                this.tiles.delete(id);
            }
        }

        grid.querySelectorAll('.jmp-placeholder, .jmp-empty').forEach(element => element.remove());

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

    private createParticipantPlaceholder(document: Document): HTMLDivElement {
        const root = document.createElement('div');
        const icon = document.createElement('div');

        root.className = 'jmp-tile jmp-placeholder';
        root.setAttribute('aria-label', 'Ожидаем участника');
        icon.className = 'jmp-placeholder-icon';
        icon.innerHTML = ICONS.participantPlaceholder;
        root.append(icon);

        return root;
    }

    private updateDocumentScreenShare(): void {
        const elements = this.screenShareElements;
        const content = this.documentContent;

        if (!elements || !content) {
            return;
        }

        const selected = this.screenShare;

        if (!selected) {
            this.detachScreenShareTrack(elements);
            elements.root.hidden = false;
            elements.root.classList.add('is-empty');
            elements.root.setAttribute('aria-label', 'Нет активной демонстрации');
            elements.video.hidden = true;
            elements.label.innerHTML = ICONS.screenSharePlaceholder;
            elements.label.removeAttribute('title');
            content.classList.add('has-screen-share');
            return;
        }

        if (elements.attachedTrack !== selected.track) {
            this.detachScreenShareTrack(elements);

            try {
                selected.track.attach(elements.video);
                elements.attachedTrack = selected.track;
                this.playVideo(elements.video);
            } catch (error) {
                this.log('warn', `Unable to attach screen share track ${selected.id}`, error);
            }
        }

        elements.label.textContent = selected.label;
        elements.label.title = selected.label;
        elements.root.setAttribute('aria-label', selected.label);
        elements.root.hidden = false;
        elements.root.classList.remove('is-empty');
        elements.video.hidden = false;
        content.classList.add('has-screen-share');
    }

    private detachScreenShareTrack(elements: ScreenShareElements): void {
        if (elements.attachedTrack) {
            try {
                elements.attachedTrack.detach?.(elements.video);
            } catch (error) {
                this.log('warn', 'Unable to detach screen share track', error);
            }
            elements.attachedTrack = undefined;
        }
        elements.video.srcObject = null;
    }

    private createTile(document: Document, participant: JitsiParticipant): TileElements {
        const root = document.createElement('div');
        const video = document.createElement('video');
        const avatar = document.createElement('div');
        const avatarCircle = document.createElement('div');
        const name = document.createElement('div');

        root.className = 'jmp-tile';
        root.classList.toggle('is-local', Boolean(participant.local));
        video.className = 'jmp-video';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        avatar.className = 'jmp-avatar';
        avatarCircle.className = 'jmp-avatar-circle';
        name.className = 'jmp-name';

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

    private updateTile(tile: TileElements, item: SelectedParticipant): void {
        const { participant, track } = item;
        const name = participantName(participant);

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
                    this.log('warn', `Unable to attach track for ${participant.id}`, error);
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

    private renderTileAvatar(tile: TileElements, participant: JitsiParticipant): void {
        const url = participantAvatar(participant);
        const initials = participantInitials(participant);

        if (tile.avatarUrl === url && tile.avatarInitials === initials) {
            return;
        }

        tile.avatarCircle.replaceChildren();
        tile.avatarImage = undefined;
        tile.avatarInitials = initials;
        tile.avatarUrl = url;
        tile.avatarCircle.textContent = initials;

        if (!url) {
            return;
        }

        const image = tile.root.ownerDocument.createElement('img');

        image.alt = '';
        image.src = url;
        image.addEventListener('load', () => {
            tile.avatarCircle.replaceChildren(image);
            tile.avatarImage = image;
        }, { once: true });
        image.addEventListener('error', () => image.remove(), { once: true });
    }

    private detachTileTrack(tile: TileElements): void {
        if (tile.attachedTrack) {
            try {
                tile.attachedTrack.detach?.(tile.video);
            } catch (error) {
                this.log('warn', `Unable to detach track for ${tile.participantId}`, error);
            }
            tile.attachedTrack = undefined;
        }
        tile.video.srcObject = null;
    }

    private cleanupDocumentWindow(): void {
        if (this.screenShareElements) {
            this.detachScreenShareTrack(this.screenShareElements);
        }
        for (const tile of this.tiles.values()) {
            this.detachTileTrack(tile);
        }
        this.tiles.clear();
        this.controlButtons.clear();
        this.documentContent = undefined;
        this.documentGrid = undefined;
        this.documentWindow = undefined;
        this.screenShareElements = undefined;
        this.automatic = false;
    }

    private ensureFallbackVideo(): void {
        if (this.fallbackVideo || this.destroyed) {
            return;
        }

        if (!this.host.document.body) {
            if (!this.waitingForBody) {
                this.waitingForBody = true;
                this.host.document.addEventListener('DOMContentLoaded', this.onBodyReady, { once: true });
            }
            return;
        }

        const video = this.host.document.createElement('video');

        video.id = 'jitsi-meet-pip-fallback-video';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('aria-hidden', 'true');
        Object.assign(video.style, {
            height: '2px',
            left: '-10px',
            opacity: '0.001',
            pointerEvents: 'none',
            position: 'fixed',
            top: '-10px',
            width: '2px'
        });

        video.addEventListener('enterpictureinpicture', () => {
            this.pending = false;
            this.automatic = this.pendingAutomatic;
        });
        video.addEventListener('leavepictureinpicture', () => {
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

    private ensureFallbackCanvas(): void {
        if (this.fallbackCanvas || !this.fallbackVideo) {
            return;
        }

        const canvas = this.host.document.createElement('canvas');

        canvas.width = 640;
        canvas.height = 360;
        this.fallbackCanvas = canvas;

        if (typeof canvas.captureStream === 'function') {
            try {
                this.fallbackCanvasStream = canvas.captureStream(1);
            } catch (error) {
                this.log('warn', 'Canvas captureStream is unavailable', error);
            }
        }
    }

    private updateFallbackVideo(): void {
        this.ensureFallbackVideo();

        if (!this.fallbackVideo) {
            return;
        }

        const item = this.selected.find(({ participant }) => !participant.local)
            ?? this.selected[0];
        const nextTrack = this.screenShare?.track ?? item?.track;

        if (this.fallbackAttachedTrack !== nextTrack) {
            this.detachFallbackTrack();

            if (nextTrack) {
                try {
                    this.fallbackVideo.srcObject = null;
                    nextTrack.attach(this.fallbackVideo);
                    this.fallbackAttachedTrack = nextTrack;
                } catch (error) {
                    this.log('warn', 'Unable to attach fallback video track', error);
                }
            }
        }

        if (!this.fallbackAttachedTrack) {
            const canvasKey = item?.participant
                ? `${item.participant.id}:${participantName(item.participant)}`
                : 'empty';

            if (this.fallbackCanvasKey !== canvasKey) {
                this.fallbackCanvasKey = canvasKey;
                this.drawFallbackCanvas(item?.participant);
            }
            if (this.fallbackCanvasStream
                    && this.fallbackVideo.srcObject !== this.fallbackCanvasStream) {
                this.fallbackVideo.srcObject = this.fallbackCanvasStream;
            }
        }

        this.playVideo(this.fallbackVideo);
    }

    private detachFallbackTrack(): void {
        if (this.fallbackAttachedTrack && this.fallbackVideo) {
            try {
                this.fallbackAttachedTrack.detach?.(this.fallbackVideo);
            } catch (error) {
                this.log('warn', 'Unable to detach fallback track', error);
            }
        }
        this.fallbackAttachedTrack = undefined;
        if (this.fallbackVideo) {
            this.fallbackVideo.srcObject = null;
        }
    }

    private playVideo(video: HTMLVideoElement): void {
        try {
            const result = video.play();

            if (result && typeof result.catch === 'function') {
                void result.catch(() => undefined);
            }
        } catch {
            // Autoplay may be delayed until the browser considers the media eligible.
        }
    }

    private drawFallbackCanvas(participant?: JitsiParticipant): void {
        const canvas = this.fallbackCanvas;
        const context = canvas?.getContext('2d');

        if (!canvas || !context) {
            return;
        }

        const name = participant ? participantName(participant) : 'Нет активного собеседника';
        const initials = participant ? participantInitials(participant) : '…';

        context.fillStyle = '#111827';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#315d8c';
        context.beginPath();
        context.arc(canvas.width / 2, 145, 76, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#ffffff';
        context.font = '700 52px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(initials, canvas.width / 2, 145);
        context.font = '28px sans-serif';
        context.fillText(name.slice(0, 38), canvas.width / 2, 270);

        const streamTrack = this.fallbackCanvasStream?.getVideoTracks()[0] as MediaStreamTrack & {
            requestFrame?: () => void;
        };

        streamTrack?.requestFrame?.();
    }

    private updateControlState(): void {
        const conference = this.host.APP?.conference;
        const audioMuted = conference?.isLocalAudioMuted?.() ?? false;
        const videoMuted = conference?.isLocalVideoMuted?.() ?? false;

        this.setControlMuted('audio', audioMuted, audioMuted ? 'Включить микрофон' : 'Выключить микрофон');
        this.setControlMuted('video', videoMuted, videoMuted ? 'Включить камеру' : 'Выключить камеру');
    }

    private setControlMuted(action: string, muted: boolean, label: string): void {
        const button = this.controlButtons.get(action);

        if (!button) {
            return;
        }

        button.classList.toggle('is-muted', muted);
        if (action === 'audio') {
            button.innerHTML = muted ? ICONS.microphoneMuted : ICONS.microphone;
        } else if (action === 'video') {
            button.innerHTML = muted ? ICONS.cameraMuted : ICONS.camera;
        }
        button.setAttribute('aria-pressed', String(muted));
        button.setAttribute('aria-label', label);
        button.title = label;
    }

    private toggleAudio(): void {
        try {
            this.host.APP?.conference?.toggleAudioMuted?.(false);
            this.updateControlState();
        } catch (error) {
            this.log('warn', 'Unable to toggle microphone', error);
        }
    }

    private toggleVideo(): void {
        try {
            this.host.APP?.conference?.toggleVideoMuted?.(false, true);
            this.updateControlState();
        } catch (error) {
            this.log('warn', 'Unable to toggle camera', error);
        }
    }

    private hangup(): void {
        try {
            this.host.APP?.conference?.hangup?.(false);
        } catch (error) {
            this.log('warn', 'Unable to hang up', error);
        }
        void this.close();
    }

    private suppressAutoPiPForSession(): void {
        this.autoPiPSuppressedByUser = true;
        this.hiddenSinceLastAutoPiP = false;
        this.autoPiPOpenFailed = false;
    }

    private supportsVideoPiP(): boolean {
        const documentWithPiP = this.host.document as Document & {
            pictureInPictureEnabled?: boolean;
        };
        const prototype = this.host.HTMLVideoElement?.prototype as HTMLVideoElement & {
            requestPictureInPicture?: () => Promise<unknown>;
        };

        return documentWithPiP.pictureInPictureEnabled !== false
            && typeof prototype?.requestPictureInPicture === 'function';
    }

    private getSupportedMode(): PiPMode {
        if (this.isTopLevel() && typeof this.host.documentPictureInPicture?.requestWindow === 'function') {
            return 'document';
        }

        return this.supportsVideoPiP() ? 'video' : 'none';
    }

    private isTopLevel(): boolean {
        try {
            return this.host.self === this.host.top;
        } catch {
            return false;
        }
    }

    private handleOpenError(error: unknown, automatic: boolean): void {
        if (automatic) {
            this.autoPiPLastError = this.formatError(error);
        }
        this.log('warn', 'Picture-in-Picture request was rejected', error);

        if (!automatic) {
            const name = error instanceof DOMException ? error.name : '';
            const message = name === 'NotAllowedError'
                ? 'Браузер запретил Picture-in-Picture. Откройте его кнопкой и проверьте разрешения сайта.'
                : 'Не удалось открыть Picture-in-Picture.';

            this.showMessage(message);
        }
    }

    private formatError(error: unknown): string {
        if (error instanceof Error) {
            return `${error.name}: ${error.message}`;
        }

        return String(error);
    }

    private showMessage(message: string): void {
        if (!this.host.document.body) {
            this.log('warn', message);
            return;
        }

        this.toast?.remove();
        const toast = this.host.document.createElement('div');

        toast.textContent = message;
        toast.setAttribute('role', 'status');
        Object.assign(toast.style, {
            background: 'rgba(17, 24, 39, .96)',
            borderRadius: '8px',
            bottom: '88px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, .35)',
            color: '#fff',
            font: '14px/1.4 sans-serif',
            left: '50%',
            maxWidth: '420px',
            padding: '11px 15px',
            position: 'fixed',
            textAlign: 'center',
            transform: 'translateX(-50%)',
            zIndex: '100000'
        });
        this.host.document.body.appendChild(toast);
        this.toast = toast;

        if (this.toastTimer !== undefined) {
            this.host.clearTimeout(this.toastTimer);
        }
        this.toastTimer = this.host.setTimeout(() => {
            toast.remove();
            if (this.toast === toast) {
                this.toast = undefined;
            }
        }, 5_000);
    }

    private log(level: 'error' | 'warn', message: string, error?: unknown): void {
        const logger = this.host.console?.[level] ?? console[level];

        logger.call(this.host.console, `[JitsiBrowserPiP] ${message}`, error ?? '');
    }
}
