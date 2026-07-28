<?php
declare(strict_types=1);

// Paths are resolved against this file, not the working directory: the previous
// '../vendor/autoload.php' form broke under any SAPI that does not chdir to the
// script directory (php-fpm, CLI).
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/http.php';
require_once __DIR__ . '/input.php';

// Warnings must never reach the response body: they would be written before the
// Content-Type header, breaking both the header and the client's JSON parse,
// and leaking absolute filesystem paths.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

$GLOBALS['executionStartTime'] = microtime(true);

set_exception_handler(static function (Throwable $e): void {
    error_log('Unhandled exception: ' . $e->getMessage());
    fail('Internal server error', 500);
});

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../..');
$dotenv->safeLoad();

/**
 * Read a required key from the environment.
 */
function env_key(string $name): string
{
    $value = $_ENV[$name] ?? '';

    if (!is_string($value) || $value === '') {
        error_log("Missing required environment variable: {$name}");
        fail('Server is not configured correctly', 500);
    }

    return $value;
}
