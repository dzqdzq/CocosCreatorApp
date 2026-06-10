var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinePreview = undefined;
const Interactive_preview_1 = require("../Interactive-preview");

const { promisify } = require("../../../../utils/misc");

const cc_1 = require("cc");
const node_1 = __importDefault(require("../../../../utils/node"));
const ANIMATION_CHANGE_TAG = "scene:spine-preview-animation-time-change";
class SpinePreview extends Interactive_preview_1.InteractivePreview {
  enableViewToggle = false;
  is2D = true;
  orthoScale = 0.6;
  skeletonComponent = null;
  _animUpdateInterval = null;
  _fps = 30;
  isPaused = true;
  spineData = null;
  currentAnimationIndex = 0;
  currentTime = 0;
  trackTotals = 6;
  trackIndex = 0;
  createNodes(e) {
    var t = new cc.Node("Spine Preview Light");

    var e =
      (t.addComponent(cc_1.DirectionalLight),
      t.setRotationFromEuler(-45, -45, 0),
      e.addChild(t),
      new cc_1.Node("Canvas"));

    e.addComponent(cc_1.Canvas);
    this.scene.addChild(e);
    this._modelNode = new cc_1.Node("Spine");
    this._modelNode.setPosition(0, 0, 0);
    e.addChild(this._modelNode);
    this.skeletonComponent = this._modelNode.addComponent(cc_1.sp.Skeleton);
  }
  releaseAsset(e) {
    if (cc_1.assetManager.assets.has(e)) {
      cc_1.assetManager.releaseAsset(cc_1.assetManager.assets.get(e));
      cc_1.assetManager.assets.remove(e);
    }
  }
  resetCameraView() {
    if (this.skeletonComponent) {
      this.resetCamera(this.skeletonComponent.node);

      this.perfectCameraView(
        node_1.default.getBoundaryOfMeshNodes([this.skeletonComponent.node])
      );
    }
  }
  async setTrackIndex(e) {
    this.trackIndex = e;
  }
  async setSpine(e) {
    if (!e) {
      console.warn("invalid uuid");
      return null;
    }
    this.releaseAsset(e);

    if (!this.skeletonComponent) {
      return null;
    }

    this.cameraComp.enabled = true;
    this.resetCamera(this.skeletonComponent.node);
    try {
      this.skeletonComponent.node.active = true;

      this.skeletonComponent.skeletonData = await promisify(
        cc_1.assetManager.loadAny
      )(e);

      this.perfectCameraView(
        node_1.default.getBoundaryOfMeshNodes([this.skeletonComponent.node])
      );

      var { _enumSkins, _enumAnimations, _defaultSkinIndex, _animationIndex } =
        this.skeletonComponent;

      var o = Object.keys(_enumAnimations).map((e) => {
        e = this.skeletonComponent?.findAnimation(e);
        return e ? e.duration : 0;
      });

      this.spineData = {
        trackIndex: this.trackIndex,
        trackTotals: this.trackTotals,
        loop: this.skeletonComponent.loop,
        timeScale: this.skeletonComponent.timeScale,
        useTint: this.skeletonComponent.useTint,
        debugSlots: this.skeletonComponent.debugSlots,
        debugBones: this.skeletonComponent.debugBones,
        debugMesh: this.skeletonComponent.debugMesh,
        premultipliedAlpha: this.skeletonComponent.premultipliedAlpha,
        skin: { list: _enumSkins, index: _defaultSkinIndex },
        animation: {
          list: _enumAnimations,
          index: _animationIndex,
          durations: o,
        },
      };

      this.startAnimationUpdate();
      return this.spineData;
    } catch (e) {
      console.warn("Failed to set Spine data:", e);
      return null;
    }
  }
  close() {
    if (this.skeletonComponent) {
      this.clearAnimationUpdate();

      this.skeletonComponent.skeletonData &&
        this.releaseAsset(this.skeletonComponent.skeletonData.uuid);

      this.skeletonComponent.node.active = false;
    }
  }
  setSkinIndex(e) {
    var t;

    if (
      this.skeletonComponent &&
      this.skeletonComponent.skeletonData &&
      (t =
        (t = this.skeletonComponent.skeletonData.getSkinsEnum()) &&
        String(t[e]))
    ) {
      this.skeletonComponent.setSkin(t);
      this.broadcastAnimationInfo();
    }
  }
  setAnimationIndex(e = this.currentAnimationIndex) {
    this.currentAnimationIndex = e;

    if (this.skeletonComponent && this.skeletonComponent.skeletonData) {
      "<None>" === (e = this.getAnimationNameByIndex(e))
        ? this.skeletonComponent.clearAnimation(this.trackIndex)
        : this.skeletonComponent.setAnimation(this.trackIndex, e);

      this.broadcastAnimationInfo();
    }
  }
  getAnimationNameByIndex(e) {
    var t = this.skeletonComponent?.skeletonData?.getAnimsEnum();
    return t ? String(t[e]) : "";
  }
  play() {
    if (this.skeletonComponent) {
      this.isPaused = false;
      this.skeletonComponent.paused = false;
      this.isPlaying || this.setAnimationIndex();
    }
  }
  pause(e) {
    var t;

    if (
      this.skeletonComponent &&
      ((this.isPaused = true),
      (this.skeletonComponent.paused = true),
      (t = this.getCurrent()))
    ) {
      this.setCurrentTime(e ?? t.getAnimationTime(), t);
    }
  }
  stop() {
    if (this.skeletonComponent && this.spineData) {
      this.isPaused = true;
      this.setCurrentTime(0);
    }
  }
  rewind() {
    this.isPaused = true;
    this.setCurrentTime(0);
  }
  prevPlay() {
    this.isPaused = true;
    this.setCurrentTime(this.currentTime - 1 / this._fps);
  }
  nextPlay() {
    this.isPaused = true;
    this.setCurrentTime(this.currentTime + 1 / this._fps);
  }
  forward() {
    this.isPaused = true;
    var e = this.getCurrent();

    if (e) {
      this.setCurrentTime(e.animationEnd, e);
    }
  }
  setProperties(e, t) {
    if (this.skeletonComponent) {
      e in this.skeletonComponent &&
        ((this.skeletonComponent[e] = t), e === "loop") &&
        this.setAnimationIndex();

      cce.Engine.repaintInEditMode();
      this.broadcastAnimationInfo();
    }
  }
  setCurrentTime(e, t) {
    const n = this.skeletonComponent;

    if (n && (t = t ?? this.getCurrent())) {
      n.paused = false;
      t.trackTime = e;
      this.currentTime = e;

      cc_1.director.once(cc_1.Director.EVENT_END_FRAME, () => {
        n.paused = true;
        this.broadcastAnimationInfo({ currentTime: e });
      });

      cce.Engine.repaintInEditMode();
    }
  }
  broadcastAnimationInfo(e = {}) {
    var t = this.getCurrent();

    var t = {
      currentTime: this.currentTime,
      duration: t?.animation.duration,
      isPlaying: !this.isPaused,
      ...e,
    };

    Editor.Message.broadcast(ANIMATION_CHANGE_TAG, t);
  }
  startAnimationUpdate() {
    this.clearAnimationUpdate();
    var e = (1 / this._fps) * 1000; /* 1e3 */
    this._animUpdateInterval = setInterval(this.update.bind(this), e);
  }
  clearAnimationUpdate() {
    if (this._animUpdateInterval) {
      clearInterval(this._animUpdateInterval);
      this._animUpdateInterval = null;
    }
  }
  getCurrent() {
    return this.skeletonComponent?.getCurrent(this.trackIndex);
  }
  get isPlaying() {
    var e;
    return !(
      !this.skeletonComponent ||
      !(e = this.getCurrent()) ||
      this.isPaused ||
      this.skeletonComponent.paused ||
      (!this.skeletonComponent.loop && !(e.trackTime < e.animation.duration))
    );
  }
  update() {
    var e;
    var t;

    if (this.skeletonComponent && !this.isPaused && (e = this.getCurrent())) {
      t = e.trackTime > e.animation.duration;
      this.currentTime = e.getAnimationTime();

      !this.isPlaying && t
        ? this.pause(e.animation.duration)
        : this.broadcastAnimationInfo();
    }
  }
}
exports.SpinePreview = SpinePreview;
