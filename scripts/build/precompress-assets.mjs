import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const brotliCompress = promisify(zlib.brotliCompress);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distRoot = path.resolve(__dirname, '../../dist');

const compressibleExtensions = new Set(['.js', '.css', '.html', '.json', '.svg', '.xml']);
const sizeThreshold = 1024; // Only compress files > 1KB

async function compressFile(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size < sizeThreshold) return null;

  const content = fs.readFileSync(filePath);
  const compressed = await brotliCompress(content, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: stat.size
    }
  });

  // Only write if compression is beneficial (at least 10% reduction)
  if (compressed.length < content.length * 0.9) {
    fs.writeFileSync(`${filePath}.br`, compressed);
    const ratio = ((1 - compressed.length / content.length) * 100).toFixed(1);
    return {
      file: path.relative(distRoot, filePath),
      original: stat.size,
      compressed: compressed.length,
      ratio: `${ratio}%`
    };
  }

  return null;
}

async function walkDirectory(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (compressibleExtensions.has(ext)) {
        const result = await compressFile(fullPath);
        if (result) results.push(result);
      }
    }
  }

  return results;
}

console.log('🌀 Pre-compressing assets with Brotli...');
const startTime = Date.now();

const results = await walkDirectory(distRoot);

if (results.length > 0) {
  console.log(`\n✨ Compressed ${results.length} files:\n`);

  // Sort by original size (largest first)
  results.sort((a, b) => b.original - a.original);

  const totalOriginal = results.reduce((sum, r) => sum + r.original, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressed, 0);
  const totalRatio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);

  // Show top 10 largest compressed files
  results.slice(0, 10).forEach(r => {
    const originalKB = (r.original / 1024).toFixed(1);
    const compressedKB = (r.compressed / 1024).toFixed(1);
    console.log(`  ${r.file}`);
    console.log(`    ${originalKB}KB → ${compressedKB}KB (${r.ratio} reduction)`);
  });

  if (results.length > 10) {
    console.log(`  ... and ${results.length - 10} more files`);
  }

  const totalOriginalKB = (totalOriginal / 1024).toFixed(1);
  const totalCompressedKB = (totalCompressed / 1024).toFixed(1);
  console.log(`\n📊 Total: ${totalOriginalKB}KB → ${totalCompressedKB}KB (${totalRatio}% reduction)`);
} else {
  console.log('No files were compressed (all below threshold or already optimal)');
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n⏱️  Completed in ${duration}s`);
