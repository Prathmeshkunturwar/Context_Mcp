# MCP Tool Usage Examples

This document shows example usage for each MCP tool in AI Context MCP.

---

## resolve-library-id

Maps natural language queries to registry library IDs.

### Example 1: Basic resolution

**Input:**
```json
{
  "query": "LangChain Python"
}
```

**Output:**
```json
{
  "id": "/langchain-ai/langchain",
  "name": "LangChain Python",
  "aliases": ["langchain", "langchain-python"],
  "category": "agent-framework",
  "language": "python",
  "repository": "https://github.com/langchain-ai/langchain"
}
```

### Example 2: Alias resolution

**Input:**
```json
{
  "query": "openai node"
}
```

**Output:**
```json
{
  "id": "/openai/openai-node",
  "name": "OpenAI Node.js SDK",
  "aliases": ["openai", "openai-node", "openai-nodejs"]
}
```

---

## query-docs

Fetches version-pinned documentation snippets.

### Example 1: Get streaming documentation

**Input:**
```json
{
  "libraryId": "/openai/openai-python",
  "query": "streaming responses",
  "version": "1.0.0"
}
```

**Output:**
```
TITLE: Streaming responses
VERSION: main
SOURCE: repository_docs

OpenAI Python SDK supports streaming responses using the stream parameter:

from openai import OpenAI

client = OpenAI()

stream = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

### Example 2: Get tool use documentation

**Input:**
```json
{
  "libraryId": "/anthropic/anthropic-sdk-python",
  "query": "tool_use streaming",
  "version": "main"
}
```

---

## get-changelog-diff

Shows breaking changes and new features between versions.

### Example: Check breaking changes

**Input:**
```json
{
  "libraryId": "/langchain-ai/langchainjs",
  "fromVersion": "0.1.0",
  "toVersion": "0.3.0"
}
```

**Output:**
```
CHANGELOG DIFF: /langchain-ai/langchainjs (0.1.0 → 0.3.0)

## BREAKING CHANGES (7)

- Removed deprecated Chain class in favor of RunnableSequence
- Changed retriever interface to require getRelevantDocuments method
- Updated OpenAI integration to use v1 API by default
- Removed legacy LLM class (use ChatOpenAI instead)
- Changed callback handler interface for streaming
- Updated vectorstore similarity search return format
- Removed deprecated document loader classes

## NEW FEATURES (12)

- Added RunnableSequence for composable chains
- Added output parsers for structured output
- Added streaming support for all chat models
- Added memory integration with Runnable
- Added agent framework improvements
- Added tool calling support
- Added new retriever types (MultiQuery, etc.)
- Added document transformers
- Added text splitters
- Added new vectorstores (Pinecone, Weaviate, etc.)
- Added caching support
- Added tracing integration
```

---

## get-source-signature

Extracts type/function signatures from source code.

### Example: Get RunnableSequence signature

**Input:**
```json
{
  "libraryId": "/langchain-ai/langchainjs",
  "filePath": "langchain-core/src/runnables/base.ts",
  "entityName": "RunnableSequence"
}
```

**Output:**
```typescript
export type RunnableSequenceFields<RunInput, RunOutput> = {
  first: Runnable<RunInput, any>;
  middle?: Runnable<any, any>[];
  last: Runnable<any, RunOutput>;
  name?: string;
};

export class RunnableSequence<RunInput, RunOutput> extends Runnable<
  RunInput,
  RunOutput
> {
  static from<RunInput, RunOutput>(
    [
      first,
      ...runnables,
    ]: [
      RunnableLike<RunInput>,
      ...RunnableLike[],
      RunnableLike<RunOutput>,
    ],
    options?: RunnableConfig
  ): RunnableSequence<RunInput, RunOutput>;
}
```

---

## detect-project-versions

Scans your project for library versions.

### Example 1: Node.js project

**Input:**
```json
{
  "projectPath": "./my-project"
}
```

**Output:**
```json
{
  "ecosystem": "node",
  "detected": [
    { "name": "langchain", "version": "^0.1.0" },
    { "name": "@langchain/openai", "version": "^0.0.1" },
    { "name": "openai", "version": "^4.0.0" }
  ]
}
```

### Example 2: Python project

**Input:**
```json
{
  "projectPath": "./python-project"
}
```

**Output:**
```json
{
  "ecosystem": "python",
  "detected": [
    { "name": "anthropic", "version": "==0.20.0" },
    { "name": "langchain", "version": ">=0.1.0" }
  ]
}
```

---

## auto-migrate-codebase

Analyzes breaking changes and generates migration alerts.

### Example

**Input:**
```json
{
  "libraryId": "/langchain-ai/langchainjs",
  "projectPath": "./",
  "fromVersion": "0.1.0",
  "toVersion": "0.3.0"
}
```

**Output:**
```
MIGRATION ALERTS for /langchain-ai/langchainjs (0.1.0 → 0.3.0)

Files using deprecated APIs:

1. src/chains/chat.ts
   - Uses deprecated Chain class
   - Migration: Replace with RunnableSequence

2. src/retrievers/custom.ts
   - Implements old retriever interface
   - Migration: Add getRelevantDocuments method

3. src/models/legacy.ts
   - Uses deprecated LLM class
   - Migration: Use ChatOpenAI instead

Affected: 3 files
Breaking changes detected: 7
Recommended actions: 12
```

---

## suggest-skills

Recommends libraries based on your project dependencies.

### Example

**Input:**
```json
{
  "projectPath": "./my-project"
}
```

**Output:**
```json
{
  "suggestions": [
    {
      "libraryId": "/langchain-ai/langchainjs",
      "reason": "Project uses LangChain - you may want documentation for this"
    },
    {
      "libraryId": "/openai/openai-node",
      "reason": "Project depends on OpenAI SDK"
    },
    {
      "libraryId": "/weaviate/weaviate-python-client",
      "reason": "Found weaviate in dependencies"
    }
  ]
}
```

---

## Using Multiple Tools Together

Here's how Claude might chain these tools:

```
User: "I'm using LangChain Python 0.1.0 and want to upgrade to 0.3.0.
       What breaking changes should I worry about?"

Claude:
1. resolve-library-id("LangChain Python") → /langchain-ai/langchain
2. get-changelog-diff(/langchain-ai/langchain, 0.1.0, 0.3.0) → breaking changes
3. auto-migrate-codebase(/langchain-ai/langchain, ./, 0.1.0, 0.3.0) → affected files

Result: Shows specific breaking changes and which project files need updating
```
