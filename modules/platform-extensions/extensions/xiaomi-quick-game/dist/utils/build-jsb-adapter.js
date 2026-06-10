Object.defineProperty(exports, "__esModule", { value: true });
exports.build = undefined;
const path_1 = require("path");
async function build(e) {
  if (!e.root) {
    throw new Error("Please specify the jsbAdapter path");
  }
  var t = path_1.join(e.root, "./engine/index.js");
  var e = path_1.join(e.dist, "./jsb-engine.js");
  await Build.Utils.createBundle(t, e);
}
exports.build = build;
