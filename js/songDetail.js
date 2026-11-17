import { getData, refreshPage } from './app.js';
import { esc } from './helpers.js';
import { saveJson } from './dataStore.js';
import {
    getLastPlayed,
    getRestStatus,
    getTempoGroup,
    getTimesUsed
} from './calculatedFields.js';

// ---------------------------------------------------------------
// Data cleanup (shared with library.js)
// ---------------------------------------------------------------

// Common UTF-8-read-as-Windows-1252 garbage (e.g. "His Loveâ€¦Reaching").
const MOJIBAKE = [
    ['â€¦', '…'], ['â€™', '’'], ['â€˜', '‘'],
    ['â€œ', '“'], ['â€\u009d', '”'], ['â€"', '–'],
    ['â€”', '—'], ['Ã©', 'é'], ['Ã¨', 'è'], ['Â', '']
];

export function clean(value) {

    let text = String(value ?? '');

    MOJIBAKE.forEach(([bad, good]) => {
        text = text.split(bad).join(good);
    });

    return text.trim();
}

// categories is sometimes a list and sometimes a plain string.
export function categoryList(song) {

    const raw = song.categories;

    if (Array.isArray(raw)) {
        return raw.map(clean).filter(Boolean);
    }

    return clean(raw)
        .split(/\s*,\s*/)
        .filter(Boolean);
}

// ---------------------------------------------------------------
// The card. Only one is open at a time.
// ---------------------------------------------------------------

let current = null;   // { overlay, owner, onClose, onKey }

export function closeDetail() {

    if (!current) {
        return;
    }

    const { overlay, onKey, onClose } = current;

    current = null;

    document.removeEventListener('keydown', onKey);
    overlay.remove();

    onClose?.();
}

// "See uses" hides the card while Insights is showing...
export function hideDetail() {
    current?.overlay.classList.add('hidden');
}

// ...and it comes back when the owning page is shown again.
export function revealDetail(owner) {

    if (!current || current.owner !== owner) {
        return;
    }

    current.overlay.classList.remove('hidden');
    current.overlay.querySelector('.detail-card')?.focus();
}

function fieldHtml(field) {

    const value = field.value;

    const empty =
        value === '' ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0);

    let body;

    if (empty) {
        body = '—';
    }
    else if (Array.isArray(value)) {

        body = `
            <div class="detail-pills">
                ${value.map(v => `<span class="detail-pill">${esc(v)}</span>`).join('')}
            </div>`;
    }
    else {
        body = esc(value);
    }

    return `
        <div class="detail-field ${field.wide ? 'wide' : ''}">
            <dt>${esc(field.label)}</dt>
            <dd class="${field.pre ? 'pre' : ''}">${body}</dd>
        </div>
    `;
}

function inputHtml(input, record) {

    const raw = record[input.key];

    const value = Array.isArray(raw)
        ? raw.map(clean).join(', ')
        : clean(raw);

    const id = `edit-${input.key}`;

    const control = input.long
        ? `<textarea id="${id}" data-key="${input.key}" rows="3">${esc(value)}</textarea>`
        : `<input id="${id}" data-key="${input.key}" type="${input.type === 'number' ? 'number' : 'text'}" ${input.type === 'number' ? 'step="any"' : ''} value="${esc(value)}">`;

    return `
        <div class="detail-field ${input.wide ? 'wide' : ''}">
            <label for="${id}">${esc(input.label)}${input.type === 'list' ? ' (comma separated)' : ''}</label>
            ${control}
        </div>
    `;
}

// Turns the form's text back into the right kind of value.
// Blank fields go back to null, like the rest of the data.
function readInput(input, el) {

    const text = el.value.trim();

    if (input.type === 'list') {
        return text.split(/\s*,\s*/).filter(Boolean);
    }

    if (text === '') {
        return null;
    }

    return input.type === 'number' ? Number(text) : text;
}

