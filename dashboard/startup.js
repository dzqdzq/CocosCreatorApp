const shell = require("electron").shell;
const spawn = require("child_process").spawn;
const project = require("@editor/project");
const setting = require("@editor/setting");
const user = require("@editor/user");
const join = require("path").join;
const { readJSONSync, outputJSONSync, existsSync } = require("fs-extra");
const createEmptyProject = require("./script/template").createEmptyProject;
const openProject = require("./script/project").openProject;

const {
  openDashboard,
  queryDashboardPath,
  exitApp,
  goToInstall,
  warnAlreadyOpened,
  errorDialog,
  showMainDialog,
  t,
  metrics,
  app,
  initI18n,
  projectMap,
} = require("./script/util");

const psList = require("ps-list");
function setOpenHandler() {
  project.setOpenHandler(async (a) => {
    if (projectMap.get(a)) {
      await warnAlreadyOpened();
    } else {
      const p = join(a, "temp", "startup.json");
      let e = {};
      if (existsSync(p)) {
        const r = readJSONSync(p);
        if (r && r.pid) {
          var o = (await psList()).find((e) => e.pid === r.pid);
          if (o && /Electron|CocosCreator/.test(o.name || "")) {
            return void (await warnAlreadyOpened());
          }
          e = r;
        }
      }
      o = join(a, "package.json");
      if (existsSync(o)) {
        readJSONSync(o);
        const c = app.getPath("exe");
        const d = [];
        const l = process.argv.indexOf("--pass-through");
        o = (() => {
          var t = ["--inspect-brk", "--inspect"];
          for (let e = 0; e < l; ++e) {
            const s = process.argv[e];
            var r;
            var a;

            var o = t.find((e) => s.startsWith(e));

            if (o) {
              return (a = (a = s.substr(o.length)).startsWith("=")
                ? /^=(.*:)?(\d+)$/g.exec(a)
                : null)
                ? ((r = a[1]),
                  (a = a[2] ? parseInt(a[2]) + 1 : undefined),
                  o + "=" + (r ? r + ":" + a : "" + a))
                : o;
            }
          }
        })();

        if (o) {
          d.push(o);
        }

        d.push(join(__dirname, "../"));
        d.push("--project");
        d.push(a);

        if (l >= 0) {
          d.push(...process.argv.slice(l + 1));
        }

        if (setting.dev) {
          d.push("--dev");
        }

        let t = null;
        s();
        let r = false;
        function s() {
          t = spawn(c, d, { stdio: [0, 1, 2, "ipc"] });
          projectMap.set(a, t);
          e.pid = t.pid;
          user.addChildProcess(t);
          t.on("message", n);
          t.on("exit", i);
          outputJSONSync(p, e, { spaces: 2 });

          if (app.dock) {
            app.dock.hide();
          }
        }
        async function n(e) {
          if (e.channel && e.channel === "open-project") {
            if (e.options.path) {
              return project.open(e.options.path);
            }

            if (app.dock) {
              app.dock.show();
            }

            await openProject();
          }

          if (e.channel && e.channel === "show-dashboard") {
            app.dock && app.dock.show();
            await createEmptyProject();
          }

          if (e.channel && e.channel === "editor-restart" && !r) {
            r = true;

            (async () => {
              if (!t.killed) {
                return new Promise((e) => {
                  t.kill();
                  t.once("exit", e);
                }).then(() => {
                  user.removeChildProcess(t);
                  s();
                  r = false;
                });
              }
            })();
          }
        }
        function i() {
          if (!r) {
            projectMap.delete(a);
            user.removeChildProcess(t);
            exitApp();
          }
        }
      } else {
        await errorDialog(t("open_with_error"), a);
      }
    }
  });
}

exports.app = async () => {
  if (!app.isReady()) {
    await new Promise((e) => {
      app.once("ready", e);
    });

    await initI18n(true);
    await metrics.init();
  }
};

exports.validation = async (e) => {
  const t = await queryDashboardPath();
  setOpenHandler();

  app.on(process.platform === "darwin" ? "activate" : "second-instance", () => {
    exports.show(t, e);
  });

  return exports.show(t, e);
};

exports.show = async (e, t) => {
  let r = true;
  var a;
  switch (await showMainDialog(e)) {
    case 0: {
      if (e) {
        if (t) {
          await shell.openPath(e);
        } else {
          a = join(__dirname, "../");

          a =
            process.platform === "win32"
              ? join(a, "../../CocosCreator.exe")
              : join(a, "../../MacOS/CocosCreator");

          await shell.openExternal("cocos-dashboard://open/" + a);
          exitApp();
        }

        return true;
      }
      await goToInstall();
      break;
    }
    case 1: {
      r = await createEmptyProject();
      break;
    }
    case 2: {
      r = await openProject();
      break;
    }
    case 3: {
      exitApp();
      return "";
    }
  }

  if (!r) {
    await exports.show(e);
  }
};
