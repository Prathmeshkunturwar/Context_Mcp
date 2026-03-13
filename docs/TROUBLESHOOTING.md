# Troubleshooting Guide

## Installation Issues

### `npm install -g ai-context-mcp` fails with permission error
Run with `sudo` on Linux/macOS, or configure npm to use a user-writable prefix:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g ai-context-mcp
```

### `Cannot find module 'better-sqlite3'` or native module errors
Rebuild native modules for your current Node.js version:
```bash
npm rebuild sqlite3
```

---

## Startup Issues

### Server starts but Claude doesn't see any tools
1. Verify your config JSON is valid (use [jsonlint.com](https://jsonlint.com))
2. Fully restart Claude Desktop / Claude Code after editing the config
3. Check Claude's MCP logs (Help → Developer Console → MCP tab)
4. Make sure the path to `build/server.js` is an absolute path, not relative

### `Error: Cannot find module './build/server.js'`
The TypeScript hasn't been compiled yet:
```bash
npm run build
```

### Server hangs on startup for 30–60 seconds
This is the MiniLM model downloading on first run. It's a one-time ~25MB download. Check your internet connection if it times out.

---

## Runtime / API Issues

### GitHub 403 Forbidden / "rate limit exceeded"
You've hit the unauthenticated limit (60 req/hr). Add a GitHub token:
```bash
# In your env or .env file
GITHUB_TOKEN=ghp_your_token_here
```
[Create a token here](https://github.com/settings/tokens) — read-only public repos needs no scopes.

### `query-docs` returns results from the wrong version
The version you specified may not exist in the registry's version source. Use `detect-project-versions` first to confirm the exact version string, then pass that to `query-docs`.

### Docs returned seem outdated / stale
The cache TTL defaults to 24 hours. To force a fresh fetch:
```bash
rm -f .cache/ai-context-cache.db
```
Or set `CACHE_TTL_HOURS=0` to disable caching entirely (not recommended for production use).

### `get-changelog-diff` returns empty results
The library's changelog may use a non-standard format. Check `changelogPath` in `src/registry/libraries.json` for that library, and make sure the file exists in the GitHub repo.

---

## Performance Issues

### Queries are slow (>5 seconds)
- First query per library per session fetches from GitHub — subsequent ones hit cache
- If consistently slow, check your `GITHUB_TOKEN` is set (unauthenticated calls have lower priority)
- For bulk queries, consider running the HTTP transport and batching requests

### High memory usage
The `@xenova/transformers` model loads into memory on first use. This is expected (~200MB RAM). It stays loaded for the session lifetime. If memory is tight, you can disable semantic ranking by using the `AI_RANKER=basic` env flag (falls back to keyword matching).

---

## Common Error Messages

| Error | Cause | Fix |
|---|---|---|
| `McpError: Library not found` | Library ID doesn't match registry | Use `resolve-library-id` first |
| `AxiosError: 401` | Invalid GitHub token | Check token hasn't expired |
| `SQLITE_CANTOPEN` | Cache dir doesn't exist | `mkdir -p .cache` |
| `ENOENT: build/server.js` | Not built yet | `npm run build` |
| `TypeError: fetch is not a function` | Node.js < 18 | Upgrade to Node 18+ |

---

## Still Stuck?

[Open an issue](https://github.com/Prathmeshkunturwar/Context_Mcp/issues) with:
- Your OS and Node.js version (`node -v`)
- The full error message / stack trace
- Your MCP config (redact your token)
