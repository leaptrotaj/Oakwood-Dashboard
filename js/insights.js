import { getData }
    from './app.js';

import {
    checkDataShape,
    getPageFilters,
    refreshUsagePanels,
    renderUsagePanels,
    syncTileStates,
    wireFilterEvents
}
from './helpers.js';

const PAGE_KEY =
    'insights';

const BASE_SUBTITLE =
    'Songs used more than once, most to least';

export function renderInsights() {

    const content =
        document.getElementById(
            'pageContent'
        );

    content.innerHTML =
        renderUsagePanels({
            mostUsedTitle: 'Most used songs',
            recentTitle: 'Recently used'
        });

    wireFilterEvents(
        getPageFilters(PAGE_KEY),
        refreshInsights
    );

    refreshInsights();
}

// Also called by app.js when a stat tile changes a filter.
export function refreshInsights() {

    const data =
        getData();

    checkDataShape(data);

    const filters =
        getPageFilters(PAGE_KEY);

    refreshUsagePanels({
        songs: data.songs,
        usages: data.usages,
        filters,
        baseSubtitle: BASE_SUBTITLE
    });

    syncTileStates(filters);
}
