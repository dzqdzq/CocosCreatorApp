var NeedAnimState;

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.NeedAnimState = undefined;
exports.engineManager = undefined;
exports.EngineManager = undefined;

const time_1 = __importDefault(require("./time"));
const cc_1 = require("cc");
const selection_1 = __importDefault(require("../../../public/selection"));
const event_enum_1 = require("../../../public/event-enum");
const scene_view_1 = require("../scene-view");
const geometry_renderer_1 = require("./geometry_renderer");
const event_emitter_1 = require("../../../utils/event-emitter");

!((e) => {
  e[(e.CAMERA_ORBIT = 0)] = "CAMERA_ORBIT";
  e[(e.CAMERA_PAN = 1)] = "CAMERA_PAN";
  e[(e.CAMERA_WANDER = 2)] = "CAMERA_WANDER";
  e[(e.ANIMATION_MODE = 3)] = "ANIMATION_MODE";
  e[(e.PARTICLE_SYSTEM_MODE = 4)] = "PARTICLE_SYSTEM_MODE";
  e[(e.TERRAIN_SYSTEM_MODE = 5)] = "TERRAIN_SYSTEM_MODE";
  e[(e.GAME_VIEW_MODE = 6)] = "GAME_VIEW_MODE";
})(NeedAnimState || (exports.NeedAnimState = NeedAnimState = {}));

const isWin32 = process.platform === "win32";
const tickTime =
  isSceneNative && isWin32 ? 1000 /* 1e3 */ / 120 : 1000 /* 1e3 */ / 60;
class EngineManager extends event_emitter_1.EventEmitter {
  _setTimeoutId = null;
  _rafId = null;
  _maxDeltaTimeInEM = 1 / 30;
  _stateRecord = 0;
  _shouldRepaintInEM = false;
  _tickInEM = false;
  _tickedFrameInEM = -1;
  _paused = false;
  _capture = false;
  _bindTick = this._tick.bind(this);
  geometryRenderer;
  _sceneTick = false;
  async init() {
    cc.game.pause();
    this.geometryRenderer = new geometry_renderer_1.GeometryRenderer();
    this.startTick();

    scene_view_1.sceneViewManager.on(
      "isVisible",
      this.onSceneViewVisible.bind(this)
    );

    this._sceneTick = await Editor.Profile.getConfig("scene", "scene.tick");
  }
  setTimeout(e, t) {
    if (this._capture && scene_view_1.sceneViewManager.isVisible) {
      this._rafId = requestAnimationFrame(e);
    } else {
      this._setTimeoutId = setTimeout(e, t);
    }
  }
  clearTimeout() {
    if (this._setTimeoutId) {
      clearTimeout(this._setTimeoutId);
      this._setTimeoutId = null;
    }

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
  onSceneViewVisible(e) {
    this.stopTick();
    this.startTick();
  }
  onSceneOpened(e) {
    this.repaintInEditMode();
  }
  onComponentAdded(e) {
    var t = selection_1.default.query();

    if (e.node && t.includes(e.node.uuid)) {
      engineManager.checkToSetAnimState([e.node]);
    }
  }
  onComponentRemoved(e) {
    var t = selection_1.default.query();

    if (e.node && t.includes(e.node.uuid)) {
      engineManager.checkToSetAnimState([e.node]);
    }
  }
  onNodeChanged(e, t) {
    t = t?.type;

    if (
      t !== event_enum_1.NodeEventType.TRANSFORM_CHANGED &&
      t !== event_enum_1.NodeEventType.SIZE_CHANGED &&
      t !== event_enum_1.NodeEventType.ANCHOR_CHANGED &&
      t !== event_enum_1.NodeEventType.COMPONENT_CHANGED &&
      t !== event_enum_1.NodeEventType.PARENT_CHANGED &&
      t !== event_enum_1.NodeEventType.CHILD_CHANGED
    ) {
      this.checkToSetAnimState([e]);
    }
  }
  repaintInEditMode() {
    if (CC_EDITOR && this._tickedFrameInEM !== cc_1.director.getTotalFrames()) {
      this._shouldRepaintInEM = true;
    }
  }
  setFrameRate(e) {
    this._maxDeltaTimeInEM = 1 / e;
  }
  startTick() {
    if (this._setTimeoutId === null) {
      this._tick();
    }
  }
  stopTick() {
    this.clearTimeout();
  }
  tickInEditMode(e) {
    if (CC_EDITOR) {
      this._tickedFrameInEM = cc_1.director.getTotalFrames();
    }

    if (this.geometryRenderer) {
      this.geometryRenderer.flush();
    }

    cc_1.director.tick(e);
  }
  getGeometryRenderer() {
    return this.geometryRenderer;
  }
  enterState(e) {
    if (e === undefined) {
      console.error("undefined need animation state");
    } else {
      this._stateRecord |= 1 << e;
      this._updateTickState();
    }
  }
  exitState(e) {
    if (e === undefined) {
      console.error("undefined need animation state");
    } else {
      this._stateRecord &= ~(1 << e);
      this._updateTickState();
    }
  }
  resume() {
    this._paused = false;
    this.startTick();
  }
  pause() {
    this.stopTick();
    this._paused = true;
  }
  checkToSetAnimState(e) {
    let t = false;
    let i = false;

    e.forEach((e) => {
      if (e && e.components) {
        e.components.forEach((e) => {
          if (
            e instanceof cc_1.ParticleSystem ||
            e instanceof cc_1.ParticleSystem2D
          ) {
            t = true;
          } else if (e instanceof cc_1.Terrain) {
            i = true;
          }
        });
      }
    });

    if (t) {
      cce.Engine.enterState(cce.NeedAnimState.PARTICLE_SYSTEM_MODE);
    } else {
      cce.Engine.exitState(cce.NeedAnimState.PARTICLE_SYSTEM_MODE);
    }

    if (i) {
      cce.Engine.enterState(cce.NeedAnimState.TERRAIN_SYSTEM_MODE);
    } else {
      cce.Engine.exitState(cce.NeedAnimState.TERRAIN_SYSTEM_MODE);
    }
  }
  _tick() {
    var e;

    if (!this._paused) {
      this.setTimeout(this._bindTick, tickTime);
      e = performance.now() / 1000 /* 1e3 */;
      time_1.default.update(e, false, this._maxDeltaTimeInEM);

      this._isTickAllowed() &&
        ((this._shouldRepaintInEM = false),
        this.tickInEditMode(time_1.default.deltaTime),
        this.emit("onUpdate"));

      this.emit("onEditorTick");
    }
  }
  _updateTickState() {
    this._tickInEM = this._stateRecord > 0;
  }
  _isTickAllowed() {
    return this._sceneTick || this._shouldRepaintInEM || this._tickInEM;
  }
  emitUpdate() {
    if (this._paused) {
      this.emit("onUpdate");
    }
  }
  get capture() {
    return this._capture;
  }
  set capture(e) {
    this._capture = e;
  }
}
const engineManager = new (exports.EngineManager = EngineManager)();
exports.engineManager = engineManager;
