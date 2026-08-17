import { describe, expect, it } from 'vitest';

import { DOCUMENT_PIP_STYLES, ICONS } from '../src/styles';

describe('Document PiP layout styles', () => {
    it('splits the content equally and fills the lower half with two or four cards', () => {
        expect(DOCUMENT_PIP_STYLES)
            .toContain('.jmp-content.has-screen-share { grid-template-rows: repeat(2, minmax(0, 1fr)); }');
        expect(DOCUMENT_PIP_STYLES)
            .toContain('.jmp-grid[data-count="3"], .jmp-grid[data-count="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }');
        expect(DOCUMENT_PIP_STYLES).toContain('.jmp-screen-share.is-empty');
        expect(DOCUMENT_PIP_STYLES).toContain('.jmp-screen-share.is-empty .jmp-screen-share-label svg');
        expect(DOCUMENT_PIP_STYLES).toContain('.jmp-placeholder-icon svg');
        expect(DOCUMENT_PIP_STYLES).not.toContain('.jmp-placeholder-label');
        expect(DOCUMENT_PIP_STYLES)
            .toContain('.jmp-grid[data-count="2"] .jmp-tile { height: 100%; }');
        expect(DOCUMENT_PIP_STYLES)
            .not.toContain('.jmp-content.has-screen-share .jmp-grid[data-count="4"]');
        expect(DOCUMENT_PIP_STYLES)
            .toContain('.jmp-root { display: grid; grid-template-rows: 1fr auto auto;');
        expect(DOCUMENT_PIP_STYLES).toContain('min-width: 220px;');
        expect(DOCUMENT_PIP_STYLES).toContain('.jmp-participant-counts');
    });

    it('provides a standalone filled hangup icon', () => {
        expect(DOCUMENT_PIP_STYLES)
            .toContain('.jmp-control svg.jmp-icon-fill { fill: currentColor; stroke: none; }');
        expect(ICONS.hangup).toContain('jmp-icon-hangup');
        expect(ICONS.hangup).toContain('<path d="M3.4 16.8');
    });
});
