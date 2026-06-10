Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiUndoManager = undefined;
const undo_1 = require("../../../export/undo");
class MultiUndoManager {
  undoManager = new Map();
  generateUndoManager(e) {
    var n;

    if (!this.undoManager.has(e)) {
      (n = new undo_1.SceneUndoManager()).init();
      this.undoManager.set(e, n);
    }
  }
  getUndoManager(e) {
    if (!this.undoManager.has(e)) {
      this.generateUndoManager(e);
    }

    return this.undoManager.get(e);
  }
  delete(e) {
    this.undoManager.delete(e);
  }
  beginRecording(e, n, a) {
    return this.getUndoManager(e).beginRecording(n, a);
  }
  cancelRecording(e, n) {
    return this.getUndoManager(e).cancelRecording(n);
  }
  endRecording(e, n) {
    return this.getUndoManager(e).endRecording(n);
  }
  updateDump(e, n, a) {
    this.getUndoManager(e).updateDump(n, a);
  }
  querySceneDirty(e) {
    e = this.getUndoManager(e);
    e?.isDirty();
    return !!e?.isDirty();
  }
  async undo(e) {
    return this.getUndoManager(e)?.undo();
  }
  async redo(e) {
    return this.getUndoManager(e)?.redo();
  }
  record(e, n, a = true) {
    e = this.getUndoManager(e);

    if (e) {
      e.record(n, a);
    } else {
      console.warn("未找到对应的 undoManager");
    }
  }
  abortSnapshot(e) {
    this.getUndoManager(e)?.abort();
  }
  snapshot(e, n) {
    this.getUndoManager(e)?.snapshot(n);
  }
}
exports.MultiUndoManager = MultiUndoManager;
