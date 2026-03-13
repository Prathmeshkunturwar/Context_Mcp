import { ChangelogParser } from '../src/tools/changelog-diff';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the GithubFetcher
const mockFetcher = {
    fetchDocString: jest.fn(),
} as any;

describe('ChangelogParser', () => {
    let parser: ChangelogParser;

    beforeEach(() => {
        parser = new ChangelogParser(mockFetcher);
        jest.clearAllMocks();
    });

    const sampleChangelog = `# Changelog

## [2.0.0] - 2024-01-15

### Breaking Changes
- Removed deprecated \`create_legacy()\` method
- Client initialization now requires explicit API key parameter

### Added
- New streaming API with server-sent events support
- Added async client via \`AsyncClient()\`

### Fixed
- Fixed memory leak in connection pool

## [1.5.0] - 2023-12-01

### Added
- Added support for function calling / tool use
- New embeddings endpoint

### Deprecated
- \`old_method()\` is deprecated, use \`new_method()\` instead

## [1.0.0] - 2023-06-01

### Breaking Changes
- Complete API rewrite from v0.x
- All response objects are now Pydantic models

### Added
- Initial stable release
`;

    test('should parse breaking changes between versions', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(sampleChangelog);

        const lib = {
            id: '/test/lib',
            changelogPath: 'CHANGELOG.md',
            metadata: {},
        } as any;

        const diff = await parser.getDiff(lib, '1.0.0', '2.0.0');

        expect(diff.breakingChanges.length).toBeGreaterThan(0);
        expect(diff.breakingChanges.some(c => c.includes('Removed'))).toBe(true);
    });

    test('should parse features between versions', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(sampleChangelog);

        const lib = {
            id: '/test/lib',
            changelogPath: 'CHANGELOG.md',
            metadata: {},
        } as any;

        const diff = await parser.getDiff(lib, '1.0.0', '2.0.0');

        expect(diff.features.length).toBeGreaterThan(0);
        expect(diff.features.some(c => c.includes('streaming') || c.includes('Added'))).toBe(true);
    });

    test('should parse deprecations', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(sampleChangelog);

        const lib = {
            id: '/test/lib',
            changelogPath: 'CHANGELOG.md',
            metadata: {},
        } as any;

        const diff = await parser.getDiff(lib, '1.0.0', '2.0.0');

        expect(diff.deprecations.length).toBeGreaterThan(0);
    });

    test('should parse fixes', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(sampleChangelog);

        const lib = {
            id: '/test/lib',
            changelogPath: 'CHANGELOG.md',
            metadata: {},
        } as any;

        const diff = await parser.getDiff(lib, '1.0.0', '2.0.0');

        expect(diff.fixes.length).toBeGreaterThan(0);
        expect(diff.fixes.some(c => c.includes('memory leak') || c.includes('Fixed'))).toBe(true);
    });

    test('should flag known breaking version boundaries from metadata', async () => {
        mockFetcher.fetchDocString.mockResolvedValue(sampleChangelog);

        const lib = {
            id: '/test/lib',
            changelogPath: 'CHANGELOG.md',
            metadata: {
                breakingVersions: ['2.0.0'],
            },
        } as any;

        const diff = await parser.getDiff(lib, '1.0.0', '2.0.0');

        expect(diff.breakingChanges.some(c => c.includes('CRITICAL'))).toBe(true);
    });

    test('should try discovery paths when changelogPath fails', async () => {
        // With Promise.any(), all 6 CHANGELOG_PATHS fire concurrently.
        // We mock all rejections except one success to simulate a valid discovery.
        mockFetcher.fetchDocString
            .mockRejectedValue(new Error('Not found'))  // default: all fail
            .mockResolvedValueOnce(sampleChangelog);    // first concurrent call succeeds

        const lib = {
            id: '/test/lib',
            changelogPath: 'nonexistent.md',
            metadata: {},
        } as any;

        const diff = await parser.getDiff(lib, '1.0.0', '2.0.0');
        expect(diff).toBeTruthy();
        // Concurrent discovery fires all paths simultaneously — at least 1 call must succeed
        expect(mockFetcher.fetchDocString.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    test('should throw when no changelog found anywhere', async () => {
        mockFetcher.fetchDocString.mockRejectedValue(new Error('Not found'));
        // Also make the GitHub Releases API fallback fail so the error propagates
        mockedAxios.get.mockRejectedValue(new Error('Network error'));

        const lib = {
            id: '/test/lib',
            changelogPath: 'CHANGELOG.md',
            repository: 'https://github.com/test/lib',
            metadata: {},
        } as any;

        await expect(parser.getDiff(lib, '1.0.0', '2.0.0')).rejects.toThrow();
    });
});
