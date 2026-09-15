import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_CONFIG } from '../src/config';
import { isAutoPiPProtocolEligible, JitsiMeetPiPPlugin } from '../src/plugin';
import type {
    DocumentPictureInPictureController,
    JitsiApi,
    JitsiHostWindow,
    JitsiParticipant,
    JitsiReduxState,
    JitsiStore,
    JitsiTrack
} from '../src/types';

function createStore(initial: JitsiReduxState): JitsiStore & { setState: (state: JitsiReduxState) => void } {
    let state = initial;
    const listeners = new Set<() => void>();

    return {
        dispatch: action => {
            if (action.type === 'OVERWRITE_CONFIG' && action.config) {
                const currentConfig = state['features/base/config'];

                state = {
                    ...state,
                    'features/base/config': {
                        ...(currentConfig && typeof currentConfig === 'object' ? currentConfig : {}),
                        ...action.config
                    }
                };
                listeners.forEach(listener => listener());
            }

            return action;
        },
        getState: () => state,
        setState: next => {
            state = next;
            listeners.forEach(listener => listener());
        },
        subscribe: listener => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
}

function createPiPWindow(): Window {
    const pipDocument = document.implementation.createHTMLDocument('PiP');
    const target = new EventTarget();
    const fake = {
        addEventListener: target.addEventListener.bind(target),
        close: vi.fn(),
        closed: false,
        document: pipDocument,
        dispatchEvent: target.dispatchEvent.bind(target),
        removeEventListener: target.removeEventListener.bind(target)
    };

    return fake as unknown as Window;
}

function conferenceState(participants: JitsiParticipant[], track?: JitsiTrack): JitsiReduxState {
    const dominant = participants[0]?.id;

    return {
        'features/base/participants': {
            activeSpeakers: new Set(participants.slice(1).map(item => item.id)),
            dominantSpeaker: dominant,
            remote: new Map(participants.map(item => [ item.id, item ]))
        },
        'features/base/tracks': track && dominant
            ? [ { jitsiTrack: track, mediaType: 'video', participantId: dominant, videoType: 'camera' } ]
            : []
    };
}

describe('JitsiMeetPiPPlugin', () => {
    beforeEach(() => {
        document.body.replaceChildren();
        delete (window as unknown as JitsiHostWindow).documentPictureInPicture;
        delete (window as unknown as JitsiHostWindow).APP;
        Reflect.deleteProperty(HTMLVideoElement.prototype, 'requestPictureInPicture');
        Reflect.deleteProperty(document, 'exitPictureInPicture');
        Reflect.deleteProperty(document, 'pictureInPictureEnabled');
        Reflect.deleteProperty(document, 'pictureInPictureElement');
        Object.defineProperty(navigator, 'mediaSession', { configurable: true, value: undefined });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    });

    it('matches Chromium Auto PiP protocol eligibility', () => {
        expect(isAutoPiPProtocolEligible('https:')).toBe(true);
        expect(isAutoPiPProtocolEligible('file:')).toBe(true);
        expect(isAutoPiPProtocolEligible('http:')).toBe(false);
    });

    it('opens Document PiP from the custom toolbar event and preserves the original API method', async () => {
        const host = window as unknown as JitsiHostWindow;
        const originalNotify = vi.fn();
        const api: JitsiApi = { notifyToolbarButtonClicked: originalNotify };
        const track = { attach: vi.fn(), detach: vi.fn() } as unknown as JitsiTrack;
        const store = createStore(conferenceState([
            { id: 'a', name: 'Alice' },
            { id: 'b', name: 'Bob' }
        ], track));
        const pipWindow = createPiPWindow();
        const requestWindow = vi.fn().mockResolvedValue(pipWindow);

        host.documentPictureInPicture = {
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            removeEventListener: vi.fn(),
            requestWindow,
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = { API: api, conference: {}, store };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        api.notifyToolbarButtonClicked?.('browser-pip', false);
        expect(requestWindow).toHaveBeenCalledOnce();
        expect(requestWindow).toHaveBeenCalledWith({
            height: 480,
            preferInitialWindowPlacement: true,
            width: 240
        });
        await Promise.resolve();

        expect(originalNotify).toHaveBeenCalledWith('browser-pip', false);
        expect(plugin.getState()).toMatchObject({ mode: 'document', open: true, participants: [ 'b' ] });
        expect(pipWindow.document.querySelector('.jmp-screen-share')?.classList.contains('is-speaker'))
            .toBe(true);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Alice');
        expect(pipWindow.document.querySelectorAll('.jmp-tile')).toHaveLength(2);
        expect(track.attach).toHaveBeenCalledWith(
            pipWindow.document.querySelector('.jmp-screen-share-video')
        );

        plugin.destroy();
        expect(api.notifyToolbarButtonClicked).toBe(originalNotify);
        expect(track.detach).toHaveBeenCalled();
    });

    it('shows a large screen share above four active participants and removes it cleanly', async () => {
        const host = window as unknown as JitsiHostWindow;
        const api: JitsiApi = { notifyToolbarButtonClicked: vi.fn() };
        const screenTrack = {
            attach: vi.fn(),
            detach: vi.fn(),
            getSourceName: () => 'a-desktop-1',
            getVideoType: () => 'desktop'
        } as unknown as JitsiTrack;
        const participants: JitsiParticipant[] = [
            { id: 'a', name: 'Alice' },
            { id: 'b', name: 'Bob' },
            { id: 'c', name: 'Carol' },
            { id: 'd', name: 'Dave' }
        ];
        const screenParticipant = {
            fakeParticipant: 'RemoteScreenShare',
            id: 'a-desktop-1',
            name: 'Alice'
        };
        const stateWithScreen: JitsiReduxState = {
            'features/base/participants': {
                activeSpeakers: new Set([ 'b', 'c', 'd' ]),
                dominantSpeaker: 'a',
                local: { id: 'local', local: true, name: 'Me' },
                remote: new Map([
                    ...participants.map(item => [ item.id, item ] as const),
                    [ screenParticipant.id, screenParticipant ]
                ])
            },
            'features/base/tracks': [
                {
                    jitsiTrack: screenTrack,
                    mediaType: 'video',
                    participantId: 'a',
                    videoType: 'desktop'
                }
            ],
            'features/large-video': { participantId: 'a-desktop-1' },
            'features/lobby': {
                knockingParticipants: [ { id: 'waiting-1' }, { id: 'waiting-2' } ]
            },
            'features/video-layout': { remoteScreenShares: [ 'a-desktop-1' ] }
        };
        const store = createStore(stateWithScreen);
        const pipWindow = createPiPWindow();

        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = { API: api, conference: {}, store };

        const plugin = new JitsiMeetPiPPlugin(host, {
            ...DEFAULT_CONFIG,
            lobbyLabel: 'Ожидают',
            noScreenShareLabel: 'No active sharing',
            participantsLabel: 'Всего',
            screenShareLabel: 'Sharing',
            windowTitle: 'Test PiP'
        });

        plugin.start();
        await plugin.open();

        const screenRoot = pipWindow.document.querySelector<HTMLElement>('.jmp-screen-share');

        expect(pipWindow.document.title).toBe('Test PiP');
        expect(screenRoot?.hidden).toBe(false);
        expect(pipWindow.document.querySelector('.jmp-content')?.classList.contains('has-screen-share')).toBe(true);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent)
            .toBe('Sharing — Alice');
        expect(pipWindow.document.querySelectorAll('.jmp-grid .jmp-tile')).toHaveLength(4);
        expect(pipWindow.document.querySelector('.jmp-grid .jmp-tile')?.textContent).toContain('Me');
        expect(pipWindow.document.querySelector('.jmp-grid .jmp-tile')?.classList.contains('is-local')).toBe(true);
        expect(plugin.getState().participants).toEqual([ 'local', 'a', 'b', 'c' ]);
        expect(plugin.getState().participantCounts).toEqual({ conference: 5, lobby: 2 });
        expect(pipWindow.document.querySelector('.jmp-participant-counts')?.textContent)
            .toBe('Всего: 5 · Ожидают: 2');
        expect(screenTrack.attach).toHaveBeenCalledWith(
            pipWindow.document.querySelector('.jmp-screen-share-video')
        );
        expect(plugin.getState().screenShare).toMatchObject({
            id: 'a-desktop-1',
            local: false
        });

        store.setState(conferenceState(participants));

        expect(screenRoot?.hidden).toBe(false);
        expect(screenRoot?.classList.contains('is-speaker')).toBe(true);
        expect(screenRoot?.classList.contains('is-empty')).toBe(false);
        expect(screenRoot?.getAttribute('aria-label')).toBe('Alice');
        expect(pipWindow.document.querySelector<HTMLVideoElement>('.jmp-screen-share-video')?.hidden).toBe(true);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Alice');
        expect(pipWindow.document.querySelector<HTMLElement>('.jmp-featured-avatar')?.hidden).toBe(false);
        expect(pipWindow.document.querySelector('.jmp-featured-avatar')?.textContent).toBe('AL');
        expect(pipWindow.document.querySelector('.jmp-content')?.classList.contains('has-screen-share')).toBe(true);
        expect(plugin.getState().participants).toEqual([ 'b', 'c', 'd' ]);
        expect(pipWindow.document.querySelector('.jmp-grid')?.textContent).not.toContain('Alice');
        expect(plugin.getState().participantCounts).toEqual({ conference: 4, lobby: 0 });
        expect(pipWindow.document.querySelector('.jmp-participant-counts')?.textContent)
            .toBe('Всего: 4 · Ожидают: 0');
        expect(screenTrack.detach).toHaveBeenCalled();
        expect(plugin.getState().screenShare).toBeUndefined();
        plugin.destroy();
    });

    it('moves the dominant speaker between the featured tile and lower grid when sharing changes', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();
        const cameraTrack = {
            attach: vi.fn(),
            detach: vi.fn(),
            getVideoType: () => 'camera'
        } as unknown as JitsiTrack;
        const screenTrack = {
            attach: vi.fn(),
            detach: vi.fn(),
            getSourceName: () => 'a-desktop-1',
            getVideoType: () => 'desktop'
        } as unknown as JitsiTrack;
        const participants: JitsiParticipant[] = [
            { id: 'a', name: 'Alice' },
            { id: 'b', name: 'Bob' },
            { id: 'c', name: 'Carol' },
            { id: 'd', name: 'Dave' }
        ];
        const participantState = {
            activeSpeakers: new Set([ 'b', 'c', 'd' ]),
            dominantSpeaker: 'a',
            local: { id: 'local', local: true, name: 'Me' },
            remote: new Map(participants.map(item => [ item.id, item ] as const))
        };
        const stateWithoutScreen: JitsiReduxState = {
            'features/base/participants': participantState,
            'features/base/tracks': [ {
                jitsiTrack: cameraTrack,
                mediaType: 'video',
                participantId: 'a',
                videoType: 'camera'
            } ]
        };
        const stateWithScreen: JitsiReduxState = {
            'features/base/participants': {
                ...participantState,
                remote: new Map([
                    ...participants.map(item => [ item.id, item ] as const),
                    [ 'a-desktop-1', {
                        fakeParticipant: 'RemoteScreenShare',
                        id: 'a-desktop-1',
                        name: 'Alice'
                    } ]
                ])
            },
            'features/base/tracks': [
                ...(stateWithoutScreen['features/base/tracks'] ?? []),
                {
                    jitsiTrack: screenTrack,
                    mediaType: 'video',
                    participantId: 'a',
                    videoType: 'desktop'
                }
            ],
            'features/large-video': { participantId: 'a-desktop-1' },
            'features/video-layout': { remoteScreenShares: [ 'a-desktop-1' ] }
        };
        const stateWithoutScreenBob: JitsiReduxState = {
            ...stateWithoutScreen,
            'features/base/participants': {
                ...participantState,
                activeSpeakers: new Set([ 'c', 'd', 'a' ]),
                dominantSpeaker: 'b'
            }
        };
        const store = createStore(stateWithoutScreen);

        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, {
            ...DEFAULT_CONFIG,
            screenShareLabel: 'Sharing'
        });

        plugin.start();
        await plugin.open();

        const featuredVideo = pipWindow.document.querySelector<HTMLVideoElement>('.jmp-screen-share-video');

        expect(pipWindow.document.querySelector('.jmp-screen-share')?.classList.contains('is-speaker'))
            .toBe(true);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Alice');
        expect(plugin.getState().participants).toEqual([ 'local', 'b', 'c', 'd' ]);
        expect(pipWindow.document.querySelector('.jmp-grid')?.textContent).not.toContain('Alice');
        expect(cameraTrack.attach).toHaveBeenCalledWith(featuredVideo);

        const initialCameraAttachCount = vi.mocked(cameraTrack.attach).mock.calls.length;

        store.setState(stateWithoutScreen);
        expect(cameraTrack.attach).toHaveBeenCalledTimes(initialCameraAttachCount);

        store.setState(stateWithoutScreenBob);

        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Bob');
        expect(plugin.getState().participants).toEqual([ 'local', 'c', 'd', 'a' ]);
        expect(pipWindow.document.querySelector('.jmp-grid')?.textContent).not.toContain('Bob');

        store.setState(stateWithoutScreen);

        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Alice');
        expect(plugin.getState().participants).toEqual([ 'local', 'b', 'c', 'd' ]);
        expect(pipWindow.document.querySelector('.jmp-grid')?.textContent).not.toContain('Alice');

        store.setState(stateWithScreen);

        const aliceSmallTile = Array.from(
            pipWindow.document.querySelectorAll<HTMLElement>('.jmp-grid .jmp-tile')
        ).find(tile => tile.textContent?.includes('Alice'));
        const aliceSmallVideo = aliceSmallTile?.querySelector<HTMLVideoElement>('.jmp-video');

        expect(pipWindow.document.querySelector('.jmp-screen-share')?.classList.contains('is-screen-share'))
            .toBe(true);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent)
            .toBe('Sharing — Alice');
        expect(plugin.getState().participants).toEqual([ 'local', 'a', 'b', 'c' ]);
        expect(aliceSmallVideo).not.toBeNull();
        expect(cameraTrack.detach).toHaveBeenCalledWith(featuredVideo);
        expect(cameraTrack.attach).toHaveBeenCalledWith(aliceSmallVideo);
        expect(screenTrack.attach).toHaveBeenCalledWith(featuredVideo);

        store.setState({
            ...stateWithScreen,
            'features/base/participants': {
                ...stateWithScreen['features/base/participants'],
                activeSpeakers: new Set([ 'c', 'd' ]),
                dominantSpeaker: 'b'
            }
        });

        expect(plugin.getState().participants).toEqual([ 'local', 'b', 'c', 'd' ]);
        expect(pipWindow.document.querySelector('.jmp-grid')?.textContent).not.toContain('Alice');
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent)
            .toBe('Sharing — Alice');

        store.setState(stateWithoutScreen);

        expect(pipWindow.document.querySelector('.jmp-screen-share')?.classList.contains('is-speaker'))
            .toBe(true);
        expect(plugin.getState().participants).toEqual([ 'local', 'b', 'c', 'd' ]);
        expect(cameraTrack.detach).toHaveBeenCalledWith(aliceSmallVideo);
        expect(screenTrack.detach).toHaveBeenCalledWith(featuredVideo);
        plugin.destroy();
    });

    it('keeps the local camera card below a local screen share', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();
        const localCameraTrack = {
            attach: vi.fn(),
            detach: vi.fn(),
            getVideoType: () => 'camera'
        } as unknown as JitsiTrack;
        const localScreenTrack = {
            attach: vi.fn(),
            detach: vi.fn(),
            getSourceName: () => 'local-desktop-1',
            getVideoType: () => 'desktop'
        } as unknown as JitsiTrack;
        const store = createStore({
            'features/base/participants': {
                dominantSpeaker: 'a',
                local: { id: 'local', local: true, name: 'Me' },
                localScreenShare: {
                    fakeParticipant: 'LocalScreenShare',
                    id: 'local-desktop-1',
                    name: 'Me'
                },
                remote: new Map([ [ 'a', { id: 'a', name: 'Alice' } ] ])
            },
            'features/base/tracks': [
                {
                    jitsiTrack: localCameraTrack,
                    local: true,
                    mediaType: 'video',
                    participantId: 'local',
                    videoType: 'camera'
                },
                {
                    jitsiTrack: localScreenTrack,
                    local: true,
                    mediaType: 'video',
                    participantId: 'local',
                    videoType: 'desktop'
                }
            ]
        });

        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        await plugin.open();

        const featuredVideo = pipWindow.document.querySelector<HTMLVideoElement>('.jmp-screen-share-video');
        const localTile = pipWindow.document.querySelector<HTMLElement>('.jmp-grid .jmp-tile.is-local');
        const localVideo = localTile?.querySelector<HTMLVideoElement>('.jmp-video');

        expect(plugin.getState().screenShare).toMatchObject({ local: true });
        expect(plugin.getState().participants).toEqual([ 'local', 'a' ]);
        expect(localScreenTrack.attach).toHaveBeenCalledWith(featuredVideo);
        expect(localCameraTrack.attach).toHaveBeenCalledWith(localVideo);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent)
            .toBe(`${DEFAULT_CONFIG.screenShareLabel} — ${DEFAULT_CONFIG.youLabel}`);

        plugin.destroy();
        expect(localScreenTrack.detach).toHaveBeenCalledWith(featuredVideo);
        expect(localCameraTrack.detach).toHaveBeenCalledWith(localVideo);
    });

    it('restores its toolbar button after Jitsi replaces the asynchronously loaded config', () => {
        const host = window as unknown as JitsiHostWindow;
        const existingButton = { icon: '/existing.svg', id: 'existing', text: 'Existing' };
        const store = createStore({
            ...conferenceState([]),
            'features/base/config': { customToolbarButtons: [ existingButton ] }
        });

        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, {
            ...DEFAULT_CONFIG,
            disableCameraLabel: 'Turn camera off',
            disableMicrophoneLabel: 'Mute',
            enableCameraLabel: 'Turn camera on',
            enableMicrophoneLabel: 'Unmute',
            hangupLabel: 'Leave',
            returnToConferenceLabel: 'Return'
        });

        plugin.start();

        const firstButtons = (store.getState()['features/base/config'] as {
            customToolbarButtons: Array<{ id: string }>;
        }).customToolbarButtons;

        expect(firstButtons.map(button => button.id)).toEqual([ 'existing', 'browser-pip' ]);

        store.setState({
            ...conferenceState([]),
            'features/base/config': { customToolbarButtons: [ existingButton ] }
        });

        const restoredButtons = (store.getState()['features/base/config'] as {
            customToolbarButtons: Array<{ id: string }>;
        }).customToolbarButtons;

        expect(restoredButtons.map(button => button.id)).toEqual([ 'existing', 'browser-pip' ]);
        plugin.destroy();
    });

    it('updates conference controls from the PiP document', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();
        const toggleAudioMuted = vi.fn();
        const toggleVideoMuted = vi.fn();
        const hangup = vi.fn();
        const store = createStore(conferenceState([ { id: 'a', name: 'Alice' } ]));
        let audioMuted = true;
        let videoMuted = false;

        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {
                hangup,
                isLocalAudioMuted: () => audioMuted,
                isLocalVideoMuted: () => videoMuted,
                toggleAudioMuted,
                toggleVideoMuted
            },
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, {
            ...DEFAULT_CONFIG,
            disableCameraLabel: 'Turn camera off',
            disableMicrophoneLabel: 'Mute',
            enableCameraLabel: 'Turn camera on',
            enableMicrophoneLabel: 'Unmute',
            hangupLabel: 'Leave',
            returnToConferenceLabel: 'Return'
        });

        plugin.start();
        await plugin.open();

        const controls = pipWindow.document.querySelectorAll<HTMLButtonElement>('.jmp-control');

        expect(controls).toHaveLength(4);
        expect(controls[0].classList.contains('is-muted')).toBe(true);
        expect(controls[0].querySelector('.jmp-icon-slash')).not.toBeNull();
        expect(controls[0].getAttribute('aria-label')).toBe('Unmute');
        expect(controls[1].classList.contains('is-muted')).toBe(false);
        expect(controls[1].querySelector('.jmp-icon-slash')).toBeNull();
        expect(controls[1].getAttribute('aria-label')).toBe('Turn camera off');
        expect(controls[2].getAttribute('aria-label')).toBe('Return');
        expect(controls[3].getAttribute('aria-label')).toBe('Leave');
        expect(controls[3].querySelector('.jmp-icon-hangup')).not.toBeNull();
        expect(controls[3].querySelector('svg')?.classList.contains('jmp-icon-fill')).toBe(true);

        audioMuted = false;
        videoMuted = true;
        store.setState(conferenceState([ { id: 'a', name: 'Alice' } ]));

        expect(controls[0].querySelector('.jmp-icon-slash')).toBeNull();
        expect(controls[0].getAttribute('aria-label')).toBe('Mute');
        expect(controls[1].querySelector('.jmp-icon-slash')).not.toBeNull();
        expect(controls[1].getAttribute('aria-label')).toBe('Turn camera on');
        controls[0].click();
        controls[1].click();
        controls[3].click();

        expect(toggleAudioMuted).toHaveBeenCalledWith(false);
        expect(toggleVideoMuted).toHaveBeenCalledWith(false, true);
        expect(hangup).toHaveBeenCalledWith(false);
        plugin.destroy();
    });

    it('updates participant tiles and detaches tracks when speakers change', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();
        const track = { attach: vi.fn(), detach: vi.fn() } as unknown as JitsiTrack;
        const store = createStore(conferenceState([
            { id: 'a', name: 'Alice' },
            { id: 'b', name: 'Bob' }
        ], track));

        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        await plugin.open();
        expect(pipWindow.document.querySelectorAll('.jmp-tile')).toHaveLength(2);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Alice');
        expect(plugin.getState().participants).toEqual([ 'b' ]);

        store.setState(conferenceState([ { id: 'b', name: 'Bob' } ]));

        const tiles = pipWindow.document.querySelectorAll('.jmp-tile');

        expect(tiles).toHaveLength(2);
        expect(Array.from(tiles).every(tile => tile.classList.contains('jmp-placeholder'))).toBe(true);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Bob');
        expect(plugin.getState().participants).toEqual([]);
        expect(track.detach).toHaveBeenCalled();

        const attachCount = vi.mocked(track.attach).mock.calls.length;

        plugin.destroy();
        store.setState(conferenceState([ { id: 'a', name: 'Alice' } ], track));
        expect(track.attach).toHaveBeenCalledTimes(attachCount);
    });

    it('pads one or three participant cards to an even two-by-two layout', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();
        const store = createStore({
            'features/base/participants': {
                local: { id: 'local', local: true, name: 'Me' },
                remote: new Map()
            }
        });

        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, {
            ...DEFAULT_CONFIG,
            waitingParticipantLabel: 'Waiting for participant'
        });

        plugin.start();
        await plugin.open();

        const grid = pipWindow.document.querySelector<HTMLElement>('.jmp-grid');

        expect(grid?.dataset.count).toBe('2');
        expect(pipWindow.document.querySelector('.jmp-screen-share')?.classList.contains('is-empty')).toBe(true);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('');
        expect(pipWindow.document.querySelector('.jmp-screen-share-label svg')).not.toBeNull();
        expect(pipWindow.document.querySelector('.jmp-screen-share')?.getAttribute('aria-label'))
            .toBe(DEFAULT_CONFIG.noActiveSpeakerLabel);
        expect(grid?.querySelectorAll('.jmp-tile')).toHaveLength(2);
        expect(grid?.querySelectorAll('.jmp-placeholder')).toHaveLength(1);
        expect(grid?.querySelector('.jmp-placeholder')?.textContent).toBe('');
        expect(grid?.querySelector('.jmp-placeholder')?.getAttribute('aria-label'))
            .toBe('Waiting for participant');
        expect(grid?.querySelector('.jmp-placeholder svg')).not.toBeNull();

        store.setState({
            'features/base/participants': {
                activeSpeakers: new Set([ 'b', 'c' ]),
                dominantSpeaker: 'a',
                local: { id: 'local', local: true, name: 'Me' },
                remote: new Map([
                    [ 'a', { id: 'a', name: 'Alice' } ],
                    [ 'b', { id: 'b', name: 'Bob' } ],
                    [ 'c', { id: 'c', name: 'Carol' } ]
                ])
            }
        });

        expect(grid?.dataset.count).toBe('4');
        expect(grid?.querySelectorAll('.jmp-tile')).toHaveLength(4);
        expect(grid?.querySelectorAll('.jmp-placeholder')).toHaveLength(1);
        expect(plugin.getState().participants).toEqual([ 'local', 'b', 'c' ]);
        expect(pipWindow.document.querySelector('.jmp-screen-share-label')?.textContent).toBe('Alice');
        plugin.destroy();
    });

    it('opens through Media Session and closes an automatic window on return', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();
        const handlers = new Map<string, ((details?: {
            enterPictureInPictureReason?: string;
            reason?: string;
        }) => void) | null>();
        const setActionHandler = vi.fn((action: string, handler: ((details?: {
            enterPictureInPictureReason?: string;
            reason?: string;
        }) => void) | null) => {
            handlers.set(action, handler);
        });

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: { setActionHandler }
        });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([ { id: 'a', name: 'Alice' } ]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        handlers.get('enterpictureinpicture')?.({
            enterPictureInPictureReason: 'contentoccluded'
        });
        await Promise.resolve();

        expect(plugin.getState()).toMatchObject({ automatic: true, open: true });

        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));
        await Promise.resolve();

        expect(pipWindow.close).toHaveBeenCalled();
        expect(plugin.getState()).toMatchObject({
            autoPiP: { suppressedByUser: false },
            open: false
        });
        plugin.destroy();
        expect(setActionHandler).toHaveBeenCalledWith('enterpictureinpicture', null);
    });

    it('does not auto-open again after the user closes an automatic Document PiP window', async () => {
        const host = window as unknown as JitsiHostWindow;
        const firstPiPWindow = createPiPWindow();
        const secondPiPWindow = createPiPWindow();
        const handlers = new Map<string, ((details?: {
            enterPictureInPictureReason?: string;
        }) => void) | null>();

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: {
                setActionHandler: (action: string, handler: ((details?: {
                    enterPictureInPictureReason?: string;
                }) => void) | null) => handlers.set(action, handler)
            }
        });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        const requestWindow = vi.fn()
            .mockResolvedValueOnce(firstPiPWindow)
            .mockResolvedValueOnce(secondPiPWindow);

        host.documentPictureInPicture = {
            requestWindow,
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([ { id: 'a', name: 'Alice' } ]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        handlers.get('enterpictureinpicture')?.({
            enterPictureInPictureReason: 'contentoccluded'
        });
        await Promise.resolve();
        firstPiPWindow.dispatchEvent(new Event('pagehide'));

        expect(plugin.getState()).toMatchObject({
            autoPiP: { ready: false, suppressedByUser: true },
            automatic: false,
            open: false
        });

        handlers.get('enterpictureinpicture')?.({
            enterPictureInPictureReason: 'contentoccluded'
        });
        await Promise.resolve();
        expect(requestWindow).toHaveBeenCalledOnce();

        await expect(plugin.open()).resolves.toBe(true);
        expect(requestWindow).toHaveBeenCalledTimes(2);
        expect(plugin.getState()).toMatchObject({ automatic: false, open: true });
        plugin.destroy();
    });

    it('keeps Media Session PiP opened from an explicit browser user action', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();
        const handlers = new Map<string, ((details?: { reason?: string }) => void) | null>();

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: {
                setActionHandler: (action: string, handler: ((details?: { reason?: string }) => void) | null) => {
                    handlers.set(action, handler);
                }
            }
        });
        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([ { id: 'a', name: 'Alice' } ]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        handlers.get('enterpictureinpicture')?.({ reason: 'useraction' });
        await Promise.resolve();

        expect(plugin.getState()).toMatchObject({ automatic: false, open: true });
        document.dispatchEvent(new Event('visibilitychange'));
        expect(pipWindow.close).not.toHaveBeenCalled();
        plugin.destroy();
    });

    it('explains a rejected automatic Document PiP request after returning to Jitsi', async () => {
        const host = window as unknown as JitsiHostWindow;
        const handlers = new Map<string, ((details?: {
            enterPictureInPictureReason?: string;
        }) => void) | null>();

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: {
                setActionHandler: (action: string, handler: ((details?: {
                    enterPictureInPictureReason?: string;
                }) => void) | null) => handlers.set(action, handler)
            }
        });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        handlers.get('enterpictureinpicture')?.({
            enterPictureInPictureReason: 'contentoccluded'
        });
        await Promise.resolve();
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 0));

        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));

        await vi.waitFor(() => {
            expect(document.querySelector('[role="status"]')?.textContent)
                .toContain('Chrome отклонил Auto PiP');
        });
        plugin.destroy();
    });

    it('publishes local capture state to Media Session and explains missing Auto PiP eligibility', () => {
        const host = window as unknown as JitsiHostWindow;
        const setCameraActive = vi.fn();
        const setMicrophoneActive = vi.fn();
        const liveTrack = {
            attach: vi.fn(),
            getTrack: () => ({ readyState: 'live' } as MediaStreamTrack),
            isMuted: () => false
        } as unknown as JitsiTrack;
        const store = createStore({
            ...conferenceState([]),
            'features/base/tracks': [
                { jitsiTrack: liveTrack, local: true, mediaType: 'audio', muted: false },
                { jitsiTrack: liveTrack, local: true, mediaType: 'video', muted: true }
            ]
        });

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: {
                setActionHandler: vi.fn(),
                setCameraActive,
                setMicrophoneActive
            }
        });
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        expect(setMicrophoneActive).toHaveBeenLastCalledWith(true);
        expect(setCameraActive).toHaveBeenLastCalledWith(false);

        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));

        expect(document.querySelector('[role="status"]')?.textContent)
            .toContain('Разрешите «Автоматическую картинку в картинке»');
        plugin.destroy();
    });

    it('re-arms Auto PiP when a live local capture track appears', () => {
        const host = window as unknown as JitsiHostWindow;
        const setActionHandler = vi.fn();
        const liveTrack = {
            attach: vi.fn(),
            getTrack: () => ({ readyState: 'live' } as MediaStreamTrack),
            isMuted: () => false
        } as unknown as JitsiTrack;
        const store = createStore(conferenceState([]));

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: { setActionHandler }
        });
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        const registrationsBeforeCapture = setActionHandler.mock.calls
            .filter(([ action ]) => action === 'enterpictureinpicture').length;

        expect(plugin.getState().autoPiP).toMatchObject({
            captureActive: false,
            handlerRegistered: true,
            ready: false,
            secureContext: true
        });

        store.setState({
            ...conferenceState([]),
            'features/base/tracks': [
                { jitsiTrack: liveTrack, local: true, mediaType: 'audio', muted: false }
            ]
        });

        const registrationsAfterCapture = setActionHandler.mock.calls
            .filter(([ action ]) => action === 'enterpictureinpicture').length;

        expect(registrationsAfterCapture).toBe(registrationsBeforeCapture + 1);
        expect(plugin.getState().autoPiP).toMatchObject({
            captureActive: true,
            handlerRegistered: true,
            ready: true
        });
        plugin.destroy();
    });

    it('explains that camera or microphone is required after an ineligible tab switch', () => {
        const host = window as unknown as JitsiHostWindow;

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: { setActionHandler: vi.fn() }
        });
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));

        expect(document.querySelector('[role="status"]')?.textContent)
            .toContain('сначала включите камеру или микрофон');
        plugin.destroy();
    });

    it('keeps a manually opened window when the Jitsi tab becomes visible', async () => {
        const host = window as unknown as JitsiHostWindow;
        const pipWindow = createPiPWindow();

        host.documentPictureInPicture = {
            requestWindow: vi.fn().mockResolvedValue(pipWindow),
            window: null
        } as unknown as DocumentPictureInPictureController;
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([ { id: 'a', name: 'Alice' } ]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        await plugin.open();
        document.dispatchEvent(new Event('visibilitychange'));

        expect(pipWindow.close).not.toHaveBeenCalled();
        expect(plugin.getState().open).toBe(true);
        plugin.destroy();
    });

    it('uses Video PiP fallback when Document PiP is unavailable', async () => {
        const host = window as unknown as JitsiHostWindow;
        const requestPictureInPicture = vi.fn().mockResolvedValue({});
        const dominantTrack = {
            attach: vi.fn(),
            detach: vi.fn(),
            getVideoType: () => 'camera'
        } as unknown as JitsiTrack;

        Object.defineProperty(host.document, 'pictureInPictureEnabled', {
            configurable: true,
            value: true
        });
        Object.defineProperty(host.HTMLVideoElement.prototype, 'requestPictureInPicture', {
            configurable: true,
            value: requestPictureInPicture
        });
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([
                { id: 'a', name: 'Alice' },
                { id: 'b', name: 'Bob' }
            ], dominantTrack))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        const video = document.querySelector<HTMLVideoElement>('#jitsi-meet-pip-fallback-video');

        expect(video).not.toBeNull();
        Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });

        await expect(plugin.open()).resolves.toBe(true);
        expect(requestPictureInPicture).toHaveBeenCalledOnce();
        expect(plugin.getState().mode).toBe('video');
        expect(plugin.getState().participants).toEqual([ 'b' ]);
        expect(dominantTrack.attach).toHaveBeenCalledWith(video);
        plugin.destroy();
    });

    it('suppresses another automatic Video PiP after the user exits it', async () => {
        const host = window as unknown as JitsiHostWindow;
        const handlers = new Map<string, ((details?: {
            enterPictureInPictureReason?: string;
        }) => void) | null>();
        const requestPictureInPicture = vi.fn().mockResolvedValue({});

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: {
                setActionHandler: (action: string, handler: ((details?: {
                    enterPictureInPictureReason?: string;
                }) => void) | null) => handlers.set(action, handler)
            }
        });
        Object.defineProperty(host.document, 'pictureInPictureEnabled', {
            configurable: true,
            value: true
        });
        Object.defineProperty(host.HTMLVideoElement.prototype, 'requestPictureInPicture', {
            configurable: true,
            value: requestPictureInPicture
        });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([ { id: 'a', name: 'Alice' } ]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        const video = document.querySelector<HTMLVideoElement>('#jitsi-meet-pip-fallback-video');

        expect(video).not.toBeNull();
        Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });
        handlers.get('enterpictureinpicture')?.({
            enterPictureInPictureReason: 'contentoccluded'
        });
        await Promise.resolve();
        video?.dispatchEvent(new Event('leavepictureinpicture'));

        expect(plugin.getState().autoPiP.suppressedByUser).toBe(true);
        handlers.get('enterpictureinpicture')?.({
            enterPictureInPictureReason: 'contentoccluded'
        });
        await Promise.resolve();
        expect(requestPictureInPicture).toHaveBeenCalledOnce();
        plugin.destroy();
    });

    it('does not suppress automatic Video PiP when the plugin closes it', async () => {
        const host = window as unknown as JitsiHostWindow;
        const handlers = new Map<string, ((details?: {
            enterPictureInPictureReason?: string;
        }) => void) | null>();

        Object.defineProperty(navigator, 'mediaSession', {
            configurable: true,
            value: {
                setActionHandler: (action: string, handler: ((details?: {
                    enterPictureInPictureReason?: string;
                }) => void) | null) => handlers.set(action, handler)
            }
        });
        Object.defineProperty(host.document, 'pictureInPictureEnabled', {
            configurable: true,
            value: true
        });
        Object.defineProperty(host.HTMLVideoElement.prototype, 'requestPictureInPicture', {
            configurable: true,
            value: vi.fn().mockResolvedValue({})
        });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        host.APP = {
            API: { notifyToolbarButtonClicked: vi.fn() },
            conference: {},
            store: createStore(conferenceState([ { id: 'a', name: 'Alice' } ]))
        };

        const plugin = new JitsiMeetPiPPlugin(host, DEFAULT_CONFIG);

        plugin.start();
        const video = document.querySelector<HTMLVideoElement>('#jitsi-meet-pip-fallback-video');

        expect(video).not.toBeNull();
        Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });
        handlers.get('enterpictureinpicture')?.({
            enterPictureInPictureReason: 'contentoccluded'
        });
        await Promise.resolve();
        Object.defineProperty(document, 'pictureInPictureElement', {
            configurable: true,
            value: video
        });
        Object.defineProperty(document, 'exitPictureInPicture', {
            configurable: true,
            value: vi.fn(() => {
                video?.dispatchEvent(new Event('leavepictureinpicture'));
                return Promise.resolve();
            })
        });

        await plugin.close();
        expect(plugin.getState().autoPiP.suppressedByUser).toBe(false);
        plugin.destroy();
    });
});
