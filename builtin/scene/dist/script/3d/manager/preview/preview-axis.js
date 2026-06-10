var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewWorldAxis = undefined;

const external_1 = __importDefault(
  require("../../../public/gizmos/utils/external")
);

const cc_1 = require("cc");

const index_1 = __importDefault(
  require("../../../public/gizmos/utils/engine/index")
);

const controller_utils_1 = __importDefault(
  require("../../../public/gizmos/utils/controller-utils")
);

const controller_shape_1 = __importDefault(
  require("../../../public/gizmos/utils/controller-shape")
);

const base_1 = __importDefault(
  require("../../../public/gizmos/controller/base")
);
const misc_1 = __importDefault(require("../../../public/gizmos/utils/misc"));
const NodeUtils = external_1.default.NodeUtils;
const axisDirMap = controller_utils_1.default.axisDirectionMap;
const AxisName = controller_utils_1.default.AxisName;

const { setNodeOpacity, setMaterialProperty, create3DNode, setMeshColor } =
  index_1.default;

const camera_forward = new cc_1.Vec3(0, 0, -1);
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
class PreviewWorldAxis extends base_1.default {
  _sceneGizmoCamera;
  _cameraOffset = new cc_1.Vec3(0, 0, 40);
  _textNodeMap = new Map();
  synchronizeCamera;
  constructor(e, t) {
    super(e);

    this._sceneGizmoCamera = new cc_1.Node("axis-camera").addComponent(
      cc_1.Camera
    );

    this._sceneGizmoCamera.node.parent = e;
    this._sceneGizmoCamera.camera.visibility = cc_1.Layers.Enum.SCENE_GIZMO;
    this._sceneGizmoCamera.camera.clearFlag =
      cc_1.gfx.ClearFlagBit.DEPTH_STENCIL;
    this._sceneGizmoCamera.clearColor = t.clearColor;
    var e = cc.director.root.curWindow.width;
    var a = cc.director.root.curWindow.height;
    var i = a / 3 / a;
    var e = ((e - a) * i) / 2 / e;
    var a = (30 * window.devicePixelRatio) / a;
    this._sceneGizmoCamera.rect = new cc_1.Rect(1 - i + e, 1 - i - a, i, i);
    this.synchronizeCamera = t;
    this.initShape();
  }
  initShape() {
    this.createShapeNode("PreviewWorldAxis");
    this.createAxis("x", cc.Color.RED, cc.v3(0, 0, -90));
    this.createAxis("y", cc.Color.GREEN, cc.v3());
    this.createAxis("z", cc.Color.BLUE, cc.v3(90, 0, 0));

    this.createAxisText(
      AxisName.x,
      "ac74fa2b-1f5b-4ff5-a3f0-f127f4483e91@6c48a",
      cc_1.Color.RED
    );

    this.createAxisText(
      AxisName.y,
      "7b5313d0-f1aa-4b1b-a3c8-59d523c35301@6c48a",
      cc_1.Color.GREEN
    );

    this.createAxisText(
      AxisName.z,
      "389d5fee-e29c-4221-b397-a4934a0a5694@6c48a",
      cc_1.Color.BLUE
    );

    this.registerCameraMovedEvent();
  }
  _hide = false;
  hide() {
    if (this.shape) {
      this.shape.active = false;
    }

    this._hide = true;
    this._sceneGizmoCamera.enabled = false;
  }
  show() {
    if (this.shape) {
      this.shape.active = true;
    }

    this._hide = false;
    this._sceneGizmoCamera.enabled = true;
  }
  createShapeNode(e) {
    e = create3DNode(e);
    e.parent = this._rootNode;
    this.shape = e;
  }
  createAxis(e, t, a) {
    var i = new cc_1.Node();

    var c = controller_shape_1.default.calcLineData(
      new cc_1.Vec3(0, 0, 0),
      new cc_1.Vec3(0, 6, 0)
    );

    var r = { noDepthTestForLines: true };

    Object.assign(r, { forwardPipeline: true, bodyBBSize: 0 });
    var c = controller_utils_1.default.createShapeByData(c, t, r);

    c.name = "ArrowLine";
    c.parent = i;
    setMeshColor(c, t);
    i.name = e + "Axis";

    i.children.forEach((e) => {
      e.layer = cc.Layers.Enum.SCENE_GIZMO;
    });

    i.parent = this.shape;
    NodeUtils.setEulerAngles(i, a);
    this.initHandle(i, e);
  }
  createAxisText(e, t, a) {
    var i = this._handleDataMap[e];

    var a = controller_utils_1.default.quad(
      cc_1.Vec3.ZERO,
      3,
      3,
      cc_1.Vec3.UNIT_Z,
      a,
      { texture: true, needBoundingBox: false }
    );

    this.setTextureByUUID(a, t);
    a.setPosition(0, 9, 0);
    a.parent = i.topNode;
    a.layer = cc.Layers.Enum.SCENE_GIZMO;
    this._textNodeMap.set(e, a);
  }
  setTextureByUUID(a, e) {
    cc_1.assetManager.loadAny(e, (e, t) => {
      if (t) {
        setMaterialProperty(a, "mainTexture", t);
        cce.Engine.repaintInEditMode();
      }
    });
  }
  registerCameraMovedEvent() {
    this.synchronizeCamera.node.on(
      "transform-changed",
      this.onEditorCameraMoved,
      this
    );
  }
  onEditorCameraMoved() {
    if (!this._hide) {
      const t = tempQuat_a;
      this.adjustControllerSize();
      this.synchronizeCamera.camera.node.getWorldRotation(t);

      this._textNodeMap.forEach((e) => {
        e?.setWorldRotation(t);
      });

      cc_1.Vec3.transformQuat(tempVec3_a, camera_forward, t);

      Object.keys(this._handleDataMap).forEach((e) => {
        const a = this._handleDataMap[e];
        e = axisDirMap[e];
        if (e) {
          const i =
            255 *
            misc_1.default.LimitLerp(
              1,
              0,
              Math.abs(cc_1.Vec3.dot(tempVec3_a, e)),
              0.9,
              1
            );
          e = a.rendererNodes;

          if (e) {
            e.forEach((e, t) => {
              if (i < 10) {
                e.active = false;
              } else {
                e.active = true;
                setNodeOpacity(e, i);
                a.oriOpacities[t] = i;
              }
            });
          }
        }
      });

      var e = this._sceneGizmoCamera.node;
      cc_1.Vec3.transformQuat(tempVec3_b, this._cameraOffset, t);
      cc_1.Vec3.add(tempVec3_b, this.getPosition(), tempVec3_b);
      e.setWorldPosition(tempVec3_b);
      cc_1.Vec3.transformQuat(tempVec3_b, cc_1.Vec3.UNIT_Y, t);
      cc_1.Vec3.normalize(tempVec3_b, tempVec3_b);
      e.lookAt(this.getPosition(), tempVec3_b);
    }
  }
}
exports.PreviewWorldAxis = PreviewWorldAxis;
