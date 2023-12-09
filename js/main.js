import {colorMap} from './colorMap.js';
import {getLegend} from './legends.js';
import {replaceSpaceByDash, getTempColor, removeAccents, roundStringNumber, removeDuplicateHolidays} from './utils.js';

$('#currency-overlay').hide();
$('#weather-card').hide();
$('#info-overlay').hide();
$('#news-overlay').hide();
$('#holidays-overlay').hide();
$('#close-currency-overlay').on('click', () => {$('#currency-overlay').hide()});
$('#close-weather-overlay').on('click', () => {$('#weather-card').hide()});
$('#close-info-overlay').on('click', () => {$('#info-overlay').hide()});
$('#close-news-overlay').on('click', () => {$('#news-overlay').hide()});
$('#close-holidays-overlay').on('click', () => {$('#holidays-overlay').hide()});

const ajaxCall = (url, data, successCallback) => {
    $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: data,
        success: res => successCallback(res, popup),
        error: (jqXHR, textStatus, errorThrown) => {
            console.log(errorThrown);
        }
    });
}

// CREATE THE MAP
var map = L.map('map').fitWorld();

const streetView = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const satelliteView = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

streetView.addTo(map);

var baseMaps = {
    "Street": streetView,
    "Satellite": satelliteView
};
var popup = L.popup();
var cityMarkers = L.markerClusterGroup({polygonOptions: {
    color: '#4169E1',
    fillColor: '#4169E1',
    weight: 1,
    fillOpacity: 0.5
}});
var airportsMarkers = L.markerClusterGroup({polygonOptions: {
    color: '#FF7F50',
    fillColor: '#FF7F50',
    weight: 1,
    fillOpacity: 0.5
}});
var mediaMarkers = L.markerClusterGroup({polygonOptions: {
    color: '#008000',
    fillColor: '#008000',
    weight: 1,
    fillOpacity: 0.5
}});
var overlayMaps = {
    'Cities': cityMarkers,
    'Airports': airportsMarkers,
    'Webcams': mediaMarkers
}
var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
var layersColor = L.geoJson();
var colorplethLayers;

// Generate countries dropdown

ajaxCall('php/geojson.php', {q:'ACN', iso_a2: null}, (res) => {
    res.data.sort((a, b) => {
        return a.name.localeCompare(b.name);
    })
    for (let i=0; i<res.data.length; i++) {
        const country = $("<option></option>").text(res.data[i].name).val(res.data[i].iso_a2);
        $('#country-list').append(country);
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError);
    } else {
        onLocationError();
    }
});

// Change functionality
$('#country-list').on('change', () => {
    popup.setContent('');
    const iso_a2 = $('#country-list').val();
    const name = $('#country-list option:selected').text();
    ajaxCall('php/geojson.php', {q: 'SC', iso_a2: iso_a2}, (result) => {
        highlightCountry(result.data[0], true);
    });
    handleCountryByIsoA2(name, iso_a2, true);
})

const defStyle = {'opacity': 0, 'fillOpacity': 0};

