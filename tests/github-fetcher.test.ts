import { GithubFetcher } from '../src/sources/github';

// Mock SQLiteCache
const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
} as any;

// Mock axios
jest.mock('axios', () => ({
    default: {
        get: jest.fn(),
    },
    __esModule: true,
}));

import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GithubFetcher', () => {
    let fetcher: GithubFetcher;

    beforeEach(() => {
        fetcher = new GithubFetcher(mockCache);
        jest.clearAllMocks();
        mockCache.get.mockResolvedValue(null);
        mockCache.set.mockResolvedValue(undefined);
    });

    test('should fetch document from GitHub and cache it', async () => {
        (mockedAxios.get as jest.Mock).mockResolvedValue({ data: '# Hello World' });

        const lib = {
            id: '/test/fetch-test',
            repository: 'https://github.com/test/fetch-test',
        } as any;

        const content = await fetcher.fetchDocString(lib, 'README.md', 'main');

        expect(content).toBe('# Hello World');
        expect(mockCache.set).toHaveBeenCalled();
    });

    test('should return L2 cached content when not stale', async () => {
        mockCache.get.mockResolvedValue({ content: '# Cached Content', isStale: false });

        // Use a unique lib id so it won't match L1 cache from other tests
        const lib = {
            id: '/test/cache-hit-test',
            repository: 'https://github.com/test/cache-hit-test',
        } as any;

        const content = await fetcher.fetchDocString(lib, 'docs.md', 'main');

        expect(content).toBe('# Cached Content');
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    test('should return stale cache when network fails (offline mode)', async () => {
        mockCache.get.mockResolvedValue({ content: '# Stale Content', isStale: true });
        (mockedAxios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

        const lib = {
            id: '/test/offline-test',
            repository: 'https://github.com/test/offline-test',
        } as any;

        const content = await fetcher.fetchDocString(lib, 'offline.md', 'main');

        expect(content).toBe('# Stale Content');
    });

    test('should try vX.Y.Z tag format for pinned versions', async () => {
        (mockedAxios.get as jest.Mock)
            .mockResolvedValueOnce({ data: '# Versioned Doc' });

        const lib = {
            id: '/test/version-test',
            repository: 'https://github.com/test/version-test',
        } as any;

        const content = await fetcher.fetchDocString(lib, 'README.md', '1.45.0');

        expect(content).toBe('# Versioned Doc');
        expect((mockedAxios.get as jest.Mock).mock.calls[0][0]).toContain('v1.45.0');
    });

    test('should fallback to plain version if vX.Y.Z returns 404', async () => {
        (mockedAxios.get as jest.Mock)
            .mockRejectedValueOnce({ response: { status: 404 } })  // v2.0.0 fails
            .mockResolvedValueOnce({ data: '# Found' });            // 2.0.0 works

        const lib = {
            id: '/test/fallback-test',
            repository: 'https://github.com/test/fallback-test',
        } as any;

        const content = await fetcher.fetchDocString(lib, 'GUIDE.md', '2.0.0');

        expect(content).toBe('# Found');
    });

    test('should throw on invalid repository URL', async () => {
        mockCache.get.mockResolvedValue(null);

        const lib = {
            id: '/test/invalid-url',
            repository: 'https://example.com/not-github',
        } as any;

        await expect(fetcher.fetchDocString(lib, 'invalid.md'))
            .rejects.toThrow('Invalid GitHub repository URL');
    });
});
