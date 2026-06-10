Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;

const { join } = require("path");

const type2UI = {
  string: "ui-input",
  number: "ui-num-input",
  boolean: "ui-checkbox",
};

const ReadonlyKeyList = [
  "SUPPORT_TEXTURE_FORMATS",
  "KEY",
  "RAD",
  "DEG",
  "FLT_EPSILON",
  "ORIENTATION_PORTRAIT",
  "ORIENTATION_PORTRAIT_UPSIDE_DOWN",
  "ORIENTATION_LANDSCAPE",
  "ORIENTATION_LANDSCAPE_LEFT",
  "ORIENTATION_LANDSCAPE_RIGHT",
  "ORIENTATION_AUTO",
  "REPEAT_FOREVER",
];

async function run() {
  var e = (await Editor.Message.request("engine", "query-engine-info"))
    .typescript;

  const t = require(join(
    e.path,
    "bin/.cache/dev/cocos/core/platform/macro"
  )).macro;

  const i = { label: "Macro Config", content: {} };
  const r = {};
  e = Editor.Package.getPackages().find((e) => e.name === "project");

  Object.keys(t).forEach((e) => {
    var n;
    var o;

    if (!ReadonlyKeyList.includes(e)) {
      n = t[e];

      ["string", "number", "boolean"].includes((o = typeof n)) &&
        ((r["macroConfig." + e] = { label: e, default: n, description: e }),
        (i.content["macroConfig." + e] = { ui: type2UI[o] }));
    }
  });

  if (e && e.info.contributions) {
    Object.assign(e.info.contributions.profile.project, r);
    e.info.contributions.project.macroConfig = i;
  }
}
