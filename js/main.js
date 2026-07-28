import {colorMap} from './colorMap.js';
import {
    replaceSpaceByDash,
    getTempColor,
    removeAccents,
    roundStringNumber,
    formatNumber,
    safeHttpUrl,
    removeDuplicateHolidays
} from './utils.js';
import {apiCall} from './api.js';
import {setText, showPanelError, clearPanelError, showToast} from './ui.js';

// OVERLAYS

const OVERLAYS = [
    {panel: '#currency-overlay', close: '#close-currency-overlay'},
    {panel: '#weather-card',     close: '#close-weather-overlay'},
    {panel: '#info-overlay',     close: '#close-info-overlay'},
    {panel: '#news-overlay',     close: '#close-news-overlay'},
    {panel: '#holidays-overlay', close: '#close-holidays-overlay'}
];

const INFO_PANEL = '#info-overlay .modal-body';
const CURRENCY_PANEL = '#currency-overlay .modal-body';
const WEATHER_PANEL = '#weather-card .modal-body';
const NEWS_PANEL = '#news';
const HOLIDAYS_PANEL = '#holidays';

const showOnlyOverlay = (panel) => {
    OVERLAYS.forEach(overlay => $(overlay.panel).toggle(overlay.panel === panel));
};

showOnlyOverlay(null);
OVERLAYS.forEach(overlay => {
    $(overlay.close).on('click', () => $(overlay.panel).hide());
});

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
var layersColor = null;
var colorplethLayers;

const defStyle = {'opacity': 0, 'fillOpacity': 0};

const highlightCountryStyle = {
    color: '#f00',
    opacity: 1,
    fillOpacity: 0,
    weight: 1
}

// DOM HELPERS

/**
 * Build a popup body from plain text, one line per argument. Leaflet accepts an
 * element, which keeps API-supplied strings away from innerHTML.
 */
const textPopup = (...lines) => {
    // A span, so this is also valid inside the heading elements it is used in.
    const container = document.createElement('span');

    lines.filter(Boolean).forEach((line, index) => {
        if (index > 0) {
            container.appendChild(document.createElement('br'));
        }
        container.appendChild(document.createTextNode(line));
    });

    return container;
};

const weatherIcon = (name, size) => {
    // Icon names index a local directory, so only accept the shape they use.
    if (typeof name !== 'string' || !/^[a-z-]+$/.test(name)) {
        return '';
    }

    const img = document.createElement('img');
    img.src = `./images/weatherIcons/${name}.svg`;
    img.width = size;
    img.alt = 'weather icon';
    return img;
};

// COUNTRY LIST

const dismissPreloader = () => $('#preloader').hide();

const selectDefaultCountry = () => $('#country-list').val('AF').change();

const locateUser = () => {
    if (!navigator.geolocation) {
        onLocationError();
        return;
    }
    // Without a timeout, a user who neither grants nor denies the permission
    // prompt gets no callback at all and the preloader stays up forever.
    navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError, {timeout: 10000});
};

apiCall('php/geojson.php', {q: 'ACN'}, {
    onSuccess: (countries) => {
        countries
            .filter(country => country?.name && country?.iso_a2)
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(country => {
                $('#country-list').append($('<option></option>').text(country.name).val(country.iso_a2));
            });
        locateUser();
    },
    onError: (reason) => {
        // The app cannot start without the country list, but the preloader must
        // never be left covering the page with no explanation.
        dismissPreloader();
        showToast(`Could not load the country list: ${reason}`);
    }
});

$('#country-list').on('change', () => {
    const iso_a2 = $('#country-list').val();
    const name = $('#country-list option:selected').text();

    if (!iso_a2) {
        return;
    }

    popup.setContent('');
    showCountryBorder(iso_a2, true);
    handleCountryByIsoA2(name, iso_a2, true);
});

// EASY BUTTONS

L.easyButton('fa-solid fa-info', () => showOnlyOverlay('#info-overlay')).addTo(map);
L.easyButton('fa-solid fa-dollar-sign', () => showOnlyOverlay('#currency-overlay')).addTo(map);
L.easyButton('fa-solid fa-cloud', () => showOnlyOverlay('#weather-card')).addTo(map);
L.easyButton('fa-regular fa-newspaper', () => showOnlyOverlay('#news-overlay')).addTo(map);
L.easyButton('fa-solid fa-gift', () => showOnlyOverlay('#holidays-overlay')).addTo(map);
L.easyButton('fa-solid fa-eraser', () => {
    if (colorplethLayers) {
        colorplethLayers.resetStyle();
    }
    $('.legend').remove();
}).addTo(map);

