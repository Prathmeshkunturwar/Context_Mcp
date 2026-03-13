import * as dotenv from 'dotenv';
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Registry } from './registry';
import { GithubFetcher } from './sources/github';
import { SQLiteCache } from './cache/sqlite-store';
import { SemanticRanker } from './ranking/semantic-ranker';
import { SnippetExtractor } from './ranking/snippet-extractor';
import { VersionDetector } from './tools/version-detector';
import { ChangelogParser } from './tools/changelog-diff';
import { SourceSignatureExtractor } from './tools/source-signature';
import { CodeMigrator } from './tools/auto-migrate';
import { SkillsRecommender } from './tools/skills-suggest';
import { createHttpServer } from './http-transport';

const registry = new Registry();
const cache = new SQLiteCache();
const fetcher = new GithubFetcher(cache);
const extractor = new SnippetExtractor();
const ranker = new SemanticRanker();
const versionDetector = new VersionDetector();
const changelogParser = new ChangelogParser(fetcher);
const signatureExtractor = new SourceSignatureExtractor(fetcher);
const codeMigrator = new CodeMigrator();
const skillsRecommender = new SkillsRecommender(versionDetector, registry);

class AIContextServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'ai-context-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();

        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'resolve-library-id',
                    description: 'Resolves a natural language library name to its canonical AI Context MCP registry ID. Supports 32+ AI/ML libraries.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'The name or alias of the AI/ML library to look up (e.g., "LangChain", "OpenAI Python", "vllm", "chromadb").',
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'query-docs',
                    description: 'Fetches relevant, version-specific documentation for an AI/ML library. Returns ranked code examples and API references optimized for LLM consumption.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            libraryId: {
                                type: 'string',
                                description: 'The canonical ID of the library (e.g., "/openai/openai-python"). Use resolve-library-id first.',
                            },
                            query: {
                                type: 'string',
                                description: 'What you are trying to do (e.g., "how to use streaming chat completions").',
                            },
                            version: {
                                type: 'string',
                                description: 'Optional. Specific version to fetch (e.g. "1.45.0"). Defaults to "main" (latest).',
                            },
                            projectPath: {
                                type: 'string',
                                description: 'Optional. Path to local project to auto-detect installed SDK version from package.json/requirements.txt.',
                            }
                        },
                        required: ['libraryId', 'query'],
                    },
                },
                {
                    name: 'detect-project-versions',
                    description: 'Detects locally installed AI/ML SDK versions from package.json, requirements.txt, or Pipfile.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectPath: {
                                type: 'string',
                                description: 'Absolute path to the local project directory to scan.',
                            }
                        },
                        required: ['projectPath'],
                    }
                },
                {
                    name: 'get-changelog-diff',
                    description: 'Fetches and parses a CHANGELOG between two versions, returning structured breaking changes, new features, deprecations, fixes, and security changes.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            libraryId: {
                                type: 'string',
                                description: 'The canonical ID of the library (e.g., "/langchain-ai/langchain").',
                            },
                            fromVersion: {
                                type: 'string',
                                description: 'The version you are migrating from (e.g. "0.1.0").',
                            },
                            toVersion: {
                                type: 'string',
                                description: 'The version you are migrating to (e.g. "0.3.0").',
                            }
                        },
                        required: ['libraryId', 'fromVersion', 'toVersion'],
                    }
                },
                {
                    name: 'get-source-signature',
                    description: 'Fetches raw source code from a library repository and extracts function/class signatures and docstrings to guarantee accurate syntax usage.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            libraryId: { type: 'string', description: 'Canonical library ID (e.g. "/openai/openai-python")' },
                            version: { type: 'string', description: 'Version (defaults to "main")' },
                            filePath: { type: 'string', description: 'Path to source file in repo (e.g. "langchain/callbacks/manager.py")' },
                            entityName: { type: 'string', description: 'Name of function or class to extract (e.g. "BaseCallbackManager")' }
                        },
                        required: ['libraryId', 'filePath', 'entityName']
                    }
                },
                {
                    name: 'auto-migrate-codebase',
                    description: 'Analyzes a local file against breaking changes to propose migrations across a version upgrade.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            libraryId: { type: 'string' },
                            fromVersion: { type: 'string' },
                            toVersion: { type: 'string' },
                            filePath: { type: 'string', description: 'Absolute path to local project file to analyze.' }
                        },
                        required: ['libraryId', 'fromVersion', 'toVersion', 'filePath']
                    }
                },
                {
                    name: 'suggest-skills',
                    description: 'Analyzes a local project to automatically recommend AI Context MCP libraries to load based on installed SDK dependencies.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            projectPath: { type: 'string', description: 'Absolute path to project directory containing package.json or requirements.txt' }
                        },
                        required: ['projectPath']
                    }
                }
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            switch (request.params.name) {

                case 'resolve-library-id': {
                    const query = String(request.params.arguments?.query || '');
                    if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required');

                    const match = registry.findLibrary(query);
                    if (match) {
                        return {
                            content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    id: match.id,
                                    name: match.name,
                                    repository: match.repository,
                                    language: match.language,
                                    category: match.category,
                                    docSections: Object.keys(match.docSections || {}),
                                    versionSource: match.versionSource,
                                }, null, 2),
                            }],
                        };
                    }
                    return {
                        content: [{ type: 'text', text: `No matching library found for "${query}". Available libraries: ${registry.getAll().map(l => l.name).join(', ')}` }],
                    };
                }

                case 'query-docs': {
                    const libraryId = String(request.params.arguments?.libraryId || '');
                    const query = String(request.params.arguments?.query || '');
                    let version = String(request.params.arguments?.version || '');
                    const projectPath = request.params.arguments?.projectPath as string | undefined;

                    if (!libraryId || !query) {
                        throw new McpError(ErrorCode.InvalidParams, 'libraryId and query are required parameters.');
                    }

                    const lib = registry.getAll().find(l => l.id === libraryId);
                    if (!lib) {
                        throw new McpError(ErrorCode.InvalidParams, `Library ${libraryId} not found in registry.`);
                    }

                    // Auto-detect version from local project if no explicit version given
                    if (!version && projectPath) {
                        version = this.autoDetectVersion(lib, projectPath);
                    }
                    if (!version) version = 'main';

                    try {
                        let allDocs = '';
                        const fetchPaths = lib.docSections ? Object.values(lib.docSections) : ['README.md'];

                        // Fire all HTTP requests asynchronously
                        const promises = fetchPaths.map(docPath =>
                            fetcher.fetchDocString(lib, docPath, version)
                                .then(docRaw => `\n\n--- Source: ${docPath} ---\n\n` + docRaw)
                        );

                        // Wait for all to finish, catching individual 404 rejections gracefully
                        const results = await Promise.allSettled(promises);

                        for (const res of results) {
                            if (res.status === 'fulfilled') {
                                allDocs += res.value;
                            }
                        }

                        if (!allDocs) {
                            return { content: [{ type: 'text', text: `Failed to retrieve any documentation from the repository at version ${version}.` }] };
                        }

                        const chunks = extractor.extractChunks(allDocs, 'repository_docs');
                        const rankedChunks = await ranker.rankChunks(query, chunks);
                        const MAX_CHUNK_CHARS = 1500;
                        const topChunks = rankedChunks.slice(0, 5);
                        const responseText = topChunks.map(c => {
                            const capped = { ...c, content: c.content.substring(0, MAX_CHUNK_CHARS) };
                            return ranker.formatForLLM(capped, version);
                        }).join('\n\n');

                        return {
                            content: [{ type: 'text', text: responseText || 'No relevant documentation chunks found for your query.' }],
                        };

                    } catch (e: any) {
                        throw new McpError(ErrorCode.InternalError, `Doc fetch failed: ${e.message}`);
                    }
                }

                case 'detect-project-versions': {
                    const projectPath = String(request.params.arguments?.projectPath || '');
                    if (!projectPath) throw new McpError(ErrorCode.InvalidParams, 'projectPath is required');

                    const versions = versionDetector.detectVersions(projectPath);

                    // Cross-reference with registry to highlight known libraries
                    const registryLibs = registry.getAll();
                    const enriched: Record<string, { version: string, registryId?: string, name?: string }> = {};

                    for (const [pkg, ver] of Object.entries(versions)) {
                        const matchedLib = registryLibs.find(l => l.versionSource === pkg);
                        enriched[pkg] = {
                            version: ver,
                            registryId: matchedLib?.id,
                            name: matchedLib?.name,
                        };
                    }

                    return {
                        content: [{
                            type: 'text',
                            text: Object.keys(versions).length > 0
                                ? JSON.stringify(enriched, null, 2)
                                : `No package versions detected in ${projectPath}`
                        }]
                    };
                }

                case 'get-changelog-diff': {
                    const libraryId = String(request.params.arguments?.libraryId || '');
                    const fromVersion = String(request.params.arguments?.fromVersion || '');
                    const toVersion = String(request.params.arguments?.toVersion || '');

                    if (!libraryId || !fromVersion || !toVersion) {
                        throw new McpError(ErrorCode.InvalidParams, 'libraryId, fromVersion, and toVersion are required.');
                    }

                    const lib = registry.getAll().find(l => l.id === libraryId);
                    if (!lib) {
                        throw new McpError(ErrorCode.InvalidParams, `Library ${libraryId} not found.`);
                    }

                    try {
                        const diff = await changelogParser.getDiff(lib, fromVersion, toVersion);
                        const sections = [
                            `CHANGELOG DIFF FOR: ${lib.name} (${fromVersion} → ${toVersion})`,
                            '',
                            `== BREAKING CHANGES (${diff.breakingChanges.length}) ==`,
                            diff.breakingChanges.length ? diff.breakingChanges.map(c => `  - ${c}`).join('\n') : '  None found.',
                            '',
                            `== DEPRECATIONS (${diff.deprecations.length}) ==`,
                            diff.deprecations.length ? diff.deprecations.map(c => `  - ${c}`).join('\n') : '  None found.',
                            '',
                            `== NEW FEATURES (${diff.features.length}) ==`,
                            diff.features.length ? diff.features.map(c => `  - ${c}`).join('\n') : '  None found.',
                            '',
                            `== BUG FIXES (${diff.fixes.length}) ==`,
                            diff.fixes.length ? diff.fixes.map(c => `  - ${c}`).join('\n') : '  None found.',
                            '',
                            `== SECURITY (${diff.securityChanges.length}) ==`,
                            diff.securityChanges.length ? diff.securityChanges.map(c => `  - ${c}`).join('\n') : '  None found.',
                        ];

                        return {
                            content: [{ type: 'text', text: sections.join('\n') }]
                        };
                    } catch (e: any) {
                        throw new McpError(ErrorCode.InternalError, `Changelog fetch failed: ${e.message}`);
                    }
                }

                case 'get-source-signature': {
                    const libraryId = String(request.params.arguments?.libraryId || '');
                    let version = String(request.params.arguments?.version || '');
                    const filePath = String(request.params.arguments?.filePath || '');
                    const entityName = String(request.params.arguments?.entityName || '');

                    if (!libraryId || !filePath || !entityName) {
                        throw new McpError(ErrorCode.InvalidParams, 'libraryId, filePath, and entityName are required.');
                    }

                    const lib = registry.getAll().find(l => l.id === libraryId);
                    if (!lib) throw new McpError(ErrorCode.InvalidParams, `Library ${libraryId} not found.`);

                    if (!version) version = 'main'; // default

                    try {
                        const signature = await signatureExtractor.getSignature(lib, version, filePath, entityName);
                        return { content: [{ type: 'text', text: signature }] };
                    } catch (e: any) {
                        throw new McpError(ErrorCode.InternalError, `Signature extraction failed: ${e.message}`);
                    }
                }

                case 'auto-migrate-codebase': {
                    const libraryId = String(request.params.arguments?.libraryId || '');
                    const fromVersion = String(request.params.arguments?.fromVersion || '');
                    const toVersion = String(request.params.arguments?.toVersion || '');
                    const filePath = String(request.params.arguments?.filePath || '');

                    if (!libraryId || !fromVersion || !toVersion || !filePath) {
                        throw new McpError(ErrorCode.InvalidParams, 'libraryId, fromVersion, toVersion, and filePath are required.');
                    }

                    const lib = registry.getAll().find(l => l.id === libraryId);
                    if (!lib) throw new McpError(ErrorCode.InvalidParams, `Library ${libraryId} not found.`);

                    try {
                        const diff = await changelogParser.getDiff(lib, fromVersion, toVersion);
                        const proposal = codeMigrator.proposeMigrations(filePath, diff);
                        return { content: [{ type: 'text', text: proposal }] };
                    } catch (e: any) {
                        throw new McpError(ErrorCode.InternalError, `Migration analysis failed: ${e.message}`);
                    }
                }

                case 'suggest-skills': {
                    const projectPath = String(request.params.arguments?.projectPath || '');
                    if (!projectPath) throw new McpError(ErrorCode.InvalidParams, 'projectPath is required');

                    try {
                        const suggestion = skillsRecommender.suggestSkills(projectPath);
                        return { content: [{ type: 'text', text: suggestion }] };
                    } catch (e: any) {
                        throw new McpError(ErrorCode.InternalError, `Skill recommendation failed: ${e.message}`);
                    }
                }

                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
            }
        });
    }

    /**
     * Auto-detect the installed version of a library from local project files.
     * Maps the library's versionSource (e.g., "pypi:openai") to detected versions.
     */
    private autoDetectVersion(lib: import('./registry').LibraryEntry, projectPath: string): string {
        const detectedVersions = versionDetector.detectVersions(projectPath);
        const version = detectedVersions[lib.versionSource];
        if (version) {
            console.error(`[Version Pin] Auto-detected ${lib.name} version: ${version}`);
            return version;
        }
        return '';
    }

    async run() {
        const transportMode = process.env.TRANSPORT || 'stdio';

        if (transportMode === 'http') {
            const port = parseInt(process.env.PORT || '3000', 10);
            createHttpServer(this.server, registry, port);
        } else {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.error('AI Context MCP server running on stdio');
        }
    }
}

const server = new AIContextServer();
server.run().catch(console.error);
