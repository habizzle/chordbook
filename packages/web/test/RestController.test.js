import {describe, it, expect} from 'vitest';
import fs from 'fs';
import path from 'path';
import {parse} from '@chordbook/parser';

describe('web integration', () => {
    it('reads songs from books path', () => {
        const tmpDir = path.resolve(__dirname, 'fixtures-web');
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
