import {getColor} from './colorMap.js';

const getGrades = (parameter) => {
    if (parameter === 'population') {
        return [0, 10, 20, 50, 100, 200, 500, 1000];
    } else if (parameter === 'density') {
        return [5000, 1000, 500, 250, 125, 60, 30];
    }
}

const getTitle = (parameter) => {
    if (parameter === 'population') {
        return '<h6>Population in million</h6>';
    } else if (parameter === 'density') {
        return '<h6>Inhabitants/km2</h6>';
    }
}

const getKey = (i, parameter) => {
    if (parameter === 'population') {
        return getColor(parameter, getGrades(parameter)[i]*Math.pow(10,6)+1);
    } else if (parameter === 'density') {
        return getColor(parameter, getGrades(parameter)[i]);
    }
}

export const getLegend = (map, parameter) => {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = getGrades(parameter),
        labels = [];
    div.innerHTML += getTitle(parameter);
    for (let i=0; i<grades.length; i++) {
        div.innerHTML += '<i style="background:' + getKey(i, parameter) + '"></i> ' + grades[i] + (grades[i+1] ? '&ndash;' + grades[i+1] + '<br>' : '+');
    }
    return div;
}
