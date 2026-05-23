const OSS = require('ali-oss');
const fs = require('fs');

const ak = process.env.ALIYUN_ACCESS_KEY_ID;
const sk = process.env.ALIYUN_ACCESS_KEY_SECRET;

if (!ak || !sk) {
  throw new Error('Set ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET before running this script.');
}

const client = new OSS({
  region: 'oss-cn-hongkong',
  accessKeyId: ak,
  accessKeySecret: sk,
  bucket: 'schoolsystem-global-001'
});

async function bindCert() {
  try {
    const cert = fs.readFileSync('cert.pem', 'utf8');
    const key = fs.readFileSync('key.pem', 'utf8');
    
    console.log('Binding certificate to schoolsystem.com.cn...');
    
    const result = await client.putCname('schoolsystem.com.cn', {
      certificate: {
        cert: cert,
        key: key,
        force: true // Enable Force HTTPS
      }
    });
    
    console.log('Certificate bound successfully!');
    console.log(result);
  } catch (err) {
    console.error('Failed to bind certificate:', err.message || err);
  }
}

bindCert();
