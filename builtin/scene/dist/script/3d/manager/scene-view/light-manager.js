var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.lightManager = undefined;
const cc_1 = require("cc");
const component_1 = __importDefault(require("../component"));
const node_1 = __importDefault(require("../../../utils/node"));
const scene_view_data_1 = require("./scene-view-data");
class LightManager {
  _lights = [];
  onSceneOpened(e, n) {
    this._lights = [];
    const t = component_1.default.queryAll();
    Object.keys(t).forEach((e) => {
      e = t[e];

      if (e instanceof cc_1.LightComponent) {
        if (!node_1.default.isEditorNode(e.node)) {
          this.overrideLightCompFunc(e);
          this._lights.push(e);
          e[n ? "onEnable" : "onDisable"]();
        }
      }
    });
  }
  onComponentAdded(e) {
    if (e instanceof cc_1.LightComponent) {
      if (!node_1.default.isEditorNode(e.node)) {
        this.overrideLightCompFunc(e);
        this._lights.push(e);
      }
    }
  }
  onComponentRemoved(e) {
    if (e instanceof cc_1.LightComponent) {
      e = this._lights.indexOf(e);
      this._lights.splice(e, 1);
    }
  }
  disableSceneLights() {
    this._lights.forEach((e) => {
      e.onDisable();
    });

    cce.Engine.repaintInEditMode();
  }
  enableSceneLights() {
    this._lights.forEach((e) => {
      if (e.enabled && e.node && e.node.active) {
        e.onEnable();
      }
    });

    cce.Engine.repaintInEditMode();
  }
  overrideLightCompFunc(e) {
    if (!e._hasOverrideOnEnable) {
      const e_onEnable = e.onEnable;

      e.onEnable = () => {
        if (scene_view_data_1.sceneViewData.isSceneLightOn) {
          e_onEnable.apply(e);
        }
      };

      e._hasOverrideOnEnable = true;
    }
  }
}
const lightManager = new LightManager();
exports.lightManager = lightManager;
