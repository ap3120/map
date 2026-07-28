<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$lat = coord_param('lat', -90.0, 90.0);
$lng = coord_param('lng', -180.0, 180.0);

$result = api_get(
    'https://api.opencagedata.com/geocode/v1/json?limit=1'
    . '&q=' . urlencode($lat . '+' . $lng)
    . '&key=' . urlencode(env_key('OPEN_CAGE_API'))
);

respond_upstream($result, 'results');
