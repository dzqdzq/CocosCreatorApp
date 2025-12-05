const _log = console.log;
const _debug = console.debug;

console.debug = console.log = function() {};

const modsMgr = require('cc/mods-mgr');
const ccm = modsMgr.syncImport('cc');
module.exports = ccm;

console.log = _log;
console.debug = _debug;
