/**
 * Analyze vendor library usage to identify unused files
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const vendorDir = path.join(projectRoot, 'public', 'assets', 'vendor');
const jsDir = path.join(projectRoot, 'public', 'assets', 'js');
const srcDir = path.join(projectRoot, 'src');

function getAllFiles(dir, ext) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    function walk(currentPath) {
        const items = fs.readdirSync(currentPath);
        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walk(fullPath);
            } else if (!ext || fullPath.endsWith(ext)) {
                files.push(fullPath);
            }
        }
    }
    
    walk(dir);
    return files;
}

function analyzeVendorUsage() {
    const vendorLibs = fs.readdirSync(vendorDir);
    const jsFiles = [...getAllFiles(jsDir, '.js'), ...getAllFiles(srcDir, '.html')];
    
    const usage = {};
    
    for (const lib of vendorLibs) {
        const libPath = path.join(vendorDir, lib);
        if (!fs.statSync(libPath).isDirectory()) continue;
        
        let used = false;
        for (const file of jsFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            if (content.includes(`/vendor/${lib}/`) || content.includes(`vendor/${lib}/`)) {
                used = true;
                break;
            }
        }
        
        const libFiles = getAllFiles(libPath);
        const totalSize = libFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
        
        usage[lib] = {
            used,
            size: (totalSize / 1024).toFixed(2) + ' KB',
            files: libFiles.length
        };
    }
    
    return usage;
}

console.log('\n📊 Vendor Library Usage Analysis\n');
const usage = analyzeVendorUsage();

let totalUnused = 0;
for (const [lib, info] of Object.entries(usage)) {
    const status = info.used ? '✓ USED' : '✗ UNUSED';
    console.log(`${status.padEnd(10)} ${lib.padEnd(20)} ${info.size.padStart(12)} (${info.files} files)`);
    if (!info.used) {
        totalUnused += parseFloat(info.size);
    }
}

console.log(`\n💾 Potential savings: ${totalUnused.toFixed(2)} KB\n`);
