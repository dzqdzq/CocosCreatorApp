var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompManager = undefined;
const events_1 = require("events");
const dump_1 = __importDefault(require("../../../export/dump"));
const get = require("lodash").get;
const EditorExtends_Component = EditorExtends.Component;
const utils_1 = __importDefault(require("./utils"));
const cc_1 = require("cc");
const node_1 = __importDefault(require("../../../utils/node"));
class CompManager extends events_1.EventEmitter {
  init() {
    this.registerCompMgrEvents();
  }
  _onCompAdded;
  _onCompRemoved;
  registerCompMgrEvents() {
    this._onCompAdded = this.add.bind(this);
    EditorExtends_Component.on("add", this._onCompAdded);
    this._onCompRemoved = this.remove.bind(this);
    EditorExtends_Component.on("remove", this._onCompRemoved);
  }
  unregisterCompMgrEvents() {
    if (this._onCompAdded) {
      EditorExtends_Component.off("add", this._onCompAdded);
    }

    if (this._onCompRemoved) {
      EditorExtends_Component.off("remove", this._onCompRemoved);
    }
  }
  clear() {
    EditorExtends_Component.clear();
  }
  add(e, o) {
    if (!node_1.default.isEditorNode(o.node)) {
      this.emit("added", o);
    }
  }
  remove(e, o) {
    if (!node_1.default.isEditorNode(o.node)) {
      this.emit("removed", o);
    }
  }
  query(e) {
    return EditorExtends_Component.getComponent(e) || null;
  }
  queryAll() {
    return EditorExtends_Component.getComponents();
  }
  queryRecycle(e) {
    return cce.SceneFacadeManager.getCurrentFacade().queryRecycleComponent(e);
  }
  removeComponent(e) {
    return e.node._getDependComponent(e).length > 0
      ? (console.warn("Dependent components cannot be removed."), false)
      : (this.emit("before-remove-component", e),
        e.node.removeComponent(e),
        cc.Object._deferredDestroy(),
        this.emit("remove", e),
        true);
  }
  async resetComponent(e) {
    var o;
    if (e instanceof cc_1.MissingScript) {
      o =
        e && e._$erialized && e._$erialized.__type__
          ? e._$erialized.__type__
          : "unknown";

      console.warn(`Reset Component failed: ${o} does not exist`);
      return false;
    }
    var t = [
      "name",
      "node",
      "uuid",
      "enabled",
      "_name",
      "_enabled",
      "_objFlags",
      "_isOnLoadCalled",
      "__scriptAsset",
      "__eventTargets",
    ];
    try {
      var r = new cc.Node().addComponent(e.constructor);
      var n = dump_1.default.dumpComponent(r);
      for (const d in n.value) {
        if (!t.includes(d)) {
          await dump_1.default.restoreProperty(e, d, n.value[d]);
        }
      }

      if (e && e.resetInEditor) {
        e.resetInEditor();
      }

      if (e && e.onRestore) {
        e.onRestore();
      }
    } catch (e) {
      console.error(e);
      return false;
    }
    return true;
  }
  queryDump(e) {
    e = this.query(e);
    return e ? dump_1.default.dumpComponent(e) : null;
  }
  async executeComponentMethod(e, o, t) {
    e = this.query(e);
    if (!e) {
      return null;
    }
    var o = (o || "").split(".");
    var r = o.pop() || "";
    if (o.length > 0) {
      o = o.join(".");
      o = get(e, o);
      if (o && r && o[r]) {
        return o[r](...(t || []));
      }
    }
    return e[r] ? e[r](...(t || [])) : null;
  }
  async setProperty(e, o, t) {
    e = this.query(e);
    return !!e && (await dump_1.default.restoreProperty(e, o, t), true);
  }
  onComponentAddedFromEditor(e) {
    if (
      e &&
      (this.emit("add", e), e.constructor) &&
      utils_1.default.addComponentMap[e.constructor.name]
    ) {
      utils_1.default.addComponentMap[e.constructor.name](e, e.node);
    }
  }
  changeUUID(e, o) {
    EditorExtends_Component.changeUUID(e, o);
  }
}
exports.CompManager = CompManager;
exports.default = new CompManager();
