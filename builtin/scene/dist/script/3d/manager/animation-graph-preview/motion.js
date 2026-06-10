var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, n);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
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
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = n(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewState = undefined;
exports.MotionPreview = undefined;
const animationApi = __importStar(require("cc/editor/new-gen-anim"));
const base_1 = require("./base");
Object.defineProperty(exports, "PreviewState", {
  enumerable: true,
  get() {
    return base_1.PreviewState;
  },
});
class MotionPreview extends base_1.AnimationGraphPreviewBase {
  motion = null;
  hide() {
    super.hide();
    this.motion = null;
    this.previewer?.clear();
  }
  show(e, t) {
    if (t) {
      if (this.hasModel()) {
        if (e) {
          this.playState !== base_1.PlayState.STOP && this.stop();
          this.previewer.clear();
          this.setVariables(t);
          this.previewer.setMotion(e);
          this.motion = e;
          this.cameraComp.enabled = true;
          this.setProp();
          this.active = true;
          return base_1.PreviewState.NO_ERROR;
        }

        return base_1.PreviewState.ILLEGAL_MOTION;
      }

      return base_1.PreviewState.NO_MODEL;
    }

    return base_1.PreviewState.NO_ANIMATION_GRAPH;
  }
  setProp() {
    this.update();
  }
  createPreviewer(e) {
    return new animationApi.MotionPreviewer(e);
  }
  getLightName() {
    return "motion preview light";
  }
  getUpdateMessageName() {
    return "scene:update-motion-preview";
  }
}
exports.MotionPreview = MotionPreview;
