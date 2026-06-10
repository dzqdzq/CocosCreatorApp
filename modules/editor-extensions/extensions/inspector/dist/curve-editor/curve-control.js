var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const hermite_1 = __importDefault(require("./hermite"));
const PIXEL_RANGE = 20;

const UINT8_COLOR_DEFAULT = Array(4 * PIXEL_RANGE * PIXEL_RANGE)
  .fill(0)
  .toString();

const DEFAULT_CTRL_COLOR = "rgba(255, 0, 0, 0.1)";
const CLICK_RANGE = 5;
const Point = require("./utils").Point;
const mouseDownPoint = { startX: 0, startY: 0 };
class CurveControl extends events_1.EventEmitter {
  get ctrlKey() {
    return this.hermite.ctrlKey;
  }
  constructor(t) {
    super();
    this.changeType = "";
    this.isShowCtrl = false;
    this.isShowPoint = false;
    this.isShowAuxin = false;
    this.isBindHandle = false;
    this.negative = false;
    this.flags = {
      flag: false,
      tanDrag: false,
      curveDrag: false,
      keyDrag: false,
    };
    this.grid = t.grid;
    this.ctrlConfig = t.ctrlConfig;
    this.cxt2D = t.context;
    this.canvas = t.context.canvas;

    this.hermite = new hermite_1.default({
      context: t.mainCtx,
      ctrlConfig: t.ctrlConfig,
      grid: t.grid,
      curveConfig: t.curveConfig,
      range: t.range,
    });

    var { top: t, left } = this.canvas.getBoundingClientRect();
    this.position = { top: t, left: left };
  }
  rePaint() {
    this.clear();
    this.grid.rePaint();
    this.hermite.rePaint();
    this.initControl();
  }
  update(t, i) {
    this.negative = i;
    this.hermite.negative = i;
    this.grid.negative = i;
    this.clear();
    this.hermite.clear();
    for (const e of t) {
      e.inTangent =
        typeof e.inTangent == "number" ? e.inTangent : Number.POSITIVE_INFINITY;

      e.outTangent =
        typeof e.outTangent == "number"
          ? e.outTangent
          : Number.POSITIVE_INFINITY;
    }
    this.draw(t);
  }
  draw(t) {
    this.cxt2D.strokeStyle = DEFAULT_CTRL_COLOR;
    this.hermite.draw(t);
    this.hermite.update(this.cxt2D);
    this.initControl();
  }
  initControl() {
    var { radius, fillColor, strokeStyle } = this.ctrlConfig;
    this.cxt2D.fillStyle = fillColor;
    this.cxt2D.strokeStyle = strokeStyle;
    for (const r of this.ctrlKey) {
      var s = this.grid.axisToCanvas(r.point);
      this.cxt2D.beginPath();
      this.cxt2D.arc(s.x, s.y, radius, 0, 2 * Math.PI);
      this.cxt2D.closePath();
      this.cxt2D.stroke();
      this.cxt2D.fill();
    }

    if (!this.isBindHandle) {
      this.bindHandler();
    }
  }
  resetCtrl(t) {
    if (
      (this.isShowCtrl || this.isShowAuxin) &&
      ((this.isShowAuxin = false),
      (this.isShowCtrl = false),
      this.cxt2D.clearRect(0, 0, this.canvas.width, this.canvas.height),
      (this.cxt2D.strokeStyle = DEFAULT_CTRL_COLOR),
      this.hermite.update(this.cxt2D),
      this.initControl(),
      t)
    ) {
      this.ctrlPoints = null;
    }
  }
  bindHandler() {
    this.isBindHandle = true;

    this.canvas.addEventListener("mousedown", (t) => this.onMouseDown(t));

    this.canvas.addEventListener("mousemove", (t) => this.onMouseMove(t));

    document.addEventListener("mouseup", (t) => this.onMouseUp(t));
  }
  onMouseDown(t) {
    this.flags.flag = false;
    var i = this.ctrlConfig.radius;
    const { offsetX, offsetY } = t;
    var r = this.cxt2D.getImageData(
      offsetX - PIXEL_RANGE / 2,
      offsetY - PIXEL_RANGE / 2,
      PIXEL_RANGE,
      PIXEL_RANGE
    );
    mouseDownPoint.startX = t.x;
    mouseDownPoint.startY = t.y;
    for (const l of this.ctrlKey) {
      var { x, y } = l.point.canvas;
      if (
        Math.abs(offsetX - x) < 2 * CLICK_RANGE + i &&
        Math.abs(offsetY - y) < 2 * CLICK_RANGE + i
      ) {
        if (t.button !== 2) {
          this.flags.flag = true;
          this.flags.keyDrag = true;
          this.canvas.style.cursor = "move";
          this.showCtrl(l);
          return void this.showPoint(
            this.hermite.keyFrames[l.index],
            l.point.canvas
          );
        }
        {
          const c = this;
          return void Editor.Menu.popup({
            x: t.pageX,
            y: t.pageY,
            menu: [
              {
                label: "Delete Key",
                click() {
                  c.delKeyFrame(l.index);
                },
              },
            ],
          });
        }
      }
    }
    if (this.isShowCtrl && this.ctrlPoints) {
      for (const g of Object.keys(this.ctrlPoints)) {
        var x_1 = this.ctrlPoints[g];
        if (x_1.canvas && g !== "point") {
          var { x: x_1, y: y_1 } = n.canvas;
          if (
            Math.abs(offsetX - x_1) < CLICK_RANGE + i &&
            Math.abs(offsetY - y_1) < CLICK_RANGE + i
          ) {
            this.flags.tanDrag = true;
            this.flags.flag = true;
            return void (this.ctrlPoints.type = g);
          }
        }
      }
    }
    if (r.data.toString() !== UINT8_COLOR_DEFAULT) {
      this.flags.flag = true;

      if (t.button === 2) {
        const u = this;
        Editor.Menu.popup({
          x: t.pageX,
          y: t.pageY,
          menu: [
            {
              label: "Add Key",
              click() {
                u.addKeyFrame(offsetX);
              },
            },
          ],
        });
      } else {
        this.lightCurve();
        this.canvas.style.cursor = "ns-resize";

        if (!this.flags.tanDrag && !this.flags.keyDrag) {
          this.flags.curveDrag = true;
        }
      }
    }

    if (!this.flags.flag) {
      this.resetCtrl("hideCtrl");
    }
  }
  onMouseMove(t) {
    var i;
    var e;
    var s;
    var r;
    var { curveDrag, tanDrag, keyDrag } = this.flags;

    if (tanDrag || curveDrag || keyDrag) {
      ({ offsetX: t, offsetY: i, movementY: e, x: s, y: r } = t);

      Math.abs(s - mouseDownPoint.startX) < 0.5 ||
        Math.abs(r - mouseDownPoint.startY) < 0.5 ||
        (tanDrag
          ? ((this.changeType = "tangent"),
            this.updateTan(t, i),
            this.emitChange())
          : keyDrag
          ? (this.moveKey(t, i), this.emitChange())
          : curveDrag &&
            e !== 0 &&
            this.hermite.moveY(-e) &&
            ((this.changeType = "curve"),
            this.emitChange(),
            this.hermite.clear(),
            this.hermite.update(),
            this.resetCtrl(),
            this.lightCurve()));
    }
  }
  onMouseUp(t) {
    this.flags.tanDrag = false;
    this.flags.curveDrag = false;
    this.flags.keyDrag = false;
    this.isShowPoint = false;
    this.canvas.style.cursor = "default";

    if (this.changeType) {
      this.emitChange();
      this.emitConfirm();
      this.changeType = "";
    }
  }
  moveKey(t, i) {
    t -= this.position.left;
    this.changeType = "keyframe";
    t = this.hermite.moveKey(t, i, this.ctrlPoints.index);
    this.ctrlPoints.index = t;
    this.refreshRender();
  }
  delKeyFrame(t) {
    this.hermite.delKeyFrame(t);
    this.ctrlPoints = null;
    this.refreshRender();
    this.clear();
    this.initControl();
  }
  addKeyFrame(t) {
    var i = this.hermite.addKeyFrame(t);

    if (i === null) {
      console.warn("添加点无效", t);
    } else {
      this.emitChange();
      this.emitConfirm();
      t = this.ctrlKey[i];
      this.initControl();
      this.drawCtrl(t);
    }
  }
  updateTan(t, i) {
    var { index, type } = this.ctrlPoints;
    var { point, isBroken } = this.ctrlKey[index];
    let a = 0;

    if (
      (a =
        Math.abs(t - point.canvas.x) - 10 < 0
          ? Number.POSITIVE_INFINITY
          : -(i - point.canvas.y) / (t - point.canvas.x)) !==
        Number.NEGATIVE_INFINITY &&
      a !== Number.POSITIVE_INFINITY
    ) {
      isBroken
        ? this.hermite.updateTan(index, a, type)
        : (this.hermite.updateTan(index, a, "inTangent"),
          this.hermite.updateTan(index, a, "outTangent"));

      this.refreshRender();
      this.drawCtrl(this.ctrlKey[index]);
    }
  }
  refreshRender() {
    var t;
    this.hermite.clear();
    this.hermite.update();
    this.resetCtrl();
    this.lightCurve();

    if (
      this.ctrlPoints &&
      ((t = this.ctrlPoints.index),
      (this.ctrlPoints = this.ctrlKey[t]),
      this.drawCtrl(this.ctrlPoints),
      this.isShowPoint)
    ) {
      this.showPoint(this.hermite.keyFrames[t], this.ctrlPoints.point.canvas);
    }
  }
  clear() {
    var { x, y, w, h } = this.grid.location;
    this.cxt2D.clearRect(0, 0, w + 2 * x, h + 2 * y);
  }
  lightCurve() {
    var t = this.ctrlConfig.focusColor;
    this.cxt2D.strokeStyle = t;
    this.hermite.update(this.cxt2D);
    this.isShowAuxin = true;
  }
  showCtrl(t) {
    if (!this.ctrlPoints || this.ctrlPoints.index !== t.index) {
      this.ctrlPoints && (this.resetCtrl(), this.lightCurve());
      this.drawCtrl(t);
    }
  }
  showPoint(t, i) {
    var e;

    if (t) {
      this.isShowPoint = true;
      ({ x: i, y: e } = i);
      this.cxt2D.save();
      this.cxt2D.fillStyle = "black";
      this.cxt2D.fillRect(i - 30, e - 28, 50, 18);
      this.cxt2D.fillStyle = "white";
      this.cxt2D.fillText(t.time + "," + t.value, i - 25, e - 15);
      this.cxt2D.restore();
    }
  }
  drawCtrl(t, i = this.cxt2D) {
    this.isShowCtrl = true;
    var { point: t, inPoint, outPoint } = (this.ctrlPoints = t);
    var { radius, fillColor } = this.ctrlConfig;
    i.save();
    i.fillColor = fillColor;
    i.strokeStyle = "white";

    if (inPoint) {
      inPoint.type = "outTangent";
      this.drawLine(t.canvas, inPoint.canvas);
      this.drawArc(inPoint.canvas, radius);
      this.ctrlPoints.inPoint = inPoint;
    }

    if (outPoint) {
      outPoint.type = "inTangent";
      this.drawLine(t.canvas, outPoint.canvas);
      this.drawArc(outPoint.canvas, radius);
      this.ctrlPoints.outPoint = outPoint;
    }

    i.restore();
  }
  drawLine(t, i, e = this.cxt2D) {
    e.beginPath();
    e.moveTo(t.x, t.y);
    e.lineTo(i.x, i.y);
    e.closePath();
    e.stroke();
  }
  drawArc(t, i, e = this.cxt2D) {
    e.beginPath();
    e.moveTo(t.x, t.y);
    e.arc(t.x, t.y, i, 0, 2 * Math.PI);
    e.closePath();
    e.stroke();
    e.fill();
  }
  emitConfirm() {
    this.emit("confirm", {
      keyFrames: Array.from(this.hermite.keyFrames),
      multiplier: this.grid.multiplier,
    });
  }
  emitChange() {
    this.emit("change", {
      keyFrames: Array.from(this.hermite.keyFrames),
      multiplier: this.grid.multiplier,
    });
  }
}
exports.default = CurveControl;
