import { SourceSignatureExtractor } from '../src/tools/source-signature';

// Mock GithubFetcher
const mockFetcher = {
    fetchDocString: jest.fn(),
} as any;

describe('SourceSignatureExtractor', () => {
    let extractor: SourceSignatureExtractor;

    beforeEach(() => {
        extractor = new SourceSignatureExtractor(mockFetcher);
        jest.clearAllMocks();
    });

    const mockPythonCode = `
import os
import sys

def helper_method():
    pass

class MySuperCoolAgent:
    """
    This is an agent that does cool things.
    It takes a model name and a temperature.
    """
    def __init__(self, model_name: str, temperature: float = 0.5):
        self.model = model_name
        self.temp = temperature
        
    def run(self):
        print("Running")

def another_function():
    return True
`;

    const mockTypeScriptCode = `
import { Something } from 'somewhere';

export interface AgentConfig {
    name: string;
    temperature: number;
}

export class MySuperCoolAgent {
    /**
     * Agent constructor
     */
    constructor(private config: AgentConfig) {
        if (!config.name) {
            throw new Error("Name required");
        }
    }

    public execute(): void {
        console.log("Executing");
    }
}

export function helper() {}
`;

    test('should extract Python class signature', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(mockPythonCode);
        const lib = { id: '/test', language: 'python' } as any;

        const signature = await extractor.getSignature(lib, 'main', 'test.py', 'MySuperCoolAgent');
        expect(signature).toContain('class MySuperCoolAgent:');
        expect(signature).toContain('def __init__');
        expect(signature).toContain('self.model = model_name');

        // It should NOT contain the outer functions
        expect(signature).not.toContain('def helper_method()');
        expect(signature).not.toContain('def another_function()');
    });

    test('should extract TypeScript class signature with brackets', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(mockTypeScriptCode);
        const lib = { id: '/test', language: 'typescript' } as any;

        const signature = await extractor.getSignature(lib, 'main', 'test.ts', 'MySuperCoolAgent');
        expect(signature).toContain('export class MySuperCoolAgent {');
        expect(signature).toContain('constructor(private config: AgentConfig)');
        expect(signature).toContain('throw new Error("Name required");');

        // Ensure it stops properly
        expect(signature).not.toContain('export function helper()');
    });

    test('should throw error if entity not found', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(mockTypeScriptCode);
        const lib = { id: '/test', language: 'typescript' } as any;

        await expect(
            extractor.getSignature(lib, 'main', 'test.ts', 'NonExistentClass')
        ).rejects.toThrow(/Could not locate definition/);
    });
});
