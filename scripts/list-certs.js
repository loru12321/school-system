const Cas20200407 = require('@alicloud/cas20200407');
const OpenApi = require('@alicloud/openapi-client');

const ak = process.env.ALIYUN_ACCESS_KEY_ID;
const sk = process.env.ALIYUN_ACCESS_KEY_SECRET;

if (!ak || !sk) {
  throw new Error('Set ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET before running this script.');
}

const config = new OpenApi.Config({
  accessKeyId: ak,
  accessKeySecret: sk,
});
config.endpoint = 'cas.aliyuncs.com';
const client = new Cas20200407.default(config);

async function listCerts() {
  try {
    const req = new Cas20200407.DescribeUserCertificateListRequest({});
    const res = await client.describeUserCertificateList(req);
    console.log('--- USER CERTIFICATES ---');
    if (res.body.certificateList && res.body.certificateList.length > 0) {
      res.body.certificateList.forEach(cert => {
        console.log(`- Domain: ${cert.common}, Name: ${cert.name}, ID: ${cert.id}, End: ${cert.endDate}`);
      });
    } else {
      console.log('No user certificates found.');
    }
  } catch (err) {
    console.error('Failed to list certificates:', err.message || err);
  }
}

listCerts();
