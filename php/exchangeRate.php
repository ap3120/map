<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$symbols = strtoupper((string) param('symbols', PATTERN_CURRENCY_CODE));

$result = api_get(
    'https://openexchangerates.org/api/latest.json'
    . '?app_id=' . urlencode(env_key('OPEN_EXCHANGE_RATE_API'))
);

$decoded = upstream_json($result);
$rates   = $decoded['rates'] ?? null;

if (!is_array($rates)) {
    error_log('Exchange rate payload is missing the rates object');
    fail('Upstream returned an unexpected payload', 502);
}

// Upstream quotes everything against USD; rebase onto the requested currency.
$base = $rates[$symbols] ?? null;

if (!is_numeric($base) || (float) $base === 0.0) {
    fail("No exchange rate is available for '{$symbols}'", 400);
}

foreach ($rates as $code => $rate) {
    $rates[$code] = is_numeric($rate) ? $rate / $base : null;
}

respond($rates);