const addChoroplethButton = (icon, parameter) => {
    L.easyButton(icon, () => {
        const applyColours = () => {
            apiCall('php/popAndArea.php', {}, {
                onSuccess: (countries) => colorMap(map, colorplethLayers, countries, parameter),
                onError: (reason) => showToast(`Could not load ${parameter} data: ${reason}`)
            });
        };

        if (colorplethLayers) {
            applyColours();
            return;
        }

        apiCall('php/geojson.php', {q: 'ACG'}, {
            onSuccess: (features) => {
                colorplethLayers = L.geoJson(features, {style: defStyle}).addTo(map);
                applyColours();
            },
            onError: (reason) => showToast(`Could not load country borders: ${reason}`)
        });
    }).addTo(map);
};

addChoroplethButton('fa-solid fa-people-group', 'population');
addChoroplethButton('fa-sharp fa-solid fa-city', 'density');

// GEOLOCATION

function onLocationFound(position) {
    dismissPreloader();
    apiCall('php/closestCity.php', {lat: position.coords.latitude, lng: position.coords.longitude}, {
        onSuccess: (results) => {
            const iso_a2 = results[0]?.components?.['ISO_3166-1_alpha-2'];
            if (iso_a2) {
                $('#country-list').val(iso_a2).change();
            } else {
                selectDefaultCountry();
            }
        },
        onError: () => selectDefaultCountry()
    });
}

function onLocationError() {
    dismissPreloader();
    selectDefaultCountry();
}

map.on('click', (e) => {
    popup.setContent('').setLatLng(e.latlng).openOn(map);
    handleCountryByCoordinates(e.latlng.lat, e.latlng.lng);
});

// COUNTRY BORDERS

const showCountryBorder = (iso_a2, fitBounds = false) => {
    apiCall('php/geojson.php', {q: 'SC', iso_a2: iso_a2}, {
        onSuccess: (features) => {
            if (features.length > 0) {
                highlightCountry(features[0], fitBounds);
            }
        },
        onError: (reason) => showToast(`Could not load this country's border: ${reason}`)
    });
};

const highlightCountry = (country, fitBounds = false) => {
    // The previous layer used to be faded rather than removed, so every
    // selection left another GeoJSON layer on the map.
    if (layersColor) {
        map.removeLayer(layersColor);
    }

    layersColor = L.geoJson(country, {style: highlightCountryStyle}).addTo(map);

    if (fitBounds) {
        map.fitBounds(layersColor.getBounds());
    }
}

// MARKERS

const toLatLng = (lat, lng) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    return Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
        ? new L.LatLng(parsedLat, parsedLng)
        : null;
};

const renderMarkers = ({group, icon, items, getLatLng, buildPopup}) => {
    group.clearLayers();
    const markerIcon = L.ExtraMarkers.icon(icon);

    items.forEach(item => {
        const latlng = getLatLng(item);
        if (!latlng) {
            return;
        }

        const marker = L.marker(latlng, {icon: markerIcon});
        marker.bindPopup(buildPopup(item));
        group.addLayer(marker);
    });

    map.addLayer(group);
};

const loadCities = (iso_a2) => {
    apiCall('php/geodb.php', {countryCode: iso_a2}, {
        onSuccess: (cities) => renderMarkers({
            group: cityMarkers,
            icon: {icon: 'fa-city', iconColor: '#fff', markerColor: 'blue', shape: 'circle', prefix: 'fa'},
            items: cities,
            getLatLng: city => toLatLng(city.latitude, city.longitude),
            buildPopup: (city) => {
                const population = formatNumber(city.population);
                return textPopup(city.name, population ? `${population} inhabitants` : null);
            }
        }),
        onError: () => cityMarkers.clearLayers()
    });
};

const loadAirports = (iso_a2) => {
    apiCall('php/airports.php', {countryCode: iso_a2}, {
        onSuccess: (airports) => renderMarkers({
            group: airportsMarkers,
            icon: {icon: 'fa-plane', iconColor: '#fff', markerColor: 'orange', shape: 'circle', prefix: 'fa'},
            items: airports,
            getLatLng: airport => toLatLng(airport.lat, airport.lng),
            buildPopup: airport => textPopup(airport.toponymName)
        }),
        onError: () => airportsMarkers.clearLayers()
    });
};

const loadWebcams = (iso_a2) => {
    apiCall('php/media.php', {countryCode: iso_a2}, {
        onSuccess: (webcams) => renderMarkers({
            group: mediaMarkers,
            icon: {icon: 'fa-video', iconColor: '#fff', markerColor: 'green', shape: 'circle', prefix: 'fa'},
            items: webcams,
            getLatLng: webcam => toLatLng(webcam.location?.latitude, webcam.location?.longitude),
            buildPopup: (webcam) => {
                const container = textPopup(webcam.title);
                const src = safeHttpUrl(webcam.player?.day);

                if (src) {
                    const frame = document.createElement('iframe');
                    frame.src = src;
                    frame.loading = 'lazy';
                    frame.referrerPolicy = 'no-referrer';
                    container.appendChild(document.createElement('br'));
                    container.appendChild(frame);
                }

                return container;
            }
        }),
        onError: () => mediaMarkers.clearLayers()
    });
};

