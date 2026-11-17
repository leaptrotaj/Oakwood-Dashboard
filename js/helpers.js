import { goBack, state }
    from './app.js';

import {
    getTempoGroup,
    normalizeDate
}
from './calculatedFields.js';

import { getSundayISO }
    from './dates.js';

export const RECENT_LIMIT = 25;

const POSITION_ORDER =
    ['early', 'middle', 'anthem', 'ccd', 'invitation'];

function positionRank(position) {

    const index =
        POSITION_ORDER.indexOf(
            String(position ?? '').trim().toLowerCase()
        );

    return index === -1
        ? POSITION_ORDER.length
        : index;
}

// Set when a click should scroll a list; used once by the next refresh.
let pendingScroll = null;

export function requestScroll(from) {
    pendingScroll = from;
}

function centerInScroller(el) {

    let box = el.parentElement;

    while (box && box !== document.body) {

        const overflow =
            getComputedStyle(box).overflowY;

        if (
            (overflow === 'auto' || overflow === 'scroll') &&
            box.scrollHeight > box.clientHeight
        ) {
            break;
        }

        box = box.parentElement;
    }

    if (!box || box === document.body) {

        el.scrollIntoView({
            block: 'center',
            behavior: 'smooth'
        });

        return;
    }

    const boxRect = box.getBoundingClientRect();
    const rowRect = el.getBoundingClientRect();

    const top =
        box.scrollTop +
        (rowRect.top - boxRect.top) -
        (box.clientHeight - rowRect.height) / 2;

    box.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth'
    });
}

// ---------------------------------------------------------------
// Basic helpers
// ---------------------------------------------------------------

