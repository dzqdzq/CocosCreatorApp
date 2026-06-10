var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const external_1 = __importDefault(require("./external"));
const cc_1 = require("cc");
const NodeUtils = external_1.default.NodeUtils;
const EditorMath = external_1.default.EditorMath;
const tempVec3_a = new cc_1.Vec3();
class GizmosUtils {
  getCenter(e) {
    e = this.getCenterWorldPos(e);
    return cc.director.getScene().convertToNodeSpace(e);
  }
  getCenterWorldPos(r) {
    let l = null;
    let o = null;
    let n = null;
    let i = null;
    for (let e = 0; e < r.length; ++e) {
      let t;
      var u = r[e];
      var s = NodeUtils.getWorldOrientedBounds(u);
      for (let e = 0; e < s.length; ++e) {
        t = s[e];

        if (l === null || t.x < l) {
          l = t.x;
        }

        if (n === null || t.x > n) {
          n = t.x;
        }

        if (o === null || t.y < o) {
          o = t.y;
        }

        if (i === null || t.y > i) {
          i = t.y;
        }
      }
      t = NodeUtils.getWorldPosition3D(u);

      if (!l || t.x < l) {
        l = t.x;
      }

      if (!n || t.x > n) {
        n = t.x;
      }

      if (!o || t.y < o) {
        o = t.y;
      }

      if (!i || t.y > i) {
        i = t.y;
      }
    }
    var e = 0.5 * (l + n);
    var t = 0.5 * (o + i);
    return cc.v2(e, t);
  }
  getCenterWorldPos3D(e) {
    return NodeUtils.getCenterWorldPos3D(e);
  }
  static LimitLerp(e, t, r, l, o) {
    return e * (1 - (r = EditorMath.clamp01((r - l) / (o - l)))) + t * r;
  }
  getMaxCompInVec3(e) {
    return Math.max(e.x, e.y, e.z);
  }
}
exports.default = GizmosUtils;
