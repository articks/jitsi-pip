export type PiPMode = 'document' | 'video' | 'none';

export interface BrowserPiPConfig {
    autoOpen: boolean;
    buttonText: string;
    closeAutoOnReturn: boolean;
    enabled: boolean;
    maxParticipants: number;
}

export interface JitsiParticipant {
    avatarURL?: string;
    displayName?: string;
    dominantSpeaker?: boolean;
    fakeParticipant?: string;
    id: string;
    loadableAvatarUrl?: string;
    local?: boolean;
    name?: string;
}

export interface JitsiTrack {
    attach: (element: HTMLMediaElement) => unknown;
    detach?: (element: HTMLMediaElement) => unknown;
    getParticipantId?: () => string;
    getTrack?: () => MediaStreamTrack;
    getType?: () => string;
    getVideoType?: () => string;
    isMuted?: () => boolean;
}

export interface JitsiTrackState {
    jitsiTrack?: JitsiTrack;
    local?: boolean;
    mediaType?: string;
    muted?: boolean;
    participantId?: string;
    streamingStatus?: string;
    videoType?: string | null;
}

export interface JitsiParticipantsState {
    activeSpeakers?: Set<string> | string[];
    dominantSpeaker?: string;
    local?: JitsiParticipant;
    remote?: Map<string, JitsiParticipant> | Record<string, JitsiParticipant>;
    speakersList?: Map<string, unknown> | Array<[string, unknown]>;
}

export type JitsiReduxState = Record<string, unknown> & {
    'features/base/participants'?: JitsiParticipantsState;
    'features/base/tracks'?: JitsiTrackState[];
};

export interface JitsiStore {
    dispatch?: (action: {
        config?: Record<string, unknown>;
        type: string;
    }) => unknown;
    getState: () => JitsiReduxState;
    subscribe: (listener: () => void) => () => void;
}

export interface JitsiConference {
    hangup?: (requestFeedback?: boolean) => unknown;
    isJoined?: () => boolean;
    isLocalAudioMuted?: () => boolean;
    isLocalVideoMuted?: () => boolean;
    toggleAudioMuted?: (showUI?: boolean) => unknown;
    toggleVideoMuted?: (showUI?: boolean, ensureTrack?: boolean) => unknown;
}

export interface JitsiApi {
    notifyToolbarButtonClicked?: (key: string, preventExecution?: boolean) => unknown;
}

export interface JitsiApp {
    API?: JitsiApi;
    conference?: JitsiConference;
    store?: JitsiStore;
}

export interface JitsiCustomToolbarButton {
    backgroundColor?: string;
    icon: string;
    id: string;
    text: string;
}

export interface JitsiGlobalConfig extends Record<string, unknown> {
    browserPip?: Partial<BrowserPiPConfig>;
    customToolbarButtons?: JitsiCustomToolbarButton[];
}

export interface DocumentPictureInPictureController extends EventTarget {
    requestWindow: (options?: {
        disallowReturnToOpener?: boolean;
        height?: number;
        preferInitialWindowPlacement?: boolean;
        width?: number;
    }) => Promise<Window>;
    readonly window: Window | null;
}

export interface PiPState {
    autoPiP: {
        captureActive: boolean;
        eventReceived: boolean;
        handlerRegistered: boolean;
        lastError?: string;
        lastReason?: string;
        protocolEligible: boolean;
        ready: boolean;
        secureContext: boolean;
        suppressedByUser: boolean;
    };
    automatic: boolean;
    destroyed: boolean;
    mode: PiPMode;
    open: boolean;
    participants: string[];
    pending: boolean;
}

export interface JitsiBrowserPiPPublicApi {
    close: () => Promise<void>;
    destroy: () => void;
    getState: () => PiPState;
    open: () => Promise<boolean>;
    readonly version: string;
}

export type JitsiHostWindow = Window & typeof globalThis & {
    APP?: JitsiApp;
    JitsiBrowserPiP?: JitsiBrowserPiPPublicApi;
    config?: JitsiGlobalConfig;
    documentPictureInPicture?: DocumentPictureInPictureController;
};

export interface SelectedParticipant {
    participant: JitsiParticipant;
    track?: JitsiTrack;
}
