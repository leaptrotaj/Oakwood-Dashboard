/* ---------------------------------------------------------------
   Variables and base
--------------------------------------------------------------- */

:root {
    color-scheme: dark;

    --page: #111827;
    --surface: #1f2937;
    --surface-hover: rgba(55, 65, 81, 0.8);
    --track: #374151;
    --line: rgba(255, 255, 255, 0.1);
    --line-strong: rgba(255, 255, 255, 0.2);

    --text: #ffffff;
    --muted: rgba(255, 255, 255, 0.6);

    --blue: #2563eb;
    --blue-edge: #3b82f6;
    --blue-text: #93c5fd;
    --fuchsia: #c026d3;
    --fuchsia-edge: #d946ef;
    --fuchsia-text: #f0abfc;
    --teal: #0d9488;
    --teal-edge: #14b8a6;
    --teal-text: #5eead4;
    --rose-edge: #f43f5e;
    --rose-text: #fda4af;
    --emerald-edge: #10b981;
    --emerald-text: #6ee7b7;
    --orange: #ea580c;
    --orange-text: #fdba74;
    --amber: #fbbf24;
    --amber-text: #fcd34d;
}

* {
    box-sizing: border-box;
}

html,
body {
    height: 100%;
    margin: 0;
}

body {
    background: var(--page);
    color: var(--text);
    font-family: system-ui, "Segoe UI", Arial, sans-serif;
}

button {
    font: inherit;
}

#app {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100vh;
    height: 100dvh;
    padding: 16px;
}

/* ---------------------------------------------------------------
   Stat tiles
--------------------------------------------------------------- */

.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.stat-tile {
    min-width: 110px;
    padding: 12px 16px;
    border: 1px solid var(--line);
    border-left-width: 4px;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    color: white;
    text-align: left;
    cursor: pointer;
}

.stat-tile:hover {
    background: var(--surface-hover);
}

.stat-tile.active {
    background: rgba(55, 65, 81, 0.6);
}

.stat-blue {
    border-left-color: var(--blue-edge);
}

.stat-teal {
    border-left-color: var(--teal-edge);
}

.stat-rose {
    border-left-color: var(--rose-edge);
}

.stat-green {
    border-left-color: var(--emerald-edge);
}

.stat-blue.active {
    box-shadow: 0 0 0 2px #60a5fa;
}

.stat-teal.active {
    box-shadow: 0 0 0 2px #2dd4bf;
}

.stat-rose.active {
    box-shadow: 0 0 0 2px #fb7185;
}

.stat-green.active {
    box-shadow: 0 0 0 2px #34d399;
}

.tile-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.stat-blue .tile-label {
    color: var(--blue-text);
}

.stat-teal .tile-label {
    color: var(--teal-text);
}

.stat-rose .tile-label {
    color: var(--rose-text);
}

.stat-green .tile-label {
    color: var(--emerald-text);
}

.tile-value {
    font-size: 30px;
    font-weight: 700;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
}

.holiday-note {
    margin-top: 2px;
    font-size: 12px;
    font-weight: 600;
    color: #fde68a;
}

/* ---------------------------------------------------------------
   Dashboard shell
--------------------------------------------------------------- */

.dashboard {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 12px;
    min-height: 0;
}

.dashboard-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

/* Tabs: tinted when off, solid when active. Each has its own color. */

.tab {
    padding: 8px 16px;
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.15);
    color: var(--blue-text);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
}

.tab:hover {
    background: rgba(37, 99, 235, 0.25);
}

.tab.active {
    border-color: var(--blue);
    background: var(--blue);
    color: white;
}

.tab-suggestions {
    border-color: rgba(217, 70, 239, 0.4);
    background: rgba(192, 38, 211, 0.15);
    color: var(--fuchsia-text);
}

.tab-suggestions:hover {
    background: rgba(192, 38, 211, 0.25);
}

.tab-suggestions.active {
    border-color: var(--fuchsia);
    background: var(--fuchsia);
    color: white;
}

