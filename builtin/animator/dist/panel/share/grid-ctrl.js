Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAxisY = undefined;
exports.syncAxisX = undefined;
exports.gridCtrl = undefined;
const utils_1 = require("../utils");
const grid_1 = require("../vm/grid");
class GridCtrl {
  _gridCanvas = null;
  _grid = null;
  startOffset = 10;
  $left = null;
  $right = null;
  get grid() {
    return this._grid;
  }
  get gridCanvas() {
    return this._gridCanvas;
  }
  get scale() {
    return this.grid?.xAxisScale ?? 100;
  }
  init(t) {
    var { $canvas, $left, $right, $xAxis, showType } = t;

    var $left =
      (($canvas.width = $right.offsetWidth),
      ($canvas.height = $right.offsetHeight),
      (this._gridCanvas = $canvas),
      (this.$left = $left),
      (this.$right = $right),
      $canvas.getContext("2d"));

    this._grid = new grid_1.Grid({
      context: $left,
      lineWidth: 0.5,
      showType: showType || "time",
      color: "#333846",
      axis: {
        container: { x: $xAxis },
        startOffset: this.startOffset,
        lods: [10, 2],
        minScale: t.minScale || 1,
        maxScale: t.maxScale || 50,
        sample: 60,
      },
      hformat: utils_1.transFrameByTypeInGrid,
    });

    this._grid.xAxisScaleAt(this.$left.offsetWidth, 20);
  }
  getFrameRang() {
    var t;
    return this.grid && this.gridCanvas
      ? ((t = this.gridCanvas.width),
        {
          start: Math.ceil(
            this.grid.pixelToValueH(this.startOffset + this.grid.xAxisScale / 2)
          ),
          end: Math.floor(
            this.grid.pixelToValueH(
              this.startOffset + t - this.grid.xAxisScale / 2
            )
          ),
        })
      : { start: 0, end: 0 };
  }
  checkOverFlow(t) {
    var e = this.getFrameRang();
    return e ? (t > e.end ? t - e.end : t < e.start ? t - e.start : 0) : 0;
  }
  pageToFrame(t) {
    var e;
    return this.grid
      ? ((t = t - this.$left.getBoundingClientRect().right),
        (e = Math.round(this.grid.pixelToValueH(Math.abs(t)))),
        t > 0 ? e : -e)
      : 0;
  }
  pageToCtrl(t, e) {
    return {
      x: (t -= this.$left.getBoundingClientRect().right),
      y: (e -= this.$left.getBoundingClientRect().top),
    };
  }
  frameToCanvas(t) {
    let e = 0;

    if (this.grid) {
      e = this.grid.valueToPixelH(t) - this.grid.xAxisOffset;
    }

    return Number(e);
  }
  canvasToFrame(t) {
    return this.grid
      ? Math.max(
          0,
          Math.round(this.grid.pixelToValueH(t + this.grid.xAxisOffset))
        )
      : 0;
  }
}
exports.gridCtrl = new GridCtrl();
var grid_2 = require("../vm/grid");

Object.defineProperty(exports, "syncAxisX", {
  enumerable: true,
  get() {
    return grid_2.syncAxisX;
  },
});

Object.defineProperty(exports, "syncAxisY", {
  enumerable: true,
  get() {
    return grid_2.syncAxisY;
  },
});
