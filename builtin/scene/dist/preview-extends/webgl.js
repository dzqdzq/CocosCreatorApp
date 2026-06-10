Object.defineProperty(exports, "__esModule", { value: true });

const { sendToChannel } = require("@base/electron-base-ipc");

function DebugUV(t, e = 1024) {
  const i = { x: 0, y: 0 };

  var r = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];

  var h = [];
  var s = document.createElement("canvas");
  const a = e;
  const l = e;
  s.width = a;
  s.height = l;
  const g = s.getContext("2d");
  g.lineWidth = 0.3;
  g.strokeStyle = "#F8D299";
  g.textAlign = "center";
  g.fillStyle = "#353535";
  g.fillRect(0, 0, a, l);
  var n = t.index || t.buffer;
  var t_buffer = t.buffer;
  var f = t.format.count;
  var u = Object.keys(n).length;
  for (let t = 0; t < u; t += 3) {
    h[0] = n[t];
    h[1] = n[t + 1];
    h[2] = n[t + 2];
    r[0].x = t_buffer[h[0] * f];
    r[0].y = t_buffer[h[0] * f + 1];
    r[1].x = t_buffer[h[1] * f];
    r[1].y = t_buffer[h[1] * f + 1];
    r[2].x = t_buffer[h[2] * f];
    r[2].y = t_buffer[h[2] * f + 1];
    E = undefined;
    c = undefined;
    var c = r;
    g.beginPath();
    i.x = 0;
    for (let t = (i.y = 0), e = c.length; t < e; t++) {
      var E = c[t];
      i.x += E.x;
      i.y += E.y;

      if (t === 0) {
        g.moveTo(E.x * (a - 2) + 0.5, (1 - E.y) * (l - 2) + 0.5);
      } else {
        g.lineTo(E.x * (a - 2) + 0.5, (1 - E.y) * (l - 2) + 0.5);
      }
    }
    g.closePath();
    g.stroke();
  }
  return s;
}
class GlPreview {
  gl = null;
  buffers = [];
  textures = [];
  shaders = [];
  programs = [];
  uniforms = { framebufferLoc1: null };
  canvas;
  _framebufferCount = 1;
  _registerName;
  _name;
  initialized = false;
  constructor(t, e) {
    this._registerName = t;
    this._name = e;
  }
  set isMulFramebuffer(t) {
    this._framebufferCount = t ? 2 : 1;
  }
  get isMulFramebuffer() {
    return this._framebufferCount === 2;
  }
  async init(t) {
    t = t || {
      width: this.canvas?.width || 100,
      height: this.canvas?.height || 100,
    };

    sendToChannel(this._registerName, this._name, {
      width: t.width,
      height: t.height,
    });

    this.initialized = true;
  }
  _applyTex(t, e, i, r, h, s) {
    this.gl.activeTexture(this.gl.TEXTURE0 + r);
    this.gl.bindTexture(this.gl.TEXTURE_2D, e);
    this.gl.uniform1i(i, r);

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      h,
      s,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      t
    );
  }
  computedUV(t, e, i) {
    if (!(t = t || []).format || !t.format.count) {
      console.warn("cannot get uv count");
    }

    var t = DebugUV(t, Math.min(e, i));
    var r = t.getContext("2d")?.getImageData(0, 0, t.width, t.height);
    var h = document.createElement("canvas");
    var h = ((h.width = e), (h.height = i), h.getContext("2d"));
    h.fillStyle = "rgb(71, 71, 71)";
    h.fillRect(0, 0, e, i);

    h.putImageData(
      r,
      (e - Math.min(e, t.width)) / 2,
      (i - Math.min(i, t.height)) / 2
    );

    return { buffer: h.getImageData(0, 0, e, i).data, width: e, height: i };
  }
  queryPreviewData(t) {
    t = t || {
      width: this.canvas?.width || 100,
      height: this.canvas?.height || 100,
    };

    return new Promise((i, r) => {
      sendToChannel(this._registerName, this._name, {
        width: t.width,
        height: t.height,
      })
        .option({ original: true })
        .callback((t, e) => {
          if (t) {
            return r(t);
          }
          i(e);
        });
    });
  }
  resizeGL(t, e) {
    if (this.gl) {
      this.gl.viewport(0, 0, t, e);

      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        t,
        e,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );
    }
  }
  drawGL(t) {
    if (this.gl) {
      this._applyTex(
        t.buffer,
        this.textures[0],
        this.uniforms.framebufferLoc1,
        0,
        t.width,
        t.height
      );

      this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_BYTE, 0);
    }
  }
  async getContext(e) {
    let i;
    try {
      if (
        !(i = e.getContext("webgl", {
          alpha: false,
          depth: false,
          antialias: true,
        }))
      ) {
        for (let t = 0; t < 3; t++) {
          if (
            (i = await new Promise((t) => {
              setTimeout(() => {
                t(
                  e.getContext("webgl", {
                    alpha: false,
                    depth: false,
                    antialias: true,
                  })
                );
              }, 100);
            }))
          ) {
            return i;
          }
        }
        throw new Error("cannot get webgl context");
      }
    } catch (t) {
      console.error(t);
    }
    return i;
  }
  async initGL(t, e = {}) {
    if (t) {
      this.canvas = t;
      this.buffers = [];
      this.textures = [];
      this.shaders = [];
      this.programs = [];
      this.gl = await this.getContext(t);

      var i = this._initShaderProgram(
        this.gl,
        `attribute vec3 pos;
attribute vec2 uv;
varying vec2 v_uv;
void main () {
    gl_Position = vec4(pos, 1.0);
    v_uv = uv;
}`,
        `precision highp float;
varying vec2 v_uv;
uniform sampler2D framebuffer1;
void main () {
    gl_FragColor = texture2D(framebuffer1, v_uv);
}`
      );

      var r = [-1, -1, 1, -1, -1, 1, 1, 1];
      var h = this.gl.createBuffer();

      var r =
        (this.gl.bindBuffer(this.gl.ARRAY_BUFFER, h),
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          new Float32Array(r),
          this.gl.STATIC_DRAW
        ),
        this.buffers.push(h),
        this.gl.createBuffer());

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r);

      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
        this.gl.STATIC_DRAW
      );

      this.buffers.push(r);
      var s = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, s);

      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        new Uint8Array([0, 2, 3, 3, 1, 0]),
        this.gl.STATIC_DRAW
      );

      this.buffers.push(s);

      this.uniforms.framebufferLoc1 = this.gl.getUniformLocation(
        i,
        "framebuffer1"
      );

      t.width = e.width;
      t.height = e.height;
      var a = e.width || t.width;

      var l = e.height || t.height;
      for (let t = 0; t < this._framebufferCount; t++) {
        var g = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0 + t);
        this.gl.bindTexture(this.gl.TEXTURE_2D, g);

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.NEAREST
        );

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.NEAREST
        );

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE
        );

        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE
        );

        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          a,
          l,
          0,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          null
        );

        this.textures.push(g);
      }
      this.gl.viewport(0, 0, a, l);
      e = this.gl.getAttribLocation(i, "pos");
      t = this.gl.getAttribLocation(i, "uv");
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, h);
      this.gl.enableVertexAttribArray(e);
      this.gl.vertexAttribPointer(e, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r);
      this.gl.enableVertexAttribArray(t);
      this.gl.vertexAttribPointer(t, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, s);
      this.gl.useProgram(i);
    }
  }
  destroyGL() {
    this.buffers.forEach((t) => this.gl.deleteBuffer(t));

    this.textures.forEach((t) => this.gl.deleteTexture(t));

    this.shaders.forEach((t) => this.gl.deleteShader(t));

    this.programs.forEach((t) => this.gl.deleteProgram(t));

    if (this.gl && this.gl.getExtension("WEBGL_lose_context")) {
      this.gl.getExtension("WEBGL_lose_context").loseContext();
    }
  }
  _initShaderProgram(t, e, i) {
    var e = this._loadShader(t, t.VERTEX_SHADER, e);
    var i = this._loadShader(t, t.FRAGMENT_SHADER, i);
    var r = t.createProgram();
    t.attachShader(r, e);
    t.attachShader(r, i);
    t.linkProgram(r);

    return t.getProgramParameter(r, t.LINK_STATUS)
      ? (this.programs.push(r), r)
      : (console.warn(
          "Unable to initialize the shader program: " + t.getProgramInfoLog(r)
        ),
        t.deleteProgram(r),
        null);
  }
  _loadShader(t, e, i) {
    e = t.createShader(e);
    t.shaderSource(e, i);
    t.compileShader(e);

    return t.getShaderParameter(e, t.COMPILE_STATUS)
      ? (this.shaders.push(e), e)
      : (console.warn(
          "An error occurred compiling the shaders: " + t.getShaderInfoLog(e)
        ),
        t.deleteShader(e),
        null);
  }
}
exports.default = GlPreview;