.tab-library {
    border-color: rgba(20, 184, 166, 0.4);
    background: rgba(13, 148, 136, 0.15);
    color: var(--teal-text);
}

.tab-library:hover {
    background: rgba(13, 148, 136, 0.25);
}

.tab-library.active {
    border-color: var(--teal);
    background: var(--teal);
    color: white;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.icon-button,
.menu-button {
    padding: 8px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: transparent;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
}

.icon-button:hover,
.menu-button:hover {
    background: rgba(255, 255, 255, 0.05);
}

.icon-button.active {
    border-color: #4f46e5;
    background: #4f46e5;
}

/* ---------------------------------------------------------------
   Admin menu
--------------------------------------------------------------- */

.menu-wrapper {
    position: relative;
}

.dropdown-menu {
    position: absolute;
    top: 110%;
    right: 0;
    z-index: 20;
    width: 224px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
    overflow: hidden;
}

/* Menu items are buttons */

.menu-item {
    display: block;
    width: 100%;
    padding: 10px 16px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
}

.menu-item:hover,
.menu-item:focus-visible {
    background: rgba(255, 255, 255, 0.05);
}

.menu-separator {
    border-top: 1px solid var(--line);
}

/* ---------------------------------------------------------------
   Toast
--------------------------------------------------------------- */

.toast {
    position: fixed;
    top: 12px;
    left: 50%;
    z-index: 50;
    max-width: 90%;
    padding: 8px 16px;
    border: 1px solid #4ade80;
    border-radius: 8px;
    background: #16a34a;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
    font-size: 14px;
    font-weight: 500;
    transform: translateX(-50%);
}

/* ---------------------------------------------------------------
   Page content and panels
--------------------------------------------------------------- */

.dashboard-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

#pageContent {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 12px;
    min-height: 0;
}

.panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: 16px;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

.panel-body {
    flex: 1;
    min-height: 0;
    padding-right: 4px;
    overflow-x: hidden;
    overflow-y: auto;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
}

.panel-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.panel-subtitle {
    margin-top: 2px;
    font-size: 14px;
    color: var(--muted);
}

/* ---------------------------------------------------------------
   Filters
--------------------------------------------------------------- */

.filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.filter-chip {
    padding: 4px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: transparent;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
}

.filter-chip:hover {
    background: rgba(255, 255, 255, 0.05);
}

.filter-chip.active {
    border-color: var(--blue);
    background: var(--blue);
}

.filter-chip.faster.active {
    border-color: #f97316;
    background: #f97316;
}

.filter-chip.slower.active {
    border-color: #0284c7;
    background: #0284c7;
}

/* Clear buttons are amber, like the dashboard's. */

