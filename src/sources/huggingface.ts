import axios from 'axios';

export interface HFModelInfo {
    modelId: string;
    pipelineTag?: string;
    libraryName?: string;
    tags: string[];
}

export class HuggingFaceSource {
    private baseUrl = 'https://huggingface.co/api';

    /**
     * Fetches model info from the HuggingFace Hub API.
     */
    public async getModelInfo(modelId: string): Promise<HFModelInfo> {
        const url = `${this.baseUrl}/models/${modelId}`;

        try {
            const response = await axios.get(url, { timeout: 5000 });
            const data = response.data;

            return {
                modelId: data.modelId || modelId,
                pipelineTag: data.pipeline_tag,
                libraryName: data.library_name,
                tags: data.tags || [],
            };
        } catch (e: any) {
            if (e.response?.status === 404) {
                throw new Error(`HuggingFace model not found: ${modelId}`);
            }
            throw new Error(`Failed to fetch from HuggingFace Hub: ${e.message}`);
        }
    }

    /**
     * Fetches a raw file from a HuggingFace repository.
     */
    public async fetchRepoFile(repoId: string, filePath: string, revision: string = 'main'): Promise<string> {
        const url = `https://huggingface.co/${repoId}/resolve/${revision}/${filePath}`;

        try {
            const response = await axios.get(url, {
                timeout: 8000,
                headers: { 'Accept': 'text/plain' },
            });
            return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        } catch (e: any) {
            if (e.response?.status === 404) {
                throw new Error(`File not found: ${filePath} in ${repoId} at ${revision}`);
            }
            throw new Error(`Failed to fetch from HuggingFace: ${e.message}`);
        }
    }

    /**
     * Lists available versions/tags for a HuggingFace repo.
     */
    public async listTags(repoId: string): Promise<string[]> {
        const url = `${this.baseUrl}/models/${repoId}/refs`;

        try {
            const response = await axios.get(url, { timeout: 5000 });
            const tags = response.data?.tags || [];
            return tags.map((t: any) => t.name || t);
        } catch {
            return [];
        }
    }
}
