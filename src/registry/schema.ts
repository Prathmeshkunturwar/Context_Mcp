import * as fs from 'fs';
import * as path from 'path';
import { LibraryEntry } from './index';

export interface ValidationError {
    libraryIndex: number;
    libraryId: string;
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    libraryCount: number;
}

const VALID_CATEGORIES = [
    'llm-provider-sdk',
    'agent-framework',
    'ml-framework',
    'inference-engine',
    'vector-database',
    'prompt-engineering',
    'observability',
    'data-pipeline',
    'web-framework',
    'database-orm',
    'api-framework',
    'testing',
    'infrastructure',
];

const VALID_LANGUAGES = ['python', 'typescript', 'javascript', 'go', 'rust', 'cpp', 'java'];

export function validateRegistry(registryPath?: string): ValidationResult {
    const filePath = registryPath || path.join(__dirname, 'libraries.json');
    const errors: ValidationError[] = [];

    let libraries: any[];
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        libraries = JSON.parse(raw);
    } catch (e: any) {
        return {
            valid: false,
            errors: [{ libraryIndex: -1, libraryId: 'N/A', field: 'file', message: `Failed to parse registry: ${e.message}` }],
            libraryCount: 0,
        };
    }

    if (!Array.isArray(libraries)) {
        return {
            valid: false,
            errors: [{ libraryIndex: -1, libraryId: 'N/A', field: 'root', message: 'Registry must be a JSON array' }],
            libraryCount: 0,
        };
    }

    const seenIds = new Set<string>();
    const seenAliases = new Set<string>();

    libraries.forEach((lib: any, index: number) => {
        const id = lib.id || `[index ${index}]`;

        // Required fields
        if (!lib.id || typeof lib.id !== 'string') {
            errors.push({ libraryIndex: index, libraryId: id, field: 'id', message: 'id is required and must be a string' });
        } else if (!lib.id.startsWith('/')) {
            errors.push({ libraryIndex: index, libraryId: id, field: 'id', message: 'id must start with /' });
        }

        if (!lib.name || typeof lib.name !== 'string') {
            errors.push({ libraryIndex: index, libraryId: id, field: 'name', message: 'name is required and must be a string' });
        }

        if (!Array.isArray(lib.aliases) || lib.aliases.length === 0) {
            errors.push({ libraryIndex: index, libraryId: id, field: 'aliases', message: 'aliases must be a non-empty array' });
        }

        if (!lib.category || !VALID_CATEGORIES.includes(lib.category)) {
            errors.push({ libraryIndex: index, libraryId: id, field: 'category', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
        }

        if (!lib.language || !VALID_LANGUAGES.includes(lib.language)) {
            errors.push({ libraryIndex: index, libraryId: id, field: 'language', message: `language must be one of: ${VALID_LANGUAGES.join(', ')}` });
        }

        if (!lib.repository || typeof lib.repository !== 'string') {
            errors.push({ libraryIndex: index, libraryId: id, field: 'repository', message: 'repository URL is required' });
        } else if (!lib.repository.includes('github.com')) {
            errors.push({ libraryIndex: index, libraryId: id, field: 'repository', message: 'repository must be a GitHub URL' });
        }

        if (!lib.versionSource || typeof lib.versionSource !== 'string') {
            errors.push({ libraryIndex: index, libraryId: id, field: 'versionSource', message: 'versionSource is required' });
        } else if (!/^(pypi|npm|github):/.test(lib.versionSource)) {
            errors.push({ libraryIndex: index, libraryId: id, field: 'versionSource', message: 'versionSource must start with pypi:, npm:, or github:' });
        }

        // Duplicate checks
        if (seenIds.has(lib.id)) {
            errors.push({ libraryIndex: index, libraryId: id, field: 'id', message: 'Duplicate library ID' });
        }
        seenIds.add(lib.id);

        if (Array.isArray(lib.aliases)) {
            for (const alias of lib.aliases) {
                if (seenAliases.has(alias.toLowerCase())) {
                    errors.push({ libraryIndex: index, libraryId: id, field: 'aliases', message: `Duplicate alias: "${alias}"` });
                }
                seenAliases.add(alias.toLowerCase());
            }
        }

        // docSections validation
        if (lib.docSections && typeof lib.docSections === 'object') {
            for (const [key, val] of Object.entries(lib.docSections)) {
                if (typeof val !== 'string') {
                    errors.push({ libraryIndex: index, libraryId: id, field: `docSections.${key}`, message: 'docSections values must be strings (file paths)' });
                }
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        libraryCount: libraries.length,
    };
}

// CLI runner: npm run validate-registry
if (require.main === module) {
    const result = validateRegistry();

    if (result.valid) {
        console.log(`Registry VALID: ${result.libraryCount} libraries passed validation.`);
        process.exit(0);
    } else {
        console.error(`Registry INVALID: ${result.errors.length} error(s) found:\n`);
        for (const err of result.errors) {
            console.error(`  [${err.libraryIndex}] ${err.libraryId} → ${err.field}: ${err.message}`);
        }
        process.exit(1);
    }
}