.clear-button {
    padding: 4px 12px;
    border: 1px solid var(--amber);
    border-radius: 999px;
    background: transparent;
    color: var(--amber-text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
}

.clear-button:hover {
    background: rgba(255, 255, 255, 0.05);
}

/* Neutral variants: "Show more" and the detail close button */

.more-row .clear-button,
.detail-card .clear-button {
    border-color: var(--line-strong);
    color: white;
}

/* ---------------------------------------------------------------
   Most used list
--------------------------------------------------------------- */

.song-row {
    display: grid;
    grid-template-columns: 24px 224px 1fr 36px;
    align-items: center;
    gap: 12px;
    padding: 6px 4px;
    border-radius: 8px;
}

.rank {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
}

.rank-gold {
    background: #fbbf24;
    color: #451a03;
}

.rank-silver {
    background: #cbd5e1;
    color: #1e293b;
}

.rank-bronze {
    background: #fdba74;
    color: #431407;
}

.rank-normal {
    background: var(--track);
    opacity: 0.8;
}

.song-title {
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.bar {
    height: 16px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    min-width: 3%;
    border-radius: 999px;
    background: linear-gradient(90deg, #3b82f6, #6366f1);
}

.song-count {
    font-size: 14px;
    font-weight: 600;
    text-align: right;
    font-variant-numeric: tabular-nums;
}

/* ---------------------------------------------------------------
   Recently used list
--------------------------------------------------------------- */

.recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 8px;
}

.recent-title {
    font-size: 14px;
    font-weight: 500;
}

.recent-position {
    font-size: 12px;
    color: var(--muted);
}

.recent-date {
    text-align: right;
}

.recent-date-main {
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.recent-date-sub {
    font-size: 12px;
    color: var(--muted);
}

/* ---------------------------------------------------------------
   Selectable song rows (Insights, Suggestions)
--------------------------------------------------------------- */

.selectable {
    cursor: pointer;
}

.selectable:hover {
    background: rgba(255, 255, 255, 0.05);
}

.selectable:focus-visible {
    outline: 2px solid var(--amber);
    outline-offset: -2px;
}

.song-row.selected,
.recent-item.selected {
    background: rgba(251, 191, 36, 0.15);
    box-shadow: inset 0 0 0 1px var(--amber);
}

.song-row.selected .bar-fill {
    background: linear-gradient(90deg, #fbbf24, #f97316);
}

/* A heavier line between groups of different dates. */

.recent-item.new-date {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 2px solid rgba(255, 255, 255, 0.3);
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

/* ---------------------------------------------------------------
   Song Library
--------------------------------------------------------------- */

/* Praise Team / Choir switcher */

.library-tabs {
    display: flex;
    gap: 4px;
    width: fit-content;
    margin: 0 auto;
    padding: 4px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.4);
}

.library-tab {
    padding: 6px 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}

.library-tab[data-libtab="praise"] {
    color: var(--teal-text);
}

.library-tab[data-libtab="choir"] {
    color: var(--orange-text);
}

.library-tab:hover {
    background: rgba(255, 255, 255, 0.05);
}

.library-tab.active.praise {
    background: var(--teal);
    color: white;
}

.library-tab.active.choir {
    background: var(--orange);
    color: white;
}

/* Panel and controls */

.library-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.lib-select,
.lib-search {
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: rgba(17, 24, 39, 0.6);
    color: white;
    font-size: 14px;
}

.lib-select {
    max-width: 200px;
    cursor: pointer;
}

.lib-select:focus,
.lib-search:focus {
    border-color: var(--blue-edge);
    outline: none;
}

.lib-search {
    width: 208px;
}

.lib-search::placeholder {
    color: rgba(255, 255, 255, 0.3);
}

/* Table */

.table-wrap {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: rgba(17, 24, 39, 0.3);
    overflow: auto;
}

.lib-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    text-align: left;
}

.lib-table th {
    position: sticky;
    top: 0;
    padding: 10px 12px;
    background: var(--surface);
    box-shadow: 0 1px 0 var(--line);
    font-weight: 600;
    white-space: nowrap;
    user-select: none;
    cursor: pointer;
}

.lib-table td {
    padding: 10px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
}

.lib-table td:first-child {
    color: white;
}

.lib-table tbody tr {
    cursor: pointer;
}

.lib-table tbody tr:hover {
    background: rgba(59, 130, 246, 0.1);
}

.lib-table tbody tr.selected {
    background: rgba(251, 191, 36, 0.15);
}

.title-link {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
}

.title-link:hover {
    color: var(--blue-text);
}

.title-link:focus-visible {
    outline: 2px solid var(--amber);
    border-radius: 4px;
}

.clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    max-width: 320px;
    overflow: hidden;
}

.empty-note {
    padding: 24px;
    text-align: center;
    opacity: 0.6;
}

.more-row {
    padding: 12px;
    text-align: center;
}

/* Tags */

.key-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(59, 130, 246, 0.2);
    color: #bfdbfe;
    font-weight: 500;
}

.tempo-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.faster-tag {
    background: rgba(249, 115, 22, 0.2);
    color: #fed7aa;
}

.slower-tag {
    background: rgba(14, 165, 233, 0.2);
    color: #bae6fd;
}

.choir-tag,
.box-link {
    display: inline-block;
    padding: 2px 8px;
    border: 0;
    border-radius: 6px;
    background: rgba(249, 115, 22, 0.2);
    color: #fed7aa;
    font-size: 12px;
    font-weight: 500;
}

.box-link {
    cursor: pointer;
}

.box-link:hover {
    background: rgba(249, 115, 22, 0.3);
    text-decoration: underline;
}

/* ---------------------------------------------------------------
   Song detail card (Song Library, Choir Library, Suggestions)
--------------------------------------------------------------- */

.detail-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.6);
}