export function esc(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function samePosition(a, b) {

    return (
        String(a ?? '').trim().toLowerCase() ===
        String(b ?? '').trim().toLowerCase()
    );
}

export function setChip(id, active) {

    const el =
        document.getElementById(id);

    if (!el) {
        return;
    }

    el.classList.toggle(
        'active',
        active
    );

    el.setAttribute(
        'aria-pressed',
        String(active)
    );
}

// ---------------------------------------------------------------
// Data shape check
// ---------------------------------------------------------------
//
// getData() must return:
//   songs  : [{ songId, title, tempo, timeSignature }]
//   usages : [{ songId, dateUsed, position }]
//
// Logs a console warning (once per problem) if a property is
// missing, so a renamed field doesn't fail silently.

const warned =
    new Set();

export function checkDataShape(data) {

    const problems = [];

    if (!Array.isArray(data?.songs)) {
        problems.push('getData().songs is not an array');
    }

    if (!Array.isArray(data?.usages)) {
        problems.push('getData().usages is not an array');
    }

    const song =
        data?.songs?.[0];

    if (song) {

        ['songId', 'title', 'tempo', 'timeSignature']
            .filter(key => !(key in song))
            .forEach(key =>
                problems.push(`song is missing "${key}"`)
            );
    }

    const usage =
        data?.usages?.[0];

    if (usage) {

        ['songId', 'dateUsed', 'position']
            .filter(key => !(key in usage))
            .forEach(key =>
                problems.push(`usage is missing "${key}"`)
            );
    }

    problems.forEach(problem => {

        if (!warned.has(problem)) {

            warned.add(problem);

            console.warn(
                `[Oakwood] Data shape: ${problem}`
            );
        }
    });

    return problems.length === 0;
}

// ---------------------------------------------------------------
// Per-page filters
// ---------------------------------------------------------------
//
// Each page asks for its own filter object by key, so a filter
// set on one page never changes the other.

export function getPageFilters(pageKey) {

    state.pageFilters ??= {};

    state.pageFilters[pageKey] ??= {
        positionFilter: null,
        tempoFilter: null,
        yearOnly: false,
        dateSel: null,          // null, 'last' or 'next'
        selectedSongId: null,   // song highlighted by a click
        selectedFrom: null      // 'most' or 'recent'
    };

    return state.pageFilters[pageKey];
}

export function hasActiveFilters(filters) {

    return Boolean(
        filters.positionFilter ||
        filters.tempoFilter ||
        filters.yearOnly ||
        filters.dateSel ||
        filters.selectedSongId
    );
}

export function describeFilters(filters) {

    return [
        filters.positionFilter,
        filters.tempoFilter,
        filters.yearOnly ? 'This year' : null,
        filters.dateSel === 'last'
            ? 'Most recent Sunday'
            : filters.dateSel === 'next'
                ? 'Next Sunday'
                : null
    ]
        .filter(Boolean)
        .join(' + ');
}

export function matchesPositionFilter(
    usage,
    filters
) {

    if (filters.positionFilter === 'Invitation') {

        return samePosition(
            usage.position,
            'Invitation'
        );
    }

    if (filters.positionFilter === 'Anthem') {

        return (
            samePosition(usage.position, 'Anthem') ||
            samePosition(usage.position, 'CCD')
        );
    }

    return true;
}

export function buildSongIndex(songs) {

    return new Map(
        songs.map(song => [song.songId, song])
    );
}

// Songs with at least one usage in the current year.
export function getSongsUsedThisYear(usages) {

    const currentYear =
        new Date().getFullYear();

    const ids =
        new Set();

    usages.forEach(usage => {

        const date =
            normalizeDate(usage.dateUsed);

        if (
            date &&
            Number(date.slice(0, 4)) === currentYear
        ) {
            ids.add(usage.songId);
        }
    });

    return ids;
}

// Keeps usages of songs in songById that pass the position,
// tempo and this-year filters. (The Sunday filter is applied in
// refreshUsagePanels because it changes both lists differently.)
export function filterUsages(
    usages,
    songById,
    filters
) {

    const thisYear =
        filters.yearOnly
            ? getSongsUsedThisYear(usages)
            : null;

    return usages.filter(usage => {

        const song =
            songById.get(usage.songId);

        if (!song) {
            return false;
        }

        if (
            thisYear &&
            !thisYear.has(usage.songId)
        ) {
            return false;
        }

        if (
            filters.positionFilter &&
            !matchesPositionFilter(usage, filters)
        ) {
            return false;
        }

        if (
            filters.tempoFilter &&
            getTempoGroup(song) !== filters.tempoFilter
        ) {
            return false;
        }

        return true;
    });
}

export function countSongsWithoutTempo(songs) {

    return songs.filter(
        song => getTempoGroup(song) === null
    ).length;
}

// ---------------------------------------------------------------
// Rows
// ---------------------------------------------------------------

export function buildMostUsedRows(songs, usages) {

    const counts =
        new Map();

    usages.forEach(usage => {

        counts.set(
            usage.songId,
            (counts.get(usage.songId) || 0) + 1
        );
    });

    return songs
        .map(song => ({
            song,
            count: counts.get(song.songId) ?? 0
        }))
        .filter(row => row.count > 1)
        .sort((a, b) =>
            b.count - a.count ||
            String(a.song.title).localeCompare(
                String(b.song.title)
            )
        );
}

export function buildRecentRows(
    usages,
    limit = RECENT_LIMIT
) {

    const newest =
        new Map();

    usages.forEach(usage => {

        const date =
            normalizeDate(usage.dateUsed);

        // Usages with no valid date can't be "recent".
        if (!date) {
            return;
        }

        const current =
            newest.get(usage.songId);

        if (!current || date > current.date) {

            newest.set(
                usage.songId,
                { usage, date }
            );
        }
    });

    return [...newest.values()]
        .sort((a, b) =>
            b.date.localeCompare(a.date)
        )
        .slice(0, limit);
}

// ---------------------------------------------------------------
// Markup
// ---------------------------------------------------------------

export function renderUsagePanels({
    mostUsedTitle,
    recentTitle
}) {

    return `

        <section class="panel">

            <div id="backBar" class="back-bar hidden">

                <button id="backButton" type="button" class="back-button"></button>

            </div>

            <div class="panel-header">

                <div>

                    <h2>
                        ${esc(mostUsedTitle)}
                    </h2>

                    <div
                        id="mostUsedSubtitle"
                        class="panel-subtitle">

                    </div>

                </div>

                <div class="filter-row">

                    <button
                        id="anthemFilter"
                        class="filter-chip">

                        Anthem

                    </button>

                    <button
                        id="invitationFilter"
                        class="filter-chip">

                        Invitation

                    </button>

                    <button
                        id="fasterFilter"
                        class="filter-chip faster">

                        Faster

                    </button>

                    <button
                        id="slowerFilter"
                        class="filter-chip slower">

                        Slower

                    </button>

                </div>

            </div>

            <div class="panel-body">

                <div
                    id="filterNote"
                    class="panel-subtitle hidden">

                </div>

                <div id="mostUsedSongs">

                </div>

            </div>

        </section>

        <section class="panel">

            <div class="panel-header">

                <div>

                    <h2>
                        ${esc(recentTitle)}
                    </h2>

                    <div
                        id="recentSubtitle"
                        class="panel-subtitle">

                        Newest first

                    </div>

                </div>

                <button
                    id="clearFilters"
                    class="clear-button hidden">

                    ✕ Clear

                </button>

            </div>

            <div class="panel-body">

                <div id="recentSongs">

                </div>

            </div>

        </section>
    `;
}

export function mostUsedHtml(rows, selectedId = null, missing = null) {

    if (!rows.length && !missing) {

        return '<div class="panel-subtitle">No songs found.</div>';
    }

    const max =
        rows.length ? rows[0].count : 1;

    const list = rows
        .map((row, index) => {

            let rankClass =
                'rank-normal';

            if (index === 0)
                rankClass = 'rank-gold';

            else if (index === 1)
                rankClass = 'rank-silver';

            else if (index === 2)
                rankClass = 'rank-bronze';

            const selected =
                row.song.songId === selectedId;

            return `
                <div
                    class="song-row selectable ${selected ? 'selected' : ''}"
                    data-song-id="${esc(row.song.songId)}"
                    role="button"
                    tabindex="0"
                    aria-pressed="${selected}">

                    <div class="rank ${rankClass}">
                        ${index + 1}
                    </div>

                    <div class="song-title">
                        ${esc(row.song.title)}
                    </div>

                    <div class="bar">

                        <div
                            class="bar-fill"
                            style="width:${
                                row.count /
                                max *
                                100
                            }%">

                        </div>

                    </div>

                    <div class="song-count">
                        ${row.count}
                    </div>

                </div>
            `;
        })
        .join('');

    // The selected song isn't in this list (for example, it was
    // used only once): say so instead of hiding the selection.
    const note = missing
        ? `
            <div
                class="song-row missing selectable selected"
                data-song-id="${esc(missing.id)}"
                role="button"
                tabindex="0"
                aria-pressed="true">

                <div class="rank rank-normal">-</div>

                <div class="song-title" title="${esc(missing.title)}">
                    ${esc(missing.title)}
                </div>

                <div class="missing-note">
                    Not in this list (used ${missing.n} ${missing.n === 1 ? 'time' : 'times'})
                </div>

            </div>
        `
        : '';

    return list + note;
}

export function recentHtml(rows, songById, selectedId = null) {

    if (!rows.length) {

        return '<div class="panel-subtitle">No songs found.</div>';
    }

    return rows
        .map(({ usage, date }, index) => {

            const song =
                songById.get(usage.songId);

            if (!song) {
                return '';
            }

            const selected =
                usage.songId === selectedId;

            const newDate =
                index > 0 && rows[index - 1].date !== date;

            return `
                <div
                    class="recent-item selectable ${selected ? 'selected' : ''} ${newDate ? 'new-date' : ''}"
                    data-song-id="${esc(usage.songId)}"
                    role="button"
                    tabindex="0"
                    aria-pressed="${selected}">

                    <div>

                        <div class="recent-title">
                            ${esc(song.title)}
                        </div>

                        <div class="recent-position">
                            ${esc(usage.position ?? '')}
                        </div>

                    </div>

                    <div class="recent-date">

                        <div class="recent-date-main">
                            ${esc(date)}
                        </div>

                    </div>

                </div>
            `;
        })
        .join('');
}

// ---------------------------------------------------------------
// Events and refresh
// ---------------------------------------------------------------

// Wires the chips and the Clear button for one page's filters.
// onChange runs after any change (normally the page's refresh).
export function wireFilterEvents(
    filters,
    onChange
) {

    const toggle = (key, value) => () => {

        filters[key] =
            filters[key] === value
                ? null
                : value;

        onChange();
    };

    const on = (id, handler) =>
        document
            .getElementById(id)
            ?.addEventListener('click', handler);

    on('anthemFilter', toggle('positionFilter', 'Anthem'));
    on('invitationFilter', toggle('positionFilter', 'Invitation'));
    on('fasterFilter', toggle('tempoFilter', 'Faster'));
    on('slowerFilter', toggle('tempoFilter', 'Slower'));
    on('backButton', goBack);
    on('clearFilters', () => {

        filters.positionFilter = null;
        filters.tempoFilter = null;
        filters.yearOnly = false;
        filters.dateSel = null;
        filters.selectedSongId = null;
        filters.selectedFrom = null;

        onChange();
    });

    wireSongSelection(filters, onChange);
}

function updateBackBar() {

    const bar = document.getElementById('backBar');

    if (!bar) {
        return;
    }

    bar.classList.toggle('hidden', !state.backTo);

    document.getElementById('backButton').textContent =
        state.backTo === 'library'
            ? '← Back to Song Library'
            : '← Back to Suggestions';
}

// Click (or Enter/Space) on a song in either list. The lists are
// redrawn on every refresh, so the listener sits on their containers.
function wireSongSelection(filters, onChange) {

    const listen = (containerId, from) => {

        const container =
            document.getElementById(containerId);

        if (!container) {
            return;
        }

        const select = event => {

            const row =
                event.target.closest('[data-song-id]');

            if (!row) {
                return;
            }

            if (event.type === 'keydown') {

                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
            }

            // Page ids are strings; ids in the data are numbers.
            const raw = row.dataset.songId;

            const songId =
                raw !== '' && !Number.isNaN(Number(raw))
                    ? Number(raw)
                    : raw;

            if (
                filters.selectedSongId === songId &&
                filters.selectedFrom === from
            ) {

                filters.selectedSongId = null;
                filters.selectedFrom = null;
                pendingScroll = null;
            }
            else {

                filters.selectedSongId = songId;
                filters.selectedFrom = from;

                // Picking a song replaces any Sunday filter.
                if (from === 'most') {
                    filters.dateSel = null;
                }

                pendingScroll = from;
            }

            onChange();
        };

        container.addEventListener('click', select);
        container.addEventListener('keydown', select);
    };

    listen('mostUsedSongs', 'most');
    listen('recentSongs', 'recent');
}

export function updateFilterButtons(filters) {

    setChip(
        'anthemFilter',
        filters.positionFilter === 'Anthem'
    );

    setChip(
        'invitationFilter',
        filters.positionFilter === 'Invitation'
    );

    setChip(
        'fasterFilter',
        filters.tempoFilter === 'Faster'
    );

    setChip(
        'slowerFilter',
        filters.tempoFilter === 'Slower'
    );

    document
        .getElementById('clearFilters')
        ?.classList.toggle(
            'hidden',
            !hasActiveFilters(filters)
        );
}

// Lights up the stat tiles that are acting as filters.
// Pass null to switch them all off (pages without tile filters).
export function syncTileStates(filters) {

    const set = (id, active) => {

        const el =
            document.getElementById(id);

        if (!el) {
            return;
        }

        el.classList.toggle('active', active);

        el.setAttribute(
            'aria-pressed',
            String(active)
        );
    };

    set('tileYear', Boolean(filters?.yearOnly));
    set('tileRecent', filters?.dateSel === 'last');
    set('tileUpcoming', filters?.dateSel === 'next');
}

export function refreshUsagePanels({
    songs,
    usages,
    filters,
    baseSubtitle
}) {

    const songById =
        buildSongIndex(songs);

    const filtered =
        filterUsages(
            usages,
            songById,
            filters
        );

    const selectedId =
        filters.selectedSongId;

    let mostUsedRows =
        buildMostUsedRows(songs, filtered);

    let recentRows = null;

    let recentSubtitle = 'Newest first';

    if (filters.dateSel) {

        // A Sunday is selected: show that day's songs (with their
        // overall counts) and that day's usages.
        const iso =
            getSundayISO(filters.dateSel);

        const onDate =
            filtered.filter(usage =>
                normalizeDate(usage.dateUsed) === iso
            );

        const idsOnDate =
            new Set(
                onDate.map(usage => usage.songId)
            );

        mostUsedRows =
            mostUsedRows.filter(row =>
                idsOnDate.has(row.song.songId)
            );

        recentRows =
            onDate
                .map(usage => ({ usage, date: iso }))
                .sort((a, b) =>
                    String(songById.get(a.usage.songId)?.title)
                        .localeCompare(
                            String(songById.get(b.usage.songId)?.title)
                        )
                );

        recentSubtitle =
            filters.dateSel === 'last'
                ? 'Songs used on the most recent Sunday'
                : 'Songs used on the next Sunday';
    }
    else if (selectedId && filters.selectedFrom === 'most') {

        // A song was picked in Most Used: show every date it was
        // used, with the other songs from those dates.
        const dates =
            new Set(
                filtered
                    .filter(usage => usage.songId === selectedId)
                    .map(usage => normalizeDate(usage.dateUsed))
                    .filter(Boolean)
            );

        if (dates.size) {

            recentRows =
                filtered
                    .map(usage => ({
                        usage,
                        date: normalizeDate(usage.dateUsed)
                    }))
                    .filter(row => dates.has(row.date))
                    .sort((a, b) =>
                        b.date.localeCompare(a.date) ||
                        positionRank(a.usage.position) -
                            positionRank(b.usage.position) ||
                        String(songById.get(a.usage.songId)?.title)
                            .localeCompare(
                                String(songById.get(b.usage.songId)?.title)
                            )
                    );

            recentSubtitle =
                `Uses of ${songById.get(selectedId)?.title ?? 'this song'} and songs from the same dates`;
        }
    }

    recentRows ??=
        buildRecentRows(filtered);

    const missingSelected =
        selectedId !== null &&
        selectedId !== undefined &&
        !mostUsedRows.some(row => row.song.songId === selectedId)
            ? {
                id: selectedId,
                title: songById.get(selectedId)?.title ?? 'This song',
                n: usages.filter(u => u.songId === selectedId).length
            }
            : null;

    document.getElementById('mostUsedSongs').innerHTML =
        mostUsedHtml(mostUsedRows, selectedId, missingSelected);
        
    document.getElementById('recentSongs').innerHTML =
        recentHtml(recentRows, songById, selectedId);

    const subtitle =
        document.getElementById('mostUsedSubtitle');

    if (subtitle) {

        subtitle.textContent =
            hasActiveFilters(filters) &&
            describeFilters(filters)
                ? `${baseSubtitle} (${describeFilters(filters)})`
                : baseSubtitle;
    }

    const recentSubtitleEl =
        document.getElementById('recentSubtitle');

    if (recentSubtitleEl) {
        recentSubtitleEl.textContent = recentSubtitle;
    }

    const note =
        document.getElementById('filterNote');

    if (note) {

        const missing =
            filters.tempoFilter
                ? countSongsWithoutTempo(songs)
                : 0;

        note.textContent =
            missing
                ? `${missing} ${missing === 1 ? 'song has' : 'songs have'} no tempo and ${missing === 1 ? 'is' : 'are'} not included while a tempo filter is on.`
                : '';

        note.classList.toggle(
            'hidden',
            !missing
        );
    }

    updateFilterButtons(filters);

    updateBackBar();

    // After a click: scroll the other list to the song.
    if (pendingScroll) {

        const target =
            pendingScroll === 'most'
                ? '#recentSongs .selected'      // most recent use is first
                : '#mostUsedSongs .selected';

        const el =
            document.querySelector(target);

        if (el) {
            centerInScroller(el);
        }

        pendingScroll = null;
    }
}
