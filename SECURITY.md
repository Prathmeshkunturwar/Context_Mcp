# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do NOT open a public issue** for security vulnerabilities.

Instead, report privately via:

1. **Email**: [Add your security contact email]
2. **GitHub Security Advisory**: [Create a private advisory](https://github.com/prath/ai-context-mcp/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Time

- Acknowledgment: Within 48 hours
- Initial assessment: Within 5 business days
- Resolution: Depends on severity and complexity

## Security Best Practices

When using this MCP server:

### API Tokens

- Store `GITHUB_TOKEN` in environment variables, never in code
- Use fine-grained tokens with minimal permissions
- Rotate tokens regularly

### Network Security

- The HTTP transport (`TRANSPORT=http`) should not be exposed publicly without authentication
- Use stdio transport for local-only MCP clients
- HTTPS recommended for HTTP transport in production

### Data Privacy

- This tool fetches public documentation from GitHub
- No user code or data is sent to external services
- Caching is local (SQLite database)

## Security Features

- Input validation on all MCP tool arguments
- Path sanitization to prevent directory traversal
- No execution of fetched code
- Offline capability (no network required after caching)

## Known Limitations

- Cache files (`build/cache/`) contain fetched documentation - secure appropriately
- SQLite database contains cached content - ensure proper file permissions

## Dependencies

We regularly update dependencies for security patches. Run `npm audit` to check for vulnerabilities.

```bash
npm audit
npm audit fix
```

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.
