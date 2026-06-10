Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = undefined;

const { merge } = require("lodash");

const { join } = require("path");

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
    for (const s in this.configs) {
      var o = this.configs[s].properties || {};
      var r = this.configs[s].laboratory || [];
      if (this.configs[s].properties || this.configs[s].laboratory) {
        var t = { __version__: this.configs[s].version };
        for (const l in o) {
          var i = await Editor.Profile.getConfig(s, l, "local");
          var i = i != null ? "local" : "global";
          t.properties = t.properties || {};

          t.properties[l] = {
            type: i,
            value:
              i == "local"
                ? await Editor.Profile.getConfig(s, l, i)
                : await Editor.Profile.getConfig(s, l),
          };
        }
        for (let e = 0; e < r.length; e++) {
          t.laboratory = t.laboratory || {};

          t.laboratory[r[e].path] = {
            type: "global",
            value: await Editor.Profile.getConfig(s, r[e].path),
          };
        }
        e[s] = t;
      }
    }
    for (const c in this.customHandlers) {
      if (!e[c] || !e[c].__version__) {
        e[c] = { __version__: this.configs[c].version };
      }

      var a = this.customHandlers[c];
      if (a.exportConfig) {
        try {
          var n = (await a.exportConfig.call(a)) || {};

          if (!Array.isArray(n) && typeof n == "object") {
            e[c] = Object.assign({}, e[c], { custom: n });
          }
        } catch (e) {
          console.debug(
            "[Export Preferences Configs] Handle custom export error in " + c,
            e
          );
        }
      }
    }
    return e;
  }
  async handleImportConfigs(e) {
    for (const n in e) {
      if (typeof e[n] == "object") {
        if (e[n].__version__) {
          if (e[n].__version__ === this.configs[n].version) {
            i = e[n].__version__;

            (a = convertToProfileConfigs(e[n])).global &&
              (await Editor.Profile.__protected__.migrateGlobal(
                n,
                i,
                a.global
              ));

            a.local &&
              (await Editor.Profile.__protected__.migrateLocal(n, i, a.local));

            syncMigrateConfigs(e[n], a);
          }

          if (e[n].properties) {
            var o;
            var r = e[n].properties;
            for (const s in r) {
              if (
                r[s].value !== undefined &&
                this.configs[n].properties &&
                this.configs[n].properties[s]
              ) {
                o = r[s].type || "global";
                await Editor.Profile.setConfig(n, s, r[s].value, o);
              }
            }
          }

          if (e[n].laboratory) {
            var t = e[n].laboratory;
            for (const l in t) {
              if (
                t[l].value !== undefined &&
                this.configs[n].laboratory &&
                this.configs[n].laboratory.find((e) => e.path === l)
              ) {
                await Editor.Profile.setConfig(n, l, t[l].value, "global");
              }
            }
          }
          if (e[n].custom) {
            var i = e[n].custom;
            var a = this.customHandlers[n];
            if (typeof i == "object" && a.importConfig) {
              try {
                await a.importConfig.call(a, i);
              } catch (e) {
                console.debug(
                  "[Import Preferences Configs] Handle custom import error in " +
                    n,
                  e
                );
              }
            }
          }
        } else {
          console.warn(
            `[Import Preferences Configs] ${n} Plugin config without version`
          );
        }
      }
    }
  }
  async handleQueryConfigs(e) {
    var o;
    var r;
    var t = {};
    for (const i in e) {
      if (typeof e[i] == "object") {
        if (e[i].__version__) {
          o = convertToProfileConfigs(e[i]);

          e[i].__version__ === this.configs[i].version &&
            ((r = e[i].__version__),
            o.global &&
              (await Editor.Profile.__protected__.migrateGlobal(
                i,
                r,
                o.global
              )),
            o.local) &&
            (await Editor.Profile.__protected__.migrateLocal(i, r, o.local));

          t[i] = merge(o.global, o.local);
        } else {
          console.warn(`[${i}] Plugin config without version`);
        }
      }
    }
    return t;
  }
  destroy() {
    Editor.Package.__protected__.removeListener("enable", register);
    Editor.Package.__protected__.removeListener("disable", unRegister);
  }
}
exports.pluginManager = new PluginManager();

