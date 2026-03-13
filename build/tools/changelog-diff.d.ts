import { LibraryEntry } from '../registry';
import { GithubFetcher } from '../sources/github';
export interface ChangelogEntry {
    text: string;
    category: 'BREAKING' | 'DEPRECATED' | 'REMOVED' | 'CHANGED' | 'FIXED' | 'ADDED' | 'SECURITY';
}
export interface ChangelogDiff {
    libraryId: string;
    fromVersion: string;
    toVersion: string;
    breakingChanges: string[];
    features: string[];
    deprecations: string[];
    fixes: string[];
    securityChanges: string[];
    entries: ChangelogEntry[];
    rawText: string;
}
export declare class ChangelogParser {
    private fetcher;
    constructor(fetcher: GithubFetcher);
    /**
     * Stage 1: Discover the changelog file. Try multiple standard paths.
     * Fallback: GitHub Releases API (for monorepos with no root CHANGELOG).
     */
    private discoverChangelog;
    /**
     * Fallback: Uses the GitHub Releases API to synthesize changelog text.
     * Works for monorepos (like langchainjs) that don't have a root CHANGELOG.
     */
    private fetchFromGitHubReleases;
    /**
     * Stage 2: Parse the changelog into version-delimited sections.
     * Handles: ## [X.Y.Z], ## X.Y.Z, # Version X.Y.Z, etc.
     */
    private parseVersionSections;
    /**
     * Stage 3: Classify each changelog line into semantic categories.
     */
    private classifyEntry;
    private getVersionRange;
    /**
     * Full pipeline: Discover → Parse → Classify → Build diff
     */
    getDiff(library: LibraryEntry, fromVersion: string, toVersion: string): Promise<ChangelogDiff>;
    private isVersionInRange;
}
