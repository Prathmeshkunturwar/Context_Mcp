import * as fs from 'fs';
import { CodeMigrator } from '../src/tools/auto-migrate';
import { ChangelogDiff } from '../src/tools/changelog-diff';

jest.mock('fs');

describe('CodeMigrator', () => {
    let migrator: CodeMigrator;

    beforeEach(() => {
        migrator = new CodeMigrator();
        jest.clearAllMocks();
    });

    const mockFileContent = `
import { LLMChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';

const chat = new ChatOpenAI({ temperature: 0 });
const chain = new LLMChain({ llm: chat, prompt });
`;

    const mockChangelog: ChangelogDiff = {
        libraryId: '/test',
        fromVersion: '0.1.0',
        toVersion: '0.2.0',
        breakingChanges: [
            'Removed LLMChain, use LCEL runnables instead.',
            'ChatOpenAI import moved from chat_models/openai to @langchain/openai',
            'Some other unrelated breaking change about SQLDatabase'
        ],
        features: [],
        deprecations: [],
        fixes: [],
        securityChanges: [],
        entries: [],
        rawText: ''
    };

    test('should propose migrations for matching code elements', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

        const proposal = migrator.proposeMigrations('/src/my-agent.ts', mockChangelog);

        // Should include standard warnings and the relevant matching lines
        expect(proposal).toContain('MIGRATION WARNING FOR: /src/my-agent.ts');

        // Match 1: LLMChain
        expect(proposal).toContain('Removed LLMChain');

        // Match 2: ChatOpenAI import path
        expect(proposal).toContain('ChatOpenAI import moved');

        // Should NOT include unrelated changelog entries
        expect(proposal).not.toContain('SQLDatabase');
    });

    test('should return safe message when no breaking changes affect file', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        // Code that doesn't use anything from the breaking changes
        (fs.readFileSync as jest.Mock).mockReturnValue(`
            function add(a: number, b: number) { return a + b; }
        `);

        const proposal = migrator.proposeMigrations('/src/math.ts', mockChangelog);

        expect(proposal).toContain('No obvious breaking changes detected');
    });

    test('should throw error on missing file', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        expect(() => {
            migrator.proposeMigrations('/src/missing.ts', mockChangelog);
        }).toThrow(/Local file not found/);
    });
});
