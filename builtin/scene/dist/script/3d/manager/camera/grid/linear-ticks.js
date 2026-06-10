var __importDefault =
  (this && this.__importDefault) ||
  ((i) => (i && i.__esModule ? i : { default: i }));
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = __importDefault(require("../../../../utils/math"));
class LinearTicks {
  ticks = [];
  tickLods = [];
  tickRatios = [];
  minScale = 0.1;
  maxScale = 1000 /* 1e3 */;
  minValueScale = 1;
  maxValueScale = 1;
  minValue = -500;
  maxValue = 500;
  pixelRange = 500;
  minSpacing = 10;
  maxSpacing = 80;
  minTickLevel = 0;
  maxTickLevel = 0;
  constructor() {}
  initTicks(i, t, s) {
    if ((s = s <= 0 ? 1 : s) < (t = t <= 0 ? 1 : t)) {
      s = t;
    }

    this.tickLods = i;
    this.minScale = t;
    this.maxScale = s;
    this.ticks = [];
    let e = 1;
    let a = 0;
    this.ticks.push(e);
    var h = t;
    var c = s;
    let l = 1;
    let n = 1;

    while (e * this.tickLods[a] <= c) {
      e *= this.tickLods[a];
      a = a + 1 > this.tickLods.length - 1 ? 0 : a + 1;
      this.ticks.push(e);
      l = e;
    }

    this.minValueScale = (1 / l) * 100;
    a = this.tickLods.length - 1;

    for (e = 1; e / this.tickLods[a] >= h; ) {
      e /= this.tickLods[a];
      a = a - 1 < 0 ? this.tickLods.length - 1 : a - 1;
      this.ticks.unshift(e);
      n = e;
    }

    this.maxValueScale = (1 / n) * 100;
    return this;
  }
  spacing(i, t) {
    this.minSpacing = i;
    this.maxSpacing = t;
    return this;
  }
  range(i, t, s) {
    this.minValue = Math.fround(Math.min(i, t));
    this.maxValue = Math.fround(Math.max(i, t));
    this.pixelRange = s;
    this.minTickLevel = 0;
    this.maxTickLevel = this.ticks.length - 1;
    for (let i = this.ticks.length - 1; i >= 0; i--) {
      var e =
        (this.ticks[i] * this.pixelRange) / (this.maxValue - this.minValue);
      this.tickRatios[i] =
        (e - this.minSpacing) / (this.maxSpacing - this.minSpacing);

      if (this.tickRatios[i] >= 1) {
        this.maxTickLevel = i;
      }

      if (e <= this.minSpacing) {
        this.minTickLevel = i;
        break;
      }
    }
    for (let i = this.minTickLevel; i <= this.maxTickLevel; i++) {
      this.tickRatios[i] = math_1.default.clamp01(this.tickRatios[i]);
    }
    return this;
  }
  ticksAtLevel(t, s) {
    var e = [];
    var a = this.ticks[t];
    var h = Math.floor(this.minValue / a);
    var c = Math.ceil(this.maxValue / a);
    for (let i = h; i <= c; i++) {
      if (
        !s ||
        t >= this.maxTickLevel ||
        i % Math.round(this.ticks[t + 1] / a) != 0
      ) {
        e.push(i * a);
      }
    }
    return e;
  }
  levelForStep(t) {
    for (let i = 0; i < this.ticks.length; i++) {
      if (
        t <=
        (this.ticks[i] * this.pixelRange) / (this.maxValue - this.minValue)
      ) {
        return i;
      }
    }
    return -1;
  }
}
exports.default = LinearTicks;
