<?php
declare(strict_types=1);

const HTTP_TIMEOUT = 10;
const HTTP_CONNECT_TIMEOUT = 5;

/**
 * Perform a GET request against an upstream API.
 *
 * @param string[] $headers
 * @return array{code:int, body:?string, error:?string}
 */
function api_get(string $url, array $headers = []): array
{
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_ENCODING       => '',
        CURLOPT_TIMEOUT        => HTTP_TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => HTTP_CONNECT_TIMEOUT,
        CURLOPT_HTTPHEADER     => $headers,
    ]);

    $body  = curl_exec($ch);
    $error = curl_error($ch);
    $code  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code'  => $code,
        'body'  => $body === false ? null : (string) $body,
        'error' => $error !== '' ? $error : null,
    ];
}

function status_name(int $code): string
{
    $names = [
        200 => 'ok',
        400 => 'bad_request',
        429 => 'too_many_requests',
        500 => 'internal_server_error',
        502 => 'bad_gateway',
    ];

    return $names[$code] ?? 'error';
}

/**
 * Write the JSON envelope and set the matching HTTP status.
 *
 * @param mixed $data
 */
function respond($data, int $code = 200, string $description = 'success'): void
{
    $elapsed = intval((microtime(true) - ($GLOBALS['executionStartTime'] ?? microtime(true))) * 1000);

    http_response_code($code);
    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode([
        'status' => [
            'code'        => $code,
            'name'        => status_name($code),
            'description' => $description,
            'returnedIn'  => $elapsed . ' ms',
        ],
        'data' => $data,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
}

/**
 * Emit an error envelope and stop.
 */
function fail(string $message, int $code): void
{
    respond(null, $code, $message);
    exit;
}

/**
 * Decode an upstream response, failing the request if it is unusable.
 *
 * Upstream authentication failures are reported as 502 rather than passed
 * through: they mean *our* API key is wrong, which the caller can neither fix
 * nor act on, and must not be echoed back as a client-side auth error.
 *
 * @param array{code:int, body:?string, error:?string} $result
 * @return array<mixed>
 */
function upstream_json(array $result): array
{
    if ($result['error'] !== null) {
        error_log('Upstream request failed: ' . $result['error']);
        fail('Upstream service is unreachable', 502);
    }

    if ($result['code'] === 429) {
        fail('Upstream rate limit reached, please try again shortly', 429);
    }

    if ($result['code'] < 200 || $result['code'] >= 300) {
        error_log('Upstream returned HTTP ' . $result['code']);
        fail('Upstream service returned HTTP ' . $result['code'], 502);
    }

    $decoded = json_decode((string) $result['body'], true);
    if (!is_array($decoded)) {
        error_log('Upstream returned a payload that is not valid JSON');
        fail('Upstream returned a malformed payload', 502);
    }

    return $decoded;
}

/**
 * Decode an upstream response and send it on, optionally unwrapping one key.
 *
 * @param array{code:int, body:?string, error:?string} $result
 */
function respond_upstream(array $result, ?string $key = null): void
{
    $decoded = upstream_json($result);

    if ($key !== null) {
        if (!array_key_exists($key, $decoded)) {
            error_log("Upstream payload is missing the '{$key}' key");
            fail('Upstream returned an unexpected payload', 502);
        }
        $decoded = $decoded[$key];
    }

    respond($decoded);
    exit;
}
