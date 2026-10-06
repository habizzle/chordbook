const PREFS_KEY = 'prefs';
const PREFS_VERSION = 2;
const CACHE_PREFIX = 'songs:';
const CACHE_VERSION = 1;
const SORTS = ['natural', 'asc', 'desc'];

export const loadPrefs = () => {
    try {
        const raw = window.localStorage.getItem(PREFS_KEY);
        const prefs = raw ? JSON.parse(raw) : null;
        if (prefs?.version !== PREFS_VERSION) {
            return {sort: 'natural'};
        }
        return {
            sort: SORTS.includes(prefs.sort) ? prefs.sort : 'natural',
        };
    } catch (error) {
        console.warn('Discarding corrupted preferences', error);
        window.localStorage.removeItem(PREFS_KEY);
        return {sort: 'natural'};
    }
};

export const savePrefs = ({sort}) => {
    try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify({sort, version: PREFS_VERSION}));
    } catch (error) {
        console.warn('Could not persist preferences', error);
    }
};

export const loadCachedSongs = (edition) => {
    try {
        const cached = JSON.parse(window.localStorage.getItem(CACHE_PREFIX + (edition ?? 'original')));
        if (cached?.version !== CACHE_VERSION || !Array.isArray(cached.books)) {
            return null;
        }
        return cached.books;
    } catch {
        return null;
    }
};

export const storeCachedSongs = (edition, books) => {
    try {
        const payload = JSON.stringify({books, version: CACHE_VERSION});
        window.localStorage.setItem(CACHE_PREFIX + (edition ?? 'original'), payload);
    } catch (error) {
        console.warn('Could not cache songs', error);
    }
};

export const clearStorage = () => window.localStorage.clear();
