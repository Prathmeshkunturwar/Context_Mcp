"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceSource = void 0;
const axios_1 = __importDefault(require("axios"));
class HuggingFaceSource {
    baseUrl = 'https://huggingface.co/api';
    /**
     * Fetches model info from the HuggingFace Hub API.
     */
    async getModelInfo(modelId) {
        const url = `${this.baseUrl}/models/${modelId}`;
        try {
            const response = await axios_1.default.get(url, { timeout: 5000 });
            const data = response.data;
            return {
                modelId: data.modelId || modelId,
                pipelineTag: data.pipeline_tag,
                libraryName: data.library_name,
                tags: data.tags || [],
            };
        }
        catch (e) {
            if (e.response?.status === 404) {
                throw new Error(`HuggingFace model not found: ${modelId}`);
            }
            throw new Error(`Failed to fetch from HuggingFace Hub: ${e.message}`);
        }
    }
    /**
     * Fetches a raw file from a HuggingFace repository.
     */
    async fetchRepoFile(repoId, filePath, revision = 'main') {
        const url = `https://huggingface.co/${repoId}/resolve/${revision}/${filePath}`;
        try {
            const response = await axios_1.default.get(url, {
                timeout: 8000,
                headers: { 'Accept': 'text/plain' },
            });
            return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        }
        catch (e) {
            if (e.response?.status === 404) {
                throw new Error(`File not found: ${filePath} in ${repoId} at ${revision}`);
            }
            throw new Error(`Failed to fetch from HuggingFace: ${e.message}`);
        }
    }
    /**
     * Lists available versions/tags for a HuggingFace repo.
     */
    async listTags(repoId) {
        const url = `${this.baseUrl}/models/${repoId}/refs`;
        try {
            const response = await axios_1.default.get(url, { timeout: 5000 });
            const tags = response.data?.tags || [];
            return tags.map((t) => t.name || t);
        }
        catch {
            return [];
        }
    }
}
exports.HuggingFaceSource = HuggingFaceSource;
//# sourceMappingURL=huggingface.js.map