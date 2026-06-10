var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const utils_1 = __importDefault(require("../../utils"));
const external_1 = __importDefault(require("../../utils/external"));
const terrain_editor_1 = require("./terrain-editor");
const terrain_editor_mode_1 = require("./terrain-editor-mode");
const terrain_brush_1 = require("./terrain-brush");
const event_enum_1 = require("../../../event-enum");
const base_1 = require("../base");
const EditorCamera = external_1.default.EditorCamera;
const rushModeHistory = {};
class TerrainGizmo extends base_1.SelectGizmo {
  _editor;
  _isEditorInit = false;
  _isShiftDown = false;
  _isConcave = false;
  _isSmooth = false;
  _isFlatten = false;
  _isSetHeight = false;
  get editor() {
    return this._editor;
  }
  init() {
    this._editor = new terrain_editor_1.TerrainEditor(
      EditorCamera.camera,
      this
    );
  }
  get isConcave() {
    return this._isConcave;
  }
  get isSmooth() {
    return this._isSmooth;
  }
  get isFlatten() {
    return this._isFlatten;
  }
  get isSetHeight() {
    return this._isSetHeight;
  }
  applySmooth(e) {
    this._isSmooth = e;
  }
  get isTerrainChange() {
    return this.target.manager && this.target.manager.isTerrainChange;
  }
  set isTerrainChange(e) {
    if (this.target.manager) {
      this.target.manager.isTerrainChange = e;
    }
  }
  onShow() {
    this.registerCameraMovedEvent();
    this.initEditor();
    this._editor.updateBlockDepthOffset();
  }
  onHide() {
    this._isEditorInit = false;
    this.unregisterCameraMoveEvent();
    this._editor.clearBrush();
    this._editor.setEditTerrain(null);
    this._editor.setCurrentLayer(0);
    cce.Engine.repaintInEditMode();
  }
  onEditorCameraMoved() {
    this._editor.updateBlockDepthOffset();
  }
  reportRushModeAndPaintModeUsedCount() {
    var e = Date.now();
    let t;
    t = this._isConcave
      ? "A100002"
      : this._isSmooth
      ? "A100003"
      : this._isFlatten
      ? "A100004"
      : this._isSetHeight
      ? "A100005"
      : "A100001";
    var i = rushModeHistory[t] ?? 0;

    if (!rushModeHistory[t] || 60000 /* 6e4 */ < e - i) {
      this._editor.getCurrentModeType() ==
      terrain_editor_mode_1.eTerrainEditorMode.PAINT
        ? this.target instanceof cc_1.Terrain &&
          this.target.getLayer(this.getCurrentEditLayer()) &&
          Editor.Metrics._trackEventWithTimer({
            category: "terrainSystem",
            id: "A100006",
            value: 1,
          })
        : Editor.Metrics._trackEventWithTimer({
            category: "terrainSystem",
            id: t,
            value: 1,
          });

      rushModeHistory[t] = e;
    }
  }
  initEditor() {
    if (!this._isEditorInit) {
      if (this._editor) {
        this._editor.setEditTerrain(this.target);
        this._isEditorInit = true;
        cce.Engine.repaintInEditMode();
      }
    }
  }
  async addLayerByUuid(e) {
    return this.target
      ? new Promise((i, r) => {
          cc_1.assetManager.loadAny(e, (e, t) => {
            if (e) {
              r(e);
            } else if (t) {
              e = new cc_1.TerrainLayer();
              e.detailMap = t;
              e.tileSize = 1;
              this.isTerrainChange = true;

              this.target
                ? ((t = this.target.addLayer(e)), this.emitNodeChange(), i(t))
                : i(-1);

              cce.Engine.repaintInEditMode();
            }
          });
        })
      : -1;
  }
  async setSculptBrush(e) {
    const n = this._editor.getMode(
      terrain_editor_mode_1.eTerrainEditorMode.SCULPT
    );
    if (e) {
      return new Promise((i, r) => {
        cc_1.assetManager.loadAny(e, (e, t) => {
          if (n.getBrush(terrain_brush_1.TerrainBrushType.IMAGE).image === t) {
            i(true);
          }

          if (e) {
            r(e);
          } else if (t) {
            n.setBrushImage(t);
            this.isTerrainChange = true;
            i(true);
            cce.Engine.repaintInEditMode();
          }
        });
      });
    }
    n.setBrushImage(null);
  }
  async setSculptBrushRotation(e) {
    this._editor
      .getMode(terrain_editor_mode_1.eTerrainEditorMode.SCULPT)
      .setSculptBrushRotation(e);
  }
  async setPaintBrush(e) {
    const n = this._editor.getMode(
      terrain_editor_mode_1.eTerrainEditorMode.PAINT
    );
    if (e) {
      return new Promise((i, r) => {
        cc_1.assetManager.loadAny(e, (e, t) => {
          if (n.getBrush(terrain_brush_1.TerrainBrushType.IMAGE).image === t) {
            i(true);
          }

          if (e) {
            r(e);
          } else if (t) {
            n.setBrushImage(t);
            this.isTerrainChange = true;
            i(true);
            cce.Engine.repaintInEditMode();
          }
        });
      });
    }
    n.setBrushImage(null);
  }
  async setLayerValue(n, t, a) {
    if (this.target) {
      const s = this.target.getLayer(n);
      return s
        ? new Promise((i, r) => {
            var e;

            if (a) {
              "tileSize" in a && (s.tileSize = a.tileSize);
              "metallic" in a && (s.metallic = a.metallic);
              "roughness" in a && (s.roughness = a.roughness);

              "normalMap" in a
                ? a.normalMap
                  ? ((e = a.normalMap),
                    cc_1.assetManager.loadAny(e, (e, t) => {
                      if (e) {
                        r(e);
                      } else if (t) {
                        s.normalMap = t;
                        this.updateTerrainAsset();
                        this.isTerrainChange = true;
                        this.emitNodeChange();
                        cce.Engine.repaintInEditMode();
                      }
                    }))
                  : ((s.normalMap = null),
                    this.updateTerrainAsset(),
                    (this.isTerrainChange = true),
                    this.emitNodeChange(),
                    cce.Engine.repaintInEditMode())
                : ((this.isTerrainChange = true),
                  this.emitNodeChange(),
                  cce.Engine.repaintInEditMode());
            }

            if (t) {
              cc_1.assetManager.loadAny(t, (e, t) => {
                if (e) {
                  r(e);
                } else if (t) {
                  s.detailMap = t;
                  this.updateTerrainAsset();
                  this.isTerrainChange = true;
                  this.emitNodeChange();
                  i(n);
                  cce.Engine.repaintInEditMode();
                }
              });
            } else {
              i(n);
            }
          })
        : null;
    }
  }
  removeLayerByIndex(e) {
    if (this.target) {
      this.target.removeLayer(e);
      this.isTerrainChange = true;
      this.emitNodeChange();
      cce.Engine.repaintInEditMode();
    }
  }
  setCurrentEditLayer(e) {
    this._editor.setCurrentLayer(e);
    cce.Engine.repaintInEditMode();
  }
  getLayers() {
    var t = [];
    if (this.target) {
      for (let e = 0; e < cc_1.TERRAIN_MAX_LAYER_COUNT; e++) {
        var i = this.target.getLayer(e);
        t.push(
          i
            ? {
                detailMap: i.detailMap ? i.detailMap._uuid : null,
                metallic: i.metallic,
                normalMap: i.normalMap ? i.normalMap._uuid : null,
                roughness: i.roughness,
                tileSize: i.tileSize,
              }
            : null
        );
      }
    }
    return t;
  }
  getCurrentEditLayer() {
    return this._editor.getCurrentLayer();
  }
  setCurrentEditMode(e, t) {
    t = Object.assign(
      {
        isSculptDown: false,
        isSmooth: false,
        isFlatten: false,
        isSetHeight: false,
      },
      t || {}
    );
    this._isConcave = this._isShiftDown = t.isSculptDown;
    this._isSmooth = t.isSmooth;
    this._isFlatten = t.isFlatten;
    this._isSetHeight = t.isSetHeight;
    this._editor.setMode(e);
    cce.Engine.repaintInEditMode();
  }
  queryTerrainInfo() {
    var e = this.target;
    let t = null;
    return (t = e
      ? {
          tileSize: e.info.tileSize,
          weightMapSize: e.info.weightMapSize,
          lightMapSize: e.info.lightMapSize,
          blockCount: e.info.blockCount,
        }
      : t);
  }
  changeTerrainInfo(e) {
    var t;
    var i = this.target;

    if (i) {
      t = new cc_1.TerrainInfo();
      this.isTerrainChange = true;
      Object.assign(t, e);
      i.rebuild(t);
      utils_1.default.onNodeChanged(i.node, e);
      cce.Engine.repaintInEditMode();
    }
  }
  queryBrushOfMode(e) {
    let t = null;

    if (
      e === terrain_editor_mode_1.eTerrainEditorMode.SCULPT ||
      e === terrain_editor_mode_1.eTerrainEditorMode.PAINT
    ) {
      e = this._editor.getMode(e);

      t = {
        radius: e.getCurrentBrush().radius,
        strength: e.getCurrentBrush().strength,
        _setHeight: e.getCurrentBrush()._setHeight,
      };
    }

    return t;
  }
  setBrushOfMode(e, t) {
    let i = null;

    if (
      e === terrain_editor_mode_1.eTerrainEditorMode.SCULPT ||
      e === terrain_editor_mode_1.eTerrainEditorMode.PAINT
    ) {
      e = this._editor.getMode(e);
      i = e.getCurrentBrush();
    }

    if (i) {
      Object.keys(t).forEach((e) => {
        if (e !== "material" && i[e] !== null && i[e] !== undefined) {
          i[e] = t[e];
        }
      });
    }
  }
  getBlockInfo() {
    var e = this._editor.getMode(3);
    var t = e.getCurrentBlockIndex() || [0, 0];
    var i = e.getCurrentWeightData() || null;
    var e = e.getCurrentLayerList();
    return {
      index: { x: t[0], y: t[1] },
      weight: i && {
        data: Array.from(i.data),
        width: i.width,
        height: i.height,
      },
      layers: e.map((e) => (e ? e._uuid : "")),
    };
  }
  emitNodeChange() {
    if (this.target) {
      utils_1.default.onNodeChanged(this.target.node, {
        type: event_enum_1.NodeEventType.COMPONENT_CHANGED,
      });
    }
  }
  onKeyDown(e) {
    if (e.shiftKey) {
      this._isShiftDown = true;
    }
  }
  onKeyUp(e) {
    if (e.keyCode === 16) {
      if (this._isConcave) {
        this._isShiftDown = true;
      } else {
        this._isShiftDown = false;
      }
    }
  }
  onUpdate(e) {
    if (this._editor) {
      this._editor.update(e, this._isShiftDown);
    }
  }
  onCameraControlModeChanged(e) {
    if (e !== 0 && this._editor && this._editor.isChanged) {
      this.emitNodeChange();
    }
  }
  updateTerrainAsset() {
    if (this.target?._asset) {
      this.target.exportLayerListToAsset(this.target._asset);
    }
  }
  onControllerMouseDown(e) {
    if (this._editor) {
      e.propagationStopped = true;
      this._isShiftDown = e.shiftKey;
      this._editor.onMouseDown(e.x, e.y);
      this.reportRushModeAndPaintModeUsedCount();
    }
  }
  onControllerMouseMove(e) {
    if (this._editor) {
      e.propagationStopped = true;
      this._editor.onMouseMove(e.x, e.y);
    }
  }
  onControllerMouseUp(e) {
    if (this._editor) {
      e.propagationStopped = true;
      this._editor.isChanged && this.emitNodeChange();
      this._editor.onMouseUp();
    }
  }
  onControllerHoverOut() {
    if (this._editor) {
      this._editor.onHoverOut();
    }
  }
}
exports.default = TerrainGizmo;
