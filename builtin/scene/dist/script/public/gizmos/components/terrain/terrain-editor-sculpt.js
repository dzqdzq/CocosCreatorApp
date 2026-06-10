Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainEditorSculpt = undefined;
const cc_1 = require("cc");
const terrain_brush_1 = require("./terrain-brush");
const terrain_editor_mode_1 = require("./terrain-editor-mode");
const terrain_editor_sculpt_tools_1 = require("./terrain-editor-sculpt-tools");
const terrain_operation_1 = require("./terrain-operation");
const clamp = cc_1.math.clamp;
class TerrainEditorSculpt extends terrain_editor_mode_1.TerrainEditorMode {
  _brushes;
  _undo = null;
  _currentBrush;
  _currentTool = null;
  constructor(r) {
    super(r);
    var r = new terrain_brush_1.TerrainCircleBrush();
    r.strength = 5;
    var t = new terrain_brush_1.TerrainImageBrush();
    t.strength = 5;
    this._brushes = [r, t];
    this._currentBrush = this._brushes[0];
  }
  setCurrentBrush(r) {
    var t = this._currentBrush.position;
    var e = this._currentBrush.radius;
    var i = this._currentBrush.strength;
    var o = this._currentBrush._setHeight;
    this._currentBrush = this._brushes[r];
    this._currentBrush.position = t;
    this._currentBrush.radius = e;
    this._currentBrush.strength = i;
    this._currentBrush._setHeight = o;
  }
  getCurrentBrush() {
    return this._currentBrush;
  }
  getBrush(r) {
    return this._brushes[r];
  }
  setBrushImage(r) {
    if (
      null !== (this.getBrush(terrain_brush_1.TerrainBrushType.IMAGE).image = r)
    ) {
      this.setCurrentBrush(terrain_brush_1.TerrainBrushType.IMAGE);
    } else {
      this.setCurrentBrush(terrain_brush_1.TerrainBrushType.CIRCLE);
    }
  }
  setSculptBrushRotation(r) {
    this.getBrush(terrain_brush_1.TerrainBrushType.IMAGE)._rotation = r;
  }
  onUpdate(r, t, e) {
    var i;

    if (this._currentTool != null) {
      i = new terrain_brush_1.TerrainEdModifierKeyState();
      i.siftPressed = e;
      this._updateHeight(r, t, i);
      r.isTerrainChange = true;
    }
  }
  forceUpdate() {
    terrain_brush_1.TerrainBrush.updateBrushDepthOffsetToMaterial(
      this._currentBrush.material
    );
  }
  onUpdateBrushPosition(r, t) {
    var e = this._currentBrush;
    e.update(r, t);
    for (const u of r.getBlocks()) {
      var i = u.getIndex();
      var o = new cc_1.Rect();

      var i =
        ((o.x = i[0] * cc_1.TERRAIN_BLOCK_TILE_COMPLEXITY * r.info.tileSize),
        (o.y = i[1] * cc_1.TERRAIN_BLOCK_TILE_COMPLEXITY * r.info.tileSize),
        (o.width = cc_1.TERRAIN_BLOCK_TILE_COMPLEXITY * r.info.tileSize),
        (o.height = cc_1.TERRAIN_BLOCK_TILE_COMPLEXITY * r.info.tileSize),
        new cc_1.Vec2());

      var n = new cc_1.Vec2();
      e.getBound(i, n);
      var s = new cc_1.Rect();
      s.x = i.x;
      s.y = i.y;
      s.width = n.x - i.x;
      s.height = n.y - i.y;

      if (o.intersects(s)) {
        u.setBrushMaterial(e.material);
      } else {
        u.setBrushMaterial(null);
      }
    }
  }
  onMouseDown(r) {
    this._undo = new terrain_operation_1.TerrainHeightUndoRedo(
      this.gizmo._target
    );
    let t =
      terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode.SCULPT;

    if (this.gizmo.isSmooth) {
      t =
        terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode
          .SMOOTH;
    } else if (this.gizmo.isFlatten) {
      t =
        terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode
          .FLATTEN;
    } else if (this.gizmo.isSetHeight) {
      t =
        terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode
          .SET_HEIGHT;
    }

    switch (t) {
      case terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode
        .SCULPT:
        this._currentTool =
          new terrain_editor_sculpt_tools_1.TerrainEditorSculptTool_Sculpt(
            this.gizmo.isConcave
          );

        break;
      case terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode
        .SMOOTH:
        this._currentTool =
          new terrain_editor_sculpt_tools_1.TerrainEditorSculptTool_Smooth();
        break;
      case terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode
        .FLATTEN:
        this._currentTool =
          new terrain_editor_sculpt_tools_1.TerrainEditorSculptTool_Flatten();
        break;
      case terrain_editor_sculpt_tools_1.eTerrainTerrainEditorSculptToolMode
        .SET_HEIGHT:
        this._currentTool =
          new terrain_editor_sculpt_tools_1.TerrainEditorSculptTool_SetHeight(
            this._currentBrush._setHeight
          );

        break;
      default:
        this._currentTool =
          new terrain_editor_sculpt_tools_1.TerrainEditorSculptTool();
        break;
    }

    var e = this._currentBrush;
    var i = e.position.x;
    var e = e.position.z;
    i /= r.info.tileSize;
    e /= r.info.tileSize;
    i = Math.floor(i);
    e = Math.floor(e);
    this._currentTool?.start(r, i, e);
  }
  onMouseUp() {
    if (this._undo) {
      cce.SceneFacadeManager.beginRecording("", {
        customCommand: this._undo,
        auto: true,
      });
    }

    this._undo = null;
    this._currentTool = null;
  }
  _updateHeight(e, i, o) {
    var n = this._currentBrush;
    if (this._currentTool !== null) {
      var r = new cc_1.Vec2();
      var t = new cc_1.Vec2();
      n.getBound(r, t);
      var r_x = r.x;
      var r = r.y;

      var { x, y } = t;

      r_x /= e.info.tileSize;
      r /= e.info.tileSize;
      x /= e.info.tileSize;
      y /= e.info.tileSize;
      r_x = Math.floor(r_x);
      r = Math.floor(r);
      x = Math.floor(x);
      y = Math.floor(y);

      if (
        !(
          r_x > e.info.vertexCount[0] - 1 ||
          x < 0 ||
          r > e.info.vertexCount[1] - 1 ||
          y < 0
        )
      ) {
        var r_x = clamp(r_x, 0, e.info.vertexCount[0] - 1);
        var r = clamp(r, 0, e.info.vertexCount[1] - 1);
        var x = clamp(x, 0, e.info.vertexCount[0] - 1);
        var y = clamp(y, 0, e.info.vertexCount[1] - 1);
        var a = new terrain_operation_1.TerrainHeightOperation(e);

        if (this._undo) {
          this._undo.redoOperations.push(a);
        }

        e.gizmo.isSmooth;
        for (let t = r; t <= y; ++t) {
          for (let r = r_x; r <= x; ++r) {
            var h = e.getHeightClamp(r, t);

            if (this._undo != null) {
              this._undo.push(r, t, h);
            }

            var l = r * e.info.tileSize;

            var c = t * e.info.tileSize;
            var l = n.getDelta(l, c) * i;
            var h = this._currentTool.apply(e, r, t, h, l, o);
            a.push(r, t, h);
          }
        }
        a.apply();

        if (e.manager) {
          e.manager.onSculpt(e.node);
        }
      }
    }
  }
}
exports.TerrainEditorSculpt = TerrainEditorSculpt;