.detail-card {
    display: flex;
    flex-direction: column;
    width: min(560px, 100%);
    max-height: 100%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    background: #1f2937;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.detail-card:focus {
    outline: none;
}

.detail-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-head h2 {
    margin: 0;
    min-width: 0;
    font-size: 20px;
    font-weight: 600;
    overflow-wrap: anywhere;
}

.detail-x {
    flex: none;
    min-width: 44px;
    min-height: 44px;
    margin: -8px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
}

.detail-x:hover {
    background: rgba(255, 255, 255, 0.05);
}

.detail-body {
    flex: 1;
    overflow: auto;
    padding: 16px;
}

.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 0;
}

.detail-field {
    min-width: 0;
}

.detail-field.wide {
    grid-column: 1 / -1;
}

.detail-field dt {
    margin-bottom: 4px;
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
}

.detail-field dd {
    margin: 0;
    font-size: 16px;
    overflow-wrap: anywhere;
}

.detail-field dd.pre {
    white-space: pre-wrap;
}

.detail-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.detail-pill {
    padding: 2px 10px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.2);
    color: #dbeafe;
    font-size: 14px;
}

.detail-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-button,
.back-button {
    min-height: 44px;
    padding: 8px 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 500;
    cursor: pointer;
}

.detail-button:hover,
.back-button:hover {
    background: rgba(255, 255, 255, 0.05);
}

.detail-x:focus-visible,
.detail-button:focus-visible,
.back-button:focus-visible {
    outline: 2px solid #fbbf24;
    outline-offset: 2px;
}

@media (max-width: 640px) {

    .detail-grid {
        grid-template-columns: 1fr;
    }
}

/* ---------------------------------------------------------------
   Insights: Back button and the "not in this list" row
--------------------------------------------------------------- */

.back-bar {
    margin-bottom: 8px;
}

.song-row.missing {
    grid-template-columns: 24px 224px 1fr;
}

.missing-note {
    font-size: 14px;
    opacity: 0.7;
}

/* ---------------------------------------------------------------
   Choir Library accents
--------------------------------------------------------------- */

.lib-table.choir tbody tr:hover {
    background: rgba(249, 115, 22, 0.1);
}

.lib-table.choir tbody tr.selected {
    background: rgba(251, 146, 60, 0.15);
}

.clear-button.choir {
    color: #fdba74;
}

/* ---------------------------------------------------------------
   Keyboard focus
--------------------------------------------------------------- */

.tab:focus-visible,
.stat-tile:focus-visible,
.filter-chip:focus-visible,
.icon-button:focus-visible,
.menu-button:focus-visible,
.clear-button:focus-visible,
.library-tab:focus-visible {
    outline: 2px solid var(--amber);
    outline-offset: 2px;
}

/* ---------------------------------------------------------------
   Utilities
--------------------------------------------------------------- */

.hidden {
    display: none !important;
}

/* ---------------------------------------------------------------
   Responsive
--------------------------------------------------------------- */

@media (max-width: 900px) {

    #app {
        height: auto;
        min-height: 100vh;
    }

    .song-row {
        grid-template-columns: 24px 1fr 36px;
    }

    .song-row .bar {
        grid-column: 1 / -1;
        order: 5;
    }

    .panel-header {
        flex-direction: column;
    }

    .dashboard {
        flex: none;
    }

    .dashboard-content,
    #pageContent {
        display: flex;
    }

    .panel {
        flex: none;
        min-height: 500px;
    }

    .table-wrap {
        max-height: 65vh;
    }
}

@media (max-width: 768px) {

    .stats-row {
        grid-template-columns: 1fr 1fr;
    }
}

