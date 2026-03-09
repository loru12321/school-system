const https = require('https');

const options = {
  hostname: 'okwcciujnfvobbwaydiv.supabase.co',
  port: 443,
  path: '/rest/v1/system_data?select=key,updated_at',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4',
    'Authorization': 'Bearer sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Keys in Supabase:');
      if (Array.isArray(json)) {
        json.forEach(item => console.log(`- ${item.key} (${item.updated_at})`));
      } else {
        console.log(json);
      }
    } catch (e) {
      console.log('Raw output:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
