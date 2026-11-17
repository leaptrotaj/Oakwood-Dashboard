import { getData, seeUses, showPage, state } from './app.js';
import { esc } from './helpers.js';
import { openSongDetail } from './songDetail.js';
import {
    getAdjustedTempo,
    getLastPlayed,
    getRestStatus,
    getSuggestOrder,
    getTempoGroup,
    getTimesUsed
} from './calculatedFields.js';

// ---------------------------------------------------------------
// Constants (same values as the original dashboard)
// ---------------------------------------------------------------

const OWNER = 'suggestions';

const LIST_COUNT = 3;      // lists built up front, so rerolls avoid each other
const SHOWN_LISTS = 2;     // lists actually shown
const MEDIUM_MIN = 91;
const MEDIUM_MAX = 115;

const SLOTS = [
    { label: 'Faster song', position: 'early', group: 'Faster', badge: 'Early' },
    { label: 'Another faster song', position: 'early', group: 'Faster', badge: 'Early' },
    { label: 'Medium tempo song', position: 'middle', group: 'Faster', medium: true, badge: 'Middle' },
    { label: 'Another middle song', position: 'middle', group: 'Faster', medium: true, badge: 'Middle' },
    { label: 'Invitation song', position: 'invitation', group: 'Slower', badge: 'Invitation' }
];

const TOGGLES = [
    ['Faster', 'F'],
    ['Slower', 'S'],
    ['Invitation', 'I']
];

const COLUMNS = [
    { id: 'title', label: 'Title' },
    { id: 'group', label: 'Tempo Group' },
    { id: 'key', label: 'Key' },
    { id: 'tempo', label: 'Tempo (BPM)' },
    { id: 'last', label: 'Last Played' },
    { id: 'times', label: 'Times Used' },
    { id: 'source', label: 'Source' },
    { id: 'page', label: 'Page' },
    { id: 'box', label: 'Box Number' }
];

// Seasonal categories: [month, day] ranges, inclusive.
const RANGES = {
    Christmas: [
        { from: [11, 20], to: [12, 31] },
        { from: [1, 1], to: [1, 6] },
        { from: [7, 1], to: [7, 31] }
    ],
    Thanksgiving: [{ from: [11, 1], to: [11, 30] }],
    Easter: [{ from: [3, 1], to: [4, 30] }]
};

const SEASONAL = new Set([...Object.keys(RANGES), 'Patriotic']);

// ---------------------------------------------------------------
// Season helpers
// ---------------------------------------------------------------

function sundayNearest(d) {

    const dow = d.getDay();
    const offset = dow <= 3 ? -dow : 7 - dow;

    return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + offset
    );
}

function sameDay(a, b) {

    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

// Memorial Day, Independence Day and Veterans Day weekends.
function isPatrioticSunday(d) {

    const y = d.getFullYear();
    const lastMay = new Date(y, 4, 31);
    const memorial = new Date(
        y,
        4,
        31 - ((lastMay.getDay() + 6) % 7)
    );

    return [
        memorial,
        new Date(y, 6, 4),
        new Date(y, 10, 11)
    ].some(h => sameDay(sundayNearest(h), d));
}

function nextServiceDate(today) {

    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + ((7 - today.getDay()) % 7)
    );
}

function inSeason(name, service) {

    if (name === 'Patriotic') {
        return isPatrioticSunday(service);
    }

    const ranges = RANGES[name];

    if (!ranges) {
        return true;
    }

    const v = (service.getMonth() + 1) * 100 + service.getDate();

    return ranges.some(
        r => v >= r.from[0] * 100 + r.from[1] &&
             v <= r.to[0] * 100 + r.to[1]
    );
}

// ---------------------------------------------------------------
// Page state (kept between visits to the page)
// ---------------------------------------------------------------

const sug = {
    selected: [],          // 'Faster' | 'Slower' | 'Invitation'
    keyText: '',
    sort: null,            // { col, dir }
    locks: {},             // `${list}-${slot}` -> true
    rerolls: {},           // list -> { ids, seen }
    sent: null,
    message: ''
};

let cache = null;          // built once per visit to the page
let keysWired = false;

// ---------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------

