Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptImporter = undefined;
const javascript_1 = require("./javascript");
class ScriptImporter extends javascript_1.JavascriptImporter {
  get version() {
    return "" + super.version;
  }
  get name() {
    return "typescript";
  }
  get assetType() {
    return "cc.Script";
  }
  async import(e) {
    if (e.source.endsWith(".d.ts")) {
      return true;
    }
    let r = false;
    let t = false;
    switch (await this._getTypeCheckLevel()) {
      case "checkOnly": {
        r = true;
        t = false;
        break;
      }
      case "fatalOnError": {
        r = true;
        t = true;
        break;
      }
      default: {
        r = false;
      }
    }
    return super.import(e);
  }
  async _getTypeCheckLevel() {
    return await Editor.Profile.getProject(
      "project",
      "general.type_check_level"
    );
  }
}
exports.ScriptImporter = ScriptImporter;
