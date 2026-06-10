Object.defineProperty(exports, "__esModule", { value: true });
exports.previewImageManager = undefined;
exports.AssetPreviewImageManager = undefined;

const { existsSync } = require("fs-extra");

const stream_1 = require("stream");
class AssetPreviewImageManager extends stream_1.EventEmitter {
  cache = {};
  iconConfigMap = {};
  _hasInit = false;
  _defaultIcon = { type: "icon", value: "file" };
  _dbReady = false;
  get ready() {
    return this._dbReady && this._hasInit;
  }
  async init() {
    Editor.Message.__protected__.addBroadcastListener(
      "asset-db:ready",
      onAssetDBReady
    );

    Editor.Message.__protected__.addBroadcastListener(
      "asset-db:close",
      onAssetDBClose
    );

    Editor.Message.__protected__.addBroadcastListener(
      "asset-db:asset-delete",
      onAssetDelete
    );

    Editor.Message.__protected__.addBroadcastListener(
      "asset-db:asset-change",
      onAssetDelete
    );

    this._dbReady = await Editor.Message.request("asset-db", "query-ready");

    if (this._dbReady) {
      await this.refresh();
    }
  }
  async refresh() {
    try {
      this.iconConfigMap = await Editor.Message.request(
        "asset-db",
        "query-icon-config-map"
      );
    } catch (e) {
      console.error(e);
    }
    this._hasInit = true;
  }
  async onDBReady() {
    this._dbReady = true;
    await this.refresh();
    this.emit("ready");
  }
  async onDBClose() {
    this._dbReady = false;
    this.cache = {};
    this.emit("close");
  }
  async get(e, t, s) {
    if (!this._hasInit || (s && !this.iconConfigMap[s])) {
      return { type: "icon", value: "file" };
    }
    if (s && !this.iconConfigMap[s].thumbnail) {
      return this.iconConfigMap[s];
    }
    let a = e;
    e =
      (a = Editor.Utils.UUID.isUUID(a)
        ? a
        : (await Editor.Message.request("asset-db", "query-uuid", e)) || e) +
      (t ? "-" + t : "");
    if (this.cache[e]) {
      if (this.cache[e].type === "icon") {
        return this.cache[e];
      }
      if (existsSync(this.cache[e].value)) {
        return this.cache[e];
      }
      delete this.cache[e];
    }
    try {
      var r = await Editor.Message.request(
        "asset-db",
        "query-asset-thumbnail",
        a,
        t
      );
      return r
        ? ((this.cache[e] = { ...r, timestamp: Date.now() }), this.cache[e])
        : this.getDefault(s);
    } catch (e) {
      console.debug(`query thumbnail of asset${a} failed!`);
      return this.getDefault(s);
    }
  }
  getDefault(e) {
    return e ? this.iconConfigMap[e] : this._defaultIcon;
  }
  delete(t) {
    var e = Object.keys(this.cache).filter((e) => e.startsWith(t));

    if (e.length) {
      e.forEach((e) => {
        delete this.cache[e];
      });
    }
  }
  destroyed() {
    this._hasInit = false;

    Editor.Message.__protected__.removeBroadcastListener(
      "asset-db:ready",
      onAssetDBReady
    );

    Editor.Message.__protected__.removeBroadcastListener(
      "asset-db:close",
      onAssetDBClose
    );

    Editor.Message.__protected__.removeBroadcastListener(
      "asset-db:asset-delete",
      onAssetDelete
    );

    Editor.Message.__protected__.removeBroadcastListener(
      "asset-db:asset-change",
      onAssetDelete
    );
  }
}
async function onAssetDBReady() {
  await exports.previewImageManager.onDBReady();
}
async function onAssetDBClose() {
  await exports.previewImageManager.onDBClose();
}
function onAssetDelete(e) {
  exports.previewImageManager.delete(e);
}
exports.AssetPreviewImageManager = AssetPreviewImageManager;
exports.previewImageManager = new AssetPreviewImageManager();
