# Claude Code Setup Example

This example shows how to configure AI Context MCP with Claude Code.

## Step 1: Install the MCP Server

```bash
# Option 1: Global install (recommended)
npm install -g ai-context-mcp

# Option 2: Clone and build
git clone https://github.com/prath/ai-context-mcp.git
cd ai-context-mcp
npm install
npm run build
```

## Step 2: Create MCP Configuration

Create a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "ai-context": {
      "command": "node",
      "args": ["/absolute/path/to/ai-context-mcp/build/server.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### Finding the Path

If installed globally:
```bash
which ai-context-mcp
# or on Windows:
where ai-context-mcp
```

## Step 3: Verify Setup

```bash
# Check if MCP server is registered
claude mcp list

# You should see: ai-context (stdio)
```

## Step 4: Use in Claude Code

Now you can ask Claude questions like:

```
"What's the API signature for streaming in the OpenAI Python SDK?"
"Show me breaking changes in LangChain between version 0.1.0 and 0.3.0"
"What libraries are in my project and what versions are recommended?"
```

Claude will automatically call the MCP tools to fetch live documentation.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Recommended | GitHub PAT for higher rate limits (5,000/hr vs 60/hr) |
| `TRANSPORT` | Optional | Set to `http` for HTTP mode |
| `PORT` | Optional | HTTP server port (default: 3000) |

## HTTP Mode (Alternative)

For HTTP transport instead of stdio:

```json
{
  "mcpServers": {
    "ai-context": {
      "command": "node",
      "args": ["/path/to/build/server.js"],
      "env": {
        "TRANSPORT": "http",
        "PORT": "3741",
        "GITHUB_TOKEN": "ghp_your_token"
      }
    }
  }
}
```

## Testing

Test the MCP tools:

```
Use the ai-context MCP to:
1. Resolve the library ID for "LangChain Python"
2. Query documentation about "streaming responses"
3. Show me the changelog diff between versions 0.1.0 and 0.3.0
```
