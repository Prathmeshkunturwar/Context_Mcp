import { GithubFetcher } from '../sources/github';
import { LibraryEntry } from '../registry';
export declare class SourceSignatureExtractor {
    private fetcher;
    constructor(fetcher: GithubFetcher);
    /**
     * Extracts function/class signatures from raw source files.
     */
    getSignature(library: LibraryEntry, version: string, filePath: string, entityName: string): Promise<string>;
}
