var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var i = Object.getOwnPropertyDescriptor(t, r);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, i);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = i(e), o = 0; o < r.length; o++) {
          if (r[o] !== "default") {
            __createBinding(t, e, r[o]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("../../controller/base"));
const controller_utils_1 = __importDefault(
  require("../../utils/controller-utils")
);
const cc_1 = require("cc");

const { v3 } = cc_1;

const controller_light_probe_1 = __importStar(
  require("./controller-light-probe")
);
const index_1 = __importDefault(require("../../utils/engine/index"));
const { setMeshSHCoefficients, setMeshColor, addMeshToNode } = index_1.default;

const sceneGlobals = () => cc_1.director.getScene()?.globals;

class LightProbeTetrahedronController extends base_1.default {
  gizmo;
  static Count = 0;
  static get Name() {
    return (
      "LightProbeGroupController_" + LightProbeTetrahedronController.Count++
    );
  }
  static ProbeColor = new cc_1.Color("ACEDCF");
  static LineColor = new cc_1.Color("CEF6E2");
  _lockSize = true;
  _isInitialized = false;
  _probeSphere = controller_utils_1.default.create3DNode("ProbeSphere");
  _innerTetrahedron =
    controller_utils_1.default.create3DNode("InnerTetrahedron");
  _probeSphereNodes = [];
  _currentTetrahedronIndex = 0;
  _probeSHData = new Float32Array(cc_1.pipeline.UBOSH.COUNT);
  lightProbeInfo = controller_light_probe_1.lightProbeInfo;
  constructor(e, t) {
    super(e);
    this.gizmo = t;
    this.initShape();
    this.registerCameraMovedEvent();
  }
  initShape() {
    this.createShapeNode(LightProbeTetrahedronController.Name);
    this._probeSphere.parent = this.shape;
    this.initProbeSphere();
    this._innerTetrahedron.parent = this.shape;
    this.clearLayer(this._probeSphere);
    this.clearLayer(this._innerTetrahedron);
    this.hide();
    cce.Engine.repaintInEditMode();

    cc.director.once(cc.Director.EVENT_AFTER_DRAW, () => {
      this.updateController();
    });
  }
  initProbeSphere() {
    var t = new cc_1.Material();

    var r = {
      instancing: false,
      depthTestForTriangles: true,
      effectName: "internal/editor/light-probe-visualization",
      technique: 0,
      useLightProbe: true,
    };

    const o = controller_utils_1.default.sphere(
      v3(0, 0, 0),
      5,
      LightProbeTetrahedronController.ProbeColor,
      r,
      t
    );
    var i = o.getComponent(cc_1.MeshRenderer).mesh;
    this._probeSphereNodes.push(o);
    for (let e = 0; e < 3; e++) {
      const o = controller_utils_1.default.create3DNode();
      addMeshToNode(o, i, r, t);
      setMeshColor(o, LightProbeTetrahedronController.ProbeColor);
      this._probeSphereNodes.push(o);
    }
    for (const [e, o] of this._probeSphereNodes.entries()) {
      o.noNeedCommitChanges = true;
      o.name = "TetrahedronController_ProbeSphere_" + e;
      this.clearLayer(o);
      o.parent = this._probeSphere;
    }
    this.adjustControllerSize();
  }
  show() {
    if (this.gizmo.target?.model?.showTetrahedron()) {
      super.show();
      this.updateLightProbeInfo();
      this.updateController();
    }
  }
  updateController() {
    var e;

    if (this.gizmo.target && this.gizmo.target?.model?.showTetrahedron()) {
      super.updateController();
      this.updateLightProbeInfo();
      0 <= (e = this.getTetrahedronIndex()) && this.updateInnerTetrahedron(e);
      this.adjustControllerSize();
      cce.Engine.repaintInEditMode();
    }
  }
  updateLightProbeInfo() {
    this.lightProbeInfo.update(sceneGlobals()?.lightProbeInfo);
  }
  updateInnerTetrahedron(e) {
    if (!(e < 0)) {
      var t = sceneGlobals()?.lightProbeInfo?.data;
      const r = sceneGlobals()?.lightProbeInfo?.reduceRinging;
      const o = t?.probes ?? [];
      if (o.length !== 0) {
        const i = o.map((e) => e.position);

        const n = o.map((e) => e.coefficients);

        var t = t?.tetrahedrons ?? [];

        if (t.length !== 0 && e <= t.length - 1) {
          e = [(t = t[e]).vertex0, t.vertex1, t.vertex2];
          t.isInnerTetrahedron() && e.push(t.vertex3);
          this._probeSphereNodes[this._probeSphereNodes.length - 1].active =
            t.isInnerTetrahedron();

          e.forEach((e, t) => {
            this._probeSphereNodes[t].setPosition(i[e]);

            if (n[e].length > 0) {
              e = n[e].slice();
              cc_1.SH.reduceRinging(e, r || 0);

              cc_1.SH.updateUBOData(
                this._probeSHData,
                cc_1.pipeline.UBOSH.SH_LINEAR_CONST_R_OFFSET,
                e
              );
            } else {
              for (let e = 0; e < cc_1.pipeline.UBOSH.COUNT; e++) {
                this._probeSHData[e] = 0;
              }
            }

            setMeshSHCoefficients(this._probeSphereNodes[t], this._probeSHData);
          });

          t.isInnerTetrahedron()
            ? controller_utils_1.default.drawLines(
                this._innerTetrahedron,
                e.map((e) => i[e]),
                controller_light_probe_1.default.TetrahedronLines,
                LightProbeTetrahedronController.LineColor
              )
            : t.isOuterCell() &&
              ((t = e.map((e) => v3(o[e].position))).push(
                ...e.map((e) => v3(o[e].position).add(o[e].normal))
              ),
              i.length > 0) &&
              controller_utils_1.default.drawLines(
                this._innerTetrahedron,
                t,
                controller_light_probe_1.default.OuterCellLines,
                LightProbeTetrahedronController.LineColor
              );
        }
      }
    }
  }
  clearLayer(e) {
    e.layer = cc_1.Layers.Enum.IGNORE_RAYCAST;

    e.children.forEach((e) => this.clearLayer(e));
  }
  getProbesData() {}
  getTetrahedronIndex() {
    var e = this.gizmo.target;
    return !e ||
      !(e = e.model) ||
      !e.node.activeInHierarchy ||
      e.tetrahedronIndex < 0
      ? -1
      : e.tetrahedronIndex;
  }
  tempAdjustSizeV3 = new cc_1.Vec3();
  adjustControllerSize() {
    this.updateLightProbeInfo();
    for (const e of this._probeSphereNodes) {
      this.tempAdjustSizeV3.set(
        this.lightProbeInfo.lightProbeSphereVolume,
        this.lightProbeInfo.lightProbeSphereVolume,
        this.lightProbeInfo.lightProbeSphereVolume
      );

      this.tempAdjustSizeV3.multiplyScalar(0.06);
      e.setScale(this.tempAdjustSizeV3);
    }
  }
}
exports.default = LightProbeTetrahedronController;
