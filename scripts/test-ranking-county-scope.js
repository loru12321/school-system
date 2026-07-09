const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const normalizationSource = fs.readFileSync(path.join(root, 'public/assets/js/school-normalization-runtime.js'), 'utf8');
const createRankingService = require(path.join(root, 'public/assets/js/ranking-data-service-runtime.js'));

const sandbox = {
  window: {
    __SCHOOL_NORMALIZATION_RUNTIME_PATCHED__: false,
    SYS_VARS: { indicator: { ind1: '', ind2: '' }, targets: {}, schoolAliases: [] },
    RAW_DATA: [],
    SCHOOLS: {},
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    }
  },
  console
};
sandbox.window.window = sandbox.window;
sandbox.SCHOOLS = sandbox.window.SCHOOLS;
sandbox.RAW_DATA = sandbox.window.RAW_DATA;
sandbox.TARGETS = {};
sandbox.MY_SCHOOL = '';
sandbox.localStorage = sandbox.window.localStorage;
vm.createContext(sandbox);
vm.runInContext(normalizationSource, sandbox, { filename: 'school-normalization-runtime.js' });

const rootApi = sandbox.window;
const ranking = createRankingService(rootApi);

const townshipOnlySchools = [
  '商老庄中学',
  '大羊中学',
  '州城中学',
  '彭集中学',
  '戴庙中学',
  '接山中学',
  '斑鸠店镇中',
  '新湖中学',
  '旧县中心小学',
  '梯门镇中学',
  '沙河站中学',
  '老湖镇中学',
  '银山中学',
  '银山实验'
];

const townshipDirectNames = Array.from(rootApi.getCountyDirectSchoolNames(townshipOnlySchools));
assert.strictEqual(
  townshipDirectNames.length,
  0,
  `旧县中心小学 should normalize to the township 旧县中学, not a county-direct school: ${townshipDirectNames.join(', ')}`
);

const townshipRows = townshipOnlySchools.map((school, index) => ({
  school,
  name: `学生${index}`,
  total: 600 - index,
  countyRank: index + 1,
  ranks: { total: { county: index + 1, township: index + 1 } }
}));

assert.strictEqual(
  ranking.hasCountyScope(townshipRows, { rows: townshipRows }),
  false,
  'township-only multi-school uploads must not be treated as county-scope data'
);
assert.strictEqual(
  ranking.getStudentRankValue(townshipRows[0], 'total', 'county', { rows: townshipRows }),
  '-',
  'stale county rank values should be hidden when the current dataset has no county-direct schools'
);

const countyRows = townshipRows.concat({
  school: '东平县实验中学',
  name: '县直学生',
  total: 610,
  countyRank: 1,
  ranks: { total: { county: 1 } }
});

assert.strictEqual(
  ranking.hasCountyScope(countyRows, { rows: countyRows }),
  true,
  'datasets with a real county-direct school should enable county scope'
);
assert.strictEqual(
  ranking.getStudentRankValue(countyRows[countyRows.length - 1], 'total', 'county', { rows: countyRows }),
  1,
  'county ranks should remain visible for real county-scope datasets'
);

console.log('ranking county scope tests passed');
