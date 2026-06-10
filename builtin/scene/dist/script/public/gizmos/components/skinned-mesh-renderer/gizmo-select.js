var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const index_1 = __importDefault(require("../../utils/engine/index"));
const base_1 = require("../base");
const box_1 = __importDefault(require("../../controller/box"));

const controller_light_probe_tetrahedron_1 = __importDefault(
  require("../light-probe-group/controller-light-probe-tetrahedron")
);

const manager_1 = require("../light-probe-group/manager");
const types_1 = require("../light-probe-group/types");
const { getBoundingBox, getRootBoneNode } = index_1.default;
class SkinningModelComponentGizmo extends base_1.SelectGizmo {
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
    this._controller.setOpacity(150);
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

    if (this._isInitialized && this.target != null) {
      if (getRootBoneNode(this.target) && (e = getBoundingBox(this.target))) {
        t = cc.v3();
        cc_1.Vec3.multiplyScalar(t, e.halfExtents, 2);
        r = cc.v3();
        cc_1.Vec3.copy(r, e.center);
        this._controller.updateSize(r, t);
      } else {
        this._controller.hide();
      }
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
  onUpdate() {
    this.updateControllerData();
    this.tetrahedronController?.updateController();
  }
}
exports.default = SkinningModelComponentGizmo;
