<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$countryCode = param('countryCode', PATTERN_COUNTRY_CODE);

$result = api_get(
    'http://api.geonames.org/searchJSON?featureCode=AIRP&maxRows=10'
    . '&country=' . urlencode((string) $countryCode)
    . '&username=' . urlencode(env_key('GEONAMES_USERNAME'))
);

respond_upstream($result, 'geonames');
