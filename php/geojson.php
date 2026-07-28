<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

// Read the border data straight off disk. It used to be fetched over HTTP from
// PATH_TO_COUNTRY_BORDERS, which made the server issue a request to itself for
// a 385 KB local file on every call.
const BORDERS_FILE = __DIR__ . '/../countryBorders.geo.json';

$query = param('q', '/^(ACN|ACG|SC)$/');

$raw = file_get_contents(BORDERS_FILE);
if ($raw === false) {
    error_log('Unable to read ' . BORDERS_FILE);
    fail('Country border data is unavailable', 500);
}

$decoded = json_decode($raw, true);
if (!is_array($decoded) || !isset($decoded['features']) || !is_array($decoded['features'])) {
    error_log('Country border data is malformed');
    fail('Country border data is unavailable', 500);
}

$features = $decoded['features'];

switch ($query) {
    case 'ACN': // All country names
        $data = array_map(static fn(array $feature): array => [
            'iso_a2' => $feature['properties']['iso_a2'] ?? null,
            'name'   => $feature['properties']['name'] ?? null,
        ], $features);
        break;

    case 'ACG': // All country geometries
        $data = $features;
        break;

    case 'SC': // Single country
        $iso_a2 = strtoupper((string) param('iso_a2', PATTERN_COUNTRY_CODE));
        // Previously this pushed the loop variable instead of the match, so a
        // lookup miss returned the last country in the file.
        $data = array_values(array_filter(
            $features,
            static fn(array $feature): bool => ($feature['properties']['iso_a2'] ?? null) === $iso_a2
        ));
        break;

    default:
        fail("Invalid value for parameter 'q'", 400);
}

respond($data);
