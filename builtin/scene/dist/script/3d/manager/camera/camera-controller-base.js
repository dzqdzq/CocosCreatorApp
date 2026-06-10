Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const events_1 = require("events");
const utils_1 = require("./utils");
class CameraControllerBase extends events_1.EventEmitter {
  _camera;
  camera_move_mode = utils_1.CameraMoveMode.IDLE;
  _gridMeshComp;
  _originAxisHorizontalMeshComp;
  _originAxisVerticalMeshComp;
  node;
  _isGridVisible = true;
  originAxisX_Visible = false;
  originAxisY_Visible = false;
  originAxisZ_Visible = false;
  originAxisX_Color = cc_1.Color.RED.clone();
  originAxisY_Color = cc_1.Color.GREEN.clone();
  originAxisZ_Color = cc_1.Color.BLUE.clone();
  _near = 0.1;
  _far = 10000 /* 1e4 */;
  _wheelSpeed = 6;
  _wheelBaseScale = 1 / 12;
  get near() {
    return this._near;
  }
  set near(e) {
    this._near = e;
  }
  get far() {
    return this._far;
  }
  set far(e) {
    this._far = e;
  }
  get wheelSpeed() {
    return this._wheelSpeed;
  }
  set wheelSpeed(e) {
    this._wheelSpeed = e;
  }
  init(e) {
    this._camera = e;
    this.node = this._camera.node;
  }
  focus(e, i, o = 0) {}
  alignNodeToSceneView(e) {}
  alignSceneViewToNode(e) {}
  onMouseDBlDown(e) {}
  onMouseDown(e) {}
  onMouseMove(e) {}
  onMouseUp(e) {}
  onMouseWheel(e) {}
  onKeyDown(e) {}
  onKeyUp(e) {}
  onResize(e) {}
  onUpdate(e) {}
  onDesignResolutionChange() {}
  refresh() {}
  updateGrid() {}
  showGrid(e) {
    if ((this._gridMeshComp.node.active = e) && this._isGridVisible) {
      this.updateGrid();
    }
  }
  set isGridVisible(e) {
    this._isGridVisible = e;
    this.showGrid(this._isGridVisible);
  }
  get isGridVisible() {
    return this._isGridVisible;
  }
  rotateCameraToDir(e, i) {}
  changeProjection() {}
  zoomUp() {}
  zoomDown() {}
  zoomReset() {}
}
exports.default = CameraControllerBase;
