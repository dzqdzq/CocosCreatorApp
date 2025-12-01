"use strict";
let e = {};
module.exports = e;
const t = require("electron");
const r = require("fire-fs");
const i = require("fire-path");
const n = require("globby");
const a = require("chokidar");
const o = require("async");
const l = require("minimatch");
const s = require("lodash");
const u = require("../app");
const d = require("./ipc");
const p = require("./menu");
const c = require("./protocol");
const f = require("../profile");
const h = require("./console");
const m = require("./window");
const g = require("./debugger");
const q = require("./package");
const w = require("./panel");
const v = require("./main-menu");
const k = require("./i18n");
const y = require("../share/selection");
const b = require("../share/undo");
let x;
let T = false;
let P = "en";
function E(e, t) {
  if (void 0 === t) {
    return false;
  }

  if ("string" == typeof t) {
    t = [t];
  }

  if (!Array.isArray(t)) {
    h.error(`${t} is not a valid patterns.`);
    return false;
  }
  let r = (function (e) {
    let t = [];
    let r = [];

    e.forEach((e, i) => {
      let n = "!" === e[0];
      (n ? r : t).push({ index: i, pattern: n ? e.slice(1) : e });
    });

    return { positives: t, negatives: r };
  })(t);
  if (0 === r.positives.length) {
    return false;
  }
  let i = false;
  for (let t in r.positives) {
    let n = r.positives[t].index;
    let a = r.positives[t].pattern;
    if (!a || "string" != typeof a) {
      h.warn(`${a} should be a non-empty string.`);
      continue;
    }
    if (!l(e, a)) {
      continue;
    }
    let o = false;
    for (let t in r.negatives) {
      let i = r.negatives[t].index;
      let a = r.negatives[t].pattern;
      if (!(i < n) && l(e, a)) {
        o = true;
        break;
      }
    }
    if (!o) {
      i = true;
      break;
    }
  }
  return i;
}
Object.defineProperty(e, "isClosing", { enumerable: true, get: () => T });

Object.defineProperty(e, "lang", {
  enumerable: true,
  set(e) {
    P = e;
  },
  get: () => P,
});

e.url = c.url;

e._quit = function () {
  if (T) {
    return;
  }
  T = true;

  if (x) {
    x.close();
  }

  m.windows.forEach((e) => {
    e.close();
  });

  g.stopRepl();
  g.stopNodeInspector();

  if (u.quit) {
    u.quit(() => {
      u.emit("quit");
      t.app.quit();
    });

    if (e.dev) {
      setTimeout(() => {
        h.warn(
          "You have still not quit your application. Did you forget to invoke the callback function in Editor.App.quit()?"
        );
      }, 5e3);
    }
  } else {
    u.emit("quit");
    t.app.quit();
  }
};

e.loadPackagesAt = function (e, t) {
    if (-1 === q.paths.indexOf(e)) {
      h.warn("The package path %s is not registerred", e);
      return;
    }
    let r = n.sync(`${e}/*/package.json`);
    o.eachSeries(
      r,
      (e, t) => {
        e = i.normalize(e);
        let r = i.dirname(e);
        q.load(r, (e) => {
          if (e) {
            h.failed(`Failed to load package at ${r}: ${e.message}`);
          }

          t();
        });
      },
      () => {
        if (t) {
          t();
        }
      }
    );
  };

e.loadAllPackages = function (e) {
  let t;
  let r = [];
  for (t = 0; t < q.paths.length; ++t) {
    r.push(`${q.paths[t]}/*/package.json`);
  }
  let a = n.sync(r);
  o.eachSeries(
    a,
    (e, t) => {
      e = i.normalize(e);
      let r = i.dirname(e);
      q.load(r, (e) => {
        if (e) {
          h.failed(`Failed to load package at ${r}: ${e.message}`);
        }

        t();
      });
    },
    () => {
      if (e) {
        e();
      }
    }
  );
};

e.require = function (t) {
    return require(e.url(t));
  };

Object.defineProperty(e, "watcher", { enumerable: true, get: () => x });
let j = null;
let $ = [];

