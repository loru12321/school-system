const Domain20180129 = require('@alicloud/domain20180129');
const OpenApi = require('@alicloud/openapi-client');

const ak = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || 'YOUR_AK';
const sk = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || 'YOUR_SK';

const config = new OpenApi.Config({
  accessKeyId: ak,
  accessKeySecret: sk,
});
config.endpoint = 'domain.aliyuncs.com';
const client = new Domain20180129.default(config);

async function main() {
  try {
    const req = new Domain20180129.SaveSingleTaskForUpdatingDnsHostRequest({
      instanceId: '', // usually optional if domainName is provided
      domainName: 'schoolsystem.com.cn',
      dnsServer: ['dns1.hichina.com', 'dns2.hichina.com'],
    });
    const res = await client.saveSingleTaskForUpdatingDnsHost(req);
    console.log('Successfully requested DNS Server update:', res.body);
  } catch (err) {
    console.error('Failed to update DNS servers:', err.message || err);
  }
}

main();
