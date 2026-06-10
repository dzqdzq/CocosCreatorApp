var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkeletonPreview = undefined;
const cc_1 = require("cc");

const { promisify } = require("../../../utils/misc");

const controller_utils_1 = __importDefault(
  require("../../../public/gizmos/utils/controller-utils")
);

const node_1 = __importDefault(require("../../../utils/node"));
const Interactive_preview_1 = require("../preview/Interactive-preview");
const regions = [new cc_1.gfx.BufferTextureCopy()];
regions[0].texExtent.depth = 1;
const tempVec3A = new cc_1.Vec3();
const tempVec3B = new cc_1.Vec3();
const tempQuatA = new cc_1.Quat();
class JointData {
  childJoint = [];
  position = new cc_1.Vec3();
}
class SkeletonPreview extends Interactive_preview_1.InteractivePreview {
  lightComp;
  _jointMap = {};
  init(e, t) {
    super.init(e, t);
  }
  createNodes(e) {
    this.lightComp = new cc.Node("Skeleton Preview Light").addComponent(
      cc_1.DirectionalLight
    );

    this.lightComp.node.setRotationFromEuler(-45, -45, 0);
    this.lightComp.node.parent = e;
  }
  async setSkeleton(e) {
    if (!e) {
      console.warn("invalid uuid");
      return null;
    }

    if (
      this._modelNode &&
      (this.scene.removeChild(this._modelNode), this._modelNode.isValid)
    ) {
      this._modelNode.destroy();
    }

    if (cc_1.assetManager.assets.has(e)) {
      cc_1.assetManager.releaseAsset(cc_1.assetManager.assets.get(e));
    }

    var t = await promisify(cc_1.assetManager.loadAny)(e);
    if (t.joints.length !== t.bindposes.length) {
      console.error("joints number not equal to bindposes number");
      return null;
    }

    if (
      this._modelNode &&
      (this.scene.removeChild(this._modelNode), this._modelNode.isValid)
    ) {
      this._modelNode.destroy();
    }

    var i = new cc_1.Node("SkeletonRoot");
    i.layer = cc_1.Layers.Enum.DEFAULT;
    this._jointMap = {};
    for (let e = 0; e < t.joints.length; e++) {
      var o = t.joints[e];
      var s = t.inverseBindposes[e];
      var n = new JointData();
      cc_1.Vec3.transformMat4(n.position, n.position, s);
      this._jointMap[o] = n;
    }
    for (let e = 0; e < t.joints.length; e++) {
      var r = t.joints[e];
      var a = r.lastIndexOf("/");

      if (
        a > 0 &&
        ((a = r.substring(0, a)),
        (a = this._jointMap[a]),
        (r = this._jointMap[r]),
        a)
      ) {
        a.childJoint.push(r);

        r = controller_utils_1.default.octahedron(
          r.position,
          a.position,
          0.15,
          0.15,
          0.8,
          cc_1.Color.GRAY,
          { effectName: "builtin-standard" }
        );

        r.parent = i;
        r.layer = cc_1.Layers.Enum.DEFAULT;
      }
    }
    i.parent = this.scene;
    this._modelNode = i;
    this.cameraComp.enabled = true;
    this.resetCamera();

    this.perfectCameraView(
      node_1.default.getBoundaryOfMeshNodes([this._modelNode])
    );

    return { jointCount: t.joints.length };
  }
  setLightEnable(e) {
    if (this.lightComp.enabled !== e) {
      this.lightComp.enabled = e;
    }
  }
  resetCamera() {
    if (this._modelNode) {
      super.resetCamera(this._modelNode);
    }
  }
}
exports.SkeletonPreview = SkeletonPreview;
