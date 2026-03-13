export interface PyPIVersionInfo {
    latestVersion: string;
    allVersions: string[];
}
export declare class PyPISource {
    /**
     * Fetches the latest version and all available versions for a PyPI package.
     */
    getVersionInfo(packageName: string): Promise<PyPIVersionInfo>;
    /**
     * Resolves the git tag for a given PyPI package version.
     * Convention: most Python packages use vX.Y.Z tags.
     */
    resolveGitTag(version: string): string;
    private compareSemver;
}
