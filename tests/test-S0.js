QUnit.module("Test set up", {});
console.log('QUnit', QUnit)
QUnit.test("Qunit is installed", function exec_test(assert) {

  assert.deepEqual(true, true, `QUnit is working`)
});
