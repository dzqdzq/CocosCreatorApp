var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainEditor = undefined;
const terrain_editor_manage_1 = require("./terrain-editor-manage");
const terrain_editor_mode_1 = require("./terrain-editor-mode");
const terrain_editor_paint_1 = require("./terrain-editor-paint");
const terrain_editor_sculpt_1 = require("./terrain-editor-sculpt");
const terrain_editor_select_1 = require("./terrain-editor-select");
const cc_1 = require("cc");
const controller_utils_1 = __importDefault(
  require("../../utils/controller-utils")
);
const external_1 = __importDefault(require("../../utils/external"));
const terrain_brush_1 = require("./terrain-brush");
const EditorCamera = external_1.default.EditorCamera;
const tempVec3_1 = new cc_1.Vec3();
const tempVec3_2 = new cc_1.Vec3();
const tempVec3_3 = new cc_1.Vec3();
class TerrainEditor {
  _terrain = null;
  _modes;
  _currentMode = null;
  _cameraComp = null;
  isChanged = false;
  _gizmo;
  constructor(e, r) {
    this._modes = [
      new terrain_editor_manage_1.TerrainEditorManage(r),
      new terrain_editor_sculpt_1.TerrainEditorSculpt(r),
      new terrain_editor_paint_1.TerrainEditorPaint(r),
      new terrain_editor_select_1.TerrainEditorSelect(r),
    ];

    this._cameraComp = e;
    this._gizmo = r;
    this.setMode(terrain_editor_mode_1.eTerrainEditorMode.MANAGE);
  }
  setEditTerrain(e) {
    this._terrain = e;
  }
  getEditTerrain() {
    return this._terrain;
  }
  setMode(e) {
    e = this._modes[e];

    if (this._currentMode != null) {
      this._currentMode.onDeactivate();
    }

    this._currentMode = e;

    if (this._currentMode != null) {
      this._currentMode.onActivate();
    }

    this.clearBrush();
  }
  clearBrush() {
    if (this._terrain != null) {
      for (const e of this._terrain.getBlocks()) {
        e.setBrushMaterial(null);
      }
    }
    this._currentMode?.onDeactivate();
  }
  getMode(e) {
    return this._modes[e];
  }
  getCurrentMode() {
    return this._currentMode;
  }
  getCurrentModeType() {
    switch (this._currentMode) {
      case this._modes[0]:
        return terrain_editor_mode_1.eTerrainEditorMode.MANAGE;
      case this._modes[1]:
        return terrain_editor_mode_1.eTerrainEditorMode.SCULPT;
      case this._modes[2]:
        return terrain_editor_mode_1.eTerrainEditorMode.PAINT;
      case this._modes[3]:
        return terrain_editor_mode_1.eTerrainEditorMode.SELECT;
      default:
        return terrain_editor_mode_1.eTerrainEditorMode.SCULPT;
    }
  }
  setCurrentLayer(e) {
    this.getMode(
      terrain_editor_mode_1.eTerrainEditorMode.PAINT
    ).setCurrentLayer(e);
  }
  getCurrentLayer() {
    return this.getMode(
      terrain_editor_mode_1.eTerrainEditorMode.PAINT
    ).getCurrentLayer();
  }
  update(e, r) {
    if (this._currentMode != null && this._terrain != null) {
      this._currentMode.onUpdate(this._terrain, e, r);
      cce.Engine.repaintInEditMode();
    }
  }
  onMouseDown(e, r) {
    var t;
    var i;
    var o;

    if (this._terrain != null) {
      this.isChanged = false;
      t = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.SCULPT);
      i = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.PAINT);
      o = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.SELECT);

      this._currentMode === t
        ? (t.onMouseDown(this._terrain), (this.isChanged = true))
        : this._currentMode === i
        ? (i.onMouseDown(this._terrain), (this.isChanged = true))
        : this._currentMode === o &&
          this._cameraComp != null &&
          o.onMouseDown(this._terrain, this._cameraComp, e, r);

      cce.Engine.repaintInEditMode();
    }
  }
  onMouseUp() {
    var e;
    var r;

    if (this._terrain != null) {
      e = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.SCULPT);
      r = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.PAINT);

      this._currentMode === e
        ? e.onMouseUp()
        : this._currentMode === r && r.onMouseUp();

      this.isChanged = false;
      cce.Engine.repaintInEditMode();
    }
  }
  onMouseMove(e, r) {
    var t;
    var i;
    var o;

    if (
      this._terrain != null &&
      this._cameraComp != null &&
      null != (o = this._cameraComp) &&
      ((t = o.node.getPosition()),
      (i = tempVec3_1),
      tempVec3_2.set(e, r, 0),
      o.screenToWorld(tempVec3_2, i),
      cc_1.Vec3.subtract(tempVec3_3, i, t),
      cc_1.Vec3.normalize(tempVec3_3, tempVec3_3),
      null != (e = this._terrain.rayCheck(t, tempVec3_3, 0.35, true)))
    ) {
      r = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.SCULPT);
      o = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.PAINT);

      this._currentMode === r
        ? (r.onUpdateBrushPosition(this._terrain, e), (this.isChanged = true))
        : this._currentMode === o &&
          (o.onUpdateBrushPosition(this._terrain, e), (this.isChanged = true));

      cce.Engine.repaintInEditMode();
    }
  }
  onHoverOut() {
    var e = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.SELECT);

    if (this._currentMode !== e) {
      this.clearBrush();
      cce.Engine.repaintInEditMode();
    }
  }
  updateBlockDepthOffset() {
    var e = this._gizmo?.target?.node;

    if (
      e &&
      (terrain_brush_1.TerrainBrush.updateBrushDepthOffset(
        controller_utils_1.default.getCameraDistanceFactor(
          e.position,
          EditorCamera.camera.node
        )
      ),
      (e = this.getMode(terrain_editor_mode_1.eTerrainEditorMode.SELECT)),
      this._currentMode === e)
    ) {
      e.forceUpdate();
      cce.Engine.repaintInEditMode();
    }
  }
}
exports.TerrainEditor = TerrainEditor;
