import { describe, expect, it, vi } from 'vitest';

import {
    participantInitials,
    selectActiveParticipants,
    selectCameraTrack,
    selectLocalCameraTrack,
    selectParticipantsWithTracks,
    selectScreenShare
} from '../src/participants';
import type { JitsiParticipant, JitsiReduxState, JitsiTrack } from '../src/types';

function participant(id: string, extra: Partial<JitsiParticipant> = {}): JitsiParticipant {
    return { id, name: `User ${id}`, ...extra };
}

describe('active participant selection', () => {
    it('puts dominant speaker first, de-duplicates and excludes fake/local participants', () => {
        const state: JitsiReduxState = {
            'features/base/participants': {
                activeSpeakers: new Set([ 'b', 'a', 'screen', 'local' ]),
                dominantSpeaker: 'a',
                remote: new Map([
                    [ 'a', participant('a') ],
                    [ 'b', participant('b') ],
                    [ 'screen', participant('screen', { fakeParticipant: 'RemoteScreenShare' }) ],
                    [ 'local', participant('local', { local: true }) ]
                ])
            }
        };

        expect(selectActiveParticipants(state, 4).map(item => item.id)).toEqual([ 'a', 'b' ]);
    });

    it('never returns more than four participants', () => {
        const remote = new Map<string, JitsiParticipant>();
        const active = [];

        for (let index = 0; index < 8; index += 1) {
            const id = String(index);

            remote.set(id, participant(id));
            active.push(id);
        }

        const state: JitsiReduxState = {
            'features/base/participants': { activeSpeakers: active, remote }
        };

        expect(selectActiveParticipants(state, 10)).toHaveLength(4);
    });

    it('fills silent conferences with connected remote participants', () => {
        const state: JitsiReduxState = {
            'features/base/participants': {
                remote: new Map([
                    [ 'a', participant('a') ],
                    [ 'b', participant('b') ],
                    [ 'screen', participant('screen', { fakeParticipant: 'RemoteScreenShare' }) ]
                ]),
                speakersList: new Map()
            }
        };

        expect(selectActiveParticipants(state, 4).map(item => item.id)).toEqual([ 'a', 'b' ]);
    });

    it('keeps speakers first and fills remaining positions in connection order', () => {
        const state: JitsiReduxState = {
            'features/base/participants': {
                dominantSpeaker: 'b',
                remote: new Map([
                    [ 'a', participant('a') ],
                    [ 'b', participant('b') ],
                    [ 'c', participant('c') ],
                    [ 'd', participant('d') ]
                ]),
                speakersList: new Map([ [ 'c', 'User c' ] ])
            }
        };

        expect(selectActiveParticipants(state, 4).map(item => item.id))
            .toEqual([ 'b', 'c', 'a', 'd' ]);
    });

    it('selects an unmuted camera track instead of desktop media', () => {
        const camera = { attach: vi.fn(), getVideoType: () => 'camera' } as JitsiTrack;
        const desktop = { attach: vi.fn(), getVideoType: () => 'desktop' } as JitsiTrack;
        const state: JitsiReduxState = {
            'features/base/tracks': [
                { jitsiTrack: desktop, mediaType: 'video', participantId: 'a', videoType: 'desktop' },
                { jitsiTrack: camera, mediaType: 'video', participantId: 'a', videoType: 'camera' }
            ]
        };

        expect(selectCameraTrack(state, 'a')).toBe(camera);
    });

    it('combines selected participants with tracks', () => {
        const camera = { attach: vi.fn() } as unknown as JitsiTrack;
        const state: JitsiReduxState = {
            'features/base/participants': {
                dominantSpeaker: 'a',
                remote: new Map([ [ 'a', participant('a') ] ])
            },
            'features/base/tracks': [
                { jitsiTrack: camera, mediaType: 'video', participantId: 'a', videoType: 'camera' }
            ]
        };

        expect(selectParticipantsWithTracks(state, 4)[0]).toMatchObject({
            participant: { id: 'a' },
            track: camera
        });
    });

    it('places the local participant first and keeps the grid capped at four', () => {
        const localCamera = { attach: vi.fn(), getVideoType: () => 'camera' } as JitsiTrack;
        const localDesktop = { attach: vi.fn(), getVideoType: () => 'desktop' } as JitsiTrack;
        const remote = new Map<string, JitsiParticipant>([
            [ 'a', participant('a') ],
            [ 'b', participant('b') ],
            [ 'c', participant('c') ],
            [ 'd', participant('d') ]
        ]);
        const state: JitsiReduxState = {
            'features/base/participants': {
                activeSpeakers: [ 'a', 'b', 'c', 'd' ],
                local: participant('local', { local: true, name: 'Me' }),
                remote
            },
            'features/base/tracks': [
                {
                    jitsiTrack: localDesktop,
                    local: true,
                    mediaType: 'video',
                    participantId: 'local',
                    videoType: 'desktop'
                },
                {
                    jitsiTrack: localCamera,
                    local: true,
                    mediaType: 'video',
                    participantId: 'local',
                    videoType: 'camera'
                }
            ]
        };

        expect(selectLocalCameraTrack(state)).toBe(localCamera);
        expect(selectParticipantsWithTracks(state, 4).map(item => item.participant.id))
            .toEqual([ 'local', 'a', 'b', 'c' ]);
    });

    it('selects the active remote screen share and resolves its owner name', () => {
        const desktop = {
            attach: vi.fn(),
            getSourceName: () => 'owner-desktop-1',
            getVideoType: () => 'desktop'
        } as JitsiTrack;
        const state: JitsiReduxState = {
            'features/base/participants': {
                remote: new Map([
                    [ 'owner', participant('owner', { name: 'Alice' }) ],
                    [ 'owner-desktop-1', participant('owner-desktop-1', {
                        fakeParticipant: 'RemoteScreenShare',
                        name: 'Alice'
                    }) ]
                ])
            },
            'features/base/tracks': [
                {
                    jitsiTrack: desktop,
                    mediaType: 'video',
                    participantId: 'owner',
                    videoType: 'desktop'
                }
            ],
            'features/large-video': { participantId: 'owner-desktop-1' },
            'features/video-layout': { remoteScreenShares: [ 'owner-desktop-1' ] }
        };

        expect(selectScreenShare(state)).toMatchObject({
            id: 'owner-desktop-1',
            label: 'Демонстрация — Alice',
            local: false,
            track: desktop
        });
    });

    it('includes a local screen share unless local sharing is disabled', () => {
        const desktop = {
            attach: vi.fn(),
            getSourceName: () => 'local-desktop-1',
            getVideoType: () => 'desktop'
        } as JitsiTrack;
        const state: JitsiReduxState = {
            'features/base/participants': {
                local: participant('local', { local: true, name: 'Me' }),
                localScreenShare: participant('local-desktop-1', {
                    fakeParticipant: 'LocalScreenShare',
                    name: 'Me'
                })
            },
            'features/base/tracks': [
                {
                    jitsiTrack: desktop,
                    local: true,
                    mediaType: 'video',
                    participantId: 'local',
                    videoType: 'desktop'
                }
            ]
        };

        expect(selectScreenShare(state)).toMatchObject({
            id: 'local-desktop-1',
            label: 'Демонстрация — Вы',
            local: true,
            track: desktop
        });
        expect(selectScreenShare(state, false)).toBeUndefined();
    });

    it('builds readable initials', () => {
        expect(participantInitials({ id: '1', name: 'Иван Петров' })).toBe('ИП');
        expect(participantInitials({ id: '2', name: 'Alice' })).toBe('AL');
    });
});
