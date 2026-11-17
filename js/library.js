import { getData, seeUses } from './app.js';
import { esc } from './helpers.js';
import {
    categoryList,
    clean,
    openChoirDetail,
    openSongDetail
} from './songDetail.js';
import {
    getLastPlayed,
    getRestStatus,
    getTempoGroup,
    getTimesUsed
} from './calculatedFields.js';

const OWNER = 'library';

// ---------------------------------------------------------------
// Page state (kept between visits to the page)
// ---------------------------------------------------------------

const lib = {
    tab: 'praise',                       // 'praise' | 'choir'
    praise: { query: '', key: '', category: '', sort: { col: 'title', dir: 1 }, selected: null },
    choir:  { query: '', collection: '', theme: '', sort: { col: 'title', dir: 1 }, selected: null, limit: 200 }
};

// ---------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------

const PRAISE_COLS = [
    { id: 'title',      label: 'Title' },
    { id: 'key',        label: 'Key' },
    { id: 'tempo',      label: 'Tempo (BPM)' },
    { id: 'tempoGroup', label: 'Tempo Group' },
    { id: 'lastPlayed', label: 'Last Played' },
    { id: 'source',     label: 'Source' },
    { id: 'page',       label: 'Page' },
    { id: 'boxNumber',  label: 'Box Number' }
];

const CHOIR_COLS = [
    { id: 'title',           label: 'Title' },
    { id: 'arranger',        label: 'Arranger' },
    { id: 'composer',        label: 'Composer' },
    { id: 'collection',      label: 'Collection' },
    { id: 'theme',           label: 'Occasion' },
    { id: 'publisher',       label: 'Publisher' },
    { id: 'boxNumber',       label: 'Box Number' },
    { id: 'collectionOrder', label: 'Collection Order' },
    { id: 'choirSongId',     label: 'ID' }
];

function sortedUnique(values) {

    return [...new Set(values.filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));
}

function keyTokens(song) {

    return clean(song.key)
        .split(/[\/,\s]+/)
        .filter(Boolean);
}

// Builds one display row per song, with its calculated fields.
function buildPraiseRows(songs, usages, choirSongs) {

    const boxesBySong = new Map();

    choirSongs.forEach(choir => {

        if (!choir.songId || !clean(choir.boxNumber)) {
            return;
        }

        const list = boxesBySong.get(choir.songId) ?? [];

        list.push({
            choirSongId: choir.choirSongId,
            box: clean(choir.boxNumber)
        });

        boxesBySong.set(choir.songId, list);
    });

    return songs.map(song => ({
        song,
        id: song.songId,
        title: clean(song.title),
        key: clean(song.key),
        tempo: song.tempo ?? '',
        tempoGroup: getTempoGroup(song) ?? '',
        lastPlayed: getLastPlayed(song.songId, usages) ?? '',
        timesUsed: getTimesUsed(song.songId, usages),
        restStatus: getRestStatus(song.songId, usages),
        source: clean(song.source),
        page: clean(song.page),
        composer: clean(song.composer),
        categories: categoryList(song),
        keys: keyTokens(song),
        boxes: boxesBySong.get(song.songId) ?? [],
        boxNumber: (boxesBySong.get(song.songId) ?? [])
            .map(b => b.box)
            .join(', ')
    }));
}

function buildChoirRows(choirSongs) {

    return choirSongs.map(choir => ({
        id: choir.choirSongId,
        title: clean(choir.title),
        arranger: clean(choir.arranger),
        composer: clean(choir.composer),
        collection: clean(choir.collection),
        theme: clean(choir.theme),
        publisher: clean(choir.publisher),
        boxNumber: clean(choir.boxNumber),
        collectionOrder: clean(choir.collectionOrder),
        choirSongId: clean(choir.choirSongId),
        medleySongs: clean(choir.medleySongs)
    }));
}

// ---------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------

function cycleSort(sort, col) {

    if (!sort || sort.col !== col) {
        return { col, dir: 1 };
    }

    return sort.dir === 1
        ? { col, dir: -1 }
        : null;
}

function sortRows(rows, sort) {

    if (!sort) {
        return rows;
    }

    return [...rows].sort((a, b) => {

        const x = a[sort.col] ?? '';
        const y = b[sort.col] ?? '';

        const result =
            typeof x === 'number' && typeof y === 'number'
                ? x - y
                : String(x).localeCompare(
                    String(y),
                    undefined,
                    { numeric: true }
                );

        return (
            result ||
            a.title.localeCompare(b.title)
        ) * sort.dir;
    });
}

