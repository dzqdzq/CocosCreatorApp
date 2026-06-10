Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeAdapter = undefined;
exports.WebAdapter = undefined;
const MaxScale = 4;
const MinScale = 0.1;
class DeviceAdapter {
  _screenWidth = 1500;
  _screenHeight = 1000 /* 1e3 */;
  _scale = 1;
  _enable = false;
  _engineWidth = 0;
  _engineHeight = 0;
  _offsetX = 0;
  _offsetY = 0;
  get screenWidth() {
    return this._screenWidth;
  }
  set screenWidth(e) {
    this._screenWidth = e;
  }
  get screenHeight() {
    return this._screenHeight;
  }
  set screenHeight(e) {
    this._screenHeight = e;
  }
  get width() {
    return this._engineWidth;
  }
  set width(e) {
    this._engineWidth = e;
  }
  get height() {
    return this._engineHeight;
  }
  set height(e) {
    this._engineHeight = e;
  }
  get scale() {
    return this._scale;
  }
  get enable() {
    return this._enable;
  }
  set enable(e) {
    this._enable = e;
  }
  _limitScale() {
    if (this._scale > MaxScale) {
      console.warn("preview:the biggest scale is 400%");
      this._engineWidth *= MaxScale / this._scale;
      this._engineHeight *= MaxScale / this._scale;
      this._scale = MaxScale;
    } else if (this._scale < MinScale) {
      console.warn("preview:the smallest scale is 10%");
      this._engineWidth *= MinScale / this._scale;
      this._engineHeight *= MinScale / this._scale;
      this._scale = MinScale;
    }
  }
  fitScreen(e, t, i = false, s = false, h = 1) {
    var n;
    var a;
    var _;
    var r;
    e /= window.devicePixelRatio;
    t /= window.devicePixelRatio;

    if (i) {
      (i = this._screenWidth) / (_ = this._screenHeight) <
      (r = (n = s ? t : e) / (a = s ? e : t))
        ? ((this._engineWidth = i),
          (this._engineHeight = i / r),
          (this._scale = this._engineWidth / n))
        : ((this._engineHeight = _),
          (this._engineWidth = _ * r),
          (this._scale = this._engineHeight / a));

      this._limitScale();
    } else {
      i = s ? e : t;
      this._engineWidth = (s ? t : e) * h;
      this._engineHeight = i * h;
      this._scale = h;
    }
  }
  ratioToSize(e, t) {
    var i = this._screenWidth;
    var s = this._screenHeight;
    var e = e / t;
    let h = 0;
    let n = 0;

    if (i / s < e) {
      h = i;
      n = i / e;
    } else {
      n = s;
      h = s * e;
    }

    return { width: h, height: n };
  }
  reset(e, t) {
    this._engineHeight = t;
    this._engineWidth = e;
    this._screenHeight = t;
    this._screenWidth = e;
    this._scale = 1;
    this._offsetX = 0;
    this._offsetY = 0;
  }
  get offsetX() {
    return this._enable ? this._offsetX : 0;
  }
  set offsetX(e) {
    if (this._enable) {
      this._offsetX = e;
    }
  }
  get offsetY() {
    return this._enable ? this._offsetY : 0;
  }
  set offsetY(e) {
    if (this._enable) {
      this._offsetY = e;
    }
  }
}
const WebAdapter = new DeviceAdapter();
exports.WebAdapter = WebAdapter;
const NativeAdapter = new DeviceAdapter();
exports.NativeAdapter = NativeAdapter;
