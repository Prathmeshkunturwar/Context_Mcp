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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeMigrator = void 0;
const fs = __importStar(require("fs"));
class CodeMigrator {
    /**
     * Analyzes a local file against breaking changes to propose migrations.
     * Note: In a real environment, you'd feed this straight to the LLM agent.
     * For this MCP tool, we will surface the relevant breaking changes that match the file's contents.
     */
    proposeMigrations(filePath, changelog) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Local file not found: ${filePath}`);
        }
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const relevantBreakingChanges = [];
        for (const breakingChange of changelog.breakingChanges) {
            // Very naive heuristic: extract words from breaking change, see if they exist in file
            const stopWords = ['removed', 'added', 'using', 'instead', 'deprecated', 'replaced', 'update', 'updated', 'support', 'default', 'which', 'their', 'there', 'where', 'when', 'method', 'function', 'class', 'module', 'package'];
            const words = breakingChange.split(/\s+/).filter(w => {
                const clean = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();
                return clean.length > 4 && !stopWords.includes(clean);
            });
            let matchCount = 0;
            for (const word of words) {
                // Strip punctuation
                const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                if (fileContent.includes(cleanWord)) {
                    matchCount++;
                }
            }
            // If finding multiple matching tokens, surface it
            if (matchCount >= 1) {
                relevantBreakingChanges.push(breakingChange);
            }
        }
        if (relevantBreakingChanges.length === 0) {
            return `No obvious breaking changes detected for code in ${filePath}. However, always review the full release notes.`;
        }
        return [
            `MIGRATION WARNING FOR: ${filePath}`,
            `The following BREAKING CHANGES likely impact this file during your upgrade from ${changelog.fromVersion} to ${changelog.toVersion}:`,
            '',
            ...relevantBreakingChanges.map(c => `🚨 ${c}`)
        ].join('\n');
    }
}
exports.CodeMigrator = CodeMigrator;
//# sourceMappingURL=auto-migrate.js.map