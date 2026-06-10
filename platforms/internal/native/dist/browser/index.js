Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = undefined;
exports.load = undefined;
exports.methods = undefined;
const index_1 = require("../builder/native-utils/index");
function load() {}
function unload() {}
exports.methods = { compileJsbAdapter: index_1.compileJsbAdapter };
exports.load = load;
exports.unload = unload;
