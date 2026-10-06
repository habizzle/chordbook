import {loadCachedSongs, storeCachedSongs} from './state.js';

export const getSongs = async (edition) => {
    const cached = loadCachedSongs(edition);
    if (cached) {
        return cached;
    }
    const songsUrl = new URL('./songs', window.location.origin);
    if (edition) {
        songsUrl.searchParams.append('edition', edition);
    }
    const response = await fetch(songsUrl, {method: 'GET'});
    if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
    }
    const books = await response.json();
    storeCachedSongs(edition, books);
    return books;
};
