import { AIMLRanker } from '../src/ranking/ai-ml-ranker';
import { DocChunk } from '../src/ranking/snippet-extractor';

describe('AIMLRanker', () => {
    let ranker: AIMLRanker;

    beforeAll(() => {
        ranker = new AIMLRanker();
    });

    test('should rank chunks with matching keywords higher', () => {
        const chunks: DocChunk[] = [
            { title: 'Installation', content: 'Run pip install openai to get started.', sourceFiles: ['README.md'] },
            { title: 'Streaming Responses', content: 'Use stream=True to enable streaming. Example:\n```python\nclient.chat.completions.create(stream=True)\n```', sourceFiles: ['streaming.md'] },
            { title: 'License', content: 'This project is MIT licensed. See LICENSE file.', sourceFiles: ['README.md'] },
        ];

        const ranked = ranker.rankChunks('how to stream responses', chunks);

        expect(ranked[0].title).toBe('Streaming Responses');
        expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    });

    test('should boost chunks with code blocks', () => {
        const chunks: DocChunk[] = [
            { title: 'API Reference', content: 'The API supports tool use for function calling.', sourceFiles: ['api.md'] },
            { title: 'Tool Use Example', content: 'Use tools:\n```python\nclient.chat.completions.create(\n    tools=[{"type": "function"}]\n)\n```', sourceFiles: ['tools.md'] },
        ];

        const ranked = ranker.rankChunks('tool use', chunks);
        expect(ranked[0].title).toBe('Tool Use Example');
    });

    test('should boost API signature content', () => {
        const chunks: DocChunk[] = [
            { title: 'Overview', content: 'This library provides chat completion functionality. It is very useful.', sourceFiles: ['readme.md'] },
            { title: 'API', content: 'def create_completion(model, messages, stream=False):\n    pass\n\nclass ChatCompletion:', sourceFiles: ['api.md'] },
        ];

        const ranked = ranker.rankChunks('chat completion', chunks);
        // API chunk should get signature bonus
        const apiChunk = ranked.find(c => c.title === 'API');
        expect(apiChunk!.score).toBeGreaterThan(0);
    });

    test('should format chunks for LLM correctly', () => {
        const chunk = {
            title: 'Streaming',
            content: 'Use stream=True',
            sourceFiles: ['streaming.md'],
            score: 5.0,
        };

        const formatted = ranker.formatForLLM(chunk, 'v1.45.0');
        expect(formatted).toContain('TITLE: Streaming');
        expect(formatted).toContain('VERSION: v1.45.0');
        expect(formatted).toContain('SOURCE: streaming.md');
        expect(formatted).toContain('Use stream=True');
    });

    test('should penalize very short chunks', () => {
        const chunks: DocChunk[] = [
            { title: 'Short', content: 'Tiny content here.', sourceFiles: ['a.md'] },
            { title: 'Long', content: 'This is a much longer section with detailed content about streaming responses and how to use them in production applications with proper error handling.', sourceFiles: ['b.md'] },
        ];

        const ranked = ranker.rankChunks('streaming', chunks);
        const shortChunk = ranked.find(c => c.title === 'Short')!;
        const longChunk = ranked.find(c => c.title === 'Long')!;
        expect(longChunk.score).toBeGreaterThan(shortChunk.score);
    });
});
