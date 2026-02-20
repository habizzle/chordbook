import {describe, it, expect} from 'vitest';
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
});
