import { describe, expect, it } from 'vitest';

import { BUTTON_ID, normalizeConfig, prepareJitsiConfig } from '../src/config';
import type { JitsiHostWindow } from '../src/types';

describe('configuration', () => {
    it('normalizes values and caps participant count at four', () => {
        expect(normalizeConfig({ maxParticipants: 99 })).toMatchObject({ maxParticipants: 4 });
        expect(normalizeConfig({ maxParticipants: 0 })).toMatchObject({ maxParticipants: 1 });
        expect(normalizeConfig({ buttonText: '  PiP  ' })).toMatchObject({ buttonText: 'PiP' });
        expect(normalizeConfig({ lobbyLabel: '  Ожидают  ', participantsLabel: '  Всего  ' }))
            .toMatchObject({ lobbyLabel: 'Ожидают', participantsLabel: 'Всего' });
        expect(normalizeConfig({ lobbyLabel: ' ', participantsLabel: '' }))
            .toMatchObject({ lobbyLabel: 'В лобби', participantsLabel: 'Участников' });
        expect(normalizeConfig()).toMatchObject({
            cameraLabel: 'Камера',
            includeLocalScreenShare: true,
            lobbyLabel: 'В лобби',
            microphoneLabel: 'Микрофон',
            participantsLabel: 'Участников',
            showScreenShare: true,
            windowTitle: 'PiP'
        });
    });

    it('normalizes every configurable interface label', () => {
        const translatedLabels = {
            buttonText: '  Picture in picture  ',
            cameraLabel: '  Camera  ',
            disableCameraLabel: '  Turn camera off  ',
            disableMicrophoneLabel: '  Mute  ',
            enableCameraLabel: '  Turn camera on  ',
            enableMicrophoneLabel: '  Unmute  ',
            hangupLabel: '  Leave  ',
            lobbyLabel: '  In lobby  ',
            microphoneLabel: '  Microphone  ',
            noActiveSpeakerLabel: '  No active speaker  ',
            noScreenShareLabel: '  No active screen share  ',
            participantLabel: '  Participant  ',
            participantsLabel: '  Participants  ',
            returnToConferenceLabel: '  Return to meeting  ',
            screenShareLabel: '  Screen share  ',
            waitingParticipantLabel: '  Waiting for participant  ',
            windowTitle: '  Meeting PiP  ',
            youLabel: '  You  '
        };

        expect(normalizeConfig(translatedLabels)).toMatchObject(
            Object.fromEntries(Object.entries(translatedLabels)
                .map(([ key, value ]) => [ key, value.trim() ]))
        );
        expect(normalizeConfig({ hangupLabel: ' ', windowTitle: '' })).toMatchObject({
            hangupLabel: 'Завершить звонок',
            windowTitle: 'PiP'
        });
    });

    it('preserves existing custom buttons and adds its button once', () => {
        const host = window as unknown as JitsiHostWindow;

        host.config = {
            customToolbarButtons: [ { icon: '/custom.svg', id: 'custom', text: 'Custom' } ]
        };

        prepareJitsiConfig(host);
        prepareJitsiConfig(host);

        expect(host.config.customToolbarButtons?.map(button => button.id)).toEqual([ 'custom', BUTTON_ID ]);
    });

    it('does not add a button when disabled', () => {
        const host = window as unknown as JitsiHostWindow;

        host.config = { browserPip: { enabled: false } };
        const config = prepareJitsiConfig(host);

        expect(config.enabled).toBe(false);
        expect(host.config.customToolbarButtons).toBeUndefined();
    });
});
