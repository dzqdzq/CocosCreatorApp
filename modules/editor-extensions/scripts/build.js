const rollup = require("rollup").rollup;
const { join, dirname } = require("path");
const { readFileSync, existsSync, writeFileSync } = require("fs");
const getTaskConfig = require("./rollup-utils/index").getTaskConfig;
const configFile = join(__dirname, "../config.json");

if (!existsSync(configFile)) {
  console.error("没有找到 config.json，无法正常构建");
  process.exit(-1);
}

const winCmd = {
  git: "git",
  npm: "npm.cmd",
  tsc: "tsc.cmd",
  lessc: "lessc.cmd",
};

const macCmd = { git: "git", npm: "npm", tsc: "tsc", lessc: "lessc" };
const cmd = process.platform === "win32" ? winCmd : macCmd;
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

if (process.argv.some((e) => e.startsWith("--only-dts"))) {
  process.exit(0);
}

const builder = require("@editor/build");
builder.scan(join(__dirname, "../extensions"));

builder.config({
  entry: ".workflow.build.js",
  config: join(__dirname, ".build-cache.json"),
});

builder.register("rollup", {
  title: "编译 Typescript(Rollup)",
  timeLength: 8,
  stateLength: 7,
  parallel: 5,
  async execute(e) {
    if (typeof e == "string") {
      var r = e;
      var t = { state: "null", info: dirname(r) };
      e = [];
      var i = require(r);
      if (i.rollup) {
        t.state = "success";

        if ((e = i.rollup())) {
          try {
            var s = dirname(r);
            for (const u of e) {
              join(dirname(r), u.sourceDir);
              var { outputOptions, inputOptions } = getTaskConfig(u, s);
              try {
                await (await rollup(inputOptions)).write(outputOptions);
              } catch (e) {
                console.error(e);
                t.state = "error";
              }
            }
          } catch (e) {
            console.error(e);
            t.state = "error";
          }
        } else {
          t.state = "null";
        }
      } else {
        t.state = "null";
      }
      return t;
    }
    let c = "success";
    try {
      for (const p of e) {
        join(this.path, p.sourceDir);
        var { outputOptions: outputOptions_1, inputOptions: inputOptions_1 } =
          getTaskConfig(p, this.path);
        try {
          await (await rollup(inputOptions_1)).write(outputOptions_1);
        } catch (e) {
          console.error(e);
          c = "error";
        }
      }
    } catch (e) {
      console.error(e);
      c = "error";
    }
    return c;
  },
});

builder.executeTask(["npm", "tsc", "rollup", "lessc", "file", "compress"]);
