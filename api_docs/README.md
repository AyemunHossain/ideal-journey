# API Documentation

This folder contains generated API documentation for the Book Management API.

Files:

- `openapi.yaml` - OpenAPI 3.0 spec for the API (authors & books)
- `authors.md` - Human-readable endpoint reference for authors
- `books.md` - Human-readable endpoint reference for books
- `auth.md` - Human-readable endpoint reference for auth endpoints
- `rest_client_docs/` - Ready-to-run REST client `.http` files (use with VS Code REST Client or similar). These files use `@host = http://localhost:3000/api/v1`.

How to view:

1. Swagger UI (quick):
   - Install a local swagger UI server such as `swagger-ui` or use `redoc`/`redoc-cli`.
   - Example using `redoc-cli`:

```bash
# install once
npm install -g redoc-cli
# serve the openapi file on http://localhost:8080
redoc-cli serve api_docs/openapi.yaml
```

2. Use online viewers:

   - Copy `api_docs/openapi.yaml` content into https://editor.swagger.io/ or https://redoc.ly/

3. Programmatically load the spec in Swagger UI in your Nest app (if you already use @nestjs/swagger)

Notes:

- The spec documents endpoints implemented in `src/authors` and `src/books` controllers and DTOs.
- If you update DTOs/controllers, regenerate or edit `api_docs/openapi.yaml` accordingly.

Rest client quick start:

1. Open `api_docs/rest_client_docs/*.http` in VS Code with REST Client extension.
2. Update `@host` variable if your server runs on a different base URL.
3. Execute requests in order (signup -> signin -> use tokens -> create resources).
