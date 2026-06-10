var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
const terrain_1 = __importDefault(require("../../controller/terrain"));
class TerrainPersistentGizmo extends base_1.SelectGizmo {
  _controller;
  get selectGizmo() {
    return this.target ? this.target.gizmo : null;
  }
  init() {
    var e = this.getGizmoRoot();
    this._controller = new terrain_1.default(e);
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    this._controller.onControllerHoverOut =
      this.onControllerHoverOut.bind(this);
    this.updateController();
  }
  updateController() {
    var e;

    if (this._controller) {
      this.target
        ? (this._controller.updateWorldPosition(
            this.target.node.getWorldPosition()
          ),
          (e = this.target.info) &&
            this._controller.updateSize(e.size.width, e.size.height),
          this._controller.show())
        : this._controller.hide();

      cce.Engine.repaintInEditMode();
    }
  }
  onTargetUpdate() {
    this.updateController();
  }
  onNodeChanged() {
    this.updateController();
  }
  onControllerMouseDown(e) {
    if (
      this.target &&
      Editor.Selection.getLastSelected("node") !== this.target.node.uuid
    ) {
      e.propagationStopped = true;
      return Editor.Selection.select("node", this.target.node.uuid);
    }

    if (this.selectGizmo?.visible()) {
      this.selectGizmo?.onControllerMouseDown(e);
    }
  }
  onControllerMouseMove(e) {
    if (this.selectGizmo?.visible()) {
      this.selectGizmo?.onControllerMouseMove(e);
    }
  }
  onControllerMouseUp(e) {
    if (this.selectGizmo?.visible()) {
      this.selectGizmo?.onControllerMouseUp(e);
    }
  }
  onControllerHoverOut() {
    if (this.selectGizmo?.visible()) {
      this.selectGizmo?.onControllerHoverOut();
    }
  }
}
exports.default = TerrainPersistentGizmo;
