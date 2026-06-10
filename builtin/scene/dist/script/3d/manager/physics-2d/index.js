var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.Physics2DManager = undefined;
const sharp_1 = __importDefault(require("sharp"));
const cc_1 = require("cc");
const marching_squares_1 = __importDefault(require("./marching-squares"));
const node_1 = __importDefault(require("../node"));
function getNodeRectPoints(e, t) {
  if (!e || (e.width === 0 && e.height === 0)) {
    return (
      t &&
      t(null, [
        new cc_1.Vec2(-50, -50),
        new cc_1.Vec2(50, -50),
        new cc_1.Vec2(50, 50),
        new cc_1.Vec2(-50, 50),
      ])
    );
  }
  var r = -e.anchorX * e.width;
  var o = -e.anchorY * e.height;
  var n = r + e.width;
  var e = o + e.height;

  if (t) {
    t(null, [
      new cc_1.Vec2(r, o),
      new cc_1.Vec2(r, e),
      new cc_1.Vec2(n, e),
      new cc_1.Vec2(n, o),
    ]);
  }
}
class Physics2DManager {
  async getContourPoints(e, r = { threshold: 1, loop: true }, o) {
    const n = e.getComponent(cc_1.UITransform);
    if (!n) {
      return getNodeRectPoints(n, o);
    }
    e = e.getComponent(cc_1.SpriteComponent);
    if (!e) {
      return getNodeRectPoints(n, o);
    }
    e = e.spriteFrame;
    if (!e) {
      return getNodeRectPoints(n, o);
    }
    var t = e._uuid.split("@")[0];
    var t = await Editor.Message.request("asset-db", "query-path", t);
    if (!t) {
      return getNodeRectPoints(n, o);
    }
    const i = require("./rdp");
    const c = e.getRect();

    let { width, height } = c;

    e = e.isRotated();

    if (e) {
      width = c.height;
      height = c.width;
    }

    (0, sharp_1.default)(t)
      .extract({ left: c.x, top: c.y, width: width, height: height })
      .rotate(e ? 90 : 0)
      .raw()
      .toBuffer((e, t) => {
        if (e) {
          return o && o(e);
        }
        e = marching_squares_1.default.getBlobOutlinePoints(
          t,
          c.width,
          c.height,
          r.loop
        );

        if (
          (e = i(e, r.threshold)).length > 0 &&
          e[0].equals(e[e.length - 1])
        ) {
          --e.length;
        }

        e.forEach((e) => {
          e.y = c.height - e.y;
          e.x *= n.width / c.width;
          e.y *= n.height / c.height;
          e.x -= n.anchorX * n.width;
          e.y -= n.anchorY * n.height;
        });

        cc_1.Physics2DUtils.PolygonSeparator.ForceCounterClockWise(e);

        if (o) {
          o(null, e);
        }
      });
  }
  resetPoints(r) {
    this.getContourPoints(
      r.node,
      { threshold: r.threshold, loop: true },
      (e, t) => {
        if (e) {
          return console.error(e);
        }
        e = cce.SceneFacadeManager.beginRecording(r.uuid);
        r.points = t;
        cce.SceneFacadeManager.endRecording(e);
        node_1.default.emit("change", r.node);
      }
    );
  }
  resetPointsByUuid(e) {
    var t = cce.Component.query(e);

    if (t) {
      this.resetPoints(t);
    } else {
      console.error(`Component with UUID ${e} does not exist!`);
    }
  }
}
exports.Physics2DManager = Physics2DManager;
exports.default = new Physics2DManager();