// COUNTRY PANELS

const loadCountryDetails = (country, iso_a2, showWeather) => {
    apiCall('php/geonames.php', {countryCode: iso_a2}, {
        onSuccess: (results) => {
            const info = results[0];
            clearPanelError(INFO_PANEL);
            setText('#capital-city', info?.capital);
            setText('#area', formatNumber(info?.areaInSqKm));
            setText('#population', formatNumber(info?.population));

            if (showWeather && info?.capital) {
                setWeatherOverlay(null, null, info.capital, country);
            }
        },
        onError: (reason) => {
            setText('#capital-city', null);
            setText('#area', null);
            setText('#population', null);
            showPanelError(INFO_PANEL, `Could not load details for ${country}: ${reason}`);
        }
    });
};

const loadGeocoding = (country, iso_a2) => {
    apiCall('php/opencage.php', {q: replaceSpaceByDash(country), cc: iso_a2}, {
        onSuccess: (results) => {
            const annotations = results[0]?.annotations;

            $('#wikipedia').empty().append(
                $('<a></a>')
                    .attr('href', `https://en.wikipedia.org/wiki/${encodeURIComponent(replaceSpaceByDash(country))}`)
                    .attr('target', '_blank')
                    .attr('rel', 'noopener noreferrer')
                    .text(country)
            );
            setText('#country-flag', annotations?.flag, '');

            setCurrencyOverlay(
                country,
                annotations?.currency?.name,
                annotations?.currency?.iso_code,
                annotations?.currency?.symbol
            );
        },
        onError: (reason) => {
            $('#wikipedia').empty();
            setText('#country-flag', null, '');
            showPanelError(CURRENCY_PANEL, `Could not load currency details for ${country}: ${reason}`);
        }
    });
};

const loadNews = (country, iso_a2) => {
    apiCall('php/news.php', {countryCode: iso_a2}, {
        onSuccess: (articles) => {
            setText('#country-name-news', country);
            $(NEWS_PANEL).empty();

            if (articles.length === 0) {
                $(NEWS_PANEL).append($('<p></p>').addClass('m-1').text(`No news were found for ${country}`));
                return;
            }

            const $table = $('<table></table>').addClass('table table-striped align-middle m-0');

            articles.forEach(article => {
                const $link = $('<a></a>').text('View');
                const href = safeHttpUrl(article.link);

                if (href) {
                    $link.attr({href: href, target: '_blank', rel: 'noopener noreferrer'});
                }

                $table.append(
                    $('<tr></tr>')
                        .append($('<td></td>').text(article.title ?? ''))
                        .append($('<td></td>').addClass('right').append($link))
                );
            });

            $(NEWS_PANEL).append($table);
        },
        onError: (reason) => {
            setText('#country-name-news', country);
            $(NEWS_PANEL).empty();
            showPanelError(NEWS_PANEL, `Could not load news for ${country}: ${reason}`);
        }
    });
};

const loadHolidays = (country, iso_a2) => {
    apiCall('php/holidays.php', {countryCode: iso_a2}, {
        onSuccess: (holidays) => {
            setText('#country-name-holidays', country);
            $(HOLIDAYS_PANEL).empty();

            const unique = removeDuplicateHolidays(
                [...holidays].sort((a, b) => String(a?.date).localeCompare(String(b?.date)))
            );

            if (unique.length === 0) {
                $(HOLIDAYS_PANEL).append($('<p></p>').addClass('m-1').text(`No holidays were found for ${country}`));
                return;
            }

            const $table = $('<table></table>').addClass('table table-striped align-middle m-0');

            unique.forEach(holiday => {
                $table.append(
                    $('<tr></tr>')
                        .append($('<td></td>').text(holiday.name ?? ''))
                        .append($('<td></td>').addClass('right').css('width', '35%').text(dayjs(holiday.date).format('ddd Do MMM')))
                );
            });

            $(HOLIDAYS_PANEL).append($table);
            document.getElementById('holidays').scrollTop = 0;
        },
        onError: (reason) => {
            setText('#country-name-holidays', country);
            $(HOLIDAYS_PANEL).empty();
            showPanelError(HOLIDAYS_PANEL, `Could not load holidays for ${country}: ${reason}`);
        }
    });
};

