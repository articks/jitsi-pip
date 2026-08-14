import type {
    JitsiParticipant,
    JitsiParticipantsState,
    JitsiReduxState,
    JitsiTrack,
    JitsiTrackState,
    SelectedParticipant,
    SelectedScreenShare
} from './types';

function getRemoteParticipant(
        remote: JitsiParticipantsState['remote'],
        id: string
): JitsiParticipant | undefined {
    if (remote instanceof Map) {
        return remote.get(id);
    }

    return remote?.[id];
}

function getRemoteParticipants(
        remote: JitsiParticipantsState['remote']
): Iterable<JitsiParticipant> {
    if (remote instanceof Map) {
        return remote.values();
    }

    return Object.values(remote ?? {});
}

function isRealRemoteParticipant(participant?: JitsiParticipant): participant is JitsiParticipant {
    return Boolean(participant && !participant.local && !participant.fakeParticipant);
}

export function participantName(participant: JitsiParticipant): string {
    return participant.displayName?.trim()
        || participant.name?.trim()
        || 'Участник';
}

export function participantInitials(participant: JitsiParticipant): string {
    const words = participantName(participant)
        .split(/\s+/u)
        .filter(Boolean);

    return (words.length > 1
        ? `${words[0][0]}${words[words.length - 1][0]}`
        : words[0]?.slice(0, 2) || 'U')
        .toLocaleUpperCase();
}

export function participantAvatar(participant: JitsiParticipant): string | undefined {
    return participant.loadableAvatarUrl || participant.avatarURL;
}

export function selectActiveParticipants(state: JitsiReduxState, limit: number): JitsiParticipant[] {
    const participants = state['features/base/participants'];

    if (!participants?.remote) {
        return [];
    }

    const ids: string[] = [];
    const add = (id?: string) => {
        if (!id || ids.includes(id)) {
            return;
        }

        const participant = getRemoteParticipant(participants.remote, id);

        if (isRealRemoteParticipant(participant)) {
            ids.push(id);
        }
    };

    add(participants.dominantSpeaker);

    const active = participants.activeSpeakers
        || (participants.speakersList instanceof Map
            ? participants.speakersList.keys()
            : participants.speakersList?.map(([ id ]) => id));

    if (active) {
        for (const id of active) {
            add(id);
        }
    }

    // dominantSpeaker/speakersList may be empty until somebody speaks. Fill
    // the remaining positions with connected remote participants so PiP does
    // not look empty in a silent conference.
    for (const participant of getRemoteParticipants(participants.remote)) {
        if (isRealRemoteParticipant(participant)) {
            add(participant.id);
        }
    }

    return ids
        .slice(0, Math.min(4, Math.max(1, limit)))
        .map(id => getRemoteParticipant(participants.remote, id))
        .filter(isRealRemoteParticipant);
}

export function selectCameraTrack(
        state: JitsiReduxState,
        participantId: string
): JitsiTrack | undefined {
    const tracks = state['features/base/tracks'];

    if (!Array.isArray(tracks)) {
        return undefined;
    }

    const candidates = tracks.filter((track: JitsiTrackState) => {
        const type = track.videoType || track.jitsiTrack?.getVideoType?.();
        const muted = track.muted ?? track.jitsiTrack?.isMuted?.();

        return track.participantId === participantId
            && track.mediaType === 'video'
            && type !== 'desktop'
            && type !== 'screen'
            && !track.local
            && !muted
            && Boolean(track.jitsiTrack);
    });

    return candidates.find(track => (track.videoType || track.jitsiTrack?.getVideoType?.()) === 'camera')?.jitsiTrack
        || candidates[0]?.jitsiTrack;
}

