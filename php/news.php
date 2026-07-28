<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

const NEWS_LIMIT = 4;

$countryCode = param('countryCode', PATTERN_COUNTRY_CODE);

$result = api_get(
    'https://newsdata.io/api/1/news'
    . '?apikey=' . urlencode(env_key('NEWS_API'))
    . '&country=' . urlencode((string) $countryCode)
);

$decoded = upstream_json($result);

// newsdata.io reports its own errors inside a 200 response.
if (($decoded['status'] ?? null) !== 'success') {
    error_log('newsdata.io returned status: ' . var_export($decoded['status'] ?? null, true));
    fail('Upstream news service returned an error', 502);
}

$results = $decoded['results'] ?? [];

respond(is_array($results) ? array_slice($results, 0, NEWS_LIMIT) : []);
