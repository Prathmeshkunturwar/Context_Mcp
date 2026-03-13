"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const l1Cache = new Map();
const L1_TTL_MS = 5 * 60 * 1000; // 5 minutes
const L2_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PINNED_VERSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (pinned versions rarely change)
class GithubFetcher {
    cache;
    githubToken;
    constructor(cache) {
        this.cache = cache;
        this.githubToken = process.env.GITHUB_TOKEN;
    }
    getL1(key) {
        const entry = l1Cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            l1Cache.delete(key);
            return null;
        }
        return entry.content;
    }
    setL1(key, content) {
        l1Cache.set(key, { content, expiry: Date.now() + L1_TTL_MS });
        // LRU eviction: keep L1 cache under 500 entries
        if (l1Cache.size > 500) {
            const firstKey = l1Cache.keys().next().value;
            if (firstKey)
                l1Cache.delete(firstKey);
        }
    }
    parseRepoUrl(url) {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match)
            return null;
        return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    /**
     * Resolves the version string to a git ref suitable for raw.githubusercontent.com.
     * - "main" / "master" → pass through
     * - "1.45.0" → try "v1.45.0" tag first, then "1.45.0"
     */
    resolveGitRef(version) {
        if (version === 'main' || version === 'master' || version.startsWith('v')) {
            return [version];
        }
        // Try both vX.Y.Z and X.Y.Z tag formats
        return [`v${version}`, version, 'main'];
    }
    getHeaders() {
        const headers = {
            'Accept': 'application/vnd.github.v3.raw',
        };
        if (this.githubToken) {
            headers['Authorization'] = `token ${this.githubToken}`;
        }
        return headers;
    }
    async fetchDocString(library, filePath, version = 'main') {
        const cacheKey = `${library.id}::${version}::${filePath}`;
        // Check L1
        const l1 = this.getL1(cacheKey);
        if (l1)
            return l1;
        // Determine TTL based on whether this is a pinned version
        const isPinned = version !== 'main' && version !== 'master';
        const ttl = isPinned ? PINNED_VERSION_TTL_MS : L2_TTL_MS;
        // Check L2
        const l2Result = await this.cache.get(library.id, version, filePath, ttl);
        if (l2Result && !l2Result.isStale) {
            this.setL1(cacheKey, l2Result.content);
            return l2Result.content;
        }
        const repoInfo = this.parseRepoUrl(library.repository);
        if (!repoInfo)
            throw new Error("Invalid GitHub repository URL");
        // Try multiple git refs concurrently — first 200 OK wins
        const refs = this.resolveGitRef(version);
        const refAttempts = refs.map(async (ref) => {
            const url = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${ref}/${filePath}`;
            const response = await axios_1.default.get(url, {
                timeout: 8000,
                headers: this.getHeaders(),
            });
            const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            return content;
        });
        let content;
        try {
            content = await Promise.any(refAttempts);
        }
        catch (aggr) {
            // All refs failed — check stale cache fallback
            if (l2Result && l2Result.content) {
                console.error(`[Offline] Network fetch failed for ${filePath}. Returning stale cached data.`);
                return l2Result.content;
            }
            // Check if all failures were 404s
            const errors = aggr.errors || [];
            const all404 = errors.every((e) => e?.response?.status === 404);
            if (all404)
                throw new Error(`Document not found: ${filePath} at version ${version}`);
            throw new Error(`Failed to fetch from GitHub: ${errors[0]?.message || 'Unknown error'}`);
        }
        // Cache the successfully fetched content
        this.setL1(cacheKey, content);
        await this.cache.set(library.id, version, filePath, content);
        return content;
    }
}
exports.GithubFetcher = GithubFetcher;
//# sourceMappingURL=github.js.map