export default {
  async fetch(req, env) {
    if (req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(req.url);

    // UltraCipher Base64 / data URLs
    const UltraCipherData = {
      hashsecurity: "data:text/plain;base64,IyBVbHRyYUNpcGhlciBIYXNoU2VjdXJpdHkgRmlsZQojIFVzZWQgZm9yIHBhc3N3b3JkIHNlY3VyaXR5IC8gZGV0ZXJtaW5pc3RpYyBzZXR1cAoKIyBFeGFtcGxlIGR1bW15IGhhc2ggZGF0YQpUZXN0IEhhc2ggQ29udGVudA==",
      MPK: "data:application/json;base64,ewogICJwb2xpY3lfdmVyc2lvbiI6ICIxLjAiLAogICJleHBlY3RlZF9tYW5pZmVzdF9oYXNoIjogImIxOTk2MWE3YjUxY2QwY2QxZjIxZGNmZmQ0ZWFmOWJlMWQ0ZWVhMGI4ZDI0N2M4OWU0ZDc1YmUwNTliYzM5OTI4OTY0Mjk5MzFlZTk2YzFlODIzNmU3YjA0M2RjY2Y4ZSIsCiAgIm1vZGUiOiAiZGV0ZXJtaW5pc3RpYyIsCiAgImVuZm9yY2VtZW50IjogIndhcm4iLAogICJub3RlcyI6ICJNYW5pZmVzdC5qc29uIGlzIHNhY3JlZC4gRG8gbm90IHRvdWNoIHVubGVzcyB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuIFRhbXBlcmluZyA9IHlvdXIgcHJvYmxlbS4iCn0=",
      manifest: "data:application/json;base64,ewogICJ2ZXJzaW9uIjogIjEuMCIsCiAgImhhc2giOiAiYjE5OTYxYTdiNTFjZDBjZDFmMjFkY2ZmZDRlYWY5YmUxZDRlZWEwYjhkMjQ3Yzg5ZTRkNzViZTA1OWJjMzk5MjAiLAogICJwb2xpY3lfa2V5IjogImIxOTk2MWE3YjUxY2QwY2QxZjIxZGNmZmQ0ZWFmOWJlMWQ0ZWVhMGI4ZDI0N2M4OWU0ZDc1YmUwNTliYzM5OTI4OTY0Mjk5MzFlZTk2YzFlODIzNmU3YjA0M2RjY2Y4ZSIsCiAgIm1vZGUiOiAiZGV0ZXJtaW5pc3RpYyIsCiAgImVuZm9yY2VtZW50IjogIndhcm4iLAogICJub3RlcyI6ICJNYW5pZmVzdC5qc29uIGlzIHNhY3JlZC4gRG8gbm90IHRvdWNoIHVubGVzcyB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuIFRhbXBlcmluZyA9IHlvdXIgcHJvYmxlbS4iCn0="
    };

    // Serve based on path
    switch (url.pathname) {
      case "/hashsecurity":
        return new Response(UltraCipherData.hashsecurity, {
          headers: { "Content-Type": "text/plain" }
        });
      case "/MPK":
        return new Response(UltraCipherData.MPK, {
          headers: { "Content-Type": "application/json" }
        });
      case "/manifest":
        return new Response(UltraCipherData.manifest, {
          headers: { "Content-Type": "application/json" }
        });
      default:
        return new Response("UltraCipher Worker: Invalid path", { status: 404 });
    }
  }
};
