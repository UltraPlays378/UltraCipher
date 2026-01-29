addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Root path serves all files as one JSON download
  if (url.pathname === "/") {
    const files = {
      "hashsecurity.txt": "IyBVbHRyYUNpcGhlciBIYXNoU2VjdXJpdHkgRmlsZQojIFVzZWQgZm9yIHBhc3N3b3JkIHNlY3VyaXR5IC8gZGV0ZXJtaW5pc3RpYyBzZXR1cAoKIyBFeGFtcGxlIGR1bW15IGhhc2ggZGF0YQpUZXN0IEhhc2ggQ29udGVudA==",
      "manifest.json": "eyJuYW1lIjoiVWx0cmFDaXBoZXIiLCJ2ZXJzaW9uIjoiMS4wLjAifQ=="
    }

    const json = JSON.stringify(files, null, 2)

    return new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="UltraCipherFiles.json"',
        "Cache-Control": "no-store"
      }
    })
  }

  return new Response("Not Found", { status: 404 })
}
