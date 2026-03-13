import { ChangelogDiff } from './changelog-diff';
export declare class CodeMigrator {
    /**
     * Analyzes a local file against breaking changes to propose migrations.
     * Note: In a real environment, you'd feed this straight to the LLM agent.
     * For this MCP tool, we will surface the relevant breaking changes that match the file's contents.
     */
    proposeMigrations(filePath: string, changelog: ChangelogDiff): string;
}
