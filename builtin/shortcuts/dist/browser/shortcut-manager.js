Object.defineProperty(exports, "__esModule", { value: true });
exports.shortcutManager = undefined;

const { handleOptionsToShortcut } = require("../utils");

const { debounce } = require("lodash");

const debounceEmitChange = debounce((t) => {
  Editor.Message.broadcast("shortcuts:change", t);
}, 300);

class ShortcutManager {
  emitChange = debounceEmitChange;
  _packagesShortcutConfig = {};
  _userConfig = {};
  _shortcutMapCache = {};
  _shortcutListCache = {};
  _dirty = false;
  get shortcutMap() {
    if (this._dirty) {
      this._shortcutMapCache = this.queryShortcutMap();
    }

    return this._shortcutMapCache;
  }
  get queryPackagesShortcutList() {
    if (this._dirty) {
      this._shortcutListCache = this.queryShortcutList();
      this._dirty = false;
    }

    return this._shortcutListCache;
  }
  queryShortcutList() {
    const e = JSON.parse(JSON.stringify(this._packagesShortcutConfig));

    Object.keys(this._userConfig).forEach((s) => {
      if (!e[s]) {
        e[s] = {};
      }

      if (this._packagesShortcutConfig[s]) {
        const r = e[s];
        var t = this._userConfig[s];
        Object.values(t).forEach((t) => {
          var e = this.getKeyFromItem(t, true);
          this._packagesShortcutConfig[s] =
            this._packagesShortcutConfig[s] || {};

          if (!this._packagesShortcutConfig[s][e]) {
            t.missing = true;
          }

          t.key = e;
          r[t.key] = t;
        });
      }
    });

    return e;
  }
  queryShortcutMap() {
    const e = {};

    Object.keys(this.queryPackagesShortcutList).forEach((t) => {
      t = this.queryPackagesShortcutList[t];
      Object.values(t).forEach((t) => {
        e[t.shortcut] = e[t.shortcut] || [];
        e[t.shortcut].push(t);
      });
    });

    return e;
  }
  async init() {
    this._userConfig =
      (await Editor.Profile.getConfig("shortcuts", "userConfig", "global")) ||
      {};

    Editor.Package.getPackages({ enable: true }).forEach((t) =>
      this.register(t)
    );

    Editor.Package.__protected__.on("enable", (t) => this.register(t));

    Editor.Package.__protected__.on("disable", (t) => this.unRegister(t));
  }
  register(t) {
    if (!t.invalid) {
      var e = t.info.contributions ? t.info.contributions.shortcuts : [];
      if (Array.isArray(e) && e.length !== 0) {
        var s = {};
        for (const a of e) {
          var r;
          var i = handleOptionsToShortcut(a);

          if (i) {
            s[(r = this.getKeyFromItem(Object.assign(a, { shortcut: i })))] = {
              shortcut: i,
              when: a.when,
              message: a.message,
              pkgName: t.name,
              key: r,
            };
          }
        }
        this._packagesShortcutConfig[t.name] = s;
        this._dirty = true;
        this.emitChange(t.name);
      }
    }
  }
  unRegister(t) {
    delete this._packagesShortcutConfig[t.name];
    this._dirty = true;
    this.emitChange(t.name);
  }
  async changeShortcut(t, e) {
    if (!this._packagesShortcutConfig[t.pkgName] || typeof e != "string") {
      return false;
    }
    var s = this.getKeyFromItem(t, true);
    if (!this._packagesShortcutConfig[t.pkgName][s]) {
      return e === "" && (delete this._userConfig[t.pkgName][s], true);
    }

    if (!this._userConfig[t.pkgName]) {
      this._userConfig[t.pkgName] = {};
    }

    var r = this.getKeyFromItem(t);

    var r =
      (delete this._userConfig[t.pkgName][r], JSON.parse(JSON.stringify(t)));

    var e = this.getKeyFromItem(
      Object.assign(r, {
        shortcut: e,
        rawShortcut:
          t.rawShortcut || this._packagesShortcutConfig[t.pkgName][s].shortcut,
        when: this._packagesShortcutConfig[t.pkgName][s].when,
      })
    );

    if (r.rawShortcut) {
      this._userConfig[t.pkgName][e] = r;
      await this.saveUserConfig();
    }

    this._dirty = true;
    this.emitChange(t.pkgName);
    return true;
  }
  async resetShortcut(t) {
    var e;
    var s = this.getKeyFromItem(t);

    if (this._userConfig[t.pkgName] && this._userConfig[t.pkgName][s]) {
      e = this._userConfig[t.pkgName][s];
      delete this._userConfig[t.pkgName][s];
      await this.saveUserConfig();
      this._dirty = true;
      this.emitChange(t.pkgName);

      return (
        e.rawShortcut ||
        this._packagesShortcutConfig[t.pkgName][this.getKeyFromItem(t, true)]
          .shortcut
      );
    }

    if (!t.rawShortcut) {
      return t.shortcut;
    }
  }
  getKeyFromItem(t, e = false) {
    e = (e && t.rawShortcut) || t.shortcut || "(empty)";
    return t.message + (t.when || "") + e;
  }
  async removeCustomShortcut(t) {
    var e = this.getKeyFromItem(t);
    return !(
      !this._userConfig[t.pkgName] ||
      !this._userConfig[t.pkgName][e] ||
      (delete this._userConfig[t.pkgName][e],
      await this.saveUserConfig(),
      (this._dirty = true),
      this.emitChange(t.pkgName),
      0)
    );
  }
  async saveUserConfig() {
    Object.keys(this._userConfig).forEach((t) => {
      if (Object.keys(this._userConfig[t]).length === 0) {
        delete this._userConfig[t];
      }
    });

    await Editor.Profile.setConfig(
      "shortcuts",
      "userConfig",
      this._userConfig,
      "global"
    );
  }
}
exports.shortcutManager = new ShortcutManager();
