#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const registryPath = path.join(__dirname, '..', '..', 'src', 'registry', 'libraries.json');

function prompt(question: string): Promise<string> {
    return new Promise((resolve) => rl.question(question, resolve));
}

async function addLibrary() {
    console.log('\n🌟 Welcome to the AI Context MCP Library Contributor! 🌟');
    console.log('This tool will help you scaffold a new library entry for our registry.\n');

    const id = await prompt('Canonical ID (e.g., /organization/repo-name): ');
    const name = await prompt('Human readable name (e.g., LangChain): ');
    const repository = await prompt('GitHub Repository URL (e.g., https://github.com/langchain-ai/langchain): ');
    const language = await prompt('Language (python, typescript, go, rust): ');
    const category = await prompt('Category (llm-sdk, agent-framework, vector-db, tool, embedding): ');
    const versionSource = await prompt('Version Source package name (e.g. pypi:langchain or npm:langchain): ');

    console.log('\n📚 Documentation Sections');
    console.log('Enter the relative path from the repo root to key markdown files.');
    console.log('Leave blank to skip.');

    const docSections: Record<string, string> = {};
    const core = await prompt('Core API/Getting Started path (e.g., docs/core_api.md): ');
    if (core) docSections['core'] = core;

    const examples = await prompt('Examples path (e.g., docs/examples.md): ');
    if (examples) docSections['examples'] = examples;

    // Fallback if they provided nothing
    if (Object.keys(docSections).length === 0) {
        docSections['readme'] = 'README.md';
    }

    const newEntry = {
        id,
        name,
        aliases: [name.toLowerCase(), id.split('/').pop()],
        repository,
        language,
        category,
        docSections,
        versionSource
    };

    try {
        const raw = fs.readFileSync(registryPath, 'utf8');
        const data = JSON.parse(raw);
        data.libraries.push(newEntry);

        fs.writeFileSync(registryPath, JSON.stringify(data, null, 4));
        console.log(`\n✅ Successfully injected ${name} into libraries.json!`);
        console.log(`Please run 'npm run test' to ensure the schema is still perfectly valid before opening your Pull Request.`);
    } catch (e: any) {
        console.error(`\n❌ Failed to update registry: ${e.message}`);
    }

    rl.close();
}

addLibrary();
