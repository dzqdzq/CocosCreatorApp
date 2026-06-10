Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterBuild = undefined;
exports.onAfterInit = undefined;
exports.throwError = undefined;
const util_1 = require("./util");
async function onAfterInit(t, r) {
  var e = util_1.getNameFromConfig();

  if (e) {
    t.packages.android.packageName = e;
  }
}
async function onAfterBuild(t, r) {}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onAfterBuild = onAfterBuild;
