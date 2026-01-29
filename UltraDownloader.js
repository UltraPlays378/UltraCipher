addEventListener("fetch", event => {
  event.respondWith(handle(event.request))
})

const FILES = {
  "/hashsecurity": {
    filename: "hashsecurity.txt",
    mime: "text/plain",
    base64: "IyBVbHRyYUNpcGhlciBIYXNoU2VjdXJpdHkgRmlsZQojIFVzZWQgZm9yIHBhc3N3b3JkIHNlY3VyaXR5IC8gZGV0ZXJtaW5pc3RpYyBzZXR1cAoKIyBFeGFtcGxlIGR1bW15IGhhc2ggZGF0YQpUZXN0IEhhc2ggQ29udGVudA=="
  },

  "/manifest": {
    filename: "manifest.json",
    mime: "application/json",
    base64: "eyJuYW1lIjoiVWx0cmFDaXBoZXIiLCJ2ZXJzaW9uIjoiMS4wLjAifQ=="
  }
}

function decodeBase64(input) {
  const clean = input.includes(",") ? input.split(",")[1] : input
  return Uint8Array.from(atob(clean), c => c.charCodeAt(0))
}

async function handle(request) {
  const path = new URL(request.url).pathname
  const file = FILES[path]

  if (!file) {
    return new Response("Not Found", { status: 404 })
  }

  return new Response(decodeBase64(file.base64), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "no-store"
    }
  })
}