const handleCountryByIsoA2 = (country, iso_a2, isDirectSelection = false) => {
    if (isDirectSelection) {
        map.closePopup();
    }

    setText('#country-name-info', country);

    loadCities(iso_a2);
    loadAirports(iso_a2);
    loadWebcams(iso_a2);
    loadCountryDetails(country, iso_a2, isDirectSelection);
    loadGeocoding(country, iso_a2);
    loadNews(country, iso_a2);
    loadHolidays(country, iso_a2);
}

const handleCountryByCoordinates = (lat, lng) => {
    apiCall('php/closestCity.php', {lat: lat, lng: lng}, {
        onSuccess: (results) => {
            const place = results[0];
            if (!place) {
                return;
            }

            popup.setContent(textPopup(place.formatted));

            const components = place.components ?? {};
            if (components._type === 'body_of_water') {
                return;
            }

            const placeName = components.city || components.county || components.state;
            if (placeName) {
                setWeatherOverlay(lat, lng, placeName, components.country);
            }

            const iso_a2 = components['ISO_3166-1_alpha-2'];
            if (!iso_a2) {
                return;
            }

            showCountryBorder(iso_a2);
            handleCountryByIsoA2(components.country, iso_a2);
        },
        onError: (reason) => showToast(`Could not identify this location: ${reason}`)
    });
}

// CURRENCY OVERLAY

const setCurrencyOverlay = (country, currencyName, currencyCode, currencySymbol) => {
    setText('#country-name', country);
    setText('#currency-name', currencyName);
    $('.currency-code').text(currencyCode ?? '—');
    setText('#currency-symbol', currencySymbol);

    if (!currencyCode) {
        setText('#currency-rate', null);
        showPanelError(CURRENCY_PANEL, `No currency is listed for ${country}`);
        return;
    }

    apiCall('php/exchangeRate.php', {symbols: currencyCode}, {
        onSuccess: (rates) => {
            clearPanelError(CURRENCY_PANEL);

            // Rebuilt from scratch on every country change: the options and the
            // change handler used to accumulate on each call.
            const $list = $('#currency-list');
            $list.off('change').empty();

            Object.keys(rates).forEach(code => {
                $list.append($('<option></option>').text(code).val(code));
            });

            $list.on('change', () => {
                setText('#currency-rate', roundStringNumber(rates[$list.val()], 4));
            });

            $list.val('USD').trigger('change');
        },
        onError: (reason) => {
            setText('#currency-rate', null);
            showPanelError(CURRENCY_PANEL, `Could not load exchange rates for ${country}: ${reason}`);
        }
    });
}

// WEATHER OVERLAY

const FORECAST_DAYS = 4;

// dayjs throws on a timezone name it does not recognise, which would take the
// whole forecast down with it.
const formatToday = (tz) => {
    try {
        return tz ? dayjs().tz(tz).format('ddd Do') : dayjs().format('ddd Do');
    } catch {
        return dayjs().format('ddd Do');
    }
};

const setWeatherOverlay = (lat, lng, city, country) => {
    const location = (lat === null || lat === undefined || lng === null || lng === undefined)
        ? replaceSpaceByDash(removeAccents(`${city},${country}`))
        : `${lat},${lng}`;

    apiCall('php/weather.php', {loc: location}, {
        onSuccess: (data) => {
            const forecast = Object.values(data?.locations ?? {})[0];
            const values = forecast?.values;

            if (!Array.isArray(values) || values.length === 0) {
                showPanelError(WEATHER_PANEL, `No forecast is available for ${city}`);
                return;
            }

            clearPanelError(WEATHER_PANEL);

            $('#place').empty().append(textPopup(`${city},`, country));
            setText('#date', formatToday(forecast.tz));

            const today = values[0];
            $('#icon').empty().append(weatherIcon(today.icon, 70));
            setText('#temp', roundStringNumber(today.temp, 0));
            $('#temp').css('color', getTempColor(today.temp));
            setText('#wind-speed', roundStringNumber(today.wspd, 0));
            setText('#humidity', roundStringNumber(today.humidity, 0));
            setText('#pressure', roundStringNumber(today.sealevelpressure, 0));

            // Each day reads its own entry; #icon2 to #icon4 all used values[1].
            for (let day = 1; day <= FORECAST_DAYS; day++) {
                const value = values[day];
                setText(`#weekday${day}`, dayjs().add(day, 'day').format('ddd').toUpperCase());
                $(`#icon${day}`).empty().append(value ? weatherIcon(value.icon, 40) : '');
                setText(`#tmin${day}`, roundStringNumber(value?.mint, 0));
                $(`#tmin${day}`).css('color', getTempColor(value?.mint));
                setText(`#tmax${day}`, roundStringNumber(value?.maxt, 0));
                $(`#tmax${day}`).css('color', getTempColor(value?.maxt));
            }
        },
        onError: (reason) => showPanelError(WEATHER_PANEL, `Could not load the weather for ${city}: ${reason}`)
    });
}
