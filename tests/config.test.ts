import { describe, expect, it } from 'vitest';

import { BUTTON_ID, normalizeConfig, prepareJitsiConfig } from '../src/config';
import type { JitsiHostWindow } from '../src/types';

describe('configuration', () => {
    it('normalizes values and caps participant count at four', () => {
        expect(normalizeConfig({ maxParticipants: 99 })).toMatchObject({ maxParticipants: 4 });
        expect(normalizeConfig({ maxParticipants: 0 })).toMatchObject({ maxParticipants: 1 });
        expect(normalizeConfig({ buttonText: '  PiP  ' })).toMatchObject({ buttonText: 'PiP' });
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
