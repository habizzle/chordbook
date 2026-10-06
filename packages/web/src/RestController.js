import fs from 'fs';
import http from 'http';
import path from 'path';
import {parse} from '@chordbook/parser';

const htmlPath = path.resolve(import.meta.dirname, "./index.html");
const appJsPath = path.resolve(import.meta.dirname, "./app.js");
const appCssPath = path.resolve(import.meta.dirname, "./app.css");
const pagedJsPath = path.resolve(import.meta.dirname, "../../../node_modules/pagedjs/dist/paged.esm.js");
const booksPath = process.env.BOOKS_PATH ?? path.resolve(import.meta.dirname, "../../../books");

const supportedEditions = ['C', 'G'];

const securityHeaders = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "form-action 'none'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
};

const sendError = (res, status, message) => {
    res.writeHead(status, {
        ...securityHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end(message);
};

const sendJson = (res, body, status = 200) => {
    res.writeHead(status, {
        ...securityHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
};

const staticFile = (filePath, contentType) => (req, res) => {
    const body = fs.readFileSync(filePath);
    res.writeHead(200, {
        ...securityHeaders,
        'Content-Type': contentType,
        'Content-Length': body.length,
    });
    res.end(body);
};

const songs = (req, res) => {
    const {searchParams} = new URL(req.url, 'http://localhost');
    const edition = searchParams.get('edition');

    if (edition !== null && !supportedEditions.includes(edition)) {
        sendError(res, 400, `Unsupported edition. Supported editions: ${supportedEditions.join(', ')}`);
        return;
    }

    const body = JSON.stringify(parse(booksPath, edition));
    sendJson(res, body);
};

const routes = {
    "GET /": staticFile(htmlPath, 'text/html; charset=utf-8'),
    "GET /app.js": staticFile(appJsPath, 'text/javascript; charset=utf-8'),
    "GET /app.css": staticFile(appCssPath, 'text/css; charset=utf-8'),
    "GET /pagedjs.js": staticFile(pagedJsPath, 'text/javascript; charset=utf-8'),
    "GET /songs": songs,
};

export const start = ({port = process.env.PORT ?? 8080, host = process.env.HOST ?? '127.0.0.1'} = {}) => {
    const server = http.createServer((req, res) => {
        try {
            const {pathname} = new URL(req.url, 'http://localhost');
            const callback = routes[`${req.method} ${pathname}`];
            if (callback) {
                callback(req, res);
            } else {
                sendError(res, 404, 'Not Found');
            }
        } catch (error) {
            console.error('Request failed:', error);
            if (!res.headersSent) {
                sendError(res, 500, 'Internal Server Error');
            } else {
                res.end();
            }
        }
    });

    server.on('error', (error) => {
        console.error(`Server error: ${error.message}`);
    });

    return server.listen(port, host, () => {
        console.log(`Show songs at http://localhost:${server.address().port}/`);
    });
};
