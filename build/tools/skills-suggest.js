"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsRecommender = void 0;
class SkillsRecommender {
    versionDetector;
    registry;
    constructor(versionDetector, registry) {
        this.versionDetector = versionDetector;
        this.registry = registry;
    }
    /**
     * Scans the user's local package/requirements files and returns
     * a tailored message recommending contexts to load.
     */
    suggestSkills(projectPath) {
        const detected = this.versionDetector.detectVersions(projectPath);
        const installedPackages = Object.keys(detected);
        if (installedPackages.length === 0) {
            return `No dependencies detected in ${projectPath}. Ensure package.json or requirements.txt exists.`;
        }
        const recommendations = [];
        const allLibs = this.registry.getAll();
        for (const pkg of installedPackages) {
            const matchedLib = allLibs.find(l => l.versionSource === pkg);
            if (matchedLib) {
                recommendations.push(matchedLib);
            }
        }
        if (recommendations.length === 0) {
            return `Detected ${installedPackages.length} packages, but none currently map to our high-priority AI/ML Context Registry.`;
        }
        const suggestionLines = [
            `🧠 ACTIVE SKILL RECOMMENDATIONS for ${projectPath}:`,
            `Based on your project dependencies, the AI Context MCP strongly suggests activating these context libraries:`,
            ''
        ];
        recommendations.forEach(lib => {
            const currentVer = detected[lib.versionSource];
            suggestionLines.push(`  - [${lib.name} v${currentVer}] (ID: ${lib.id})`);
            suggestionLines.push(`      → Action: Call \`query-docs\` with \`libraryId: "${lib.id}"\``);
            suggestionLines.push('');
        });
        return suggestionLines.join('\n');
    }
}
exports.SkillsRecommender = SkillsRecommender;
//# sourceMappingURL=skills-suggest.js.map