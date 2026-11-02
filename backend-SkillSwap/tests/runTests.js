process.env.NODE_ENV = 'test';

const suites = [];
let currentSuite = null;

global.describe = (name, fn) => {
  currentSuite = { name, beforeEachFns: [], tests: [] };
  suites.push(currentSuite);
  fn();
  currentSuite = null;
};

global.beforeEach = (fn) => {
  if (currentSuite) currentSuite.beforeEachFns.push(fn);
};

global.test = (name, fn) => {
  if (currentSuite) currentSuite.tests.push({ name, fn });
};

global.expect = (actual) => ({
  toBe(expected) {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
    }
  },
  toBeDefined() {
    if (actual === undefined) {
      throw new Error(`Expected value to be defined, received undefined`);
    }
  }
});

require('./escrow.test.js');
require('./domainFilter.test.js');

(async () => {
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    console.log(`\nPASS  ${suite.name}`);
    for (const t of suite.tests) {
      try {
        for (const hook of suite.beforeEachFns) {
          await hook();
        }
        await t.fn();
        passed++;
        console.log(`  ✓ ${t.name}`);
      } catch (err) {
        failed++;
        console.error(`  ✕ ${t.name}`);
        console.error(`    ${err.message}`);
      }
    }
  }

  console.log(`\nTest Suites: ${failed === 0 ? '2 passed, 2 total' : '1 failed'}`);
  console.log(`Tests:       ${passed} passed, ${passed + failed} total`);
  process.exit(failed === 0 ? 0 : 1);
})();

