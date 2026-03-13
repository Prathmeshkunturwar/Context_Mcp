# Claude Desktop Setup Example

This example shows how to configure AI Context MCP with Claude Desktop.

## Configuration Location

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

## Step 1: Edit Configuration File

Open or create the configuration file and add the MCP server:

```json
{
  "mcpServers": {
    "ai-context": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\ai-context-mcp\\build\\server.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

## Step 2: Restart Claude Desktop

After saving the configuration, completely quit and restart Claude Desktop.

## Step 3: Verify Installation

You should see a hammer icon 🔨 in the Claude Desktop input area. Click it to see the available tools.

## Example Usage

Once configured, you can ask Claude things like:

```
"Show me how to use streaming with the Anthropic Python SDK"
"What breaking changes are there in OpenAI Node.js v4?"
"Detect what AI libraries are in my project at /path/to/project"
```

## Troubleshooting

### Server not showing up

1. Check the path in the configuration is absolute
2. Verify the build exists: `ls build/server.js`
3. Check Claude Desktop logs for errors

### Rate limiting errors

Add a GitHub token to increase rate limits from 60 to 5,000 requests/hour:

```bash
# Create a token at https://github.com/settings/tokens
# No scopes needed for public repos
```

### Tools not appearing

- Restart Claude Desktop completely
- Check that `npm run build` succeeded
- Verify Node.js is installed and in PATH
