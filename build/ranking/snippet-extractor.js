"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnippetExtractor = void 0;
class SnippetExtractor {
    extractChunks(content, fileName) {
        if (fileName.endsWith('.ipynb')) {
            return this.extractJupyterChunks(content, fileName);
        }
        const lines = content.split('\n');
        let currentTitle = 'Document Header';
        let currentContent = [];
        const chunks = [];
        let inCodeBlock = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (trimmed.startsWith('```')) {
                inCodeBlock = !inCodeBlock;
            }
            // Split on #, ##, ### headers (not inside code blocks)
            if (!inCodeBlock && /^#{1,3}\s/.test(trimmed)) {
                if (currentContent.length > 0) {
                    chunks.push({
                        title: currentTitle,
                        content: currentContent.join('\n').trim(),
                        sourceFiles: [fileName]
                    });
                }
                currentTitle = trimmed.replace(/^#+\s/, '').trim();
                currentContent = [];
            }
            else {
                currentContent.push(line);
            }
        }
        if (currentContent.length > 0) {
            chunks.push({
                title: currentTitle,
                content: currentContent.join('\n').trim(),
                sourceFiles: [fileName]
            });
        }
        return chunks.filter(c => c.content.length > 10);
    }
    extractJupyterChunks(rawJson, sourcePath) {
        const chunks = [];
        try {
            const notebook = JSON.parse(rawJson);
            if (!notebook.cells)
                return chunks;
            let cellIndex = 0;
            for (const cell of notebook.cells) {
                if (cell.cell_type === 'code' && cell.source && cell.source.length > 0) {
                    const code = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
                    chunks.push({
                        title: `${sourcePath} - Cell ${cellIndex} (Code)`,
                        content: code.trim(),
                        sourceFiles: [sourcePath]
                    });
                }
                cellIndex++;
            }
        }
        catch (e) {
            console.error(`Failed to parse Jupyter Notebook: ${e}`);
        }
        return chunks.filter(c => c.content.length > 5);
    }
}
exports.SnippetExtractor = SnippetExtractor;
//# sourceMappingURL=snippet-extractor.js.map