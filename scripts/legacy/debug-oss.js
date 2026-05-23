const OSS = require('ali-oss');
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

const allMethods = Object.keys(Object.getPrototypeOf(client));
console.log('CNAME methods:', allMethods.filter(k => k.toLowerCase().includes('cname')));