// EASY BUTTONS
var infoButton = L.easyButton('fa-solid fa-info', function(){
    $('#info-overlay').show();
    $('#currency-overlay').hide();
    $('#weather-card').hide();
    $('#news-overlay').hide();
    $('#holidays-overlay').hide();
}).addTo(map);
var currencyButton = L.easyButton('fa-solid fa-dollar-sign', function(){
    $('#currency-overlay').show();
    $('#weather-card').hide();
    $('#info-overlay').hide();
    $('#news-overlay').hide();
    $('#holidays-overlay').hide();
}).addTo(map);
var weatherButton = L.easyButton('fa-solid fa-cloud', function(){
    $('#weather-card').show();
    $('#currency-overlay').hide();
    $('#info-overlay').hide();
    $('#news-overlay').hide();
    $('#holidays-overlay').hide();
}).addTo(map);
var newsButton = L.easyButton('fa-regular fa-newspaper', function(){
    $('#news-overlay').show();
    $('#currency-overlay').hide();
    $('#info-overlay').hide();
    $('#weather-card').hide();
    $('#holidays-overlay').hide();
}).addTo(map);
var holidaysButton = L.easyButton('fa-solid fa-gift', function(){
    $('#holidays-overlay').show();
    $('#news-overlay').hide();
    $('#currency-overlay').hide();
    $('#info-overlay').hide();
    $('#weather-card').hide();
}).addTo(map);
var defaultViewButton = L.easyButton('fa-solid fa-eraser', function() {
    if (colorplethLayers) {
        colorplethLayers.resetStyle();
    }
    $('.legend').remove();
}).addTo(map);
var populationButton = L.easyButton('fa-solid fa-people-group', function(){
    if (!colorplethLayers) { 
        ajaxCall('php/geojson.php', {q: 'ACG', iso_a2: null}, (res) => {
            colorplethLayers = L.geoJson(res.data, {style: defStyle}).addTo(map);
            ajaxCall('php/popAndArea.php', {}, (result) => {
                colorMap(map, colorplethLayers, result.data, 'population');
            });
        });
    } else {
        ajaxCall('php/popAndArea.php', {}, (result) => {
            colorMap(map, colorplethLayers, result.data, 'population');
        });
    };
}).addTo(map);
var densityButton = L.easyButton('fa-sharp fa-solid fa-city', function(){
    if (!colorplethLayers) {
        ajaxCall('php/geojson.php', {q: 'ACG', iso_a2: null}, (res) => {
            colorplethLayers = L.geoJson(res.data, {style: defStyle}).addTo(map);
            ajaxCall('php/popAndArea.php', {}, (result) => {
                colorMap(map, colorplethLayers, result.data, 'density');
            });
        });
    } else {
        ajaxCall('php/popAndArea.php', {}, (result) => {
            colorMap(map, colorplethLayers, result.data, 'density');
        });
    };
}).addTo(map);

// Geolocation
function onLocationFound(e) {
    const latlng = {lat: e.coords.latitude, lng: e.coords.longitude};
    $('#preloader').hide();
    ajaxCall('php/closestCity.php', {lat: latlng.lat, lng: latlng.lng}, (res) => {
        $('#country-list').val(res.data[0].components['ISO_3166-1_alpha-2']).change();
    });
}

function onLocationError(e) {
    $('#preloader').hide();
    $('#country-list').val('AF').change();
}

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

map.on('click', (e) => {
    popup.setContent('').setLatLng(e.latlng).openOn(map);
    handleCountryByCoordinates(e.latlng.lat, e.latlng.lng);
});

layersColor.eachLayer(layer => {
    layer.on('click', e => {
        popup.setContent('');
        layer.bindPopup(popup);
        handleCountryByCoordinates(e.latlng.lat, e.latlng.lng);
    })
})

const highlightCountryStyle = {
    color: '#f00',
    opacity: 1,
    fillOpacity: 0,
    weight: 1
}

const highlightCountry = (country, bool=false) => {
    layersColor.eachLayer(layer => {
        layer.setStyle({opacity: 0})
    });
    layersColor = L.geoJson(country, {style: highlightCountryStyle}).addTo(map);
    if (bool) {
        map.fitBounds(layersColor.getBounds());
    }
}

const handleCountryByIsoA2 = (country, iso_a2, bool=false) => {
    if (bool) {map.closePopup();}
    $('#country-name-info').html(country);
    ajaxCall('php/geodb.php', {countryCode: iso_a2}, markCitiesCallback);
    ajaxCall('php/airports.php', {countryCode: iso_a2}, markAirportsCallback);
    ajaxCall('php/opencage.php', {q: replaceSpaceByDash(country), cc: iso_a2}, (res) => {
        $('#wikipedia').html(`<a href="https://en.wikipedia.org/wiki/${replaceSpaceByDash(country)}" target="_blank">${country}</a>`);
        $('#country-flag').html(res.data[0].annotations.flag);
        setCurrencyOverlay(country, res.data[0].annotations.currency.name, res.data[0].annotations.currency.iso_code, res.data[0].annotations.currency.symbol);
    });
    ajaxCall('php/geonames.php', {countryCode: iso_a2}, (res) => {
        $('#capital-city').html(res.data[0].capital);
        $('#area').html(parseFloat(res.data[0].areaInSqKm).toLocaleString('en'));
        $('#population').html(parseFloat(res.data[0].population).toLocaleString('en'));
        if (bool) {
            setWeatherOverlay(null, null, res.data[0].capital, country);
        }
    });
    ajaxCall('php/news.php', {countryCode: iso_a2}, (res) => {
        $('#country-name-news').html(country);
        $('#news').empty();
        if (res.data.length === 0 || res.data.message) {
            const msg = $('<p></p>').text(`No news were found for ${country}`).addClass('m-1');
            $('#news').append(msg);
        } else {
            let tableStr = '<table class="table table-striped align-middle m-0">';
            for (let i=0; i<res.data.length; i++) {
                tableStr += `
                    <tr>
                        <td>${res.data[i].title}</td>
                        <td class="right"><a href=${res.data[i].link}>View</a></td>
                    </tr>
                `
            }
            tableStr += '</table>';
            $('#news').append(tableStr);
        }
    });
    ajaxCall('php/holidays.php', {countryCode: iso_a2}, (res) => {
        res.sort((a, b) => {
            return a.date.localeCompare(b.date);
        });
        res = removeDuplicateHolidays(res);
        $('#holidays').empty();
        $('#country-name-holidays').html(country);
        let tableStr = '<table class="table table-striped align-middle m-0">';
        for (let i=0; i<res.length; i++) {
            tableStr += `
                <tr>
                    <td>${res[i].name}</td>
                    <td class="right" style="width: 35%">${dayjs(res[i].date).format('ddd Do MMM')}</td>
                </tr>
            `;
        }
        tableStr += '</table>';
        $('#holidays').append(tableStr);
        document.getElementById('holidays').scrollTop = 0;
    })
    ajaxCall('php/media.php', {countryCode: iso_a2}, mediaCallback);
}

