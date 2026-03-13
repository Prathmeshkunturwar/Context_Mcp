# AI Context MCP — Test Plan & Verification Record

> Last verified: 2026-02-23
> Platform: Windows 11, Node.js v24.13.1
> All tests run from project root: `D:\Resume_updates\project ideas\ai-context-mcp\`

---

## Quick Status

| Layer | Test | Status | Result |
|---|---|---|---|
| Build | TypeScript compilation + JSON copy | ✅ PASS | Clean, no errors |
| Registry | Schema validation — 32 libraries | ✅ PASS | All fields valid |
| Unit | Jest — 39 tests across 6 suites | ✅ PASS | 39/39 in 6.7s |
| Integration | Stdio JSON-RPC — resolve-library-id | ✅ PASS | Correct response |
| Integration | Stdio JSON-RPC — query-docs (live fetch) | ✅ PASS | SOURCE: repository_docs |
| HTTP | `/health` endpoint | ✅ PASS | `{"status":"ok"}` |
| HTTP | `/metrics` endpoint | ✅ PASS | Prometheus format |
| HTTP | `/libraries` endpoint | ✅ PASS | 32 libraries listed |
| MCP (live) | resolve-library-id → Anthropic Python SDK | ✅ PASS | ID resolved |
| MCP (live) | query-docs → streaming + tool_use | ✅ PASS | Live GitHub docs fetched |

---

## Test 1 — Build

### Command
```bash
npm run build
```

### What it does
- Compiles all TypeScript in `src/` → `build/`
- Copies `src/registry/libraries.json` → `build/registry/libraries.json`

### Expected output
```
> ai-context-mcp@1.0.0 build
> tsc && node -e "require('fs').copyFileSync(...)"
```
*(No errors. Exit code 0.)*

### Verify JSON was copied
```bash
# Should show libraries.json in build/registry/
ls build/registry/
# Expected: index.d.ts  index.js  index.js.map  libraries.json  schema.d.ts  schema.js  schema.js.map
```

### Pass criteria
- No TypeScript errors
- `build/registry/libraries.json` exists and contains 32 entries
- `build/server.js` exists

### Verified result ✅
```
> ai-context-mcp@1.0.0 build
> tsc && node -e "require('fs').copyFileSync('src/registry/libraries.json','build/registry/libraries.json')"
[exit code 0 — clean]
```

---

## Test 2 — Registry Schema Validation

### Command
```bash
npm run validate-registry
```

### What it does
Runs `src/registry/schema.ts` which checks every entry in `libraries.json` for:
- Required fields: `id`, `name`, `aliases`, `category`, `language`, `repository`, `docsPath`, `versionSource`
- Valid `category` (must be one of 6 allowed values)
- Valid `language`
- No duplicate `id` or `alias` values
- GitHub-format repository URLs

### Expected output
```
Registry VALID: 32 libraries passed validation.
```

### Pass criteria
- Prints `Registry VALID: 32 libraries passed validation.`
- Exit code 0

### Verified result ✅
```
> ai-context-mcp@1.0.0 validate-registry
> ts-node src/registry/schema.ts

Registry VALID: 32 libraries passed validation.
```

---

## Test 3 — Unit Tests (Jest)

### Command
```bash
npm test
```

### Test suites and what they cover

| Suite | Tests | What is tested |
|---|---|---|
| `registry.test.ts` | 11 | Library count=32, resolve by name/alias/ID, categories, no duplicates |
| `snippet-extractor.test.ts` | 5 | `##`/`###` headers, code block protection, short content filter, source tracking |
| `ranker.test.ts` | 5 | Keyword ranking, code block boost, API signature boost, short chunk penalty |
| `version-detector.test.ts` | 5 | npm packages, requirements.txt, Pipfile, empty/missing file handling |
| `github-fetcher.test.ts` | 6 | Fetch+cache, L2 cache hit, offline stale fallback, `vX.Y.Z` tag format, 404 fallback, invalid URL |
| `changelog-parser.test.ts` | 7 | Breaking changes, features, deprecations, fixes, metadata boundaries, discovery fallback, no changelog error |

### Expected output
```
PASS tests/registry.test.ts
PASS tests/ranker.test.ts
PASS tests/snippet-extractor.test.ts
PASS tests/version-detector.test.ts
PASS tests/github-fetcher.test.ts
PASS tests/changelog-parser.test.ts

Test Suites: 6 passed, 6 total
Tests:       39 passed, 39 total
Time:        ~6s
```

