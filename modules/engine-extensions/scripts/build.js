const { join, dirname } = require("path");

const {
  readFileSync,
  existsSync,
  writeFileSync,
  readdirSync,
  ensureDirSync,
} = require("fs-extra");

const execSync = require("child_process").execSync;
const builder = require("@editor/build");
const configFile = join(__dirname, "../config.json");

if (!existsSync(configFile)) {
  console.error("没有找到 config.json，无法正常构建");
  process.exit(-1);
}

try {
  const a = readFileSync(configFile);
  const b = JSON.parse(a);
  let e = "";

  e =
    (e += `/// <reference path="${join(
      b.enginePath,
      "./bin/.declarations/cc.d.ts"
    )}"/>
`) +
    `/// <reference path="${join(
      b.enginePath,
      "/bin/.declarations/cc.editor.d.ts"
    )}"/>
`;

  writeFileSync(join(__dirname, "../@types/cc.d.ts"), e);
} catch (e) {
  console.error("config.json 格式错误");
  console.error(e);
  process.exit(-1);
}
function generateMetaSchema() {
  var e = join(__dirname, "../extensions/engine-extends");
  var n = join(e, "source", "handler", "meta-schemas", "glTF.meta.ts");
  var e = join(e, "dist", "meta-schemas", "glTF.meta.json");
  ensureDirSync(dirname(e));
  execSync(`npx typescript-json-schema ${n} GlTFUserData -o ${e} --required`);
}

if (process.argv.some((e) => e.startsWith("--only-dts"))) {
  process.exit(0);
}

builder.scan(join(__dirname, "../extensions"));

builder.config({
  entry: ".workflow.build.js",
  config: join(__dirname, ".build-cache.json"),
});

builder.executeTask(["tsc", "lessc", "file", "compress"]);
console.log("Start generate meta-schemas...");
generateMetaSchema();
console.log("Generate meta-schemas success");
