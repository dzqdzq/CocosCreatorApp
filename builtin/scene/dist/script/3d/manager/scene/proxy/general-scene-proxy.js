var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const scene_proxy_1 = __importDefault(require("./scene-proxy"));
const utils_1 = __importDefault(require("../utils"));
const cc_1 = require("cc");
const terrain_1 = __importDefault(require("../../terrain"));
const component_1 = __importDefault(require("../../component"));
const scene_cache_1 = require("./../scene-cache");
const message_1 = require("../../message");
const utils_2 = require("../../prefab/utils");

const { serializeSafe } = require("../../../../export/serialize");

const multi_scene_1 = __importDefault(require("../../multi-scene"));
class GeneralSceneProxy extends scene_proxy_1.default {
  current = "";
  _sceneJustSaved = false;
  get name() {
    return "scene";
  }
  async open(e) {
    return this._open(e);
  }
  async _open(t, e = true) {
    cce.Ipc.send("clear-scene");

    if (this._staging) {
      s = new Error(
        "Scene data has been temporarily stored. This data is about to be discarded."
      );

      console.warn(s);
      this._staging = null;
    }

    var s = await cce.Ipc.request("query-scene");

    if (!multi_scene_1.default.useMultipleEdit && (!t || t !== s)) {
      cce.Selection.clear();
    }

    if (t && this.current === t && !multi_scene_1.default.useMultipleEdit) {
      super.open(t);
      return true;
    }

    if (e && !multi_scene_1.default.useMultipleEdit) {
      if (!(await this.checkClose())) {
        return false;
      }
      await this.close();
    } else {
      this._sceneMgr.sendSceneCloseMsg(cc_1.director.getScene());
      this._staging = null;
    }
    if (t && typeof t == "string") {
      let e = await this._loadSceneByCache(t);
      if ((e = e || (await this._loadScene(t)))) {
        await this._afterLoadScene();
        s = await Editor.Message.request("asset-db", "query-asset-info", t);
        await cce.Ipc.send("set-scene", s ? t : "");
        return true;
      }
    }
    return this.loadEmptyScene();
  }
  async _loadSceneByCache(e, t = true) {
    var s = multi_scene_1.default.getStashScene(e);
    return (
      !!s &&
      (await utils_1.default.loadSceneByNode(s.scene),
      t && multi_scene_1.default.broadcastSceneFocus(e),
      multi_scene_1.default.needReload(e) && (await this.softReload()),
      true)
    );
  }
  async _loadScene(t, s) {
    try {
      if (s) {
        await utils_1.default.loadSceneByJson(s);
      } else {
        var a = await scene_cache_1.sceneCacheManager.loadCacheScene(t);
        let e = cc_1.director.getScene();

        if (!a) {
          e = await utils_1.default.loadSceneByUuid(t);
        }

        if (multi_scene_1.default.useMultipleEdit) {
          multi_scene_1.default.multiSceneOpen(t, e, e, "scene");
        }
      }
      return true;
    } catch (e) {
      console.error("Open scene failed: " + t);
      console.error(e);

      if (!s) {
        return scene_cache_1.sceneCacheManager.loadCacheScene(t);
      }
    }
    return false;
  }
  async loadEmptyScene() {
    cce.Ipc.send("clear-scene");
    this.current = "";

    if (multi_scene_1.default.useMultipleEdit) {
      cce.Node.clear();
    }

    await this._loadEmptyScene();
    await this._afterLoadScene();
    cce.SceneFacadeManager.changeTitle();
    await cce.Ipc.send("set-scene", "");
    return true;
  }
  async _loadEmptyScene() {
    var e;

    if (!(await scene_cache_1.sceneCacheManager.loadCacheScene(""))) {
      (e = await Editor.Message.request(
        "asset-db",
        "execute-custom-operation",
        "scene",
        "queryDefaultContent"
      )).forEach((e) => {
        if (e.__type__ !== "cc.Scene" && e._id) {
          e._id = Editor.Utils.UUID.generate();
        }
      });

      await utils_1.default.loadSceneByJson(e);

      (e = cc_1.director.getScene()?.uuid) &&
        (cce.Camera.updateForEmptyScene(e),
        multi_scene_1.default.useMultipleEdit) &&
        multi_scene_1.default.multiEmptySceneOpen(e, cc_1.director.getScene());
    }

    return true;
  }
  async _afterLoadScene() {
    var e = cc_1.director.getScene();
    var e_uuid = e.uuid;
    this.current = e_uuid;
    this._sceneMgr.sendSceneOpenMsg(e, e_uuid, e);
    super.open(e_uuid);
  }
  async checkClose() {
    if (2 === (await terrain_1.default.close())) {
      return false;
    }
    var e = await this.queryDirty();
    if (e) {
      switch (await cce.Ipc.request("dirty-dialog", "Scene")) {
        case 0: {
          await this.save(false, false);
          break;
        }
        case 1: {
          await Editor.Message.request(
            "scene",
            "clear-scene-cache",
            this.current
          );
          break;
        }
        case 2: {
          return false;
        }
      }
    }
    return true;
  }
  async close() {
    var e;

    if (this._staging) {
      e = new Error(
        "Scene data has been temporarily stored. This data is about to be discarded."
      );

      console.warn(e);
      this._staging = null;
    }

    this.current = "";
    this._sceneMgr.sendSceneCloseMsg(cc_1.director.getScene());
    super.close();
    return true;
  }
  async reload() {
    var e;
    return this._sceneJustSaved
      ? !(this._sceneJustSaved = false)
      : ((e = this.current),
        !!(await this.checkClose()) &&
          (await this.close(), !!(await this._open(e, false))));
  }
  async softReload(e = null) {
    var t = cc_1.director.getScene();
    if (!t) {
      return false;
    }
    if (this._isSoftReloading) {
      return !(this._needOneMoreReload = true);
    }
    try {
      this._isSoftReloading = true;
      var s = this.storePrefabUUID(t);
      e = e || this.serialize(true);
      this._sceneMgr.sendSceneCloseMsg(t);

      if (multi_scene_1.default.useMultipleEdit) {
        multi_scene_1.default.beforeUpdateSceneRef(t.uuid);
      }

      await utils_1.default.loadSceneByJson(e);
      var a = cc_1.director.getScene();
      this.restorePrefabUUID(a, s);
      this._sceneMgr.sendSceneOpenMsg(a, a.uuid, a);
      this._isSoftReloading = false;

      if (this._needOneMoreReload) {
        this._needOneMoreReload = false;
        this.softReload();
      }

      if (multi_scene_1.default.useMultipleEdit && this.current) {
        multi_scene_1.default.updateSceneRef(a.uuid, a, a);
        multi_scene_1.default.endReload(a.uuid);
      }

      return true;
    } catch (e) {
      console.error("Failed to refresh the current scene");
      console.error(e);
      return false;
    }
  }
  serialize(e = false) {
    var t;
    var s;
    return (
      this._staging ||
      ((t = cc_1.director.getScene())
        ? ((s = new cc_1.SceneAsset()),
          utils_2.prefabUtils.gatherPrefabInstanceRoots(t),
          utils_2.prefabUtils.removeInvalidPrefabData(t),
          (s.scene = t),
          e ? serializeSafe(s) : cce.Utils.serialize(s))
        : null)
    );
  }
  async save(e, t = true) {
    var s = cc_1.director.getScene();

    if (s) {
      s.children.forEach((e) => {
        utils_2.prefabUtils.checkMountedRootData(e, true);
      });

      utils_2.prefabUtils.checkTargetOverridesData(s);
    }

    var a = this.serialize(true);

    let c = false;
    let n_id = "";
    if (
      (c =
        this.current &&
        !e &&
        (await cce.Ipc.request("query-asset-meta", this.current))
          ? true
          : c)
    ) {
      this._sceneJustSaved = true;
      await cce.Ipc.send("save-asset", this.current, a);
    } else {
      if (!(n_id = await cce.Ipc.send("create-asset", "", a, "scene"))) {
        return;
      }
      this._sceneJustSaved = true;
      await cce.Ipc.send("set-scene", n_id);
    }
    for (const n of JSON.parse(a)) {
      if (n.__type__ === cc.js.getClassName(cc_1.Terrain)) {
        const n_id = n._id;
        var i = component_1.default.query(n_id);

        if (i && i._asset && i._asset._uuid) {
          await terrain_1.default.saveAssetDialog();
        }
      }
    }
    message_1.messageManager.broadcast("scene:save", n_id);
    this._sceneMgr.emit("save", cc_1.director.getScene());
    await cce.Ipc.send("immediately-dump", [a, "", ""]);

    (multi_scene_1.default.useMultipleEdit
      ? multi_scene_1.default.getUndoManager(this.current)
      : this._sceneFacade._undoMgr
    ).save();

    if (!c && t) {
      await this.open(n_id);
    }

    if (multi_scene_1.default.useMultipleEdit && !c && s) {
      await multi_scene_1.default.closeScene(s.uuid, false);
      scene_cache_1.sceneCacheManager.clearSceneCache(s.uuid);
    }

    return c ? this.current : n_id;
  }
  async staging() {
    if (!this._staging) {
      this._staging = this.serialize();
    }

    return true;
  }
  async restore(e) {
    if (e) {
      this._staging = e;
    }

    if (!this._staging) {
      return false;
    }

    this._sceneMgr.sendSceneCloseMsg(cc_1.director.getScene());
    try {
      var t;
      var s;

      if (
        multi_scene_1.default.useMultipleEdit &&
        !multi_scene_1.default.needReload(this.current)
      ) {
        this._staging = null;
        await this._loadSceneByCache(this.current, false);
        t = cc_1.director.getScene();
        this._sceneMgr.sendSceneOpenMsg(t, t.uuid, t);
      } else {
        this.current &&
          multi_scene_1.default.useMultipleEdit &&
          multi_scene_1.default.beforeUpdateSceneRef(this.current);

        await utils_1.default.loadSceneByJson(this._staging);
        this.restoreScenePrefabUUID();
        s = cc_1.director.getScene();
        this._sceneMgr.sendSceneOpenMsg(s, s.uuid, s);
        this._staging = null;
        await super.open(s.uuid);

        multi_scene_1.default.useMultipleEdit &&
          (multi_scene_1.default.updateSceneRef(s.uuid, s, s),
          multi_scene_1.default.endReload(s.uuid));
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  async queryDirty() {
    return cce.SceneFacadeManager.getCurrentFacade().querySceneDirty();
  }
  queryCurrentSceneUuid() {
    return this.current || "";
  }
  getRootNode() {
    return this._sceneMgr.rootNode;
  }
}
exports.default = GeneralSceneProxy;
