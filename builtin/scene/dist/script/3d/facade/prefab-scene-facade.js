var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const general_scene_facade_1 = __importDefault(
  require("./general-scene-facade")
);

const prefab_scene_proxy_1 = __importDefault(
  require("../manager/scene/proxy/prefab-scene-proxy")
);

const scene_facade_state_interface_1 = require("./scene-facade-state-interface");
const message_1 = require("../manager/message");
const multi_scene_1 = __importDefault(require("../manager/multi-scene"));
class PrefabSceneFacade extends general_scene_facade_1.default {
  init() {
    this.modeName = scene_facade_state_interface_1.SceneModeType.Prefab;

    this._sceneProxy = new prefab_scene_proxy_1.default(this._sceneMgr, this);

    this._undoMgr.init();
    this.initEventListener();
  }
  async enter(e) {
    console.debug("enter prefab scene facade");
    this.clearSelection();
    this.fireCloseEvent();
    var t = this._sceneProxy.queryCurrentSceneUuid();

    if (e.uuid) {
      await this.openScene(e.uuid);
    }

    if (this.isHold) {
      (e.uuid && t !== e.uuid) || (await this._sceneProxy.restore());
      this.isHold = false;
    }

    if (this.fromState) {
      this.snapshot();

      (await this.fromState.patchSceneState())
        ? (this.snapshot(), cce.SceneFacadeManager.changeTitle())
        : this.abortSnapshot();
    }

    Editor.EditMode.enter(this.modeName.toLocaleLowerCase());
    this._sceneProxy.sendModeChangeMsg(this.modeName);
  }
  async exit() {
    console.debug("exit prefab scene facade");
    await this.closeSceneState();
  }
  async openScene(e) {
    var t = await this._sceneProxy.open(e);
    multi_scene_1.default.generateUndoManager(e);
    return t;
  }
  async setNodeProperty(e) {
    var t = this._sceneProxy.getRootNode();
    return e.uuid === t?.uuid && e.path === "name"
      ? (console.warn(
          "can't change name of prefab root in prefab mode, you can modify it by changing the filename of this prefab"
        ),
        message_1.messageManager.broadcast("scene:change-node", e.uuid),
        false)
      : this._nodeMgr.setProperty(e.uuid, e.path, e.dump);
  }
  async createNode(e) {
    var t = this._sceneProxy.getRootNode()?._prefab;
    return t && t.asset && t.asset._uuid === e.assetUuid
      ? (console.warn(
          "The prefab you are trying to add is the same with the prefab in editing, this is not allowed."
        ),
        null)
      : super.createNode(e);
  }
  async pasteNode(e) {
    if (!e) {
      const n = this.querySelection()[0];
      var type = Editor.Clipboard.read("nodes-info");
      if (!type) {
        return [];
      }
      var { type, uuids } = a;
      e = { target: n, uuids: uuids };

      if (type === "cut") {
        let e_target = false;
        const i = [];

        uuids.every((e) => {
          if (n === e) {
            console.warn(Editor.I18n.t("scene.messages.cannot_cut_to_self"));

            return !(e_target = true);
          }
          e = this._nodeMgr.query(e);

          if (e?.parent && !i.includes(e.parent.uuid)) {
            i.push(e.parent.uuid);
          }
        });

        if (e_target || !n) {
          return [];
        }

        i.push(n);
        const s = this.beginRecording(i);
        type = await this.setNodeParent({
          parent: n,
          uuids: uuids,
          keepWorldTransform: false,
        });
        this.endRecording(s);
        Editor.Clipboard.clear();
        return type;
      }
    }
    let e_target = e.target;

    if (
      !e.pasteAsChild &&
      !((uuids = await this.queryNodeDump(e.target)) &&
        uuids.parent &&
        (e_target = uuids.parent.value.uuid),
      (type = this._sceneProxy.getRootNode()?.parent?.uuid),
      e_target !== cc_1.director.getScene()?.uuid && e_target !== type)
    ) {
      e_target = uuids.uuid.value;
    }

    const s = await this.beginRecording(e_target);
    type = this._nodeMgr.pasteNode(e_target, e.uuids, e.keepWorldTransform);
    await this.endRecording(s);
    return type;
  }
  async removeNode(e) {
    var t = this._sceneProxy.getRootNode();

    if (t && e && (t.uuid === e.uuid || e.uuid.includes(t.uuid))) {
      console.warn("can't remove root node of prefabAsset");
    } else {
      await super.removeNode(e);
    }
  }
  async createPrefab(e, t) {
    var a = this._sceneProxy.getRootNode();
    if (!a || a.uuid !== e) {
      return this._prefabMgr.createPrefabAssetFromNode(e, t);
    }
    console.warn("can't create prefabAsset from root node of prefabAsset");
  }
  doUnlinkPrefab(e, t) {
    return this._prefabMgr.unWrapPrefabInstanceInPrefabMode(e, t);
  }
  async saveScene(e) {
    return await this._sceneProxy.save(e);
  }
}
exports.default = PrefabSceneFacade;
