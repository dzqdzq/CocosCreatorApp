var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const scene_proxy_1 = __importDefault(require("./scene-proxy"));

const { promisify } = require("../../../../utils/misc");

const cc_1 = require("cc");

const { instantiate } = cc_1;

const node_1 = __importDefault(require("../../node"));
const utils_1 = require("../../prefab/utils");
const selection_1 = __importDefault(require("../../selection"));
const utils_2 = __importDefault(require("../utils"));
const node_2 = __importDefault(require("../../../../utils/node"));
const multi_scene_1 = __importDefault(require("../../multi-scene"));

const { serializeSafe } = require("../../../../export/serialize");

const { createShouldHideInHierarchyCanvasNode } = require("../../node/create");

class PrefabSceneProxy extends scene_proxy_1.default {
  current;
  node = "";
  _prefabJustSaved = false;
  get name() {
    return "prefab";
  }
  async open(e) {
    if (e && this.current === e) {
      return false;
    }
    if (this.current && !multi_scene_1.default.useMultipleEdit) {
      if (!(await this.checkClose())) {
        return false;
      }
      await this.close();
    } else {
      this._sceneMgr.sendSceneCloseMsg(cc_1.director.getScene());
    }
    var t;
    this._staging = null;

    return !(
      !(await this._loadPrefab(e)) ||
      (super.open(e),
      (t = this.getRootNode()),
      multi_scene_1.default.useMultipleEdit &&
        !multi_scene_1.default.getSelection(e) &&
        selection_1.default.select(t.uuid),
      (this._prefabJustSaved = false))
    );
  }
  async _loadPrefab(t) {
    var e = multi_scene_1.default.getStashScene(t);
    if (e) {
      try {
        await utils_2.default.loadSceneByNode(e.scene);
        cce.Engine.repaintInEditMode();
        this.current = t;
        this.node = e.rootNode.uuid;

        if (e.rootNode._prefab.instance) {
          e.rootNode._prefab.instance = undefined;
        }

        this._sceneMgr.sendSceneOpenMsg(e.scene, this.current, e.rootNode);
        multi_scene_1.default.broadcastSceneFocus(this.current);

        if (multi_scene_1.default.needReload(t)) {
          await this.softReload();
        }

        return true;
      } catch (e) {
        console.error("Open prefab failed: " + t);
        console.error(e);
      }
      this.current = "";
      return false;
    }
    return this._loadPrefabById(t);
  }
  async _loadPrefabById(s) {
    var e = await utils_2.default.loadPrefab(s);
    if (e) {
      var t = new cc.Scene();
      t.name = e.name + "-scene";
      const a = await Editor.Message.request(
        "asset-db",
        "query-uuid",
        "db://internal/default_skybox/default_skybox.png"
      );

      if (
        a &&
        ((r = await new Promise((r) => {
          cc_1.assetManager.loadAny(a + "@b47c0", (e, t) => {
            if (e) {
              console.error("asset can't be load:" + s);
              r(null);
            } else {
              r(t);
            }
          });
        })),
        t.globals) &&
        t.globals.skybox &&
        r
      ) {
        t.globals.skybox.envmap = r;
      }

      var r = instantiate(e);

      if (r._prefab.instance) {
        r._prefab.instance = undefined;
      }

      var e = r
        .getComponentsInChildren(cc_1.UITransform)
        .some((e) => e && e.constructor.name === "UITransform");

      var n = r.components.some((e) => e && e.constructor.name === "Canvas");

      r.parent = e && !n ? await createShouldHideInHierarchyCanvasNode(t) : t;

      this.node = r.uuid;
      try {
        await utils_2.default.loadSceneByNode(t);
        this.current = s;
        this._sceneMgr.sendSceneOpenMsg(t, this.current, r);
        super.open(s);
        multi_scene_1.default.multiSceneOpen(s, t, r, "prefab");
        return true;
      } catch (e) {
        console.error("Open prefab failed: " + s);
        console.error(e);
      }
    }
    this.current = "";
    return false;
  }
  async _sceneWrapCanvasNode(e) {
    if (e.children[0] && e.children[0].name === "should_hide_in_hierarchy") {
      return e.children[0];
    }
    let t = "f773db21-62b8-4540-956a-29bacf5ddbf5";

    if (cce.SceneFacadeManager._projectType === "2d") {
      t = "4c33600e-9ca9-483b-b734-946008261697";
    }

    var r = await promisify(cc_1.assetManager.loadAny)(t);
    var r = cc.instantiate(r);

    var e =
      (r.children.forEach((e) => {
        e.objFlags |= cc.Object.Flags.HideInHierarchy;
      }),
      (r._prefab = undefined),
      (r.parent = e),
      (r.name = "should_hide_in_hierarchy"),
      (r.objFlags |= cc.Object.Flags.LockedInEditor),
      r?.children[0]);

    if (e) {
      e.setParent = () => {
        console.error("禁止修改内置camera节点的Parent");
      };
    }

    return r;
  }
  async _checkClose() {
    var e = await this.queryDirty();
    if (e) {
      switch (await cce.Ipc.request("dirty-dialog", "Prefab")) {
        case 0:
        case "0": {
          await this.save();
          break;
        }
        case 1:
        case "1": {
          break;
        }
        case 2:
        case "2": {
          return false;
        }
      }
    }
    return true;
  }
  async checkClose() {
    return !!multi_scene_1.default.useMultipleEdit || this._checkClose();
  }
  async close() {
    selection_1.default.clear();

    if (this.current) {
      utils_2.default.unloadPrefab(this.current);
    }

    this._sceneMgr.sendSceneCloseMsg(cc_1.director.getScene());
    this.current = "";
    super.close();
    return true;
  }
  async reload() {
    var e;
    return this._prefabJustSaved
      ? !(this._prefabJustSaved = false)
      : ((e = this.current),
        !(
          !(await this._checkClose()) ||
          (await this.close(), !e) ||
          !(await this.open(e))
        ));
  }
  generateSceneAsset(e) {
    var t = new cc_1.SceneAsset();
    utils_1.prefabUtils.removePrefabInstanceRoots(e);
    utils_1.prefabUtils.gatherPrefabInstanceRoots(e);
    var r = node_1.default.query(this.node);

    if (r) {
      utils_1.prefabUtils.removePrefabInstanceRoots(r);
      utils_1.prefabUtils.gatherPrefabInstanceRoots(r);
    }

    t.scene = e;
    return t;
  }
  async softReload(e = null) {
    var t = cc_1.director.getScene();
    if (!t) {
      return Promise.resolve(false);
    }
    if (this._isSoftReloading) {
      return !(this._needOneMoreReload = true);
    }
    try {
      this._isSoftReloading = true;
      var r = this.storePrefabUUID(t);
      var s = this.generateSceneAsset(t);

      e = e || serializeSafe(s);
      this._sceneMgr.sendSceneCloseMsg(t);

      if (this.current && multi_scene_1.default.useMultipleEdit) {
        multi_scene_1.default.beforeUpdateSceneRef(this.current);
      }

      await utils_2.default.loadSceneByJson(e);
      var n = cc_1.director.getScene();
      utils_1.prefabUtils.removePrefabInstanceRoots(n);
      this.restorePrefabUUID(n, r);
      var a = node_1.default.query(this.node);

      if (!a) {
        console.error(`Node with UUID ${this.node} not exist!`);
        return false;
      }
      cc_1.Prefab._utils.applyTargetOverrides(a);
      this._sceneMgr.sendSceneOpenMsg(n, this.current, a);
      this._isSoftReloading = false;

      if (this._needOneMoreReload) {
        this._needOneMoreReload = false;
        this.softReload();
      }

      if (multi_scene_1.default.useMultipleEdit && this.current) {
        multi_scene_1.default.updateSceneRef(this.current, n, a);
        multi_scene_1.default.endReload(this.current);
      }
    } catch (e) {
      console.error("Failed to refresh the current scene");
      console.error(e);
    }
    return Promise.resolve(true);
  }
  serialize(e = false) {
    if (!this.node) {
      return "";
    }
    let r = node_1.default.query(this.node);
    if (!r) {
      console.warn("can't find node in current scene: " + this.node);
      var s = cc_1.director.getScene();
      if (!s) {
        return "";
      }
      let t = null;
      for (let e = 0; e < s.children.length; e++) {
        var n = s.children[e];
        if (!node_2.default.isEditorNode(n)) {
          t = n;
          break;
        }
      }
      if (!t) {
        return "";
      }
      if (t._prefab) {
        r = t;
      } else {
        for (let e = 0; e < t.children.length; e++) {
          var a = t.children[e];
          if (a._prefab) {
            r = a;
            break;
          }
        }
      }
    }
    var t;
    return r
      ? ((t = utils_1.prefabUtils.getPrefabForSerialize(r).prefab),
        e ? serializeSafe(t) : cce.Utils.serialize(t))
      : (console.warn("can't find prefab root node in current scene"), "");
  }
  async save(e) {
    var t = node_1.default.query(this.node);

    if (t) {
      utils_1.prefabUtils.checkMountedRootData(t, true);
    }

    let r = false;

    if (
      this.current &&
      !e &&
      (await cce.Ipc.request("query-asset-meta", this.current))
    ) {
      r = true;
    }

    t = this.serialize(true);
    if (r) {
      this._prefabJustSaved = true;
      await cce.Ipc.send("save-asset", this.current, t);
    } else {
      e = await cce.Ipc.request("create-asset", "", t, "prefab");
      if (!e) {
        return;
      }
      this._prefabJustSaved = true;
      this.open(e);
    }
    this._sceneMgr.emit("save", cc_1.director.getScene());

    (multi_scene_1.default.useMultipleEdit && this.current
      ? multi_scene_1.default.getUndoManager(this.current)
      : this._sceneFacade._undoMgr
    ).save();

    return Promise.resolve(true);
  }
  async staging() {
    var e;

    if (!this._staging) {
      e = cc_1.director.getScene();
      e = this.generateSceneAsset(e);
      this._staging = serializeSafe(e);
    }

    return true;
  }
  async restore(e = undefined) {
    if (e) {
      this._staging = e;
    }

    if (this._staging && this.current) {
      this._sceneMgr.sendSceneCloseMsg(cc_1.director.getScene());
      super.restore();
      await utils_2.default.loadSceneByJson(this._staging);
      e = node_1.default.query(this.node);
      if (!e) {
        console.error(`Node with UUID ${this.node} does not exist!`);
        return false;
      }
      cc_1.Prefab._utils.applyTargetOverrides(e);
      var t = cc_1.director.getScene();
      this._sceneMgr.sendSceneOpenMsg(t, this.current, e);
      this._staging = null;

      if (multi_scene_1.default.useMultipleEdit && this.current) {
        multi_scene_1.default.updateSceneRef(this.current, t, e);
        multi_scene_1.default.endReload(this.current);
      }

      super.open(this.current);
      return true;
    }

    return false;
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
exports.default = PrefabSceneProxy;
