import { renderInsights, refreshInsights } from './insights.js';
import { renderSuggestions } from './suggestions.js';
import { renderLibrary } from './library.js';
import { revealDetail } from './songDetail.js';
import { normalizeDate } from './calculatedFields.js';
import {
    samePosition,
    getPageFilters,
    requestScroll,
    syncTileStates
} from './helpers.js';
import {
    getSunday,
    getSundayISO,
    formatDate,
    holidaysForService
} from './dates.js';

let songs = [];
let choirSongs = [];
let usages = [];

export const state = {
    selectedSongId: null,
    selectedDate: null,

    yearFilter: false,

    // Filters are kept per page, e.g. pageFilters.insights and
    // pageFilters.suggestions. See getPageFilters() in helpers.js.
    pageFilters: {},

    currentPage: 'insights',
    leaptrotMode: false,

    // Set by "See uses": the page to return to ('library' or
    // 'suggestions'). Insights shows a Back button while it is set.
    backTo: null,

    // Set by Suggestions' "Load to builder": { songs: [4 titles],
    // invitation: title }. The Service Builder page reads it.
    handoff: null
};

export function getData() {
    return {
        songs,
        choirSongs,
        usages
    };
}

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        // Wire the controls first so they work even if loading fails.
        wireEvents();

        try {

            await loadData();

            updateShellTiles();

            renderCurrentPage();

        }
        catch (error) {

            console.error(error);

            renderLoadError();
        }
    }
);

async function fetchJson(path) {

    const response =
        await fetch(path);

    if (!response.ok) {

        throw new Error(
            `Could not load ${path} (${response.status})`
        );
    }

    return response.json();
}

async function loadData() {

    [
        songs,
        choirSongs,
        usages
    ] = await Promise.all([
        fetchJson('Resources/songs.json'),
        fetchJson('Resources/choirSongs.json'),
        fetchJson('Resources/usages.json')
    ]);
}

// ---------------------------------------------------------------
// Events
// ---------------------------------------------------------------

function on(id, handler) {

    document
        .getElementById(id)
        ?.addEventListener('click', handler);
}

function wireEvents() {

    wireTabs();
    wireTiles();
    wireLeaptrot();
    wireAdminMenu();
}

function wireTabs() {

    document
        .querySelectorAll('[data-tab]')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => showPage(
                    button.dataset.tab
                )
            );
        });
}

// ---------------------------------------------------------------
// Page switching
// ---------------------------------------------------------------

// Each page remembers how far its lists were scrolled.
const scrollMemory = {};

function scrollables() {

    return [
        ...document.querySelectorAll('#pageContent *')
    ];
}

function rememberScroll(page) {

    scrollMemory[page] =
        scrollables().map(el => el.scrollTop);
}

function restoreScroll(page) {

    const saved = scrollMemory[page];

    if (!saved) {
        return;
    }

    const els = scrollables();

    saved.forEach((top, index) => {

        if (top && els[index]) {
            els[index].scrollTop = top;
        }
    });
}

export function showPage(page) {

    // The Back button only lives on Insights.
    if (page !== 'insights') {
        state.backTo = null;
    }

    if (state.currentPage !== page) {
        rememberScroll(state.currentPage);
    }

    state.currentPage =
        page;

    // Pages without a tab (builder, add song) leave every tab off.
    document
        .querySelectorAll('.tab')
        .forEach(tab =>
            tab.classList.toggle(
                'active',
                tab.dataset.tab === page
            )
        );

    renderCurrentPage();

    restoreScroll(page);

    // A song card hidden by "See uses" comes back with its page.
    revealDetail(page);
}

// "See uses" on a song card: open Insights with that song selected.
export function seeUses(songId, from) {

    const filters = getPageFilters('insights');

    filters.positionFilter = null;
    filters.tempoFilter = null;
    filters.yearOnly = false;
    filters.dateSel = null;
    filters.selectedSongId = songId;
    filters.selectedFrom = 'most';

    state.backTo = from;

    // Show the song in Most Used, not a remembered scroll position.
    scrollMemory.insights = null;

    requestScroll('recent');

    showPage('insights');
}

export function goBack() {

    const to = state.backTo;

    if (!to) {
        return;
    }

    const filters = getPageFilters('insights');

    filters.selectedSongId = null;
    filters.selectedFrom = null;

    state.backTo = null;

    showPage(to);
}

// Stat tiles. Only the Insights page uses the year and Sunday
// tiles as filters; on other pages they do nothing.
function wireTiles() {

    on('tileSongs', () => showPage('library'));

    on('tileYear', () =>
        changeInsightsFilter(filters => {
            filters.yearOnly = !filters.yearOnly;
        })
    );

    on('tileRecent', () =>
        changeInsightsFilter(filters => {
            filters.dateSel =
                filters.dateSel === 'last'
                    ? null
                    : 'last';
        })
    );

    on('tileUpcoming', () =>
        changeInsightsFilter(filters => {
            filters.dateSel =
                filters.dateSel === 'next'
                    ? null
                    : 'next';
        })
    );
}

function changeInsightsFilter(change) {

    if (state.currentPage !== 'insights') {
        return;
    }

    change(getPageFilters('insights'));

    refreshInsights();
}

function wireLeaptrot() {

    const button =
        document.getElementById('leaptrotButton');

    if (!button) {
        return;
    }

    button.setAttribute('aria-pressed', 'false');

    button.addEventListener('click', () => {

        state.leaptrotMode =
            !state.leaptrotMode;

        button.classList.toggle(
            'active',
            state.leaptrotMode
        );

        button.setAttribute(
            'aria-pressed',
            String(state.leaptrotMode)
        );
    });
}