e.watchPackages = function (e) {
  let t = q.paths.filter(
    (e) =>
      !!r.existsSync(e) &&
      -1 === e.indexOf(".asar/") &&
      -1 === e.indexOf(".asar\\")
  );
  if (0 === t.length) {
    if (e) {
      e();
    }

    return;
  }
  (x = a.watch(t, {
    ignored: [
      new RegExp("[\\/\\\\]\\.(?!" + u.name + ")"),
      /[\/\\]bin/,
      /[\/\\]test[\/\\](fixtures|playground)/,
      /[\/\\]node_modules/,
      /[\/\\]bower_components/,
    ],
    ignoreInitial: true,
    persistent: true,
  }))
    .on("add", (e) => {
      setTimeout(() => {
        q.load(e);
      }, 100);
    })
    .on("addDir", (e) => {
      setTimeout(() => {
        q.load(e);
      }, 100);
    })
    .on("unlink", (e) => {
      q.unload(e);
    })
    .on("unlinkDir", (e) => {
      q.unload(e);
    })
    .on("change", (e) => {
    let t;
    let r = q.packageInfo(e);
    if (!r) {
      return;
    }
    $.some((e) => e.path === r._path && ((t = e), true));

    if (!t) {
      t = {
          path: r._path,
          reloadTest: false,
          reloadRenderer: false,
          reloadMain: false,
        };
    }

    let n = s.defaults(r.reload, {
        test: ["test/**/*", "tests/**/*"],
        renderer: ["renderer/**/*", "panel/**/*"],
        ignore: [],
        main: [],
      });

    let a = i.relative(r._path, e);

    if (!E(a, n.ignore)) {
      if (E(a, n.test)) {
        t.reloadTest = true;
      } else {
        if (E(a, n.renderer)) {
          t.reloadRenderer = true;
        } else {
          if (!(n.main && 0 !== n.main.length && !E(a, n.main))) {
            t.reloadMain = true;
          }
        }
      }

      if ((t.reloadTest || t.reloadRenderer || t.reloadMain)) {
        if (!$.includes(t)) {
          $.push(t);
        }

        if (j) {
          clearTimeout(j);
          j = null;
        }

        j = setTimeout(() => {
          (function (e, t) {
            o.each(
              e,
              (e, t) => {
                let r = q.packageInfo(e.path);
                if (!r) {
                  t();
                  return;
                }
                o.series(
                  [
                    (t) => {
                      let i = w.findWindow("tester.panel");
                      if (e.reloadTest) {
                        if (i) {
                          i.send("tester:run-tests", r.name);
                        }

                        t();
                        return;
                      }
                      if (e.reloadRenderer) {
                        for (let e in r) {
                          if (0 !== e.indexOf("panel")) {
                            continue;
                          }
                          let t = e.replace(/^panel/, r.name);
                          d.sendToWins("editor:panel-out-of-date", t);
                        }

                        if (i) {
                          i.send("tester:run-tests", r.name);
                        }

                        t();
                        return;
                      }
                      if (e.reloadMain) {
                        q.reload(r._path);
                        t();
                        return;
                      }
                      t();
                    },
                  ],
                  (e) => {
                    if (e) {
                      h.error(
                        "Failed to reload package %s: %s",
                        r.name,
                        e.message
                      );
                    }

                    t();
                  }
                );
              },
              (e) => {
                if (t) {
                  t(e);
                }
              }
            );
          })($);

          $ = [];
          j = null;
        }, 50);
      }
    }
  })
    .on("error", (e) => {
      h.error("Package Watcher Error: %s", e.message);
    })
    .on("ready", () => {
    if (e) {
      e();
    }
  });
};

e.init = function (t) {
  t = t || {};
  e.reset();
  Editor.openEduMode = t["open-edu-mode"] || false;
  let n = t["theme-search-path"];

  if (n && n.length) {
    e.themePaths = n.map((t) => e.url(t));
  }

  if (t.theme) {
    e.theme = t.theme;
  }

  let a = t.i18n;

  if (a) {
    k.clear();
    k.extend(a);
  }

  let o = t.profile;
  if (o) {
    for (let e in o) {
      r.ensureDirSync(i.join(o[e]));
      f.register(e, o[e]);
    }
  }
  let l = t["package-search-path"];

  if (l && l.length) {
    q.addPath(l.map((t) => e.url(t)));
  }

  let s = t["main-menu"];

  if (s) {
    p.register("main-menu", s, true);
    v.init();
  }

  let u = t["panel-window"];

  if (u) {
    w.templateUrl = u;
  }

  let d = t.layout || "editor-framework://static/layout.json";

  if (d) {
    m.defaultLayoutUrl = d;
  }

  let c = t.selection;

  if (c &&
    c.length) {
    c.forEach((e) => {
      y.register(e);
    });
  }

  let h = t.undo;
  if (h) {
    for (let e in h) b.register(e, h[e]);
  }
};

e.run = function (t, r) {
  if (!m._restoreWindowStates(r)) {
    let e = new m("main", (r = r || { show: false }));
    m.main = e;
    e.show();
    e.load(t);
    e.focus();
  }
  let i = m.main;

  if (i &&
    e.argv.showDevtools) {
    i.nativeWin.webContents.once("did-finish-load", function () {
      i.openDevTools();
    });
  }
};

e.reset = function () {
  e.themePaths = [
    Editor.url("editor-framework://themes"),
    Editor.url("app://themes"),
  ];

  e.theme = "default";
  k.clear();
  let t = `../../static/i18n/${e.lang}`;

  if (!r.existsSync(t + ".js")) {
    t = "../../static/i18n/en";
  }

  k.extend(require(t));
  q.resetPath();
  v._resetToBuiltin();
  w.templateUrl = "editor-framework://static/window.html";
  m.defaultLayoutUrl = "app://static/layout.json";
  y.reset();
  b.reset();
};
