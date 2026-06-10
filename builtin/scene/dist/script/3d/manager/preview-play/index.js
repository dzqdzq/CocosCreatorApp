var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewPlay = undefined;
const cc_1 = require("cc");
const EventEmitter_1 = __importDefault(require("../../../public/EventEmitter"));
const message_1 = require("../message");
const scene_view_1 = require("../../manager/scene-view");
const env_1 = __importDefault(require("../../../utils/env"));
const scene_view_data_1 = require("../scene-view/scene-view-data");

const EDITOR_MASK = cc_1.Layers.makeMaskInclude([
  cc.Layers.Enum.GIZMOS,
  cc.Layers.Enum.SCENE_GIZMO,
  cc.Layers.Enum.EDITOR,
]);

const PlayState = { Play: "play", Stop: "stop", Pause: "pause" };

const NeedHideCamera = [
  cc_1.renderer.scene.CameraUsage.EDITOR,
  cc_1.renderer.scene.CameraUsage.SCENE_VIEW,
  cc_1.renderer.scene.CameraUsage.PREVIEW,
];

class PreviewPlay extends EventEmitter_1.default {
  _currSceneData;
  _state = PlayState.Stop;
  _fps = 60;
  _onSceneLaunch;
  _onSceneBeforeLaunch;
  _onDirectorEndFrame;
  _windowKeys;
  _scene = null;
  _updateInspectorHandler = null;
  _sceneLightOn = false;
  _isNative = false;
  startSceneJson;
  _rotate = false;
  hideEditorCameraSet = new Set();
  get sceneLightOn() {
    return this._sceneLightOn;
  }
  constructor() {
    super();
    this._onSceneLaunch = this.onSceneLaunch.bind(this);
    this._onSceneBeforeLaunch = this.onSceneBeforeLaunch.bind(this);
    this._onDirectorEndFrame = this.onDirectorEndFrame.bind(this);
  }
  async getGameScene(e = "") {
    var t = await Editor.Profile.getConfig("preview", "general.start_scene");
    let a;
    let c;
    var s = new Promise((e, t) => {
      a = e;
      c = t;
    });

    if (t === "current_scene") {
      a(e);
    } else {
      cc_1.assetManager.loadAny(t, (e, t) => {
        if (e) {
          c(e);
        } else {
          a(cce.Utils.serialize(t.scene));
        }
      });
    }

    return s;
  }
  beforeLaunch() {
    cce.Node.clear();
  }
  rotateScene(e) {
    this._rotate = e;
  }
  setResolution(e, t) {}
  showState(e) {
    if (this._state === PlayState.Play) {
      cc.debug.setDisplayStats(e);
    }
  }
  setFps(e) {
    if (e > 0 && ((this._fps = e), this._state === PlayState.Play)) {
      cc_1.game.frameRate = e;
    }
  }
  isPause() {
    return this._state === PlayState.Pause;
  }
  firstResume = true;
  async pause(e) {
    if (e) {
      if (this._state !== PlayState.Pause) {
        cc_1.director.pause();
        cc_1.game.pause();
        this._state = PlayState.Pause;
        this.showEditorCamera();

        this.firstResume &&
          (cce.Camera.defaultFocus(this._scene?.uuid ?? ""),
          (this.firstResume = false));

        scene_view_1.sceneViewManager.setSceneLightOn(this._sceneLightOn);
        cce.Engine.resume();
      }
    } else {
      cc_1.director.resume();
      cc_1.game.resume();
      this._state = PlayState.Play;
      this.hideEditorCamera();
      e = this._sceneLightOn;
      scene_view_1.sceneViewManager.setSceneLightOn(true);
      this._sceneLightOn = e;
      cce.Engine.pause();
    }
  }
  async step() {
    cc_1.director.resume();
    cc_1.director.tick(1 / this._fps);
    cc_1.director.pause();
  }
  async start(e = "") {
    if (
      await Editor.Profile.getConfig(
        "scene",
        "console.extend.clearOnPlay.value",
        "global"
      )
    ) {
      Editor.Message.send("console", "clear");
    }

    console.debug("start gameview");
    this._state = PlayState.Play;
    cce.Camera.setRulerVisible(false);

    this._sceneLightOn = await Editor.Profile.getConfig(
      "scene",
      "scene_view.isSceneLightOn"
    );

    scene_view_data_1.sceneViewData.on("is-scene-light-on", (e) => {
      if (!scene_view_data_1.sceneViewData.isGameViewPlaying()) {
        this._sceneLightOn = e;
      }
    });

    scene_view_1.sceneViewManager.setSceneLightOn(true);
    cce.SceneFacadeManager.changeTargetResolution();
    this._registerEvent();
    this._isNative = await env_1.default.useNativeScene();
    this.startSceneJson = await this.getGameScene(e);
    await cce.SceneFacadeManager.softReloadScene(this.startSceneJson);
    this.hideEditorCamera();
    cc.physics.PhysicsSystem.instance.enable = true;
    cce.Engine.pause();
    cc_1.director.resume();
    cc_1.game.resume();
    var e = await Editor.Profile.getConfig("scene", "game-view.stats");
    var t = await Editor.Profile.getConfig("scene", "game-view.fps");
    this.setFps(t);
    this.showState(e);
  }
  async stop() {
    console.debug("stop gameview");
    cc.debug.setDisplayStats(false);
    cc_1.game.setFrameRate(60);
    this._state = PlayState.Stop;
    cce.Selection.clear();
    cce.Camera.setRulerVisible(true);
    scene_view_1.sceneViewManager.setSceneLightOn(this._sceneLightOn);
    this._unregisterEvent();
    await cce.SceneFacadeManager.saveSceneConfig();
    cc.physics.PhysicsSystem.instance.enable = false;
    cc_1.game.pause();
    cc_1.director.pause();
    cce.Engine.stopTick();
    message_1.messageManager.broadcast("scene:preview-stop");
  }
  hideEditorCamera() {
    if (this._isNative) {
      cce.NativeScene.redirectTargetWindow("preview");
    } else {
      var t = cc_1.director.getScene()?.renderScene?.cameras ?? [];
      for (let e = t.length - 1; e >= 0; e--) {
        var a;
        var c = t[e];

        if (
          c.node.layer & EDITOR_MASK ||
          NeedHideCamera.includes(c.cameraUsage)
        ) {
          c.enabled = false;
          c.changeTargetWindow(cc_1.director.root?.tempWindow);
          this.hideEditorCameraSet.add(c.node);
        } else if (
          (a = c.node?.getComponent(cc.Camera))?.targetTexture &&
          a.targetTexture.window
        ) {
          c.changeTargetWindow(a.targetTexture.window);
        } else {
          c.changeTargetWindow(cc_1.director.root?.mainWindow);
        }
      }
      this.hideEditorCameraSet.forEach((e) => {
        e.active = false;
      });
    }
  }
  showEditorCamera() {
    if (!this._isNative) {
      this.hideEditorCameraSet.forEach((e) => {
        e.active = true;
      });

      this.hideEditorCameraSet.clear();
      var t = cc_1.director.getScene()?.renderScene?.cameras ?? [];
      for (let e = t.length - 1; e >= 0; e--) {
        var a = t[e];

        if (
          a.node.layer & EDITOR_MASK ||
          NeedHideCamera.includes(a.cameraUsage)
        ) {
          a.enabled = true;
          a.changeTargetWindow(cc_1.director.root?.mainWindow);
        } else {
          a.changeTargetWindow(cc_1.director.root?.tempWindow);
        }
      }
    }
  }
  setPlatform(e) {}
  onSceneLaunch(e) {
    if (this._state === PlayState.Play) {
      cce.Scene.sendSceneOpenMsg(e, e.uuid, e);
      this.hideEditorCamera();
    }

    this._scene = e;
  }
  onSceneBeforeLaunch(e) {
    if (this._scene) {
      cce.Scene.sendSceneCloseMsg(this._scene);
      cce.Selection.clear();
    }
  }
  onDirectorEndFrame() {
    this._updateInspector();

    if (isSceneNative) {
      cce.Engine.emitUpdate();
    }
  }
  _updateInspector() {
    if (!this._updateInspectorHandler) {
      this._updateInspectorHandler = setTimeout(() => {
        var e;
        this._updateInspectorHandler = null;

        if (
          this._state === PlayState.Play &&
          (e = cce.Selection.query()).length > 0
        ) {
          Editor.Message.broadcast("scene:change-node", e[0]);
        }
      }, 500);
    }
  }
  _recordGlobal() {
    this._windowKeys = Object.keys(window);
  }
  _resetGlobal() {
    for (const e in window) {
      if (!this._windowKeys.includes(e)) {
        delete window[e];
      }
    }
  }
  _registerEvent() {
    cc_1.director.on(cc_1.Director.EVENT_END_FRAME, this._onDirectorEndFrame);

    cc_1.director.on(
      cc_1.Director.EVENT_AFTER_SCENE_LAUNCH,
      this._onSceneLaunch
    );

    cc_1.director.on(
      cc_1.Director.EVENT_BEFORE_SCENE_LAUNCH,
      this._onSceneBeforeLaunch
    );
  }
  _unregisterEvent() {
    cc_1.director.off(cc_1.Director.EVENT_END_FRAME, this._onDirectorEndFrame);

    cc_1.director.off(
      cc_1.Director.EVENT_AFTER_SCENE_LAUNCH,
      this._onSceneLaunch
    );

    cc_1.director.off(
      cc_1.Director.EVENT_BEFORE_SCENE_LAUNCH,
      this._onSceneBeforeLaunch
    );
  }
}
const preview = new (exports.PreviewPlay = PreviewPlay)();
exports.default = preview;
