Object.defineProperty(exports, "__esModule", { value: true });

exports.findXcodeProjects = undefined;
exports.getBrowserslistQuery = undefined;
exports.outputJSBAdapter = undefined;

const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
async function outputJSBAdapter(t, e) {
  var e = (e || {}).targets;

  var r = (await Editor.Message.request("engine", "query-engine-info"))
    .typescript.path;

  var s = path_1.join(r, "jsb-adapter/builtin/index.js");
  var r = path_1.join(r, "jsb-adapter/engine/index.js");

  await Build.Utils.createBundle(
    s,
    path_1.join(t, "jsb-adapter", "jsb-builtin.js"),
    { targets: e }
  );

  await Build.Utils.createBundle(
    r,
    path_1.join(t, "jsb-adapter", "jsb-engine.js"),
    { targets: e }
  );
}
async function getBrowserslistQuery(t) {
  t = path_1.join(t, ".browserslistrc");
  let e;
  try {
    e = await fs_extra_1.readFile(t, "utf8");
  } catch (t) {
    return;
  }
  t = ((t) => {
    var e = [];
    for (const s of t.split("\n")) {
      var r = s.indexOf("#");
      var r = (r < 0 ? s : s.substr(0, r)).trim();

      if (r.length !== 0) {
        e.push(r);
      }
    }
    return e;
  })(e);
  if (t.length !== 0) {
    return t.join(" or ");
  }
}
function findXcodeProjects(t) {
  return fs_extra_1.readdirSync(t).filter((t) => t.endsWith(".xcodeproj"));
}
exports.outputJSBAdapter = outputJSBAdapter;
exports.getBrowserslistQuery = getBrowserslistQuery;
exports.findXcodeProjects = findXcodeProjects;
