var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { join } = require("path");

const events_1 = __importDefault(require("events"));
const console_1 = require("./../console");
const Profile = require("@base/electron-profile");
const _profile = Profile.load("local://editor/packages.json");
const _profileDefault = Profile.load(
  "defaultPreferences://editor/packages.json"
);
class PluginManager extends events_1.default {
  packageRegisterInfo = {};
  hookOrder = [];
  assetDBProfileMap = {};
  _tasks = [];
  _currentTask = null;
  pkgLock = {};
  ready = false;
  async init() {
    Editor.Metrics.trackTimeStart("asset-db:worker-init: initPlugin");
    console_1.newConsole.trackMemoryStart("asset-db:worker-init: initPlugin");
    var e = Editor.Package.getPackages({});

    await Promise.all(
      e.map(async (e) => {
        await this.onPackageRegister(e);

        if (e.enable) {
          await this.onPackageEnable(e);
        }
      })
    );

    Editor.Package.__protected__.on("register", registerAttach);
    Editor.Package.__protected__.on("enable", enableAttach);
    Editor.Package.__protected__.on("disable", disableDetach);
    Editor.Package.__protected__.on("unregister", unRegisterDetach);
    console_1.newConsole.trackMemoryEnd("asset-db:worker-init: initPlugin");

    Editor.Metrics.trackTimeEnd("asset-db:worker-init: initPlugin", {
      output: true,
    });

    this.ready = true;
    this.emit("ready");
  }
  async destroyed() {
    Editor.Package.__protected__.removeListener("register", registerAttach);
    Editor.Package.__protected__.removeListener("enable", enableAttach);
    Editor.Package.__protected__.removeListener("disable", disableDetach);

    Editor.Package.__protected__.removeListener("unregister", unRegisterDetach);
  }
  addTask(e, t, a, ...r) {
    this._tasks.push({ type: e, pkgName: t, handler: a, args: r });
    this.step();
  }
  async onPackageRegister(t) {
    var e = _profile.get("disable-packages." + t.path);
    if (!e) {
      e = _profileDefault.get("disable-packages." + t.path);
      if (!e && t.info.contributions && t.info.contributions["asset-db"]) {
        var e = t.info.contributions["asset-db"];

        var a = this.packageRegisterInfo[t.name] || {
          name: t.name,
          hooks: [],
          enable: false,
          internal: Editor.Utils.Path.contains(Editor.App.path, t.path),
        };

        console_1.newConsole.trackMemoryStart(
          "asset-db-plugin-register: " + t.name
        );

        if (e.importer && e.importer.script) {
          console.warn(
            `[Register ${t.name}]` +
              Editor.I18n.t("asset-db.deprecatedTip", {
                oldName: "contribution.importer",
                newName: "contribution.asset-handler",
                version: "3.8.3",
              })
          );

          if (!e.importer.list) {
            return;
          }

          var r = join(t.path, e.importer.script);
          try {
            a.importerRegisterInfo = { script: r, list: e.importer.list };
          } catch (e) {
            console.warn(
              `Failed to register the importer from ${t.name}: ` + r
            );

            console.warn(e);
          }
        }

        console_1.newConsole.trackMemoryEnd(
          "asset-db-plugin-register: " + t.name
        );

        this.packageRegisterInfo[t.name] = a;
      }
    }
  }
  async onPackageEnable(t) {
    if (!t.invalid) {
      var a = this.packageRegisterInfo[t.name];
      if (a) {
        a.enable = true;
        var e = t.info.contributions["asset-db"];
        if (e.script) {
          var r = join(t.path, e.script);
          try {
            var o = Editor.Module.__protected__.requireFile(r);

            if (typeof o.load == "function") {
              await o.load();
            }

            if (Array.isArray(e["global-hook"])) {
              a.hooks.push(...e["global-hook"]);
            }

            if (Array.isArray(e["mount-hook"])) {
              a.hooks.push(...e["mount-hook"]);
            }

            if (a.hooks.length) {
              this.hookOrder.push(t.name);
            }

            if (e["asset-handler"]) {
              a.assetHandlerInfos = e["asset-handler"];
            }

            a.script = r;
          } catch (e) {
            delete a.script;

            console.warn(
              `Description Failed to register the Asset-DB script from ${t.name}: ${a.script}.`
            );

            console.warn(e);
          }
        }

        if (
          e.mount &&
          ((a.mount = {
            ...e.mount,
            path: e.mount.path && join(t.path, e.mount.path),
          }),
          e.mount.enable)
        ) {
          this.assetDBProfileMap[`packages/${t.name}.json(${e.mount.enable})`] =
            t.name;
        }

        this.emit("enable", t.name, a);
      }
    }
  }
  async onPackageDisable(e) {
    var t = this.packageRegisterInfo[e.name];
    if (t) {
      t.enable = false;

      if (t.script) {
        try {
          var a = Editor.Module.__protected__.requireFile(t.script);

          if (a.unload) {
            a.unload();
          }
        } catch (e) {
          console.warn(e);
        }
        delete t.assetHandlerInfos;
        delete t.script;
      }

      this.hookOrder.splice(this.hookOrder.indexOf(e.name), 1);

      if (t.importerRegisterInfo) {
        try {
          var r = Editor.Module.__protected__.requireFile(
            t.importerRegisterInfo.script
          );

          if (r.unload) {
            r.unload();
          }
        } catch (e) {
          console.warn(e);
        }
        delete t.importerRegisterInfo;
      }

      if (t.mount) {
        delete this.assetDBProfileMap[
          `packages/${e.name}.json(${t.mount.enable})`
        ];

        delete t.mount;
      }

      this.emit("disabled", e.name, t);
    }
  }
  async unRegisterDetach(e) {
    if (this.packageRegisterInfo[e.name]) {
      delete this.packageRegisterInfo[e.name];
    }
  }
  async step() {
    if (this._tasks.length) {
      var t = this._tasks.findIndex((e) => !this.pkgLock[e.pkgName]);
      if (-1 !== t) {
        var e = this._tasks[t];

        var t =
          ((this.pkgLock[e.pkgName] = true),
          this._tasks.splice(t, 1),
          `run package(${e.pkgName}) handler(${e.type})`);

        try {
          console.debug(t + " start");
          await e.handler.call(this, ...e.args);
          console.debug(t + " success!");
        } catch (e) {
          console.error(e);
          console.error(t + " failed!");
        }
        this.pkgLock[e.pkgName] = false;
        await this.step();
      }
    }
  }
  async queryAssetDBInfos() {
    var e = [];
    for (const a of Object.keys(this.packageRegisterInfo)) {
      var t = await this.queryAssetDBInfo(a);

      if (t) {
        e.push(t);
      }
    }
    return e;
  }
  async queryAssetDBInfo(e) {
    var t = this.packageRegisterInfo[e];
    if (!t || !t.mount) {
      return null;
    }
    if (
      t.mount.enable &&
      !(
        (await Editor.Profile.getProject(t.name, t.mount.enable)) ||
        (await Editor.Profile.getConfig(t.name, t.mount.enable))
      )
    ) {
      return null;
    }
    return {
      name: e,
      readonly: !!t.mount.readonly,
      visible: t.mount.visible !== false,
      target: t.mount.path,
    };
  }
  getAssetDBInfo(e) {
    var t = this.packageRegisterInfo[e];
    return t && t.mount
      ? {
          name: e,
          readonly: !!t.mount.readonly,
          visible: t.mount.visible !== false,
          target: t.mount.path,
        }
      : null;
  }
  async executeScript(e) {
    if (!this.packageRegisterInfo[e.name]) {
      if ((t = (await Editor.Package.getPackages({ name: e.name }))[0])) {
        await enableAttach(t);
      }
    }

    var t = this.packageRegisterInfo[e.name];
    if (t && t.script && (t.enable || !this.ready)) {
      t = Editor.Module.__protected__.requireFile(t.script);
      if (t.methods && t.methods[e.method]) {
        return t.methods[e.method](...(e.args || []));
      }
    }
    throw "Asset database scripts do not exist: " + e.name + "/" + e.method;
  }
  async executeScriptSafe(e) {
    try {
      var t = this.packageRegisterInfo[e.name].script;
      var a = Editor.Module.__protected__.requireFile(t);
      if (a.methods && a.methods[e.method]) {
        return await a.methods[e.method](...(e.args || []));
      }
    } catch (e) {
      console.debug(e);
    }
  }
  async runHook(e, t = []) {
    for (const o of this.hookOrder) {
      var { hooks, enable } = this.packageRegisterInfo[o];

      if ((enable || !this.ready) && hooks.includes(e)) {
        Editor.Metrics.trackTimeStart(`asset-db-hook-${o}-` + e);
        console.debug(`Run asset db hook ${o}:${e} ...`);
        await this.executeScriptSafe({ name: o, method: e, args: t });
        console.debug(`Run asset db hook ${o}:${e} success!`);
        Editor.Metrics.trackTimeEnd(`asset-db-hook-${o}-` + e, {
          output: true,
        });
      }
    }
  }
  async registerImporterList(t) {
    for (const o in pluginManager.packageRegisterInfo) {
      var e = pluginManager.packageRegisterInfo[o];
      if (e.importerRegisterInfo) {
        var a = Editor.Module.__protected__.requireFile(
          e.importerRegisterInfo.script
        );
        for (const i of e.importerRegisterInfo.list) {
          if (a.methods && a.methods[i]) {
            try {
              var r = await a.methods[i]();
              t.importerManager.add(r.importer, r.extname);
            } catch (e) {
              console.warn(
                `Failed to register importer. Data is not compliant: ${t.options.name} ` +
                  i
              );

              console.warn(e);
            }
          } else {
            console.warn(
              `Failed to register importer. Data is not compliant: ${t.options.name} ` +
                i
            );
          }
        }
      }
    }
  }
}

const registerAttach = async (e) => {
  pluginManager.addTask("register", e.name, pluginManager.onPackageRegister, e);
};

const enableAttach = async (e) => {
  pluginManager.addTask("enable", e.name, pluginManager.onPackageEnable, e);
};

const disableDetach = async (e) => {
  pluginManager.addTask("disable", e.name, pluginManager.onPackageDisable, e);
};

const unRegisterDetach = async (e) => {
  pluginManager.addTask(
    "unregister",
    e.name,
    pluginManager.unRegisterDetach,
    e
  );
};

const pluginManager = new PluginManager();
exports.default = pluginManager;
