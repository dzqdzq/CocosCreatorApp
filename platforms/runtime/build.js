const join = require("path").join;
const execSync = require("child_process").execSync;

const runtimePlatforms = [
  "cocos-play",
  "link-sure",
  "qtt",
  "vivo-mini-game",
  "oppo-mini-game",
  "huawei-quick-game",
];

runtimePlatforms.forEach((e) => {
  const s = join(__dirname, "platforms", e);
  var c;
  var e = require(join(s, ".editor.js"));

  if (e.js) {
    c = e.js();
    console.time("tsc" + s);

    c.forEach((c) => {
      c = join(s, c);
      try {
        execSync("tsc", { cwd: c, stdio: [0, 1, 2] });
      } catch (e) {
        console.error(`tsc ${c} failed!`);
      }
    });

    console.timeEnd("tsc" + s);
  }

  if (e.css) {
    console.time("lessc" + s);

    e.css().forEach((e) => {
      execSync(`lessc ${e.source} ` + e.dist, { cwd: s, stdio: [0, 1, 2] });
    });

    console.timeEnd("lessc" + s);
  }
});
