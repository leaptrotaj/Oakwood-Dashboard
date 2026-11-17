import { normalizeDate }
    from './calculatedFields.js';

// Local "YYYY-MM-DD" (toISOString would convert to UTC and can
// shift the date by a day).
export function toLocalISODate(date) {

    return (
        `${date.getFullYear()}-` +
        `${String(date.getMonth() + 1).padStart(2, '0')}-` +
        `${String(date.getDate()).padStart(2, '0')}`
    );
}

// 'last': today if today is Sunday, otherwise the Sunday before.
// 'next': always a future Sunday (a week out if today is Sunday).
export function getSunday(which) {

    const d =
        new Date();

    d.setHours(0, 0, 0, 0);

    const dow =
        d.getDay();

    d.setDate(
        d.getDate() +
        (which === 'last' ? -dow : 7 - dow)
    );

    return d;
}

export function getSundayISO(which) {

    return toLocalISODate(
        getSunday(which)
    );
}

export function formatDate(dateText) {

    const iso =
        normalizeDate(dateText);

    if (!iso) {
        return '';
    }

    const [y, m, d] =
        iso.split('-').map(Number);

    // Built from local parts, so it never shifts a day.
    return new Date(
        y,
        m - 1,
        d
    ).toLocaleDateString(
        undefined,
        {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }
    );
}

// ---------------------------------------------------------------
// Holidays worth noting in a service week
// ---------------------------------------------------------------

function easterSunday(y) {

    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(y, month - 1, day);
}

// nth weekday (0 = Sunday) of a month; n = -1 for the last one.
function nthWeekday(y, month, weekday, n) {

    if (n > 0) {

        const first =
            new Date(y, month, 1);

        return new Date(
            y,
            month,
            1 +
            ((weekday - first.getDay() + 7) % 7) +
            (n - 1) * 7
        );
    }

    const last =
        new Date(y, month + 1, 0);

    return new Date(
        y,
        month,
        last.getDate() -
        ((last.getDay() - weekday + 7) % 7)
    );
}

function holidaysForYear(y) {

    const easter =
        easterSunday(y);

    const off = days =>
        new Date(
            easter.getFullYear(),
            easter.getMonth(),
            easter.getDate() + days
        );

    return [
        { name: "New Year's Day", date: new Date(y, 0, 1) },
        { name: 'Palm Sunday', date: off(-7) },
        { name: 'Good Friday', date: off(-2) },
        { name: 'Easter', date: easter },
        { name: 'Pentecost', date: off(49) },
        { name: "Mother's Day", date: nthWeekday(y, 4, 0, 2) },
        { name: 'Memorial Day', date: nthWeekday(y, 4, 1, -1) },
        { name: "Father's Day", date: nthWeekday(y, 5, 0, 3) },
        { name: 'Independence Day', date: new Date(y, 6, 4) },
        { name: 'Labor Day', date: nthWeekday(y, 8, 1, 1) },
        { name: 'Veterans Day', date: new Date(y, 10, 11) },
        { name: 'Thanksgiving', date: nthWeekday(y, 10, 4, 4) },
        { name: 'Christmas Eve', date: new Date(y, 11, 24) },
        { name: 'Christmas', date: new Date(y, 11, 25) }
    ];
}

// Holidays from 3 days before the service Sunday through the
// following Saturday.
export function holidaysForService(service) {

    const dayOffset = d =>
        Math.round(
            (d.getTime() - service.getTime()) / 86400000
        );

    return [
        ...holidaysForYear(service.getFullYear()),
        ...holidaysForYear(service.getFullYear() + 1)
    ]
        .filter(h =>
            dayOffset(h.date) >= -3 &&
            dayOffset(h.date) <= 6
        )
        .sort((a, b) =>
            a.date.getTime() - b.date.getTime()
        )
        .map(h => ({
            name: h.name,
            label: h.date.toLocaleDateString(
                undefined,
                {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                }
            )
        }));
}
