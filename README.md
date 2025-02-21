
ReDoS HTTP API
==============

Overview
--------

This project provides an HTTP API for testing regular expressions for Regular Expression Denial of Service (ReDoS) vulnerabilities using [Recheck](https://makenowjust-labs.github.io/recheck/). Recheck is one of the best libraries for ReDoS detection, but it is only available in Scala and TypeScript/JavaScript. This project enables other languages to test ReDoS vulnerabilities by sending regex patterns to this API.

Features
--------

-   Provides a simple HTTP API to check regex patterns for ReDoS vulnerabilities
-   Uses Recheck library for accurate vulnerability detection
-   Supports caching for improved performance
-   Allows up to 500 regex patterns per request
-   Provides validation and proper error handling for invalid requests

Installation
------------

You can run this project using Docker or directly with Node.js.

### Using Docker

```
docker build -t redos-http-api .
docker run -p 3001:3001 redos-http-api
```

### Using Node.js (Yarn)

```
yarn bootstrap
yarn start
```

API Usage
---------

### `POST /recheck`

#### Request

-   Content-Type: `application/json`
-   Body: JSON object where keys are unique identifiers and values are regex patterns.
-   Maximum of **500** expressions per request.

Example:

```
{
  "1": "^(a+)+$",
  "2": "^[a-z]+$^[a-z]+$^[a-z]+$^[a-z]+$^[a-z]+$ ( ..... over one 1000 characters ...... )",
  "3": "( ...... very long and slow regular expression, causing a timeout of recheck ...... )",
  "4": "^not-vulnerable[0-9]*$"
}

```

#### Response

-   A JSON object mapping the input keys to the results of Recheck's `check()` function.
-   If a regex is too long (more than 1000 characters) or causes an error, it returns `null`.

Example Response:

```
{
  "1": {"source":"^(a|a+)+$","flags":"","complexity":{"type":"exponential","summary":"exponential","isFuzz":false},"status":"vulnerable","attack":{"pattern":"'a' + 'a'.repeat(31) + '\\x00'","string":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\u0000","base":31,"suffix":"\u0000","pumps":[{"prefix":"a","pump":"a","bias":0}]},"checker":"automaton","hotspot":[{"start":4,"end":5,"temperature":"heat"}]},
  "2": null
  "3": {"source":"^/social-content-ai/api/v1/generated/(?<type>temp|((?<category>image|design-template|video|video-content|mail/exclusive)))(?<path>(/[^/]+)*)/(?<filename>[^/]+)\\.(?<extension>[^/]+)$","flags":"","checker":"automaton","error":{"kind":"timeout"},"status":"unknown"},
  "4": {"source":"^not-vulnerable[0-9]*$","flags":"","checker":"automaton","complexity":{"type":"linear","summary":"linear","isFuzz":false},"status":"safe"}
}
```


Ensure that you handle every case of the return value of recheck, including the three status types: [safe, vulnerable, and unknown](https://makenowjust-labs.github.io/recheck/docs/usage/diagnostics/).

#### Error Handling

-   **Invalid JSON** → `400 Bad Request`
-   **More than 500 expressions** → `400 Bad Request`
-   **Missing Content-Type or incorrect format** → `415 Unsupported Media Type`
-   **Invalid route** → `404 Not Found`
-   **Method Not Allowed** on `/recheck` → `405 Method Not Allowed`

Configuration
-------------

The following constants can be modified in `app.js`:

-   `PORT` - The server port (default: `3001`)
-   `MAX_CACHE_SIZE` - Maximum number of cached regex evaluations (default: `15000`)
-   `TRIM_CACHE_SIZE` - Number of cache entries to remove when exceeding the limit (default: `1000`)
-   `server.keepAliveTimeout` - Keep-alive timeout for connections (default: `60 seconds`)
-   `server.headersTimeout` - Header timeout for connections (default: `60 seconds`)

License
-------

This project is open-source and available under the GPL3.0 License.
