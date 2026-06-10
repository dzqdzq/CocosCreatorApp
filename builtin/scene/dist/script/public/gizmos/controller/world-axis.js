var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");

const { v3 } = cc_1;

const base_1 = __importDefault(require("./base"));
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const external_1 = __importDefault(require("../utils/external"));
const misc_1 = __importDefault(require("../utils/misc"));
const engine_1 = __importDefault(require("../utils/engine"));
const selection_1 = __importDefault(require("../../../3d/manager/selection"));
const { setNodeOpacity, setMaterialProperty } = engine_1.default;
const NodeUtils = external_1.default.NodeUtils;
const EditorCamera = external_1.default.EditorCamera;
const axisDirMap = controller_utils_1.default.axisDirectionMap;
const AxisName = controller_utils_1.default.AxisName;
const SceneGizmoLayer = cc_1.Layers.Enum.SCENE_GIZMO;
const ORTHO = cc_1.Camera.ProjectionType.ORTHO;
const PERSPECTIVE = cc_1.Camera.ProjectionType.PERSPECTIVE;
const camera_forward = new cc_1.Vec3(0, 0, -1);
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
class WorldAxisController extends base_1.default {
  _defaultSize = 2;
  _sceneGizmoCamera;
  _cameraOffset = new cc_1.Vec3(0, 0, 40);
  _viewDist = 40;
  _textNodeMap = new Map();
  constructor(e, t) {
    super(e);
    this._sceneGizmoCamera = t;
    this.initShape();
  }
  createAxis(e, t, a) {
    t = controller_utils_1.default.arrow(5, 2, 6, t, {
      forwardPipeline: true,
      bodyBBSize: 0,
    });
    t.name = e + "Axis";

    t.children.forEach((e) => {
      e.layer = SceneGizmoLayer;
    });

    t.name = e + "Axis";
    t.parent = this.shape;
    NodeUtils.setEulerAngles(t, a);
    this.initHandle(t, e);
  }
  initShape() {
    this.createShapeNode("WorldAxisController");
    this.createAxis("x", cc_1.Color.RED, v3(0, 0, -90));
    this.createAxis("y", cc_1.Color.GREEN, v3());
    this.createAxis("z", cc_1.Color.BLUE, v3(90, 0, 0));
    var e = new cc_1.Color(230, 230, 230);

    var e =
      (this.createAxis("neg_x", e, v3(0, 0, 90)),
      this.createAxis("neg_y", e, v3(0, 0, 180)),
      this.createAxis("neg_z", e, v3(-90, 0, 0)),
      controller_utils_1.default.cube(5, 5, 5, e, undefined, {
        forwardPipeline: true,
      }));

    e.name = "Center";
    e.parent = this.shape;
    e.layer = SceneGizmoLayer;
    this.initHandle(e, "center");

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
    this.hide();
  }
  setTexture(e, t) {
    setMaterialProperty(e, "mainTexture", t);
  }
  setTextureByUUID(a, e) {
    cc_1.assetManager.loadAny(e, (e, t) => {
      if (t) {
        this.setTexture(a, t);
        cce.Engine.repaintInEditMode();
      }
    });
  }
  createAxisText(e, t, a) {
    var r = this._handleDataMap[e];

    var a = controller_utils_1.default.quad(
      cc_1.Vec3.ZERO,
      3,
      3,
      cc_1.Vec3.UNIT_Z,
      a,
      { texture: true, needBoundingBox: false }
    );

    this.setTextureByUUID(a, t);
    a.setPosition(0, 12, 0);
    a.parent = r.topNode;
    a.layer = SceneGizmoLayer;
    this._textNodeMap.set(e, a);
  }
  onMouseUp(e) {
    e.propagationStopped = true;

    if (e.handleName === "center") {
      EditorCamera.changeProjection();
    } else {
      e = axisDirMap[e.handleName];
      const t = selection_1.default.query();

      if (!t.length) {
        EditorCamera.controller3D.lastFocusNodeUUID = [];
      }

      EditorCamera.rotateCameraToDir(
        e,
        Boolean(
          EditorCamera.controller3D.lastFocusNodeUUID.length &&
            EditorCamera.controller3D.lastFocusNodeUUID.every((e) =>
              t.includes(e)
            )
        )
      );
    }
  }
  onHoverIn(e) {
    if (e.node && e.node.name === "Center") {
      e.propagationStopped = true;
    }

    this.setHandleColor(e.handleName, cc_1.Color.YELLOW);
  }
  onHoverOut(e) {
    this.resetHandleColor(e);
  }
  onEditorCameraMoved() {
    const t = tempQuat_a;
    EditorCamera.camera.node.getWorldRotation(t);

    this._textNodeMap.forEach((e) => {
      e?.setWorldRotation(t);
    });

    cc_1.Vec3.transformQuat(tempVec3_a, camera_forward, t);

    Object.keys(this._handleDataMap).forEach((e) => {
      const a = this._handleDataMap[e];
      e = axisDirMap[e];
      if (e) {
        const r =
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
            if (r < 10) {
              e.active = false;
            } else {
              e.active = true;
              setNodeOpacity(e, r);
              a.oriOpacities[t] = r;
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
  onCameraProjectionChanged(e) {
    if ((this._sceneGizmoCamera.projection = e) === PERSPECTIVE) {
      this._sceneGizmoCamera.node.getWorldRotation(tempQuat_a);
      cc_1.Vec3.transformQuat(tempVec3_a, cc_1.Vec3.UNIT_Z, tempQuat_a);
      cc_1.Vec3.normalize(tempVec3_a, tempVec3_a);
      cc_1.Vec3.multiplyScalar(tempVec3_a, tempVec3_a, this._viewDist);
      cc_1.Vec3.add(tempVec3_a, this.getPosition(), tempVec3_a);
      this._sceneGizmoCamera.node.setWorldPosition(tempVec3_a);
    } else {
      e = this._sceneGizmoCamera.fov;
      e = Math.tan(((e / 2) * Math.PI) / 180) * this._viewDist;
      this._sceneGizmoCamera.orthoHeight = e;
    }
  }
}
exports.default = WorldAxisController;