function buildCache() {

    const { songs, usages } = getData();

    const service = nextServiceDate(new Date());

    const posStats = new Map();
    const invitationIds = new Set();

    usages.forEach(u => {

        const pos = String(u.position ?? '').trim().toLowerCase();

        if (!u.songId || !pos) {
            return;
        }

        let s = posStats.get(u.songId);

        if (!s) {
            s = { total: 0 };
            posStats.set(u.songId, s);
        }

        s[pos] = (s[pos] ?? 0) + 1;
        s.total += 1;

        if (pos === 'invitation') {
            invitationIds.add(u.songId);
        }
    });

    const cands = songs
        .filter(song =>
            String(getRestStatus(song.songId, usages))
                .startsWith('Suggest-')
        )
        .map(song => {

            const lastPlayed = getLastPlayed(song.songId, usages) || '';
            const ts = Date.parse(lastPlayed);

            const tempoRaw = getAdjustedTempo(song);
            const tempoNum =
                tempoRaw === null || tempoRaw === undefined || tempoRaw === ''
                    ? NaN
                    : Number(tempoRaw);

            const orderNum = Number(getSuggestOrder(song.songId, usages));

            const categories = Array.isArray(song.categories)
                ? song.categories
                : [];
                
            const seasonal = categories.filter(c => SEASONAL.has(c));

            return {
                id: song.songId,
                song,
                title: song.title ?? '',
                key: song.key ?? '',
                group: getTempoGroup(song) || '',
                tempo: Number.isFinite(tempoNum) ? tempoNum : null,
                lastPlayed,
                lastTs: Number.isFinite(ts) ? ts : 0,
                order: Number.isFinite(orderNum) ? orderNum : 999,
                timesUsed: getTimesUsed(song.songId, usages),
                pos: posStats.get(song.songId) ?? { total: 0 },
                inSeason:
                    seasonal.length === 0 ||
                    seasonal.some(c => inSeason(c, service)),
                categories,
                isInvitation:
                    invitationIds.has(song.songId) ||
                    categories.includes('Invitation')
            };
        });

    const ranked = [...cands].sort(
        (a, b) =>
            a.order - b.order ||
            a.lastTs - b.lastTs ||
            a.title.localeCompare(b.title)
    );

    const c = {
        cands,
        ranked,
        byId: new Map(cands.map(x => [x.id, x])),
        baseLists: []
    };

    cache = c;

    c.baseLists = buildBaseLists();

    return c;
}

function posLevel(cand, position) {

    const n = cand.pos[position] ?? 0;

    if (n >= 2 && n / cand.pos.total >= 0.4) {
        return 0;
    }

    if (n >= 1) {
        return 1;
    }

    return 2;
}

function pickBest(slot, excluded) {

    let best = null;

    cache.ranked.forEach((c, idx) => {

        if (
            excluded.has(c.id) ||
            c.group !== slot.group ||
            !c.inSeason
        ) {
            return;
        }

        const level = posLevel(c, slot.position);

        const tier =
            slot.medium &&
            c.tempo !== null &&
            c.tempo >= MEDIUM_MIN &&
            c.tempo <= MEDIUM_MAX
                ? 0
                : slot.medium ? 1 : 0;

        if (
            !best ||
            level < best.level ||
            (level === best.level &&
                (tier < best.tier ||
                    (tier === best.tier && idx < best.idx)))
        ) {
            best = { cand: c, level, tier, idx };
        }
    });

    return best ? { cand: best.cand, level: best.level } : null;
}

function buildBaseLists() {

    const used = new Set();

    const out = Array.from({ length: LIST_COUNT }, () => []);

    SLOTS.forEach((slot, si) => {

        for (let li = 0; li < LIST_COUNT; li++) {

            const pick = pickBest(slot, used);

            if (pick) {
                used.add(pick.cand.id);
            }

            out[li][si] = pick;
        }
    });

    return out;
}

function currentLists() {

    return cache.baseLists
        .slice(0, SHOWN_LISTS)
        .map((list, li) => {

            const r = sug.rerolls[li];

            if (!r) {
                return list;
            }

            return r.ids.map(id => {

                const cand = id === null ? null : cache.byId.get(id);

                return cand ? { cand, level: 0 } : null;
            });
        });
}

// ---------------------------------------------------------------
// Reroll
// ---------------------------------------------------------------

