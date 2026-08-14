import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
};

createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.endsWith('/')) {
        pathname += 'index.html';
    }

    const file = resolve(root, `.${pathname}`);

    if (file !== root && !file.startsWith(`${root}${sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
    }

    try {
        const metadata = await stat(file);

        if (!metadata.isFile()) {
            throw new Error('Not a file');
        }
        response.writeHead(200, {
            'Cache-Control': 'no-store',
            'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream'
        });
        createReadStream(file).pipe(response);
    } catch {
        response.writeHead(404).end('Not found');
    }
}).listen(4173, '0.0.0.0', () => {
    console.log('Smoke-test server: http://127.0.0.1:4173/test/browser/');
});
