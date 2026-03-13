import axios from 'axios';

export interface NpmVersionInfo {
    latestVersion: string;
    allVersions: string[];
}

export class NpmRegistrySource {
    /**
     * Fetches the latest version and all available versions for an npm package.
     */
    public async getVersionInfo(packageName: string): Promise<NpmVersionInfo> {
        const url = `https://registry.npmjs.org/${packageName}`;

        try {
            const response = await axios.get(url, {
                timeout: 5000,
                headers: { 'Accept': 'application/json' },
            });
            const data = response.data;

            const latestVersion = data['dist-tags']?.latest || '';
            const allVersions = Object.keys(data.versions || {})
                .filter(v => !v.includes('dev') && !v.includes('rc') && !v.includes('alpha') && !v.includes('beta'))
                .sort(this.compareSemver);

            return { latestVersion, allVersions };
        } catch (e: any) {
            if (e.response?.status === 404) {
                throw new Error(`npm package not found: ${packageName}`);
            }
            throw new Error(`Failed to fetch from npm registry: ${e.message}`);
        }
    }

    /**
     * Resolves the git tag for a given npm package version.
     * Convention: most JS packages use vX.Y.Z tags.
     */
    public resolveGitTag(version: string): string {
        if (version.startsWith('v')) return version;
        return `v${version}`;
    }

    private compareSemver(a: string, b: string): number {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na !== nb) return na - nb;
        }
        return 0;
    }
}
