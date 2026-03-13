import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Registry } from './registry';
export declare function createHttpServer(mcpServer: Server, registry: Registry, port: number): void;
export declare function trackCacheHit(): void;
export declare function trackCacheMiss(): void;
export declare function trackRequest(): void;
