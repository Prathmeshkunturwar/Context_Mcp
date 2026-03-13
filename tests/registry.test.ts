import { Registry } from '../src/registry';
import { validateRegistry } from '../src/registry/schema';
import * as path from 'path';

describe('Registry', () => {
    let registry: Registry;

    beforeAll(() => {
        registry = new Registry();
    });

    test('should load at least 32 libraries', () => {
        expect(registry.getAll().length).toBeGreaterThanOrEqual(32);
    });

    test('should resolve "openai" to OpenAI Python SDK', () => {
        const lib = registry.findLibrary('openai');
        expect(lib).not.toBeNull();
        expect(lib!.id).toBe('/openai/openai-python');
    });

    test('should resolve aliases case-insensitively', () => {
        const lib = registry.findLibrary('Claude SDK');
        expect(lib).not.toBeNull();
        expect(lib!.id).toBe('/anthropic/anthropic-sdk-python');
    });

    test('should resolve by exact ID', () => {
        const lib = registry.findLibrary('/langchain-ai/langchain');
        expect(lib).not.toBeNull();
        expect(lib!.name).toBe('LangChain Python');
    });

    test('should return null for unknown library', () => {
        const lib = registry.findLibrary('nonexistent-library-xyz');
        expect(lib).toBeNull();
    });

    test('should resolve vector database libraries', () => {
        const chroma = registry.findLibrary('chromadb');
        expect(chroma).not.toBeNull();
        expect(chroma!.category).toBe('vector-database');

        const pinecone = registry.findLibrary('pinecone');
        expect(pinecone).not.toBeNull();
    });

    test('should resolve inference engines', () => {
        const vllm = registry.findLibrary('vllm');
        expect(vllm).not.toBeNull();
        expect(vllm!.category).toBe('inference-engine');
    });

    test('should resolve HuggingFace ecosystem', () => {
        const transformers = registry.findLibrary('transformers');
        expect(transformers).not.toBeNull();
        expect(transformers!.id).toBe('/huggingface/transformers');

        const diffusers = registry.findLibrary('diffusers');
        expect(diffusers).not.toBeNull();
    });

    test('every library should have required fields', () => {
        for (const lib of registry.getAll()) {
            expect(lib.id).toBeTruthy();
            expect(lib.id.startsWith('/')).toBe(true);
            expect(lib.name).toBeTruthy();
            expect(lib.aliases.length).toBeGreaterThan(0);
            expect(lib.category).toBeTruthy();
            expect(lib.language).toBeTruthy();
            expect(lib.repository).toContain('github.com');
            expect(lib.versionSource).toBeTruthy();
        }
    });

    test('no duplicate IDs', () => {
        const ids = registry.getAll().map(l => l.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });
});

describe('Registry Schema Validation', () => {
    test('should pass validation for current registry', () => {
        const registryPath = path.join(__dirname, '../src/registry/libraries.json');
        const result = validateRegistry(registryPath);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.libraryCount).toBeGreaterThanOrEqual(32);
    });
});
