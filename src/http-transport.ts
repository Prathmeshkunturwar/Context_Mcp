import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Registry } from './registry';

const startTime = Date.now();

let cacheHits = 0;
let cacheMisses = 0;
let totalRequests = 0;

export function createHttpServer(mcpServer: Server, registry: Registry, port: number) {
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_req, res) => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        res.json({
            status: 'ok',
            version: '1.0.0',
            uptime_seconds: uptime,
            library_count: registry.getAll().length,
            categories: [...new Set(registry.getAll().map(l => l.category))],
        });
    });

    // Prometheus-compatible metrics endpoint
    app.get('/metrics', (_req, res) => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const lines = [
            '# HELP ai_context_uptime_seconds Server uptime in seconds',
            '# TYPE ai_context_uptime_seconds gauge',
            `ai_context_uptime_seconds ${uptime}`,
            '',
            '# HELP ai_context_library_count Number of libraries in registry',
            '# TYPE ai_context_library_count gauge',
            `ai_context_library_count ${registry.getAll().length}`,
            '',
            '# HELP ai_context_requests_total Total number of MCP tool requests',
            '# TYPE ai_context_requests_total counter',
            `ai_context_requests_total ${totalRequests}`,
            '',
            '# HELP ai_context_cache_hits_total Total cache hits',
            '# TYPE ai_context_cache_hits_total counter',
            `ai_context_cache_hits_total ${cacheHits}`,
            '',
            '# HELP ai_context_cache_misses_total Total cache misses',
            '# TYPE ai_context_cache_misses_total counter',
            `ai_context_cache_misses_total ${cacheMisses}`,
        ];

        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(lines.join('\n') + '\n');
    });

    // Registry listing endpoint
    app.get('/libraries', (_req, res) => {
        const libs = registry.getAll().map(l => ({
            id: l.id,
            name: l.name,
            category: l.category,
            language: l.language,
        }));
        res.json({ count: libs.length, libraries: libs });
    });

    app.listen(port, () => {
        console.error(`AI Context MCP HTTP server running on port ${port}`);
        console.error(`  Health:    http://localhost:${port}/health`);
        console.error(`  Metrics:   http://localhost:${port}/metrics`);
        console.error(`  Libraries: http://localhost:${port}/libraries`);
    });
}

// Export for metrics tracking from other modules
export function trackCacheHit() { cacheHits++; }
export function trackCacheMiss() { cacheMisses++; }
export function trackRequest() { totalRequests++; }
