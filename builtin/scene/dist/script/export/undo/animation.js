var __importDefault =
  (this && this.__importDefault) ||
  ((a) => (a && a.__esModule ? a : { default: a }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationUndoManager = undefined;
const animation_1 = __importDefault(require("../../3d/manager/animation"));
const base_1 = require("./base");
class AnimationUndoManager extends base_1.UndoManagerBase {
  name = "animation";
  id = 0;
  _manualCommands = [];
  nodeUuid = "";
  clipUuid = "";
  clipDump = null;
  init() {}
  getUndoData() {
    return {
      nodeUuid: this.nodeUuid,
      clipUuid: this.clipUuid,
      clipDump: this.clipDump,
    };
  }
  getRedoData() {
    this.updateCache();
    return this.getUndoData();
  }
  updateCache() {
    this.clipDump = animation_1.default.dumpClip(this.nodeUuid, this.clipUuid);
  }
  _createCommand(a) {
    var t = new AnimationUndoCommand();

    if (a.tag !== undefined) {
      t.tag = a.tag;
    }

    this.id++;
    t.id = this.name + this.id;
    this._manualCommands.push(t);
    return t;
  }
  beginRecording(a, t) {
    return a === this.nodeUuid &&
      t?.external &&
      Object.prototype.hasOwnProperty.call(t.external, "animation")
      ? (((a = this._createCommand({ tag: "animation edit" })).undoData =
          this.getUndoData()),
        a.id)
      : "";
  }
  endRecording(t) {
    var a;

    var i = this._manualCommands.find((a) => a.id === t);

    if (
      i &&
      (-1 !== (a = this._manualCommands.indexOf(i)) &&
        this._manualCommands.splice(a, 1),
      (i.redoData = this.getRedoData()),
      JSON.stringify(i.undoData) !== JSON.stringify(i.redoData))
    ) {
      this.push(i);
    }

    return false;
  }
  cancelRecording(t) {
    var a = this._manualCommands.find((a) => a.id === t);
    return (
      !!a &&
      (-1 !== (a = this._manualCommands.indexOf(a)) &&
        this._manualCommands.splice(a, 1),
      true)
    );
  }
  reset(a, t) {
    if (typeof a == "string" && typeof t == "string") {
      super.reset();
      this.nodeUuid = a;
      this.clipUuid = t;
      this.updateCache();
    }
  }
  snapshot(a) {}
  record(a) {}
  abort() {}
  updateDump(a) {}
  async undo() {
    var a = await super.undo();

    if (a) {
      this.updateCache();
    }

    return a;
  }
  async redo() {
    var a = await super.redo();

    if (a) {
      this.updateCache();
    }

    return a;
  }
}
exports.AnimationUndoManager = AnimationUndoManager;
class AnimationUndoCommand extends base_1.UndoCommand {
  id = "";
  undoData;
  redoData;
  tag = "";
  async undo() {
    await this.applyData(this.undoData);
  }
  async redo() {
    await this.applyData(this.redoData);
  }
  async applyData(a) {
    var { nodeUuid: a, clipUuid, clipDump } = a;
    try {
      await animation_1.default.restoreFromDump(a, clipUuid, clipDump);
    } catch (a) {
      console.error(a);
    }
  }
}
