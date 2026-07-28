<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$countryCode = param('countryCode', PATTERN_COUNTRY_CODE);

$result = api_get(
    'https://holidays-by-api-ninjas.p.rapidapi.com/v1/holidays'
    . '?country=' . urlencode((string) $countryCode),
    [
        'X-RapidAPI-Host: holidays-by-api-ninjas.p.rapidapi.com',
        'X-RapidAPI-Key: ' . env_key('HOLIDAYS_API'),
    ]
);

// Upstream returns a bare array; wrapping it keeps every endpoint on one contract.
respond_upstream($result);
