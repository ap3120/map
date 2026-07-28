<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$countryCode = param('countryCode', PATTERN_COUNTRY_CODE);

$result = api_get(
    'https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10&sort=-population&types=CITY'
    . '&countryIds=' . urlencode((string) $countryCode),
    [
        'X-RapidAPI-Host: wft-geo-db.p.rapidapi.com',
        'X-RapidAPI-Key: ' . env_key('GEODB_API'),
    ]
);

respond_upstream($result, 'data');
