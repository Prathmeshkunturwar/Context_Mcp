# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of AI Context MCP server
- Support for 32 AI/ML libraries with live documentation fetching
- MCP tools: resolve-library-id, query-docs, get-changelog-diff, get-source-signature, detect-project-versions, auto-migrate-codebase, suggest-skills
- 2-tier caching system (L1 in-memory, L2 SQLite)
- Semantic ranking using transformer embeddings
- Dual transport support (stdio and HTTP)
- Comprehensive test suite with 39+ tests

## [1.0.0] - 2026-02-24

### Added
- Core MCP server implementation with stdio transport
- HTTP transport with Express server
- Library registry with 32 supported libraries
- GitHub fetcher with caching and offline fallback
- Snippet extractor for documentation parsing
- Changelog parser for version diffs
- Source signature extraction
- Project version detection (package.json, requirements.txt)
- Auto-migration analysis for breaking changes
- Skills suggestion based on project dependencies
- Semantic ranking using `@xenova/transformers`
- SQLite caching layer for offline support
- Complete test coverage with Jest
- MIT License

### Supported Libraries

#### LLM Provider SDKs
- OpenAI Python & Node.js
- Anthropic Python & TypeScript
- Google Generative AI (Python & JS)
- Mistral AI, Cohere

#### Agent Frameworks
- LangChain Python & JS
- LangGraph, LlamaIndex
- CrewAI, Pydantic AI
- AutoGen, Letta (MemGPT)
- Vercel AI SDK

#### ML Frameworks
- PyTorch, HuggingFace ecosystem
- Pydantic

#### Inference Engines
- vLLM, llama.cpp, Ollama

#### Vector Databases
- ChromaDB, Qdrant, Pinecone, Weaviate

#### Web Frameworks
- React, Next.js, Vue, Nuxt
- Svelte, SvelteKit
- Express, Fastify, Hono

#### Database & ORM
- Prisma, Drizzle, TypeORM, Mongoose

#### API & Validation
- tRPC, Zod, GraphQL (Apollo)

#### Testing
- Vitest, Playwright

#### Infrastructure
- Supabase JS, Firebase JS

[Unreleased]: https://github.com/prath/ai-context-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/prath/ai-context-mcp/releases/tag/v1.0.0
