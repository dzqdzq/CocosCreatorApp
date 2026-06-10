var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimVec3 = undefined;
const cc_1 = require("cc");
const math_1 = __importDefault(require("../../../utils/math"));
class AnimateValueBase {
  _start;
  _target;
  _speed = 0;
  defaultSpeed = 2;
  _isAnimating = false;
  _lerpPos = 0;
  constructor(t) {
    this._start = t;
    this._target = t;
  }
  get start() {
    return this._start;
  }
  get target() {
    return this._target;
  }
  set target(t) {
    if (t !== this._target) {
      this.startAnimating(t, this.value);
    }
  }
  get lerpPos() {
    var t = 1 - this._lerpPos;
    return 1 - t ** 4;
  }
  get value() {
    return this.lerpPos >= 1 ? this.target : this.getValue();
  }
  set value(t) {
    this.stopAnimating(t);
  }
  get isAnimating() {
    return this._isAnimating;
  }
  startAnimating(t, e, s = this.defaultSpeed) {
    this._speed = s;
    this._start = t;
    this._target = e;
    this._isAnimating = true;
    this._lerpPos = 0;
  }
  stopAnimating(t) {
    this._target = t;
    this._start = t;
    this._lerpPos = 1;
    this._isAnimating = false;
  }
  update(t) {
    if (
      this._isAnimating &&
      ((this._lerpPos = math_1.default.clamp01(
        this._lerpPos + t * this._speed
      )),
      this.lerpPos >= 1)
    ) {
      this._isAnimating = false;
    }
  }
  getValue() {
    return this._start;
  }
}
class AnimVec3 extends AnimateValueBase {
  _value = new cc_1.Vec3();
  constructor(t) {
    super(t ?? cc_1.Vec3.ZERO);
  }
  getValue() {
    cc_1.Vec3.lerp(this._value, this.start, this.target, this.lerpPos);
    return this._value;
  }
}
exports.AnimVec3 = AnimVec3;
