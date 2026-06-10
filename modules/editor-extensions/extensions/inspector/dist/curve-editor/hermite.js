Object.defineProperty(exports, "__esModule", { value: true });
const clamp = Editor.Utils.Math.clamp;
const { drawLine, calcHermite, calcFunc, Point } = require("./utils");
const POINT_LENGTH = 2;
class Hermite {
  get keyFrames() {
    return this._keyframes.map((t) => {
      var e = this.grid.axisToOri(t.point);
      var { w, h } = this.grid.location;
      return {
        ...e,
        inTangent: Number(((t.inTangent * w) / h).toFixed(POINT_LENGTH)),
        outTangent: Number(((t.outTangent * w) / h).toFixed(POINT_LENGTH)),
      };
    });
  }
  get ctrlKey() {
    return this._keyframes.map((t, e) => {
      t.index = e;
      var i = this.calcCtrl(e);

      var e =
        (e !== 0 && (t.inPoint = i.inPoint),
        e !== this._keyframes.length - 1 && (t.outPoint = i.outPoint),
        this.grid.axisToCanvas(t.point));

      t.point.canvas = e;
      return t;
    });
  }
  constructor(t) {
    this.negative = false;
    this.multi = 1;
    this.grid = t.grid;
    this.ctrlConfig = t.ctrlConfig;
    this.curveConfig = t.curveConfig;
    this.cxt2D = t.context;
    this.cxt2D.strokeStyle = t.curveConfig.strokeStyle;
    this.canvas = t.context.canvas;
    this.negative = !!t.range;
  }
  rePaint() {
    this.clear();
    this.cxt2D.strokeStyle = this.curveConfig.strokeStyle;
    for (const t of this._keyframes) {
      t.outTangent = t.outTangent / this.multi;
      t.inTangent = t.inTangent / this.multi;
    }
    this.draw(this._keyframes);
  }
  draw(t) {
    var e = this.cxt2D;
    var { w, h: h_1 } = this.grid.location;
    try {
      this._keyframes = require("lodash").cloneDeep(t);
    } catch (t) {
      return void console.error(t);
    }

    if (this.negative) {
      this.multi = h_1 / w / 2;
    } else {
      this.multi = h_1 / w;
    }

    for (const c of this._keyframes) {
      var s = this.grid.tranToAxis(c);
      c.outTangent *= this.multi;
      c.inTangent *= this.multi;
      c.point = s;
    }
    this.hermiteArgs = [];
    for (let t = 0; t < this._keyframes.length - 1; t++) {
      var r = this._keyframes[t + 1];
      var a = this._keyframes[t];

      this.hermiteArgs[t] = calcHermite(
        a.point,
        a.outTangent,
        r.point,
        r.inTangent
      );

      var h = calcFunc(this.hermiteArgs[t]);

      e.beginPath();
      for (let t = a.point.x; t <= r.point.x; t++) {
        var o = this.grid.axisToCanvas({ x: t, y: h(t) });
        e.lineTo(o.x, o.y);
      }

      if (
        a.outTangent === Number.POSITIVE_INFINITY ||
        r.inTangent === Number.POSITIVE_INFINITY
      ) {
        a = this.grid.axisToCanvas(r.point);
        e.lineTo(a.x, a.y);
      }

      e.stroke();
      e.closePath();
    }
    this.drawEdge();
  }
  updateTan(t, e, i) {
    var n;

    if (
      (t !== 0 || i !== "inTangent") &&
      (t !== this._keyframes.length - 1 || i !== "outTangent")
    ) {
      this._keyframes[t][i] = e;
      e = this._keyframes[t];

      i === "outTangent"
        ? ((n = this._keyframes[t + 1]),
          (this.hermiteArgs[t] = calcHermite(
            e.point,
            e.outTangent,
            n.point,
            n.inTangent
          )))
        : i === "inTangent" &&
          ((n = this._keyframes[t - 1]),
          (this.hermiteArgs[t - 1] = calcHermite(
            n.point,
            n.outTangent,
            e.point,
            e.inTangent
          )));
    }
  }
  addKeyFrame(e) {
    e -= this.grid.location.x;
    let i = null;
    for (let t = 0; t < this._keyframes.length - 1; t++) {
      var n = this._keyframes[t].point;
      var s = this._keyframes[t + 1].point;
      if (e > n.x && s.x > e) {
        i = t;
        break;
      }
    }
    var t;
    var r;
    return i === null
      ? null
      : ((t = this.calcSlope(e, i)),
        (r = calcFunc(this.hermiteArgs[i])(e)),
        this.hermiteArgs.splice(i + 1, 0, this.hermiteArgs[i]),
        this._keyframes.splice(i + 1, 0, {
          point: new Point({ x: e, y: r }),
          outTangent: t,
          inTangent: t,
        }),
        i + 1);
  }
  delKeyFrame(t) {
    var e = this._keyframes[t + 1];
    var i = this._keyframes[t - 1];

    if (e) {
      this.hermiteArgs.splice(t, 1);
    }

    if (i) {
      this.hermiteArgs.splice(t - 1, 1);
    }

    if (e && i) {
      i = calcHermite(i.point, i.outTangent, e.point, e.inTangent);
      this.hermiteArgs.splice(t - 1, 0, i);
    }

    this._keyframes.splice(t, 1);
  }
  update(e = this.cxt2D) {
    var i = this._keyframes;
    for (let t = 1; t < i.length; t++) {
      var n = i[t];
      var s = i[t - 1];
      var r = calcFunc(this.hermiteArgs[t - 1]);
      e.beginPath();
      for (let t = s.point.x; t <= n.point.x; t++) {
        var a = this.grid.axisToCanvas({ x: t, y: r(t) });
        e.lineTo(a.x, a.y);
      }

      if (
        s.outTangent === Number.POSITIVE_INFINITY ||
        n.inTangent === Number.POSITIVE_INFINITY
      ) {
        s = this.grid.axisToCanvas(n.point);
        e.lineTo(s.x, s.y);
      }

      e.stroke();
      e.closePath();
    }

    if (e === this.cxt2D) {
      this.drawEdge();
    }
  }
  moveY(e) {
    var i = this.grid.location.h;
    var n = JSON.parse(JSON.stringify(this._keyframes));
    for (let t = 0; t < this._keyframes.length; t++) {
      var s = this._keyframes[t];
      var s_point = s.point;
      if (s_point.y > i || s_point.y < 0) {
        this._keyframes = n;
        return false;
      }
      s_point.y += e;
      s_point.y = clamp(s_point.y, 0, i);
      s_point.canvas = this.grid.axisToCanvas(s_point);

      if (t < this._keyframes.length - 1) {
        s_point = this._keyframes[t + 1];

        this.hermiteArgs[t] = calcHermite(
          s.point,
          s.outTangent,
          s_point.point,
          s_point.inTangent
        );
      }
    }
    return true;
  }
  moveKey(t, e, i) {
    var n = this._keyframes[i];
    let s = this._keyframes[i + 1];
    let r = this._keyframes[i - 1];
    var n_point = n.point;
    var { w, h } = this.grid.location;
    let c = [0, h];

    if (this.negative) {
      c = [-h / 2, h / 2];
    }

    if (
      (n_point.x <= w && n_point.x >= 0) ||
      (n_point.y <= h && n_point.y >= 0)
    ) {
      h = this.grid.canvasToAxis({ x: t, y: e });
      n_point.x = clamp(h.x, 0, w);
      n_point.y = clamp(h.y, c[0], c[1]);

      s && n_point.x > s.point.x
        ? (this._keyframes.splice(i, 1),
          this._keyframes.splice(i + 1, 0, n),
          r &&
            (this.hermiteArgs[i - 1] = calcHermite(
              r.point,
              r.outTangent,
              s.point,
              s.inTangent
            )),
          i++,
          (r = s),
          (s = this._keyframes[i + 1]))
        : r &&
          n_point.x < r.point.x &&
          (this._keyframes.splice(i, 1),
          this._keyframes.splice(i - 1, 0, n),
          s &&
            (this.hermiteArgs[i] = calcHermite(
              r.point,
              r.outTangent,
              s.point,
              s.inTangent
            )),
          i--,
          (s = r),
          (r = this._keyframes[i - 1]));

      s &&
        (this.hermiteArgs[i] = calcHermite(
          n.point,
          n.outTangent,
          s.point,
          s.inTangent
        ));

      r &&
        (this.hermiteArgs[i - 1] = calcHermite(
          r.point,
          r.outTangent,
          n.point,
          n.inTangent
        ));
    }

    return i;
  }
  clear() {
    this.cxt2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  calcCtrl(t, e) {
    var i;
    var n = this._keyframes[t].point;
    let s = null;
    let r = null;

    if (e !== "outTangent") {
      i = this._keyframes[t].inTangent;
      r = this.calcCtrlPoint(n, i, "inTangent");
      r.canvas = this.grid.axisToCanvas(r);
    }

    if (e !== "inTangent") {
      i = this._keyframes[t].outTangent;
      s = this.calcCtrlPoint(n, i, "outTangent");
      s.canvas = this.grid.axisToCanvas(s);
    }

    return { outPoint: s, inPoint: r };
  }
  calcSlope(t, e) {
    var { a: e, b, c } = this.hermiteArgs[e];
    return 3 * e * t * t + 2 * b * t + c;
  }
  drawEdge() {
    var { w, x } = this.grid.location;
    var i = this.ctrlKey[0].point.canvas;
    var n = this.ctrlKey[this._keyframes.length - 1].point.canvas;
    this.cxt2D.save();
    this.cxt2D.strokeStyle = "rgba(255, 0, 0, 0.11)";
    drawLine({ x: 0, y: i.y }, i, this.cxt2D);
    drawLine({ x: 2 * x + w, y: n.y }, n, this.cxt2D);
    this.cxt2D.restore();
  }
  calcCtrlPoint(t, e, i) {
    var n = this.ctrlConfig.handlerSize;
    let s = 0;
    let r = 0;

    r =
      e !== Number.POSITIVE_INFINITY
        ? ((s = Math.sqrt((n * n) / (1 + e * e))),
          (s = i === "inTangent" ? t.x - s : t.x + s),
          t.y - e * (t.x - s))
        : ((s = t.x), i === "inTangent" ? t.y + n : t.y - n);

    return { x: s, y: r, type: i };
  }
}
exports.default = Hermite;
