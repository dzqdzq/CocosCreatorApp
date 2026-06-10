var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = undefined;
const selection_1 = __importDefault(require("./selection"));
const node_1 = __importDefault(require("./node"));
const scene_1 = __importDefault(require("./scene"));
const gizmo_1 = require("../../public/gizmos/manager/gizmo");

const { join } = require("../../utils/misc");

const ScriptModuleMap = {};
const DropTypesMap = {};
const info = {
  nodes: [],
  gizmo: { is2D: gizmo_1.gizmoManager.is2D },
  modes: [],
};
class PluginManager {
  getNodes(e) {
    const t = [];

    e.forEach((o) => {
      const n = node_1.default.query(o);
      if (n && n._components) {
        var e = info.nodes.find((e) => e.uuid === o);
        if (e) {
          t.push(e);
        } else {
          const i = { uuid: o, components: [] };

          n.components.forEach((e) => {
            i.components.push({
              type: e.__classname__,
              uuid: e.uuid,
              enabled: !!n.active && e.enabled,
            });
          });

          t.push(i);
        }
      }
    });

    return t;
  }
  async init() {
    scene_1.default.on("mode-change", (e) => {
      info.modes = [e];
      cce.Ipc.send("update-plugin", info);
    });

    selection_1.default.on("select", (e, o) => {
      info.nodes = this.getNodes(o);
      cce.Ipc.send("update-plugin", info);
    });

    selection_1.default.on("unselect", (e, o) => {
      info.nodes = this.getNodes(o);
      cce.Ipc.send("update-plugin", info);
    });

    gizmo_1.gizmoManager.on("info-update", () => {
      info.gizmo.is2D = gizmo_1.gizmoManager.is2D;
      cce.Ipc.send("update-plugin", info);

      cce.Ipc.send("record-gizmos", {
        gizmosInfos: { is2D: info.gizmo.is2D },
      });
    });

    (await Editor.Package.getPackages({ enable: true })).forEach(attach);
    Editor.Package.__protected__.on("enable", attach);
    Editor.Package.__protected__.on("disable", detach);
  }
  onNodeChanged(n) {
    const e = info.nodes.find((e) => e.uuid === n.uuid);

    if (e) {
      setTimeout(() => {
        const o = [];

        n.components.forEach((e) => {
          o.push({
            type: e.__classname__,
            uuid: e.uuid,
            enabled: !!n.active && e.enabled,
          });
        });

        if (JSON.stringify(e.components) === JSON.stringify(o)) {
          this.forceUpdateFloatWindow();
        } else {
          e.components = o;
          cce.Ipc.send("update-plugin", info);
        }
      });
    }
  }
  sendToFloatWindow(e, o) {
    cce.Ipc.send("send-plugin", "float-window", e, o);
  }
  forceUpdateToolbar() {
    cce.Ipc.send("force-update", "toolbar", info);
  }
  forceUpdateFloatWindow() {
    cce.Ipc.send("force-update", "float-window", info);
  }
  forceUpdatePlugin() {
    cce.Ipc.send("update-plugin", info);
  }
  async executeSceneScript(e) {
    if (!ScriptModuleMap[e.name]) {
      throw "Scenario scripts do not exist: " + e.name;
    }
    if (
      ScriptModuleMap[e.name].methods &&
      ScriptModuleMap[e.name].methods[e.method]
    ) {
      return ScriptModuleMap[e.name].methods[e.method](...(e.args || []));
    }
  }
  getDropHandle(e) {
    for (const o in DropTypesMap) {
      if (DropTypesMap[o][e]) {
        return { name: o, item: DropTypesMap[o][e] };
      }
    }
    return null;
  }
  getScriptModuleMap() {
    return ScriptModuleMap;
  }
}
exports.PluginManager = PluginManager;

const attach = (e) => {
  if (!e.invalid && e.info.contributions && e.info.contributions.scene) {
    var o = e.info.contributions.scene;
    if (o.script) {
      var n;
      var i = join(e.path, o.script);
      try {
        if (o.script) {
          (n = Editor.Module.__protected__.requireFile(i)).load && n.load();
          ScriptModuleMap[e.name] = n;
        }
      } catch (e) {
        console.warn(i, e);
      }
    }
    if (o.drop) {
      const t = {};

      o.drop.forEach((e) => {
        t[e.type] = e;
      });

      DropTypesMap[e.name] = t;
    }
  }
};

const detach = (e) => {
  var o;
  var n;

  if (
    e.info.contributions &&
    e.info.contributions.scene &&
    ((o = e.info.contributions.scene),
    ScriptModuleMap[e.name] &&
      ((n = ScriptModuleMap[e.name]),
      delete ScriptModuleMap[e.name],
      n.unload && n.unload(),
      Editor.Module.__protected__.removeCache(join(e.path, o.script))),
    DropTypesMap[e.name])
  ) {
    delete DropTypesMap[e.name];
  }
};

exports.default = new PluginManager();
