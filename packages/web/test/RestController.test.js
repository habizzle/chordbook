import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import fs from 'fs';
import path from 'path';
import {parse} from '@chordbook/parser';
import {start} from '../src/RestController.js';
import {esc} from '../src/app.js';

describe('web integration', () => {
    it('reads songs from books path', () => {
        const tmpDir = path.resolve(import.meta.dirname, 'fixtures-web');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, {recursive: true});
        const yaml = `---
song:
  - !V
    |
      C  G
title: Web Song
key: C
`;
        fs.writeFileSync(path.join(tmpDir, 'webbook.yml'), yaml, 'utf8');

        const books = parse(tmpDir, null);
        expect(books.length).toBeGreaterThan(0);

        fs.rmSync(tmpDir, {recursive: true, force: true});
    });
});

describe('RestController', () => {
    let server;
    let baseUrl;

    beforeAll(async () => {
        server = start({port: 0});
        await new Promise((resolve) => server.on('listening', resolve));
        baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    it('serves the app shell with security headers', async () => {
        const res = await fetch(`${baseUrl}/`);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
        expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
        expect(res.headers.get('x-content-type-options')).toBe('nosniff');
        expect(res.headers.get('cache-control')).toBe('no-store');
    });

    it('serves app.js and app.css', async () => {
        const js = await fetch(`${baseUrl}/app.js`);
        const css = await fetch(`${baseUrl}/app.css`);
        expect(js.status).toBe(200);
        expect(js.headers.get('content-type')).toContain('text/javascript');
        expect(css.status).toBe(200);
        expect(css.headers.get('content-type')).toContain('text/css');
    });

    it('serves songs as json', async () => {
        const res = await fetch(`${baseUrl}/songs`);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('application/json');
        expect(Array.isArray(await res.json())).toBe(true);
    });

    it('accepts supported editions', async () => {
        const res = await fetch(`${baseUrl}/songs?edition=C`);
        expect(res.status).toBe(200);
    });

    it('rejects unsupported editions without crashing', async () => {
        const res = await fetch(`${baseUrl}/songs?edition=INVALID_KEY`);
        expect(res.status).toBe(400);
        const after = await fetch(`${baseUrl}/`);
        expect(after.status).toBe(200);
    });

    it('returns 404 for unknown routes', async () => {
        const res = await fetch(`${baseUrl}/nope`);
        expect(res.status).toBe(404);
    });
});

describe('esc', () => {
    it('escapes html special characters', () => {
        expect(esc('<script>alert("xss")</script>'))
            .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(esc("'&")).toBe('&#39;&amp;');
        expect(esc(null)).toBe('');
        expect(esc(5)).toBe('5');
    });
});
