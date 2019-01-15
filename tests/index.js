import './test-S0'
import './test-S1'
import './test-S2'
import './test-S4'
QUnit.dump.maxDepth = 20;
QUnit.onUnhandledRejection = ()=>{};

// to get string version without loosing undefined through JSON conversion
// JSON.stringify(hash, (k, v) => (v === undefined) ? '__undefined' : v)
//   .replace('"__undefined"', 'undefined')
