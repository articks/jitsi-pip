import { vi } from 'vitest';

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined)
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn()
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => ({
        arc: vi.fn(),
        beginPath: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        fillText: vi.fn(),
        font: '',
        textAlign: '',
        textBaseline: ''
    }))
});
