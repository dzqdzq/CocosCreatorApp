Object.defineProperty(exports, "__esModule", { value: true });
exports.Grid = undefined;
exports.syncAxisX = syncAxisX;
exports.syncAxisY = syncAxisY;
const Chroma = require("chroma-js");
const HALF_TEXT_WIDTH = 5;
const POINT_LENGTH = 2;
const LinearTicks = require("./../../../../static/script/linear-ticks.js");
const clamp = Editor.Utils.Math.clamp;
class Grid {
  set cxt2D(t) {
    this.canvas = t.canvas;
    this._cxt2D = t;
  }
  get cxt2D() {
    return this._cxt2D;
  }
  location;
  step;
  sample;
  xAxisScale = 1;
  xAxisOffset = 0;
  xAnchor = 0.5;
  yAxisScale = 1;
  yAxisOffset = 0;
  yAnchor = 0.5;
  labelShowType = "time";
  lineColor;
  _lineColor;
  axis;
  _cxt2D;
  canvas;
  hticks;
  startOffset;
  xMinRange;
  xMaxRange;
  container;
  hformat;
  get xMinScale() {
    return this.hticks.minValueScale;
  }
  get xMaxScale() {
    return this.hticks.maxValueScale;
  }
  constructor(t) {
    this.cxt2D = t.context;
    this.axis = t.axis;
    this.labelShowType = t.showType;
    this.cxt2D.lineWidth = t.lineWidth || 1;
    this.lineColor = t.color || "#ccc";
    this._lineColor = Chroma(this.lineColor);
    this.hticks = new LinearTicks();
    var { lods, minScale, maxScale, sample, startOffset, container } =
      this.axis;
    this.xAxisOffset = startOffset || 0;
    this.startOffset = startOffset || 0;
    this.sample = sample;
    this.container = container;
    this.hticks.initTicks(lods, minScale, maxScale, sample).spacing(10, 20);

    this.xAxisScale = clamp(
      this.xAxisScale,
      this.hticks.minValueScale,
      this.hticks.maxValueScale
    );

    this.hformat = t.hformat;
  }
  updateScale(t, i) {
    var { lods, sample } = this.axis;
    this.hticks.initTicks(lods, t, i, sample).spacing(10, 20);
  }
  xAxisScaleAt(t, i) {
    var s = this.pixelToValueH(t);

    var i =
      ((this.xAxisScale = clamp(
        i,
        this.hticks.minValueScale,
        this.hticks.maxValueScale
      )),
      this.valueToPixelH(s));

    this.transferX(t - i);
    return this.xAxisScale;
  }
  transferX(e) {
    if (!(this.xAxisOffset === this.startOffset && e > 0)) {
      let t = this.xAxisOffset + e;

      if (t > this.startOffset) {
        t = this.startOffset;
      }

      let i;
      let s;

      if (this.xMinRange !== undefined && this.xMinRange !== null) {
        i = this.valueToPixelH(this.xMinRange);
      }

      if (this.xMaxRange !== undefined && this.xMaxRange !== null) {
        s = this.valueToPixelH(this.xMaxRange);
        s = Math.max(0, s - this.canvas.width);
      }

      this.xAxisOffset = t;

      if (i !== undefined && s !== undefined) {
        this.xAxisOffset = clamp(this.xAxisOffset, -s, -i);
      } else if (i !== undefined) {
        this.xAxisOffset = Math.min(this.xAxisOffset, -i);
      } else if (s !== undefined) {
        this.xAxisOffset = Math.max(this.xAxisOffset, -s);
      }
    }
  }
  resize(t, i) {
    var s;

    if (!t || !i) {
      s = this.canvas.getBoundingClientRect();
      t = t || s.width;
      i = i || s.height;
      t = Math.round(t);
      i = Math.round(i);
    }

    if (this.canvas.width !== t || this.canvas.height !== i) {
      this.canvas.width = t;
      this.canvas.height = i;
      this.render();
    }
  }
  render() {
    this.clear();
    this.updateGrids();
    this.updateLabels();
  }
  pixelToValueH(t) {
    return (t - this.xAxisOffset) / this.xAxisScale;
  }
  valueToPixelH(t) {
    return t * this.xAxisScale + this.xAxisOffset;
  }
  updateLabels() {
    if (this.container) {
      var t = this.hticks.levelForStep(30);
      var t = this.hticks.ticksAtLevel(t, false);
      let e = "";

      t.forEach((t) => {
        var i = Math.floor(this.valueToPixelH(t));
        var t = this.hformat(t, this.labelShowType, this.sample);
        var s = (t.toString().length / 2) * 4;
        e += `<span style="transform: translateX(${Math.floor(
          i - this.startOffset - s
        )}px);">${t}</span>`;
      });

      this.container.x.innerHTML = e;
    }
  }
  clear() {
    this.cxt2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  updateGrids() {
    var i;
    var s;
    var t = this.pixelToValueH(0);
    var e = this.pixelToValueH(this.canvas.width);
    this.hticks.range(t, e, this.canvas.width);
    for (let t = this.hticks.minTickLevel; t <= this.hticks.maxTickLevel; ++t) {
      if (0 < (i = this.hticks.tickRatios[t])) {
        this.cxt2D.strokeStyle = `rgba(${this._lineColor.rgb().toString()}, ${
          3 * i
        })`;
        for (const a of this.hticks.ticksAtLevel(t, true)) {
          this.cxt2D.beginPath();
          s = this.valueToPixelH(a);
          this.cxt2D.moveTo(Math.floor(s) + 0.5, 35);
          this.cxt2D.lineTo(Math.floor(s) + 0.5, this.canvas.height);
          this.cxt2D.stroke();
        }
      }
    }
  }
}
function syncAxisX(t, i) {
  i.xAxisScale = t.xAxisScale;
  i.xAxisOffset = t.xAxisOffset;
}
function syncAxisY(t, i) {
  i.yAxisScale = t.yAxisScale;
  i.yAxisOffset = t.yAxisOffset;
}
exports.Grid = Grid;
