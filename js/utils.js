export const replaceSpaceByDash = (str) => {
    return String(str ?? '').toLowerCase().replace(/ /g, '_');
}

export const removeAccents = (text) => {
    var accents    = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž',
        accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz",
        textNoAccents = [];

    for (var i in text) {
        var idx = accents.indexOf(text[i]);
        if (idx != -1)
            textNoAccents[i] = accentsOut.substr(idx, 1);
        else
            textNoAccents[i] = text[i];
    }

    return textNoAccents.join('');
}

export const getTempColor = (temp) => {
    const myTemp = parseFloat(temp);
    if (!Number.isFinite(myTemp)) {
        // Let the element keep its inherited colour rather than reading as hot.
        return '';
    }
    if (myTemp < 0) {
        return '#000080';
    } else if (myTemp < 10) {
        return '#1E90FF';
    } else if (myTemp < 25) {
        return '#DAA520';
    } else if (myTemp < 35) {
        return '#FF8C00';
    } else {
        return '#FF0000';
    }
}

/**
 * Format a number to n decimal places, or null if it is not a number.
 *
 * Pinned to en-US: the previous version used the browser locale and then split
 * on '.', so a locale using '.' as its thousands separator mangled the value.
 */
export const roundStringNumber = (num, n) => {
    const value = parseFloat(num);

    if (!Number.isFinite(value)) {
        return null;
    }

    return value.toLocaleString('en-US', {
        minimumFractionDigits: n,
        maximumFractionDigits: n
    });
}

/**
 * Format an integer with thousands separators, or null if it is not a number.
 */
export const formatNumber = (value) => {
    const num = parseFloat(value);
    return Number.isFinite(num) ? num.toLocaleString('en-US') : null;
}

/**
 * Return the value only if it is an http(s) URL, so it is safe to use as a
 * link or frame source.
 */
export const safeHttpUrl = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null;
    } catch {
        return null;
    }
}

/**
 * Keep the first holiday for each date. Returns a new array rather than
 * splicing the caller's while iterating it.
 */
export const removeDuplicateHolidays = (holidays) => {
    const seen = new Set();

    return holidays.filter(holiday => {
        if (!holiday || seen.has(holiday.date)) {
            return false;
        }
        seen.add(holiday.date);
        return true;
    });
}
