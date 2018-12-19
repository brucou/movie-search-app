import './test-S0'
QUnit.dump.maxDepth = 20;


// to get string version without loosing undefined through JSON conversion
// JSON.stringify(hash, (k, v) => (v === undefined) ? '__undefined' : v)
//   .replace('"__undefined"', 'undefined')
