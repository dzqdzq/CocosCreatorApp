var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grid = undefined;
const cc_1 = require("cc");
const utils_1 = require("../camera/utils");
const linear_ticks_1 = __importDefault(require("../camera/grid/linear-ticks"));
const _lineEnd = 1000000; /* 1e6 */
const tempV3 = new cc_1.Vec3();
class Grid {
  _gridMeshComp;
  synchronizeCamera;
  _lineColor = cc.color().fromHEX("#A6A6A6");
  hTicks;
  vTicks;
  constructor(e, i) {
    this._gridMeshComp = utils_1.CameraUtils.createGrid("internal/editor/grid");

    this._gridMeshComp.node.layer = cc_1.Layers.Enum.DEFAULT;
    this._gridMeshComp.node.setRotationFromEuler(new cc_1.Vec3(90, 0, 0));
    this._gridMeshComp.node.parent = e;
    this.synchronizeCamera = i;

    this.hTicks = new linear_ticks_1.default()
      .initTicks([5, 2], 1, 10000 /* 1e4 */)
      .spacing(15, 80);

    this.vTicks = new linear_ticks_1.default()
      .initTicks([5, 2], 1, 10000 /* 1e4 */)
      .spacing(15, 80);

    this.synchronizeCamera.node.on("transform-changed", this.updateGrid, this);
  }
  _hide = false;
  hide() {
    this._hide = true;
    this._gridMeshComp.node.active = false;
  }
  show() {
    this._hide = false;
    this._gridMeshComp.node.active = true;
  }
  _updateGridData(i, t, s, e = 0) {
    var r = this.hTicks;
    var a = this.vTicks;
    this.synchronizeCamera.node.getWorldPosition(tempV3);
    var h = tempV3;
    var o = (5000 /* 5e3 */ * (h.y / 500)) | 0;
    var c = -o + h.x;
    var n = o + h.x;
    var l = -o + h.z;
    var d = o + h.z;
    r.range(c, n, 5000 /* 5e3 */);
    a.range(l, d, 5000 /* 5e3 */);
    var u = s.clone();
    u.a = 0;
    for (let e = r.minTickLevel; e <= r.maxTickLevel; ++e) {
      var _ = r.tickRatios[e];
      if (_ > 0) {
        var p = r.ticksAtLevel(e, true);
        for (let e = 0; e < p.length; ++e) {
          var m = p[e];
          var g = s.clone();
          g.a = 200 * _;
          var v = Math.abs(m - h.x);
          g.a *= 1 - v / o;
          i.push(m, h.z);
          i.push(m, l);
          i.push(m, h.z);
          i.push(m, d);
          t.push(g.x, g.y, g.z, g.w);
          t.push(u.x, u.y, u.z, u.w);
          t.push(g.x, g.y, g.z, g.w);
          t.push(u.x, u.y, u.z, u.w);
        }
      }
    }
    for (let e = a.minTickLevel; e <= a.maxTickLevel; ++e) {
      var f = a.tickRatios[e];
      if (f > 0) {
        var C = a.ticksAtLevel(e, true);
        for (let e = 0; e < C.length; ++e) {
          var k = C[e];
          var x = s.clone();
          x.a = 200 * f;
          var T = Math.abs(k - h.z);
          x.a *= 1 - T / o;
          i.push(h.x, k);
          i.push(c, k);
          i.push(h.x, k);
          i.push(n, k);
          t.push(x.x, x.y, x.z, x.w);
          t.push(u.x, u.y, u.z, u.w);
          t.push(x.x, x.y, x.z, x.w);
          t.push(u.x, u.y, u.z, u.w);
        }
      }
    }
  }
  updateGrid() {
    if (!this._hide) {
      var i = [];
      var e = [];
      var t = [];
      this._updateGridData(i, e, this._lineColor, _lineEnd);

      if (i.length > 0) {
        for (let e = 0; e < i.length; e += 2) {
          t.push(e / 2);
        }

        utils_1.CameraUtils.updateVBAttr(
          this._gridMeshComp,
          cc_1.gfx.AttributeName.ATTR_POSITION,
          i
        );

        utils_1.CameraUtils.updateVBAttr(
          this._gridMeshComp,
          cc_1.gfx.AttributeName.ATTR_COLOR,
          e
        );

        utils_1.CameraUtils.updateIB(this._gridMeshComp, t);
      }
    }
  }
}
exports.Grid = Grid;
