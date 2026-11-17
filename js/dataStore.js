// Saves the data arrays back to the JSON files in Resources/.

const DB_NAME = 'worship-library';
const STORE = 'handles';

let folder = null;

export function canWriteFiles() {
    return typeof window.showDirectoryPicker === 'function';
}

// ---- remember the folder between visits (IndexedDB) ----

function openDb() {

    return new Promise((resolve, reject) => {

        const req = indexedDB.open(DB_NAME, 1);

        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function loadSavedFolder() {

    try {

        const db = await openDb();

        return await new Promise(resolve => {

            const req = db
                .transaction(STORE)
                .objectStore(STORE)
                .get('resources');

            req.onsuccess = () => resolve(req.result ?? null);
            req.onerror = () => resolve(null);
        });
    }
    catch {
        return null;
    }
}

async function rememberFolder(handle) {

    try {

        const db = await openDb();

        db.transaction(STORE, 'readwrite')
            .objectStore(STORE)
            .put(handle, 'resources');
    }
    catch {
        // Not remembering is fine; the picker just shows next time.
    }
}

async function getFolder() {

    if (folder) {
        return folder;
    }

    const saved = await loadSavedFolder();

    if (
        saved &&
        (await saved.requestPermission({ mode: 'readwrite' })) === 'granted'
    ) {
        folder = saved;
        return folder;
    }

    folder = await window.showDirectoryPicker({ mode: 'readwrite' });

    await rememberFolder(folder);

    return folder;
}

function download(fileName, text) {

    const link = document.createElement('a');

    link.href = URL.createObjectURL(
        new Blob([text], { type: 'application/json' })
    );

    link.download = fileName;
    link.click();

    URL.revokeObjectURL(link.href);
}

// fileName: 'songs.json' | 'choirSongs.json' | 'usages.json'
// Returns 'saved' or 'downloaded'. Throws if the user cancels.
export async function saveJson(fileName, data) {

    const text = JSON.stringify(data, null, 2);

    if (!canWriteFiles()) {
        download(fileName, text);
        return 'downloaded';
    }

    const dir = await getFolder();

    const handle = await dir.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();

    await writable.write(text);
    await writable.close();

    return 'saved';
}
