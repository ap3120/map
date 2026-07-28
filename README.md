## Requirements
1. Apache web server
2. npm
3. composer

## Installation
`npm install`</br>
`composer install`

## APIs
This application uses multiple APIs.</br>
To run it properly, you need to create a .env file at the root of the project following the .env-sample</br>
Then get your free APIs keys from the following APIs:
1. https://opencagedata.com/ --> `OPEN_CAGE_API=`
2. https://rapidapi.com/apininjas/api/holidays-by-api-ninjas/ --> `HOLIDAYS_API=`
3. https://openexchangerates.org --> `OPEN_EXCHANGE_RATE_API=`
4. https://api.windy.com --> `WINDY_API=`
5. https://www.geonames.org --> `GEONAMES_USERNAME=`
6. https://www.visualcrossing.com/weather-api/ --> `VISUAL_CROSSING_API=`
7. https://newsdata.io --> `NEWS_API=`
8. https://rapidapi.com/wirefreethought/api/geodb-cities --> `GEODB_API=`

## Running the application
Make sure the Apache server is running.</br>
For example on Linux: `sudo service apache2 start`</br>
If using apache2 the code needs to be at the following location: `/var/www/html`</br>
In your browser url type `http://localhost/map`

## Backend

The `php/` directory holds one proxy per upstream API, so the API keys stay on
the server. Each one is a thin script built on the helpers in `php/lib/`:

- `bootstrap.php` loads the environment and turns off `display_errors`, so a
  warning can never be written into a JSON response body.
- `input.php` validates request parameters and URL-encodes them before they are
  interpolated into an upstream URL.
- `http.php` performs the request and translates the outcome into a response.

Every endpoint answers with the same envelope and sets a matching HTTP status:

```json
{
  "status": {"code": 200, "name": "ok", "description": "success", "returnedIn": "42 ms"},
  "data": []
}
```

Failures are reported honestly rather than as a `200`:

| Situation | Status |
|---|---|
| Missing or invalid request parameter | `400` |
| Upstream rate limit reached | `429` |
| Upstream unreachable, erroring, or returning an unexpected payload | `502` |
| Missing API key or unreadable border data | `500` |

Upstream authentication failures are reported as `502` on purpose: they mean the
server's own API key is wrong, which is not something the caller can act on.
