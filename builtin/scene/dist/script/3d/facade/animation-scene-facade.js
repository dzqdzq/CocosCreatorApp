var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const general_scene_facade_1 = __importDefault(
  require("./general-scene-facade")
);

const animation_scene_proxy_1 = __importDefault(
  require("../manager/scene/proxy/animation-scene-proxy")
);

const scene_facade_state_interface_1 = require("./scene-facade-state-interface");
const animation_1 = require("../../export/undo/animation");
const node_1 = __importDefault(require("../../utils/node"));
const cc_1 = require("cc");
const message_1 = require("../manager/message");
const multi_scene_1 = __importDefault(require("../manager/multi-scene"));
class AnimationSceneFacade extends general_scene_facade_1.default {
  _undoMgr = new animation_1.AnimationUndoManager();
  init() {
    this.modeName = scene_facade_state_interface_1.SceneModeType.Animation;

    this._sceneProxy = new animation_scene_proxy_1.default(
      this._sceneMgr,
      this
    );

    this._animationMgr.on("scene:animation-clip-change", (e, n) => {
      this._undoMgr.reset(e, n);
    });

    this.initEventListener();
  }
  initEventListener() {
    super.initEventListener();
    this._sceneEventListener.push(this._animationMgr);
  }
  async enter(e) {
    console.debug("enter animation scene facade");

    if (e.uuid) {
      await this.openScene(e.uuid, e.clipUuid);
    }

    Editor.EditMode.enter(this.modeName.toLocaleLowerCase());
    this._sceneProxy.sendModeChangeMsg(this.modeName);
    this._animationMgr.enter(e.uuid, e.clipUuid);
  }
  async exit() {
    console.debug("exit animation scene facade");
    await this.closeSceneState();
  }
  async openScene(e, n) {
    var t = this._sceneProxy.open(e);
    this._animationMgr.record(e, true, n);
    return t;
  }
  async closeScene() {
    return true;
  }
  queryCurrentAnimationState() {
    return this._animationMgr.queryPlayState();
  }
  queryCurrentAnimationInfo() {
    return this._animationMgr.getEditAnimationInfo();
  }
  queryAnimationRootNode(e) {
    return this._animationMgr.queryAnimationRoot(e);
  }
  queryAnimationRootInfo(e) {
    return this._animationMgr.queryAnimationRootInfo(e);
  }
  queryAnimationClipDump(e, n) {
    return this._animationMgr.queryAnimationClipDump(e, n);
  }
  queryAnimationProperties(e) {
    return this._animationMgr.queryProperties(e);
  }
  queryAnimationClipsInfo(e) {
    return this._animationMgr.queryAnimClipsInfo(e);
  }
  queryAnimationClipCurrentTime(e) {
    return this._animationMgr.queryPlayingClipTime(e);
  }
  queryAnimationPropValueAtFrame(e, n, t, i) {
    return this._animationMgr.getPropValueAtFrame(e, n, t, i);
  }
  queryAuxCurveValueAtFrame(e, n, t) {
    return this._animationMgr.getAuxCurveValueAtFrame(e, n, t);
  }
  async recordAnimation(e, n, t) {
    return this._animationMgr.record(e, n, t);
  }
  async changeAnimationRootNode(e, n) {
    return this._animationMgr.changeAnimNode(e, n);
  }
  async setCurEditTime(e) {
    return this._animationMgr.setCurEditTime(e);
  }
  async changeClipState(e, n) {
    return this._animationMgr[e](n);
  }
  async setEditClip(e) {
    return this._animationMgr.setEditClip(e);
  }
  async saveClip() {
    return this._animationMgr.save();
  }
  async applyAnimationOperation(e, n) {
    return this._animationMgr.operation(e, n);
  }
  queryAnimationNodeEditInfo(e) {
    return this._animationMgr.queryAnimationNodeEditInfo(e);
  }
  async createNode(e) {}
  async removeNode(e) {}
  async patchSceneState() {
    var e = await this._sceneProxy.patch();
    this._animationMgr.setComponentDirty(false);
    return e;
  }
  async setNodeProperty(e) {
    if (e.path === "name") {
      return false;
    }
    var compName = this._nodeMgr.query(e.uuid);

    var { compName, propName } = node_1.default.getNameDataByPropPath(
      n,
      e.path
    );

    if (
      compName === cc_1.js.getClassName(cc_1.Animation) ||
      compName === cc_1.js.getClassName(cc_1.SkeletalAnimation)
    ) {
      if (propName === "clips") {
        compName = e.path.match(/clips.(.*)/);
        if (!compName || !compName[1] || isNaN(Number(compName[1]))) {
          return Array.isArray(e.dump.value) &&
            e.dump.value.find(
              (e) =>
                e.value && e.value.uuid === this._animationMgr.curEditClipUuid
            )
            ? this._nodeMgr.setProperty(e.uuid, e.path, e.dump)
            : (console.warn(
                Editor.I18n.t("scene.animation.delete_edit_clip_limit")
              ),
              message_1.messageManager.broadcast("scene:change-node", e.uuid),
              false);
        }
        compName = compName[1];
        compName = this._animationMgr.queryRecordAniClips()[Number(compName)];
        if (compName && compName._uuid === this._animationMgr.curEditClipUuid) {
          console.warn(Editor.I18n.t("scene.animation.delete_edit_clip_limit"));

          message_1.messageManager.broadcast("scene:change-node", e.uuid);
          return false;
        }
      } else if (propName === "defaultClip") {
        compName = this._nodeMgr.setProperty(e.uuid, e.path, e.dump);
        this._animationMgr.setCurDefaultClipByUuid(e.dump.value?.uuid);
        return compName;
      }
    }
    return this._nodeMgr.setProperty(e.uuid, e.path, e.dump);
  }
  isOperationOnAnimationClip(e, n) {
    var e = this._nodeMgr.query(e);
    var { compName: e, propName: n } = node_1.default.getNameDataByPropPath(
      e,
      n
    );
    return (
      (e === cc_1.js.getClassName(cc_1.Animation) ||
        e === cc_1.js.getClassName(cc_1.SkeletalAnimation)) &&
      n === "clips"
    );
  }
  async removeNodeArrayElement(e) {
    return (
      e.path !== "__comps__" &&
      (this.isOperationOnAnimationClip(e.uuid, e.path)
        ? (message_1.messageManager.broadcast("scene:change-node", e.uuid),
          false)
        : this._nodeMgr.removeArrayElement(e.uuid, e.path, e.index))
    );
  }
  onNodeChanged(e, n) {
    this.dispatchEvents("onNodeChanged", e, n);
    this.recordNode(e);
  }
  async createComponent(e) {}
  async removeComponent(e) {}
  onComponentAdded(e) {
    this.dispatchEvents("onComponentAdded", e);
  }
  selectNode(t) {
    var i = this._nodeMgr.query(t);
    if (i) {
      let e = false;
      let n = i;

      while (n) {
        if (n.uuid === this._sceneProxy.rootUuid) {
          e = true;
        }

        n = n.parent;
      }

      if (e) {
        this._selectionMgr.select(t);
      }
    }
  }
  queryCurrentSceneUuid() {
    return this.fromState?.queryCurrentSceneUuid() || "";
  }
  async previewMaterial(e, n) {
    await this._assetMgr.previewMaterial(e, n, { emit: false });
  }
  async saveScene(e) {
    return await this._sceneProxy.save(e);
  }
  async snapshot(e) {
    if (!multi_scene_1.default.useMultipleEdit) {
      return super.snapshot(e);
    }

    console.debug(
      "snapshot is deprecated, please use beginRecording/endRecording instead"
    );

    this._undoMgr.snapshot(e);
  }
  abortSnapshot() {
    if (!multi_scene_1.default.useMultipleEdit) {
      return super.abortSnapshot();
    }

    console.debug(
      "abortSnapshot is deprecated, please use cancelRecording instead"
    );

    this._undoMgr.abort();
  }
  beginRecording(e, n) {
    return multi_scene_1.default.useMultipleEdit
      ? this._undoMgr.beginRecording(e, n)
      : super.beginRecording(e, n);
  }
  cancelRecording(e) {
    return multi_scene_1.default.useMultipleEdit
      ? this._undoMgr.cancelRecording(e)
      : super.cancelRecording(e);
  }
  endRecording(e) {
    var n;
    return multi_scene_1.default.useMultipleEdit
      ? ((n = this._undoMgr.endRecording(e)), this.changeTitle(), n)
      : super.endRecording(e);
  }
  async undo() {
    if (!multi_scene_1.default.useMultipleEdit) {
      return super.undo();
    }
    await this._undoMgr.undo();
  }
  async redo() {
    if (!multi_scene_1.default.useMultipleEdit) {
      return super.redo();
    }
    await this._undoMgr.redo();
  }
  recordNode(e, n = true) {
    if (!multi_scene_1.default.useMultipleEdit) {
      return super.recordNode(e, n);
    }

    if (n) {
      this._undoMgr.record(e.uuid);
    }
  }
}
exports.default = AnimationSceneFacade;