function sortHeader(cols, sort) {

    return cols
        .map(col => {

            const active = sort?.col === col.id;

            const arrow =
                active
                    ? (sort.dir === 1 ? ' ▲' : ' ▼')
                    : '';

            return `
                <th
                    data-sort="${col.id}"
                    aria-sort="${
                        active
                            ? (sort.dir === 1 ? 'ascending' : 'descending')
                            : 'none'
                    }">
                    ${esc(col.label)}${arrow}
                </th>
            `;
        })
        .join('');
}

// ---------------------------------------------------------------
// Opening the detail cards
// ---------------------------------------------------------------

// Ids from the page are strings and ids in the data are numbers,
// so they are always compared as strings.
function highlightRow(id) {

    document
        .querySelectorAll('#libraryPanel tr.selected')
        .forEach(tr => tr.classList.remove('selected'));

    if (id === null || id === undefined) {
        return;
    }

    document
        .querySelectorAll('#libraryPanel tr[data-id]')
        .forEach(tr => {

            if (tr.dataset.id === String(id)) {
                tr.classList.add('selected');
            }
        });
}

function openPraise(id) {

    lib.praise.selected = id;

    highlightRow(id);

    openSongDetail(id, {
        owner: OWNER,
        onSeeUses: songId => seeUses(songId, 'library'),
        onClose: () => {
            lib.praise.selected = null;
            highlightRow(null);
        }
    });
}

function openChoir(id) {

    lib.choir.selected = id;

    highlightRow(id);

    openChoirDetail(id, {
        owner: OWNER,
        onClose: () => {
            lib.choir.selected = null;
            highlightRow(null);
        }
    });
}

// ---------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------

export function renderLibrary() {

    const content =
        document.getElementById('pageContent');

    content.innerHTML = `

        <div class="library-tabs" role="group" aria-label="Library">

            <button
                class="library-tab ${lib.tab === 'praise' ? 'active praise' : ''}"
                data-libtab="praise"
                aria-pressed="${lib.tab === 'praise'}">
                Praise Team Library
            </button>

            <button
                class="library-tab ${lib.tab === 'choir' ? 'active choir' : ''}"
                data-libtab="choir"
                aria-pressed="${lib.tab === 'choir'}">
                Choir Library
            </button>

        </div>

        <section class="panel library-panel" id="libraryPanel"></section>
    `;

    content
        .querySelectorAll('[data-libtab]')
        .forEach(button =>
            button.addEventListener('click', () => {
                lib.tab = button.dataset.libtab;
                renderLibrary();
            })
        );

    if (lib.tab === 'praise') {
        renderPraise();
    }
    else {
        renderChoir();
    }
}

// ---------------- Praise Team ----------------

