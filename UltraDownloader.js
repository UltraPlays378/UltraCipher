import JSZip from "jszip"; // Worker supports ESM packages if configured

addEventListener("fetch", event => {
  event.respondWith(handle(event.request))
})

async function handle(request) {
  const zip = new JSZip()

  // Add files
  zip.file("hashsecurity.txt", atob("IyBVbHRyYUNpcGhlciBIYXNoU2VjdXJpdHkgRmlsZQojIFVzZWQgZm9yIHBhc3N3b3JkIHNlY3VyaXR5IC8gZGV0ZXJtaW5pc3RpYyBzZXR1cAoKIyBFeGFtcGxlIGR1bW15IGhhc2ggZGF0YQpUZXN0IEhhc2ggQ29udGVudA=="))
  zip.file("manifest.json", atob("eyJuYW1lIjoiVWx0cmFDaXBoZXIiLCJ2ZXJzaW9uIjoiMS4wLjAifQ=="))

  const content = await zip.generateAsync({ type: "uint8array" })

  return new Response(content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="UltraCipherFiles.zip"',
    }
  })
}
