const acme = require('acme-client');
const Alidns20150109 = require('@alicloud/alidns20150109');
const OpenApi = require('@alicloud/openapi-client');

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

async function challengeCreateFn(authz, challenge, keyAuthorization) {
  if (challenge.type === 'dns-01') {
    const dnsRecordValue = keyAuthorization;
    const dnsRecordName = `_acme-challenge.${authz.identifier.value.replace('*.', '')}`;
    const domainName = 'schoolsystem.com.cn';
    const rr = dnsRecordName.replace(`.${domainName}`, '');

    console.log(`Creating DNS TXT record: ${dnsRecordName} with value: ${dnsRecordValue}`);
    
    const addReq = new Alidns20150109.AddDomainRecordRequest({
      domainName,
      RR: rr,
      type: 'TXT',
      value: dnsRecordValue,
    });
    await dnsClient.addDomainRecord(addReq);
    
    console.log('DNS record created. Waiting 30s for propagation...');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

async function challengeRemoveFn(authz, challenge, keyAuthorization) {
  if (challenge.type === 'dns-01') {
    const dnsRecordName = `_acme-challenge.${authz.identifier.value.replace('*.', '')}`;
    const domainName = 'schoolsystem.com.cn';
    const rr = dnsRecordName.replace(`.${domainName}`, '');

    console.log(`Removing DNS TXT record: ${dnsRecordName}`);
    
    const describeReq = new Alidns20150109.DescribeDomainRecordsRequest({
      domainName,
      keyWord: rr,
      type: 'TXT',
    });
    const res = await dnsClient.describeDomainRecords(describeReq);
    const record = res.body.domainRecords.record.find(r => r.rr === rr);
    
    if (record) {
      const deleteReq = new Alidns20150109.DeleteDomainRecordRequest({
        recordId: record.recordId,
      });
      await dnsClient.deleteDomainRecord(deleteReq);
      console.log('DNS record removed.');
    }
  }
}

async function main() {
  const client = new acme.Client({
    directoryUrl: acme.directory.letsencrypt.production,
    accountKey: await acme.crypto.createPrivateKey(),
  });

  const [key, csr] = await acme.crypto.createCsr({
    commonName: 'schoolsystem.com.cn',
    altNames: ['schoolsystem.com.cn'],
  });

  console.log('Requesting certificate...');
  const cert = await client.auto({
    csr,
    termsOfServiceAgreed: true,
    preferredChallenge: 'dns-01',
    challengeCreateFn,
    challengeRemoveFn,
  });

  console.log('Certificate generated successfully!');
  const fs = require('fs');
  fs.writeFileSync('cert.pem', cert);
  fs.writeFileSync('key.pem', key);
  console.log('Saved cert.pem and key.pem');
}

main().catch(err => {
  console.error('Error generating certificate:', err);
});
