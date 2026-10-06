import {html} from './html.js';
import {formatBooks, formatEditions, formatNavigation, formatToc} from './templates.js';
import {clearStorage, loadPrefs, savePrefs} from './state.js';
import {getSongs} from './api.js';

const init = () => {
    const pageUrl = new URL(window.location.href);
    const state = {
        books: null,
        textOnly: pageUrl.searchParams.get('textOnly') === 'true',
        printMode: pageUrl.searchParams.get('print') === 'true',
        transposedKey: pageUrl.searchParams.get('edition') || null,
        anchor: pageUrl.hash.replace('#', ''),
        sort: loadPrefs().sort,
    };

    const persist = () => savePrefs({sort: state.sort});

    const loadSongs = () => {
        getSongs(state.transposedKey)
            .then((books) => {
                state.books = books;
                render();
            })
            .catch((e) => {
                console.error(e);
                document.getElementsByTagName('body')[0].innerHTML = html`
                    <p class="load-error">Could not load songs. <button id="retry" type="button">Retry</button></p>
                `;
                document.getElementById('retry').addEventListener('click', () => loadSongs());
            });
    };

    const render = () => {
        const element = document.getElementsByTagName('body')[0];
        const query = document.getElementById('nav-search')?.value ?? '';
        const scrollY = window.scrollY;

        if (state.textOnly) {
            element.setAttribute('class', 'text-only');
        }

        element.innerHTML = html`
            <section class="cover">
                <h1>Awesome Guitar Songs</h1>
                <p id="edition">${formatEditions(state.transposedKey)}</p>
            </section>
            ${state.printMode && formatToc(state.books, state.sort)}
            ${!state.printMode && formatNavigation(state.books, state)}
            ${formatBooks(state.books, state.sort)}
        `;

        wireNav();

        if (query) {
            const search = document.getElementById('nav-search');
            search.value = query;
            search.dispatchEvent(new Event('input'));
        }

        if (state.anchor) {
            document.getElementById(state.anchor)?.scrollIntoView();
            state.anchor = null;
        } else if (!state.printMode) {
            window.scrollTo({top: scrollY, behavior: 'instant'});
        }

        if (state.printMode) {
            import('/pagedjs.js')
                .then(({Previewer}) => new Previewer().preview())
                .catch((e) => console.error('Pagination failed', e));
        }
    };

    const wireNav = () => {
        document.getElementById('refresh')?.addEventListener('click', () => {
            clearStorage();
            state.sort = 'natural';
            persist();
            loadSongs();
        });

        wireSearch();
        wireSort();
        wireScrollSpy();
    };

    const wireSearch = () => {
        const search = document.getElementById('nav-search');
        const empty = document.getElementById('nav-empty');
        if (!search || !empty) {
            return;
        }
        search.addEventListener('input', () => {
            const query = search.value.trim().toLowerCase();
            let matches = 0;
            document.querySelectorAll('.nav-book').forEach((book) => {
                let bookMatches = 0;
                book.querySelectorAll('li').forEach((li) => {
                    const match = !query || li.textContent.toLowerCase().includes(query);
                    li.hidden = !match;
                    if (match) {
                        bookMatches++;
                    }
                });
                book.hidden = bookMatches === 0;
                matches += bookMatches;
            });
            empty.hidden = matches > 0;
        });
        search.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                search.value = '';
                search.dispatchEvent(new Event('input'));
            }
        });
    };

    const wireSort = () => {
        const wrapper = document.getElementById('nav-sort');
        if (!wrapper) {
            return;
        }
        wrapper.addEventListener('click', (e) => {
            const trigger = e.target.closest('.nav-sort > button');
            if (trigger) {
                e.stopPropagation();
                wrapper.classList.toggle('open');
                return;
            }
            const item = e.target.closest('[data-sort]');
            if (!item || item.dataset.sort === state.sort) {
                return;
            }
            state.sort = item.dataset.sort;
            persist();
            render();
        });
        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.activeElement?.blur();
            }
        });
    };

    let detachScrollSpy = null;
    const wireScrollSpy = () => {
        const links = new Map();
        document.querySelectorAll("nav li a[href^='#song-']").forEach((link) => {
            links.set(link.getAttribute('href').slice(1), link);
        });
        if (links.size === 0) {
            return;
        }
        const container = document.querySelector('.nav-content');
        const sections = [...document.querySelectorAll('.song')]
            .filter((section) => links.has(section.id));
        const reveal = (link) => {
            if (!container || !link.getClientRects().length) {
                return;
            }
            const containerRect = container.getBoundingClientRect();
            const linkRect = link.getBoundingClientRect();
            const overshootTop = linkRect.top - containerRect.top;
            const overshootBottom = linkRect.bottom - containerRect.bottom;
            if (overshootTop < 0) {
                container.scrollTop += overshootTop;
            } else if (overshootBottom > 0) {
                container.scrollTop += overshootBottom;
            }
        };
        let ticking = false;
        const update = () => {
            ticking = false;
            const threshold = window.innerHeight * 0.35;
            let currentId = null;
            for (const section of sections) {
                if (section.getBoundingClientRect().top <= threshold) {
                    currentId = section.id;
                }
            }
            links.forEach((link, id) => {
                const isCurrent = id === currentId;
                link.classList.toggle('current', isCurrent);
                if (isCurrent) {
                    reveal(link);
                }
            });
        };
        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };
        window.addEventListener('scroll', onScroll, {passive: true});
        detachScrollSpy?.();
        detachScrollSpy = () => window.removeEventListener('scroll', onScroll);
        update();
    };

    document.addEventListener('keydown', (e) => {
        const isElementInViewport = (el) => {
            const rect = el.getBoundingClientRect();
            return rect.top >= -el.offsetHeight
                && rect.left >= -el.offsetWidth
                && rect.right <= (window.innerWidth || document.documentElement.clientWidth) + el.offsetWidth
                && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + el.offsetWidth;
        };

        const all = [...document.querySelectorAll('.song')];
        const current = all.find((el) => isElementInViewport(el));
        const currentIndex = all.indexOf(current);

        if (e.key === 'ArrowLeft' && currentIndex - 1 >= 0) {
            all[currentIndex - 1].scrollIntoView();
        }

        if (e.key === 'ArrowRight' && currentIndex + 1 < all.length) {
            all[currentIndex + 1].scrollIntoView();
        }
    });

    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('nav-sort');
        if (wrapper && !wrapper.contains(e.target)) {
            wrapper.classList.remove('open');
        }
    });

    loadSongs();
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}