// options: { title(), fields(), owner, onSeeUses, onClose,
//            edit: { record, inputs, file, all } }
function showCard(options) {

    const { owner, onSeeUses, onClose, edit } = options;

    // Opening a card replaces any card that is already open.
    closeDetail();

    const overlay = document.createElement('div');

    overlay.className = 'detail-overlay';

    overlay.innerHTML = `
        <div class="detail-card" tabindex="-1" role="dialog" aria-modal="true">
            <div class="detail-head">
                <h2></h2>
                <button type="button" class="detail-x" data-close aria-label="Close">✕</button>
            </div>
            <div class="detail-body" tabindex="0"></div>
            <div class="detail-status" role="status"></div>
            <div class="detail-foot"></div>
        </div>
    `;

    const card = overlay.querySelector('.detail-card');
    const body = overlay.querySelector('.detail-body');
    const foot = overlay.querySelector('.detail-foot');
    const status = overlay.querySelector('.detail-status');

    const setStatus = (text, bad = false) => {
        status.textContent = text;
        status.classList.toggle('bad', bad);
    };

    function drawView() {

        const title = options.title() || 'Untitled';

        overlay.querySelector('h2').textContent = title;
        card.setAttribute('aria-label', `${title} details`);

        body.innerHTML =
            `<dl class="detail-grid">${options.fields().map(fieldHtml).join('')}</dl>`;

        foot.innerHTML = `
            ${onSeeUses
                ? '<button type="button" class="detail-button" data-see>See uses</button>'
                : ''}
            ${edit
                ? '<button type="button" class="detail-button" data-edit>Edit</button>'
                : ''}
            <span class="detail-spacer"></span>
            <button type="button" class="detail-button" data-close>Close</button>
        `;
    }

    function drawForm() {

        body.innerHTML = `
            <div class="detail-grid">
                ${edit.inputs.map(i => inputHtml(i, edit.record)).join('')}
            </div>
        `;

        foot.innerHTML = `
            <span class="detail-spacer"></span>
            <button type="button" class="detail-button" data-cancel>Cancel</button>
            <button type="button" class="detail-button primary" data-save>Save</button>
        `;

        setStatus('');

        body.querySelector('input, textarea')?.focus();
    }

    async function save() {

        // Work on a copy so a failed write changes nothing.
        const updated = { ...edit.record };

        edit.inputs.forEach(input => {

            updated[input.key] = readInput(
                input,
                body.querySelector(`[data-key="${input.key}"]`)
            );
        });

        const copy = edit.all.map(r => r === edit.record ? updated : r);

        setStatus('Saving…');

        try {

            const result = await saveJson(edit.file, copy);

            Object.assign(edit.record, updated);

            refreshPage();

            drawView();

            setStatus(
                result === 'saved'
                    ? 'Saved.'
                    : `Downloaded ${edit.file}. Replace the file in Resources to keep the change.`
            );
        }
        catch (error) {

            setStatus(
                error?.name === 'AbortError'
                    ? 'Not saved: the folder was not chosen.'
                    : 'Not saved. The file could not be written.',
                true
            );
        }
    }

    const onKey = event => {

        if (
            event.key === 'Escape' &&
            !overlay.classList.contains('hidden')
        ) {
            closeDetail();
        }
    };

    overlay.addEventListener('click', event => {

        const t = event.target;

        if (t === overlay || t.closest('[data-close]')) {
            closeDetail();
        }
        else if (t.closest('[data-see]')) {
            onSeeUses();
        }
        else if (t.closest('[data-edit]')) {
            drawForm();
        }
        else if (t.closest('[data-cancel]')) {
            drawView();
            setStatus('');
        }
        else if (t.closest('[data-save]')) {
            save();
        }
    });

    drawView();

    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);

    current = { overlay, owner, onClose, onKey };

    card.focus();
}

// ---------------------------------------------------------------
// Praise Team song
// ---------------------------------------------------------------

