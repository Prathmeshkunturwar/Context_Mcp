"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangelogParser = void 0;
const axios_1 = __importDefault(require("axios"));
// Stage 1: Standard changelog file discovery paths
const CHANGELOG_PATHS = [
    'CHANGELOG.md',
    'CHANGES.md',
    'HISTORY.md',
    'CHANGELOG.rst',
    'NEWS.md',
    'RELEASES.md',
];
// Stage 3: Classification keyword rules
const CLASSIFICATION_RULES = [
    { category: 'BREAKING', patterns: [/\bbreak(?:ing)?\b/i, /\bremoved?\b/i, /\bincompat/i, /\bmigrat/i] },
    { category: 'DEPRECATED', patterns: [/\bdeprecate[ds]?\b/i, /\bwill be removed\b/i] },
    { category: 'SECURITY', patterns: [/\bsecur/i, /\bvulnerab/i, /\bCVE-/i, /\bexploit/i] },
    { category: 'ADDED', patterns: [/\badd(?:ed|s)?\b/i, /\bfeat(?:ure)?/i, /\bnew\b/i, /\bintroduc/i, /\bsupport/i] },
    { category: 'FIXED', patterns: [/\bfix(?:ed|es)?\b/i, /\bbug\b/i, /\bresolv/i, /\bpatch/i] },
    { category: 'CHANGED', patterns: [/\bchang/i, /\bupdat/i, /\brefactor/i, /\bimprov/i, /\boptimiz/i] },
];
class ChangelogParser {
    fetcher;
    constructor(fetcher) {
        this.fetcher = fetcher;
    }
    /**
     * Stage 1: Discover the changelog file. Try multiple standard paths.
     * Fallback: GitHub Releases API (for monorepos with no root CHANGELOG).
     */
    async discoverChangelog(library) {
        if (library.changelogPath) {
            try {
                return await this.fetcher.fetchDocString(library, library.changelogPath, 'main');
            }
            catch {
                // Fall through to discovery
            }
        }
        // Launch all HTTP fetches concurrently. Promise.any() will instantly resolve
        // with the FIRST successful 200 OK text blob, abandoning the other 404s.
        const promises = CHANGELOG_PATHS.map(filePath => this.fetcher.fetchDocString(library, filePath, 'main'));
        try {
            return await Promise.any(promises);
        }
        catch {
            // Final fallback: GitHub Releases API
            return await this.fetchFromGitHubReleases(library);
        }
    }
    /**
     * Fallback: Uses the GitHub Releases API to synthesize changelog text.
     * Works for monorepos (like langchainjs) that don't have a root CHANGELOG.
     */
    async fetchFromGitHubReleases(library) {
        const repoMatch = library.repository.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!repoMatch)
            throw new Error(`No changelog found for ${library.id}`);
        const [, owner, repo] = repoMatch;
        const headers = { 'Accept': 'application/vnd.github+json' };
        if (process.env.GITHUB_TOKEN)
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        const response = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=50`, { timeout: 8000, headers });
        if (!response.data || response.data.length === 0) {
            throw new Error(`No changelog found for ${library.id}`);
        }
        // Format releases as standard changelog markdown
        const lines = [];
        for (const release of response.data) {
            const version = release.tag_name.replace(/^v/, '');
            lines.push(`## ${version}`);
            if (release.body)
                lines.push(release.body.trim());
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Stage 2: Parse the changelog into version-delimited sections.
     * Handles: ## [X.Y.Z], ## X.Y.Z, # Version X.Y.Z, etc.
     */
    parseVersionSections(rawText) {
        const lines = rawText.split('\n');
        const sections = new Map();
        let currentVersion = null;
        const versionHeaderPattern = /^#{1,3}\s+\[?v?(\d+\.\d+(?:\.\d+)?(?:[.-]\w+)?)\]?/i;
        for (const line of lines) {
            const headerMatch = line.match(versionHeaderPattern);
            if (headerMatch) {
                currentVersion = headerMatch[1];
                if (!sections.has(currentVersion)) {
                    sections.set(currentVersion, []);
                }
                continue;
            }
            if (currentVersion) {
                const trimmed = line.trim();
                if (trimmed.length > 0) {
                    sections.get(currentVersion).push(trimmed);
                }
            }
        }
        return sections;
    }
    /**
     * Stage 3: Classify each changelog line into semantic categories.
     */
    classifyEntry(text) {
        for (const rule of CLASSIFICATION_RULES) {
            for (const pattern of rule.patterns) {
                if (pattern.test(text)) {
                    return rule.category;
                }
            }
        }
        return 'CHANGED';
    }
    getVersionRange(sections, fromVersion, toVersion) {
        const allVersions = Array.from(sections.keys());
        const fromIdx = allVersions.findIndex(v => v === fromVersion || v.startsWith(fromVersion));
        const toIdx = allVersions.findIndex(v => v === toVersion || v.startsWith(toVersion));
        if (toIdx === -1) {
            if (fromIdx === -1)
                return allVersions;
            return allVersions.slice(0, fromIdx);
        }
        if (fromIdx === -1) {
            return allVersions.slice(toIdx);
        }
        // Changelogs are typically newest-first
        const start = Math.min(toIdx, fromIdx);
        const end = Math.max(toIdx, fromIdx);
        return allVersions.slice(start, end);
    }
    /**
     * Full pipeline: Discover → Parse → Classify → Build diff
     */
    async getDiff(library, fromVersion, toVersion) {
        // Stage 1: Discover
        const rawChangelog = await this.discoverChangelog(library);
        // Stage 2: Parse into version sections
        const sections = this.parseVersionSections(rawChangelog);
        // Get versions in range
        const relevantVersions = this.getVersionRange(sections, fromVersion, toVersion);
        // Stage 3: Classify all entries in the range
        const entries = [];
        const relevantLines = [];
        for (const version of relevantVersions) {
            const lines = sections.get(version) || [];
            for (const line of lines) {
                const cleaned = line.replace(/^[-*•]\s*/, '').trim();
                if (cleaned.length < 5)
                    continue;
                const category = this.classifyEntry(cleaned);
                entries.push({ text: cleaned, category });
                relevantLines.push(line);
            }
        }
        // Build categorized arrays
        const breakingChanges = entries.filter(e => e.category === 'BREAKING' || e.category === 'REMOVED').map(e => e.text);
        const features = entries.filter(e => e.category === 'ADDED').map(e => e.text);
        const deprecations = entries.filter(e => e.category === 'DEPRECATED').map(e => e.text);
        const fixes = entries.filter(e => e.category === 'FIXED').map(e => e.text);
        const securityChanges = entries.filter(e => e.category === 'SECURITY').map(e => e.text);
        // Stage 4: Append curated migration notes from registry metadata
        if (library.metadata?.breakingVersions) {
            for (const bv of library.metadata.breakingVersions) {
                if (this.isVersionInRange(bv, fromVersion, toVersion)) {
                    breakingChanges.push(`CRITICAL: Version ${bv} is a known major breaking change boundary. Check official migration guide.`);
                }
            }
        }
        return {
            libraryId: library.id,
            fromVersion,
            toVersion,
            breakingChanges,
            features,
            deprecations,
            fixes,
            securityChanges,
            entries,
            rawText: relevantLines.join('\n'),
        };
    }
    isVersionInRange(version, from, to) {
        const vParts = version.split('.').map(Number);
        const fParts = from.split('.').map(Number);
        const tParts = to.split('.').map(Number);
        const v = vParts[0] * 10000 + (vParts[1] || 0) * 100 + (vParts[2] || 0);
        const f = fParts[0] * 10000 + (fParts[1] || 0) * 100 + (fParts[2] || 0);
        const t = tParts[0] * 10000 + (tParts[1] || 0) * 100 + (tParts[2] || 0);
        return v > f && v <= t;
    }
}
exports.ChangelogParser = ChangelogParser;
//# sourceMappingURL=changelog-diff.js.map