"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PyPISource = void 0;
const axios_1 = __importDefault(require("axios"));
class PyPISource {
    /**
     * Fetches the latest version and all available versions for a PyPI package.
     */
    async getVersionInfo(packageName) {
        const url = `https://pypi.org/pypi/${packageName}/json`;
        try {
            const response = await axios_1.default.get(url, { timeout: 5000 });
            const data = response.data;
            const latestVersion = data.info?.version || '';
            const allVersions = Object.keys(data.releases || {})
                .filter(v => !v.includes('dev') && !v.includes('rc') && !v.includes('alpha') && !v.includes('beta'))
                .sort(this.compareSemver);
            return { latestVersion, allVersions };
        }
        catch (e) {
            if (e.response?.status === 404) {
                throw new Error(`PyPI package not found: ${packageName}`);
            }
            throw new Error(`Failed to fetch from PyPI: ${e.message}`);
        }
    }
    /**
     * Resolves the git tag for a given PyPI package version.
     * Convention: most Python packages use vX.Y.Z tags.
     */
    resolveGitTag(version) {
        if (version.startsWith('v'))
            return version;
        return `v${version}`;
    }
    compareSemver(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na !== nb)
                return na - nb;
        }
        return 0;
    }
}
exports.PyPISource = PyPISource;
//# sourceMappingURL=pypi.js.map