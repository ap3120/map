<?php
declare(strict_types=1);

const PATTERN_COUNTRY_CODE  = '/^[A-Za-z]{2}$/';
const PATTERN_CURRENCY_CODE = '/^[A-Za-z]{3}$/';

/**
 * Free text used as an upstream place name: letters, digits and the few
 * separators the client actually produces.
 */
const PATTERN_PLACE = '/^[\p{L}\p{N} ,._\'+-]{1,120}$/u';

/**
 * Read and validate a request parameter.
 *
 * Reads $_POST then $_GET explicitly rather than $_REQUEST, which also merges
 * cookies and would let a planted cookie shadow a posted field.
 */
function param(string $name, string $pattern, bool $required = true): ?string
{
    $value = $_POST[$name] ?? $_GET[$name] ?? null;

    if (!is_string($value) || $value === '') {
        if ($required) {
            fail("Missing required parameter '{$name}'", 400);
        }
        return null;
    }

    if (!preg_match($pattern, $value)) {
        fail("Invalid value for parameter '{$name}'", 400);
    }

    return $value;
}

/**
 * Read and validate a decimal coordinate.
 */
function coord_param(string $name, float $min, float $max): string
{
    $value = (string) param($name, '/^-?\d{1,3}(\.\d+)?$/');

    if ((float) $value < $min || (float) $value > $max) {
        fail("Parameter '{$name}' is out of range", 400);
    }

    return $value;
}
