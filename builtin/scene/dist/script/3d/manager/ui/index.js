var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIManager = undefined;
const selection_1 = __importDefault(require("../../../public/selection"));
const node_1 = __importDefault(require("../node"));
const node_2 = __importDefault(require("../../../utils/node"));
const cc_1 = require("cc");
const vec3_1 = require("../../../utils/math/vec3");
const v3_a = new cc_1.Vec3();
class UIManager {
  alignSelection(d) {
    var e = selection_1.default.query();
    if (!(e.length <= 1)) {
      let c = e.map((e) => node_1.default.query(e)).filter(Boolean);

      c = c.filter((e) => {
        let e_parent = e.parent;

        while (e_parent) {
          if (c.includes(e_parent)) {
            return false;
          }
          e_parent = e_parent.parent;
        }

        return true;
      });

      let a = 10000000000;

      let t = 10000000000; /* 1e10 */
      let r = -10000000000; /* -1e10 */
      let o = -10000000000; /* -1e10 */
      e = c.map((e) => {
        var n = node_2.default.getWorldBounds(e);
        a = Math.min(a, n.x);
        t = Math.min(t, n.y);
        r = Math.max(r, n.xMax);
        o = Math.max(o, n.yMax);
        return { node: e, bounds: n };
      });
      const s = new cc_1.Rect(a, t, r - a, o - t);

      var n = c.map((e) => e.uuid);

      var n = cce.SceneFacadeManager.beginRecording(n);

      e.forEach((e) => {
        var e_node = e.node;
        let c;
        switch (d) {
          case "top": {
            c = new cc_1.Vec3(0, s.yMax - e.bounds.yMax, 0);
            break;
          }
          case "v-center": {
            c = new cc_1.Vec3(0, s.center.y - e.bounds.center.y, 0);
            break;
          }
          case "bottom": {
            c = new cc_1.Vec3(0, s.y - e.bounds.y, 0);
            break;
          }
          case "left": {
            c = new cc_1.Vec3(s.x - e.bounds.x, 0, 0);
            break;
          }
          case "h-center": {
            c = new cc_1.Vec3(s.center.x - e.bounds.center.x, 0, 0);
            break;
          }
          case "right": {
            c = new cc_1.Vec3(s.xMax - e.bounds.xMax, 0, 0);
            break;
          }
          default: {
            c = new cc_1.Vec3();
          }
        }
        var a = node_2.default.getWorldPosition(e_node);
        node_2.default.setWorldPosition(e_node, vec3_1.MVec3.add(v3_a, a, c));
      });

      cce.SceneFacadeManager.endRecording(n);
    }
  }
  distributeSelection(r) {
    var e = selection_1.default.query();
    if (!(e.length <= 1)) {
      let c = e.map((e) => node_1.default.query(e)).filter(Boolean);
      e = (c = c.filter((e) => {
        let e_parent = e.parent;

        while (e_parent) {
          if (c.includes(e_parent)) {
            return false;
          }
          e_parent = e_parent.parent;
        }

        return true;
      })).map((e) => ({
        node: e,
        bounds: node_2.default.getWorldBounds(e),
      }));
      e.sort((e, n) => {
        let c = 1;
        switch (r) {
          case "top": {
            c = e.bounds.yMax - n.bounds.yMax;
            break;
          }
          case "v-center": {
            c = e.bounds.center.y - n.bounds.center.y;
            break;
          }
          case "bottom": {
            c = e.bounds.y - n.bounds.y;
            break;
          }
          case "left": {
            c = e.bounds.x - n.bounds.x;
            break;
          }
          case "h-center": {
            c = e.bounds.center.x - n.bounds.center.x;
            break;
          }
          case "right": {
            c = e.bounds.xMax - n.bounds.xMax;
          }
        }
        return c;
      });
      const o = e.length - 1;
      const d = e[0].bounds;
      const s = e[o].bounds;

      var n = c.map((e) => e.uuid);

      var n = cce.SceneFacadeManager.beginRecording(n);

      e.forEach((e, n) => {
        var { node, bounds } = e;

        let t;
        switch (r) {
          case "top": {
            t = new cc_1.Vec3(
              0,
              d.yMax + ((s.yMax - d.yMax) * n) / o - bounds.yMax,
              0
            );
            break;
          }
          case "v-center": {
            t = new cc_1.Vec3(
              0,
              d.center.y +
                ((s.center.y - d.center.y) * n) / o -
                bounds.center.y,
              0
            );
            break;
          }
          case "bottom": {
            t = new cc_1.Vec3(0, d.y + ((s.y - d.y) * n) / o - bounds.y, 0);
            break;
          }
          case "left": {
            t = new cc_1.Vec3(d.x + ((s.x - d.x) * n) / o - bounds.x, 0, 0);
            break;
          }
          case "h-center": {
            t = new cc_1.Vec3(
              d.center.x +
                ((s.center.x - d.center.x) * n) / o -
                bounds.center.x,
              0
            );
            break;
          }
          case "right": {
            t = new cc_1.Vec3(
              d.xMax + ((s.xMax - d.xMax) * n) / o - bounds.xMax,
              0,
              0
            );
            break;
          }
          default: {
            t = new cc_1.Vec3(0, 0, 0);
          }
        }
        e = node_2.default.getWorldPosition(node);
        node_2.default.setWorldPosition(node, vec3_1.MVec3.add(v3_a, e, t));
      });

      cce.SceneFacadeManager.endRecording(n);
    }
  }
}
exports.UIManager = UIManager;
exports.default = new UIManager();