const handleCountryByCoordinates = (lat, lng) => {
    ajaxCall('php/closestCity.php', {lat: lat, lng: lng}, (res) => {
        popup.setContent(res.data[0].formatted);
        if (res.data[0].components._type !== 'body_of_water') {
            if (res.data[0].components.city) {
                setWeatherOverlay(lat, lng, res.data[0].components.city, res.data[0].components.country);
            } else if (res.data[0].components.county) {
                setWeatherOverlay(lat, lng, res.data[0].components.county, res.data[0].components.country);
            } else if (res.data[0].components.state) {
                setWeatherOverlay(lat, lng, res.data[0].components.state, res.data[0].components.country);
            }
            ajaxCall('php/geojson.php', {q: 'SC', iso_a2: res.data[0].components['ISO_3166-1_alpha-2']}, (result) => {
                highlightCountry(result.data[0]);
            })
            handleCountryByIsoA2(res.data[0].components.country, res.data[0].components['ISO_3166-1_alpha-2']);
        }
    });
}

const markCitiesCallback = (res) => {
    cityMarkers.clearLayers();
    var cityMarker = L.ExtraMarkers.icon({
        icon: 'fa-city',
        iconColor: '#fff',
        markerColor: 'blue',
        shape: 'circle',
        prefix: 'fa'
    });
    for (let i=0; i<res.data.length; i++) {
        var marker = L.marker(new L.LatLng(res.data[i].latitude, res.data[i].longitude), {icon: cityMarker});
        marker.bindPopup(res.data[i].name + '<br>' + parseFloat(res.data[i].population).toLocaleString('en') + ' inhabitants');
        marker.on('click', (e) => {
            var markerPopup = e.target.getPopup();
        });
        cityMarkers.addLayer(marker);
    }
    map.addLayer(cityMarkers);
}

const markAirportsCallback = (res) => {
    airportsMarkers.clearLayers();
    var airportMarker = L.ExtraMarkers.icon({
        icon: 'fa-plane',
        iconColor: '#fff',
        markerColor: 'orange',
        shape: 'circle',
        prefix: 'fa'
    });
    for (let i=0; i<res.data.length; i++) {
        var marker = L.marker(new L.LatLng(res.data[i].lat, res.data[i].lng), {icon: airportMarker});
        marker.bindPopup(res.data[i].toponymName);
        marker.on('click', (e) => {
            var markerPopup = e.target.getPopup();
        });
        airportsMarkers.addLayer(marker);
    }
    map.addLayer(airportsMarkers);
}

const mediaCallback = (res) => {
    mediaMarkers.clearLayers();
    var mediaMarker = L.ExtraMarkers.icon({
        icon: 'fa-video',
        iconColor: '#fff',
        markerColor: 'green',
        shape: 'circle',
        prefix: 'fa'
    });
    for (let i=0; i<res.data.length; i++) {
        var marker = L.marker(new L.LatLng(res.data[i].location.latitude, res.data[i].location.longitude), {icon: mediaMarker});
        marker.bindPopup(
            res.data[i].title
            + `<br><br><iframe src=${res.data[i].player.day}></iframe>`
        );
        marker.on('click', (e) => {
            var markerPopup = e.target.getPopup();
        });
        mediaMarkers.addLayer(marker);
    }
    map.addLayer(mediaMarkers);
}

