addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // UltraCipher raw file contents
  const UltraCipherFiles = {
    "hashsecurity.txt": `# UltraCipher HashSecurity File
# Used for password security / deterministic setup

# Example dummy hash data
Test Hash Content
`,
    "manifest.json": `{
  "name": "UltraCipher",
  "version": "1.0.0"
}`
  }

  // Remove leading "/" to match keys
  const key = url.pathname.slice(1)

  if (UltraCipherFiles[key]) {
    let contentType = "text/plain"
    if (key.endsWith(".json")) contentType = "application/json"

    return new Response(UltraCipherFiles[key], {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${key}"`,
        "Cache-Control": "no-store"
      }
    })
  }

  return new Response("UltraCipher Worker: Invalid file", { status: 404 })
}
