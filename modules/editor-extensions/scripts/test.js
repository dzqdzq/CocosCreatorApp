const chalk = require("chalk");
const fse = require("fs-extra");
const ps = require("path");
const spawn = require("child_process").spawn;
function bash(o, r) {
  return new Promise((n, e) => {
    var s = spawn(
      ps.join(
        __dirname,
        "../node_modules/.bin/mocha" +
          (process.platform === "win32" ? ".cmd" : "")
      ),
      o,
      r
    );

    s.on("close", (s) => {
      n(s);
    });

    s.on("error", (s) => {
      e(s);
    });
  });
}
async function check(s) {
  var n = ps.join(s, "test");
  if (
    fse.existsSync(n) &&
    (console.log(chalk.magenta(`==== ${n} ====`)),
    0 !==
      (await bash([n], { stdio: [0, 1, 2], cwd: ps.join(__dirname, "..") })))
  ) {
    throw new Error("测试失败 " + s);
  }
}
const root = ps.join(__dirname, "../extensions");
const plugins = process.argv.slice(2);
const list = plugins.length ? plugins : fse.readdirSync(root);
!(async () => {
  for (const s of list) {
    await check(ps.join(root, s));
  }
})();