// SET CURRENCY OVERLAY
const setCurrencyOverlay = (country, currencyName, currencyCode, currencySymbol) => {
    ajaxCall('php/exchangeRate.php', {symbols: currencyCode}, (res) => {
        $('#country-name').html(country);
        $('#currency-name').html(currencyName);
        $('.currency-code').html(currencyCode);
        $('#currency-symbol').html(currencySymbol);
        for (const key in res.data) {
            const currency = $("<option></option>").text(key).val(key);
            $('#currency-list').append(currency);
        }
        $('#currency-list').on('change', () => {
            const selectedCurrencyCode = $('#currency-list').val();
            $('#currency-rate').html(roundStringNumber(res.data[selectedCurrencyCode], 4));
        });
        $('#currency-list').val('USD').change();
    });
}

// SET WEATHER OVERLAY
const setCurrentTimeAndDate = (place) => {
    const currentTime = dayjs().tz(place).format('HH:mm');
    const currentDate = dayjs().tz(place).format('ddd Do');
    $('#date').html(currentDate);
}

const setWeatherOverlay = (lat, lng, city, country) => {
    let data;
    if (!lat || !lng) {
        data = replaceSpaceByDash(removeAccents(city + ',' + country));
    } else {
        data = lat + ',' + lng;
    }
    ajaxCall('php/weather.php', {loc: data}, (res) => {
        const myRes = Object.keys(res.data.locations).map(key => res.data.locations[key])[0];
        setCurrentTimeAndDate(myRes.tz);
        $('#place').html(city + ',<br>' + country);
        $('#icon').html(`<img src="./images/weatherIcons/${myRes.values[0].icon}.svg" width="70px" alt="weather icon">`);
        $('#temp').html(roundStringNumber(myRes.values[0].temp, 0)).css('color', getTempColor(myRes.values[0].temp));
        $('#wind-speed').html(roundStringNumber(myRes.values[0].wspd, 0));
        $('#humidity').html(roundStringNumber(myRes.values[0].humidity, 0));
        $('#pressure').html(roundStringNumber(myRes.values[0].sealevelpressure, 0));
        $('#weekday1').html(dayjs().add(1, 'day').format('ddd').toUpperCase());
        $('#icon1').html(`<img src="./images/weatherIcons/${myRes.values[1].icon}.svg" width="40px">`);
        $('#tmin1').html(roundStringNumber(myRes.values[1].mint, 0)).css('color', getTempColor(myRes.values[1].mint));
        $('#tmax1').html(roundStringNumber(myRes.values[1].maxt, 0)).css('color', getTempColor(myRes.values[1].maxt));
        $('#weekday2').html(dayjs().add(2, 'day').format('ddd').toUpperCase());
        $('#icon2').html(`<img src="./images/weatherIcons/${myRes.values[1].icon}.svg" width="40px">`);
        $('#tmin2').html(roundStringNumber(myRes.values[2].mint, 0)).css('color', getTempColor(myRes.values[2].mint));
        $('#tmax2').html(roundStringNumber(myRes.values[2].maxt, 0)).css('color', getTempColor(myRes.values[2].maxt));
        $('#weekday3').html(dayjs().add(3, 'day').format('ddd').toUpperCase());
        $('#icon3').html(`<img src="./images/weatherIcons/${myRes.values[1].icon}.svg" width="40px">`);
        $('#tmin3').html(roundStringNumber(myRes.values[3].mint, 0)).css('color', getTempColor(myRes.values[3].mint));
        $('#tmax3').html(roundStringNumber(myRes.values[3].maxt, 0)).css('color', getTempColor(myRes.values[3].maxt));
        $('#weekday4').html(dayjs().add(4, 'day').format('ddd').toUpperCase());
        $('#icon4').html(`<img src="./images/weatherIcons/${myRes.values[1].icon}.svg" width="40px">`);
        $('#tmin4').html(roundStringNumber(myRes.values[4].mint, 0)).css('color', getTempColor(myRes.values[4].mint));
        $('#tmax4').html(roundStringNumber(myRes.values[4].maxt, 0)).css('color', getTempColor(myRes.values[4].maxt));
    })
}
