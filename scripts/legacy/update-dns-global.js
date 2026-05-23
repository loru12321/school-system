#!/usr/bin/env node
const Alidns20150109 = require('@alicloud/alidns20150109');
const OpenApi = require('@alicloud/openapi-client');

const DOMAIN = process.env.DNS_DOMAIN || 'schoolsystem.com.cn';
const TARGET_RECORDS = [
  { rr: '@', type: 'A', value: '104.21.47.24' },
  { rr: '@', type: 'A', value: '172.67.170.16' },
  { rr: 'www', type: 'A', value: '104.21.47.24' },
  { rr: 'www', type: 'A', value: '172.67.170.16' }
];

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running this DNS update script.`);
  }
  return value;
}

function createClient() {
  return new Alidns20150109.default(new OpenApi.Config({
    accessKeyId: requireEnv('ALIBABA_CLOUD_ACCESS_KEY_ID'),
    accessKeySecret: requireEnv('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
    endpoint: process.env.ALIBABA_CLOUD_DNS_ENDPOINT || 'alidns.cn-hangzhou.aliyuncs.com'
  }));
}

async function listRecords(client) {
  const records = [];
  let pageNumber = 1;
  while (true) {
    const response = await client.describeDomainRecords({
      domainName: DOMAIN,
      pageNumber,
      pageSize: 100
    });
    const pageRecords = response?.body?.domainRecords?.record || [];
    records.push(...pageRecords);
    const total = Number(response?.body?.totalCount || pageRecords.length);
    if (records.length >= total || !pageRecords.length) break;
    pageNumber += 1;
  }
  return records;
}

function matchesTarget(record, target) {
  return record.RR === target.rr
    && String(record.Type || '').toUpperCase() === target.type
    && record.Value === target.value;
}

async function main() {
  const client = createClient();
  const records = await listRecords(client);
  const targetKeys = new Set(TARGET_RECORDS.map((item) => `${item.rr}|${item.type}|${item.value}`));

  for (const record of records) {
    if (record.RR !== '@' && record.RR !== 'www') continue;
    const key = `${record.RR}|${String(record.Type || '').toUpperCase()}|${record.Value}`;
    if (targetKeys.has(key)) continue;
    await client.deleteDomainRecord({ recordId: record.RecordId });
    console.log(`Deleted stale DNS record: ${record.RR} ${record.Type} ${record.Value}`);
  }

  const latestRecords = await listRecords(client);
  for (const target of TARGET_RECORDS) {
    if (latestRecords.some((record) => matchesTarget(record, target))) continue;
    await client.addDomainRecord({
      domainName: DOMAIN,
      RR: target.rr,
      type: target.type,
      value: target.value,
      TTL: 600
    });
    console.log(`Created DNS record: ${target.rr} ${target.type} ${target.value}`);
  }

  console.log('DNS updated to Cloudflare edge A records.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
