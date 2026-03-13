"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteCache = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class SQLiteCache {
    db;
    constructor() {
        const cacheDir = path.join(__dirname, '../../.cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        const dbPath = path.join(cacheDir, 'ai-context-cache.db');
        this.db = new sqlite3_1.default.Database(dbPath);
        this.initSchema();
    }
    initSchema() {
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
    generateId(libraryId, version, query) {
        return `${libraryId}::${version}::${query}`;
    }
    async get(libraryId, version, query, ttlMs) {
        return new Promise((resolve, reject) => {
            const id = this.generateId(libraryId, version, query);
            this.db.get(`SELECT content, timestamp FROM doc_cache WHERE id = ?`, [id], (err, row) => {
                if (err)
                    return reject(err);
                if (!row)
                    return resolve(null);
                const now = Date.now();
                const isStale = now - row.timestamp > ttlMs;
                // Return content along with stale marker so the fetcher can decide how to handle it
                resolve({ content: row.content, isStale });
            });
        });
    }
    async set(libraryId, version, query, content) {
        return new Promise((resolve, reject) => {
            const id = this.generateId(libraryId, version, query);
            const timestamp = Date.now();
            this.db.run(`INSERT OR REPLACE INTO doc_cache (id, libraryId, version, query, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, [id, libraryId, version, query, content, timestamp], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
exports.SQLiteCache = SQLiteCache;
//# sourceMappingURL=sqlite-store.js.map