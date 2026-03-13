import { DocChunk } from './snippet-extractor';
export declare class SemanticRanker {
    private extractor;
    private modelName;
    private warmupPromise;
    constructor();
    /**
     * Ensures the model is initialized. On first call downloads ~22MB once,
     * subsequent calls resolve instantly from the cached pipeline.
     */
    private initModel;
    /**
     * Calculates the vector embedding array for a given text string.
     */
    private getVector;
    /**
     * Ranks an array of chunks strictly by their semantic cosine similarity to the query.
     */
    rankChunks(query: string, chunks: DocChunk[]): Promise<DocChunk[]>;
    /**
     * Formats the final chunk for LLM ingestion, adding metadata.
     */
    formatForLLM(chunk: DocChunk, version: string): string;
}
