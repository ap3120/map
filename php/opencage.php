<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$query       = param('q', PATTERN_PLACE);
$countryCode = param('cc', PATTERN_COUNTRY_CODE);

$result = api_get(
    'https://api.opencagedata.com/geocode/v1/json?limit=1'
    . '&q=' . urlencode((string) $query)
    . '&countrycode=' . urlencode((string) $countryCode)
    . '&key=' . urlencode(env_key('OPEN_CAGE_API'))
);

respond_upstream($result, 'results');
