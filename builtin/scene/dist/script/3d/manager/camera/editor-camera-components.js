Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");

const CAMERA_EDITOR_GIZMO_MASK =
  cc_1.Layers.Enum.GIZMOS | cc_1.Layers.Enum.IGNORE_RAYCAST;

class EditorCameraComponent extends cc_1.Camera {
  _uiEditorGizmoCamera = null;
  set projection(e) {
    super.projection = e;

    if (this._uiEditorGizmoCamera) {
      this._uiEditorGizmoCamera.projectionType = e;
    }
  }
  get projection() {
    return super.projection;
  }
  set fov(e) {
    super.fov = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.fov = this._camera.fov;
    }
  }
  get fov() {
    return super.fov;
  }
  set orthoHeight(e) {
    super.orthoHeight = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.orthoHeight = this._camera.orthoHeight;
    }
  }
  get orthoHeight() {
    return super.orthoHeight;
  }
  set near(e) {
    super.near = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.nearClip = this._camera.nearClip;
    }
  }
  get near() {
    return super.near;
  }
  set far(e) {
    super.far = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.farClip = this._camera.farClip;
    }
  }
  get far() {
    return super.far;
  }
  set clearColor(e) {
    super.clearColor = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.clearColor = this._camera.clearColor;
    }
  }
  get clearColor() {
    return super.clearColor;
  }
  set clearDepth(e) {
    super.clearDepth = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.clearDepth = this._camera.clearDepth;
    }
  }
  get clearDepth() {
    return super.clearDepth;
  }
  set clearStencil(e) {
    super.clearStencil = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.clearStencil = this._camera.clearStencil;
    }
  }
  get clearStencil() {
    return super.clearStencil;
  }
  set clearFlags(e) {
    super.clearFlags = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.clearFlag = this._camera.clearFlag;
    }
  }
  get clearFlags() {
    return super.clearFlags;
  }
  set rect(e) {
    super.rect = e;

    if (this._uiEditorGizmoCamera) {
      this._uiEditorGizmoCamera.setViewportInOrientedSpace(e);
    }
  }
  get rect() {
    return super.rect;
  }
  set screenScale(e) {
    super.screenScale = e;

    if (this._uiEditorGizmoCamera && this._camera) {
      this._uiEditorGizmoCamera.screenScale = this._camera.screenScale;
    }
  }
  get screenScale() {
    return super.screenScale;
  }
  onLoad() {
    super.onLoad();
    this._inEditorMode = true;
    this.camera?.initGeometryRenderer();
    cce.Engine.getGeometryRenderer().renderer = this.camera.geometryRenderer;
  }
  onEnable() {
    super.onEnable();
    var e = this._getRenderScene();

    if (this._uiEditorGizmoCamera) {
      e.addCamera(this._uiEditorGizmoCamera);
      this._uiEditorGizmoCamera.enabled = true;
    }
  }
  onDisable() {
    super.onDisable();

    if (this._uiEditorGizmoCamera && this._uiEditorGizmoCamera.scene) {
      this._uiEditorGizmoCamera.scene.removeCamera(this._uiEditorGizmoCamera);
    }
  }
  onDestroy() {
    super.onDestroy();

    if (this._uiEditorGizmoCamera) {
      this._uiEditorGizmoCamera.detachCamera();
      this._uiEditorGizmoCamera = null;
    }
  }
  _createCamera() {
    var e = this._camera;
    super._createCamera();

    if (
      this._camera !== e &&
      this._camera &&
      ((this._camera.cameraUsage = cc_1.renderer.scene.CameraUsage.SCENE_VIEW),
      this._uiEditorGizmoCamera &&
        (this._uiEditorGizmoCamera.detachCamera(),
        (this._uiEditorGizmoCamera = null)),
      (this._uiEditorGizmoCamera = cc.director.root.createCamera()),
      this._uiEditorGizmoCamera)
    ) {
      this._uiEditorGizmoCamera.initialize({
        name: "Editor UIGizmoCamera",
        node: this._camera.node,
        projection: this.projection,
        window: cc.director.root.mainWindow,
        priority: this._priority + 2,
        usage: cc_1.renderer.scene.CameraUsage.EDITOR,
      });

      this._uiEditorGizmoCamera.enabled = true;
      this._uiEditorGizmoCamera.visibility = CAMERA_EDITOR_GIZMO_MASK;

      this._uiEditorGizmoCamera.setViewportInOrientedSpace(
        this._camera.viewport
      );

      this._uiEditorGizmoCamera.fov = this._camera.fov;
      this._uiEditorGizmoCamera.nearClip = this._camera.nearClip;
      this._uiEditorGizmoCamera.farClip = this._camera.farClip;
      e = this._camera.clearColor;

      this._uiEditorGizmoCamera.clearColor = new cc_1.Color(e.x, e.y, e.z, 0);

      this._uiEditorGizmoCamera.clearDepth = this._camera.clearDepth;
      this._uiEditorGizmoCamera.clearStencil = this._camera.clearStencil;
      this._uiEditorGizmoCamera.clearFlag = cc_1.gfx.ClearFlagBit.NONE;
    }
  }
}
exports.default = EditorCameraComponent;
