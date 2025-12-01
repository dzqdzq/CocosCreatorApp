"use strict";
let e = {};
module.exports = e;
const n = require("electron");
const a = require("fire-path");
const fireFs = require("fire-fs");
const i = require("async");
const r = require("semver");
const o = require("lodash");
const l = require("../profile");
const d = require("./console");
const s = require("./main-menu");
const c = require("./ipc");
const f = require("../app");
const u = require("./i18n");
const p = require("../share/ipc-listener");
let m = "en";
let h = {};
let g = {};
let y = {};
let $ = {};
let k = {};
let P = [];
function j(e, n) {
  return -1 === n.indexOf(":") ? `${e}:${n}` : n;
}

e.load = function (P, v) {
  if (g[P] || y[P]) {
    if (v) {
      v();
    }

    return;
  }
  y[P] = "load";
  let _;
  let b = a.join(P, "package.json");
  try {
    _ = JSON.parse(fireFs.readFileSync(b));
  } catch (e) {
    delete y[P];

    if (v) {
      v(new Error(`Failed to load 'package.json': ${e.message}`));
    }

    return;
  }
  if (!_.name) {
    delete y[P];
    d.warn(`Invalid package name: The plug-in name is not defined \n  ${P}.`);

    if (v) {
      v(
        new Error(
          "Failed to load 'package.json': The plug-in name is not defined."
        )
      );
    }

    return;
  }

  if (_.name !== _.name.toLowerCase()) {
    _.name = _.name.toLowerCase();

    d.warn(
      `Invalid package name: ${_.name}: do not contains uppercase characters.`
    );
  }

  for (let e in _.hosts) {
    let n = h[e];
    if (!n) {
      delete y[P];

      if (v) {
        v(new Error(`Host '${e}' does not exist.`));
      }

      return;
    }
    let a = _.hosts[e];
    if (!r.satisfies(n, a, { includePrerelease: true })) {
      delete y[P];

      if (v) {
        v(new Error(`Host '${e}' require ver ${a}`));
      }

      return;
    }
  }
  i.series(
    [
      (n) => {
        let a = _.packages;

        if (_.pkgDependencies) {
          d.warn(
                `Package ${_.name} parse warning: "pkgDependencies" is deprecated, use "packages" instead.`
              );

          a = _.pkgDependencies;
        }

        if (!a) {
          n();
          return;
        }
        i.eachSeries(
          Object.keys(a),
          (n, a) => {
            let t = e.find(n);
            if (!t) {
              return a(new Error(`Cannot find dependent package ${n}`));
            }
            e.load(t, a);
          },
          n
        );
      },
      (i) => {
        _._path = P;
        _._destPath = P;

        if (_["entry-dir"]) {
          _._destPath = a.join(_._path, _["entry-dir"]);
        }

        let r = a.join(_._destPath, "i18n", `${m}.js`);
        if (fireFs.existsSync(r)) {
          try {
            u.extend({ [_.name]: require(r) });
          } catch (e) {
            i(new Error(`Failed to load ${r}: ${e.stack}`));
            return;
          }
        }
        let c = null;
        if (_.main) {
          let e = a.join(_._destPath, _.main);
          try {
            c = require(e);
          } catch (e) {
            i(new Error(`Failed to load ${_.main}: ${e.stack}`));
            return;
          }
        }
        if (c) {
          let e = new p();
          for (let n in c.messages) {
            let a = c.messages[n];

            if ("function" == typeof a) {
              e.on(j(_.name, n), a.bind(c));
            }
          }
          _._ipc = e;
        }
        let f = _["main-menu"];
        if ((f = Editor.openEduMode ? null : f) && "object" == typeof f) {
          for (let e in f) {
            let t = u.formatPath(e);
            let i = a.dirname(t);
            if ("." === i) {
              d.failed(`Failed to add menu ${t}`);
              continue;
            }
            let r = f[e];
            let o = Object.assign({ label: a.basename(t) }, r);
            if (r.icon) {
              let e = n.nativeImage.createFromPath(a.join(_._destPath, r.icon));
              o.icon = e;
            }
            s.add(i, o);
          }
        }
        let h = _;
        let v = false;

        if (_.panels) {
          d._temporaryConnent();

          d.warn(
            `\n           Package ${_.name} parse warning: "panels" is deprecated, use "panel" instead.\n           For multiple panel, use "panel.x", "panel.y" as your register field.\n           NOTE: Don't forget to change your "Editor.Ipc.sendToPanel" message, since your panelID has changed.\n        `
          );

          d._restoreConnect();
          h = _.panels;
          v = true;
        }

        for (let e in h) {
          if (0 !== e.indexOf("panel")) {
            continue;
          }
          let n = h[e];
          for (let e in n.profiles) {
            d._temporaryConnent();

            d.warn(
              `The profile of the panel (${_.name}) needs to be moved to the package root`
            );

            d._restoreConnect();

            if (!_.profiles) {
              _.profiles = {};
            }

            if (!_.profiles[e]) {
              _.profiles[e] = {};
            }

            let a = n.profiles[e];
            let t = _.profiles[e];
            Object.keys(a).forEach((e) => {
              t[e] = a[e];
            });
          }
        }
        if (_.profiles) {
          try {
            for (let e in _.profiles) {
              l.load(`${e}://${_.name}.json`).mergeData(_.profiles[e]);
            }
          } catch (e) {
            d.failed(`Initial Package Profile [${_._destPath}] failed！` + e);
          }
        }
        for (let e in h) {
          let n;
          if (v) {
            n = `${_.name}.${e}`;
          } else {
            if (0 !== e.indexOf("panel")) {
              continue;
            }
            n = e.replace(/^panel/, _.name);
          }
          if (k[n]) {
            d.failed(
              `Failed to load panel "${e}" from "${_.name}", the panelID ${n} already exists`
            );
            continue;
          }
          let i = h[e];

          o.defaults(i, {
              path: _._destPath,
              type: "dockable",
              title: n,
              popable: true,
              "shadow-dom": true,
              frame: true,
              resizable: true,
              devTools: true,
              profileTypes: Object.keys(_.profiles || {}),
              engineSupport: false,
            });

          if (
            (!i.main)
          ) {
            d.failed(
              `Failed to load panel "${e}" from "${_.name}", "main" field not found.`
            );
            continue;
          }
          let r = i.main;

          if (fireFs.existsSync(a.join(_._destPath, r)) ||
          ((r = r.replace(/\.js$/, ".ccc")),
          fireFs.existsSync(a.join(_._destPath, r)))) {
            k[n] = i;
          } else {
            d.failed(
                  `Failed to load panel "${e}" from "${_.name}", main file "${i.main}" not found.`
                );
          }
        }
        g[P] = _;
        $[_.name] = P;
        if (c && c.load) {
          try {
            c.load();
            y[P] = "ready";
          } catch (n) {
            e.unload(P, () => {
              i(new Error(`Failed to execute load() function: ${n.stack}`));
            });

            return;
          }
        }
        i();
      },
      (e) => {
        if (f.loadPackage) {
          f.loadPackage(_, e);
          return;
        }
        e();
      },
      (e) => {
        d.success(`${_.name} loaded`);
        c.sendToWins("editor:package-loaded", _.name);
        e();
      },
    ],
    (e) => {
      if (e) {
        delete y[P];
      } else {
        y[P] = "ready";
      }

      if (v) {
        v(e);
      }
    }
  );
};

