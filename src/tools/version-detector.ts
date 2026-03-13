import * as fs from 'fs';
import * as path from 'path';

export class VersionDetector {

    public detectVersions(projectPath: string): Record<string, string> {
        const versions: Record<string, string> = {};

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
        } catch (e) { /* ignore */ }

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
        } catch (e) { /* ignore */ }

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
        } catch (e) { /* ignore */ }

        return versions;
    }
}
