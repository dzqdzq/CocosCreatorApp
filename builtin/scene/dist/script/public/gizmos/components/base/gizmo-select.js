var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../../utils"));
const event_enum_1 = require("../../../event-enum");
const external_1 = __importDefault(require("../../utils/external"));

const { gizmoVisibilityCheck } = require("./gizmo-utils");

const EditorCamera = external_1.default.EditorCamera;
class GizmoBase {
  _hidden = true;
  _target;
  _isInitialized = false;
  _isControlBegin = false;
  _recorded = false;
  _nodeSelected = false;
  shouldRegisterGizmoOperationEvent = false;
  undoID = "";
  constructor(e) {
    this._target = e;
  }
  get target() {
    return this._target;
  }
  set target(e) {
    this._target = e;

    if (this.onTargetUpdate && this.checkVisible()) {
      this.onTargetUpdate();
      cce.Engine.repaintInEditMode();
    }

    if (this.nodes.length <= 0) {
      this.hide();
    }
  }
  get nodes() {
    return this.target ? [this.target.node] : [];
  }
  layer() {
    return "scene";
  }
  getGizmoRoot() {
    return cce.Gizmo.gizmoRootNode;
  }
  onControlBegin(t) {
    this._isControlBegin = true;
    this.recordChanges();

    this.nodes.forEach((e) => {
      utils_1.default.emitNodeMessage("gizmo-control-begin", e, {
        propPath: t,
      });

      utils_1.default.broadcastMessage("scene:gizmo-control-begin", e.uuid, {
        propPath: t,
      });
    });
  }
  onControlUpdate(e) {
    if (!this._isControlBegin) {
      this.onControlBegin(e);
    }
  }
  onControlEnd(t) {
    this._isControlBegin = false;
    this.commitChanges();

    this.nodes.forEach((e) => {
      utils_1.default.emitNodeMessage("gizmo-control-end", e, {
        propPath: t,
      });

      utils_1.default.broadcastMessage("scene:gizmo-control-end", e.uuid, {
        propPath: t,
      });
    });
  }
  recordChanges() {
    if (!this._recorded) {
      this.undoID = utils_1.default.recordChanges(
        this.nodes.map((e) => e.uuid)
      );

      this._recorded = true;
    }
  }
  commitChanges() {
    this._recorded = false;

    if (this.undoID !== "") {
      utils_1.default.commitChanges(this.undoID);
    }

    this.undoID = "";
  }
  checkVisible() {
    return gizmoVisibilityCheck(this);
  }
  visible() {
    return !this._hidden;
  }
  initialize() {
    if (!this._isInitialized) {
      this.init && this.init();
      this._isInitialized = true;
    }
  }
  destroy() {
    if (this.onDestroy) {
      this.onDestroy();
    }

    this.hide();
    this._target = null;
  }
  show() {
    if (this._hidden && this.checkVisible()) {
      this.initialize();
      this.onShow && this.onShow();
      this._hidden = false;
    }
  }
  hide() {
    if (!this._hidden) {
      this.onHide && this.onHide();
      this._hidden = true;
    }
  }
  update(e) {
    if (this.onUpdate) {
      this.onUpdate(e);
    }
  }
  getCompPropPath(e) {
    var t = this.target;
    return t ? "_components." + t.node._components.indexOf(t) + "." + e : null;
  }
  onComponentChanged(e) {
    utils_1.default.onNodeChanged(e, {
      type: event_enum_1.NodeEventType.COMPONENT_CHANGED,
    });
  }
  onEditorCameraMoved() {}
  registerCameraMovedEvent() {
    EditorCamera.camera.node.on(
      "transform-changed",
      this.onEditorCameraMoved,
      this
    );
  }
  unregisterCameraMoveEvent() {
    EditorCamera.camera.node.off(
      "transform-changed",
      this.onEditorCameraMoved,
      this
    );
  }
  onNodeSelectionChanged(e) {
    this._nodeSelected = e;
  }
}
exports.default = GizmoBase;
