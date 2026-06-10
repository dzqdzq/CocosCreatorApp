var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneUndoCommand = undefined;
exports.SceneUndoManager = undefined;
const node_1 = __importDefault(require("../../3d/manager/node"));
const base_1 = require("./base");
const index_1 = __importDefault(require("../dump/index"));
const event_enum_1 = require("../../public/event-enum");
class SceneUndoCommand extends base_1.UndoCommand {
  tag = "";
  id = "";
  auto = false;
  custom = false;
  uuids = [];
  undoData = new Map();
  redoData = new Map();
  async undo() {
    await this.applyData(this.undoData);
  }
  async applyData(e) {
    for (var [t, a] of e) {
      var n = cce.Node.query(t);
      if (n) {
        if (a) {
          await index_1.default.restoreNode(n, a);

          cce.Node.emit("change", n, {
            source: event_enum_1.EventSourceType.UNDO,
          });
        }
      } else {
        var o = cce.Component.query(t);
        if (o && a) {
          var d = a;
          for (const r in d.value) {
            await index_1.default.restoreProperty(o, r, d.value[r]);
          }
          cce.Node.emit("change", o.node, {
            source: event_enum_1.EventSourceType.UNDO,
          });
        }
      }
    }
  }
  async redo() {
    await this.applyData(this.redoData);
  }
}
exports.SceneUndoCommand = SceneUndoCommand;
class SceneUndoManager extends base_1.UndoManagerBase {
  _autoCommands = [];
  _manualCommands = [];
  _uuidDumpMap = {};
  id = 0;
  records = [];
  init() {
    cce.Engine.on("onEditorTick", () => {
      this._recordTargetAtFrameEnd();
    });
  }
  _createCommand(e) {
    let t = null;

    if (e.customCommand) {
      t = e.customCommand;
      t.custom = true;
    } else {
      t = new SceneUndoCommand();
    }

    if (e.tag !== undefined) {
      t.tag = e.tag;
    }

    if (e.auto !== undefined) {
      t.auto = e.auto;
    }

    (t.auto !== false ? this._autoCommands : this._manualCommands).push(t);
    this.id++;
    t.id = t.tag + this.id;
    return t;
  }
  _isCommandExist(e) {
    return this._commandArray.includes(e);
  }
  _recordTargetAtFrameEnd() {
    if (this._autoCommands.length > 0) {
      this._autoCommands.forEach((e) => {
        this.endRecording(e.id);
      });

      this._autoCommands.length = 0;
    }
  }
  _setUndo(e, t) {
    let a = null;
    var n = cce.Node.query(t);

    a = n
      ? index_1.default.dumpNode(n)
      : (n = cce.Component.query(t))
      ? index_1.default.dumpComponent(n)
      : null;

    this._uuidDumpMap[t] = a;
    e.undoData.set(t, a);
  }
  _setRedo(e, t) {
    let a = null;
    var n = cce.Node.query(t);

    a = n
      ? index_1.default.dumpNode(n)
      : (n = cce.Component.query(t))
      ? index_1.default.dumpComponent(n)
      : null;

    this._uuidDumpMap[t] = a;
    e.redoData.set(t, a);
  }
  beginRecording(e, t) {
    var a = this._createCommand((t = t ?? { auto: false }));
    e = Array.isArray(e) ? e : [e];
    for (const n of new Set(e).values()) {
      a.uuids.push(n);

      if (!a.custom) {
        this._setUndo(a, n);
      }
    }
    return a.id;
  }
  _removeCommand(e, t) {
    var a = e.find((e) => e.id === t);
    if (a) {
      a = e.indexOf(a);
      if (-1 !== a) {
        e.splice(a, 1);
        return true;
      }
    }
    return false;
  }
  cancelRecording(e) {
    let t = this._removeCommand(this._autoCommands, e);
    return (t = t || this._removeCommand(this._manualCommands, e));
  }
  endRecording(t) {
    const a =
      this._autoCommands.find((e) => e.id === t) ??
      this._manualCommands.find((e) => e.id === t);
    var e;
    return !(
      !a ||
      (this._isCommandExist(a)
        ? (console.warn("command is already exist", a.tag), 1)
        : (a.custom ||
            a.uuids.forEach((e) => {
              this._setRedo(a, e);
            }),
          a.tag === "" &&
            ((e = a.uuids
              .map(
                (e) => cce.Node.query(e)?.name || cce.Component.query(e)?.name
              )
              .join(" ")),
            (a.tag = "modify:" + e)),
          this.push(a),
          -1 !== (e = this._manualCommands.indexOf(a)) &&
            this._manualCommands.splice(e, 1),
          this.records.length > a.uuids.length &&
            console.debug(
              "records length > command uuids length",
              this.records,
              a.uuids
            ),
          (this.records.length = 0)))
    );
  }
  reset() {
    super.reset();
    this._autoCommands.length = 0;
    this._manualCommands.length = 0;
    this._uuidDumpMap = {};
  }
  _getUndoData(e = this.records) {
    const t = new Map();

    e.forEach((e) => {
      t.set(e, this._uuidDumpMap[e]);
    });

    return t;
  }
  _getRedoData(e = this.records) {
    this.updateDump(e);
    return this._getUndoData(e);
  }
  updateDump(e = [], a = true) {
    e.forEach((e) => {
      try {
        var t = node_1.default.query(e);

        if (
          t &&
          !(t.objFlags & cc.Object.Flags.HideInHierarchy) &&
          (a || !this._uuidDumpMap[e])
        ) {
          this._uuidDumpMap[e] = node_1.default.queryDumpAtAll(e);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
  async undo() {
    var e = await super.undo();

    if (e && !e.custom) {
      this.updateDump(e.uuids);
    }

    cce.Engine.repaintInEditMode();
    return e;
  }
  async redo() {
    var e = await super.redo();

    if (e && !e.custom) {
      this.updateDump(e.uuids);
    }

    cce.Engine.repaintInEditMode();
    return e;
  }
  snapshot() {
    try {
      var e = this._getUndoData();
      var t = this._getRedoData();
      this.records.length = 0;

      if (
        JSON.stringify(Array.from(e.entries())) ===
        JSON.stringify(Array.from(t.entries()))
      ) {
        return false;
      }

      var a = new SceneUndoCommand();

      a.undoData = e;
      a.redoData = t;
      var n = this.beginRecording(a.uuids, { customCommand: a });

      this.endRecording(n);
    } catch (e) {
      console.error(e);
    }
  }
  abort() {
    this.records.length = 0;
  }
  record(e, t = true) {
    if (!this.records.includes(e)) {
      t && this.updateDump([e]);
      this.records.push(e);
    }
  }
}
exports.SceneUndoManager = SceneUndoManager;
