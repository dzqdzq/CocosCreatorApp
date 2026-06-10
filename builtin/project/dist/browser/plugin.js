Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = undefined;

const { join } = require("path");

const { merge } = require("lodash");

class PluginManager {
  configs = {};
  customHandlers = {};
  hasRegisterPackages = new Set();
  async init() {
    var e = Editor.Package.getPackages({ enable: true });

    await Promise.all(e.map((e) => register(e)));

    Editor.Package.__protected__.on("enable", register);
    Editor.Package.__protected__.on("disable", unRegister);
  }
  async handleExportConfigs() {
    var e = {};
    for (const r in this.configs) {
      e[r] = { __version__: this.configs[r].version };
      for (const i in this.configs[r].tabs) {
        if (this.configs[r].tabs[i].content) {
          var t = {};
          for (const s in this.configs[r].tabs[i].content || {}) {
            t[s] = await Editor.Profile.getProject(r, s);
          }
          e[r][i] = { content: t };
        }
      }
    }
    for (const a in this.customHandlers) {
      if (!e[a] || !e[a].__version__) {
        e[a] = { __version__: this.configs[a].version };
      }

      for (const c in this.customHandlers[a]) {
        var o = this.customHandlers[a][c];
        if (o.exportConfig) {
          try {
            var n = (await o.exportConfig.call(o)) || {};

            if (!Array.isArray(n) && typeof n == "object") {
              e[a][c] = Object.assign({}, e[a][c], { custom: n });
            }
          } catch (e) {
            console.debug(
              `[Export Project Configs] Handle custom export error in ${a}.` +
                c,
              e
            );
          }
        }
      }
    }
    return e;
  }
  async handleImportConfigs(e) {
    for (const r in e) {
      if (typeof e[r] == "object") {
        if (e[r].__version__) {
          var t;
          var o;

          if (e[r].__version__ !== this.configs[r].version) {
            t = e[r].__version__;
            o = convertToProfileConfigs(e[r]);
            await Editor.Profile.__protected__.migrateProject(r, t, o);
            syncMigrateConfigs(e[r], o);
          }

          for (const i in e[r]) {
            if (e[r][i].content) {
              for (const s in e[r][i].content) {
                if (
                  typeof e[r][i].content == "object" &&
                  this.configs[r].tabs[i].content &&
                  this.configs[r].tabs[i].content[s]
                ) {
                  await Editor.Profile.setProject(
                    r,
                    s,
                    e[r][i].content[s],
                    "project"
                  );
                }
              }
            }
            if (e[r][i].custom) {
              var n = this.customHandlers[r][i];
              if (typeof e[r][i].custom == "object" && n.importConfig) {
                try {
                  await n.importConfig.call(n, e[r][i].custom);
                } catch (e) {
                  console.debug(
                    `[Import Project Configs] Handle custom import error in ${r}.` +
                      i,
                    e
                  );
                }
              }
            }
          }
        } else {
          console.warn(`[${r}] Plugin config without version`);
        }
      }
    }
  }
  async handleQueryConfigs(e) {
    var t;
    var o;
    var n = {};
    for (const r in e) {
      if (typeof e[r] == "object") {
        if (e[r].__version__) {
          t = convertToProfileConfigs(e[r]);

          e[r].__version__ !== this.configs[r].version &&
            ((o = e[r].__version__),
            await Editor.Profile.__protected__.migrateProject(r, o, t));

          n[r] = t;
        } else {
          console.warn(`[${r}] Plugin config without version`);
        }
      }
    }
    return n;
  }
  destroy() {
    Editor.Package.__protected__.removeListener("enable", register);
    Editor.Package.__protected__.removeListener("disable", unRegister);
  }
}
exports.pluginManager = new PluginManager();

const register = async (t) => {
  if (
    !t ||
    t.invalid ||
    !t.info ||
    !t.info.contributions ||
    !t.info.contributions.project
  ) {
    return false;
  }
  exports.pluginManager.hasRegisterPackages.add(t.name);
  try {
    var e = t.info.contributions.project;
    var o = t.info.contributions.profile;
    var n = { title: t.info.title || t.name, tabs: {}, version: t.version };
    for (const s in e) {
      var r = (n.tabs[s] = {
        label: e[s].label,
        content: null,
        custom: e[s].custom ? join(t.path, e[s].custom) : "",
      });
      if (e[s].content) {
        for (const a in e[s].content) {
          r.content = r.content || {};

          r.content[a] = {
            label:
              (o && o.project && o.project[a].label) ||
              e[s].content[a].label ||
              a,
            description:
              (o && o.project && o.project[a].description) ||
              e[s].content[a].description,
            render: e[s].content[a],
          };
        }
      }
      if (e[s].custom) {
        try {
          var i = Editor.Module.__protected__.requireFile(
            join(t.path, e[s].custom)
          );

          if (i.exportConfig || i.importConfig) {
            exports.pluginManager.customHandlers[t.name] =
              exports.pluginManager.customHandlers[t.name] || {};
            exports.pluginManager.customHandlers[t.name][s] = i;
          }
        } catch (e) {
          console.log(t.name + ": register custom project failed.");
          console.error(e);
        }
      }
    }
    exports.pluginManager.configs[t.name] = n;

    if (await Editor.Panel.has("project.settings")) {
      Editor.Message.broadcast("project:packages-changed");
    }
  } catch (e) {
    console.log(t.name + ": register default project failed.");
    console.error(e);
  }
};

const unRegister = async (e) => {
  if (!exports.pluginManager.hasRegisterPackages.has(e.name)) {
    return false;
  }
  exports.pluginManager.hasRegisterPackages.delete(e.name);
  delete exports.pluginManager.configs[e.name];
  delete exports.pluginManager.customHandlers[e.name];

  if (await Editor.Panel.has("project.settings")) {
    Editor.Message.broadcast("project:packages-changed");
  }
};

const convertToProfileConfigs = (e) => {
  let r = { __version: e.__version__ };
  for (const o in e) {
    if (e[o].content) {
      for (const n in e[o].content) {
        t(n, e[o].content[n]);
      }
    }
    if (e[o].custom) {
      for (const i in e[o].custom) {
        t(i, e[o].custom[i]);
      }
    }
  }
  function t(e, t) {
    var o = e.split(".").reverse();
    let n = { [o[0]]: t };
    for (let e = 1; e < o.length; e++) {
      n = { [o[e]]: n };
    }
    r = merge(r, n);
  }
  return r;
};

const syncMigrateConfigs = (a, e) => {
  for (const o in a) {
    if (a[o].content) {
      for (const n in a[o].content) {
        t(o, n, "content");
      }
    }
    if (a[o].custom) {
      for (const r in a[o].custom) {
        t(o, r, "custom");
      }
    }
  }
  function t(t, o, n) {
    var r = o.split(".");
    let i = e;
    let s = true;
    for (let e = 0; e < r.length; e++) {
      if (i[r[e]] === undefined || i[r[e]] == null) {
        delete a[t][n][o];
        s = false;
        break;
      }
      i = i[r[e]];
    }

    if (s && i !== a[t][n][o]) {
      a[t][n][o] = i;
    }
  }
};
