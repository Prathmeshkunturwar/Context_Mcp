# Frequently Asked Questions

## General

### What is an MCP server?
MCP (Model Context Protocol) is an open standard that lets AI clients like Claude, Cursor, and others connect to external tools and data sources. AI Context MCP is a server that exposes documentation-fetching tools over this protocol.

### Does this send my code to any external service?
No. The server runs entirely on your machine. It only calls the GitHub API (to fetch public documentation) and optionally NPM/PyPI (to check versions). No telemetry, no logging of your prompts.

### Does it work offline?
After the first fetch, all docs are cached in a local SQLite database at `.cache/ai-context-cache.db`. Subsequent queries for the same library version are served from cache with no network call.

### What's the difference between stdio and HTTP transport?
- **stdio** (default): The MCP server communicates via stdin/stdout. This is what Claude Code and Claude Desktop use.
- **HTTP** (`TRANSPORT=http`): Starts an Express server on port 3000. Useful for testing with `curl` or integrating into custom pipelines.

---

## Setup & Installation

### Do I need a GitHub token?
It's strongly recommended. Without one, GitHub limits you to 60 API requests per hour per IP. With a token (no scopes needed), you get 5,000/hr. [Create one here](https://github.com/settings/tokens).

### Why does the first start take so long?
The semantic ranker downloads the `all-MiniLM-L6-v2` model (~25MB) from HuggingFace on first run. This is cached locally and never downloaded again.

### Can I use this with Cursor/VS Code/Windsurf?
Yes — any MCP-compatible client works. Add the same config block to your client's MCP settings file.

### Can I run multiple MCP servers at once?
Yes. Claude Code and Claude Desktop both support multiple entries in `mcpServers`. Just give each a unique key.

---

## Libraries & Registry

### How do I add a library that's not in the registry?
Run `npm run add-library` for an interactive prompt, or manually add an entry to `src/registry/libraries.json`. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full schema.

### Does it support private GitHub repositories?
Yes, if you provide a `GITHUB_TOKEN` with `repo` scope for private repos.

### What if a library's docs aren't on GitHub?
The current fetcher targets GitHub-hosted docs. PyPI and HuggingFace sources are supported for version detection. Contributions adding other sources (e.g., official doc sites) are welcome.

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [ADVANCED_USAGE.md](ADVANCED_USAGE.md).
