import { DocChunk } from './snippet-extractor';

export interface ScoredChunk extends DocChunk {
    score: number;
}

// AI/ML domain keywords that signal high-value content
const API_PATTERNS = [
    /def\s+\w+\s*\(/,          // Python function definitions
    /class\s+\w+/,              // Class definitions
    /async\s+def\s+/,           // Async function definitions
    /\w+\.\w+\(/,               // Method calls
    /import\s+\w+/,             // Import statements
    /from\s+\w+\s+import/,      // Python from-imports
    /require\s*\(/,             // CommonJS require
    /export\s+(default\s+)?/,   // ES module exports
];

const FRAMEWORK_PATTERNS: Record<string, RegExp[]> = {
    'streaming': [/stream/i, /sse/i, /async.*iter/i, /chunk/i, /on_event/i],
    'tool_use': [/tool/i, /function.?call/i, /tool_choice/i, /tool_use/i],
    'embeddings': [/embed/i, /vector/i, /similarity/i, /cosine/i],
    'training': [/train/i, /finetune/i, /fine.?tune/i, /epoch/i, /loss/i, /optimizer/i],
    'agents': [/agent/i, /chain/i, /graph/i, /node/i, /state/i, /tool/i],
    'models': [/model/i, /pipeline/i, /tokenizer/i, /config/i, /pretrained/i],
    'deployment': [/serve/i, /deploy/i, /endpoint/i, /inference/i, /batch/i],
    'rag': [/retriev/i, /index/i, /embed/i, /chunk/i, /vector.?store/i, /document/i],
};

export class AIMLRanker {

    public rankChunks(query: string, chunks: DocChunk[]): ScoredChunk[] {
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const queryCategories = this.detectQueryCategories(query);

        return chunks.map(chunk => {
            let score = 0;
            const lowerContent = chunk.content.toLowerCase();
            const lowerTitle = chunk.title.toLowerCase();

            // 1. Keyword match in title (highest weight)
            for (const kw of keywords) {
                if (lowerTitle.includes(kw)) score += 3.0;
                if (lowerContent.includes(kw)) score += 1.0;
            }

            // 2. Code Density Score — runnable examples are more valuable
            const codeBlockMatches = chunk.content.match(/```[\s\S]*?```/g);
            if (codeBlockMatches) {
                score += Math.min(codeBlockMatches.length, 4) * 1.5;

                // Bonus for Python/TypeScript code blocks specifically
                for (const block of codeBlockMatches) {
                    if (/```(python|typescript|javascript|ts|js|py)/.test(block)) {
                        score += 0.5;
                    }
                }
            }

            // 3. API Signature detection
            for (const pattern of API_PATTERNS) {
                if (pattern.test(chunk.content)) {
                    score += 0.5;
                }
            }

            // 4. Framework-specific pattern matching
            for (const category of queryCategories) {
                const patterns = FRAMEWORK_PATTERNS[category];
                if (patterns) {
                    for (const pattern of patterns) {
                        if (pattern.test(lowerTitle)) score += 2.0;
                        if (pattern.test(lowerContent)) score += 0.5;
                    }
                }
            }

            // 5. Penalize very short or very long chunks
            const contentLen = chunk.content.length;
            if (contentLen < 50) score -= 2.0;
            if (contentLen > 10000) score -= 1.0;

            // 6. Boost sections with version/migration info
            if (/migrat|upgrad|breaking|deprecat|changelog/i.test(lowerTitle)) {
                score += 1.5;
            }

            // 7. Boost sections with complete examples (have both imports and function calls)
            if (/import\s/.test(chunk.content) && /\w+\.\w+\(/.test(chunk.content)) {
                score += 1.0;
            }

            return { ...chunk, score };
        })
            .sort((a, b) => b.score - a.score);
    }

    private detectQueryCategories(query: string): string[] {
        const lowerQuery = query.toLowerCase();
        const categories: string[] = [];

        for (const [category, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(lowerQuery)) {
                    categories.push(category);
                    break;
                }
            }
        }

        return categories;
    }

    public formatForLLM(chunk: ScoredChunk, version: string): string {
        return [
            `TITLE: ${chunk.title}`,
            `VERSION: ${version}`,
            `SOURCE: ${chunk.sourceFiles.join(', ')}`,
            `---`,
            chunk.content,
            `---`
        ].join('\n');
    }
}
