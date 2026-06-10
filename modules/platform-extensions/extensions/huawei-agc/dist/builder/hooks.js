Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onBeforeBuild = onBeforeBuild;
exports.onAfterBuild = onAfterBuild;

const { getNameFromConfig } = require("./util");

async function onBeforeBuild(o, e) {
  if (o.polyfills) {
    o.polyfills.asyncFunctions = false;
  }

  var r = getNameFromConfig();

  if (r) {
    o.packages.android.packageName = r;
  }
}
async function onAfterBuild(o, e) {}
exports.throwError = true;
