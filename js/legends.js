import {getColor} from './colorMap.js';

const getGrades = (parameter) => {
    if (parameter === 'population') {
        return [0, 10, 20, 50, 100, 200, 500, 1000];
    } else if (parameter === 'density') {
        // Ascending, to match the label loop below; these used to be listed
        // descending, which rendered every range backwards.
        return [0, 30, 60, 125, 250, 500, 1000, 5000];
    }
    return [];
}

const getTitle = (parameter) => {
    if (parameter === 'population') {
        return 'Population in million';
    } else if (parameter === 'density') {
        return 'Inhabitants/km2';
    }
    return '';
}

// Colour each row by a value just inside its bucket, since getColor's
// thresholds are exclusive.
const getKey = (i, parameter) => {
    const grade = getGrades(parameter)[i];
    if (parameter === 'population') {
        return getColor(parameter, grade * Math.pow(10, 6) + 1);
    }
    return getColor(parameter, grade + 1);
}

export const getLegend = (parameter) => {
    const div = L.DomUtil.create('div', 'info legend');
    const grades = getGrades(parameter);

    const title = document.createElement('h6');
    title.textContent = getTitle(parameter);
    div.appendChild(title);

    grades.forEach((grade, i) => {
        const swatch = document.createElement('i');
        swatch.style.background = getKey(i, parameter);
        div.appendChild(swatch);

        const next = grades[i + 1];
        div.appendChild(document.createTextNode(
            ` ${grade}${next ? '–' + next : '+'}`
        ));
        div.appendChild(document.createElement('br'));
    });

    return div;
}
