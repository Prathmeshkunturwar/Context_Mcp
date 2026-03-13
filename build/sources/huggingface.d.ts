export interface HFModelInfo {
    modelId: string;
    pipelineTag?: string;
    libraryName?: string;
    tags: string[];
}
export declare class HuggingFaceSource {
    private baseUrl;
    /**
     * Fetches model info from the HuggingFace Hub API.
     */
    getModelInfo(modelId: string): Promise<HFModelInfo>;
    /**
     * Fetches a raw file from a HuggingFace repository.
     */
    fetchRepoFile(repoId: string, filePath: string, revision?: string): Promise<string>;
    /**
     * Lists available versions/tags for a HuggingFace repo.
     */
    listTags(repoId: string): Promise<string[]>;
}
