import { DocChunk } from './snippet-extractor';
export interface ScoredChunk extends DocChunk {
    score: number;
}
export declare class AIMLRanker {
    rankChunks(query: string, chunks: DocChunk[]): ScoredChunk[];
    private detectQueryCategories;
    formatForLLM(chunk: ScoredChunk, version: string): string;
}
