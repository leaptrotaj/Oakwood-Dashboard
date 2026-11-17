//
// Oakwood Music Library
// Calculated Fields Engine
//

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

// Converts ISO ("2026-04-19", "2026-04-19T00:00:00.000Z") and US
// ("4/19/2026") dates to "YYYY-MM-DD". Returns '' if unusable.
// Reading the date parts as text avoids time zone shifts.
export function normalizeDate(value) {

    const text =
        String(value ?? '').trim();

    if (!text) {
        return '';
    }

    let m =
        /^(\d{4})-(\d{2})-(\d{2})/.exec(text);

    if (m) {
        return `${m[1]}-${m[2]}-${m[3]}`;
    }

    m =
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text);

    if (m) {
        return (
            `${m[3]}-` +
            `${m[1].padStart(2, '0')}-` +
            `${m[2].padStart(2, '0')}`
        );
    }

    const dt =
        new Date(text);

    if (Number.isNaN(dt.getTime())) {
        return '';
    }

    return (
        `${dt.getFullYear()}-` +
        `${String(dt.getMonth() + 1).padStart(2, '0')}-` +
        `${String(dt.getDate()).padStart(2, '0')}`
    );
}

function parseYMD(value) {

    const iso =
        normalizeDate(value);

    if (!iso) {
        return null;
    }

    const [y, mo, d] =
        iso.split('-').map(Number);

    return { y, mo: mo - 1, d };
}

// Groups usages by song once, so each lookup is fast instead of
// scanning every usage for every song. The index is cached per
// usages array and rebuilt if the array's length changes.
const indexCache =
    new WeakMap();

function usagesBySong(usages) {

    const cached =
        indexCache.get(usages);

    if (cached && cached.length === usages.length) {
        return cached.map;
    }

    const map =
        new Map();

    usages.forEach(usage => {

        let list =
            map.get(usage.songId);

        if (!list) {
            list = [];
            map.set(usage.songId, list);
        }

        list.push({
            usage,
            date: normalizeDate(usage.dateUsed)
        });
    });

    indexCache.set(
        usages,
        { length: usages.length, map }
    );

    return map;
}

function datesFor(songId, usages) {

    return (usagesBySong(usages).get(songId) ?? [])
        .map(entry => entry.date)
        .filter(Boolean)
        .sort();
}

function samePosition(a, b) {

    return (
        String(a ?? '').trim().toLowerCase() ===
        String(b ?? '').trim().toLowerCase()
    );
}

// ---------------------------------------------------------------
// Usage-based fields
// ---------------------------------------------------------------

export function getLastPlayed(songId, usages) {

    const dates =
        datesFor(songId, usages);

    if (dates.length === 0) {
        return null;
    }

    return dates[dates.length - 1];
}

export function getFirstRecordedUse(songId, usages) {

    const dates =
        datesFor(songId, usages);

    if (dates.length === 0) {
        return null;
    }

    return dates[0];
}

export function getTimesUsed(songId, usages) {

    return (
        usagesBySong(usages).get(songId) ?? []
    ).length;
}

// Whole months elapsed since the last use, matching Airtable's
// DATETIME_DIFF(TODAY(), lastPlayed, 'months').
export function getMonthsSincePlayed(songId, usages) {

    const lastPlayed =
        getLastPlayed(songId, usages);

    if (!lastPlayed) {
        return null;
    }

    const last =
        parseYMD(lastPlayed);

    const now =
        new Date();

    return (
        (now.getFullYear() - last.y) * 12 +
        (now.getMonth() - last.mo) -
        (now.getDate() < last.d ? 1 : 0)
    );
}

export function getRestStatus(songId, usages) {

    const months =
        getMonthsSincePlayed(songId, usages);

    if (months === null) {
        return "Never Used";
    }

    if (months >= 9) {
        return "Rested 9+ months";
    }

    if (months >= 2) {
        return `Suggest-${months}`;
    }

    return "Used recently";
}

export function getSuggestOrder(songId, usages) {

    const months =
        getMonthsSincePlayed(songId, usages);

    switch (months) {

        case 4:
            return 1;

        case 5:
            return 2;

        case 3:
            return 3;

        case 6:
            return 4;

        case 2:
            return 5;

        case 1:
            return 6;

        case 7:
            return 7;

        case 8:
            return 8;

        default:
            return 99;
    }
}

export function getUsesThisYear(songId, usages) {

    const currentYear =
        new Date().getFullYear();

    return (
        usagesBySong(usages).get(songId) ?? []
    ).filter(entry => {

        const parsed =
            parseYMD(entry.date);

        return (
            parsed !== null &&
            parsed.y === currentYear
        );

    }).length;
}

export function getUsageDates(songId, usages) {

    return [
        ...new Set(
            datesFor(songId, usages)
        )
    ];
}

export function getUsageCountByPosition(
    songId,
    position,
    usages
) {

    return (
        usagesBySong(usages).get(songId) ?? []
    ).filter(entry => {

        if (samePosition(position, "Anthem")) {

            return (
                samePosition(entry.usage.position, "Anthem") ||
                samePosition(entry.usage.position, "CCD")
            );
        }

        return samePosition(
            entry.usage.position,
            position
        );

    }).length;
}

// Returns the most recent usage record for the song, or null.
// Usages with no valid date sort last.
export function getMostRecentUse(
    songId,
    usages
) {

    const entries =
        [...(usagesBySong(usages).get(songId) ?? [])]
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date)
            );

    return entries[0]?.usage ?? null;
}

export function getDateUses(
    date,
    usages
) {

    const target =
        normalizeDate(date);

    return usages.filter(
        u => normalizeDate(u.dateUsed) === target
    );
}

// ---------------------------------------------------------------
// Song-based fields
// ---------------------------------------------------------------

export function getAdjustedTempo(song) {

    if (!song.tempo) {
        return null;
    }

    switch (song.timeSignature) {

        case "6/8":
        case "9/8":
        case "12/8":

            return Math.round(
                song.tempo / 3
            );

        default:
            return song.tempo;
    }
}

export function getTempoGroup(song) {

    const adjustedTempo =
        getAdjustedTempo(song);

    if (adjustedTempo === null) {
        return null;
    }

    if (adjustedTempo >= 91) {
        return "Faster";
    }

    return "Slower";
}
