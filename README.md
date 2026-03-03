# UltraCipher

 The ultimate hash & manifest setup for iOS Shortcuts  
Version: v1.3  
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

- Methods allowed: `POST`, `OPTIONS`, and `GET /setup`.
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



## API key setup endpoint

- `GET /setup` generates an API key and returns it once per client IP during a cooldown window.
- Cooldown default is **30 days**.
- Override cooldown with Worker env var `SETUP_API_KEY_COOLDOWN_DAYS` (e.g. `7` for one week).
- If `/setup` is called again before cooldown ends, response is `429` with `Retry-After` and the previously issued key for that IP.
- **Important:** copy/save the key when generated.

Example:

```bash
curl https://<your-worker-domain>/setup
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


Cloudflare-side requirement: `/setup` needs the `RATE_LIMIT_KV` binding configured and available in the deployed Worker environment.

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