> **Note:** The `console.error` line about `[Offline] Network fetch failed` is **expected** — it is the stale cache fallback test working correctly.

### Pass criteria
- All 6 suites pass
- All 39 tests pass
- No test failures or timeouts

### Verified result ✅
```
Test Suites: 6 passed, 6 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        6.708 s
```

---

## Test 4 — Stdio JSON-RPC (Raw MCP Protocol)

### What it does
Sends raw JSON-RPC messages directly to the server's stdin and reads responses from stdout — exactly how Claude Code communicates with MCP servers.

### Command (bash)
```bash
printf '%s\n%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"resolve-library-id","arguments":{"query":"LangChain Python"}}}' \
  | node "build/server.js" 2>/dev/null
```

### Expected output (id=1 — initialize)
```json
{
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": { "name": "ai-context-mcp", "version": "1.0.0" }
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

### Expected output (id=3 — resolve-library-id)
```json
{
  "result": {
    "content": [{
      "type": "text",
      "text": "{ \"id\": \"/langchain-ai/langchain\", \"name\": \"LangChain Python\", ... }"
    }]
  },
  "jsonrpc": "2.0",
  "id": 3
}
```

### Pass criteria
- `id=1` response contains `"name": "ai-context-mcp"`
- `id=3` response contains `"id": "/langchain-ai/langchain"`
- No error responses

### Verified result ✅
```json
{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"ai-context-mcp","version":"1.0.0"}},"jsonrpc":"2.0","id":1}
{"result":{"content":[{"type":"text","text":"{\n  \"id\": \"/langchain-ai/langchain\",\n  \"name\": \"LangChain Python\", ..."}]},"jsonrpc":"2.0","id":3}
```

---

## Test 5 — HTTP Transport

### Setup
```bash
# Start in HTTP mode
TRANSPORT=http PORT=3741 node build/server.js
# Expected startup log:
# AI Context MCP HTTP server running on port 3741
#   Health:    http://localhost:3741/health
#   Metrics:   http://localhost:3741/metrics
#   Libraries: http://localhost:3741/libraries
```

### Test 5a — Health endpoint
```bash
curl http://localhost:3741/health
```
**Expected:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime_seconds": 3,
  "library_count": 32,
  "categories": ["llm-provider-sdk", "agent-framework", "ml-framework", "inference-engine", "vector-database", "prompt-engineering"]
}
```
**Pass criteria:** `status == "ok"`, `library_count == 32`

### Test 5b — Metrics endpoint
```bash
curl http://localhost:3741/metrics
```
**Expected (Prometheus format):**
```
# HELP ai_context_uptime_seconds Server uptime in seconds
# TYPE ai_context_uptime_seconds gauge
ai_context_uptime_seconds 3

# HELP ai_context_library_count Number of libraries in registry
# TYPE ai_context_library_count gauge
ai_context_library_count 32
...
```
**Pass criteria:** Response is plain text, contains `ai_context_library_count 32`

### Test 5c — Libraries listing endpoint
```bash
curl http://localhost:3741/libraries
```
**Expected:**
```json
{
  "count": 32,
  "libraries": [
    { "id": "/openai/openai-python", "name": "OpenAI Python SDK", "category": "llm-provider-sdk", "language": "python" },
    ...
  ]
}
```
**Pass criteria:** `count == 32`

---

## Test 6 — Live MCP Tools (via Claude Code)

These are manual tests run through Claude Code with the MCP server enabled.
**Prerequisite:** `ai-context` is listed in `claude mcp list` and Claude Code has been restarted.

### Test 6a — resolve-library-id

**Prompt:**
```
Use the ai-context MCP to resolve the library ID for "Anthropic Python SDK"
```

**Expected MCP call:**
```
ai-context - resolve-library-id(query: "Anthropic Python SDK")
```

**Expected response contains:**
```json
{
  "id": "/anthropic/anthropic-sdk-python",
  "name": "Anthropic Python SDK",
  "repository": "https://github.com/anthropics/anthropic-sdk-python"
}
```

**Pass criteria:** Returns correct ID, correct GitHub URL with `anthropics` (not `anthropic`)

---

### Test 6b — query-docs (live GitHub fetch)

