export const replaceSpaceByDash = (str) => {
    return str.toLowerCase().replace(/ /g, '_');
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

export const roundStringNumber = (num, n) => {
    let str = num.toLocaleString();
    const i = str.indexOf('.');
    if (i >= 0) {
        if (n > 0) {
            str = str.slice(0, str.lastIndexOf('.')) + str.slice(str.lastIndexOf('.'), str.lastIndexOf('.') + n + 1);
        } else {
            str = str.slice(0, str.lastIndexOf('.'));
        }
    }
    return str;
}

export const removeDuplicateHolidays = (holidays) => {
    let holidaysDates = [];
    let count = 0;
    while (count < holidays.length) {
        if (holidaysDates.includes(holidays[count].date)) {
            holidays.splice(count, 1);
        } else {
            holidaysDates.push(holidays[count].date)
            count += 1;
        }
    }
    return holidays;
}
