import {getLegend} from './legends.js';

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

export const colorMap = (map, bordersLayer, popAndAreaObj, parameter) => {
    $('.legend').remove();
    bordersLayer.eachLayer(layer => {
        let index = popAndAreaObj.findIndex(element => {
            if (element.isoAlpha3 === layer.feature.properties.iso_a3) {
                return true;
            }
        });
        if (index >= 0) {
            if (parameter === 'population') {
                layer.setStyle({
                    fillColor: getColor(parameter, popAndAreaObj[index].population),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                });
            } else if (parameter === 'density') {
                layer.setStyle({
                    fillColor: getColor(parameter, popAndAreaObj[index].population/popAndAreaObj[index].areaInSqKm),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                });
            }
        }
    });
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = () => getLegend(map, parameter);
    legend.addTo(map);
}
