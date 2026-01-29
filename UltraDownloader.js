addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Base64 file data
  const base64Data =
    "IyBVbHRyYUNpcGhlciBIYXNoU2VjdXJpdHkgRmlsZQojIFVzZWQgZm9yIHBhc3N3b3JkIHNlY3VyaXR5IC8gZGV0ZXJtaW5pc3RpYyBzZXR1cAoKIyBFeGFtcGxlIGR1bW15IGhhc2ggZGF0YQpUZXN0IEhhc2ggQ29udGVudA=="

  // Decode base64 → text
  const decoded = atob(base64Data)

  // ROOT PATH SERVES FILE
  if (url.pathname === "/") {
    return new Response(decoded, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="hashsecurity.txt"'
      }
    })
  }

  return new Response("Not Found", { status: 404 })
}
