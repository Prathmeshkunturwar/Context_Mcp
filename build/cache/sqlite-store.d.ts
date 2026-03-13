export interface CacheEntry {
    libraryId: string;
    version: string;
    query: string;
    content: string;
    timestamp: number;
}
export declare class SQLiteCache {
    private db;
    constructor();
    private initSchema;
    private generateId;
    get(libraryId: string, version: string, query: string, ttlMs: number): Promise<{
        content: string;
        isStale: boolean;
    } | null>;
    set(libraryId: string, version: string, query: string, content: string): Promise<void>;
}
