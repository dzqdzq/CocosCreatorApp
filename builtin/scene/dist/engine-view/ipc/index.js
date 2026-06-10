Object.defineProperty(exports, "__esModule", { value: true });
const methodsNeverRunInGameview = {
  queryEffect: true,
  queryMaterial: true,
  queryAllEffects: true,
  executeSceneScriptMethod: true,
  querySceneSerializedData: true,
  queryLayerBuiltin: true,
  queryClasses: true,
  querySceneDirty: true,
  queryComponents: true,
  queryComponentHasScript: true,
  previewMaterial: true,
  assetChange: true,
  assetDelete: true,
  assetRefresh: true,
  registerEffects: true,
  removeEffects: true,
  updateEffect: true,
  setCurEditTime: true,
  changeClipState: true,
  setEditClip: true,
  queryCurrentAnimationState: true,
  queryCurrentAnimationInfo: true,
  queryAnimationRootNode: true,
  queryAnimationRootInfo: true,
  queryAnimationClipDump: true,
  changeSceneViewVisible: true,
  investigatePackerDriver: true,
};
class ViewIpcManager {
  _previewIpcEnabled = false;
  _sceneIpc;
  _previewIpc = null;
  constructor(e) {
    this._sceneIpc = e;
  }
  get isReady() {
    return this._sceneIpc.isReady;
  }
  async send(e, ...t) {
    return this._isSendToPreview(e, t[0]?.handler)
      ? this._previewIpc?.send(e, ...t)
      : this._sceneIpc.send(e, ...t);
  }
  setReady(e) {
    this._sceneIpc.setReady(e);
  }
  setPreviewIpcEnabled(e) {
    this._previewIpcEnabled = e;
  }
  setPreviewIpc(e) {
    this._previewIpc = e;
  }
  _isSendToPreview(e, t = "") {
    return (
      this._previewIpcEnabled &&
      e === "call-method" &&
      !methodsNeverRunInGameview[t]
    );
  }
}
exports.default = ViewIpcManager;