function reroll(li) {

    const lists = currentLists();
    const cur = lists[li] ?? [];

    const isLocked = si =>
        Boolean(sug.locks[`${li}-${si}`]) && Boolean(cur[si]);

    const curIds = cur
        .filter((x, si) => x && !isLocked(si))
        .map(x => x.cand.id);

    const lockedIds = cur
        .filter((x, si) => x && isLocked(si))
        .map(x => x.cand.id);

    const others = new Set();

    lists.forEach((l, i) => {

        if (i !== li) {
            l.forEach(x => x && others.add(x.cand.id));
        }
    });

    const build = banned => {

        const used = new Set([...others, ...banned, ...lockedIds]);

        return SLOTS.map((slot, si) => {

            if (isLocked(si)) {
                return cur[si];
            }

            const pick = pickBest(slot, used);

            if (pick) {
                used.add(pick.cand.id);
            }

            return pick;
        });
    };

    const seen = new Set([
        ...(sug.rerolls[li]?.seen ?? []),
        ...curIds
    ]);

    let next = build(seen);
    let nextSeen = seen;

    // Ran out of fresh songs: start the "seen" memory over.
    if (next.some((x, si) => !x && !isLocked(si))) {

        nextSeen = new Set(curIds);
        next = build(nextSeen);
    }

    sug.rerolls[li] = {
        ids: next.map(x => x?.cand.id ?? null),
        seen: [...nextSeen]
    };

    sug.sent = null;
    sug.message = '';

    drawLists();
}

// ---------------------------------------------------------------
// Filtering and sorting
// ---------------------------------------------------------------

function wantedKeys() {

    return sug.keyText
        .split(/[,\s]+/)
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);
}

function shownSongs() {

    const wanted = wantedKeys();
    const tempoSel = sug.selected.filter(s => s !== 'Invitation');

    const shown = cache.ranked.filter(c => {

        if (tempoSel.length && !tempoSel.includes(c.group)) {
            return false;
        }

        if (sug.selected.includes('Invitation') && !c.isInvitation) {
            return false;
        }

        if (wanted.length) {

            const tokens = c.key
                .toLowerCase()
                .split(/[\/,\s]+/)
                .filter(Boolean);

            if (!wanted.some(w => tokens.includes(w))) {
                return false;
            }
        }

        return true;
    });

    if (!sug.sort) {
        return shown;
    }

    const { col, dir } = sug.sort;

    return [...shown].sort((a, b) => {

        const x = sortValue(a, col);
        const y = sortValue(b, col);

        const r =
            typeof x === 'number' && typeof y === 'number'
                ? x - y
                : String(x).localeCompare(
                    String(y),
                    undefined,
                    { numeric: true }
                );

        return (r || a.title.localeCompare(b.title)) * dir;
    });
}

function sortValue(c, col) {

    switch (col) {
        case 'title': return c.title;
        case 'group': return c.group;
        case 'key': return c.key;
        case 'tempo': return c.song.tempo ?? '';
        case 'last': return c.lastTs;
        case 'times': return c.timesUsed ?? 0;
        case 'source': return c.song.source ?? '';
        case 'page': return c.song.page ?? '';
        case 'box': return c.song.newBoxNumber ?? '';
        default: return '';
    }
}

function cycleSort(col) {

    const cur = sug.sort;

    if (!cur || cur.col !== col) {
        sug.sort = { col, dir: 1 };
    }
    else if (cur.dir === 1) {
        sug.sort = { col, dir: -1 };
    }
    else {
        sug.sort = null;
    }
}

function toggleGroup(g) {

    sug.selected = sug.selected.includes(g)
        ? sug.selected.filter(x => x !== g)
        : [...sug.selected, g];

    drawTable();
}

// ---------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------

function timeSigHtml(song) {

    const s = String(song.timeSignature ?? '').trim();

    if (!s) {
        return '';
    }

    const parts = s.split('/').map(x => x.trim());

    if (parts.length === 2 && parts[0] && parts[1]) {
        return `<span>${esc(parts[0])}</span><span>${esc(parts[1])}</span>`;
    }

    return esc(s);
}

