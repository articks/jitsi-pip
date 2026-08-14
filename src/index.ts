import { prepareJitsiConfig } from './config';
import { JitsiMeetPiPPlugin } from './plugin';
import type { JitsiHostWindow } from './types';

function bootstrap(host: JitsiHostWindow): void {
    if (host.JitsiBrowserPiP) {
        host.console.warn('[JitsiBrowserPiP] Plugin is already loaded.');
        return;
    }

    const config = prepareJitsiConfig(host);
    const plugin = new JitsiMeetPiPPlugin(host, config);

    host.JitsiBrowserPiP = plugin.getPublicApi();
    plugin.start();
}

if (typeof window !== 'undefined') {
    bootstrap(window as JitsiHostWindow);
}

export { bootstrap };
