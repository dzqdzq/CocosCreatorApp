var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const gizmo_select_1 = __importDefault(
  require("../components/base/gizmo-select")
);

const position_1 = __importDefault(require("./position"));
const rotation_1 = __importDefault(require("./rotation"));
const scale_1 = __importDefault(require("./scale"));
const rectangle_1 = __importDefault(require("./rectangle"));
const view_1 = __importDefault(require("./view"));

const gizmoMap = {
  view: new view_1.default(null),
  position: new position_1.default(null),
  rotation: new rotation_1.default(null),
  scale: new scale_1.default(null),
  rect: new rectangle_1.default(null),
};

class TransformGizmo extends gizmo_select_1.default {
  _gizmo = gizmoMap[cce.Gizmo.transformToolData.toolName];
  get nodes() {
    return this._gizmo.nodes;
  }
  set target(e) {
    this._gizmo.target = e;
    super.target = e;
  }
  get target() {
    return this._gizmo.target;
  }
  changeTool(e) {
    var o = this._gizmo.target;
    this._gizmo.hide();
    this._gizmo.target = null;
    var e = gizmoMap[e];

    if (this._gizmo.constructor !== e.constructor) {
      this._gizmo.onHide();
    }

    this._gizmo = e;
    this._gizmo.target = this._gizmo.target || o;
    this._gizmo.show();
  }
  _eventMap = {
    toolNameChanged: () => {
      this.changeTool(cce.Gizmo.transformToolData.toolName);
    },
  };
  onVertexSnapMove(e) {
    if (this._gizmo.onVertexSnapMove) {
      return this._gizmo.onVertexSnapMove(e);
    }
  }
  init() {
    this._gizmo.init();
  }
  show() {
    super.show();
    this._gizmo.show();
  }
  hide() {
    super.hide();
    this._gizmo.hide();
  }
  onShow() {
    if (super.onShow) {
      super.onShow();
    }

    this.changeTool(cce.Gizmo.transformToolData.toolName);

    this._eventMap.toolNameChanged = () => {
      this.changeTool(cce.Gizmo.transformToolData.toolName);
    };

    this._eventMap.viewModeChanged = () => {
      cce.Engine.repaintInEditMode();
    };

    this._eventMap.pivotChanged = () => {
      if (this._gizmo.updateControllerTransform) {
        this._gizmo.updateControllerTransform();
      }

      cce.Engine.repaintInEditMode();
    };

    this._eventMap.coordinateChanged = () => {
      if (this._gizmo.updateControllerTransform) {
        this._gizmo.updateControllerTransform();
      }

      cce.Engine.repaintInEditMode();
    };

    cce.Gizmo.transformToolData?.addListener(
      "tool-name-changed",
      this._eventMap.toolNameChanged
    );

    cce.Gizmo.transformToolData?.addListener(
      "view-mode-changed",
      this._eventMap.viewModeChanged
    );

    cce.Gizmo.transformToolData?.addListener(
      "pivot-changed",
      this._eventMap.pivotChanged
    );

    cce.Gizmo.transformToolData?.addListener(
      "coordinate-changed",
      this._eventMap.coordinateChanged
    );

    this._gizmo.onShow();
  }
  onHide() {
    if (super.onHide) {
      super.onHide();
    }

    cce.Gizmo.transformToolData?.removeListener(
      "tool-name-changed",
      this._eventMap.toolNameChanged
    );

    cce.Gizmo.transformToolData?.removeListener(
      "view-mode-changed",
      this._eventMap.viewModeChanged
    );

    cce.Gizmo.transformToolData?.removeListener(
      "pivot-changed",
      this._eventMap.pivotChanged
    );

    cce.Gizmo.transformToolData?.removeListener(
      "coordinate-changed",
      this._eventMap.coordinateChanged
    );

    this._gizmo.onHide();
  }
  onUpdate(e) {
    if (this._gizmo.onUpdate) {
      this._gizmo.onUpdate(e);
    }
  }
  onDestroy() {
    if (this._gizmo.onDestroy) {
      this._gizmo.onDestroy();
    }
  }
  onNodeChanged(e) {
    if (this._gizmo.onNodeChanged) {
      this._gizmo.onNodeChanged(e);
    }
  }
  onKeyDown(e) {
    return this._gizmo.onKeyDown && this._gizmo.onKeyDown(e);
  }
  onKeyUp(e) {
    return this._gizmo.onKeyUp && this._gizmo.onKeyUp(e);
  }
  onCameraControlModeChanged(e) {
    return (
      this._gizmo.onCameraControlModeChanged &&
      this._gizmo.onCameraControlModeChanged(e)
    );
  }
}
exports.default = TransformGizmo;
