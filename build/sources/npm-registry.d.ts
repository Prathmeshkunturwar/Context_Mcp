export interface NpmVersionInfo {
    latestVersion: string;
    allVersions: string[];
}
export declare class NpmRegistrySource {
    /**
     * Fetches the latest version and all available versions for an npm package.
     */
    getVersionInfo(packageName: string): Promise<NpmVersionInfo>;
    /**
     * Resolves the git tag for a given npm package version.
     * Convention: most JS packages use vX.Y.Z tags.
     */
    resolveGitTag(version: string): string;
    private compareSemver;
}
