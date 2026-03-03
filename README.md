# UltraCipher

 The ultimate hash & manifest setup for iOS Shortcuts  
Version: v1.1  
Mode: Deterministic (when salt/pepper are fixed), Glitch King style  

---

⚠️ THIS REPO IS STILL IN DEVELOPMENT. ⚠️

## Salt + Pepper support

- `salt`: Optional request field (string/number) mixed into the hash input before `text`.
- `ULTRACIPHER_PEPPER`: Optional Worker environment secret mixed into the hash input after `text`.

Effective hashed material:

```txt
salt + text + pepper
```

Example request body:

```json
{
  "text": "hello",
  "key": [1,2,3],
  "salt": "user-specific-random"
}
```

## Rate limiting setup

`wrangler.jsonc` includes a `ULTRACIPHER_RATE_LIMIT` binding. You must replace
`REPLACE_WITH_REAL_NAMESPACE_ID` with your real Cloudflare Rate Limiting
namespace id before deploy.

It also includes a KV binding named `KV` for custom counter/state storage
with namespace id `4463b4470c604e0593eb3a6cf6213399`.