function slotHtml(item, slot, li, si) {

    if (!item) {
        return '<li><div class="sug-empty">No suggestion available</div></li>';
    }

    const locked = Boolean(sug.locks[`${li}-${si}`]);
    const c = item.cand;

    return `
        <li>
            <div class="sug-slot ${locked ? 'locked' : ''}">

                <button
                    type="button"
                    class="sug-slot-main"
                    data-lock="${li}-${si}"
                    title="${esc(slot.label)}: click to ${locked ? 'unlock' : 'lock'}"
                >
                    <span class="sug-badge">${esc(slot.badge)}</span>
                    <span class="sug-slot-title" title="${esc(c.title)}">${esc(c.title)}</span>
                    <span class="sug-slot-label">${esc(slot.label)}</span>
                    <span class="sug-slot-tempo">${c.tempo !== null ? `${Math.round(c.tempo)} BPM` : ''}</span>
                    <span class="sug-slot-sig">${timeSigHtml(c.song)}</span>
                    <span class="sug-slot-key">${esc(c.key)}</span>
                </button>

                <button
                    type="button"
                    class="sug-lock ${locked ? 'on' : ''}"
                    data-lock="${li}-${si}"
                    aria-pressed="${locked}"
                    aria-label="${locked ? 'Unlock' : 'Lock'} ${esc(c.title)}"
                    title="${locked ? 'Locked: Reroll keeps this song' : 'Lock this song'}"
                >${locked ? '🔒' : '🔓'}</button>

            </div>
        </li>
    `;
}

function listsHtml() {

    return currentLists().map((list, li) => `
        <div class="sug-card">

            <div class="sug-card-header">

                <h3>Quick Order of Service</h3>

                <div class="sug-card-actions">

                    <button
                        type="button"
                        class="sug-button"
                        data-reroll="${li}"
                        title="Pick new songs for this service (locked songs stay)"
                    >↻ Reroll</button>

                    <button
                        type="button"
                        class="sug-button primary"
                        data-send="${li}"
                    >${sug.sent === li ? 'Loaded to builder' : 'Load to builder'}</button>

                </div>
            </div>

            <ol class="sug-slots">
                ${SLOTS.map((slot, si) => slotHtml(list[si], slot, li, si)).join('')}
            </ol>

        </div>
    `).join('');
}

function drawLists() {

    const box = document.getElementById('sugLists');

    if (!box) {
        return;
    }

    box.innerHTML =
        (sug.message
            ? `<div class="sug-alert" role="alert">${esc(sug.message)}</div>`
            : '') +
        `<div class="sug-grid">${listsHtml()}</div>`;
}

function headerHtml() {

    return COLUMNS.map(col => {

        const active = sug.sort?.col === col.id;
        const arrow = active ? (sug.sort.dir === 1 ? ' ▲' : ' ▼') : '';

        return `
            <th
                data-sort="${col.id}"
                aria-sort="${active ? (sug.sort.dir === 1 ? 'ascending' : 'descending') : 'none'}"
            >${esc(col.label)}${arrow}</th>
        `;
    }).join('');
}

function rowHtml(c) {

    const group = c.group
        ? `<span class="tempo-tag ${c.group === 'Faster' ? 'faster-tag' : 'slower-tag'}">${esc(c.group)}</span>`
        : '';

    const key = c.key
        ? `<span class="key-tag">${esc(c.key)}</span>`
        : '';

    return `
        <tr data-song-id="${esc(c.id)}">
            <td class="sug-title">${esc(c.title)}</td>
            <td>${group}</td>
            <td>${key}</td>
            <td class="num">${esc(c.song.tempo ?? '')}</td>
            <td class="nowrap">${esc(c.lastPlayed)}</td>
            <td class="num">${esc(c.timesUsed ?? '')}</td>
            <td>${esc(c.song.source ?? '')}</td>
            <td>${esc(c.song.page ?? '')}</td>
            <td class="num">${esc(c.song.newBoxNumber ?? '')}</td>
        </tr>
    `;
}

function drawTable() {

    const wrap = document.getElementById('sugTableWrap');

    if (!wrap) {
        return;
    }

    const shown = shownSongs();
    const wanted = wantedKeys();

    const label = sug.selected.length === 0
        ? 'All suggestions'
        : sug.selected.join(' + ');

    document.getElementById('sugSubtitle').textContent =
        `${label}${wanted.length ? `, key ${wanted.join('/').toUpperCase()}` : ''}: ` +
        `${shown.length} ${shown.length === 1 ? 'song' : 'songs'}`;

    TOGGLES.forEach(([g]) => {

        const button = document.querySelector(`[data-toggle="${g}"]`);

        if (button) {
            button.classList.toggle('active', sug.selected.includes(g));
            button.setAttribute('aria-pressed', String(sug.selected.includes(g)));
        }
    });

    if (shown.length === 0) {

        wrap.innerHTML =
            '<div class="empty-note">No suggestions in this grouping.</div>';

        return;
    }

    wrap.innerHTML = `
        <table class="lib-table">
            <thead><tr>${headerHtml()}</tr></thead>
            <tbody>${shown.map(rowHtml).join('')}</tbody>
        </table>
    `;
}

