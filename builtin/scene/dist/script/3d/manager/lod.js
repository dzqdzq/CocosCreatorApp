var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.LODManager = undefined;
const cc_1 = require("cc");
const camera_1 = __importDefault(require("./camera"));
const component_1 = __importDefault(require("./component"));
const lod_group_utils_1 = require("cc/editor/lod-group-utils");
const selection_1 = __importDefault(require("./selection"));
const node_1 = __importDefault(require("./node"));
const component_2 = __importDefault(require("./component"));
class LODManager {
  _selectedUUIDs = [];
  _selectedMeshRendererSet = new Set();
  _selectedLODSet = new Set();
  _onSelect;
  _onUnselect;
  onResize(e) {}
  onSceneOpened(e) {}
  onSceneReload(e) {}
  onSceneClosed(e) {}
  onNodeChanged(e, t) {}
  onAddNode(e) {}
  onRemoveNode(e) {}
  onNodeAdded(e, t) {}
  onNodeRemoved(e, t) {}
  onAddComponent(e) {}
  onRemoveComponent(e) {}
  onComponentAdded(e, t) {}
  onComponentRemoved(e, t) {}
  applyCurrentCameraSize(e) {
    e = component_1.default.query(e);
    return e instanceof cc_1.LODGroup
      ? lod_group_utils_1.LODGroupEditorUtility.getRelativeHeight(
          e,
          camera_1.default.camera.camera
        )
      : null;
  }
  onSelect(e, t) {
    for (let e = 0; e < t.length; e++) {
      var n;
      var o = t[e];

      if (!this._selectedUUIDs.includes(o)) {
        if (
          (o = node_1.default.query(o)) &&
          ((n = o.getComponent(cc_1.MeshRenderer)) &&
            this.onSelectMeshRenderer(n),
          (o = o.getComponent(cc_1.LODGroup)) && this.onSelectLOD(o),
          o || n)
        ) {
          this.updateAllLODGroupLockedVisibility();
        }
      }
    }
    this._selectedUUIDs.length = 0;
    this._selectedUUIDs.push(...t);
  }
  onUnselect(e, t) {
    for (let e = 0; e < this._selectedUUIDs.length; e++) {
      var n;
      var o = this._selectedUUIDs[e];

      if (!t.includes(o)) {
        if (
          (o = node_1.default.query(o)) &&
          ((n = o.getComponent(cc_1.MeshRenderer)) &&
            this.onUnselectMeshRenderer(n),
          (o = o.getComponent(cc_1.LODGroup)) && this.onUnselectLOD(o),
          o || n)
        ) {
          this.updateAllLODGroupLockedVisibility();
        }
      }
    }
    this._selectedUUIDs.length = 0;
    this._selectedUUIDs.push(...t);
  }
  onSelectMeshRenderer(e) {
    this._selectedMeshRendererSet.add(e);
  }
  onUnselectMeshRenderer(e) {
    if (this._selectedMeshRendererSet.has(e)) {
      this._selectedMeshRendererSet.delete(e);
    }
  }
  onSelectLOD(e) {
    this._selectedLODSet.add(e);
  }
  onUnselectLOD(e) {
    if (this._selectedLODSet.has(e)) {
      this._selectedLODSet.delete(e);
    }
  }
  updateAllLODGroupLockedVisibility() {
    cc_1.director
      .getScene()
      ?.getComponentsInChildren(cc_1.LODGroup)
      .forEach((n) => {
        var e;

        if (n.enabled) {
          e = n.LODs.map((e, t) => {
            if (
              !this._selectedLODSet.has(n) &&
              e.renderers.some((e) => e && this._selectedMeshRendererSet.has(e))
            ) {
              return t;
            }
          }).filter((e) => typeof e == "number");

          n.forceLODs(e);
        }
      });
  }
  insertLOD(e, ...t) {
    e = component_2.default.query(e);

    if (e instanceof cc_1.LODGroup) {
      e.insertLOD(...t);
      cce.Node.emit("change", e.node);
    }
  }
  eraseLOD(e, ...t) {
    e = component_2.default.query(e);

    if (e instanceof cc_1.LODGroup) {
      e.eraseLOD(...t);
      cce.Node.emit("change", e.node);
    }
  }
  init() {
    this._onSelect ??= this.onSelect.bind(this);
    this._onUnselect ??= this.onUnselect.bind(this);
    selection_1.default.on("select", this._onSelect);
    selection_1.default.on("unselect", this._onUnselect);
  }
}
exports.LODManager = LODManager;
exports.default = new LODManager();
