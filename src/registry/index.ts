import * as fs from 'fs';
import * as path from 'path';

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

export class Registry {
    private libraries: LibraryEntry[] = [];

    constructor() {
        this.reloadRegistry();
    }

    public reloadRegistry() {
        const registryPath = path.join(__dirname, 'libraries.json');
        try {
            if (fs.existsSync(registryPath)) {
                const data = fs.readFileSync(registryPath, 'utf8');
                this.libraries = JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load libraries backend', e);
        }
    }

    public getAll(): LibraryEntry[] {
        return this.libraries;
    }

    public findLibrary(query: string): LibraryEntry | null {
        const lowerQuery = query.toLowerCase();

        // Exact ID match
        let match = this.libraries.find(l => l.id === lowerQuery);
        if (match) return match;

        // Name match
        match = this.libraries.find(l => l.name.toLowerCase().includes(lowerQuery));
        if (match) return match;

        // Alias find
        match = this.libraries.find(l =>
            l.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))
        );

        return match || null;
    }
}
