addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.pathname === "/") {
    // Prebuilt ZIP file (Base64)
    const zipBase64 = "UEsDBBQAAAAI...YOUR_BASE64_HERE...AAAAA=="

    // Decode Base64 → binary
    const uint8Array = Uint8Array.from(atob(zipBase64), c => c.charCodeAt(0))

    return new Response(uint8Array, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="UltraCipherFiles.zip"',
        "Cache-Control": "no-store"
      }
    })
  }

  return new Response("Not Found", { status: 404 })
}
