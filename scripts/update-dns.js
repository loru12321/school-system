const Alidns20150109 = require('@alicloud/alidns20150109');
const OpenApi = require('@alicloud/openapi-client');

const ak = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || 'YOUR_AK';
const sk = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || 'YOUR_SK';

const config = new OpenApi.Config({
  accessKeyId: ak,
  accessKeySecret: sk,
});
config.endpoint = 'alidns.cn-hangzhou.aliyuncs.com';
const client = new Alidns20150109.default(config);

const domainName = 'schoolsystem.com.cn';
const targetCname = 'schoolsystem-web-app-001.oss-cn-hangzhou.aliyuncs.com';

async function updateOrCreateRecord(rr) {
  try {
    const describeReq = new Alidns20150109.DescribeDomainRecordsRequest({
      domainName: domainName,
      RRKeyWord: rr,
    });
    const res = await client.describeDomainRecords(describeReq);
    
    // Find exact match for RR
    const exactMatch = res.body.domainRecords.record.find(r => r.RR === rr);
    
    if (exactMatch) {
      console.log(`Found existing record for ${rr}.${domainName} (${exactMatch.type} -> ${exactMatch.value}). Updating...`);
      const updateReq = new Alidns20150109.UpdateDomainRecordRequest({
        recordId: exactMatch.recordId,
        RR: rr,
        type: 'CNAME',
        value: targetCname,
      });
      await client.updateDomainRecord(updateReq);
      console.log(`Successfully updated ${rr} to CNAME ${targetCname}`);
    } else {
      console.log(`No existing record found for ${rr}.${domainName}. Adding...`);
      const addReq = new Alidns20150109.AddDomainRecordRequest({
        domainName: domainName,
        RR: rr,
        type: 'CNAME',
        value: targetCname,
      });
      await client.addDomainRecord(addReq);
      console.log(`Successfully added ${rr} CNAME ${targetCname}`);
    }
  } catch (error) {
    console.error(`Error processing ${rr}:`, error.message || error);
  }
}

async function main() {
  console.log('Starting DNS update for schoolsystem.com.cn...');
  await updateOrCreateRecord('@');
  await updateOrCreateRecord('www');
  console.log('DNS update process finished.');
}

main();
