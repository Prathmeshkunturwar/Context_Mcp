import * as fs from 'fs';
import { ChangelogDiff } from './changelog-diff';

export class CodeMigrator {

    /**
     * Analyzes a local file against breaking changes to propose migrations.
     * Note: In a real environment, you'd feed this straight to the LLM agent.
     * For this MCP tool, we will surface the relevant breaking changes that match the file's contents.
     */
    public proposeMigrations(filePath: string, changelog: ChangelogDiff): string {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Local file not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const relevantBreakingChanges: string[] = [];

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