export function selectLocalCameraTrack(state: JitsiReduxState): JitsiTrack | undefined {
    const tracks = state['features/base/tracks'];

    if (!Array.isArray(tracks)) {
        return undefined;
    }

    const candidates = tracks.filter((track: JitsiTrackState) => {
        const type = track.videoType || track.jitsiTrack?.getVideoType?.();
        const muted = track.muted ?? track.jitsiTrack?.isMuted?.();

        return track.local
            && track.mediaType === 'video'
            && type !== 'desktop'
            && type !== 'screen'
            && !muted
            && Boolean(track.jitsiTrack);
    });

    return candidates.find(track => (track.videoType || track.jitsiTrack?.getVideoType?.()) === 'camera')?.jitsiTrack
        || candidates[0]?.jitsiTrack;
}

export function selectParticipantsWithTracks(
        state: JitsiReduxState,
        limit: number
): SelectedParticipant[] {
    const normalizedLimit = Math.min(4, Math.max(1, limit));
    const local = state['features/base/participants']?.local;
    const selected: SelectedParticipant[] = [];

    if (local) {
        selected.push({
            participant: local,
            track: selectLocalCameraTrack(state)
        });
    }

    const remoteLimit = normalizedLimit - selected.length;

    if (remoteLimit > 0) {
        selected.push(...selectActiveParticipants(state, remoteLimit).map(participant => ({
            participant,
            track: selectCameraTrack(state, participant.id)
        })));
    }

    return selected.slice(0, normalizedLimit);
}

function isScreenShareTrack(track: JitsiTrackState): boolean {
    const type = track.videoType || track.jitsiTrack?.getVideoType?.();

    return track.mediaType === 'screenshare'
        || ((track.mediaType === 'video' || track.jitsiTrack?.getType?.() === 'video')
            && (type === 'desktop' || type === 'screen'));
}

/**
 * Selects the screen share currently shown by Jitsi on the large stage. If the
 * stage points elsewhere, the newest remote share wins, then the local share,
 * then the last usable desktop track.
 */
export function selectScreenShare(
        state: JitsiReduxState,
        includeLocal = true
): SelectedScreenShare | undefined {
    const tracks = state['features/base/tracks'];

    if (!Array.isArray(tracks)) {
        return undefined;
    }

    const candidates = tracks.filter(track => {
        const muted = track.muted ?? track.jitsiTrack?.isMuted?.() ?? false;

        return Boolean(track.jitsiTrack)
            && isScreenShareTrack(track)
            && !muted
            && (includeLocal || !track.local);
    });

    if (!candidates.length) {
        return undefined;
    }

    const participants = state['features/base/participants'];
    const latestRemoteShares = state['features/video-layout']?.remoteScreenShares ?? [];
    const preferredIds = [
        state['features/large-video']?.participantId,
        ...[ ...latestRemoteShares ].reverse(),
        includeLocal ? participants?.localScreenShare?.id : undefined
    ].filter((id): id is string => Boolean(id));
    const matchesId = (track: JitsiTrackState, id: string) => track.participantId === id
        || track.jitsiTrack?.getSourceName?.() === id;
    let selected: JitsiTrackState | undefined;

    for (const id of preferredIds) {
        selected = candidates.find(track => matchesId(track, id));
        if (selected) {
            break;
        }
    }

    selected ??= candidates[candidates.length - 1];

    const track = selected.jitsiTrack as JitsiTrack;
    const sourceName = track.getSourceName?.();
    const virtualParticipant = sourceName
        ? getRemoteParticipant(participants?.remote, sourceName)
        : undefined;
    const owner = selected.local
        ? participants?.local
        : getRemoteParticipant(participants?.remote, selected.participantId ?? '');
    const displayParticipant = virtualParticipant || owner;
    const local = Boolean(selected.local);

    return {
        id: sourceName || selected.participantId || (local ? 'local-screen-share' : 'screen-share'),
        label: local
            ? 'Демонстрация — Вы'
            : `Демонстрация — ${displayParticipant ? participantName(displayParticipant) : 'Участник'}`,
        local,
        track
    };
}
