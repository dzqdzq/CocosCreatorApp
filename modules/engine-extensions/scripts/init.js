const { existsSync, readFileSync, writeFileSync } = require("fs");
const join = require("path").join;
const defaultConfig = {};
function fillConfig(n) {
  let i = false;

  if (
    typeof n.enginePath != "string" ||
    (defaultConfig.enginePath && defaultConfig.enginePath !== n.enginePath)
  ) {
    n.enginePath = defaultConfig.enginePath || "";
    i = true;
  }

  return i;
}
process.argv.forEach((n) => {
  n = n.split("=");

  if (n.length >= 2) {
    defaultConfig[n[0].substr(2)] = n[1];
  }
});
const configFile = join(__dirname, "../config.json");
if (existsSync(configFile)) {
  try {
    const e = readFileSync(configFile);
    const f = JSON.parse(e);
    const g = fillConfig(f);

    if (g) {
      writeFileSync(configFile, JSON.stringify(f, null, 4));
    }
  } catch (n) {
    console.error("config.json 格式错误，请检查文件内容");
    console.error(n);
  }
} else {
  const i = {};
  fillConfig(i);
  writeFileSync(configFile, JSON.stringify(i, null, 4));
}
console.log("初始化配置成功");
