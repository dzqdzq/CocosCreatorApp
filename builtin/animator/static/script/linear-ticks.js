const EditorMath = Editor.Utils.Math;
class LinearTicks {
  constructor() {
    this.ticks = [];
    this.tickLods = [];
    this.tickRatios = [];
    this.minScale = 0.1;
    this.maxScale = 1000 /* 1e3 */;
    this.minValueScale = 1;
    this.maxValueScale = 1;
    this.minValue = -500;
    this.maxValue = 500;
    this.pixelRange = 500;
    this.minSpacing = 10;
    this.maxSpacing = 80;
  }
  initTicks(i, t, s) {
    if ((s = s <= 0 ? 1 : s) < (t = t <= 0 ? 1 : t)) {
      s = t;
    }

    this.tickLods = i;
    this.minScale = t;
    this.maxScale = s;
    this.ticks = [];
    let h = 1;
    let a = 0;
    this.ticks.push(h);
    var e = t;
    var c = s;
    let l = 1;
    let n = 1;

    while (h * this.tickLods[a] <= c) {
      h *= this.tickLods[a];
      a = a + 1 > this.tickLods.length - 1 ? 0 : a + 1;
      this.ticks.push(h);
      l = h;
    }

    this.minValueScale = (1 / l) * 100;
    a = this.tickLods.length - 1;

    for (h = 1; h / this.tickLods[a] >= e; ) {
      h /= this.tickLods[a];
      a = a - 1 < 0 ? this.tickLods.length - 1 : a - 1;
      this.ticks.unshift(h);
      n = h;
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
      var h =
        (this.ticks[i] * this.pixelRange) / (this.maxValue - this.minValue);
      this.tickRatios[i] =
        (h - this.minSpacing) / (this.maxSpacing - this.minSpacing);

      if (this.tickRatios[i] >= 1) {
        this.maxTickLevel = i;
      }

      if (h <= this.minSpacing) {
        this.minTickLevel = i;
        break;
      }
    }
    for (let i = this.minTickLevel; i <= this.maxTickLevel; i++) {
      this.tickRatios[i] = EditorMath.clamp01(this.tickRatios[i]);
    }
    return this;
  }
  ticksAtLevel(t, s) {
    var h = [];
    var a = this.ticks[t];
    var e = Math.floor(this.minValue / a);
    var c = Math.ceil(this.maxValue / a);
    for (let i = e; i <= c; i++) {
      if (
        !s ||
        t >= this.maxTickLevel ||
        i % Math.round(this.ticks[t + 1] / a) != 0
      ) {
        h.push(i * a);
      }
    }
    return h;
  }
  levelForStep(t) {
    for (let i = 0; i < this.ticks.length; i++) {
      if (
        t <=
        (this.ticks[i] * this.pixelRange) /
          Math.floor(this.maxValue - this.minValue)
      ) {
        return i;
      }
    }
    return -1;
  }
}
module.exports = LinearTicks;
