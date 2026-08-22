import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const brandDir = path.join(projectRoot, 'dist', 'assets', 'brand');

console.log('🖼️  Optimizing PNG images...');
const startTime = Date.now();

const pngFiles = fs.readdirSync(brandDir)
  .filter(name => name.endsWith('.png'))
  .map(name => path.join(brandDir, name));

const results = [];

for (const filePath of pngFiles) {
  const originalSize = fs.statSync(filePath).size;
  const filename = path.basename(filePath);

  // Read original, optimize with sharp (lossless)
  const tempPath = `${filePath}.tmp`;

  await sharp(filePath)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true
    })
    .toFile(tempPath);

  const optimizedSize = fs.statSync(tempPath).size;

  // Only replace if optimization is beneficial
  if (optimizedSize < originalSize) {
    fs.renameSync(tempPath, filePath);
    const saved = originalSize - optimizedSize;
    const ratio = ((saved / originalSize) * 100).toFixed(1);
    results.push({ filename, originalSize, optimizedSize, saved, ratio });
  } else {
    // Not beneficial, keep original
    fs.unlinkSync(tempPath);
  }
}

if (results.length > 0) {
  console.log(`\n✨ Optimized ${results.length} images:\n`);

  // Sort by bytes saved (largest first)
  results.sort((a, b) => b.saved - a.saved);

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimized = results.reduce((sum, r) => sum + r.optimizedSize, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const totalRatio = ((totalSaved / totalOriginal) * 100).toFixed(1);

  results.slice(0, 10).forEach(r => {
    const originalKB = (r.originalSize / 1024).toFixed(1);
    const optimizedKB = (r.optimizedSize / 1024).toFixed(1);
    console.log(`  ${r.filename}`);
    console.log(`    ${originalKB}KB → ${optimizedKB}KB (${r.ratio}% reduction)`);
  });

  if (results.length > 10) {
    console.log(`  ... and ${results.length - 10} more images`);
  }

  const totalOriginalKB = (totalOriginal / 1024).toFixed(1);
  const totalOptimizedKB = (totalOptimized / 1024).toFixed(1);
  const savedKB = (totalSaved / 1024).toFixed(1);
  console.log(`\n📊 Total: ${totalOriginalKB}KB → ${totalOptimizedKB}KB (${savedKB}KB saved, ${totalRatio}% reduction)`);
} else {
  console.log('All images already optimal');
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n⏱️  Completed in ${duration}s`);
