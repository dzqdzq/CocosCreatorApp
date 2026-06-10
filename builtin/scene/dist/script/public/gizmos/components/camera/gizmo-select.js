var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const scene_view_data_1 = require("../../../../3d/manager/scene-view/scene-view-data");
const index_1 = __importDefault(require("../../utils/engine/index"));
const base_1 = require("../base");
const frustum_1 = __importDefault(require("../../controller/frustum"));
const NodeUtils = external_1.default.NodeUtils;
const { getCameraData, setCameraData, ProjectionType, FOVAxis } =
  index_1.default;
const EditorMath = external_1.default.EditorMath;
const tempQuat_a = new cc_1.Quat();
class CameraComponentGizmo extends base_1.SelectGizmo {
  _controller;
  _fov = 0;
  _near = 0;
  _far = 0;
  _aspect = 0;
  _farHalfWidth = 0;
  _farHalfHeight = 0;
  _projection = 0;
  _fovAxis = FOVAxis.VERTICAL;
  _onTargetResolutionChanged;
  init() {
    this.createController();
    this._isInitialized = true;
    this._onTargetResolutionChanged = this.onTargetResolutionChanged.bind(this);
  }
  onShow() {
    this._controller.show();
    this.updateControllerData();

    scene_view_data_1.sceneViewData.on(
      "target-resolution-changed",
      this._onTargetResolutionChanged
    );
  }
  onHide() {
    this._controller.hide();

    scene_view_data_1.sceneViewData.off(
      "target-resolution-changed",
      this._onTargetResolutionChanged
    );
  }
  createController() {
    var t = this.getGizmoRoot();
    this._controller = new frustum_1.default(t);
    this._controller.editable = true;
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
  }
  onControllerMouseDown() {
    var t;

    if (this._isInitialized && this.target != null) {
      t = getCameraData(this.target);
      this._projection = t.projection;
      this._fov = t.fov;
      this._near = t.near;
      this._far = t.far;
      this._aspect = scene_view_data_1.sceneViewData.targetAspect;
      this._fovAxis = t.fovAxis;

      this._projection === ProjectionType.PERSPECTIVE
        ? this._fovAxis === FOVAxis.VERTICAL
          ? ((this._farHalfHeight =
              Math.tan(EditorMath.deg2rad(this._fov / 2)) * this._far),
            (this._farHalfWidth = this._farHalfHeight * this._aspect))
          : ((this._farHalfWidth =
              Math.tan(EditorMath.deg2rad(this._fov / 2)) * this._far),
            (this._farHalfHeight = this._farHalfWidth / this._aspect))
        : ((this._farHalfHeight = t.orthoHeight),
          (this._farHalfWidth = this._farHalfHeight * this._aspect));

      this.onControlBegin("");
    }
  }
  onControllerMouseMove() {
    this.updateDataFromController();
  }
  onControllerMouseUp() {
    this.onControlEnd("");
  }
  updateDataFromController() {
    if (this._controller.updated) {
      var t = this._controller.getDeltaWidth();
      var e = this._controller.getDeltaHeight();
      var r = this._controller.getDeltaDistance();
      let a = this._farHalfHeight;
      let o = this._farHalfWidth;

      if (t !== 0) {
        o = this._farHalfWidth + t;
        a = o / this._aspect;
      }

      if (e !== 0) {
        a = this._farHalfHeight + e;
        o = a * this._aspect;
      }

      let i = this._far;

      if (r !== 0) {
        i = this._far + r;
        (i = Math.abs(i)) < this._near && (i = this._near + 0.01);
        i = EditorMath.toPrecision(i, 3);
      }

      a = Math.abs(a);

      if (this._projection === ProjectionType.PERSPECTIVE) {
        let t = this._fov;
        let e = a;

        if (this._fovAxis === FOVAxis.HORIZONTAL) {
          e = o;
        }

        if (a !== this._farHalfHeight || o !== this._farHalfWidth) {
          (t = 2 * Math.atan2(e, this._far)) < EditorMath.D2R &&
            (t = EditorMath.D2R);

          t *= EditorMath.R2D;
          t = EditorMath.toPrecision(t, 3);
        }

        setCameraData(this.target, { fov: t, far: i });
      } else {
        a = EditorMath.toPrecision(a, 3);
        setCameraData(this.target, { orthoHeight: a, far: i });
      }

      if (this.target) {
        this.onComponentChanged(this.target.node);
      }
    }
  }
  updateControllerTransform() {
    var t;
    var e;
    var a;

    if (this.target) {
      t = this.target.node;
      e = NodeUtils.getWorldPosition3D(t);
      a = tempQuat_a;
      NodeUtils.getWorldRotation3D(t, a);
      this._controller.setPosition(e);
      this._controller.setRotation(a);
    }
  }
  updateControllerData() {
    var t;
    var e;

    if (
      this._isInitialized &&
      this.target != null &&
      (!this.target.node || this.target.node.activeInHierarchy)
    ) {
      t = getCameraData(this.target);
      e = scene_view_data_1.sceneViewData.targetAspect;

      t &&
        (this._controller.checkEdit(),
        this._controller.updateSize(
          t.projection,
          t.orthoHeight,
          t.fov,
          e,
          t.near,
          t.far,
          t.fovAxis
        ),
        this.updateControllerTransform());
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
  onTargetResolutionChanged() {
    this.updateControllerData();
    cce.Engine.repaintInEditMode();
  }
}
exports.default = CameraComponentGizmo;