@media (prefers-reduced-motion: reduce) {

    * {
        transition: none !important;
        scroll-behavior: auto !important;
    }
}

/* ---------------------------------------------------------------
   Suggestions
--------------------------------------------------------------- */

/* Quick Order of Service cards */

.sug-lists {
    flex: 0 0 auto;
    padding: 4px;
    margin-bottom: 8px;
}

.sug-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.sug-alert {
    margin-bottom: 8px;
    font-size: 14px;
    color: #fca5a5;
}

.sug-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: linear-gradient(135deg, #374151, rgba(55, 65, 81, 0.6));
}

.sug-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(37, 99, 235, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sug-card-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.sug-card-actions {
    display: flex;
    gap: 8px;
}

.sug-button {
    padding: 4px 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
}

.sug-button:hover {
    background: rgba(255, 255, 255, 0.1);
}

.sug-button.primary {
    border-color: #2563eb;
    background: #2563eb;
}

.sug-button.primary:hover {
    background: #1d4ed8;
}

.sug-slots {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 4px 0;
    list-style: none;
}

.sug-slot {
    display: flex;
    align-items: center;
}

.sug-slot:hover {
    background: rgba(255, 255, 255, 0.05);
}

.sug-slot.locked {
    background: rgba(251, 191, 36, 0.1);
}

.sug-slot-main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px 2px 12px;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
}

.sug-badge {
    flex: none;
    width: 80px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.8);
    font-size: 12px;
    font-weight: 600;
    text-align: center;
}

.sug-slot-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
}

.sug-slot-label {
    flex: none;
    width: 144px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    opacity: 0.6;
}

.sug-slot-tempo {
    flex: none;
    width: 80px;
    text-align: right;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
}

.sug-slot-sig {
    flex: none;
    width: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
}

.sug-slot-key {
    flex: none;
    width: 48px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    font-size: 12px;
    text-align: center;
}

.sug-lock {
    flex: none;
    padding: 2px 8px;
    border: 0;
    background: none;
    font-size: 14px;
    cursor: pointer;
    opacity: 0.4;
}

.sug-lock:hover,
.sug-lock.on {
    opacity: 1;
}

.sug-empty {
    padding: 2px 12px;
    font-size: 14px;
    opacity: 0.6;
}

.sug-slot-main:focus-visible,
.sug-lock:focus-visible,
.sug-button:focus-visible {
    outline: 2px solid #fbbf24;
    outline-offset: -2px;
}

/* Song suggestions table */

.sug-panel .panel-header {
    align-items: center;
    margin-bottom: 12px;
}

.sug-panel .table-wrap {
    flex: 1;
    min-height: 0;
    max-height: none;
}

.sug-panel .filter-row {
    align-items: center;
}

.sug-toggle.active {
    background: #2563eb;
    border-color: #2563eb;
}

.hot-key {
    font-size: 12px;
    opacity: 0.6;
}

.sug-title {
    font-weight: 600;
}

.lib-table td.num {
    font-variant-numeric: tabular-nums;
}

.lib-table td.nowrap {
    white-space: nowrap;
}

.lib-table td:not(.sug-title) {
    color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 900px) {

    .sug-grid {
        grid-template-columns: 1fr;
    }

    .sug-slot-label {
        display: none;
    }
}

/* ---------------------------------------------------------------
   Song detail card: editing
--------------------------------------------------------------- */

.detail-spacer {
    flex: 1;
}

.detail-field label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
}

.detail-field input,
.detail-field textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.25);
    color: inherit;
    font: inherit;
}

.detail-field textarea {
    resize: vertical;
}

.detail-field input:focus,
.detail-field textarea:focus {
    outline: 2px solid #fbbf24;
    outline-offset: 1px;
}

.detail-button.primary {
    border-color: #3b82f6;
    background: #3b82f6;
    color: #fff;
}

.detail-button.primary:hover {
    background: #2563eb;
}

.detail-status {
    padding: 0 16px;
    font-size: 14px;
    color: #86efac;
}

.detail-status:empty {
    display: none;
}

.detail-status.bad {
    color: #fca5a5;
}
