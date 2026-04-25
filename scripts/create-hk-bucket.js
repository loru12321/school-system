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
});

const bucketName = 'schoolsystem-global-001';

async function createBucket() {
  try {
    console.log(`Creating bucket ${bucketName} in Hong Kong...`);
    await client.putBucket(bucketName);
    console.log(`Bucket ${bucketName} created.`);
  } catch (e) {
    if (e.code === 'BucketAlreadyExists') {
      console.log(`Bucket ${bucketName} already exists.`);
    } else {
      console.error('Error creating bucket:', e.message);
      process.exit(1);
    }
  }
}

createBucket();