function countFor(g) {

    return cache.cands.filter(c =>
        g === 'Invitation' ? c.isInvitation : c.group === g
    ).length;
}

export function renderSuggestions() {

    const content = document.getElementById('pageContent');

    if (!content) {
        return;
    }

    buildCache();

    content.innerHTML = `
        <section id="sugLists" class="sug-lists"></section>

        <section class="panel sug-panel">

            <div class="panel-header">

                <div>
                    <h2>Song suggestions</h2>
                    <div id="sugSubtitle" class="panel-subtitle"></div>
                </div>

                <div class="filter-row">

                    <input
                        id="sugKey"
                        class="lib-search"
                        type="text"
                        placeholder="Key (G or D, A)"
                        aria-label="Filter by key"
                        value="${esc(sug.keyText)}"
                    >

                    ${TOGGLES.map(([g, hot]) => `
                        <button
                            type="button"
                            class="filter-chip sug-toggle"
                            data-toggle="${g}"
                            aria-pressed="false"
                        >${g} (${countFor(g)}) <span class="hot-key">[${hot}]</span></button>
                    `).join('')}

                </div>

            </div>

            <div id="sugTableWrap" class="table-wrap" tabindex="0"></div>

        </section>
    `;

    drawLists();
    drawTable();
    wireSuggestions(content);
}

// ---------------------------------------------------------------
// Events
// ---------------------------------------------------------------

function onClick(event) {

    const lock = event.target.closest('[data-lock]');

    if (lock) {

        const id = lock.dataset.lock;

        sug.locks[id] = !sug.locks[id];

        drawLists();

        return;
    }

    const rerollButton = event.target.closest('[data-reroll]');

    if (rerollButton) {
        reroll(Number(rerollButton.dataset.reroll));
        return;
    }

    const send = event.target.closest('[data-send]');

    if (send) {
        loadToBuilder(Number(send.dataset.send));
        return;
    }

    const toggle = event.target.closest('[data-toggle]');

    if (toggle) {
        toggleGroup(toggle.dataset.toggle);
        return;
    }

    const th = event.target.closest('[data-sort]');

    if (th) {
        cycleSort(th.dataset.sort);
        drawTable();
        return;
    }

    const row = event.target.closest('tr[data-song-id]');

    if (row) {

        openSongDetail(row.dataset.songId, {
            owner: OWNER,
            onSeeUses: songId => seeUses(songId, 'suggestions')
        });
    }
}

// Hands the first four songs and the invitation song to the
// Service Builder page, then opens it.
function loadToBuilder(li) {

    const list = currentLists()[li];

    if (!list) {
        return;
    }

    state.handoff = {
        songs: list.slice(0, 4).map(x => x?.cand.title ?? ''),
        invitation: list[4]?.cand.title ?? ''
    };

    sug.sent = li;
    sug.message = '';

    showPage('builder');
}

function wireSuggestions(content) {

    // Both sections are rebuilt on every visit, so listeners on
    // them are never doubled up.
    document.getElementById('sugLists')
        .addEventListener('click', onClick);

    content.querySelector('.sug-panel')
        .addEventListener('click', onClick);

    document
        .getElementById('sugKey')
        .addEventListener('input', event => {

            sug.keyText = event.target.value;
            drawTable();
        });

    // F / S / I toggle the groups while the page is showing.
    if (!keysWired) {

        keysWired = true;

        window.addEventListener('keydown', event => {

            if (state.currentPage !== 'suggestions') {
                return;
            }

            const t = event.target;

            if (
                t &&
                (t.tagName === 'INPUT' ||
                    t.tagName === 'TEXTAREA' ||
                    t.isContentEditable)
            ) {
                return;
            }

            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            const hit = TOGGLES.find(
                ([, hot]) => hot.toLowerCase() === event.key.toLowerCase()
            );

            if (hit) {
                toggleGroup(hit[0]);
            }
        });
    }
}
