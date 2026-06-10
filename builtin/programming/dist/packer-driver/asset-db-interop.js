Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetChangeType = undefined;
exports.AssetDbInterop = undefined;

const { asserts } = require("../utils/asserts");

const { setTimeout } = require("timers");

const { pathToFileURL } = require("url");

const { getDatabaseModuleRootURL } = require("../utils/db-module-url");

const cache_1 = require("../shared/cache");

const { resolveFileName } = require("../utils/path");

class AssetDbInterop {
  _assetInfoCache = cache_1.assetInfoCache;
  _blockScriptUUIDSet = cache_1.blockAssetUUIDSet;
  _assetChangeTimeOut;
  _hasInit = false;
  broadcastListenerMap = {};
  constructor(e) {
    this._handler = e;

    this._assetChangeTimer = new AccumulatingTimer(this._waitTimeoutMs, () => {
      this._onAssetChangeTimerArrived();
    });
  }
  async init() {
    if (!this._hasInit) {
      this.broadcastListenerMap["asset-db:asset-change"] = async (...e) =>
        this._onAssetChange(AssetChangeType.modified, ...e);
      this.broadcastListenerMap["asset-db:asset-add"] = async (...e) =>
        this._onAssetChange(AssetChangeType.add, ...e);
      this.broadcastListenerMap["asset-db:asset-delete"] = async (...e) =>
        this._onAssetChange(AssetChangeType.remove, ...e);

      Object.keys(this.broadcastListenerMap).forEach((e) =>
        Editor.Message.__protected__.addBroadcastListener(
          e,
          this.broadcastListenerMap[e]
        )
      );

      this._hasInit = true;
    }
  }
  async destroyed() {
    Object.keys(this.broadcastListenerMap).forEach((e) =>
      Editor.Message.__protected__.removeBroadcastListener(
        e,
        this.broadcastListenerMap[e]
      )
    );

    this.broadcastListenerMap = {};
    this._hasInit = false;
  }
  async fetch(e) {
    return this.fetchAssetDb({
      assetDbOptions: { ccType: "cc.Script", pattern: `db://${e}/**/*.ts` },
      filter: filterForAssetChange,
      mapper: mapperForAssetChange,
    });
  }
  async fetchAll() {
    await this.fetchAllTypescripts();

    return this.fetchAssetDb({
      assetDbOptions: { ccType: "cc.Script" },
      filter: filterForAssetChange,
      mapper: mapperForAssetChange,
    });
  }
  async fetchAllTypescripts() {
    var t = await this.fetchAssetDb({
      assetDbOptions: { importer: "typescript" },
      mapper: mapperForAssetInfoCache,
    });
    for (let e = 0; e < t.length; e++) {
      var s = t[e];
      cache_1.assetInfoCache.set(s.filePath, s);
    }
  }
  async onMountDatabase(e) {
    var e = `db://${e.name}/**/*.ts`;

    var t = await this.fetchAssetDb({
      assetDbOptions: { importer: "typescript", pattern: e },
      mapper: mapperForAssetInfoCache,
    });

    for (let e = 0; e < t.length; e++) {
      var s = t[e];
      cache_1.assetInfoCache.set(s.filePath, s);
    }
    return t;
  }
  async onUnmountDatabase(t) {
    const s = [];

    cache_1.assetInfoCache.forEach((e) => {
      if (Editor.Utils.Path.normalize(e.filePath).startsWith(t.target)) {
        s.push(e);
        cache_1.assetInfoCache.delete(e.filePath);
      }
    });

    return s;
  }
  async queryAssetDomains() {
    var e = [];
    for (const s of await Editor.Message.request(
      "asset-db",
      "query-db-infos"
    )) {
      var t = getDatabaseModuleRootURL(s.name);
      var t = { root: new URL(t), physical: s.target };

      if (isPackageDomain(s.name)) {
        t.jail = s.target;
      }

      e.push(t);
    }
    return e;
  }
  async fetchAssetDb(t) {
    const s = [];

    const a =
      t?.mapper ??
      ((e) => ({
        assetInfo: e,
      }));

    var e = await Editor.Message.request(
      "asset-db",
      "query-assets",
      t?.assetDbOptions,
      ["meta", "url", "file", "importer", "type"]
    );

    if (e && e.length) {
      await Promise.all(
        e.map(async (e) => {
          if (!t?.filter || t?.filter(e)) {
            e = await a(e);
            s.push(e);
          }
        })
      );
    }

    return s;
  }
  _waitTimeoutMs = 10;
  _handler;
  _assetChangeTimer;
  _changeQueue = [];
  async _onAssetChange(e, t, s, a) {
    var i = {
      url: getURL(s),
      uuid: t,
      filePath: s.file,
      type: e,
      isPluginScript: isPluginScript(a),
    };

    var r = mapperForAssetInfoCache(s, a);
    if (e === AssetChangeType.modified && !this._assetInfoCache.has(s.file)) {
      for (const n of this._assetInfoCache.values()) {
        if (n.uuid === t) {
          this._assetInfoCache.delete(n.filePath);
          this._assetInfoCache.set(r.filePath, r);
          i.oldFilePath = n.filePath;
          i.newFilePath = r.filePath;
          break;
        }
      }
    }

    if (
      e === AssetChangeType.add &&
      (s.importer === "typescript" || s.isDirectory) &&
      !(-1 !==
        (a = this._changeQueue.findIndex(
          (e) => e.type === AssetChangeType.remove && e.uuid === t
        )) &&
        ((i.type = AssetChangeType.modified),
        (i.oldFilePath = resolveFileName(this._changeQueue[a].filePath)),
        (i.newFilePath = r.filePath),
        this._changeQueue.splice(a, 1)),
      s.importer !== "typescript")
    ) {
      this._assetInfoCache.set(r.filePath, r);
    }

    if (e === AssetChangeType.remove) {
      this._assetInfoCache.delete(s.file);
    }

    if (this._blockScriptUUIDSet.has(t)) {
      this._blockScriptUUIDSet.delete(t);
    } else if (filterForAssetChange(s)) {
      this._changeQueue.push(i);
      this._assetChangeTimer.refresh();
    }
  }
  _onAssetChangeTimerArrived() {
    var e = this._changeQueue;
    this._changeQueue = [];
    this._handler(e);
  }
}
var AssetChangeType;
exports.AssetDbInterop = AssetDbInterop;

