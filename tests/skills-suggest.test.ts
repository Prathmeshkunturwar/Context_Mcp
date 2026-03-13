import { SkillsRecommender } from '../src/tools/skills-suggest';
import { VersionDetector } from '../src/tools/version-detector';
import { Registry } from '../src/registry';

describe('SkillsRecommender', () => {
    let recommender: SkillsRecommender;
    let mockDetector: VersionDetector;
    let mockRegistry: Registry;

    beforeEach(() => {
        mockDetector = { detectVersions: jest.fn() } as any;
        mockRegistry = { getAll: jest.fn() } as any;
        recommender = new SkillsRecommender(mockDetector, mockRegistry);
    });

    test('should return suggestion strings mapped to installed SDKs', () => {
        (mockDetector.detectVersions as jest.Mock).mockReturnValue({
            'pypi:langchain': '0.1.0',
            'npm:react': '18.0.0'
        });

        (mockRegistry.getAll as jest.Mock).mockReturnValue([
            { id: '/langchain', name: 'LangChain', versionSource: 'pypi:langchain' },
            { id: '/openai', name: 'OpenAI', versionSource: 'pypi:openai' }
        ]);

        const suggestion = recommender.suggestSkills('/test/project');

        expect(suggestion).toContain('ACTIVE SKILL RECOMMENDATIONS');
        expect(suggestion).toContain('[LangChain v0.1.0]');
        expect(suggestion).toContain('libraryId: "/langchain"');

        // Ensure it doesn't recommend react (not in registry) or openai (not installed)
        expect(suggestion).not.toContain('React');
        expect(suggestion).not.toContain('OpenAI');
    });

    test('should handle completely empty installs', () => {
        (mockDetector.detectVersions as jest.Mock).mockReturnValue({});
        const suggestion = recommender.suggestSkills('/test');
        expect(suggestion).toContain('No dependencies detected');
    });

    test('should handle dependencies matching no registry libraries', () => {
        (mockDetector.detectVersions as jest.Mock).mockReturnValue({ 'npm:left-pad': '1.0.0' });
        (mockRegistry.getAll as jest.Mock).mockReturnValue([]);
        const suggestion = recommender.suggestSkills('/test');
        expect(suggestion).toContain('none currently map');
    });
});
