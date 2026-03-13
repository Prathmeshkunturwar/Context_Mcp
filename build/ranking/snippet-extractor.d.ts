export interface DocChunk {
    title: string;
    content: string;
    sourceFiles: string[];
}
export declare class SnippetExtractor {
    extractChunks(content: string, fileName: string): DocChunk[];
    private extractJupyterChunks;
}
