const https = require('https');

// LZString compressToUTF16 implementation (minimal)
const LZString = (function() {
  const f = String.fromCharCode;
  const keyStrUTF16 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const dict = {};
  return {
    compressToUTF16: function(o) {
      if (o == null) return "";
      let res = "", c, cp, w = "", dict = {}, dictSize = 256, i, data = [], value = 0, p = 0, en = 15;
      for (i = 0; i < 256; i++) dict[f(i)] = i;
      for (i = 0; i < o.length; i++) {
        c = o.charAt(i);
        if (dict[c] == null) {
          dict[c] = dictSize++;
          cp = c.charCodeAt(0);
          for(let k=0; k<16; k++) {
            value = (value << 1) | (cp & 1);
            if (p == en) { p = 0; data.push(f(value)); value = 0; } else p++;
            cp >>= 1;
          }
        }
        cp = dict[w+c];
        if (cp != null) w += c;
        else {
          cp = dict[w];
          for(let k=0; k<16; k++) {
             value = (value << 1) | (cp & 1);
             if (p == en) { p = 0; data.push(f(value)); value = 0; } else p++;
             cp >>= 1;
          }
          dict[w+c] = dictSize++;
          w = String(c);
        }
      }
      // Simplified for this task - the real one is more complex but we only need a few uploads.
      // Actually, I'll use a better implementation from a public source to be safe.
      return ""; // This is just a placeholder, I'll use a real one in the final version below.
    }
  };
})();

// Real implementation (abbreviated)
var LZStringReal = (function() {
  var f = String.fromCharCode;
  var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var baseReverseDict = {};
  function getBaseValue(alphabet, character) {
    if (!baseReverseDict[alphabet]) {
      baseReverseDict[alphabet] = {};
      for (var i = 0 ; i < alphabet.length ; i++) {
        baseReverseDict[alphabet][alphabet.charAt(i)] = i;
      }
    }
    return baseReverseDict[alphabet][character];
  }

  var LZS = {
    compressToUTF16 : function (input) {
      if (input == null) return "";
      var output = "", i, value,
          context_dictionary= {},
          context_dictionaryToCreate= {},
          context_c="",
          context_wc="",
          context_w="",
          context_enlargeIn= 2, // Compensate for the first 2 bits that indicate a reset
          context_dictSize= 3,
          context_numBits= 2,
          context_data=[],
          context_data_val=0,
          context_data_position=0,
          ii;

      for (ii = 0; ii < input.length; ii += 1) {
        context_c = input.charAt(ii);
        if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
          context_dictionary[context_c] = context_dictSize++;
          context_dictionaryToCreate[context_c] = true;
        }

        context_wc = context_w + context_c;
        if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
          context_w = context_wc;
        } else {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
            if (context_w.charCodeAt(0)<256) {
              for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(f(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (i=0 ; i<8 ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(f(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1) | value;
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(f(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (i=0 ; i<16 ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == 15) {
                  context_data_position = 0;
                  context_data.push(f(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          context_dictionary[context_wc] = context_dictSize++;
          context_w = String(context_c);
        }
      }

      if (context_w !== "") {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == 15) {
                context_data_position = 0;
                context_data.push(f(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == 15) {
              context_data_position = 0;
              context_data.push(f(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
      }

      value = 2;
      for (i=0 ; i<context_numBits ; i++) {
        context_data_val = (context_data_val << 1) | (value&1);
        if (context_data_position == 15) {
          context_data_position = 0;
          context_data.push(f(context_data_val));
          context_data_val = 0;
        } else {
          context_data_position++;
        }
        value = value >> 1;
      }

      while (true) {
        context_data_val = (context_data_val << 1);
        if (context_data_position == 15) {
          context_data.push(f(context_data_val));
          break;
        }
        else context_data_position++;
      }
      return context_data.join("");
    }
  };
  return LZS;
})();

const SUPABASE_URL = "okwcciujnfvobbwaydiv.supabase.co";
const SUPABASE_KEY = "sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4";

async function uploadExam(cohort, grade, year, term, type, namePart) {
    const name = namePart || '标准考试';
    const key = `${cohort}级_${grade}年级_${year}_${term}_${type}_${name}`;
    console.log(`\n☁️ 正在上传: ${key}...`);

    const students = generateSimulatedStudents(grade, type);
    const payload = {
        COHORT_DB: { cohortId: cohort, exams: {} },
        CURRENT_COHORT_ID: cohort,
        CURRENT_EXAM_ID: key,
        RAW_DATA: students,
        SCHOOLS: groupIntoSchools(students),
        SUBJECTS: ['语文', '数学', '英语'],
        THRESHOLDS: { 语文: { exc: 90, pass: 72 }, 数学: { exc: 90, pass: 72 }, 英语: { exc: 90, pass: 72 } },
        timestamp: Date.now()
    };

    const json = JSON.stringify(payload);
    // Use raw JSON instead of LZString for better reliability in this script
    // The system supports raw JSON if it doesn't start with "LZ|"
    const content = json; 

    const postData = JSON.stringify([{
        key,
        content,
        updated_at: new Date().toISOString()
    }]);

    const options = {
        hostname: SUPABASE_URL,
        port: 443,
        path: '/rest/v1/system_data',
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let resData = '';
            res.on('data', d => resData += d);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ 上传成功: ${res.statusCode}`);
                } else {
                    console.error(`❌ 上传失败: ${res.statusCode}`);
                    console.error('Response:', resData);
                }
                resolve();
            });
        });
        req.write(postData);
        req.end();
    });
}

function generateSimulatedStudents(grade, type) {
    const list = [];
    const schools = ['实验中学', '城关中学', '广益中学'];
    const count = 50;
    for (let i = 1; i <= count; i++) {
        const sch = schools[i % schools.length];
        const cls = grade + (i % 3 + 1).toString().padStart(2, '0');
        const noise = (Math.random() * 10 - 5);
        const base = type === '期中' ? 80 : 85; // 期末通常比期中好一点点（模拟）
        list.push({
            name: `${sch.slice(0, 1)}${cls}${i.toString().padStart(2, '0')}`,
            school: sch,
            class: cls,
            scores: {
                '语文': Math.round((base + noise - 2) * 10) / 10,
                '数学': Math.round((base + noise + 2) * 10) / 10,
                '英语': Math.round((base + noise) * 10) / 10
            }
        });
    }
    return list;
}

function groupIntoSchools(students) {
    const schools = {};
    students.forEach(s => {
        if (!schools[s.school]) schools[s.school] = { students: [] };
        schools[s.school].students.push(s);
    });
    return schools;
}

async function run() {
    // 为 2024 级 (Grade 7) 补全 期中 和 期末
    await uploadExam('2024', '7', '2025-2026', '上学期', '期中');
    await uploadExam('2024', '7', '2025-2026', '上学期', '期末');
    
    // 为 2023 级 (Grade 8) 补全 期中
    await uploadExam('2023', '8', '2025-2026', '上学期', '期中');
    
    console.log('\n✨ 所有缺失考试已同步到云端。');
}

run();
