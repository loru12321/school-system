const acme = require('acme-client');
const Alidns20150109 = require('@alicloud/alidns20150109');
const OpenApi = require('@alicloud/openapi-client');
const fs = require('fs');

const ak = process.env.ALIYUN_ACCESS_KEY_ID;
const sk = process.env.ALIYUN_ACCESS_KEY_SECRET;

if (!ak || !sk) {
  throw new Error('Set ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET before running this script.');
}

const dnsConfig = new OpenApi.Config({
  accessKeyId: ak,
  accessKeySecret: sk,
});
dnsConfig.endpoint = 'alidns.aliyuncs.com';
const dnsClient = new Alidns20150109.default(dnsConfig);

async function main() {
  const client = new acme.Client({
    directoryUrl: acme.directory.letsencrypt.production,
    accountKey: await acme.crypto.createPrivateKey(),
  });

  console.log('Creating account...');
  await client.createAccount({
    termsOfServiceAgreed: true,
    contact: ['mailto:admin@schoolsystem.com.cn'],
  });

  console.log('Creating order...');
  const order = await client.createOrder({
    identifiers: [{ type: 'dns', value: 'schoolsystem.com.cn' }],
  });

  const authorizations = await client.getAuthorizations(order);
  const authz = authorizations[0];
  const challenge = authz.challenges.find(c => c.type === 'dns-01');

  if (!challenge) {
    throw new Error('DNS-01 challenge not found');
  }

  const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
  const dnsRecordValue = keyAuthorization;
  const dnsRecordName = `_acme-challenge`; // Relative to schoolsystem.com.cn
  
  console.log(`Adding DNS TXT record: ${dnsRecordName} with value: ${dnsRecordValue}`);
  
  const addReq = new Alidns20150109.AddDomainRecordRequest({
    domainName: 'schoolsystem.com.cn',
    RR: dnsRecordName,
    type: 'TXT',
    value: dnsRecordValue,
  });
  await dnsClient.addDomainRecord(addReq);
  
  console.log('Waiting 60s for DNS propagation...');
  await new Promise(resolve => setTimeout(resolve, 60000));

  console.log('Verifying challenge...');
  await client.completeChallenge(challenge);
  await client.waitForValidStatus(challenge);

  console.log('Finalizing order...');
  const [key, csr] = await acme.crypto.createCsr({
    commonName: 'schoolsystem.com.cn',
  });
  const finalizedOrder = await client.finalizeOrder(order, csr);
  const cert = await client.getCertificate(finalizedOrder);

  console.log('Certificate generated!');
  fs.writeFileSync('cert.pem', cert);
  fs.writeFileSync('key.pem', key);
  
  // Cleanup
  console.log('Cleaning up DNS record...');
  const describeReq = new Alidns20150109.DescribeDomainRecordsRequest({
    domainName: 'schoolsystem.com.cn',
    keyWord: dnsRecordName,
    type: 'TXT',
  });
  const res = await dnsClient.describeDomainRecords(describeReq);
  const record = res.body.domainRecords.record.find(r => r.rr === dnsRecordName);
  if (record) {
    await dnsClient.deleteDomainRecord(new Alidns20150109.DeleteDomainRecordRequest({ recordId: record.recordId }));
  }
}

main().catch(err => {
  console.error('Error:', err);
});
