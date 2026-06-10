Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiSelection = undefined;
class MultiSelection {
  selectionMap = new Map();
  stashSelection(e, t) {
    console.debug("stashSelection=>", e, t);
    this.selectionMap.set(e, t);
  }
  getSelection(e) {
    console.debug("getSelection=>", e, this.selectionMap.get(e));
    return this.selectionMap.get(e);
  }
  clearSelection(e) {
    this.selectionMap.delete(e);
  }
}
exports.MultiSelection = MultiSelection;
