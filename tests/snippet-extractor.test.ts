import { SnippetExtractor } from '../src/ranking/snippet-extractor';

describe('SnippetExtractor', () => {
    let extractor: SnippetExtractor;

    beforeAll(() => {
        extractor = new SnippetExtractor();
    });

    test('should extract chunks from markdown with ## headers', () => {
        const md = `# Title\nSome intro text\n\n## Section One\nContent of section one.\n\n## Section Two\nContent of section two.`;
        const chunks = extractor.extractChunks(md, 'test.md');

        expect(chunks.length).toBeGreaterThanOrEqual(2);
        expect(chunks.some(c => c.title === 'Section One')).toBe(true);
        expect(chunks.some(c => c.title === 'Section Two')).toBe(true);
    });

    test('should extract chunks from ### headers', () => {
        const md = `# Title\nIntro\n\n### Sub Section\nSub content here with enough text.`;
        const chunks = extractor.extractChunks(md, 'test.md');

        expect(chunks.some(c => c.title === 'Sub Section')).toBe(true);
    });

    test('should not split on headers inside code blocks', () => {
        const md = [
            '## Real Header',
            'Some content.',
            '```python',
            '# This is a comment, not a header',
            'def foo():',
            '    pass',
            '```',
            'More content after code.',
        ].join('\n');

        const chunks = extractor.extractChunks(md, 'test.md');
        expect(chunks.length).toBe(1);
        expect(chunks[0].title).toBe('Real Header');
        expect(chunks[0].content).toContain('# This is a comment');
    });

    test('should filter out chunks with very short content', () => {
        const md = `## Short\nHi\n\n## Long\nThis is a longer section with enough content to pass the filter.`;
        const chunks = extractor.extractChunks(md, 'test.md');

        expect(chunks.length).toBe(1);
        expect(chunks[0].title).toBe('Long');
    });

    test('should track source file name', () => {
        const md = `## Section\nContent that is long enough to keep.`;
        const chunks = extractor.extractChunks(md, 'docs/api.md');

        expect(chunks[0].sourceFiles).toEqual(['docs/api.md']);
    });

    test('should parse Jupyter Notebook JSON and extract code cells', () => {
        const mockNotebook = {
            cells: [
                {
                    cell_type: 'markdown',
                    source: ['# Title\n', 'Some text inside a markdown cell.']
                },
                {
                    cell_type: 'code',
                    source: [
                        'import pandas as pd\n',
                        'df = pd.DataFrame({"A": [1, 2]})\n',
                        'print(df)'
                    ]
                }
            ]
        };

        const chunks = extractor.extractChunks(JSON.stringify(mockNotebook), 'example.ipynb');

        // It should extract the 1 code cell, ignoring the markdown cell for this MVP
        expect(chunks.length).toBe(1);
        expect(chunks[0].title).toBe('example.ipynb - Cell 1 (Code)');
        expect(chunks[0].content).toContain('import pandas as pd');
        expect(chunks[0].sourceFiles).toEqual(['example.ipynb']);
    });

    test('should safely ignore malformed JSON for notebooks', () => {
        // Will throw an exception internally and catch it, returning empty chunk array
        const chunks = extractor.extractChunks('this is not { valid [ json', 'bad.ipynb');
        expect(chunks.length).toBe(0);
    });
});
