import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface CacheEntry {
    libraryId: string;
    version: string;
    query: string;
    content: string;
    timestamp: number;
}

export class SQLiteCache {
    private db: sqlite3.Database;

    constructor() {
        const cacheDir = path.join(__dirname, '../../.cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        const dbPath = path.join(cacheDir, 'ai-context-cache.db');
        this.db = new sqlite3.Database(dbPath);
        this.initSchema();
    }

    private initSchema() {
        this.db.serialize(() => {
            this.db.run(`
        CREATE TABLE IF NOT EXISTS doc_cache (
          id TEXT PRIMARY KEY,
          libraryId TEXT,
          version TEXT,
          query TEXT,
          content TEXT,
          timestamp INTEGER
        )
      `);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_query ON doc_cache(libraryId, query, version)`);
        });
    }

    private generateId(libraryId: string, version: string, query: string): string {
        return `${libraryId}::${version}::${query}`;
    }

    public async get(libraryId: string, version: string, query: string, ttlMs: number): Promise<{ content: string, isStale: boolean } | null> {
        return new Promise((resolve, reject) => {
            const id = this.generateId(libraryId, version, query);
            this.db.get(`SELECT content, timestamp FROM doc_cache WHERE id = ?`, [id], (err, row: any) => {
                if (err) return reject(err);
                if (!row) return resolve(null);

                const now = Date.now();
                const isStale = now - row.timestamp > ttlMs;

                // Return content along with stale marker so the fetcher can decide how to handle it
                resolve({ content: row.content, isStale });
            });
        });
    }

    public async set(libraryId: string, version: string, query: string, content: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const id = this.generateId(libraryId, version, query);
            const timestamp = Date.now();

            this.db.run(
                `INSERT OR REPLACE INTO doc_cache (id, libraryId, version, query, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, libraryId, version, query, content, timestamp],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
}