const register = async (o) => {
  if (
    !o ||
    o.invalid ||
    !o.info ||
    !o.info.contributions ||
    !o.info.contributions.preferences
  ) {
    return false;
  }
  exports.pluginManager.hasRegisterPackages.add(o.name);
  try {
    var e = o.info.contributions.preferences;
    const i = o.info.contributions.profile;
    var r = {
      title: o.info.title || o.name,
      properties: null,
      custom: e.custom ? join(o.path, e.custom) : "",
      laboratory: e.laboratory
        ? e.laboratory.map((e) =>
            i && i.editor && i.editor[e]
              ? {
                  path: e,
                  label: i.editor[e].label,
                  description: i.editor[e].description,
                }
              : (console.warn(
                  `The data is not defined.
package: ${o.name}
key: ` + e
                ),
                null)
          )
        : null,
      version: o.version,
    };
    if (e.properties) {
      for (const a in e.properties) {
        if (i && i.editor && i.editor[a]) {
          r.properties = r.properties || {};

          r.properties[a] = {
            label: i.editor[a].label,
            description: i.editor[a].description,
            render: e.properties[a],
          };
        } else {
          console.warn(
            `The data is not defined.
    package: ${o.name}
    key: ` + a
          );
        }
      }
    }
    if (e.custom) {
      try {
        var t = Editor.Module.__protected__.requireFile(join(o.path, e.custom));

        if (t.exportConfig || t.importConfig) {
          exports.pluginManager.customHandlers[o.name] = t;
        }
      } catch (e) {
        console.log(o.name + ": register custom preferences failed.");
        console.error(e);
      }
    }
    exports.pluginManager.configs[o.name] = r;

    if (await Editor.Panel.has("preferences.settings")) {
      Editor.Message.broadcast("preferences:packages-changed");
    }
  } catch (e) {
    console.log(o.name + ": register default preferences failed.");
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

  if (await Editor.Panel.has("preferences.settings")) {
    Editor.Message.broadcast("preferences:packages-changed");
  }
};

const convertToProfileConfigs = (r) => {
  const t = {};
  var o = ["properties", "laboratory", "custom"];
  for (let e = 0; e < o.length; e++) {
    var i = o[e];
    if (r[i]) {
      for (const l in r[i]) {
        a = undefined;
        n = undefined;
        s = undefined;
        var a = l;
        var n = r[i][l];
        var s = a.split(".").reverse();
        let o = { [s[0]]: n.value };
        for (let e = 1; e < s.length; e++) {
          o = { [s[e]]: o };
        }

        if (n.type === "global") {
          t.global = t.global || { __version: r.__version__ };
          t.global = merge(t.global, o);
        } else if (n.type === "local") {
          t.local = t.local || { __version: r.__version__ };
          t.local = merge(t.local, o);
        }
      }
    }
  }
  return t;
};

const syncMigrateConfigs = (t, i) => {
  var o = ["properties", "laboratory", "custom"];
  for (let e = 0; e < o.length; e++) {
    var a = o[e];
    if (t[a]) {
      for (const g in t[a]) {
        n = undefined;
        s = undefined;
        l = undefined;
        c = undefined;
        var n = g;
        var s = a;
        var l = t[a][g].type;
        var c = n.split(".");
        let o = i[l] || {};
        let r = true;
        for (let e = 0; e < c.length; e++) {
          if (o[c[e]] === undefined || o[c[e]] == null) {
            delete t[s][n];
            r = false;
            break;
          }
          o = o[c[e]];
        }

        if (r && o !== t[s][n].value) {
          t[s][n].value = o;
        }
      }
    }
  }
};
