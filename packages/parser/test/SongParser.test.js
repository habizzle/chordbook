import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import fs from 'fs';
import path from 'path';
import {parse} from '../src/SongParser.js';

describe('parse', () => {
    const tmpDir = path.resolve(__dirname, 'fixtures');

    beforeAll(() => {
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, {recursive: true});
        const yaml = `---
song:
  - !V
    |
      C  G  Am  F
  - !Ref
    |
      This is a refrain
title: Test Song
author: Tester
key: C
`;
        fs.writeFileSync(path.join(tmpDir, 'book.yml'), yaml, 'utf8');
    });

    afterAll(() => {
        fs.rmSync(tmpDir, {recursive: true, force: true});
    });

    it('parses a songbook directory', () => {
        const books = parse(tmpDir, null);
        expect(Array.isArray(books)).toBe(true);
        expect(books[0].songs[0].title).toBe('Test Song');
        expect(books[0].songs[0].blocks[0].lines[0].type).toBe('chord');
    });

    describe('with unsupported keys and malformed songs', () => {
        let mixedDir;

        beforeAll(() => {
            mixedDir = path.resolve(__dirname, 'fixtures-mixed');
            fs.mkdirSync(mixedDir, {recursive: true});
            const yaml = `---
title: Fine Song
key: C
song:
  - |
    C        G
    All is fine here
---
title: Odd Key Song
key: Am
song:
  - |
    Am       Em
    My key is unsupported
---
title: Transposed Fine
key: G
song:
  - |
    G        D
    G edition works for me
---
title: Broken Song
author: nobody
`;
            fs.writeFileSync(path.join(mixedDir, 'mixed.yml'), yaml, 'utf8');
        });

        afterAll(() => {
            fs.rmSync(mixedDir, {recursive: true, force: true});
        });

        it('keeps untransposable songs untransposed and skips malformed ones', () => {
            const books = parse(mixedDir, 'G');
            const songs = books[0].songs;
            expect(songs.map((song) => song.title)).toEqual(['Fine Song', 'Odd Key Song', 'Transposed Fine']);
            expect(songs[0].blocks[0].lines[0].content).toContain('G        D');
            expect(songs[1].blocks[0].lines[0].content).toContain('Am       Em');
            expect(songs[2].blocks[0].lines[0].content).toContain('G        D');
        });

        it('returns all songs without a key', () => {
            const books = parse(mixedDir, null);
            expect(books[0].songs).toHaveLength(3);
        });
    });
});