const SONG_INPUTS = [
    { key: 'title', label: 'Title', wide: true },
    { key: 'composer', label: 'Composer' },
    { key: 'source', label: 'Source' },
    { key: 'page', label: 'Page' },
    { key: 'key', label: 'Key' },
    { key: 'tempo', label: 'Tempo (BPM)', type: 'number' },
    { key: 'timeSignature', label: 'Time Signature' },
    { key: 'newBoxNumber', label: 'New Box Number' },
    { key: 'ccd', label: 'CCD', wide: true, long: true },
    { key: 'invitation', label: 'Invitation', wide: true, long: true },
    { key: 'categories', label: 'Categories', wide: true, type: 'list' }
];

const CHOIR_INPUTS = [
    { key: 'title', label: 'Title', wide: true },
    { key: 'arranger', label: 'Arranger', wide: true },
    { key: 'composer', label: 'Composer', wide: true },
    { key: 'collection', label: 'Collection', wide: true },
    { key: 'theme', label: 'Occasion' },
    { key: 'publisher', label: 'Publisher' },
    { key: 'boxNumber', label: 'Box Number' },
    { key: 'collectionOrder', label: 'Collection Order', type: 'number' },
    { key: 'medleySongs', label: 'Medley Songs', wide: true, long: true }
];

// options: { owner, onSeeUses(songId), onClose }
export function openSongDetail(songId, options = {}) {

    const { songs, usages, choirSongs } = getData();

    const song = songs.find(s => String(s.songId) === String(songId));

    if (!song) {
        return;
    }

    // Read at draw time, so a saved edit shows right away.
    const fields = () => {

        const boxes = (choirSongs ?? [])
            .filter(c => String(c.songId) === String(song.songId) && clean(c.boxNumber))
            .map(c => clean(c.boxNumber))
            .join(', ');

        return [
            { label: 'Composer', value: clean(song.composer) },
            { label: 'Source', value: clean(song.source) },
            { label: 'Page', value: clean(song.page) },
            { label: 'Key', value: clean(song.key) },
            { label: 'Tempo (BPM)', value: song.tempo },
            { label: 'Time Signature', value: song.timeSignature },
            { label: 'CCD', value: clean(song.ccd), wide: true },
            { label: 'Invitation', value: clean(song.invitation), wide: true },
            { label: 'Categories', value: categoryList(song), wide: true },
            { label: 'Tempo Group', value: getTempoGroup(song) },
            { label: 'Last Played', value: getLastPlayed(song.songId, usages) },
            { label: 'Times Used', value: getTimesUsed(song.songId, usages) },
            { label: 'Rest Status', value: getRestStatus(song.songId, usages) },
            { label: 'Box Number', value: boxes },
            { label: 'New Box Number', value: song.newBoxNumber },
        ];
    };

    showCard({
        title: () => clean(song.title),
        fields,
        owner: options.owner,
        onClose: options.onClose,
        onSeeUses: options.onSeeUses
            ? () => {
                hideDetail();
                options.onSeeUses(song.songId);
            }
            : null,
        edit: {
            record: song,
            inputs: SONG_INPUTS,
            file: 'songs.json',
            all: songs
        }
    });
}

export function openChoirDetail(choirSongId, options = {}) {

    const { choirSongs } = getData();

    const choir = (choirSongs ?? []).find(
        c => String(c.choirSongId) === String(choirSongId)
    );

    if (!choir) {
        return;
    }

    const field = (label, value, extra = {}) =>
        ({ label, value: clean(value), pre: true, ...extra });

    showCard({
        title: () => clean(choir.title),
        owner: options.owner,
        onClose: options.onClose,
        fields: () => [
            field('Arranger', choir.arranger, { wide: true }),
            field('Composer', choir.composer, { wide: true }),
            field('Collection', choir.collection, { wide: true }),
            field('Occasion', choir.theme),
            field('Publisher', choir.publisher),
            field('Box Number', choir.boxNumber),
            field('Collection Order', choir.collectionOrder),
            field('ID', choir.choirSongId),
            field('Medley Songs', choir.medleySongs, { wide: true })
        ],
        edit: {
            record: choir,
            inputs: CHOIR_INPUTS,
            file: 'choirSongs.json',
            all: choirSongs
        }
    });
}
