import { VersionDetector } from './version-detector';
import { Registry } from '../registry';
export declare class SkillsRecommender {
    private versionDetector;
    private registry;
    constructor(versionDetector: VersionDetector, registry: Registry);
    /**
     * Scans the user's local package/requirements files and returns
     * a tailored message recommending contexts to load.
     */
    suggestSkills(projectPath: string): string;
}
