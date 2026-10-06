export const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const init = () => {
    document.addEventListener('keydown', (e) => {
        function isElementInViewport(el) {
            const rect = el.getBoundingClientRect();
            const elementHeight = el.offsetHeight;
            const elementWidth = el.offsetWidth;
            return rect.top >= -elementHeight
                && rect.left >= -elementWidth
                && rect.right <= (window.innerWidth || document.documentElement.clientWidth) + elementWidth
                && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + elementWidth;
        }

        const selector = '.song';

        if (e.key === 'ArrowLeft') {
            const all = [...document.querySelectorAll(selector)];
            const current = all.find((el) => isElementInViewport(el));
            const previousIndex = all.indexOf(current) - 1;
            if (previousIndex >= 0) {
                all[previousIndex].scrollIntoView();
            }
        }

        if (e.key === 'ArrowRight') {
            const all = [...document.querySelectorAll(selector)];
            const current = all.find((el) => isElementInViewport(el));
            const nextIndex = all.indexOf(current) + 1;
            if (nextIndex < all.length) {
                all[nextIndex].scrollIntoView();
            }
        }
    });

    const pageUrl = new URL(window.location.href);
    const state = {
        books: null,
        textOnly: pageUrl.searchParams.get("textOnly") === "true",
        printMode: pageUrl.searchParams.get("print") === "true",
        transposedKey: pageUrl.searchParams.get("edition") || null,
        anchor: pageUrl.hash.replace("#", '')
    };

    const loadSongs = () => {
        getLocalSongsOrLoad()
            .then((books) => {
                state.books = books;
                window.localStorage.setItem("state", JSON.stringify(state));
                render();
            })
            .catch((e) => console.error(e));
    }

    const getLocalSongsOrLoad = async () => {
        let localState = null;
        try {
            const rawLocalState = window.localStorage.getItem("state");
            if (rawLocalState) {
                localState = JSON.parse(rawLocalState);
            }
        } catch (error) {
            console.warn("Discarding corrupted local state", error);
            window.localStorage.removeItem("state");
        }
        if (Array.isArray(localState?.books) && localState.transposedKey === state.transposedKey) {
            return localState.books;
        }
        const songsUrl = new URL("./songs", window.location.origin);
        if (state.transposedKey) {
            songsUrl.searchParams.append("edition", state.transposedKey)
        }
        return fetch(songsUrl, {method: "GET"})
            .then((res) => res.json())
    }

    const render = async () => {
        const element = document.getElementsByTagName("body")[0];

        if(state.textOnly) {
          element.setAttribute("class", "text-only");
        }

        element.innerHTML = `
            <section class="cover">
                <h1>Awesome Guitar Songs</h1>
                <p id="edition">${formatEditions()}</p>
            </section>
            ${formatNavigation()}
            ${formatBooks()}
        `;

        document.getElementById("refresh")?.addEventListener("click", () => {
            window.localStorage.clear();
            loadSongs();
        });

        wireSearch();
        wireScrollSpy();

        if (state.printMode) {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js";
            script.integrity = "sha384-JkjBt3FPbcQ3WBc3qp+maUIw8YLoZxNNj8H+tn73mljkC1ba8aEPWlgwfCRPpAxV";
            script.crossOrigin = "anonymous";
            document.head.appendChild(script)
        }

        if (state.anchor) {
            document.getElementById(state.anchor)?.scrollIntoView();
        }
    }

    const formatBooks = () => state.books.map(formatBook).join('');

    const formatBook = (book, bookIndex) => book.songs
        .map((song, songIndex) => formatSong(bookIndex, song, songIndex))
        .join('');

    const formatSong = (bookIndex, song, songIndex) => `
        <section class="song" id="song-${bookIndex}-${songIndex}">
            <h2 class="song-title">${esc(song.title)}</h2>
            <p class="author">${esc(song.author ?? '')}</p>
            ${song.blocks.map(block => formatBlock(block)).join('')}
        </section>
    `;

    const formatBlock = (block) => `
        <div class="block">
            <div class="title">
                ${esc(block.name)}:
            </div>
            <div class="content">
                ${block.lines.map(line => formatLine(line)).join('')}
            </div>
        </div>
    `;

    const formatLine = (line) => `<pre class="${esc(line.type)}">${esc(line.content)}</pre>`;

    const formatEditions = () => [
        formatEdition("Original", null),
        formatEdition("Easy Ukulele Edition (C)", "C"),
        formatEdition("Easy Guitar Edition (G)", "G"),
    ].join('');

    const formatEdition = (editionName, editionKey) => {
        const current = editionKey === state.transposedKey;
        return current ? esc(editionName) : '';
    };

    const formatNavigation = function () {
        if (state.printMode) {
            return '';
        }

        const formattedBooks = state.books.map((book, bookIndex) => `
            <div class="nav-book">
                ${state.books.length > 1 ? `<p class="nav-book-title">${esc(book.title)}</p>` : ''}
                <ul>
                    ${book.songs.map((song, songIndex) => `<li><a href="#song-${bookIndex}-${songIndex}">${esc(song.title)}</a></li>`).join("")}
                </ul>
            </div>
        `).join("");

        return `
            <nav>
                <header>
                    <div class="nav-actions">
                        ${formatEditionChoice("Original", null, "🎵")}
                        ${formatEditionChoice("Easy Guitar Edition (G)", "G", "🎸")}
                        ${formatEditionChoice("Easy Ukulele Edition (C)", "C", "🪕")}
                        <a href="${relativeUrl("print", "true")}" target="_blank" title="Show print mode">🖨️</a>
                        <button id="refresh" type="button" title="Refresh">🔄</button>
                    </div>
                    <input id="nav-search" type="search" placeholder="Search songs…" autocomplete="off" aria-label="Search songs"/>
                </header>
                <div class="nav-content">${formattedBooks}</div>
                <p id="nav-empty" hidden>No songs match your search.</p>
            </nav>
        `;
    }

    const wireSearch = () => {
        const search = document.getElementById("nav-search");
        const empty = document.getElementById("nav-empty");
        if (!search || !empty) {
            return;
        }
        search.addEventListener("input", () => {
            const query = search.value.trim().toLowerCase();
            let matches = 0;
            document.querySelectorAll(".nav-book").forEach((book) => {
                let bookMatches = 0;
                book.querySelectorAll("li").forEach((li) => {
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
        search.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                search.value = "";
                search.dispatchEvent(new Event("input"));
            }
        });
    }

    const wireScrollSpy = () => {
        const links = new Map();
        document.querySelectorAll("nav li a[href^='#song-']").forEach((link) => {
            links.set(link.getAttribute("href").slice(1), link);
        });
        if (links.size === 0) {
            return;
        }
        const sections = [...links.keys()]
            .map((id) => document.getElementById(id))
            .filter(Boolean);
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
            links.forEach((link, id) => link.classList.toggle("current", id === currentId));
        };
        window.addEventListener("scroll", () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, {passive: true});
        update();
    }

    const relativeUrl = (searchParam, value) => {
        return searchParam ? `?${searchParam}=${value}` : "/";
    }

    const formatEditionChoice = (editionName, editionKey, label) => {
        if (state.transposedKey === editionKey) {
            return '';
        }
        const element = document.createElement("a");
        element.text = label ?? editionKey ?? "O";
        element.href = relativeUrl(editionKey ? "edition" : null, editionKey);
        element.title = `Show ${editionName}`;
        return element.outerHTML;
    }

    loadSongs();
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}