e.unload = function (e, n) {
  let t = g[e];
  if (!t || "ready" !== y[e]) {
    if (n) {
      n();
    }

    return;
  }
  const r = y[e];
  y[e] = "unload";

  i.series(
    [
      (e) => {
        if (f.unloadPackage) {
          f.unloadPackage(t, e);
          return;
        }
        e();
      },
      (n) => {
        u.unset([t.name]);
        let i = t;
        let r = false;

        if (t.panels) {
          i = t.panels;
          r = true;
        }

        for (let e in i) {
          let n;
          if (r) {
            n = `${t.name}.${e}`;
          } else {
            if (0 !== e.indexOf("panel")) {
              continue;
            }
            n = e.replace(/^panel/, t.name);
          }
          delete k[n];
        }
        let o = t["main-menu"];
        if ((o = Editor.openEduMode ? null : o) && "object" == typeof o) {
          for (let e in o) {
            let n = u.formatPath(e);
            s.remove(n);
          }
        }

        if (t._ipc) {
          t._ipc.clear();
        }

        if ((t.main)) {
          let e = require.cache;
          let n = a.join(t._destPath, t.main);
          let i = e[n];
          if (!i) {
            t._destPath = fireFs.realpathSync(t._destPath);
            i = e[(n = a.join(t._destPath, t.main))];
          }
          if (i) {
            let a = i.exports;
            if (a && a.unload) {
              try {
                a.unload();
              } catch (e) {
                d.failed(
                  `Failed to unload "${t.main}" from "${t.name}": ${e.stack}.`
                );
              }
            }

            (function e(n, a) {
              if (!n) {
                return;
              }
              let t = [];
              a.forEach((e) => {
                let a = e.filename;

                if (0 === a.indexOf(n) &&
                  require.cache[a]) {
                  e.children.forEach((e) => {
                      t.push(e);
                    });

                  delete require.cache[a];
                }
              });

              if (t.length > 0) {
                e(n, t);
              }
            })(t._destPath, i.children);

            delete e[n];
          } else {
            d.failed(`Failed to uncache module ${t.main}: Cannot find it.`);
          }
        }
        delete g[e];
        delete $[t.name];
        d.success(`${t.name} unloaded`);
        c.sendToWins("editor:package-unloaded", t.name);
        n();
      },
    ],
    (a) => {
      if (a) {
        y[e] = r;
      } else {
        delete y[e];
      }

      if (n) {
        n(a);
      }
    }
  );
};

