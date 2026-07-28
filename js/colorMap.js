import {getLegend} from './legends.js';

const CHOROPLETH_STYLE = {
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
};

export const getColor = (parameter, val) => {
    if (parameter === 'population') {
        return val > 1000000000 ? '#800026' :
           val > 500000000  ? '#BD0026' :
           val > 200000000  ? '#E31A1C' :
           val > 100000000  ? '#FC4E2A' :
           val > 50000000   ? '#FD8D3C' :
           val > 20000000   ? '#FEB24C' :
           val > 10000000   ? '#FED976' :
                            '#FFEDA0';
    } else if (parameter === 'density') {
        return val > 5000 ? '#800026' :
           val > 1000  ? '#BD0026' :
           val > 500  ? '#E31A1C' :
           val > 250  ? '#FC4E2A' :
           val > 125   ? '#FD8D3C' :
           val > 60   ? '#FEB24C' :
           val > 30   ? '#FED976' :
                            '#FFEDA0';
    }
}

const getValue = (entry, parameter) => {
    const population = parseFloat(entry.population);

    if (parameter !== 'density') {
        return population;
    }

    const area = parseFloat(entry.areaInSqKm);
    return area > 0 ? population / area : null;
}

export const colorMap = (map, bordersLayer, popAndAreaObj, parameter) => {
    $('.legend').remove();

    if (!Array.isArray(popAndAreaObj)) {
        return;
    }

    const byIsoA3 = new Map(
        popAndAreaObj
            .filter(entry => entry?.isoAlpha3)
            .map(entry => [entry.isoAlpha3, entry])
    );

    bordersLayer.eachLayer(layer => {
        const entry = byIsoA3.get(layer.feature?.properties?.iso_a3);
        if (!entry) {
            return;
        }

        const value = getValue(entry, parameter);
        if (!Number.isFinite(value)) {
            return;
        }

        layer.setStyle({...CHOROPLETH_STYLE, fillColor: getColor(parameter, value)});
    });

    var legend = L.control({position: 'bottomright'});
    legend.onAdd = () => getLegend(parameter);
    legend.addTo(map);
}
