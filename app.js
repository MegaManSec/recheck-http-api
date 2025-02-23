const express = require("express");
const { check } = require("recheck");

const app = express();
const PORT = process.env.PORT || 3001;

const cache = new Map();
const MAX_CACHE_SIZE = 15000;
const TRIM_CACHE_SIZE = 1000;

const keepAliveTimeout = 60 * 1000;
const headersTimeout = 60 * 1000;

const recheckTimeout = 60 * 1000;

const TEXT = `The /recheck endpoint accepts a POST request with Content-Type:
application/json.

It expects a JSON object where keys are strings and values are objects
with "pattern" and "modifier" keys, e.g.
{"1": {"pattern": "REGEX", "modifier": ""}, "2": {"pattern": "REGEX2", "modifier": "i"}}

Each regex is validated using check() from Recheck
(https://makenowjust-labs.github.io/recheck/).

The response is a JSON object where each key maps to the result of
check().

A maximum of 500 expressions can be checked in a single request.
The maximum valid single expression length is 1000 characters.

If validation fails, the value is null, e.g., {"1": {...}, "2": null}.
Make sure you check for that.

Invalid JSON requests return 400 Bad Request.

Requests with a missing or incorrect Content-Type return 415 Unsupported
Media Type.`;

app.use(express.json());

app.use(function (err, req, res, next) {
    if (!('stack' in err && err.stack.includes("JSON.parse")))
        console.error(err.stack);
    res.status(500).send('Something broke! Invalid JSON?');
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

server.keepAliveTimeout = keepAliveTimeout;
server.headersTimeout = headersTimeout;

app.get("/", (req, res) => res.type('text').send(TEXT));

app.post("/recheck", async (req, res) => {
    if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid JSON structure, or missing Content-Type: application/json header" });
    }

    const result = Object.create(null);
    const keys = Object.keys(req.body);

    if (keys.length > 500) {
        return res.status(400).json({ error: "Greater than 500 expressions" });
    }

    if (cache.size > MAX_CACHE_SIZE) {
        const keysToDelete = Array.from(cache.keys()).slice(0, TRIM_CACHE_SIZE);
        keysToDelete.forEach((key) => cache.delete(key));
    }

    await Promise.all(
        keys.map(async (key) => {
            if (Object.hasOwn(req.body, key) && typeof req.body[key] === "object") {
                const { pattern, modifier } = req.body[key];

                if (typeof pattern !== "string" || typeof modifier !== "string") {
                    result[key] = null;
                    return;
                }

                const trimmedValue = pattern.trim();
                const cacheKey = `${trimmedValue}::${modifier}`;

                if (trimmedValue.length > 1000) {
                    result[key] = null;
                    return;
                }

                if (cache.has(cacheKey)) {
                    result[key] = cache.get(cacheKey);
                } else {
                    try {
                        const checkResult = await check(trimmedValue, modifier, { timeout: recheckTimeout });
                        if (checkResult["status"] !== "unknown") {
                            cache.set(cacheKey, checkResult); // Save to cache only if status is not unknown
                        }
                        result[key] = checkResult;
                    } catch (error) {
                        result[key] = null;
                    }
                }
            }
        })
    );

    res.json(result);
});

app.post("/recheck", async (req, res) => {
    return res.status(405).send("405 Method Not Allowed");
});

app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
