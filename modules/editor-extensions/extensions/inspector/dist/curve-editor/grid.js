Object.defineProperty(exports, "__esModule", { value: true });
const HALF_TEXT_WIDTH = 5;
const POINT_LENGTH = 2;
const Point = require("./utils").Point;
class Grid {
  set cxt2D(t) {
    this.canvas = t.canvas;
    this._cxt2D = t;
  }
  get cxt2D() {
    return this._cxt2D;
  }
  set multiplier(t) {
    if (t !== 0) {
      this._multiplier = t;
      this.rePaint();
    }
  }
  get multiplier() {
    return this._multiplier;
  }
  set negative(t) {
    if (t !== this._negative) {
      this._negative = t;
      this.rePaint();
    }
  }
  get negative() {
    return this._negative;
  }
  get step() {
    var t = this.location.w / this.axis.piece;
    var i = this.location.h / this.axis.piece;
    var { rangeX, rangeY } = this.axis;
    var rangeX = Number((rangeX / this.axis.piece).toFixed(POINT_LENGTH));
    let a = Number((rangeY / this.axis.piece).toFixed(POINT_LENGTH));
    rangeY = Number((1 / this.axis.piece).toFixed(POINT_LENGTH));
    let h = Number((1 / this.axis.piece).toFixed(POINT_LENGTH));

    if (this.negative) {
      a *= 2;
      h *= 2;
    }

    return {
      spaceX: t,
      spaceY: i,
      stepX: rangeX,
      stepY: a,
      orgStepX: rangeY,
      orgStepY: h,
    };
  }
  get location() {
    return {
      x: this.axesMargin,
      y: this.axesMargin,
      w: this.canvas.width - 2 * this.axesMargin,
      h: this.canvas.height - 2 * this.axesMargin,
    };
  }
  constructor(t) {
    this._negative = false;
    this.cxt2D = t.context;
    this.axesMargin = t.axisMargin;
    this.axis = t.axis;
    this._multiplier = t.multiplier || 1;
    this.cxt2D.lineWidth = t.lineWidth;
    this.cxt2D.strokeStyle = t.color || "#333";
  }
  draw() {
    var { spaceX: x, spaceY: w } = this.step;

    var { x, w, h } =
      (this.drawGrid(spaceX / 4, spaceY / 2, "rgba(51, 51, 51, 0.44)", 0.5),
      this.negative
        ? this.drawGrid(spaceX, Number(spaceY), "#3a3939", 1)
        : this.drawGrid(spaceX, 2 * spaceY, "#3a3939", 1),
      this.location);

    this.cxt2D.strokeStyle = "#333";
    this.cxt2D.lineWidth = 1.5;

    if (this.negative) {
      this.cxt2D.beginPath();
      this.cxt2D.moveTo(x, h / 2 + x + 0.5);
      this.cxt2D.lineTo(w + x, h / 2 + x + 0.5);
      this.cxt2D.stroke();
    }

    this.drawAxis();
  }
  rePaint() {
    this.clear();
    this.draw();
  }
  axisToOri(t) {
    var { w, h } = this.location;
    let s;
    return {
      time: Number((t.x / w).toFixed(POINT_LENGTH)),
      value: (s = this.negative
        ? Number(((t.y / h) * 2).toFixed(POINT_LENGTH))
        : Number((t.y / h).toFixed(POINT_LENGTH))),
    };
  }
  tranToAxis(t) {
    var { w, h } = this.location;
    let s;
    s = this.negative ? (t.value * h) / 2 : t.value * h;
    h = t.time * w;
    return new Point({ x: h, y: s });
  }
  tranToCanvas(t) {
    t = this.tranToAxis(t);
    return this.axisToCanvas(t);
  }
  canvasToAxis(t) {
    var { x, y, h } = this.location;
    var x = t.x - x;
    let a = h - t.y + y;

    if (this.negative) {
      a = h / 2 - t.y + y;
    }

    return new Point({ x: x, y: a });
  }
  axisToCanvas(t) {
    var { x, y, h } = this.location;
    return this.negative
      ? new Point({ x: t.x + x, y: h / 2 - t.y + y })
      : new Point({ x: t.x + x, y: h - t.y + y });
  }
  clear() {
    var { x, y, w, h } = this.location;
    this.cxt2D.clearRect(x, y, w, h);
  }
  drawAxis() {
    this.cxt2D.lineWidth = 2;
    var { x: x_1, y, w, h: h_1 } = this.location;
    var { stepX, stepY, spaceX, spaceY } = this.step;
    this.cxt2D.clearRect(0, 0, this.axesMargin, h_1 + this.axesMargin);

    this.cxt2D.clearRect(
      0,
      h_1 + this.axesMargin,
      w + this.axesMargin,
      this.axesMargin
    );

    this.cxt2D.strokeRect(x_1, y, w, h_1);
    this.cxt2D.fillStyle = "#ccc";
    let n = x_1 - HALF_TEXT_WIDTH;
    let c = 0;

    while (n < x_1 + w) {
      this.cxt2D.fillText(c, n, y + h_1 + x_1 / 2);
      c = Number((c + stepX).toFixed(2));
      n += spaceX;
    }

    let o = y + h_1;
    let l = this.negative ? -1 * this.multiplier : 0;

    while (Math.ceil(o) >= y) {
      this.cxt2D.fillText(l, y / 2 - HALF_TEXT_WIDTH, o);
      l = Number((l + stepY * this.multiplier).toFixed(2));
      o -= spaceY;
    }
  }
  drawGrid(i, e, t, s) {
    if (s) {
      this.cxt2D.lineWidth = s;
    }

    if (t) {
      this.cxt2D.strokeStyle = t;
    }

    var { x: x_1, y, w, h } = this.location;
    for (let t = x_1; t < w + x_1; t += i) {
      this.cxt2D.beginPath();
      this.cxt2D.moveTo(t + 0.5, y);
      this.cxt2D.lineTo(t + 0.5, h + y);
      this.cxt2D.stroke();
    }
    for (let t = h + x_1; t > x_1; t -= e) {
      this.cxt2D.beginPath();
      this.cxt2D.moveTo(x_1, t + 0.5);
      this.cxt2D.lineTo(w + x_1, t + 0.5);
      this.cxt2D.stroke();
    }
  }
}
exports.default = Grid;
