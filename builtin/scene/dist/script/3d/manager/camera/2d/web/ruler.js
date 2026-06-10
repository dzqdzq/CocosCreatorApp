Object.defineProperty(exports, "__esModule", { value: true });
exports.Ruler = undefined;
class Ruler {
  hRulerCanvas;
  vRulerCanvas;
  hRulerCtx;
  vRulerCtx;
  rulerLen = 0;
  isShow = false;
  init() {
    this.hRulerCanvas = document.querySelector("#hLabels");
    this.vRulerCanvas = document.querySelector("#vLabels");

    var { width, height } = cc.screen.windowSize;
    this.hRulerCtx = this.hRulerCanvas.getContext("2d");
    this.vRulerCtx = this.vRulerCanvas.getContext("2d");
      
    this.hRulerCanvas.width = width;
    this.hRulerCanvas.height = this.rulerLen;
    this.vRulerCanvas.width = this.rulerLen;
    this.vRulerCanvas.height = height;
  }
  show(e) {
    this.isShow = e;
  }
  updateTicks(h) {
    var { width, height } = cc.screen.windowSize;
    this.hRulerCtx?.clearRect(0, 0, width, this.rulerLen);
    this.vRulerCtx?.clearRect(0, 0, this.rulerLen, height);

    if (this.isShow) {
      const r = 12 * cc.screen.devicePixelRatio + "px Arial";
      const s = "gray";
      width = h.hTicks.levelForStep(50);
      height = h.hTicks.ticksAtLevel(width, false);

      width =
        (this.hRulerCtx.beginPath(),
        height.forEach((e, t) => {
          e = Math.floor(10 * e) / 10;
          var i = Math.floor(this.valueToPixelH(e, h)) + 5;
          this.hRulerCtx.font = r;
          this.hRulerCtx.fillStyle = s;
          this.hRulerCtx.textBaseline = "bottom";
          this.hRulerCtx.fillText(e.toString(), i, this.rulerLen);
        }),
        this.hRulerCtx.closePath(),
        h.vTicks.levelForStep(50));

      height = h.vTicks.ticksAtLevel(width, false);
      this.vRulerCtx.beginPath();

      height.forEach((e, t) => {
        e = Math.floor(10 * e) / 10;
        var i = Math.floor(this.valueToPixelV(e, h)) - 5;
        this.vRulerCtx.font = r;
        this.vRulerCtx.fillStyle = s;
        this.vRulerCtx.fillText(e.toString(), 0, i);
      });

      this.vRulerCtx.closePath();
    }
  }
  valueToPixelH(e, t) {
    return e * t.xAxisScale + t.xAxisOffset;
  }
  valueToPixelV(e, t) {
    var i = cc.screen.windowSize.height;
    return -e * t.yAxisScale + i + t.yAxisOffset;
  }
  resize(e, t) {
    this.rulerLen = 35 * cc.screen.devicePixelRatio;
    this.hRulerCanvas.width = e;
    this.hRulerCanvas.height = this.rulerLen;
    this.vRulerCanvas.width = this.rulerLen;
    this.vRulerCanvas.height = t;
  }
}
exports.Ruler = Ruler;