e.reload = function (n, a) {
  const t = y[n];

  if (!(t && "ready" !== t)) {
    i.series(
      [
        (e) => {
          if (!g[n]) {
            e();
            return;
          }
          e();
        },
        (a) => {
          e.unload(n, a);
        },
        (a) => {
          e.load(n, a);
        },
      ],
      (e) => {
        if (a) {
          a(e);
        }
      }
    );
  }
};

e.panelInfo = function (e) {
    return k[e];
  };

e.packageInfo = function (e) {
    for (let n in g) if (a.contains(n, e)) {
      return g[n];
    }
    return null;
  };

e.packagePath = function (e) {
    return $[e];
  };

e.addPath = function (e) {
  if (!Array.isArray(e)) {
    e = [e];
  }

  P = o.union(P, e);
};

e.removePath = function (e) {
  let n = P.indexOf(e);

  if (-1 !== n) {
    P.splice(n, 1);
  }
};

e.resetPath = function () {
    P = [];
  };

e.find = function (e) {
    for (let n = 0; n < P.length; ++n) {
      let i = P[n];
      if (fireFs.isDirSync(i)) {
        if (-1 !== fireFs.readdirSync(i).indexOf(e)) {
          return a.join(i, e);
        }
      }
    }
    return null;
  };

Object.defineProperty(e, "paths", { enumerable: true, get: () => P.slice() });

Object.defineProperty(e, "lang", {
  enumerable: true,
  set(e) {
    m = e;
  },
  get: () => m,
});

Object.defineProperty(e, "versions", {
  enumerable: true,
  set(e) {
    h = e;
  },
  get: () => h,
});

const v = n.ipcMain;
function _(e) {
  let n = {};
  try {
    if (e._ipc) {
      delete (n = JSON.parse(JSON.stringify(e)))._ipc;
    } else {
      n = e;
    }
  } catch (e) {
    Editor.erro(e);
  }
  return n;
}

v.on("editor:package-query-infos", (e) => {
  let n = [];
  for (let e in g) n.push({ path: e, enabled: true, info: _(g[e]) });
  e.reply(null, n);
});

v.on("editor:package-query-info", (e, n) => {
  let a = $[n];
  a = a || "";
  e.reply(null, { path: a, enabled: true, info: _(g[a]) });
});

v.on("editor:package-reload", (n, a) => {
  let t = $[a];
  if (!t) {
    d.error(`Failed to reload package ${a}, not found`);
    return;
  }
  e.reload(t);
});
