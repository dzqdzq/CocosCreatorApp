var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetManager = undefined;
exports.AssetManager = undefined;
exports.searchAssets = searchAssets;
const asset_db_1 = require("@editor/asset-db");

const { queryUUID, queryAsset, forEach, queryUrl, refresh, reimport } =
  asset_db_1;

const { isAbsolute, basename, extname, dirname, join } = require("path");

const asset_db_manager_1 = require("../asset-db-manager");

const {
  url2uuid,
  libArr2Obj,
  getExtendsFromCCType,
  url2path,
  ensureOutputData,
  serializeCompiled,
  moveFile,
  removeFile,
} = require("../utils");

const asset_handler_manager_1 = require("./asset-handler-manager");
const minimatch_1 = __importDefault(require("minimatch"));
const events_1 = __importDefault(require("events"));
const mask_sync_1 = require("../mask-sync");

const { assetAdded, assetChanged, assetDeleted } = mask_sync_1;

const { outputFile, copy, existsSync, rename } = require("fs-extra");

const asset_cache_1 = require("./asset-cache");
class AssetManager extends events_1.default {
  async queryAssetDependencies(e, s = "asset") {
    e = this.queryAsset(e);
    if (!e) {
      return [];
    }
    let t = [];

    if (["asset", "all"].includes(s)) {
      t = this.queryAssetProperty(e, "depends");
    }

    if (["script", "all"].includes(s)) {
      if (this.queryAssetProperty(e, "type") === "cc.Script") {
        s = await Editor.Message.request(
          "programming",
          "packer-driver/query-script-deps",
          e.source
        );

        t.push(...s.map((e) => queryUUID(e)));
      } else {
        t.push(...this.queryAssetProperty(e, "dependScripts"));
      }
    }

    return t;
  }
  async queryAssetUsers(e, s = "asset") {
    e = this.queryAsset(e);
    if (!e) {
      return [];
    }
    var t = this.queryAssetProperty(e, "type");
    let a = [];

    if (["asset", "all"].includes(s)) {
      a =
        t === "cc.Script"
          ? this.queryAssetProperty(e, "dependedScripts")
          : this.queryAssetProperty(e, "dependeds");
    }

    if (["script", "all"].includes(s) && t === "cc.Script") {
      (
        await Editor.Message.request(
          "programming",
          "packer-driver/query-script-users",
          e.source
        )
      ).forEach((e) => a.push(queryUUID(e)));
    }

    return a;
  }
  queryAsset(e) {
    var s = Editor.Utils.UUID.isUUID(e) ? e : this.queryAssetUUID(e);
    for (const a in asset_db_manager_1.assetDBManager.assetDBMap) {
      var t = asset_db_manager_1.assetDBManager.assetDBMap[a];
      if (t) {
        if (s === "db://" + a) {
          return {
            displayName: "",
            basename: a,
            extname: "",
            imported: true,
            source: "db://" + a,
            subAssets: {},
            library: "",
            parent: null,
            userData: {},
            isDirectory() {
              return false;
            },
            uuid: "db://" + a,
            meta: {
              ver: "1.0.0",
              uuid: "db://" + a,
              name: a,
              id: a,
              subMetas: {},
              userData: {},
              importer: "database",
              imported: true,
              files: [],
              displayName: "",
            },
          };
        }
        t = t.getAsset(s || "");
        if (t) {
          return t;
        }
      }
    }
    return null;
  }
  queryAssetInfo(e, s) {
    if (!e || typeof e != "string") {
      throw new Error("parameter error");
    }
    let t = "";
    if (e.startsWith("db://")) {
      var a = e.substr(5);
      if (asset_db_manager_1.assetDBManager.assetDBMap[a]) {
        return exports.assetManager.queryDBAssetInfo(a);
      }
      t = url2uuid(e);
    } else if (isAbsolute(e)) {
      for (const n in asset_db_manager_1.assetDBManager.assetDBMap) {
        var r = asset_db_manager_1.assetDBManager.assetDBMap[n];
        if (r && r.path2asset.has(e)) {
          t = r.path2asset.get(e).uuid;
          break;
        }
      }
    } else {
      t = e;
    }
    return t ? this.queryAssetInfoByUUID(t, s) : null;
  }
  queryAssetInfoByUUID(e, s) {
    return (e = e && queryAsset(e)) ? this.encodeAsset(e, s) : null;
  }
  queryAssetInfos(s, t) {
    let e = [];
    var a = [];
    for (const o in asset_db_manager_1.assetDBManager.assetDBMap) {
      var r = asset_db_manager_1.assetDBManager.assetDBMap[o];
      e = e.concat(Array.from(r.uuid2asset.values()));
      a.push(this.queryDBAssetInfo(o));
    }
    let n = e;

    if (s) {
      s.isBundle && (t = (t || []).concat(["meta"]));

      i = FilterHandlerInfos.filter((e) => {
        e.value = s[e.name];

        if (e.resolve) {
          e.value = e.resolve(e.value);
        }

        return e.value !== undefined;
      });

      n = searchAssets(i, e);
    }

    var i = n.map((e) => this.encodeAsset(e, t));
    return !s || (e.length && e.length === i.length)
      ? i.concat(a)
      : s.pattern && Object.keys(s).length === 1
      ? a.filter((e) => (0, minimatch_1.default)(e.url, s.pattern)).concat(i)
      : i;
  }
  queryAssets(s = {}) {
    if (typeof s != "object" || Array.isArray(s)) {
      s = {};
    }

    let e = [];
    for (const r in asset_db_manager_1.assetDBManager.assetDBMap) {
      var t;

      if (r in asset_db_manager_1.assetDBManager.assetDBMap) {
        t = asset_db_manager_1.assetDBManager.assetDBMap[r];
        e = e.concat(Array.from(t.uuid2asset.values()));
      }
    }
    var a;

    if (s) {
      a = FilterHandlerInfos.filter((e) => {
        e.value = s[e.name];

        if (e.resolve) {
          e.value = e.resolve(e.value);
        }

        return e.value !== undefined;
      });

      e = searchAssets(a, e);
    }

    return e;
  }
  async saveAssetMeta(e, s, t) {
    if (typeof s != "object" || Array.isArray(s)) {
      throw new Error(
        `Save meta failed(${e}): The meta must be an Object string`
      );
    }
    mergeMeta((t = t || this.queryAsset(e)).meta, s);
    await t.save();
  }
  async saveAsset(e, s) {
    e = this.queryAsset(e);
    if (!e) {
      throw new Error("" + Editor.I18n.t("asset-db.saveAsset.fail.asset"));
    }
    if (e._assetDB.options.readonly) {
      throw new Error(
        Editor.I18n.t("asset-db.operation.readonly") +
          ` 
  url: ` +
          e.url
      );
    }
    if (s === undefined) {
      throw new Error("" + Editor.I18n.t("asset-db.saveAsset.fail.content"));
    }
    if (e.source) {
      if (await asset_handler_manager_1.assetHandlerManager.saveAsset(e, s)) {
        this.reimportAsset(e.uuid);
      }

      return exports.assetManager.encodeAsset(e);
    }
    throw new Error("" + Editor.I18n.t("asset-db.saveAsset.fail.uuid"));
  }
  encodeAsset(
    s,
    s_parent = ["displayName", "subAssets", "redirect", "visible", "extends"],
    t = false
  ) {
    let a = "";
    let r = "";
    let n = "";
    var i;
    var o;
    var u;
    var s_assetDB = s._assetDB;

    if (s.uuid === s.source || (s instanceof asset_db_1.Asset && s.source)) {
      a = basename(s.source);

      r = asset_db_manager_1.assetDBManager.path2url(
        s.source,
        s_assetDB.options.name
      );

      n = s.source;
    } else {
      a = s._name;
    }

    let _ = a;
    let l = a;
    if (s.uuid === s.source || s instanceof asset_db_1.Asset) {
      l = r;
      _ = r;
    } else {
      let s_parent = s.parent;

      while (s_parent && !(s_parent instanceof asset_db_1.Asset)) {
        _ = s_parent._name + "/" + a;
        s_parent = s_parent.parent;
      }

      if (s_parent instanceof asset_db_1.Asset) {
        i = extname(s_parent._source);

        o = asset_db_manager_1.assetDBManager.path2url(
          s_parent._source,
          s_assetDB.options.name
        );

        l = o + "/" + _;
        _ = o.substr(0, o.length - i.length) + "/" + _;
      }
    }
    let c = false;
    try {
      c = s.isDirectory();
    } catch (e) {
      if (t) {
        console.debug(e);
      } else {
        console.error(e);
      }

      c = extname(s.source) === "";
    }

    if (!c) {
      _ = _.replace(/\.[^./]+$/, "");
    }

    const p = {
      name: a,
      displayName: s.displayName,
      source: r,
      path: _,
      url: l,
      file: n,
      uuid: s.uuid,
      importer: s.meta.importer,
      imported: s.meta.imported,
      invalid: s.invalid,
      type: this.queryAssetProperty(s, "type"),
      isDirectory: c,
      instantiation: this.queryAssetProperty(s, "instantiation"),
      readonly: s_assetDB.options.readonly,
      library: libArr2Obj(s),
    };

    s_parent.forEach((e) => {
      p[e] = this.queryAssetProperty(s, e) ?? p[e];
    });

    if (!s_parent.includes("isBundle")) {
      if (this.queryAssetProperty(s, "isBundle")) {
        p.isBundle = true;
      }
    }

    if (s_parent.includes("fatherInfo") && s.parent) {
      p.fatherInfo = {
        source: s.parent.source,
        library: libArr2Obj(s.parent),
        uuid: s.parent.uuid,
      };
    }

    if (s_parent.includes("subAssets")) {
      p.subAssets = {};
      for (const a in s.subAssets) {
        if (a in s.subAssets) {
          u = this.encodeAsset(s.subAssets[a], s_parent);
          p.subAssets[a] = u;
        }
      }
    }

    return p;
  }
  queryAssetProperty(n, n_parent) {
    switch (n_parent) {
      case "path": {
        var t = this.queryAssetProperty(n, "name");
        let n_parent_1 = t;
        if (n instanceof asset_db_1.Asset) {
          n_parent_1 = asset_db_manager_1.assetDBManager.path2url(
            n.source,
            n._assetDB.options.name
          );
        } else {
          let n_parent = n.parent;

          while (n_parent && !(n_parent instanceof asset_db_1.Asset)) {
            n_parent_1 = n_parent._name + "/" + t;
            n_parent = n_parent.parent;
          }

          if (n_parent instanceof asset_db_1.Asset) {
            i = extname(n_parent._source);

            a = asset_db_manager_1.assetDBManager.path2url(
              n_parent._source,
              n._assetDB.options.name
            );

            n_parent_1 = a.substr(0, a.length - i.length) + "/" + n_parent_1;
          }
        }
        var a = n.isDirectory();
        return (n_parent_1 = a
          ? n_parent_1
          : n_parent_1.replace(/\.[^./]+$/, ""));
      }
      case "name": {
        return n.uuid === n.source ||
          (n instanceof asset_db_1.Asset && n.source)
          ? basename(n.source)
          : n._name;
      }
      case "url": {
        var r = this.queryAssetProperty(n, "name");
        if (n.uuid === n.source || n instanceof asset_db_1.Asset) {
          return asset_db_manager_1.assetDBManager.path2url(
            n.source,
            n._assetDB.options.name
          );
        }
        {
          let n_parent = r;
          let n_parent_1 = n.parent;

          while (n_parent_1 && !(n_parent_1 instanceof asset_db_1.Asset)) {
            n_parent = n_parent_1._name + "/" + r;
            n_parent_1 = n_parent_1.parent;
          }

          return n_parent_1 instanceof asset_db_1.Asset
            ? asset_db_manager_1.assetDBManager.path2url(
                n_parent_1._source,
                n._assetDB.options.name
              ) +
                "/" +
                n_parent
            : n_parent;
        }
      }
      case "type": {
        var i =
          asset_handler_manager_1.assetHandlerManager.name2handler[
            n.meta.importer
          ] ||
          n._assetDB.importerManager.name2importer[n.meta.importer] ||
          null;
        return (i && i.assetType) || "cc.Asset";
      }
      case "isBundle": {
        return n.meta.userData && n.meta.userData.isBundle;
      }
      case "instantiation": {
        a =
          asset_handler_manager_1.assetHandlerManager.name2handler[
            n.meta.importer
          ] ||
          n._assetDB.importerManager.name2importer[n.meta.importer] ||
          null;
        return a ? a.instantiation : undefined;
      }
      case "library": {
        return libArr2Obj(n);
      }
      case "displayName": {
        return n.displayName;
      }
      case "redirect": {
        if (n.meta.userData && n.meta.userData.redirect) {
          i = this.queryAsset(n.meta.userData.redirect);
          if (i) {
            a =
              asset_handler_manager_1.assetHandlerManager.name2handler[
                i.meta.importer
              ] || null;

            return { uuid: i.uuid, type: (a && a.assetType) || "cc.Asset" };
          }
        }
        return;
      }
      case "extends": {
        i = this.queryAssetProperty(n, "type");
        return getExtendsFromCCType(i);
      }
      case "visible": {
        let n_parent = n._assetDB.options.visible;
        return (
          false !==
          (n_parent =
            n_parent && n.userData.visible === false ? false : n_parent)
        );
      }
      case "mtime": {
        a = n._assetDB.infoManager.get(n.source);
        return a ? a.time : null;
      }
      case "meta": {
        return n.meta;
      }
      case "depends": {
        return Array.from(n.getData("depends") || []);
      }
      case "dependeds": {
        const o = [];

        const u = Object.values(n.subAssets).map((e) => e.uuid);

        let r;

        r = u.length
          ? (u.push(n.uuid),
            (s, t) => {
              u.forEach((e) => {
                if (s.includes(e) && !u.includes(t)) {
                  o.push(t);
                }
              });
            })
          : (e, s) => {
              if (e.includes(n.uuid)) {
                o.push(s);
              }
            };

        forEach((e) => {
          var s = e.dataManager.dataMap;
          for (const a in s) {
            var t = s[a];

            if (t.value && t.value.depends && t.value.depends.length) {
              r(t.value.depends, a);
            }
          }
        });

        return o;
      }
      case "dependScripts": {
        i = n._assetDB.dataManager.dataMap[n.uuid];
        return Array.from((i && i.value && i.value.dependScripts) || []);
      }
      case "dependedScripts": {
        const d = [];

        forEach((e) => {
          var s = e.dataManager.dataMap;
          for (const a in s) {
            var t = s[a];

            if (
              t.value &&
              t.value.dependScripts &&
              t.value.dependScripts.includes(n.uuid)
            ) {
              d.push(a);
            }
          }
        });

        return d;
      }
    }
  }
  queryAssetMeta(e) {
    if (!e || typeof e != "string") {
      return null;
    }
    if (e.startsWith("db://")) {
      var s = e.substr(5);
      if (asset_db_manager_1.assetDBManager.assetDBMap[s]) {
        return {
          files: [],
          imported: true,
          importer: "database",
          subMetas: {},
          userData: {},
          uuid: e,
          ver: "1.0.0",
        };
      }
      e = url2uuid(e);
    }
    s = queryAsset(e);
    return s ? s.meta : null;
  }
  queryAssetMtime(e) {
    if (e && typeof e == "string") {
      for (const a in asset_db_manager_1.assetDBManager.assetDBMap) {
        if (a in asset_db_manager_1.assetDBManager.assetDBMap) {
          var s = asset_db_manager_1.assetDBManager.assetDBMap[a];
          if (s) {
            var t = s.getAsset(e);
            if (t) {
              return (s = s.infoManager.get(t.source)) ? s.time : null;
            }
          }
        }
      }
    }
    return null;
  }
  queryAssetUUID(e) {
    if (!e || typeof e != "string") {
      return null;
    }
    if (e.startsWith("db://")) {
      var s = e.substr(5);
      if (asset_db_manager_1.assetDBManager.assetDBMap[s]) {
        return "db://" + s;
      }
      s = url2uuid(e);
      if (s) {
        return s;
      }
    }
    try {
      return queryUUID(e);
    } catch (e) {
      return null;
    }
  }
  queryDBAssetInfo(e) {
    var s = asset_db_manager_1.assetDBManager.assetDBInfo[e];
    return s
      ? {
          name: e,
          displayName: e || "",
          source: "db://" + e,
          path: "db://" + e,
          url: "db://" + e,
          file: s.target,
          uuid: "db://" + e,
          importer: "database",
          imported: true,
          invalid: false,
          type: "database",
          isDirectory: false,
          library: {},
          subAssets: {},
          visible: s.visible,
          instantiation: undefined,
          readonly: s.readonly,
        }
      : null;
  }
  queryUrl(e) {
    var s;
    if (e && typeof e == "string") {
      s = e.substr(Editor.Project.path.length + 1);

      return asset_db_manager_1.assetDBManager.assetDBMap[s]
        ? "db://" + s
        : queryUrl(e);
    }
    throw new Error("parameter error");
  }
  checkValidUrl(e) {
    if (!e.startsWith("db://") && !(e = this.queryUrl(e))) {
      throw new Error(
        Editor.I18n.t("asset-db.operation.invalid_url") +
          ` 
  url: ` +
          e
      );
    }
    var s = e.split("/").filter(Boolean)[1];
    if (asset_db_manager_1.assetDBManager.assetDBInfo[s].readonly) {
      throw new Error(
        Editor.I18n.t("asset-db.operation.readonly") +
          ` 
  url: ` +
          e
      );
    }
    return true;
  }
  async createAsset(e) {
    if (!e.target || typeof e.target != "string") {
      throw new Error(
        "Cannot create asset because options.target is required."
      );
    }
    this.checkValidUrl(e.target);

    if (!isAbsolute(e.target)) {
      e.target = url2path(e.target);
    }

    e = await asset_handler_manager_1.assetHandlerManager.createAsset(e);
    if (!e || !e.length) {
      return null;
    }
    let s = [];
    s = typeof e == "string" ? [e] : e;
    e = await Promise.all(
      s.map(async (e) => {
        await this.refreshAsset(e);
        return this.queryAssetInfo(queryUUID(e));
      })
    );
    return e.length === 1 ? e[0] : e;
  }
  async createAssetDialog(e) {
    e = await asset_handler_manager_1.assetHandlerManager.createAssetDialog(e);
    if (!e || !e.length) {
      return null;
    }
    let s = [];
    s = typeof e == "string" ? [e] : e;
    e = await Promise.all(
      s.map(async (e) => {
        await this.refreshAsset(e);
        return this.queryAssetInfo(queryUUID(e));
      })
    );
    return e.length === 1 ? e[0] : e;
  }
  async generateExportData(e, s) {
    var t = e.getData("output");
    if (!t || s) {
      var a =
        await asset_handler_manager_1.assetHandlerManager.generateExportData(
          e,
          s
        );
      if (a) {
        return a;
      }
      if (!e.meta.files.includes(".json") && !e.meta.files.includes(".cconb")) {
        return null;
      }
      t = ensureOutputData(e);

      if (s && t.native) {
        (a = asset_cache_1.assetOutputPathCache.query(e.uuid, s))
          ? (t.import.path = a)
          : ((a = await serializeCompiled(e, s)),
            await outputFile(t.import.path, a),
            await asset_cache_1.assetOutputPathCache.add(e, s, t.import.path));

        e.setData("output", t);
      }
    }
    return t;
  }
  async outputExportData(e, s, t) {
    e = await asset_handler_manager_1.assetHandlerManager.outputExportData(
      e,
      s,
      t
    );
    if (
      !e &&
      (await copy(s.import.path, t.import.path), s.native) &&
      t.native
    ) {
      e = Object.values(s.native);
      const a = Object.values(t.native);
      await Promise.all(e.map((e, s) => copy(e, a[s])));
    }
  }
  async refreshAsset(e) {
    return asset_db_manager_1.assetDBManager.addTask(
      this._refreshAsset.bind(this),
      [e]
    );
  }
  async _refreshAsset(e, s = true) {
    console.debug(`start refresh asset from ${e}...`);
    var t = await refresh(e);

    if (s) {
      asset_db_manager_1.assetDBManager.addTask(
        asset_db_manager_1.assetDBManager.autoRefreshAssetLazy.bind(
          asset_db_manager_1.assetDBManager
        ),
        [dirname(e)]
      );
    }

    console.debug(`refresh asset ${dirname(e)} success`);
    return t;
  }
  async reimportAsset(e) {
    return asset_db_manager_1.assetDBManager.addTask(
      this._reimportAsset.bind(this),
      [e]
    );
  }
  async _reimportAsset(e) {
    if (e.startsWith("db://")) {
      e = url2uuid(e);
    }

    Editor.Metrics.trackTimeStart("asset-db:reimport-asset" + e);
    await reimport(e);

    Editor.Metrics.trackTimeEnd("asset-db:reimport-asset" + e, {
      output: true,
    });
  }
  async moveAsset(e, s, t) {
    return asset_db_manager_1.assetDBManager.addTask(
      this._moveAsset.bind(this),
      [e, s, t]
    );
  }
  async _moveAsset(e, s, t) {
    console.debug(`start move asset from ${e} -> ${s}...`);

    if (existsSync(s) && t?.overwrite) {
      await this._removeAsset(s);
    }

    await moveFile(e, s, t);
    var t = queryUrl(s);
    var a = /db:\/\/[^/]+/.exec(t);

    if (a && a[0] && t.startsWith(a[0])) {
      await this.refreshAsset(s);
      await this.refreshAsset(dirname(e));
    } else {
      await this.refreshAsset(e);
      await this.refreshAsset(s);
    }

    console.debug(`move asset from ${e} -> ${s} success`);
  }
  async renameAsset(e, s, t) {
    return asset_db_manager_1.assetDBManager.addTask(
      this._renameAsset.bind(this),
      [e, s, t]
    );
  }
  async _renameAsset(e, s, t) {
    console.debug(`start rename asset from ${e} -> ${s}...`);

    var a = {
      basename: basename(s),
      dirname: dirname(s),
    };

    var a = join(a.dirname, ".rename_temp");
    await rename(e + ".meta", a + ".meta");
    await rename(e, a);
    await this._refreshAsset(e, false);
    await rename(a + ".meta", s + ".meta");
    await rename(a, s);
    await this._refreshAsset(s);
    console.debug(`rename asset from ${e} -> ${s} success`);
  }
  async removeAsset(e) {
    var s = this.queryAsset(e);
    if (!s) {
      throw new Error(
        Editor.I18n.t("asset-db.deleteAsset.fail.unexist") +
          ` 
source: ` +
          e
      );
    }
    if (s._assetDB.options.readonly) {
      throw new Error(
        Editor.I18n.t("asset-db.operation.readonly") +
          ` 
  url: ` +
          s.url
      );
    }
    e = s.source;
    return (await asset_db_manager_1.assetDBManager.addTask(
      this._removeAsset.bind(this),
      [e]
    ))
      ? this.encodeAsset(s)
      : null;
  }
  async _removeAsset(e) {
    console.debug(`start remove asset ${e}...`);
    let s = false;
    try {
      await removeFile(e);
      await this.refreshAsset(e);
      s = true;
      console.debug(`remove asset ${e} success`);
    } catch (e) {
      console.warn("" + Editor.I18n.t("asset-db.deleteAsset.fail.unknown"));
      console.warn(e);
    }
    return s;
  }
  url2uuid(e) {
    return url2uuid(e);
  }
  url2path(e) {
    return url2path(e);
  }
  path2url(e, s) {
    return asset_db_manager_1.assetDBManager.path2url(e, s);
  }
  init() {
    asset_db_manager_1.assetDBManager.on("db-created", this._onAssetDBCreated);

    asset_db_manager_1.assetDBManager.on("db-started", this._onAssetDBStarted);

    asset_db_manager_1.assetDBManager.on("db-removed", this._onAssetDBRemoved);
  }
  destroyed() {
    asset_db_manager_1.assetDBManager.removeListener(
      "db-created",
      this._onAssetDBCreated
    );

    asset_db_manager_1.assetDBManager.removeListener(
      "db-started",
      this._onAssetDBStarted
    );

    asset_db_manager_1.assetDBManager.removeListener(
      "db-removed",
      this._onAssetDBRemoved
    );
  }
  _onAssetDBCreated(e) {
    e.on("unresponsive", onUnResponsive);
    e.on("added", exports.assetManager._onAssetAdded);
    e.on("changed", exports.assetManager._onAssetChanged);
    e.on("deleted", exports.assetManager._onAssetDeleted);
    e.on("add", mask_sync_1.assetAdd);
    e.on("delete", mask_sync_1.assetChange);
    e.on("change", mask_sync_1.assetDeleted);
  }
  _onAssetDBStarted(e) {
    e.removeListener("add", mask_sync_1.assetAdd);
    e.removeListener("change", mask_sync_1.assetChange);
    e.removeListener("delete", mask_sync_1.assetDeleted);
  }
  _onAssetDBRemoved(e) {
    e.removeListener("unresponsive", onUnResponsive);
    e.removeListener("added", exports.assetManager._onAssetAdded);
    e.removeListener("changed", exports.assetManager._onAssetChanged);
    e.removeListener("deleted", exports.assetManager._onAssetDeleted);
  }
  async _onAssetAdded(e) {
    if (asset_db_manager_1.assetDBManager.ready) {
      this.emit("asset-add", e);

      Editor.Message.broadcast(
        "asset-db:asset-add",
        e.uuid,
        await exports.assetManager.encodeAsset(e),
        e.meta
      );
    } else {
      assetAdded(e);
    }
  }
  async _onAssetChanged(e) {
    if (asset_db_manager_1.assetDBManager.ready) {
      this.emit("asset-change", e);

      Editor.Message.broadcast(
        "asset-db:asset-change",
        e.uuid,
        await exports.assetManager.encodeAsset(e),
        e.meta
      );
    } else {
      assetChanged(e);
    }
  }
  async _onAssetDeleted(e) {
    if (asset_db_manager_1.assetDBManager.ready) {
      this.emit("asset-delete", e);

      Editor.Message.broadcast(
        "asset-db:asset-delete",
        e.uuid,
        await exports.assetManager.encodeAsset(e, undefined, true),
        e.meta
      );
    } else {
      assetDeleted(e);
    }
  }
}
async function onUnResponsive(e, s) {
  if (asset_db_manager_1.assetDBManager.ready) {
    if (
      (
        await Editor.Dialog.info(
          `Resource import Timeout.
  uuid: ${e.uuid}
  url: ` + e.url,
          { buttons: ["Waiting", "Interrupt"] }
        )
      ).response === 1
    ) {
      s.reject("User interrupt");
    }
  } else {
    console.debug("import asset unresponsive");
  }
}
function mergeMeta(s, t) {
  Object.keys(t).map((e) => {
    if (e === "subMetas") {
      Object.keys(t.subMetas).forEach((e) => {
        if (!s.subMetas[e]) {
          s.subMetas[e] = {};
        }

        mergeMeta(s.subMetas[e], t.subMetas[e]);
      });

      s.subMetas &&
        Object.keys(s.subMetas).forEach((e) => {
          if (!(e in t.subMetas)) {
            delete s.subMetas[e];
          }
        });
    } else {
      s[e] = t[e];
    }
  });
}
exports.AssetManager = AssetManager;
exports.assetManager = new AssetManager();
const TYPES = {
  scripts: [".js", ".ts"],
  scene: [".scene"],
  effect: [".effect"],
  image: [".jpg", ".png", ".jpeg", ".webp", ".tga"],
};
function searchAssets(e, s, t = []) {
  return e.length
    ? (s.forEach((s) => {
        if (s.subAssets && Object.keys(s.subAssets).length > 0) {
          searchAssets(e, Object.values(s.subAssets), t);
        }

        if (!e.some((e) => e.value !== undefined && !e.handler(e.value, s))) {
          t.push(s);
        }
      }),
      t)
    : s;
}
function filterUserDataInfo(s, t) {
  return !Object.keys(s).some((e) => s[e] !== t.meta.userData[e]);
}
const FilterHandlerInfos = [
  {
    name: "ccType",
    handler: (e, s) =>
      e.includes(exports.assetManager.queryAssetProperty(s, "type")),
    resolve: (e) => (typeof e == "string" ? [e.trim()] : e),
  },
  {
    name: "pattern",
    handler: (e, s) => {
      var t = exports.assetManager.queryAssetProperty(s, "path");
      var s = exports.assetManager.queryAssetProperty(s, "url");
      return (0, minimatch_1.default)(t, e) || (0, minimatch_1.default)(s, e);
    },
    resolve: (e) => (typeof e == "string" ? e : undefined),
  },
  {
    name: "importer",
    handler: (e, s) => e.includes(s.meta.importer),
    resolve: (e) => {
      if (typeof e == "string") {
        return [e.trim()];
      }
    },
  },
  {
    name: "isBundle",
    handler: (e, s) =>
      !!exports.assetManager.queryAssetProperty(s, "isBundle") === e,
  },
  {
    name: "extname",
    handler: (e, s) => {
      var t = extname(s.source).toLowerCase();
      return !(!e.includes(t) || /\.d\.ts$/.test(s.source));
    },
    resolve(e) {
      return typeof e == "string"
        ? [e.trim().toLocaleLowerCase()]
        : Array.isArray(e)
        ? e.map((e) => e.trim().toLocaleLowerCase())
        : undefined;
    },
  },
  { name: "userData", handler: (e, s) => filterUserDataInfo(e, s) },
  {
    name: "type",
    handler: (e, s) =>
      e.includes(extname(s.source)) && !/\.d\.ts$/.test(s.source),
    resolve: (e) => {
      e = TYPES[e];
      if (e) {
        console.warn(
          Editor.I18n.t("asset-db.deprecatedTip", {
            oldName: "options.type",
            newName: "options.ccType",
            version: "3.8.0",
          })
        );

        return e;
      }
    },
  },
];
