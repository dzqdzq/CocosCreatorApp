const gift = require("@cocos/tfig");
const ps = require("path");
const fs = require("fs-extra");
const JSON5 = require("json5");
function absolutePath(e) {
  return ps.join(__dirname, e).replace(/\\/g, "/");
}
function genModuleComment(e) {
  let t = `/**
`;

  e.split("\n").forEach((e) => {
    t += ` * ${e}
`;
  });

  t += ` **/
`;

  return t;
}
function rebaseRelativePath(e, t, i) {
  t = ps.join(ps.dirname(t), e);
  return ps.relative(ps.dirname(i), t).replace(/\\/g, "/");
}
const configFilePath = absolutePath("../cce-module.jsonc");
const configFileDir = ps.dirname(configFilePath);
const moduleMap = JSON5.parse(fs.readFileSync(configFilePath, "utf8"));
for (const [j, k] of Object.entries(moduleMap)) {
  const l = ps.join(configFileDir, k.types);

  const m = gift.bundle({
    input: [l],
    entries: { [j]: l },
    output: ps.join(
      __dirname,
      "../editor-export/",
      j.replace(/\//g, ".") + ".d.ts"
    ),
  });

  m.groups.forEach((e) => {
    fs.outputFileSync(e.path, genModuleComment(k.description) + e.code, "utf8");
  });
}
