const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const client = new OSS({
  region: 'oss-cn-hangzhou', // default region
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || 'YOUR_AK',
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || 'YOUR_SK',
});

const bucketName = 'schoolsystem-web-app-001';

async function deploy() {
  try {
    console.log(`Checking bucket ${bucketName}...`);
    try {
      await client.putBucket(bucketName);
    } catch (e) {
      if (e.code !== 'BucketAlreadyExists') {
        console.log('Bucket creation issue:', e.message);
      }
    }
    client.useBucket(bucketName);

    console.log('Attempting to set bucket ACL to public-read...');
    try {
      await client.putBucketACL(bucketName, 'public-read');
    } catch (e) {
      console.log('WARNING: Could not set bucket to public automatically. You will need to manually set it to "Public Read" in the Aliyun console.');
    }

    console.log('Configuring static website hosting...');
    try {
      await client.putBucketWebsite(bucketName, {
        index: 'index.html',
        error: 'index.html',
      });
    } catch (e) {
      console.log('WARNING: Could not configure static hosting automatically.', e.message);
    }

    const distPath = path.join(__dirname, '..', 'dist');
    const files = [];

    function walkDir(dir) {
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          walkDir(filePath);
        } else {
          files.push(filePath);
        }
      });
    }

    console.log('Scanning dist folder...');
    walkDir(distPath);

    console.log(`Found ${files.length} files to upload. Starting upload...`);
    const uploadPromises = files.map(async (filePath) => {
      let objectName = path.relative(distPath, filePath).replace(/\\/g, '/');
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      await client.put(objectName, filePath, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': objectName.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000'
        }
      });
    });

    await Promise.all(uploadPromises);
    console.log('Upload complete!');
    console.log('================================================');
    console.log('DEPLOYMENT SUCCESSFUL!');
    console.log(`OSS Bucket Domain: ${bucketName}.oss-cn-hangzhou.aliyuncs.com`);
    console.log('================================================');

  } catch (err) {
    console.error('Deployment failed:', err);
  }
}

deploy();
