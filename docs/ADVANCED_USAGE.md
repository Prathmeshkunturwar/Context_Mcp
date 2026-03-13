# Advanced Usage

## HTTP Transport Mode

By default, the server runs on stdio. For testing or custom integrations, switch to HTTP:

```bash
TRANSPORT=http GITHUB_TOKEN=ghp_xxx node build/server.js
```

Then test with curl:

```bash
# List available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","params":{}}'

# Query docs
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "query-docs",
      "arguments": {
        "libraryId": "/openai/openai-python",
        "query": "streaming chat completions",
        "version": "1.0.0"
      }
    }
  }'
```

---

## Chaining Tools in Claude

The most powerful workflow is to chain tools together in a single prompt:

```
1. detect-project-versions → find what versions I'm on
2. get-changelog-diff       → see what changed since my version
3. auto-migrate-codebase   → identify affected files
4. query-docs              → get the new API docs
```

**Example prompt to Claude:**
> "Scan my project at `./`, detect my LangChain version, compare it to the latest, and show me every breaking change that affects my code — with the new API docs for each."

---

## Custom Cache Location

Override the default cache path:

```bash
CACHE_PATH=/tmp/my-mcp-cache.db node build/server.js
```

Useful for containerized environments where `.cache/` may not be writable.

---

## Adding Libraries with Custom Sources

Beyond GitHub, the registry supports alternate version sources:

```json
{
  "id": "/my-org/my-lib",
  "versionSource": "npm:my-lib-package",
  "language": "javascript"
}
```

```json
{
  "id": "/my-org/my-pylib",
  "versionSource": "pypi:my-pylib",
  "language": "python"
}
```

For HuggingFace models:
```json
{
  "id": "/huggingface/transformers",
  "versionSource": "huggingface:transformers",
  "language": "python"
}
```

---

## Running in Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY build/ ./build/
COPY src/registry/libraries.json ./build/registry/
ENV TRANSPORT=http
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build/server.js"]
```

Build and run:
```bash
docker build -t ai-context-mcp .
docker run -p 3000:3000 -e GITHUB_TOKEN=ghp_xxx ai-context-mcp
```

---

## CI/CD Integration

Use the HTTP transport in CI to validate docs are fetchable:

```yaml
# .github/workflows/check-docs.yml
- name: Start MCP server
  run: TRANSPORT=http node build/server.js &

- name: Wait for server
  run: sleep 5

- name: Test query
  run: |
    curl -f -X POST http://localhost:3000/mcp \
      -H "Content-Type: application/json" \
      -d '{"method":"tools/list","params":{}}'
```

---

## Disabling Semantic Ranking

If you want faster (but less accurate) results without loading the MiniLM model:

```bash
AI_RANKER=basic node build/server.js
```

This falls back to TF-IDF keyword matching, which is significantly faster but less semantically aware.

---

## Programmatic Usage (Node.js)

You can import the registry and fetcher directly:

```typescript
import { Registry } from './src/registry';
import { GithubFetcher } from './src/sources/github';
import { SQLiteCache } from './src/cache/sqlite-store';

const cache = new SQLiteCache();
const fetcher = new GithubFetcher(cache);
const registry = new Registry();

const lib = registry.resolve('langchain');
const docs = await fetcher.fetchDocs(lib, '0.3.0', 'docs/');
console.log(docs);
```

---

## Performance Tuning

| Env Variable | Default | Description |
|---|---|---|
| `CACHE_TTL_HOURS` | `24` | SQLite cache TTL |
| `MAX_SNIPPETS` | `5` | Max doc snippets returned per query |
| `SNIPPET_LENGTH` | `500` | Max characters per snippet |
| `LRU_MAX_SIZE` | `100` | In-memory LRU cache entries |
| `PORT` | `3000` | HTTP port (when `TRANSPORT=http`) |
