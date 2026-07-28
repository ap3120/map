<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$countryCode = param('countryCode', PATTERN_COUNTRY_CODE);

$result = api_get(
    'https://api.windy.com/webcams/api/v3/webcams'
    . '?lang=en&limit=30&offset=0&sortKey=popularity&sortDirection=desc'
    . '&include=images,location,player'
    . '&countries=' . urlencode((string) $countryCode),
    ['X-WINDY-API-KEY: ' . env_key('WINDY_API')]
);

respond_upstream($result, 'webcams');
