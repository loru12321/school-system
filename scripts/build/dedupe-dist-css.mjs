import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const distRoot = path.join(projectRoot, 'dist');

function dedupeCssRules(css) {
    const source = String(css || '');
    const tree = postcss.parse(source);
    let removedRules = 0;
    // Only identical adjacent siblings are redundant. Crossing an @media,
    // @layer or intervening rule can change the cascade even for identical text.
    tree.walkRules((rule) => {
        const previous = rule.prev();
        if (previous?.type === 'rule' && previous.toString() === rule.toString()) {
            previous.remove();
            removedRules += 1;
        }
    });
    const output = removedRules ? tree.toString() : source;

    return {
        css: output,
        removedRules,
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
