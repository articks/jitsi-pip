import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        environmentOptions: {
            jsdom: { url: 'https://localhost/' }
        },
        restoreMocks: true,
        setupFiles: [ './tests/setup.ts' ]
    }
});
