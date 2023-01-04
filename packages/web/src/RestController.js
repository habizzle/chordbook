import fs from 'fs';
import http from 'http';
import path from 'path';
import url from 'url';
import {parse} from '@chordbook/parser';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, "./index.html");
const booksPath = process.env.BOOKS_PATH ?? path.resolve(__dirname, "../../../books");
const port = process.env.PORT ?? 8080;

const home = (req, res) => {
    const html = fs.readFileSync(htmlPath, "utf8");

    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': html.length,
        'Expires': new Date().toUTCString()
    });
    res.end(html);
}

const songs = (req, res) => {
    const queryObject = url.parse(req.url, true).query;
    const transposedKey = queryObject['edition'] || null;
    const songs = parse(booksPath, transposedKey);

    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(JSON.stringify(songs));
}

const routes = {
    "GET /": home,
    "GET /songs": songs,
};

export const start = () => {
    http.createServer(function (req, res) {
        const path = url.parse(req.url).pathname;
        const callback = routes[`${req.method} ${path}`];
        if (callback) {
            callback(req, res);
        } else {
            res.writeHead(404)
                .end();
        }
    }).listen(port);

    console.log(`Show songs at http://localhost:${port}/`);
};
