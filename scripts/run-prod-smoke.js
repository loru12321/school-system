const DEFAULT_PROD_SMOKE_URL = 'https://schoolsystem.com.cn/';
const rawSmokeUrl = process.env.SMOKE_URL || DEFAULT_PROD_SMOKE_URL;
const normalizedSmokeUrl = rawSmokeUrl.endsWith('/') ? rawSmokeUrl : `${rawSmokeUrl}/`;

if (!/^https:\/\/(www\.)?schoolsystem\.com\.cn\/$/i.test(normalizedSmokeUrl)) {
  throw new Error(`Refusing to run production smoke against an unexpected URL: ${rawSmokeUrl}`);
}

process.env.SMOKE_URL = normalizedSmokeUrl;
require('./smoke-all-modules.js');
