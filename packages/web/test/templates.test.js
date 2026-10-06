import {describe, it, expect} from 'vitest';
import {
    formatBlock,
    formatBooks,
    formatEditions,
    formatLine,
    formatNavigation,
    formatSong,
    formatSortButton,
    formatToc,
    orderedSongs,
} from '../src/templates.js';

const song = (title, chords = 'C  G') => ({
    title,
    author: null,
    blocks: [{name: 'V1', lines: [{type: 'chord', content: chords}, {type: 'text', content: 'la la'}]}],
});

const book = {
    title: 'test songs',
    songs: [song('Zebra'), song('apple', 'Am  Em'), song('Mango', 'G  D')],
};

describe('orderedSongs', () => {
    it('keeps songbook order by default', () => {
        expect(orderedSongs(book, 'natural').map(({song}) => song.title)).toEqual(['Zebra', 'apple', 'Mango']);
    });

    it('sorts case-insensitively ascending', () => {
        expect(orderedSongs(book, 'asc').map(({song}) => song.title)).toEqual(['apple', 'Mango', 'Zebra']);
    });

    it('reverses for descending', () => {
        expect(orderedSongs(book, 'desc').map(({song}) => song.title)).toEqual(['Zebra', 'Mango', 'apple']);
    });
});

describe('format templates', () => {
    it('escape song content', () => {
        const evil = song('<script>alert(1)</script>', 'C  G');
        const result = String(formatSong(0, evil, 0));
        expect(result).toContain('&lt;script&gt;');
        expect(result).not.toContain('<script>');
        expect(result).toContain('id="song-0-0"');
    });

    it('render lines and blocks', () => {
        const line = String(formatLine({type: 'chord', content: 'C  G'})).trim();
        expect(line).toBe('<pre class="chord">C  G</pre>');
        const block = String(formatBlock(book.songs[0].blocks[0]));
        expect(block).toContain('<div class="content">');
    });

    it('sort content books according to the sort order', () => {
        const asc = String(formatBooks([book], 'asc'));
        expect(asc.indexOf('apple')).toBeLessThan(asc.indexOf('Mango'));
        expect(asc.indexOf('Mango')).toBeLessThan(asc.indexOf('Zebra'));

        const natural = String(formatBooks([book], 'natural'));
        expect(natural.indexOf('Zebra')).toBeLessThan(natural.indexOf('apple'));
    });

    it('keep song anchors stable regardless of sort', () => {
        const natural = String(formatBooks([book], 'natural'));
        const asc = String(formatBooks([book], 'asc'));
        expect(natural).toContain('id="song-0-1"');
        expect(asc).toContain('id="song-0-1"');
    });

    it('render a sorted toc with leaders', () => {
        const toc = String(formatToc([book], 'desc'));
        expect(toc).toContain('<section class="toc">');
        expect(toc).toContain('toc-leader');
        expect(toc.indexOf('Zebra')).toBeLessThan(toc.indexOf('Mango'));
        expect(toc.indexOf('href="#song-0-0"')).toBeGreaterThan(-1);
    });

    it('render navigation with sorted entries and stable anchors', () => {
        const nav = String(formatNavigation([book], {sort: 'asc', transposedKey: null}));
        expect(nav).toContain('<nav>');
        expect(nav.indexOf('#song-0-1')).toBeLessThan(nav.indexOf('#song-0-2'));
        expect(nav).toContain('id="nav-search"');
        expect(nav).toContain('id="refresh"');
    });

    it('mark the active sort option', () => {
        const sortButton = String(formatSortButton('desc'));
        expect(sortButton).toContain('data-sort="desc" class="active"');
        expect(sortButton).toContain('data-sort="asc"');
        expect(sortButton).not.toContain('data-sort="natural" class="active"');
    });

    it('hide the current edition choice and show the current edition name', () => {
        const editions = formatEditions('C');
        expect(editions[0]).toBe('');
        expect(editions[1]).toBe('Easy Ukulele Edition (C)');
        expect(editions[2]).toBe('');
    });

    it('omit book titles in navigation for a single book', () => {
        const single = String(formatNavigation([book], {sort: 'natural', transposedKey: null}));
        expect(single).not.toContain('nav-book-title');
    });
});
