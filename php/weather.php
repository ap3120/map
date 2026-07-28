<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

// Either "lat,lng" or a "city,country" string built by the client.
$location = param('loc', PATTERN_PLACE);

$result = api_get(
    'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/forecast'
    . '?aggregateHours=24&unitGroup=metric&shortColumnNames=false&contentType=json'
    . '&forecastDays=5&iconSet=icons1'
    . '&locations=' . urlencode((string) $location)
    . '&key=' . urlencode(env_key('VISUAL_CROSSING_API'))
);

respond_upstream($result);
