import { SQLiteCache } from '../cache/sqlite-store';
import { LibraryEntry } from '../registry';
export declare class GithubFetcher {
    private cache;
    private githubToken;
    constructor(cache: SQLiteCache);
    private getL1;
    private setL1;
    private parseRepoUrl;
    /**
     * Resolves the version string to a git ref suitable for raw.githubusercontent.com.
     * - "main" / "master" → pass through
     * - "1.45.0" → try "v1.45.0" tag first, then "1.45.0"
     */
    private resolveGitRef;
    private getHeaders;
    fetchDocString(library: LibraryEntry, filePath: string, version?: string): Promise<string>;
}
