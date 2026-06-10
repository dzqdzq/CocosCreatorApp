var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticleManager = undefined;
const node_1 = __importDefault(require("./node"));
const component_1 = __importDefault(require("./component"));
const cc_1 = require("cc");
const selection_1 = __importDefault(require("./selection"));
const index_1 = __importDefault(require("../manager/scene/index"));
const events_1 = __importDefault(require("events"));
const scene_facade_state_interface_1 = require("../facade/scene-facade-state-interface");
class ParticleManager {
  _currentMode;
  get currentMode() {
    return this._currentMode || Editor.EditMode.getMode();
  }
  set currentMode(e) {
    if (this._currentMode !== e) {
      switch (this._currentMode) {
        case scene_facade_state_interface_1.SceneModeType.Animation: {
          this.onExitAnimationMode();
          break;
        }
        case scene_facade_state_interface_1.SceneModeType.General: {
          this.onExitGeneralMode();
          break;
        }
        case scene_facade_state_interface_1.SceneModeType.Prefab: {
          this.onExitPrefabMode();
        }
      }
      this._currentMode = e;

      switch (this._currentMode) {
        case scene_facade_state_interface_1.SceneModeType.Animation: {
          this.onEnterAnimationMode();
          break;
        }
        case scene_facade_state_interface_1.SceneModeType.General: {
          this.onEnterGeneralMode();
          break;
        }
        case scene_facade_state_interface_1.SceneModeType.Prefab: {
          this.onEnterPrefabMode();
        }
      }
    }
  }
  stoppedParticleSet = new WeakSet();
  _selectedUUIDs = [];
  _onSelect = null;
  _onUnselect = null;
  onResize(e) {}
  onSceneOpened(e) {}
  onSceneReload(e) {}
  onSceneClosed(e) {}
  onNodeChanged(e, t) {}
  onAddNode(e) {}
  onRemoveNode(e) {}
  onNodeAdded(e, t) {}
  onNodeRemoved(e, t) {}
  onAddComponent(e) {}
  onRemoveComponent(e) {}
  onComponentAdded(e, t) {
    if (
      e instanceof cc_1.ParticleSystemComponent &&
      this.getSelectedParticleSystemComponents().includes(e) &&
      !e.isPlaying
    ) {
      e.play();
    }
  }
  onComponentRemoved(e, t) {}
  onSelect(e, t) {
    this._selectedUUIDs = t.slice();
    t = this.getSelectedParticleSystemComponents();

    if (t.some((e) => !this.stoppedParticleSet.has(e))) {
      t.forEach((e) => this.stoppedParticleSet.delete(e));
    }

    t.forEach((e) => {
      if (!e.isPlaying && !this.stoppedParticleSet.has(e)) {
        e.play();
      }
    });
  }
  onUnselect(e, t) {
    this.getSelectedParticleSystemComponents().forEach((e) => {
      if (!t.includes(e.node.uuid) && e.isPlaying) {
        e.pause();
      }
    });

    this._selectedUUIDs = t.slice();
  }
  onEnterGeneralMode() {
    this._onSelect ||= this.onSelect.bind(this);
    this._onUnselect ||= this.onUnselect.bind(this);
    selection_1.default.on("select", this._onSelect);
    selection_1.default.on("unselect", this._onUnselect);
  }
  onExitGeneralMode() {
    if (this._onSelect) {
      selection_1.default.off("select", this._onSelect);
    }

    if (this._onUnselect) {
      selection_1.default.off("unselect", this._onUnselect);
    }

    this.getSelectedParticleSystemComponents().forEach((e) => {
      if (e.isPlaying) {
        e.stop();
      }
    });
  }
  onEnterAnimationMode() {
    this.getSelectedParticleSystemComponents().forEach((e) => {
      if (!e.isPlaying && e.playOnAwake) {
        e.play();
      }
    });
  }
  onExitAnimationMode() {}
  onEnterPrefabMode() {
    this.onEnterGeneralMode();
  }
  onExitPrefabMode() {
    this.onExitGeneralMode();
  }
  init() {
    this.currentMode = Editor.EditMode.getMode();

    if (index_1.default instanceof events_1.default) {
      index_1.default.on("mode-change", (e) => {
        this.currentMode = e;
      });
    }
  }
  queryPlayInfo(e) {
    e = component_1.default.query(e);
    return e
      ? {
          speed: e.simulationSpeed,
          time: e.time.toFixed(2),
          particle: e.getParticleCount(),
          isPlaying: e.isPlaying,
        }
      : null;
  }
  setPlaySpeed(e, t) {
    var e = component_1.default.query(e);

    if (
      e &&
      ((e.simulationSpeed = t),
      -1 !== (e = (t = e.node)._components.indexOf(e)))
    ) {
      e = `__comps__.${e}.simulationSpeed`;
      node_1.default.emit("change", t, { propPath: e });
    }
  }
  play() {
    this.getSelectedParticleSystemComponents().forEach((e) => {
      if (!e.isPlaying) {
        e.play();
        this.stoppedParticleSet.delete(e);
      }
    });
  }
  stop() {
    this.getSelectedParticleSystemComponents().forEach((e) => {
      if (!e.isStopped) {
        e.stop();
        this.stoppedParticleSet.add(e);
      }
    });
  }
  pause() {
    this.getSelectedParticleSystemComponents().forEach((e) => {
      if (!e.isPaused) {
        e.pause();
        this.stoppedParticleSet.add(e);
      }
    });
  }
  restart() {
    this.getSelectedParticleSystemComponents().forEach((e) => {
      if (!e.isStopped) {
        e.stop();
      }

      if (!e.isPlaying) {
        e.play();
        this.stoppedParticleSet.delete(e);
      }
    });
  }
  getSelectedParticleSystemComponents() {
    const s = [];
    function i(e) {
      if (e.getComponent(cc_1.ParticleSystemComponent)) {
        var t = e.getParent();
        if (t && t.getComponent(cc_1.ParticleSystemComponent) !== null) {
          i(t);
        } else {
          var n = e.getComponentsInChildren(cc_1.ParticleSystemComponent);
          for (let e = 0; e < n.length; e++) {
            var o = n[e];

            if (!s.includes(o)) {
              s.push(o);
            }
          }
        }
      }
    }
    for (let e = 0; e < this._selectedUUIDs.length; e++) {
      var t = this._selectedUUIDs[e];
      var t = node_1.default.query(t);

      if (t) {
        i(t);
      }
    }
    return s.filter((e) => e.enabled);
  }
}
exports.ParticleManager = ParticleManager;
exports.default = new ParticleManager();
