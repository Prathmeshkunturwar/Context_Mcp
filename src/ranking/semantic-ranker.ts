import { pipeline, env } from '@xenova/transformers';
import { DocChunk } from './snippet-extractor';

// Disable remote models if you want fully offline, but by default it downloads them once to cache
env.allowLocalModels = true;

/**
 * Computes the cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class SemanticRanker {
    private extractor: any;
    private modelName = 'Xenova/all-MiniLM-L6-v2';
    // Pre-warm promise: starts model loading immediately at server start
    private warmupPromise: Promise<void>;

    constructor() {
        this.extractor = null;
        // Fire-and-forget warm-up so the model is ready before first query
        this.warmupPromise = this.initModel().catch(() => { });
    }

    /**
     * Ensures the model is initialized. On first call downloads ~22MB once,
     * subsequent calls resolve instantly from the cached pipeline.
     */
    private async initModel() {
        if (!this.extractor) {
            this.extractor = await pipeline('feature-extraction', this.modelName);
        }
    }

    /**
     * Calculates the vector embedding array for a given text string.
     */
    private async getVector(text: string): Promise<number[]> {
        await this.initModel();
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    /**
     * Ranks an array of chunks strictly by their semantic cosine similarity to the query.
     */
    public async rankChunks(query: string, chunks: DocChunk[]): Promise<DocChunk[]> {
        if (chunks.length === 0) return [];

        // Pre-filter: rank only the top N longest/most content-rich chunks
        // to avoid embedding hundreds of tiny stubs on large docs
        const MAX_CHUNKS_TO_EMBED = 15;
        const candidates = chunks
            .filter(c => c.content.length > 50)
            .slice(0, MAX_CHUNKS_TO_EMBED);

        const queryVector = await this.getVector(query);

        const scoredChunks = await Promise.all(candidates.map(async (chunk) => {
            const textToEmbed = `${chunk.title}\n${chunk.content.substring(0, 500)}`;
            const chunkVector = await this.getVector(textToEmbed);
            const score = cosineSimilarity(queryVector, chunkVector);
            return { chunk, score };
        }));

        scoredChunks.sort((a, b) => b.score - a.score);
        return scoredChunks.map(sc => sc.chunk);
    }

    /**
     * Formats the final chunk for LLM ingestion, adding metadata.
     */
    public formatForLLM(chunk: DocChunk, version: string): string {
        const sourceUrl = chunk.sourceFiles.length > 0 ? chunk.sourceFiles[0] : 'Unknown File';
        return [
            `[FILE]: ${sourceUrl} | [VERSION]: ${version}`,
            `[SECTION]: ${chunk.title}`,
            `---`,
            chunk.content,
            `---`
        ].join('\n');
    }
}
