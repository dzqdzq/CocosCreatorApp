var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetManager = undefined;
const cc_1 = require("cc");

const { isValid } = cc_1;

const events_1 = require("events");
const material_1 = __importDefault(require("./material"));
const physics_material_1 = __importDefault(require("./physics-material"));

const animation_graph_variant_1 = __importDefault(
  require("./animation-graph-variant")
);

const animation_mask_1 = __importDefault(require("./animation-mask"));
const render_pipeline_1 = __importDefault(require("./render-pipeline"));
const node_1 = __importDefault(require("../node"));
const node_2 = __importDefault(require("../../../utils/node"));
const asset_watcher_1 = require("./asset-watcher");

const { loadAssetUncached } = require("../../../utils/asset");

const drag_drop_1 = require("./drag-drop");
class AssetManager extends events_1.EventEmitter {
  dragDrop = new drag_drop_1.DragDrop();
  init() {
    cce.Script.on(cce.Script.EXECUTION_FINISHED, this.onScriptExecutedEnd);
  }
  onScriptExecutedEnd() {
    cc_1.assetManager.assets.forEach((e, a) => {
      if (e instanceof cc_1.Prefab) {
        cc_1.assetManager.releaseAsset(e);
      }
    });
  }
  removeAllAssetListeners() {
    cc_1.assetManager.assetListener.removeAllListeners();
  }
  onSceneOpened() {
    this.removeAllAssetListeners();

    node_1.default.queryUuids().forEach((e) => {
      e = node_1.default.query(e);

      if (e instanceof cc_1.Scene) {
        asset_watcher_1.assetWatcherManager.startWatch(e.globals);
      } else if (e && !node_2.default.isEditorNode(e)) {
        e.components.forEach((e) => {
          asset_watcher_1.assetWatcherManager.startWatch(e);
        });
      }
    });
  }
  onNodeChanged(e) {
    e.components.forEach((e) => {
      asset_watcher_1.assetWatcherManager.stopWatch(e);
      asset_watcher_1.assetWatcherManager.startWatch(e);
    });
  }
  onComponentAdded(e) {
    asset_watcher_1.assetWatcherManager.startWatch(e);
  }
  onComponentRemoved(e) {
    asset_watcher_1.assetWatcherManager.stopWatch(e);
  }
  queryAllEffects() {
    return material_1.default.queryAllEffects();
  }
  queryEffect(e) {
    return material_1.default.queryEffect(e);
  }
  async queryMaterial(e) {
    return material_1.default.queryMaterial(e);
  }
  async applyMaterial(e, a) {
    a = await material_1.default.decodeMaterial(a);
    await cce.Ipc.send("save-asset", e, a);
  }
  async previewMaterial(e, a, t) {
    return material_1.default.previewMaterial(e, a, t);
  }
  async queryPhysicsMaterial(e) {
    let a;
    try {
      a = await loadAssetUncached(e);
    } catch (e) {
      console.error(e);
    }
    return a
      ? (physics_material_1.default.cacheComponent(a),
        physics_material_1.default.encodeComponent(a))
      : null;
  }
  async queryAnimationGraphVariant(e) {
    let a;
    try {
      a = await loadAssetUncached(e);
    } catch (e) {
      console.error(e);
    }
    return a
      ? (animation_graph_variant_1.default.cacheComponent(a),
        animation_graph_variant_1.default.encodeComponent())
      : null;
  }
  async queryAnimationMask(e) {
    let a;
    try {
      a = await loadAssetUncached(e);
    } catch (e) {
      console.error(e);
    }
    return a
      ? (animation_mask_1.default.cacheComponent(a),
        animation_mask_1.default.encodeComponent(a))
      : null;
  }
  async changePhysicsMaterial(e) {
    return physics_material_1.default.updateComponent(e);
  }
  async applyPhysicsMaterial(e) {
    var a = physics_material_1.default.getComponent();
    var a = cce.Utils.serialize(a);
    await cce.Ipc.send("save-asset", e, a);
  }
  async changeAnimationGraphVariant(e) {
    return animation_graph_variant_1.default.updateComponent(e);
  }
  async applyAnimationGraphVariant(e) {
    var a = await animation_graph_variant_1.default.applyComponent();

    if (a) {
      a = cce.Utils.serialize(a);
      await cce.Ipc.send("save-asset", e, a);
    }
  }
  async changeAnimationMask(e) {
    return e.method === "import-skeleton"
      ? animation_mask_1.default.importSkeleton(e.uuid)
      : e.method === "change-dump"
      ? animation_mask_1.default.updateComponent(e.dump)
      : e.method === "clear-nodes"
      ? animation_mask_1.default.clearNodes()
      : undefined;
  }
  async applyAnimationMask(e) {
    var a = animation_mask_1.default.getComponent();
    var a = cce.Utils.serialize(a);
    await cce.Ipc.send("save-asset", e, a);
  }
  async applyRenderTexture(e, a) {
    let t;
    try {
      t = await loadAssetUncached(e);
    } catch (e) {
      console.error(e);
    }

    if (t && a) {
      t.resize(a.width || 1, a.height || 1);
      a = cce.Utils.serialize(t);
      cce.Ipc.send("save-asset", e, a);
    }
  }
  onAssetChanged(e, a, t) {
    asset_watcher_1.assetWatcherManager.onAssetChanged(e);
    this.emit("asset-change", e, a, t);
  }
  onAssetDeleted(e, a) {
    asset_watcher_1.assetWatcherManager.onAssetDeleted(e, a.url);
    this.emit("asset-delete", e);
  }
  getAllReferenceAssets(e, t = []) {
    let s = [];
    var r = cc_1.assetManager.references?.get(e);
    if (r) {
      for (let e = 0, a = r.length; e < a; e++) {
        var n = r[e][0].deref();

        if (n && !t.includes(n)) {
          if (isValid(n, true)) {
            t.push(n);
            s.push(n);
            s = s.concat(this.getAllReferenceAssets(n._uuid, t));
          }
        }
      }
    }
    return s;
  }
  releaseAsset(e) {
    const t = cc_1.assetManager.assets.get(e);
    if (t) {
      if (t instanceof cc_1.Prefab) {
        const s = [];

        cc_1.assetManager.assets.forEach((e, a) => {
          a = cc_1.assetManager.dependUtil.getDepsRecursively(a);

          if (t && a.includes(t.uuid)) {
            s.push(e);
          }
        });

        s.forEach((e) => {
          cc_1.assetManager.releaseAsset(e);
        });
      }
      cc_1.assetManager.releaseAsset(t);
    }
  }
  async queryRenderPipeline(e) {
    let a;
    try {
      a = await loadAssetUncached(e);
    } catch (e) {
      console.error(e);
    }
    return a
      ? (render_pipeline_1.default.cacheComponent(a),
        render_pipeline_1.default.encodeComponent(a))
      : null;
  }
  async changeRenderPipeline(e) {
    return render_pipeline_1.default.updateComponent(e);
  }
  async applyRenderPipeline(e) {
    var a = render_pipeline_1.default.getComponent();
    var a = cce.Utils.serialize(a);

    var a =
      (await cce.Ipc.send("save-asset", e, a),
      await Editor.Profile.getProject("project", "general.renderPipeline"));

    if (e === a) {
      render_pipeline_1.default.preview();
    }
  }
}
exports.AssetManager = AssetManager;
exports.default = new AssetManager();
