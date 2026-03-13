"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceSignatureExtractor = void 0;
class SourceSignatureExtractor {
    fetcher;
    constructor(fetcher) {
        this.fetcher = fetcher;
    }
    /**
     * Extracts function/class signatures from raw source files.
     */
    async getSignature(library, version, filePath, entityName) {
        // Check registry sourcePaths first — these are pre-verified correct paths for this entity
        const sourcePaths = library.sourcePaths;
        let resolvedPath = (sourcePaths && sourcePaths[entityName]) || filePath;
        // For monorepos, auto-prefix packageRoot if the path doesn't already include it
        const meta = library.metadata;
        if (meta?.monorepo && meta?.packageRoot && !resolvedPath.startsWith(meta.packageRoot)) {
            resolvedPath = meta.packageRoot + resolvedPath;
        }
        const rawCode = await this.fetcher.fetchDocString(library, resolvedPath, version);
        const lines = rawCode.split('\n');
        const capturedLines = [];
        let capturing = false;
        let braceCount = 0;
        let parenCount = 0;
        // Extremely naive signature extractor for MVP
        for (const line of lines) {
            const hasEntity = line.includes(`def ${entityName}`) ||
                line.includes(`class ${entityName}`) ||
                line.includes(`function ${entityName}`) ||
                line.includes(`interface ${entityName}`) ||
                line.includes(`type ${entityName}`);
            if (hasEntity && !capturing) {
                capturing = true;
                capturedLines.push(line);
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                parenCount += (line.match(/\(/g) || []).length;
                parenCount -= (line.match(/\)/g) || []).length;
                continue;
            }
            if (capturing) {
                capturedLines.push(line);
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                parenCount += (line.match(/\(/g) || []).length;
                parenCount -= (line.match(/\)/g) || []).length;
                // Stop capturing when block brackets are closed (rough heuristic for TS/Python)
                if (braceCount <= 0 && parenCount <= 0 && capturedLines.length > 1) {
                    if (library.language === 'python') {
                        // Stop if we hit an unindented line with content (signaling a new top-level block)
                        // Note: The first line captured is unindented, but `capturedLines.length > 1` protects it
                        if (line.trim() !== '' && !line.startsWith(' ') && !line.startsWith('\t') && !line.startsWith(')')) {
                            capturedLines.pop(); // Remove the line that broke the indentation
                            break;
                        }
                    }
                    if (library.language === 'typescript' && braceCount <= 0) {
                        break;
                    }
                }
                // Hard cutoff to prevent runaway
                if (capturedLines.length > 100)
                    break;
            }
        }
        if (capturedLines.length === 0) {
            throw new Error(`Could not locate definition for '${entityName}' in ${filePath}`);
        }
        return capturedLines.join('\n');
    }
}
exports.SourceSignatureExtractor = SourceSignatureExtractor;
//# sourceMappingURL=source-signature.js.map