import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const distRoot = path.join(projectRoot, 'dist');

function dedupeCssRules(css) {
    const source = String(css || '');
    const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
    const matches = [];
    let match;

    while ((match = rulePattern.exec(source)) !== null) {
        matches.push({
            start: match.index,
            end: rulePattern.lastIndex,
            selector: match[1].trim(),
            body: match[2].trim()
        });
    }

    const lastByRule = new Map();
    matches.forEach((item, index) => {
        lastByRule.set(`${item.selector}{${item.body}}`, index);
    });

    const removeRanges = matches
        .filter((item, index) => lastByRule.get(`${item.selector}{${item.body}}`) !== index)
        .map((item) => [item.start, item.end]);

    if (!removeRanges.length) {
        return { css: source, removedRules: 0, savedBytes: 0 };
    }

    let output = '';
    let cursor = 0;
    removeRanges.forEach(([start, end]) => {
        output += source.slice(cursor, start);
        cursor = end;
    });
    output += source.slice(cursor);

    return {
        css: output,
        removedRules: removeRanges.length,
        savedBytes: Buffer.byteLength(source) - Buffer.byteLength(output)
    };
}

function main() {
    if (!fs.existsSync(distRoot)) {
        console.warn(`[dedupe-dist-css] dist not found: ${distRoot}`);
        return;
    }

    const stylesheetNames = fs.readdirSync(distRoot)
        .filter((name) => /^style-[\w-]+\.css$/.test(name));

    stylesheetNames.forEach((name) => {
        const filePath = path.join(distRoot, name);
        const source = fs.readFileSync(filePath, 'utf8');
        const result = dedupeCssRules(source);
        if (result.removedRules > 0) {
            fs.writeFileSync(filePath, result.css, 'utf8');
            console.log(`[dedupe-dist-css] ${name}: removed ${result.removedRules} duplicate rules, saved ${result.savedBytes} bytes`);
        }
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main();
}

export { dedupeCssRules };
