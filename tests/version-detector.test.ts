import { VersionDetector } from '../src/tools/version-detector';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('VersionDetector', () => {
    let detector: VersionDetector;
    let tmpDir: string;

    beforeAll(() => {
        detector = new VersionDetector();
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-test-'));
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('should detect npm packages from package.json', () => {
        const pkgJson = {
            dependencies: {
                'openai': '^4.20.0',
                'axios': '~1.7.9',
            },
            devDependencies: {
                'typescript': '^5.0.0',
            }
        };

        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkgJson));

        const versions = detector.detectVersions(tmpDir);

        expect(versions['npm:openai']).toBe('4.20.0');
        expect(versions['npm:axios']).toBe('1.7.9');
        expect(versions['npm:typescript']).toBe('5.0.0');
    });

    test('should detect python packages from requirements.txt', () => {
        const requirements = 'openai==1.45.0\nlangchain>=0.3.0\nrequests~=2.31.0\n';

        fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), requirements);

        const versions = detector.detectVersions(tmpDir);

        expect(versions['pypi:openai']).toBe('1.45.0');
        expect(versions['pypi:langchain']).toBe('0.3.0');
        expect(versions['pypi:requests']).toBe('2.31.0');
    });

    test('should detect python packages from Pipfile', () => {
        const pipfile = `[packages]\nopenai = "==1.45.0"\nflask = ">=2.0.0"\n`;

        fs.writeFileSync(path.join(tmpDir, 'Pipfile'), pipfile);

        const versions = detector.detectVersions(tmpDir);

        expect(versions['pypi:openai']).toBe('1.45.0');
        expect(versions['pypi:flask']).toBe('2.0.0');
    });

    test('should return empty object for non-existent path', () => {
        const versions = detector.detectVersions('/non/existent/path');
        expect(Object.keys(versions).length).toBe(0);
    });

    test('should handle empty package.json gracefully', () => {
        const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-context-empty-'));
        fs.writeFileSync(path.join(emptyDir, 'package.json'), '{}');

        const versions = detector.detectVersions(emptyDir);
        expect(Object.keys(versions).length).toBe(0);

        fs.rmSync(emptyDir, { recursive: true, force: true });
    });
});
