Object.defineProperty(exports, "__esModule", { value: true });

const { sendToChannel } = require("@base/electron-base-ipc");

class GlPreview {
  gl = null;
  canvas = null;
  _registerName;
  _name;
  initialized = false;
  _lastData;
  constructor(t, e) {
    this._registerName = t;
    this._name = e;
    this._lastData = null;
  }
  async init(t) {
    t = t || { width: 100, height: 100 };

    sendToChannel(this._registerName, this._name, {
      index: t.index,
      width: t.width,
      height: t.height,
    });

    this.initialized = true;
  }
  queryPreviewData(e) {
    e = e || { width: 100, height: 100 };

    return new Promise((a, t) => {
      sendToChannel(this._registerName, this._name, {
        index: e.index,
        width: e.width,
        height: e.height,
      })
        .option({ original: true })
        .callback((t, e) => {
          if (t) {
            console.warn("queryPreviewData Failed", this._name, t);
            a(null);
          } else {
            a(e);
          }
        });
    });
  }
  resizeGL(e, a) {
    e = Math.floor(e);
    a = Math.floor(a);

    if (this.canvas) {
      let t = false;

      if (this.canvas.width !== e) {
        this.canvas.width = e;
        t = true;
      }

      if (this.canvas.height !== a) {
        this.canvas.height = a;
        t = true;
      }

      if (t && this._lastData !== null) {
        this.gl?.putImageData(this._lastData, 0, 0);
      }
    }
  }
  drawGL(t, e, a) {
    e = Math.floor(e);
    a = Math.floor(a);

    if (this.canvas) {
      this._lastData = new ImageData(new Uint8ClampedArray(t.buffer), e, a);

      this.gl?.putImageData(this._lastData, 0, 0);
    }
  }
  initGL(t, e = 0) {
    if (t) {
      t.style.transform = "scale(1, -1)";
      this.canvas = t;
      this.gl = t.getContext("2d");
    }
  }
  destroyGL() {}
  setScale(t) {
    if (this.canvas) {
      this.canvas.style.transform = `scale(${t}, ${-t})`;
    }
  }
}
exports.default = GlPreview;
