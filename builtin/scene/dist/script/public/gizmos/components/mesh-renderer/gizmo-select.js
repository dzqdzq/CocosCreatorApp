var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const engine_1 = __importDefault(require("../../utils/engine"));
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const box_1 = __importDefault(require("../../controller/box"));

const controller_light_probe_tetrahedron_1 = __importDefault(
  require("../light-probe-group/controller-light-probe-tetrahedron")
);

const manager_1 = require("../light-probe-group/manager");
const types_1 = require("../light-probe-group/types");
const NodeUtils = external_1.default.NodeUtils;
const getBoundingBox = engine_1.default.getBoundingBox;
const tempQuat_a = new cc_1.Quat();
class ModelComponentGizmo extends base_1.SelectGizmo {
  _controller;
  tetrahedronController;
  init() {
    this.createController();
    this._isInitialized = true;

    manager_1.eventEmitter.addListener(
      types_1.LightProbeManagerEvent.MODE_CHANGED,
      () => {
        this.tetrahedronController.updateController();
      }
    );
  }
  onShow() {
    this._controller.show();
    this.tetrahedronController.show();
    this.updateControllerTransform();
  }
  onHide() {
    this._controller.hide();
    this.tetrahedronController.hide();
  }
  createController() {
    var e = this.getGizmoRoot();
    this._controller = new box_1.default(e);
    this.tetrahedronController =
      new controller_light_probe_tetrahedron_1.default(e, this);
  }
  updateControllerTransform() {
    this.updateControllerData();
  }
  updateControllerData() {
    var e;
    var t;
    var r;
    var o;
    var l;
    var n;

    if (this._isInitialized && this.target != null) {
      n = this.target.node;

      (e = getBoundingBox(this.target))
        ? (this._controller.show(),
          (t = new cc_1.Vec3()),
          NodeUtils.hasComponentInSelfAndParent(n, ["cc.UISkew"])
            ? this._controller.setWorldMatrix(n.worldMatrix)
            : ((r = NodeUtils.getWorldScale3D(n)),
              (o = NodeUtils.getWorldPosition3D(n)),
              (l = tempQuat_a),
              NodeUtils.getWorldRotation3D(n, l),
              this._controller.setScale(r),
              this._controller.setPosition(o),
              this._controller.setRotation(l)),
          cc_1.Vec3.multiplyScalar(t, e.halfExtents, 2),
          (n = cc.v3(e.center.x, e.center.y, e.center.z)),
          this._controller.updateSize(n, t))
        : this._controller.hide();
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
    this.tetrahedronController?.updateController();
  }
  onNodeChanged() {
    this.updateControllerData();
    this.tetrahedronController?.updateController();
  }
}
exports.default = ModelComponentGizmo;
