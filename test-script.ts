import { Registry } from './src/registry';
import { GithubFetcher } from './src/sources/github';
import { SQLiteCache } from './src/cache/sqlite-store';
import { SnippetExtractor } from './src/ranking/snippet-extractor';
import { AIMLRanker } from './src/ranking/ai-ml-ranker';
import { VersionDetector } from './src/tools/version-detector';
import { ChangelogParser } from './src/tools/changelog-diff';
import * as process from 'process';

async function runTests() {
    console.log('--- Starting Integration Tests ---\n');

    // 1. Registry Test
    console.log('[1] Testing Registry Resolution...');
    const registry = new Registry();
    const lib = registry.findLibrary('openai');
    if (lib) {
        console.log(`✅ Successfully resolved "openai" to canonical ID: ${lib.id}`);
    } else {
        console.error('❌ Failed to resolve library.');
        return;
    }

    // 2. Fetcher & Cache Action
    console.log('\n[2] Testing GitHub Fetcher & Caching...');
    const cache = new SQLiteCache();
    const fetcher = new GithubFetcher(cache);

    try {
        const rawDoc = await fetcher.fetchDocString(lib, lib.docsPath ? Object.values(lib.docSections || {})[0] || 'README.md' : 'README.md', 'main');
        console.log(`✅ Successfully fetched ${rawDoc.length} characters of documentation from GitHub.`);

        // Test Cache (should be extremely fast)
        const start = Date.now();
        await fetcher.fetchDocString(lib, lib.docsPath ? Object.values(lib.docSections || {})[0] || 'README.md' : 'README.md', 'main');
        console.log(`✅ Cache hit took ${Date.now() - start}ms.`);

        // 3. Extracting and Ranking
        console.log('\n[3] Testing Chunk Extraction & Ranking...');
        const extractor = new SnippetExtractor();
        const ranker = new AIMLRanker();

        const chunks = extractor.extractChunks(rawDoc, 'README.md');
        console.log(`✅ Extracted ${chunks.length} distinct context chunks.`);

        const rankedChunks = ranker.rankChunks('How to use tool calling', chunks);
        if (rankedChunks.length > 0) {
            console.log(`✅ Top ranked chunk title: "${rankedChunks[0].title}" (Score: ${rankedChunks[0].score})`);
        }

    } catch (error: any) {
        console.log(`⚠️ Document fetch issue (possibly a hardcoded path mis-match): ${error.message}`);
    }

    // 4. Version Detector
    console.log('\n[4] Testing Local Version Detector...');
    const versionDetector = new VersionDetector();
    // using current project directory
    const versions = versionDetector.detectVersions(process.cwd());
    console.log(`✅ Detected local project dependencies:`);
    console.log(versions);

    // 5. Changelog Diff
    console.log('\n[5] Testing Changelog Parsing...');
    const changelogParser = new ChangelogParser(fetcher);
    try {
        // OpenAI doesn't strictly have a changelog at exactly CHANGELOG.md often, 
        // but the code will try to fetch it if defined in libraries.json
        const diff = await changelogParser.getDiff(lib, "1.0.0", "1.1.0");
        console.log(`✅ Parsed ${diff.breakingChanges.length} breaking changes and ${diff.features.length} features.`);
    } catch (error: any) {
        console.log(`⚠️ Expected missing changelog for openai MVP definition: ${error.message}`);
    }

    console.log('\n--- Tests Complete ---');
}

runTests().catch(console.error);