// ---------------------------------------------------------------
// Admin Tools menu
// ---------------------------------------------------------------

const ADMIN_ACTIONS = {
    'service-builder': () => showPage('builder'),
    'add-song': () => showPage('addsong'),
    'export-database': () => notify('Export Database is not built yet.'),
    'remove-records': () => notify('Remove Records is not built yet.'),
    'color-theme': () => notify('Color Theme is not built yet.')
};

function setMenuOpen(open) {

    document
        .getElementById('adminMenu')
        ?.classList.toggle('hidden', !open);

    document
        .getElementById('adminButton')
        ?.setAttribute('aria-expanded', String(open));
}

function isMenuOpen() {

    const menu =
        document.getElementById('adminMenu');

    return Boolean(menu) &&
        !menu.classList.contains('hidden');
}

function wireAdminMenu() {

    const button =
        document.getElementById('adminButton');

    const menu =
        document.getElementById('adminMenu');

    if (!button || !menu) {
        return;
    }

    button.addEventListener('click', () =>
        setMenuOpen(!isMenuOpen())
    );

    menu
        .querySelectorAll('[data-action]')
        .forEach(item => {

            item.addEventListener('click', () => {

                setMenuOpen(false);

                ADMIN_ACTIONS[item.dataset.action]?.();
            });
        });

    // Click outside closes the menu.
    document.addEventListener('click', event => {

        if (
            isMenuOpen() &&
            !event.target.closest('.menu-wrapper')
        ) {
            setMenuOpen(false);
        }
    });

    // Escape closes the menu and returns focus to the button.
    document.addEventListener('keydown', event => {

        if (event.key === 'Escape' && isMenuOpen()) {

            setMenuOpen(false);

            button.focus();
        }
    });
}

// A short message at the bottom of the screen.
let toastTimer = 0;

function notify(message) {

    let toast =
        document.getElementById('toast');

    if (!toast) {

        toast =
            document.createElement('div');

        toast.id = 'toast';
        toast.className = 'toast hidden';
        toast.setAttribute('role', 'status');

        document.body.appendChild(toast);
    }

    toast.textContent =
        message;

    toast.classList.remove('hidden');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
        () => toast.classList.add('hidden'),
        3500
    );
}

// ---------------------------------------------------------------
// Pages
// ---------------------------------------------------------------

function renderCurrentPage() {

    switch (state.currentPage) {

        case 'insights':
            renderInsights();
            break;

        case 'suggestions':
            renderSuggestions();
            break;

        case 'library':
            renderLibrary();
            break;

        case 'builder':
            renderPlaceholder(
                'Service Builder'
            );
            break;

        case 'addsong':
            renderPlaceholder(
                'Add a New Song'
            );
            break;

        default:
            renderPlaceholder(
                'Coming Soon'
            );
    }

    // The year and Sunday tiles only act as filters on Insights.
    syncTileStates(
        state.currentPage === 'insights'
            ? getPageFilters('insights')
            : null
    );
}

export function refreshPage() {

    updateShellTiles();

    renderCurrentPage();
}

function renderPlaceholder(title) {

    const pageContent =
        document.getElementById(
            'pageContent'
        );

    if (!pageContent) {
        return;
    }

    pageContent.innerHTML = `
        <section class="panel">

            <div class="panel-header">

                <div>
                    <h2>${title}</h2>
                </div>

            </div>

            <div class="panel-body">
                Not implemented yet.
            </div>

        </section>
    `;
}

function renderLoadError() {

    const pageContent =
        document.getElementById(
            'pageContent'
        );

    if (!pageContent) {
        return;
    }

    pageContent.innerHTML = `
        <section class="panel">

            <div class="panel-header">

                <div>
                    <h2>Could not load data</h2>
                </div>

            </div>

            <div class="panel-body">
                The song data files could not be loaded.
                Check that songs.json, choirSongs.json and
                usages.json are in the Resources folder,
                then reload the page.
            </div>

        </section>
    `;
}

// ---------------------------------------------------------------
// Shell tiles
// ---------------------------------------------------------------

function setText(id, text) {

    const el =
        document.getElementById(id);

    if (el) {
        el.textContent = text;
    }
}

function updateShellTiles() {

    updateSongCountTile();
    updateSongsThisYearTile();
    updateRecentSundayTile();
    updateNextSundayTile();
    updateHolidayNotice();
}

function updateSongCountTile() {

    const ids = new Set();

    usages.forEach(u => {

        if (
            u.songId &&
            !samePosition(u.position, 'Anthem')
        ) {

            ids.add(u.songId);
        }
    });

    setText('songCount', ids.size);
}

function updateSongsThisYearTile() {

    const currentYear =
        new Date().getFullYear();

    const ids =
        new Set();

    usages.forEach(u => {

        const date =
            normalizeDate(u.dateUsed);

        if (!date || !u.songId) {
            return;
        }

        if (
            Number(date.slice(0, 4))
            === currentYear
        ) {

            ids.add(u.songId);
        }
    });

    setText('yearCount', ids.size);
}

function updateRecentSundayTile() {

    setText(
        'recentSunday',
        formatDate(
            getSundayISO('last')
        )
    );
}

function updateNextSundayTile() {

    setText(
        'nextSunday',
        formatDate(
            getSundayISO('next')
        )
    );
}

function updateHolidayNotice() {

    const box =
        document.getElementById(
            'holidayNotice'
        );

    if (!box) {
        return;
    }

    box.replaceChildren();

    holidaysForService(
        getSunday('next')
    ).forEach(holiday => {

        const line =
            document.createElement('div');

        line.textContent =
            `${holiday.name} · ${holiday.label}`;

        box.appendChild(line);
    });
}