function renderPraise() {

    const { songs, usages, choirSongs } = getData();

    const state = lib.praise;

    const allRows =
        buildPraiseRows(songs, usages, choirSongs ?? []);

    const keyOptions =
        sortedUnique(allRows.flatMap(row => row.keys));

    const categoryOptions =
        sortedUnique(allRows.flatMap(row => row.categories));

    const q = state.query.trim().toLowerCase();

    const shown = allRows.filter(row => {

        if (state.key && !row.keys.includes(state.key)) {
            return false;
        }

        if (state.category && !row.categories.includes(state.category)) {
            return false;
        }

        if (!q) {
            return true;
        }

        return [
            row.title,
            row.composer,
            row.source,
            row.key,
            row.categories.join(' ')
        ].some(text => text.toLowerCase().includes(q));
    });

    const sorted = sortRows(shown, state.sort);

    const hasFilters =
        state.key || state.category || state.query.trim() !== '';

    const panel = document.getElementById('libraryPanel');

    panel.innerHTML = `

        <div class="panel-header">

            <div>
                <h2>Praise Team library</h2>
                <div class="panel-subtitle">
                    ${shown.length} ${shown.length === 1 ? 'song' : 'songs'}
                </div>
            </div>

            <div class="filter-row">

                <select id="libKey" aria-label="Filter by key" class="lib-select">
                    <option value="">All keys</option>
                    ${keyOptions.map(k => `
                        <option value="${esc(k)}" ${k === state.key ? 'selected' : ''}>
                            Key: ${esc(k)}
                        </option>`).join('')}
                </select>

                <select id="libCategory" aria-label="Filter by category" class="lib-select">
                    <option value="">All categories</option>
                    ${categoryOptions.map(c => `
                        <option value="${esc(c)}" ${c === state.category ? 'selected' : ''}>
                            ${esc(c)}
                        </option>`).join('')}
                </select>

                <button
                    id="libClear"
                    class="clear-button ${hasFilters ? '' : 'hidden'}">
                    Clear ✕
                </button>

                <input
                    id="libSearch"
                    type="search"
                    class="lib-search"
                    value="${esc(state.query)}"
                    placeholder="Search songs"
                    aria-label="Search songs">

            </div>

        </div>

        <div class="table-wrap" tabindex="0">
            ${sorted.length === 0
                ? '<div class="empty-note">No songs match this search.</div>'
                : `
                <table class="lib-table">
                    <thead><tr>${sortHeader(PRAISE_COLS, state.sort)}</tr></thead>
                    <tbody>
                        ${sorted.map(row => praiseRowHtml(row, state.selected)).join('')}
                    </tbody>
                </table>`}
        </div>
    `;

    wireLibraryControls(panel, state, renderPraise);

    document.getElementById('libKey')
        .addEventListener('change', event => {
            state.key = event.target.value;
            renderPraise();
        });

    document.getElementById('libCategory')
        .addEventListener('change', event => {
            state.category = event.target.value;
            renderPraise();
        });

    // Clear also empties the search box.
    document.getElementById('libClear')
        .addEventListener('click', () => {
            state.key = '';
            state.category = '';
            state.query = '';
            renderPraise();
        });

    panel.querySelectorAll('tr[data-id]')
        .forEach(tr =>
            tr.addEventListener('click', () => openPraise(tr.dataset.id))
        );

    // Box number buttons open that song in the Choir Library.
    panel.querySelectorAll('[data-choir]')
        .forEach(button =>
            button.addEventListener('click', event => {

                event.stopPropagation();

                lib.tab = 'choir';

                renderLibrary();

                openChoir(button.dataset.choir);
            })
        );
}

function praiseRowHtml(row, selectedId) {

    const tempoClass =
        row.tempoGroup === 'Faster' ? 'faster-tag' : 'slower-tag';

    const boxes =
        row.boxes
            .map(b => `
                <button
                    type="button"
                    class="box-link"
                    data-choir="${esc(b.choirSongId)}"
                    title="Open in the Choir Library">
                    ${esc(b.box)}
                </button>`)
            .join(' ');

    const selected =
        selectedId !== null && String(row.id) === String(selectedId);

    return `
        <tr
            data-id="${esc(row.id)}"
            class="${selected ? 'selected' : ''}">

            <td><button type="button" class="title-link">${esc(row.title || 'Untitled')}</button></td>
            <td>${row.key ? `<span class="key-tag">${esc(row.key)}</span>` : ''}</td>
            <td>${esc(row.tempo)}</td>
            <td>${row.tempoGroup
                ? `<span class="tempo-tag ${tempoClass}">${esc(row.tempoGroup)}</span>`
                : ''}</td>
            <td>${esc(row.lastPlayed)}</td>
            <td>${esc(row.source)}</td>
            <td>${esc(row.page)}</td>
            <td>${boxes}</td>
        </tr>
    `;
}

// ---------------- Choir ----------------

