import {html} from './html.js';

const sortModes = {
    natural: {icon: '📖', name: 'Songbook order'},
    asc: {icon: '🔼', name: 'Title A–Z'},
    desc: {icon: '🔽', name: 'Title Z–A'},
};

export const orderedSongs = (book, sort) => {
    const entries = book.songs.map((song, songIndex) => ({song, songIndex}));
    if (sort !== 'natural') {
        entries.sort((a, b) => String(a.song.title ?? '').localeCompare(String(b.song.title ?? ''), undefined, {sensitivity: 'base'}));
        if (sort === 'desc') {
            entries.reverse();
        }
    }
    return entries;
};

const relativeUrl = (searchParam, value) => (searchParam ? `?${searchParam}=${value}` : '/');

export const formatLine = (line) => html`
    <pre class="${line.type}">${line.content}</pre>
`;

export const formatBlock = (block) => html`
    <div class="block">
        <div class="title">${block.name}:</div>
        <div class="content">${block.lines.map((line) => formatLine(line))}</div>
    </div>
`;

export const formatSong = (bookIndex, song, songIndex) => html`
    <section class="song" id="song-${bookIndex}-${songIndex}">
        <h2 class="song-title">${song.title}</h2>
        <p class="author">${song.author ?? ''}</p>
        ${song.blocks.map((block) => formatBlock(block))}
    </section>
`;

export const formatBook = (book, bookIndex, sort) => html`
    ${orderedSongs(book, sort).map(({song, songIndex}) => formatSong(bookIndex, song, songIndex))}
`;

export const formatBooks = (books, sort) => html`
    ${books.map((book, bookIndex) => formatBook(book, bookIndex, sort))}
`;

export const formatToc = (books, sort) => {
    const multiBook = books.length > 1;
    return html`
        <section class="toc">
            <h2>Table of Contents</h2>
            ${books.map((book, bookIndex) => html`
                ${multiBook ? html`<p class="toc-book">${book.title}</p>` : ''}
                <ul class="toc-list">
                    ${orderedSongs(book, sort).map(({song, songIndex}) => html`
                        <li><a href="#song-${bookIndex}-${songIndex}">
                            <span class="toc-title">${song.title}</span>
                            <span class="toc-leader"></span>
                        </a></li>
                    `)}
                </ul>
            `)}
        </section>
    `;
};

export const formatEditions = (currentKey) => [
    ['Original', null],
    ['Easy Ukulele Edition (C)', 'C'],
    ['Easy Guitar Edition (G)', 'G'],
].map(([editionName, editionKey]) => (editionKey === currentKey ? editionName : ''));

export const formatEditionChoice = (editionName, editionKey, label, currentKey) => {
    if (editionKey === currentKey) {
        return '';
    }
    return html`
        <a href="${relativeUrl(editionKey ? 'edition' : null, editionKey)}" title="Show ${editionName}">${label}</a>
    `;
};

export const formatSortButton = (sort) => html`
    <div class="nav-sort" id="nav-sort">
        <button type="button" title="Sort songs" aria-haspopup="menu">↕️</button>
        <div class="nav-sort-menu" role="menu" aria-label="Sort songs">
            ${Object.entries(sortModes).map(([value, mode]) => html`
                <button type="button" role="menuitem" data-sort="${value}" class="${sort === value ? 'active' : ''}">${mode.icon} ${mode.name}</button>
            `)}
        </div>
    </div>
`;

export const formatNavigation = (books, {sort, transposedKey}) => html`
    <nav>
        <header>
            <div class="nav-actions">
                ${formatEditionChoice('Original', null, '🎵', transposedKey)}
                ${formatEditionChoice('Easy Guitar Edition (G)', 'G', '🎸', transposedKey)}
                ${formatEditionChoice('Easy Ukulele Edition (C)', 'C', '🪕', transposedKey)}
                ${formatSortButton(sort)}
                <a href="${relativeUrl('print', 'true')}" target="_blank" title="Show print mode">🖨️</a>
                <button id="refresh" type="button" title="Refresh">🔄</button>
            </div>
            <input id="nav-search" type="search" placeholder="Search songs…" autocomplete="off" aria-label="Search songs"/>
        </header>
        <div class="nav-content">
            ${books.map((book, bookIndex) => html`
                <div class="nav-book">
                    ${books.length > 1 ? html`<p class="nav-book-title">${book.title}</p>` : ''}
                    <ul>
                        ${orderedSongs(book, sort).map(({song, songIndex}) => html`
                            <li><a href="#song-${bookIndex}-${songIndex}">${song.title}</a></li>
                        `)}
                    </ul>
                </div>
            `)}
        </div>
        <p id="nav-empty" hidden>No songs match your search.</p>
    </nav>
`;
