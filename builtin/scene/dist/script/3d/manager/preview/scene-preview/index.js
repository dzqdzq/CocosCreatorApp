var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.scenePreview = undefined;
exports.ScenePreview = undefined;
const cc_1 = require("cc");
const buffer_1 = __importDefault(require("../buffer"));
const preview_base_1 = require("../preview-base");

const editor_mask = cc_1.Layers.makeMaskInclude([
  cc.Layers.Enum.GIZMOS,
  cc.Layers.Enum.SCENE_GIZMO,
  cc.Layers.Enum.EDITOR,
]);

class ScenePreview extends preview_base_1.PreviewBase {
  device;
  width = 0;
  height = 0;
  init(e, r) {
    this.device = cc.director.root.device;
    this.width = this.device.width;
    this.height = this.device.height;
    this.previewBuffer = new buffer_1.default(e, r);
    this.previewBuffer.on("loadScene", this.detachSceneCameras.bind(this));
  }
  onComponentAdded(e) {
    if (e && !window.isPreviewProcess && e instanceof cc_1.Camera) {
      Promise.resolve().then(() => {
        if (e.camera) {
          e.camera.detachCamera();
        }

        if (isSceneNative) {
          cce.NativeScene.redirectTargetWindow("preview");
        }
      });
    }
  }
  detachSceneCameras() {
    for (const e of this.previewBuffer.renderScene.cameras) {
      if (!(e.node.layer & editor_mask)) {
        if (e.node.getComponent("cc.Camera") && !e.node.isPrivatePreview) {
          e.detachCamera();
        }
      }
    }
    cc.director.root.tempWindow = this.previewBuffer.window;
  }
}
const scenePreview = new (exports.ScenePreview = ScenePreview)();
exports.scenePreview = scenePreview;