function renderChoir() {

    const { choirSongs } = getData();

    const state = lib.choir;

    const allRows = buildChoirRows(choirSongs ?? []);

    const collections = sortedUnique(allRows.map(r => r.collection));
    const occasions = sortedUnique(allRows.map(r => r.theme));

    const q = state.query.trim().toLowerCase();

    const shown = allRows.filter(row => {

        if (state.collection && row.collection !== state.collection) {
            return false;
        }

        if (state.theme && row.theme !== state.theme) {
            return false;
        }

        if (!q) {
            return true;
        }

        return [
            row.title,
            row.arranger,
            row.composer,
            row.medleySongs
        ].some(text => text.toLowerCase().includes(q));
    });

    const sorted = sortRows(shown, state.sort);

    const hasFilters =
        state.collection || state.theme || state.query.trim() !== '';

    const panel = document.getElementById('libraryPanel');

    panel.innerHTML = `

        <div class="panel-header">

            <div>
                <h2>Choir library</h2>
                <div class="panel-subtitle">
                    ${shown.length} ${shown.length === 1 ? 'song' : 'songs'}
                </div>
            </div>

            <div class="filter-row">

                <select id="choirCollection" aria-label="Filter by collection" class="lib-select">
                    <option value="">All collections</option>
                    ${collections.map(c => `
                        <option value="${esc(c)}" ${c === state.collection ? 'selected' : ''}>
                            ${esc(c)}
                        </option>`).join('')}
                </select>

                <select id="choirTheme" aria-label="Filter by occasion" class="lib-select">
                    <option value="">All occasions</option>
                    ${occasions.map(t => `
                        <option value="${esc(t)}" ${t === state.theme ? 'selected' : ''}>
                            ${esc(t)}
                        </option>`).join('')}
                </select>

                <button
                    id="choirClear"
                    class="clear-button choir ${hasFilters ? '' : 'hidden'}">
                    Clear ✕
                </button>

                <input
                    id="libSearch"
                    type="search"
                    class="lib-search"
                    value="${esc(state.query)}"
                    placeholder="Search choir songs"
                    aria-label="Search choir songs">

            </div>

        </div>

        <div class="table-wrap" tabindex="0">
            ${sorted.length === 0
                ? '<div class="empty-note">No choir songs match this search.</div>'
                : `
                <table class="lib-table choir">
                    <thead><tr>${sortHeader(CHOIR_COLS, state.sort)}</tr></thead>
                    <tbody>
                        ${sorted.slice(0, state.limit).map(row => choirRowHtml(row, state.selected)).join('')}
                    </tbody>
                </table>
                ${sorted.length > state.limit
                    ? `<div class="more-row">
                           <button id="choirMore" class="clear-button">
                               Show more (${sorted.length - state.limit} left)
                           </button>
                       </div>`
                    : ''}`}
        </div>
    `;

    wireLibraryControls(panel, state, renderChoir);

    document.getElementById('choirCollection')
        .addEventListener('change', event => {
            state.collection = event.target.value;
            state.limit = 200;
            renderChoir();
        });

    document.getElementById('choirTheme')
        .addEventListener('change', event => {
            state.theme = event.target.value;
            state.limit = 200;
            renderChoir();
        });

    // Clear also empties the search box and resets the paging.
    document.getElementById('choirClear')
        .addEventListener('click', () => {
            state.collection = '';
            state.theme = '';
            state.query = '';
            state.limit = 200;
            renderChoir();
        });

    document.getElementById('choirMore')
        ?.addEventListener('click', () => {
            state.limit += 300;
            renderChoir();
        });

    panel.querySelectorAll('tr[data-id]')
        .forEach(tr =>
            tr.addEventListener('click', () => openChoir(tr.dataset.id))
        );
}

function choirRowHtml(row, selectedId) {

    const tag = value =>
        value ? `<span class="choir-tag">${esc(value)}</span>` : '';

    const text = value =>
        `<span class="clamp">${esc(value)}</span>`;

    const selected =
        selectedId !== null && String(row.id) === String(selectedId);

    return `
        <tr
            data-id="${esc(row.id)}"
            class="${selected ? 'selected' : ''}">

            <td><button type="button" class="title-link">${esc(row.title || 'Untitled')}</button></td>
            <td>${text(row.arranger)}</td>
            <td>${text(row.composer)}</td>
            <td>${tag(row.collection)}</td>
            <td>${tag(row.theme)}</td>
            <td>${text(row.publisher)}</td>
            <td>${esc(row.boxNumber)}</td>
            <td>${esc(row.collectionOrder)}</td>
            <td>${esc(row.choirSongId)}</td>
        </tr>
    `;
}

// ---------------- Shared ----------------

function wireLibraryControls(panel, state, rerender) {

    panel.querySelectorAll('th[data-sort]')
        .forEach(th =>
            th.addEventListener('click', () => {
                state.sort = cycleSort(state.sort, th.dataset.sort);
                rerender();
            })
        );

    const search = document.getElementById('libSearch');

    search.addEventListener('input', event => {

        state.query = event.target.value;

        if ('limit' in state) {
            state.limit = 200;
        }

        const caret = event.target.selectionStart;

        rerender();

        // Re-rendering replaced the input, so give focus back.
        const fresh = document.getElementById('libSearch');
        fresh.focus();
        fresh.setSelectionRange(caret, caret);
    });
}
