"use strict";
const e = require("fire-path");
const r = require("fire-fs");
const n = require("chalk");
process.on("message", (e) => {
  switch (e.channel) {
    case "tester:reload":
      if (!Editor.Window.main) {
        return;
      }
      Editor.Window.main.nativeWin.reload();
      break;
    case "tester:active-window":
      if (!Editor.Window.main) {
        return;
      }
      Editor.Window.main.nativeWin.focus();
      break;
    case "tester:exit":
      process.exit(0);
  }
});
let i = {
  runPackage(r, n, o) {
    require("find-up")("package.json", { cwd: r }).then((s) => {
      if (!s) {
        t(`Cannot find package.json in ${s}`);
        return;
      }
      let a = e.dirname(s);

      if (!e.isAbsolute(a)) {
        a = e.join(Editor.App.path, a);
      }

      Editor.Package.load(a, () => {
        let t = true;

        if (-1 !== r.indexOf("test")) {
          t = false;
        }

        if ((t)) {
          const r = require("async");
          let t = 0;
          let s = e.join(a, "test");

          r.series(
            [
              (r) => {
                i.runRenderer(e.join(s, "renderer"), n, (e) => {
                  t += e;
                  r();
                });
              },
              (r) => {
                i.runMain(e.join(s, "main"), n, (e) => {
                  t += e;
                  r();
                });
              },
            ],
            () => {
              if (o) {
                o(t);
              }
            }
          );

          return;
        }
        if (n.renderer || -1 !== r.indexOf("renderer")) {
          i.runRenderer(r, n, o);
          return;
        }
        i.runMain(r, n, o);
      });
    });
  },
  runRenderer(e, r, n) {
    try {
      require("./renderer/runner-main")(e, r, n);
    } catch (e) {
      t(e);
      process.exit(1);
    }
  },
  runMain(e, r, n) {
    try {
      require("./main/runner")(e, r, n);
    } catch (e) {
      t(e);
      process.exit(1);
    }
  },
  run(n, o) {
    n = n || e.join(Editor.App.path, "test");
    if (!r.existsSync(n)) {
      t(`The path ${n} you provide does not exist.`);
      process.exit(1);
      return;
    }
    function s(e) {
      if (process.send) {
        process.send({ channel: "process:end", failures: e, path: n });
      }

      process.exit(e);
    }
    Editor.Menu.register("main-menu", require("./main-menu"), true);
    Editor.MainMenu.init();
    return o.package
      ? (i.runPackage(n, o, s), void 0)
      : o.renderer || -1 !== n.indexOf("renderer")
      ? (i.runRenderer(n, o, s), void 0)
      : (i.runMain(n, o, s), void 0);
  },
};
function t(e) {
  console.log(n.red(e));
}
module.exports = i;
