Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingReporter = undefined;
class MissingReporter {
  outputLevel = "debug";
  static INFO_DETAILED = " Detailed information:\n";
  static getObjectType(e) {
    return e instanceof cc.Component
      ? "component"
      : e instanceof cc.Prefab
      ? "prefab"
      : e instanceof cc.SceneAsset
      ? "scene"
      : "asset";
  }
  missingObjects = new Set();
  missingOwners = new Map();
  root;
  report() {}
  reportByOwner() {}
  constructor(e) {
    this.root = e;
  }
  reset() {
    this.missingObjects.clear();
    this.missingOwners.clear();
    this.root = null;
  }
  stash(e) {
    this.missingObjects.add(e);
  }
  stashByOwner(e, s, t) {
    let i = this.missingOwners.get(e);

    if (!i) {
      i = {};
      this.missingOwners.set(e, i);
    }

    i[s] = t;
  }
  removeStashedByOwner(e, s) {
    var t;
    var i = this.missingOwners.get(e);
    if (i && s in i) {
      t = i[s];
      delete i[s];

      if (!Object.keys(i).length) {
        this.missingOwners.delete(e);
      }

      return t;
    }
  }
}
exports.MissingReporter = MissingReporter;
