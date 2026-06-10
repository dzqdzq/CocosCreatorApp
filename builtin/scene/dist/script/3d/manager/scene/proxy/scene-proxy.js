var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = __importDefault(require("../../node"));
const component_1 = __importDefault(require("../../component"));
const message_1 = require("../../message");
class SceneProxy {
  _sceneMgr;
  _sceneFacade;
  isOpen = false;
  _staging = null;
  rootUuid = "";
  _isSoftReloading = false;
  _needOneMoreReload = false;
  _PrefabUUIDMap = new Map();
  constructor(e, r) {
    this._sceneMgr = e;
    this._sceneFacade = r;
  }
  async open(e) {
    this.rootUuid = e;
    this.isOpen = true;
    return Promise.resolve(true);
  }
  async checkClose() {
    return Promise.resolve(true);
  }
  async stash() {
    return Promise.resolve(true);
  }
  async close() {
    this.isOpen = false;
    return Promise.resolve(true);
  }
  async reload() {
    return Promise.resolve(true);
  }
  async softReload(e = 0) {
    return Promise.resolve(true);
  }
  serialize() {
    return Promise.resolve(true);
  }
  async queryDirty() {
    return Promise.resolve(false);
  }
  async save(e) {
    return Promise.resolve(true);
  }
  async staging() {
    return Promise.resolve(true);
  }
  async restore(e = 0) {
    return Promise.resolve(true);
  }
  async patch() {
    return Promise.resolve(true);
  }
  sendModeChangeMsg(e) {
    this._sceneMgr.emit("mode-change", e);
    message_1.messageManager.broadcast("scene:change-mode", e);
  }
  queryCurrentSceneUuid() {
    return "";
  }
  getRootNode() {
    return null;
  }
  generatePrefabUUIDMap(r, e) {
    if (e) {
      var r_prefab = r._prefab;
      let t = e;

      if (r_prefab) {
        r_prefab.instance &&
          ((t = new Map()), e.set(r_prefab.instance.fileId, t));
        t.set(r_prefab.fileId, r.uuid);

        r.components.forEach((e) => {
          var e_prefab = e.__prefab;

          if (e_prefab?.fileId) {
            if (t.has(e_prefab.fileId)) {
              console.warn(
                `generatePrefabUUIDMap ${e_prefab.fileId} already exist`
              );
            } else {
              t.set(e_prefab.fileId, e.uuid);
            }
          }
        });
      }

      for (let e = 0; e < r.children.length; e++) {
        var n = r.children[e];
        this.generatePrefabUUIDMap(n, t);
      }
    }
  }
  storePrefabUUID(r) {
    var t = new Map();
    for (let e = 0; e < r.children.length; e++) {
      var s = r.children[e];
      this.generatePrefabUUIDMap(s, t);
    }
    return t;
  }
  applyPrefabUUID(r, e) {
    if (e) {
      var r_prefab = r._prefab;
      let t = e;

      if (
        r_prefab &&
        (t = r_prefab.instance ? e.get(r_prefab.instance.fileId) : t)
      ) {
        e = t.get(r_prefab.fileId);
        node_1.default.changeNodeUUID(r.uuid, e);

        r.components.forEach((e) => {
          var e_prefab = e.__prefab;

          if (e_prefab?.fileId && (e_prefab = t.get(e_prefab.fileId))) {
            component_1.default.changeUUID(e.uuid, e_prefab);
          }
        });
      }

      for (let e = 0; e < r.children.length; e++) {
        var n = r.children[e];
        this.applyPrefabUUID(n, t);
      }
    }
  }
  restorePrefabUUID(r, t) {
    for (let e = 0; e < r.children.length; e++) {
      var s = r.children[e];
      this.applyPrefabUUID(s, t);
    }
  }
  storeScenePrefabUUID() {
    var e;
    var r = cc.director.getScene();

    if (r) {
      e = this.storePrefabUUID(r);
      this._PrefabUUIDMap.set(r.uuid, e);
    }
  }
  restoreScenePrefabUUID() {
    var e = cc.director.getScene();
    var e = this._PrefabUUIDMap.get(e.uuid);

    if (e) {
      this.restorePrefabUUID(cc.director.getScene(), e);
    }
  }
  async loadEmptyScene() {
    return true;
  }
}
exports.default = SceneProxy;
