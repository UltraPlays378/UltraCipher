# UltraCipher

 The ultimate hash & manifest setup for iOS Shortcuts  
Version: v1.2  
Mode: Deterministic (when key/salt/pepper are fixed), Glitch King style  

---

⚠️ THIS REPO IS STILL IN DEVELOPMENT. ⚠️

## Salt + Pepper support

- `salt`: Optional request field (string/number) mixed into the hash input before `text`.
- `ULTRACIPHER_PEPPER`: Optional Worker environment secret mixed into the hash input after `text`.

Effective hashed material:

```txt
salt + text + pepper
```

## API behavior

- Methods allowed: `POST` and `OPTIONS`.
- Any other method returns `405` with JSON error.
- Invalid JSON returns `400` with JSON error.

## Input validation

- `text` must be a non-empty string.
- `text` max length: `4096`.
- `salt` max length: `256`.
- `key` must be an array or comma-separated string of up to `64` unsigned 32-bit integers.

Example request body:

```json
{
  "text": "hello",
  "key": [1,2,3],
  "salt": "user-specific-random"
}
```


## API key authentication (`x-api-key`)

- If `ULTRACIPHER_API_KEYS` is configured in Worker environment (comma-separated),
  each request must include header `x-api-key: <one-of-configured-keys>`.
- If `ULTRACIPHER_API_KEYS` is unset/empty, API key auth is disabled.
- Invalid/missing key returns `401`.

Example:

```http
x-api-key: your-secret-key
```

## Rate limiting setup

- Worker-side limit uses KV counters (fixed window): `60` requests per `60` seconds per IP.
- `wrangler.jsonc` includes:
  - `RATE_LIMIT_KV` KV binding (`id: 4463b4470c604e0593eb3a6cf6213399`)
  - `ULTRACIPHER_RATE_LIMIT` ratelimit binding (`namespace_id: 378`)

## CORS setup

Set `ALLOWED_ORIGINS` (comma-separated) to restrict origins, for example:

```txt
https://app.example.com,https://admin.example.com
```

If `ALLOWED_ORIGINS` is unset, CORS falls back to `*`.
