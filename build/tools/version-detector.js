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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class VersionDetector {
    detectVersions(projectPath) {
        const versions = {};
        // 1. Detect Node.js packages
        try {
            const pkgPath = path.join(projectPath, 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
                for (const [name, version] of Object.entries(deps)) {
                    // Clean ranges like ^1.0.0 or ~2.3.4
                    versions[`npm:${name}`] = String(version).replace(/[\^~]/g, '');
                }
            }
        }
        catch (e) { /* ignore */ }
        // 2. Detect Python packages
        try {
            const reqPath = path.join(projectPath, 'requirements.txt');
            if (fs.existsSync(reqPath)) {
                const lines = fs.readFileSync(reqPath, 'utf8').split('\n');
                for (const line of lines) {
                    const match = line.match(/^([a-zA-Z0-9_\-]+)[=><~]+(.*)$/);
                    if (match) {
                        versions[`pypi:${match[1].toLowerCase()}`] = match[2].trim();
                    }
                }
            }
        }
        catch (e) { /* ignore */ }
        // 3. Detect Pipfile
        try {
            const pipPath = path.join(projectPath, 'Pipfile');
            if (fs.existsSync(pipPath)) {
                const content = fs.readFileSync(pipPath, 'utf8');
                // Basic regex for TOML-ish syntax: name = "==1.2.3"
                const regex = /([a-zA-Z0-9_\-]+)\s*=\s*"[=><~]+([^"]+)"/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    versions[`pypi:${match[1].toLowerCase()}`] = match[2].trim();
                }
            }
        }
        catch (e) { /* ignore */ }
        return versions;
    }
}
exports.VersionDetector = VersionDetector;
//# sourceMappingURL=version-detector.js.map