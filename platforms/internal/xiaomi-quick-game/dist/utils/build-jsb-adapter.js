Object.defineProperty(exports, "__esModule", { value: true });
exports.build = undefined;
const babelify = require("babelify");
const browserify = require("browserify");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
async function build(e) {
  if (!e.root) {
    throw new Error("Please specify the jsbAdapter path");
  }
  await createBundle(
    path_1.join(e.root, "./engine/index.js"),
    path_1.join(e.dist, "./jsb-engine.js")
  );
}
function createBundle(e, n, s) {
  return new Promise((t, i) => {
    let r = browserify(e);

    if (s) {
      s.forEach((e) => {
        r.exclude(e);
      });
    }

    fs_extra_1.ensureDirSync(path_1.dirname(n));

    r.transform(babelify, { presets: [require("@babel/preset-env")] }).bundle(
      (e, r) => {
        if (e) {
          console.error(e);
          i(e);
        } else {
          fs_extra_1.writeFileSync(n, r, "utf8");
          t();
        }
      }
    );
  });
}
exports.build = build;
