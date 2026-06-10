var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");

const { instantiate, color } = cc_1;

const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const box_1 = __importDefault(require("../../controller/box"));
const NodeUtils = external_1.default.NodeUtils;
const tempVec3_a = new cc_1.Vec3();
const PLANE = "40563723-f8fc-4216-99ea-a81636435c10";
const SPHERE = "655c9519-1a37-472b-bae6-29fefac0b550";
class ReflectionProbeGizmo extends base_1.SelectGizmo {
  _controller;
  static SPHERE_NODE_NAME = "Reflection Probe Sphere";
  static PLANE_NODE_NAME = "Reflection Probe Plane";
  static _PLANE_PREFAB;
  static _SPHERE_PREFAB;
  _bbHalfSize = new cc_1.Vec3();
  _sphereMeshRenderer = null;
  _planeMeshRenderer = null;
  _sphere = null;
  _plane = null;
  _loadModelState = "idle";
  onBBControllerMouseDown(e) {
    if (
      this._isInitialized &&
      this.target != null &&
      this.target instanceof cc_1.ReflectionProbe
    ) {
      this._bbHalfSize.set(this.target.size);
    }
  }
  onBBControllerMouseMove(e) {
    var t;
    var r;

    if (
      this.target instanceof cc_1.ReflectionProbe &&
      this._controller?.updated &&
      this.target
    ) {
      this.recordChanges();
      t = this.target.node;
      r = this._controller.getDeltaSize();
      cc_1.Vec3.add(tempVec3_a, this._bbHalfSize, r);

      this.target.size.set(
        tempVec3_a.x > 0 ? tempVec3_a.x : 0,
        tempVec3_a.y > 0 ? tempVec3_a.y : 0,
        tempVec3_a.z > 0 ? tempVec3_a.z : 0
      );

      this.onComponentChanged(t);
    }
  }
  onBBControllerMouseUp(e) {
    this.commitChanges();
  }
  init() {
    this.createController();
  }
  onShow() {
    if (this._isInitialized) {
      if (
        this._sphere &&
        this._sphereMeshRenderer &&
        this._plane &&
        this._planeMeshRenderer
      ) {
        this.updateControllerTransform();
        this._controller.show();

        this.target instanceof cc_1.ReflectionProbe &&
          (this._sphere && (this.target.previewSphere = this._sphere),
          this._plane) &&
          (this.target.previewPlane = this._plane);
      } else {
        this.loadModel();
      }
    }
  }
  generateMaterial(e) {
    var t = new cc_1.Material();
    t.initialize(e ?? { effectName: "builtin-standard" });
    return t;
  }
  onHide() {
    this._controller.hide();

    if (this._sphere) {
      this._sphere.active = false;
    }

    if (this._plane) {
      this._plane.active = false;
    }

    if (this.target instanceof cc_1.ReflectionProbe) {
      this.target.previewSphere = null;
    }
  }
  createController() {
    var e = this.getGizmoRoot();
    this._controller = new box_1.default(e);
    this._controller.setColor(cc_1.Color.GREEN);
    this._controller.editable = true;
    this._controller.edit = true;
    this._controller.onControllerMouseDown =
      this.onBBControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onBBControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp =
      this.onBBControllerMouseUp.bind(this);
    this.onHide();
    this.loadModel();
  }
  loadModel() {
    if (this._loadModelState !== "loading") {
      this._loadModelState = "loading";

      Promise.all([this.loadPlane(), this.loadSphere()])
        .then(([e, t]) => {
          var r = this.getGizmoRoot();
          this._plane = instantiate(e);
          this._plane.layer =
            cc_1.Layers.Enum.IGNORE_RAYCAST | cc_1.Layers.Enum.GIZMOS;
          this._plane.name = ReflectionProbeGizmo.PLANE_NODE_NAME;

          this._planeMeshRenderer = this._plane.getComponent(cc_1.MeshRenderer);

          if (this._planeMeshRenderer) {
            this._planeMeshRenderer.material = this.generateMaterial({
              effectName: "builtin-standard",
              technique: 1,
            });

            this._planeMeshRenderer.material.setProperty(
              "albedo",
              color(255, 255, 255, 145)
            );

            this._planeMeshRenderer.material.setProperty("metallic", 1);
            this._planeMeshRenderer.material.setProperty("roughness", 0);
            this._planeMeshRenderer.bakeSettings.reflectionProbe =
              cc_1.ReflectionProbeType.PLANAR_REFLECTION;
          }

          this._plane.active = false;
          this._plane.parent = r;
          this._sphere = instantiate(t);
          this._sphere.layer =
            cc_1.Layers.Enum.IGNORE_RAYCAST | cc_1.Layers.Enum.GIZMOS;
          this._sphere.name = ReflectionProbeGizmo.SPHERE_NODE_NAME;

          this._sphereMeshRenderer = this._sphere.getComponent(
            cc_1.MeshRenderer
          );

          if (this._sphereMeshRenderer) {
            this._sphereMeshRenderer.material = this.generateMaterial({
              effectName: "builtin-reflection-probe-preview",
              technique: 0,
            });

            this._sphereMeshRenderer.bakeSettings.reflectionProbe =
              cc_1.ReflectionProbeType.BAKED_CUBEMAP;
            this._sphereMeshRenderer.bakeSettings.bakeToReflectionProbe = false;
          }

          this._sphere.parent = r;
          this._loadModelState = "completed";
          this.onShow();
          cce.Engine.repaintInEditMode();
        })
        .catch((e) => {
          console.error(e);
          this._loadModelState = "idle";
        });
    }
  }
  loadSphere() {
    return new Promise((r, i) => {
      if (ReflectionProbeGizmo._SPHERE_PREFAB) {
        r(ReflectionProbeGizmo._SPHERE_PREFAB);
      } else {
        cc_1.assetManager.loadAny(SPHERE, (e, t) => {
          if (e) {
            i(e);
          } else if (t instanceof cc_1.Prefab) {
            ReflectionProbeGizmo._SPHERE_PREFAB = t;
            r(t);
          } else {
            i(
              new Error("Invalid data type loaded for sphere. uuid: " + SPHERE)
            );
          }
        });
      }
    });
  }
  loadPlane() {
    return new Promise((r, i) => {
      if (ReflectionProbeGizmo._PLANE_PREFAB) {
        r(ReflectionProbeGizmo._PLANE_PREFAB);
      } else {
        cc_1.assetManager.loadAny(PLANE, (e, t) => {
          if (e) {
            i(e);
          } else if (t instanceof cc_1.Prefab) {
            ReflectionProbeGizmo._PLANE_PREFAB = t;
            r(t);
          } else {
            i(new Error("Invalid data type loaded for plane. uuid: " + PLANE));
          }
        });
      }
    });
  }
  updateControllerTransform() {
    this.updateControllerData();
  }
  updateControllerData() {
    var e;
    var t;
    var r;

    if (
      this._isInitialized &&
      this.target != null &&
      this.target instanceof cc_1.ReflectionProbe &&
      ((t = this.target.node),
      (e = NodeUtils.getWorldPosition3D(t)),
      (t = NodeUtils.getWorldRotation(t)),
      (r = this.target.probeType === cc_1.renderer.scene.ProbeType.CUBE),
      this._controller.setScale(cc_1.Vec3.ONE),
      this._controller.updateSize(
        cc_1.Vec3.ZERO,
        cc_1.Vec3.multiplyScalar(tempVec3_a, this.target.size, 2)
      ),
      this._controller.setRotation(r ? cc_1.Quat.IDENTITY : t),
      this._controller?.setPosition(e),
      this._sphere &&
        this._sphereMeshRenderer &&
        (r
          ? ((this._sphere.active = true), this._sphere.setWorldPosition(e))
          : (this._sphere.active = false)),
      this._plane) &&
      this._planeMeshRenderer
    ) {
      if (r) {
        this._plane.active = false;
      } else {
        this._plane.active = true;
        this._plane.setWorldPosition(e);
        this._plane.setRotation(t);

        this._plane.setScale(
          this.target.size.x / 5,
          this.target.size.y / 5,
          this.target.size.z / 5
        );
      }
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = ReflectionProbeGizmo;
