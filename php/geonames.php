<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$countryCode = param('countryCode', PATTERN_COUNTRY_CODE);

// GeoNames only serves https to premium accounts, so this stays on http.
$result = api_get(
    'http://api.geonames.org/countryInfoJSON?lang=en'
    . '&country=' . urlencode((string) $countryCode)
    . '&username=' . urlencode(env_key('GEONAMES_USERNAME'))
);

respond_upstream($result, 'geonames');
