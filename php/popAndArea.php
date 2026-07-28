<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

// Population and area for every country; takes no parameters.
$result = api_get(
    'http://api.geonames.org/countryInfoJSON?username=' . urlencode(env_key('GEONAMES_USERNAME'))
);

respond_upstream($result, 'geonames');
