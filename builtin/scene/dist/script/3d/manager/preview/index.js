var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, i, r, t = r) => {
        var n = Object.getOwnPropertyDescriptor(i, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : i.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return i[r];
            },
          };
        }

        Object.defineProperty(e, t, n);
      }
    : (e, i, r, t) => {
        e[(t = t === undefined ? r : t)] = i[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, i) => {
        Object.defineProperty(e, "default", { enumerable: true, value: i });
      }
    : (e, i) => {
        e.default = i;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var i;
          var r = [];
          for (i in e) {
            if (Object.prototype.hasOwnProperty.call(e, i)) {
              r[r.length] = i;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var i = {};
      if (e != null) {
        for (var r = n(e), t = 0; t < r.length; t++) {
          if (r[t] !== "default") {
            __createBinding(i, e, r[t]);
          }
        }
      }
      __setModuleDefault(i, e);
      return i;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.previewMgr = undefined;
exports.PreviewManager = undefined;
const material_preview_1 = require("../material-preview");
const mesh_preview_1 = require("../mesh-preview");
const mini_preview_1 = require("../mini-preview");
const model_preview_1 = require("../model-preview");
const skeleton_preview_1 = require("../skeleton-preview");
const motion_1 = require("../animation-graph-preview/motion");
const transition_1 = require("../animation-graph-preview/transition");
const scene_preview_1 = require("./scene-preview");
const prefab_preview_1 = require("./prefab-preview");
const spine_preview_1 = require("./spine-preview");
class PreviewManager {
  _previewMgrMap = new Map();
  scenePreview = scene_preview_1.scenePreview;
  materialPreview = new material_preview_1.MaterialPreview();
  miniPreview = new mini_preview_1.MiniPreview();
  modelPreview = new model_preview_1.ModelPreview();
  meshPreview = new mesh_preview_1.MeshPreview();
  skeletonPreview = new skeleton_preview_1.SkeletonPreview();
  motionPreview = new motion_1.MotionPreview();
  transitionPreview = new transition_1.TransitionPreview();
  prefabPreview = new prefab_preview_1.PrefabPreview();
  spinePreview = new spine_preview_1.SpinePreview();
  _electronIPC = null;
  init() {
    this.initPreview("scene:preview", "query-preview-data", this.scenePreview);

    this.initPreview(
      "scene:mini-preview",
      "query-mini-preview-data",
      this.miniPreview
    );

    if (!isPreviewProcess) {
      this.initPreview(
        "scene:material-preview",
        "query-material-preview-data",
        this.materialPreview
      );

      this.initPreview(
        "scene:model-preview",
        "query-model-preview-data",
        this.modelPreview
      );

      this.initPreview(
        "scene:mesh-preview",
        "query-mesh-preview-data",
        this.meshPreview
      );

      this.initPreview(
        "scene:skeleton-preview",
        "query-skeleton-preview-data",
        this.skeletonPreview
      );

      this.initPreview(
        "scene:motion-preview",
        "query-motion-preview-data",
        this.motionPreview
      );

      this.initPreview(
        "scene:transition-preview",
        "query-transition-preview-data",
        this.transitionPreview
      );

      this.initPreview(
        "scene:prefab-preview",
        "query-prefab-preview-data",
        this.prefabPreview
      );

      this.initPreview(
        "scene:spine-preview",
        "query-spine-preview-data",
        this.spinePreview
      );
    }
  }
  async initPreview(e, i, r) {
    this._previewMgrMap.set(e, r);
    r.init(e, i);

    this._electronIPC = await Promise.resolve().then(() =>
      __importStar(require("@base/electron-base-ipc"))
    );

    if (!isPreviewProcess) {
      this._register(e, i);
    }
  }
  async queryPreviewData(e, i) {
    return this._previewMgrMap.has(e)
      ? this._previewMgrMap.get(e)?.queryPreviewData(i)
      : null;
  }
  async callPreviewFunction(e, i, ...r) {
    if (this._previewMgrMap.has(e)) {
      e = this._previewMgrMap.get(e);
      if (e[i]) {
        return e[i](...r);
      }
    }
    return false;
  }
  _register(r, e) {
    this._electronIPC.registerChannel(r);

    this._electronIPC.on(e, async (e, i) => {
      if (this._previewMgrMap.has(r)) {
        this._previewMgrMap.get(r)?.queryPreviewDataQueue(i, e);
      }
    });
  }
}
const previewMgr = new (exports.PreviewManager = PreviewManager)();
exports.previewMgr = previewMgr;
