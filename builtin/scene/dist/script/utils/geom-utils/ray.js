var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const enums_1 = __importDefault(require("./enums"));
class ray {
  static create(e = 0, c = 0, t = 0, r = 0, o = 0, s = 1) {
    return new ray(e, c, t, r, o, s);
  }
  static clone(e) {
    return new ray(e.o.x, e.o.y, e.o.z, e.d.x, e.d.y, e.d.z);
  }
  static copy(e, c) {
    cc_1.Vec3.copy(e.o, c.o);
    cc_1.Vec3.copy(e.d, c.d);
    return e;
  }
  static fromPoints(e, c, t) {
    cc_1.Vec3.copy(e.o, c);
    cc_1.Vec3.normalize(e.d, cc_1.Vec3.subtract(e.d, t, c));
    return e;
  }
  static set(e, c, t, r, o, s, u) {
    e.o.x = c;
    e.o.y = t;
    e.o.z = r;
    e.d.x = o;
    e.d.y = s;
    e.d.z = u;
    return e;
  }
  o;
  d;
  _type;
  constructor(e = 0, c = 0, t = 0, r = 0, o = 0, s = -1) {
    this._type = enums_1.default.SHAPE_RAY;
    this.o = new cc_1.Vec3(e, c, t);
    this.d = new cc_1.Vec3(r, o, s);
  }
  computeHit(e, c) {
    cc_1.Vec3.normalize(e, this.d);
    cc_1.Vec3.scaleAndAdd(e, this.o, e, c);
  }
}
exports.default = ray;
