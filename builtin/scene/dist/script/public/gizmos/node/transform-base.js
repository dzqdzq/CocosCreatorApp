var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const gizmo_select_1 = __importDefault(
  require("../components/base/gizmo-select")
);

const utils_1 = __importDefault(require("../utils"));
const cc_1 = require("cc");
class TransformGizmo extends gizmo_select_1.default {
  _controller;
  isNodeLocked(e) {
    return false;
  }
  get nodes() {
    const r = cce.Selection.query().map((e) => cce.Node.query(e));
    return r.filter((e) => {
      if (e === null || !e.isValid || this.isNodeLocked(e)) {
        return false;
      }
      let e_parent = e.parent;

      while (e_parent) {
        if (r.includes(e_parent) && !this.isNodeLocked(e_parent)) {
          return false;
        }
        if (!e_parent.isValid) {
          return false;
        }
        if (e_parent.parent === null && !(e_parent instanceof cc_1.Scene)) {
          return false;
        }
        e_parent = e_parent.parent;
      }

      return true;
    });
  }
  onShow() {
    if (
      this._controller &&
      this.nodes.length !== 0 &&
      (this._controller.show(), this.updateControllerTransform)
    ) {
      this.updateControllerTransform();
    }
  }
  onHide() {
    if (!this.target || !this._controller || this.nodes.length !== 1) {
      if (this._controller) {
        this._controller.hide();
      }
    }
  }
  onTargetUpdate() {
    if (this._controller && this.updateControllerTransform) {
      this.updateControllerTransform();
    }
  }
  onNodeChanged() {
    if (this._controller && this.updateControllerTransform) {
      this.updateControllerTransform();
    }
  }
  broadcastNodeChangeMessage(e) {
    utils_1.default.broadcastMessage("scene:change-node", e.uuid);
  }
  getSnappedValue(e, t) {
    return Math.round(e / t) * t;
  }
  isControlKeyPressed(e) {
    return e.ctrlKey || e.metaKey;
  }
  onKeyDown(e) {
    if (this.target) {
      return !this._controller?.isMouseDown;
    }
  }
  onKeyUp(e) {
    return !this.target || !this._controller?.isMouseDown;
  }
}
exports.default = TransformGizmo;
