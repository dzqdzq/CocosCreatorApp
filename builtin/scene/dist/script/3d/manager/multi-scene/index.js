Object.defineProperty(exports, "__esModule", { value: true });
const multi_undo_1 = require("./multi-undo");
const multi_selection_1 = require("./multi-selection");
const multi_assets_1 = require("./multi-assets");
const cc_1 = require("cc");

const {
  checkClose,
  serializeScene,
  serializePrefab,
} = require("../scene/proxy/proxy-utils");

const DEFAULT_SCENE_COUNT = 100;
class MultiSceneManager {
  useMultipleEdit = false;
  sceneMap = new Map();
  _maxSceneCount = DEFAULT_SCENE_COUNT;
  undoManager = new multi_undo_1.MultiUndoManager();
  selection = new multi_selection_1.MultiSelection();
  multiAssets = new multi_assets_1.MultiAssets();
  _curFocus = "";
  _reloadCount = 0;
  get reloadCount() {
    return this._reloadCount;
  }
  get curFocus() {
    return this._curFocus;
  }
  set curFocus(e) {
    this._curFocus = e;
  }
  get maxSceneCount() {
    return this._maxSceneCount;
  }
  set maxSceneCount(e) {
    this._maxSceneCount = e;
    this._reduceScene();
  }
  constructor() {
    Editor.Profile.getConfig("scene", "scene.multi").then(async (e) => {
      this.useMultipleEdit = Boolean(e);
      await this._initData();
    });
  }
  async onProfileChanged(e, t, s, i) {
    if (t === "packages/scene.json" && s === "scene.multi") {
      t = this.useMultipleEdit;
      s = Boolean(i);
      (t && !s) || (!t && s && (await this._initData()));
      this.useMultipleEdit = Boolean(i);
    }
  }
  async _initData() {
    ((await Editor.Profile.getConfig("scene", "tabs")) || []).forEach((e) => {
      this.sceneMap.set(e, {
        scene: null,
        rootNode: null,
        uuid: e,
        persisted: true,
        loaded: false,
        reloadCount: 0,
      });
    });

    this.maxSceneCount = this.useMultipleEdit ? DEFAULT_SCENE_COUNT : 1;
  }
  stashScene(e, t, s) {
    var i;

    if (
      this.useMultipleEdit &&
      (((i = this.sceneMap.get(e)) && i.loaded) ||
        this.sceneMap.set(e, {
          persisted: true,
          scene: t,
          rootNode: s,
          uuid: e,
          loaded: true,
          reloadCount: this.reloadCount,
        }),
      this.sceneMap.size >= this.maxSceneCount)
    ) {
      this._reduceScene();
    }
  }
  multiSceneOpen(e, t, s, i) {
    var n;

    if (this.useMultipleEdit) {
      n = this.sceneMap.get(e);
      this.curFocus = e;

      n && n.loaded
        ? this.broadcast("multi-scene-focus", this.curFocus)
        : (this.stashScene(e, t, s),
          this.overrideSceneDestroy(t),
          this.broadcastSceneOpen(e, i));
    }
  }
  updateSceneRef(e, t, s) {
    if (this.useMultipleEdit && (e = this.sceneMap.get(e))) {
      e.scene;
      e.scene = t;
      e.rootNode = s;
      this.overrideSceneDestroy(t);
    }
  }
  multiEmptySceneOpen(e, t) {
    if (this.useMultipleEdit) {
      this.sceneMap.set(e, {
        scene: t,
        rootNode: t,
        uuid: e,
        loaded: true,
        persisted: false,
        reloadCount: 0,
      });

      this.overrideSceneDestroy(t);
      this.broadcastSceneOpen(e, "scene");
      this.broadcastSceneFocus(e);
    }
  }
  multiSceneClose(e, t) {
    if (this.useMultipleEdit) {
      this.remove(e);
      this.broadcastSceneClose(e);
    }
  }
  async multiSceneFocus(e) {
    if (this.useMultipleEdit && this.sceneMap.has(e)) {
      await cce.SceneFacadeManager.openScene(e);
      this.broadcastSceneFocus(e);
    }
  }
  broadcastSceneFocus(e) {
    if (this.useMultipleEdit && this.curFocus !== e) {
      this.curFocus = e;
      this.broadcast("multi-scene-focus", this.curFocus);
    }
  }
  async multiSceneFocusQuery() {
    return this.curFocus;
  }
  async multiSceneQuery() {
    return this.useMultipleEdit ? await this.queryScenesInfo() : [];
  }
  _reduceScene() {
    while (this.sceneMap.size > this.maxSceneCount) {
      var e = this.sceneMap.keys().next().value;

      if (e) {
        this.remove(e);
      }
    }
  }
  getStashScene(e) {
    return this.useMultipleEdit && (e = this.sceneMap.get(e)) && e.loaded
      ? e
      : undefined;
  }
  clearStashScene() {
    this.sceneMap.clear();
  }
  broadcastSceneOpen(e, t) {
    this.broadcast("multi-open-scene", e, t);
  }
  broadcastSceneClose(e) {
    this.broadcast("multi-close-scene", e);
  }
  broadcastSceneDirty(e, t) {
    this.broadcast("multi-scene-dirty", e, t);
  }
  broadcast(e, t, s) {
    if (this.useMultipleEdit && !isPreviewProcess) {
      this.queryScenesInfo().then((e) => {
        Editor.Profile.setConfig(
          "scene",
          "tabs",
          e
            .filter((e) => this.sceneMap.get(e.uuid)?.persisted)
            .map((e) => e.uuid)
        );
      });

      s ? cce.Ipc.send(e, t, s) : cce.Ipc.send(e, t);
    }
  }
  async _checkClose(e) {
    var t = this.sceneMap.get(e);
    var s = await this.queryAssetInfo(e);
    if (!(t && t.loaded && s && s.dirty)) {
      return true;
    }
    if (!this.undoManager.querySceneDirty(e)) {
      return true;
    }
    switch (
      await checkClose(
        s.name +
          `
`
      )
    ) {
      case 0: {
        await this.saveScene(e);
        return true;
      }
      case 1: {
        await Editor.Message.request("scene", "clear-scene-cache", e);
        return true;
      }
      default: {
        return false;
      }
    }
  }
  async closeAllScene() {
    var e;
    return (
      !this.useMultipleEdit ||
      ((e = this.getAllSceneUuid().reverse()), this._closeByIds(e))
    );
  }
  async _closeByIds(e) {
    let t = false;
    for (const n of e) {
      var s = await this._checkClose(n);
      var i = await this.queryAssetInfo(n);

      if (i) {
        this.broadcastSceneDirty(n, i.type);
      }

      console.debug("close-scene", n, s);

      if (!s) {
        t = true;
        break;
      }
    }
    return t;
  }
  async saveAllScene() {
    if (this.useMultipleEdit) {
      await Promise.all(
        this.getAllSceneUuid().map(async (e) => this.saveScene(e))
      );
    }
  }
  async closeOthers(t) {
    var e;
    var s;
    return (
      !this.useMultipleEdit ||
      ((e = this.getAllSceneUuid()
        .filter((e) => e !== t)
        .reverse()),
      !!(s = await this._closeByIds(e))) ||
      (e.forEach((e) => this.remove(e)),
      await this.multiSceneFocus(t),
      this.broadcastSceneClose(""),
      s)
    );
  }
  async closeToTheRight(e) {
    if (!this.useMultipleEdit) {
      return true;
    }
    let t = this.getAllSceneUuid();
    var s = t.indexOf(e);
    if (-1 === s || s === t.length - 1) {
      return true;
    }
    t = t.slice(s + 1);
    s = await this._closeByIds(t);
    return (
      !!s ||
      (t.includes(this.curFocus) && (await this.multiSceneFocus(e)),
      t.forEach((e) => this.remove(e)),
      this.broadcastSceneClose(""),
      s)
    );
  }
  async moveSceneTo(t, s) {
    if (this.sceneMap.has(t) && t !== s) {
      if (s === "end") {
        const i = Array.from(this.sceneMap.entries());

        const n = i.findIndex(([e]) => e === t);

        const [r] = i.splice(n, 1);
        i.push(r);
        this.sceneMap.clear();

        i.forEach(([e, t]) => {
          this.sceneMap.set(e, t);
        });

        return this.broadcastSceneDirty(this.curFocus);
      }
      if (this.sceneMap.has(s)) {
        const i = Array.from(this.sceneMap.entries());

        const n = i.findIndex(([e]) => e === t);

        var e = i.findIndex(([e]) => e === s);
        if (-1 !== n && -1 !== e) {
          const [r] = i.splice(n, 1);
          i.splice((n, e), 0, r);
          this.sceneMap.clear();

          i.forEach(([e, t]) => {
            this.sceneMap.set(e, t);
          });

          this.broadcastSceneDirty(this.curFocus);
        }
      }
    }
  }
  async closeScene(e, t = true) {
    if (!this.useMultipleEdit) {
      return false;
    }
    if (!this.sceneMap.get(e) || this.sceneMap.size === 1) {
      console.debug("scene not found or only one scene");
      return false;
    }
    var s;
    var i = await this._checkClose(e);
    if (!i) {
      return i;
    }
    let n = "";

    if (e === this.curFocus) {
      s = (i = this.getAllSceneUuid()).indexOf(e);
      n = 0 <= s - 1 ? i[s - 1] : i[s + 1];
    }

    this.remove(e, t);
    this.broadcastSceneClose(e);

    if (n) {
      await this.multiSceneFocus(n);
    }

    return true;
  }
  overrideSceneDestroy(e) {
    e.destroy = () => {
      e._activeInHierarchy = false;
      cc_1.director._compScheduler.unscheduleAll();
      return false;
    };
  }
  getAllScene() {
    return Array.from(this.sceneMap.values());
  }
  getAllSceneUuid() {
    return Array.from(this.sceneMap.keys());
  }
  remove(e, t = true) {
    var s = this.sceneMap.get(e);

    if (s) {
      this.undoManager.delete(e);
      this.sceneMap.delete(e);
      this.selection.clearSelection(e);
      t && s.loaded && this._destroyScene(s.scene);
    } else {
      console.debug("scene not found", e);
    }
  }
  beforeUpdateSceneRef(e) {
    if (this.useMultipleEdit) {
      const t = this.sceneMap.get(e);

      if (t && t.loaded) {
        cc_1.director.once(cc_1.DirectorEvent.BEFORE_SCENE_LAUNCH, () => {
          console.debug("BEFORE_SCENE_LAUNCH invoke ", e);
          this._destroyScene(t.scene);
        });
      }
    }
  }
  _destroyScene(e) {
    e.destroy = function () {
      var e = cc_1.CCObject.prototype.destroy.call(this);
      if (e) {
        var t = this._children;
        for (let e = 0; e < t.length; ++e) {
          t[e].active = false;
        }
      }

      if (this._renderScene) {
        cc_1.director.root.destroyScene(this._renderScene);
      }

      this._active = false;
      this._activeInHierarchy = false;
      cc_1.CCObject._deferredDestroy();
      return e;
    };
  }
  generateUndoManager(e) {
    if (this.useMultipleEdit) {
      this.undoManager.generateUndoManager(e);
    }
  }
  getUndoManager(e) {
    return this.undoManager.getUndoManager(e);
  }
  delete(e) {
    if (this.useMultipleEdit) {
      this.undoManager.delete(e);
    }
  }
  beginRecording(e, t, s) {
    return this.undoManager.beginRecording(e, t, s);
  }
  cancelRecording(e, t) {
    return this.undoManager.cancelRecording(e, t);
  }
  endRecording(e, t) {
    return this.undoManager.endRecording(e, t);
  }
  updateDump(e, t, s) {
    this.undoManager.updateDump(e, t, s);
  }
  querySceneDirty(e) {
    return this.undoManager.querySceneDirty(e);
  }
  async undo(e) {
    return this.undoManager.undo(e);
  }
  async redo(e) {
    return this.undoManager.redo(e);
  }
  record(e, t, s = true) {
    this.undoManager.record(e, t, s);
  }
  stashSelection(e, t) {
    if (this.useMultipleEdit) {
      this.selection.stashSelection(e, t);
    }
  }
  getSelection(e) {
    if (this.useMultipleEdit) {
      return this.selection.getSelection(e);
    }
  }
  clearSelection(e) {
    if (this.useMultipleEdit) {
      this.selection.clearSelection(e);
    }
  }
  async queryAssetsInfo(e) {
    return this.useMultipleEdit ? this.multiAssets.queryAssetsInfo(e) : [];
  }
  async queryAssetInfo(e) {
    if (!this.useMultipleEdit) {
      return null;
    }
    let t = await this.multiAssets.queryAssetInfo(e);
    var s;

    if (!t) {
      if ((s = this.sceneMap.get(e)) && !s.persisted) {
        t = this._generateEmptySceneInfo(e);
      }
    }

    if (t) {
      t.dirty = this.undoManager.querySceneDirty(e);
    }

    return t;
  }
  _generateEmptySceneInfo(e) {
    return {
      name: "Untitled.scene",
      uuid: e,
      dirty: this.undoManager.querySceneDirty(e),
      type: "scene",
      url: "",
    };
  }
  async queryScenesInfo() {
    var e;
    var t;
    var s = [];
    for ([e, t] of this.sceneMap) {
      var i = await this.queryAssetInfo(e);

      if (i) {
        s.push(i);
      }
    }
    return s;
  }
  getCurrentScene() {
    return this.useMultipleEdit
      ? this.sceneMap.get(this.curFocus)?.scene
      : cc_1.director.getScene();
  }
  async getSceneInfo(e) {
    e = this.sceneMap.get(e);
    return e && e.loaded ? e : null;
  }
  async saveScene(e) {
    var t;
    var s;
    return (
      !this.useMultipleEdit ||
      ((t = this.sceneMap.get(e)),
      !!((s = await this.queryAssetInfo(e)) && s.dirty && t) &&
        (s.type === "scene"
          ? await serializeScene(e, t.scene)
          : s.type === "prefab"
          ? await serializePrefab(e, t.rootNode)
          : console.warn("invalid type,", s.type),
        this.getUndoManager(e).save(),
        true))
    );
  }
  abortSnapshot(e) {
    if (this.useMultipleEdit) {
      this.undoManager.abortSnapshot(e);
    }
  }
  snapshot(e, t) {
    if (this.useMultipleEdit) {
      this.undoManager.snapshot(e, t);
    }
  }
  incReloadCount(e) {
    var t;

    if (
      this.useMultipleEdit &&
      (this._reloadCount++, e) &&
      ((t = this.sceneMap.get(e)) && (t.loaded = false), t)
    ) {
      console.debug("stash scene needs hard reload", e);
    }
  }
  needReload(e) {
    var t;
    return (
      !!this.useMultipleEdit &&
      !!(t = this.sceneMap.get(e)) &&
      (t.reloadCount < this._reloadCount &&
        console.debug(`scene ${e} needs reload`),
      t.reloadCount < this._reloadCount)
    );
  }
  endReload(e) {
    if (this.useMultipleEdit && (e = this.sceneMap.get(e))) {
      e.reloadCount = this._reloadCount;
    }
  }
}
const multiSceneManager = new MultiSceneManager();
exports.default = multiSceneManager;
globalThis.__multiScene__ = multiSceneManager;
