var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const edit_component_asset_1 = __importDefault(
  require("./edit-component-asset")
);

const cc_1 = require("cc");

const { loadAssetUncached } = require("../../../utils/asset");

class EditAnimationMask extends edit_component_asset_1.default {
  async importSkeleton(e) {
    try {
      var t = await loadAssetUncached(e, cc_1.Prefab);
      if (!(t.data instanceof cc_1.Node)) {
        console.error("Bad prefab object!");
        return null;
      }
      const s = (e, t = "") => {
        for (const o of e.children) {
          var n = t ? t + "/" + o.name : o.name;
          this.component.addJoint(n, true);
          s(o, n);
        }
      };
      s(t.data);
      return this.encodeComponent(this.component);
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  clearNodes() {
    this.component.clear();
    return this.encodeComponent(this.component);
  }
}
exports.default = new EditAnimationMask();
