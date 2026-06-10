Object.defineProperty(exports, "__esModule", { value: true });
exports.UndoManagerBase = undefined;
exports.UndoCommand = undefined;
class UndoCommand {
  toPerformUndo = false;
  async perform() {
    if (this.toPerformUndo) {
      await this.undo();
    } else {
      await this.redo();
    }
  }
  async undo() {}
  async redo() {}
}
exports.UndoCommand = UndoCommand;
class UndoManagerBase {
  _multiCollaboration = true;
  _multiCommandArray = [];
  _commandArray = [];
  _index = -1;
  _lastSavedCommand = null;
  push(a) {
    if (this._index !== this._commandArray.length - 1) {
      this._commandArray.splice(this._index + 1);
    }

    this._commandArray.push(a);

    if (this._multiCollaboration) {
      this._multiCommandArray.push(a);
    }

    this._index++;
  }
  async undo() {
    var a;
    return -1 !== this._index && (a = this._commandArray[this._index])
      ? ((a.toPerformUndo = true),
        await a.perform(),
        this._index--,
        this._multiCollaboration && this._multiCommandArray.push(a),
        a)
      : undefined;
  }
  async redo() {
    var a;
    return !(this._index > this._commandArray.length - 1) &&
      (a = this._commandArray[this._index + 1])
      ? (this._index++,
        (a.toPerformUndo = false),
        await a.perform(),
        this._multiCollaboration && this._multiCommandArray.push(a),
        a)
      : undefined;
  }
  reset() {
    this._commandArray.length = 0;
    this._multiCommandArray.length = 0;
    this._index = -1;
    this._lastSavedCommand = null;
  }
  save() {
    this._lastSavedCommand = this._commandArray[this._index];
  }
  isDirty() {
    return (
      -1 !== this._index &&
      this._lastSavedCommand !== this._commandArray[this._index]
    );
  }
}
exports.UndoManagerBase = UndoManagerBase;
