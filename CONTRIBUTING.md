# Contributing to AI Context MCP

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Run tests: `npm test`

## Development Workflow

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Validate registry
npm run validate-registry
```

### Adding a New Library

You can add libraries using the CLI tool:

```bash
npm run add-library
```

Or manually edit `src/registry/libraries.json`:

```json
{
  "id": "/owner/repo",
  "name": "Library Name",
  "aliases": ["lib", "library-name"],
  "category": "llm-provider-sdk",
  "language": "python",
  "repository": "https://github.com/owner/repo",
  "docsPath": "docs/",
  "changelogPath": "CHANGELOG.md",
  "versionSource": "pypi:library-name",
  "docSections": {
    "readme": "README.md"
  },
  "metadata": {
    "breakingVersions": ["2.0.0"],
    "relatedLibraries": []
  }
}
```

## Pull Request Process

1. **Create a branch**: `git checkout -b feature/my-feature`
2. **Make your changes**: Follow existing code style
3. **Add tests**: Ensure new features have test coverage
4. **Run the test suite**: `npm run build && npm test`
5. **Update documentation**: If adding features or changing behavior
6. **Commit**: Use conventional commit messages (see below)
7. **Push**: `git push origin feature/my-feature`
8. **Open a PR**: Fill out the PR template

## Commit Message Convention

We use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring
- `chore:` - Build process, dependencies, etc.
- `perf:` - Performance improvements

Examples:
```
feat: add support for HuggingFace Transformers
fix: resolve cache collision between libraries
docs: update README with new installation steps
```

## Code Style

- Use TypeScript with strict mode enabled
- Follow existing formatting patterns
- Add JSDoc comments for public APIs
- Keep functions focused and under 50 lines where possible
- Prefer explicit types over `any`

## Testing Guidelines

- All new features must have unit tests
- Tests should be in `tests/` directory with `.test.ts` suffix
- Use descriptive test names: `should do X when Y happens`
- Mock external dependencies (GitHub API, etc.)

## Reporting Issues

When reporting bugs, please include:

- Node.js version: `node --version`
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## Questions?

Feel free to open an issue for questions or join discussions.

Thank you for contributing!