**Prompt:**
```
How do I use streaming with tool_use in the Anthropic Python SDK? Show me the exact code pattern.
```

**Expected MCP calls:**
```
ai-context - resolve-library-id(query: "Anthropic Python SDK")   → resolves library
ai-context - query-docs(libraryId: "/anthropic/anthropic-sdk-python", query: "streaming tool_use")
```

**Expected response snippet contains:**
```
TITLE: Streaming responses
VERSION: main
SOURCE: repository_docs
```

**Pass criteria:**
- `SOURCE: repository_docs` (not training data)
- `VERSION: main` or a pinned version tag
- Code example shows `client.messages.stream(...)` context manager
- Code example shows `stream.get_final_message()`

---

### Test 6c — detect-project-versions

**Prompt:**
```
Use the ai-context MCP detect-project-versions tool on my project at D:\Resume_updates\project ideas\ai-context-mcp
```

**Expected:** Lists detected npm packages from `package.json`, e.g.:
```json
{
  "ecosystem": "node",
  "detected": [
    { "name": "@modelcontextprotocol/sdk", "version": "^1.6.0" },
    { "name": "axios", "version": "^1.7.9" },
    ...
  ]
}
```

**Pass criteria:** At least 3 packages detected, ecosystem identified as `node`

---

### Test 6d — get-changelog-diff (breaking changes)

**Prompt:**
```
Use the ai-context MCP get-changelog-diff to show breaking changes in the Anthropic Python SDK between version 0.3.0 and 1.0.0
```

**Expected MCP call:**
```
ai-context - get-changelog-diff(libraryId: "/anthropic/anthropic-sdk-python", fromVersion: "0.3.0", toVersion: "1.0.0")
```

**Expected response:** Lists breaking changes parsed from `CHANGELOG.md` in the GitHub repo.

**Pass criteria:**
- At least 1 breaking change returned
- Content sourced from GitHub (not fabricated)

---

## Test 7 — Caching Behaviour

### Test 7a — L1 cache (in-memory, 5 min TTL)

Run `query-docs` for the same library twice in the same Claude session.

**First call:** Server logs show a network fetch to GitHub
**Second call (within 5 min):** No network fetch; response is instant

**Pass criteria:** Second response is faster; no outbound HTTP on second call

### Test 7b — Stale-While-Revalidate (offline mode)

The github-fetcher unit test (`tests/github-fetcher.test.ts` line 59) already verifies this:
- When the network fails and L2 cache has stale data → stale data is returned
- Server logs: `[Offline] Network fetch failed for {file}. Returning stale cached data.`

**Pass criteria:** Test `should return stale cache when network fails (offline mode)` passes ✅ (verified in Test 3)

---

## Test 8 — Known Bug Regression Checks

These are bugs found and fixed during development. Each has a test that would catch regression.

| Bug | Regression test | How to verify |
|---|---|---|
| `libraries.json` not copied to `build/` after `tsc` | Build script now includes copy step | Run `npm run build` → check `build/registry/libraries.json` exists |
| Anthropic GitHub org typo: `anthropic` → `anthropics` | Registry entry line 48 | `grep anthropics build/registry/libraries.json` → should print the correct URL |
| Anthropic `docsPath: "docs/"` (dir doesn't exist) | Registry entry line 49 | `grep '"docsPath": ""' build/registry/libraries.json` for Anthropic entry |
| L1 cache pollution between Jest tests | Unique lib IDs per test | `npm test` → all 6 github-fetcher tests pass |
| Jest couldn't find `describe`/`expect` globals | `jest.config.js` transform override | `npm test` → no "Cannot find name 'describe'" errors |

### Quick regression check command
```bash
# Run this after any change to registry or build pipeline
npm run build && npm run validate-registry && npm test
```
**Expected:** All three pass with no errors.

---

## Appendix — Environment Setup

```bash
# Verify Node.js version (requires 18+)
node --version    # v24.13.1 verified

# Verify MCP server is registered in Claude Code
claude mcp list   # should show: ai-context (stdio)

# Full rebuild from scratch
npm install
npm run build
npm run validate-registry
npm test
```

### Environment variables (optional)
| Variable | Default | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | none | Avoids GitHub rate limits (60 → 5000 req/hr) |
| `TRANSPORT` | `stdio` | Set to `http` for HTTP mode |
| `PORT` | `3000` | HTTP server port (only used when `TRANSPORT=http`) |