((e) => {
  e[(e.add = 0)] = "add";
  e[(e.remove = 1)] = "remove";
  e[(e.modified = 2)] = "modified";
})(AssetChangeType || (exports.AssetChangeType = AssetChangeType = {}));

class AccumulatingTimer {
  constructor(e, t) {
    this._waitTimeoutMs = e;
    this._callback = t;
  }
  refresh() {
    if (this._timeout) {
      this._timeout.refresh();
    } else {
      this._timeout = setTimeout(async () => {
        this._callback();
        asserts(this._timeout);
        clearTimeout(this._timeout);
        this._timeout = undefined;
      }, this._waitTimeoutMs);
    }
  }
  _waitTimeoutMs;
  _timeout = undefined;
  _callback;
}
function filterForAssetChange(e) {
  return e.importer === "javascript" || e.importer === "typescript";
}
function mapperForAssetChange(e, t) {
  return {
    type: AssetChangeType.add,
    uuid: e.uuid,
    filePath: e.file,
    url: getURL(e),
    isPluginScript: isPluginScript(t || e.meta),
  };
}
function mapperForAssetInfoCache(e, t) {
  e.file = resolveFileName(e.file);

  return {
    uuid: e.uuid,
    filePath: e.file,
    url: getURL(e),
    isPluginScript: isPluginScript(t || e.meta),
  };
}
function isPluginScript(e) {
  return !!e?.userData?.isPlugin;
}
function getURL(e) {
  return pathToFileURL(e.file);
}
function isPackageDomain(e) {
  return !["assets", "internal"].includes(e);
}
