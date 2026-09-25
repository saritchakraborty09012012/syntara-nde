# Syntara with Cursor-type IDEs

Syntara exposes an OpenAI-compatible local endpoint, so IDEs that support custom OpenAI-compatible/local providers can point to:

```text
http://127.0.0.1:8000/v1
```

Use a model ID returned by `GET /v1/models`. No Syntara account or cloud model hosting is required.
