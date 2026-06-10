var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        var n = Object.getOwnPropertyDescriptor(t, i);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, i, r) => {
        e[(r = r === undefined ? i : r)] = t[i];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = n(e), r = 0; r < i.length; r++) {
          if (i[r] !== "default") {
            __createBinding(t, e, i[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniPreview = undefined;
const apply = __importStar(require("./apply"));

const { createPreviewNode } = require("./private");

const cc_1 = require("cc");
const selection_1 = __importDefault(require("../selection"));
const node_1 = __importDefault(require("../../manager/node"));
const component_1 = __importDefault(require("../../manager/component"));
const scene_view_data_1 = require("../scene-view/scene-view-data");
const preview_base_1 = require("../preview/preview-base");
const buffer_1 = __importDefault(require("../preview/buffer"));
const event_enum_1 = require("../../../public/event-enum");
class MiniPreview extends preview_base_1.PreviewBase {
  previewNodes = {};
  scene = null;
  renderScene = null;
  currNode = null;
  _previewInfo;
  init(e, t) {
    this.previewBuffer = new buffer_1.default(e, t);
    cc.director.root.destroyWindow(this.previewBuffer.window);

    this._previewInfo = {
      width: scene_view_data_1.sceneViewData.targetResolution.width,
      height: scene_view_data_1.sceneViewData.targetResolution.height,
    };

    scene_view_data_1.sceneViewData.on("target-resolution-changed", () => {
      this._previewInfo = {
        width: scene_view_data_1.sceneViewData.targetResolution.width,
        height: scene_view_data_1.sceneViewData.targetResolution.height,
      };

      selection_1.default.query().forEach((e) => {
        e = node_1.default.query(e);

        if (e) {
          this.onNodeChanged(e, {});
        }
      });
    });

    scene_view_data_1.sceneViewData.on("is-scene-light-on", () => {
      selection_1.default.query().forEach((e) => {
        e = node_1.default.query(e);

        if (e) {
          this.onNodeChanged(e, {});
        }
      });
    });
  }
  onResize() {
    cce.Plugin.sendToFloatWindow("cc.Camera", "viewResize");
  }
  setAspect(e, t) {
    if (e.targetTexture) {
      t._aspect = e.camera.aspect;
    } else {
      t._aspect = scene_view_data_1.sceneViewData.targetAspect;
    }
  }
  onNodeChanged(e, t) {
    if (e) {
      const r = e.getComponent("cc.Camera");
      var i;

      if (r && e === this.currNode && r) {
        this.previewNodes[r.uuid] || this.createPreviewNode(r);
        i = this.previewNodes[r.uuid];
        apply.applyCamera(r, i.camera);

        t.type === event_enum_1.NodeOperationType.SET_PROPERTY &&
          ((e =
            "__comps__." + e.components.findIndex((e) => e.uuid === r.uuid)),
          t.propPath?.includes(e)) &&
          this.clearPreviewBuffer();

        this.setAspect(r, i.camera);
        cce.Engine.repaintInEditMode();

        requestAnimationFrame(() => {
          this.setPreviewInfo();
        });
      }
    }
  }
  onNodeRemoved(e) {
    e = e.getComponent("cc.Camera");

    if (e) {
      this.removePreviewNode(e);
    }
  }
  handleSelect(e) {
    e = component_1.default.query(e);

    if (e && e.node.active && e.node.activeInHierarchy && e.enabled) {
      cce.Engine.repaintInEditMode();
      this.createPreviewNode(e);
    }
  }
  handleUnselect(e) {
    e = component_1.default.query(e);

    if (e && e instanceof cc_1.Camera) {
      this.removePreviewNode(e);
    }
  }
  onComponentRemoved(e) {
    if (e instanceof cc_1.Camera) {
      cce.Engine.repaintInEditMode();
      this.removePreviewNode(e);
    }
  }
  clearByComponent(e) {
    if (
      e instanceof cc_1.Camera &&
      ((e = e.uuid),
      this.previewBuffer.windows[e] && this.previewBuffer.removeWindow(e),
      this.previewNodes[e])
    ) {
      this.previewNodes[e].node.destroy();
      this.previewNodes[e].camera.destroy();
      delete this.previewNodes[e];
    }
  }
  removePreviewNode(t) {
    var t_node = t.node;
    for (let e = 0; e < t_node.children.length; ++e) {
      var r = t_node.children[e].getComponent("cc.Camera");

      if (t_node.children[e].isPrivatePreview && r) {
        (r = t_node.children[e]).destroy();
        t.node.removeChild(r);
      }
    }
    this.currNode = null;
    this.clearByComponent(t);
  }
  createPreviewNode(e) {
    this.clearByComponent(e);
    var t = e.node.name;
    var t = createPreviewNode(t);
    var i = t.addComponent("cc.Camera");
    e.node.addChild(t);

    if (i.camera) {
      i.camera.cameraUsage = cc_1.renderer.scene.CameraUsage.PREVIEW;
      this.previewNodes[e.uuid] = { node: t, camera: i.camera };
      t = this.previewNodes[e.uuid];
      apply.applyCamera(e, t.camera);
      this.setAspect(e, t.camera);

      if (this.previewBuffer.windows[e.uuid]) {
        this.previewBuffer.window = this.previewBuffer.windows[e.uuid];
        this.clearPreviewBuffer();
      } else {
        this.previewBuffer.createWindow(e.uuid);
      }

      this.previewBuffer.switchCameras(t.camera, this.previewBuffer.window);
      this.currNode = e.node;
      return t;
    }
  }
  setPreviewInfo() {
    this._previewInfo.name = "preview-plugin";
    cce.Plugin.sendToFloatWindow("cc.Camera", this._previewInfo);
  }
  getPreviewInfo() {
    return this._previewInfo;
  }
}
exports.MiniPreview = MiniPreview;
