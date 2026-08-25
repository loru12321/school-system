/**
 * Report inline styles that could be extracted to CSS classes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const htmlPath = path.join(projectRoot, 'src', 'index.html');

const html = fs.readFileSync(htmlPath, 'utf-8');

// Extract all inline styles
const styleMatches = html.matchAll(/style="([^"]+)"/g);
const styles = Array.from(styleMatches).map(m => m[1]);

// Count duplicates
const styleCounts = {};
for (const style of styles) {
    styleCounts[style] = (styleCounts[style] || 0) + 1;
}

// Find most common styles (candidates for extraction)
const duplicates = Object.entries(styleCounts)
    .filter(([_, count]) => count > 3)
    .sort((a, b) => b[1] - a[1]);

console.log('\n🎨 Top Repeated Inline Styles (candidates for extraction):\n');
for (const [style, count] of duplicates.slice(0, 15)) {
    console.log(`${count}x: ${style.substring(0, 60)}${style.length > 60 ? '...' : ''}`);
}

console.log(`\n📊 Total inline styles: ${styles.length}`);
console.log(`📊 Unique styles: ${Object.keys(styleCounts).length}`);
console.log(`📊 Duplicated styles: ${duplicates.length}\n`);
