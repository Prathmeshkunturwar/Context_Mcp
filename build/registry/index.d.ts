export interface LibraryEntry {
    id: string;
    name: string;
    aliases: string[];
    category: string;
    language: string;
    repository: string;
    docsPath: string;
    changelogPath?: string;
    versionSource: string;
    docSections?: Record<string, string>;
    metadata?: Record<string, any>;
}
export declare class Registry {
    private libraries;
    constructor();
    reloadRegistry(): void;
    getAll(): LibraryEntry[];
    findLibrary(query: string): LibraryEntry | null;
}
