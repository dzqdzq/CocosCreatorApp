var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainManager = undefined;
const _ = require("lodash");
const cc_1 = require("cc");

const { join } = require("path");

const EventEmitter_1 = __importDefault(require("../../../public/EventEmitter"));
const node_1 = __importDefault(require("../node"));
const plugin_1 = __importDefault(require("../plugin"));
const selection_1 = __importDefault(require("../selection"));

const { loadAssetUncached } = require("../../../utils/asset");

class TerrainManager extends EventEmitter_1.default {
  editedComponents = [];
  selectedComponents = [];
  get name() {
    return "cc.Terrain";
  }
  init() {
    selection_1.default.on("select", (e) => {
      this.select(e);
    });

    selection_1.default.on("unselect", (e) => {
      this.unselect(e);
    });
  }
  select(e) {
    var t = node_1.default.query(e);

    if (t) {
      if ((t = find(t._components, this.name))) {
        (t.manager = this).selectedComponents.includes(t) ||
          this.selectedComponents.push(t);

        this.editedComponents.includes(t) || this.editedComponents.push(t);
      }
    } else {
      console.error(`Node with UUID ${e} does not exist!`);
    }
  }
  unselect(e) {
    var t;
    var s;
    var a = node_1.default.query(e);

    if (a) {
      if (
        (t = find(a._components, this.name)) &&
        ((t.manager = null),
        -1 !== (s = this.selectedComponents.indexOf(t)) &&
          this.selectedComponents.splice(s, 1),
        a.objFlags & cc.Object.Flags.Destroying ||
          a.objFlags & cc.Object.Flags.Destroyed) &&
        -1 !== (s = this.editedComponents.indexOf(t))
      ) {
        this.editedComponents.splice(s, 1);
      }
    } else {
      console.error(`Node with UUID ${e} does not exist!`);
    }
  }
  set isTerrainChange(t) {
    this.selectedComponents.forEach((e) => {
      e.isTerrainChange = t;
    });
  }
  get isTerrainChange() {
    let t = false;

    this.editedComponents.forEach((e) => {
      if (e.isTerrainChange) {
        t = e.isTerrainChange;
      }
    });

    return t;
  }
  onSculpt(e) {
    this.emit("sculpt", e);
  }
  async close() {
    return this.isTerrainChange ? await this.saveAssetDialog("", true) : 1;
  }
  async saveAssetDialog(e, t) {
    let s = 1;
    for (const r of this.editedComponents) {
      if (r.isTerrainChange) {
        var a;
        var i;
        if (r._asset && r._asset._uuid) {
          if (
            await Editor.Message.request(
              "asset-db",
              "query-asset-info",
              r._asset._uuid
            )
          ) {
            var n = await this.saveAsset(t, r);

            if (n === 2) {
              s = n;
            }

            continue;
          }
        }
        let e =
          (
            await Editor.Dialog.save({
              title: Editor.I18n.t("scene.terrain.is_create_message"),
              path: join(Editor.Project.path, "assets"),
              filters: [{ name: "Terrains", extensions: ["terrain"] }],
            })
          ).filePath || "";

        if (Array.isArray(e)) {
          e = e[0];
          n = join(Editor.Project.path, "assets");

          Editor.Utils.Path.contains(n, e)
            ? (a = await Editor.Message.request("asset-db", "query-url", e)) &&
              ((i = this.serialize(r)),
              (await Editor.Message.request(
                "asset-db",
                "create-asset",
                a,
                Buffer.from(i)
              ))
                ? (r.isTerrainChange = false)
                : (s = 2))
            : (await Editor.Dialog.warn(
                Editor.I18n.t("scene.messages.warning"),
                {
                  detail: Editor.I18n.t("scene.terrain.path_unlegal"),
                  buttons: [Editor.I18n.t("scene.messages.confirm")],
                }
              ),
              (s = 2));
        } else {
          r.isTerrainChange = false;
        }
      }
    }
    return s;
  }
  async saveAsset(t = false, s) {
    let a = 1;
    if (s.isTerrainChange) {
      if (t) {
        let e = "Terrain component";
        t = await Editor.Message.request(
          "asset-db",
          "query-asset-info",
          s._asset._uuid
        );

        if (t) {
          e =
            t.url +
            `.
` +
            e;
        }

        a = await cce.Ipc.send("dirty-dialog", e);
      } else {
        a = 0;
      }
      switch (a) {
        case 0: {
          var e = this.serialize(s);

          if (await cce.Ipc.send("save-asset", s._asset._uuid, e)) {
            s.isTerrainChange = false;
          } else {
            a = 2;
          }

          break;
        }
        case 1: {
          s.isTerrainChange = false;
        }
      }
    }
    return a;
  }
  serialize(e) {
    return e.exportAsset()._exportNativeData();
  }
  onRemoveTerrain(e, t) {
    for (const s of this.editedComponents) {
      if (s._asset && s._asset._uuid === e) {
        node_1.default.emit("change", s.node);
        plugin_1.default.forceUpdateToolbar();
      }
    }
  }
  async addAssetToComp(e) {
    for (const s of this.selectedComponents) {
      if (e) {
        try {
          var t = await loadAssetUncached(e);
          s._asset = t;
        } catch {
          s._asset = null;
        } finally {
          node_1.default.emit("change", s.node);
        }
      } else {
        if (s.gizmo) {
          s.gizmo.setCurrentEditMode(0);
        }

        if (!s._asset) {
          s._asset = new cc_1.TerrainAsset();
          s.isTerrainChange = false;
        }
      }
      cce.Plugin.forceUpdateToolbar();
    }
  }
}
function find(e, t) {
  return e.find((e) => e.__classname__ === t);
}
exports.TerrainManager = TerrainManager;
exports.default = new TerrainManager();
