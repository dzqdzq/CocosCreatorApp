var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.physics2DMgr = undefined;
exports.Physics2DManager = undefined;
const sharp_1 = __importDefault(require("sharp"));
const marching_squares_1 = __importDefault(require("./marching-squares"));
const rdp_1 = __importDefault(require("./rdp"));
function pointEqual(t, e) {
  return t.x === e.x && t.y === e.y;
}
class Physics2DManager {
  getContourPoints(t, i) {
    return new Promise((r, s) => {
      (0, sharp_1.default)(t)
        .extract({ left: i.left, top: i.top, width: i.width, height: i.height })
        .rotate(i.isRotated ? 90 : 0)
        .raw()
        .toBuffer((t, e) => {
          (t
            ? s
            : ((t = marching_squares_1.default.getBlobOutlinePoints(
                e,
                i.width,
                i.height,
                i.loop
              )),
              (t = (0, rdp_1.default)(t, i.threshold)).length > 0 &&
                pointEqual(t[0], t[t.length - 1]) &&
                --t.length,
              r))(t);
        });
    });
  }
}
const physics2DMgr = new (exports.Physics2DManager = Physics2DManager)();
exports.physics2DMgr = physics2DMgr;
