Object.defineProperty(exports, "__esModule", { value: true });

exports.TerrainImageBrush = undefined;
exports.TerrainCircleBrush = undefined;
exports.eTerrainCircleBrushType = undefined;
exports.TerrainBrushData = undefined;
exports.TerrainBrush = undefined;
exports.TerrainEdModifierKeyState = undefined;
exports.TerrainBrushType = undefined;

const cc_1 = require("cc");

const { clamp } = cc_1;

var TerrainBrushType;
var eTerrainCircleBrushType;
!((e) => {
  e[(e.CIRCLE = 0)] = "CIRCLE";
  e[(e.IMAGE = 1)] = "IMAGE";
  e[(e._MAX = 2)] = "_MAX";
})(TerrainBrushType || (exports.TerrainBrushType = TerrainBrushType = {}));
class TerrainEdModifierKeyState {
  siftPressed = false;
}
exports.TerrainEdModifierKeyState = TerrainEdModifierKeyState;
const brushDepthOffsetDefaultRatios = 0.001;
let brushDepthOffset = 0.05;
class TerrainBrush {
  static updateBrushDepthOffset(e) {
    var t = brushDepthOffsetDefaultRatios + (e / 300) * 0.00025; /* 25e-5 */
    brushDepthOffset = Math.max(0.05, e * t);
  }
  static updateBrushDepthOffsetToMaterial(e) {
    if (e) {
      e.setProperty("BrushDepthOffset", brushDepthOffset);
    }
  }
  material = null;
  position = new cc_1.Vec3(0, 0, 0);
  radius = 5;
  strength = 1;
  _setHeight = 0;
  _rotation = 0;
  get rotation() {
    return (this._rotation / 180) * Math.PI;
  }
  getDelta(e, t) {
    return 0;
  }
  getBound(e, t) {
    var r = this.position.x - this.radius;
    var i = this.position.z - this.radius;
    var a = this.position.x + this.radius;
    var s = this.position.z + this.radius;
    e.x = r;
    e.y = i;
    t.x = a;
    t.y = s;
  }
  update(e, t) {
    this.position = t;
  }
}
exports.TerrainBrush = TerrainBrush;
class TerrainBrushData {
  bmin = [0, 0];
  bmax = [0, 0];
  width() {
    return this.bmax[0] - this.bmax[0] + 1;
  }
  height() {
    return this.bmax[1] - this.bmax[1] + 1;
  }
}
exports.TerrainBrushData = TerrainBrushData;

((e) => {
  e[(e.Linear = 0)] = "Linear";
  e[(e.Smooth = 1)] = "Smooth";
  e[(e.Spherical = 2)] = "Spherical";
  e[(e.Tip = 3)] = "Tip";
})(
  eTerrainCircleBrushType ||
    (exports.eTerrainCircleBrushType = eTerrainCircleBrushType = {})
);

class TerrainCircleBrush extends TerrainBrush {
  type = eTerrainCircleBrushType.Linear;
  falloff = 0.5;
  constructor() {
    super();
    this._updateMaterial();
  }
  setType(e) {
    if (this.type !== e) {
      this.type = e;
      this._updateMaterial();
    }
  }
  getType() {
    return this.type;
  }
  _updateMaterial() {
    var e = cc.EffectAsset.get("internal/editor/terrain-circle-brush");

    if (e != null) {
      this.material = new cc_1.Material();

      this.material.initialize({
        effectAsset: e,
        defines: this._getTypeDefine(),
      });
    }
  }
  _getTypeDefine() {
    switch (this.type) {
      case eTerrainCircleBrushType.Linear: {
        return { LINEAR: 1 };
      }
      case eTerrainCircleBrushType.Smooth: {
        return { SMOOTH: 1 };
      }
      case eTerrainCircleBrushType.Spherical: {
        return { SPHERICAL: 1 };
      }
      case eTerrainCircleBrushType.Tip: {
        return { TIP: 1 };
      }
    }
  }
  static _calculateFalloff_Linear(e, t, r) {
    return e <= t ? 1 : t + r < e ? 0 : Math.max(0, 1 - (e - t) / r);
  }
  static _calculateFalloff_Spherical(e, t, r) {
    e = this._calculateFalloff_Linear(e, t, r);
    return e * e * (3 - 2 * e);
  }
  static _calculateFalloff_Smooth(e, t, r) {
    return e <= t
      ? 1
      : t + r < e
      ? 0
      : ((e = (e - t) / r), Math.sqrt(1 - e * e));
  }
  static _calculateFalloff_Tip(e, t, r) {
    return e <= t
      ? 1
      : t + r < e
      ? 0
      : ((t = (r + t - e) / r), 1 - Math.sqrt(1 - t * t));
  }
  getDelta(e, t) {
    var e = e - this.position.x;
    var t = t - this.position.z;
    var r = Math.sqrt(e * e + t * t);
    var i = (1 - this.falloff) * this.radius;
    var a = this.falloff * this.radius;
    let s = 0;
    switch (this.type) {
      case eTerrainCircleBrushType.Linear: {
        s = TerrainCircleBrush._calculateFalloff_Linear(r, i, a);
        break;
      }
      case eTerrainCircleBrushType.Smooth: {
        s = TerrainCircleBrush._calculateFalloff_Smooth(r, i, a);
        break;
      }
      case eTerrainCircleBrushType.Spherical: {
        s = TerrainCircleBrush._calculateFalloff_Spherical(r, i, a);
        break;
      }
      case eTerrainCircleBrushType.Tip: {
        s = TerrainCircleBrush._calculateFalloff_Tip(r, i, a);
      }
    }
    return s * this.strength;
  }
  update(r, e) {
    super.update(r, e);

    if (this.material != null) {
      var t = (1 - this.falloff) * this.radius;
      var i = this.falloff * this.radius;
      var a = new cc_1.Vec4();
      var s = new cc_1.Vec4();
      a.x = r.node.getWorldPosition().x + e.x;
      a.y = r.node.getWorldPosition().y + e.y;
      a.z = r.node.getWorldPosition().z + e.z;
      s.x = t;
      s.y = i;
      for (let t = 0; t < r.blockCount[0]; ++t) {
        for (let e = 0; e < r.blockCount[1]; ++e) {
          var h = r.getBlock(t, e);

          if (
            h._getBrushMaterial() == this.material &&
            h._getBrushPass() != null &&
            null != (h = h.material)
          ) {
            h.setProperty("BrushPos", a);
            h.setProperty("BrushParams", s);
            TerrainBrush.updateBrushDepthOffsetToMaterial(h);
          }
        }
      }
    }
  }
}
exports.TerrainCircleBrush = TerrainCircleBrush;
class TerrainImageBrush extends TerrainBrush {
  _image = null;
  _pixelData = null;
  constructor() {
    super();
    var e = cc.EffectAsset.get("internal/editor/terrain-image-brush");

    if (e != null) {
      this.material = new cc_1.Material();
      this.material.initialize({ effectAsset: e });
    }
  }
  set image(e) {
    if (
      this._image != e &&
      ((this._image = e), (this._pixelData = null) !== this._image)
    ) {
      e = document.createElement("canvas");
      const i = e.getContext("2d");
      if (i) {
        e.width = this._image.width;
        e.height = this._image.height;
        var e = this._image.mipmaps[0].data;
        var e_src = e._src;
        if (e_src) {
          const a = document.createElement("img");

          a.addEventListener("load", () => {
            document.body.removeChild(a);
            i.drawImage(a, 0, 0, a.width, a.height);
            var t = i.getImageData(0, 0, a.width, a.height);
            this._pixelData = new Array();
            this._pixelData.length = a.width * a.height;
            for (let e = 0; e < this._pixelData.length; ++e) {
              this._pixelData[e] = t.data[4 * e + 0] / 255;
            }
          });

          a.addEventListener("error", () => {
            document.body.removeChild(a);
          });

          a.src = "file://" + e_src;
          a.style.display = "none";
          document.body.appendChild(a);
        } else {
          i.drawImage(e, 0, 0, this._image.width, this._image.height);
          var r = i.getImageData(0, 0, this._image.width, this._image.height);
          this._pixelData = new Array();
          this._pixelData.length = this._image.width * this._image.height;
          for (let e = 0; e < this._pixelData.length; ++e) {
            this._pixelData[e] = r.data[4 * e + 0] / 255;
          }
        }
      }
    }
  }
  get image() {
    return this._image;
  }
  static getColor(e, t, r, i, a) {
    i = clamp(i, 0, t - 1);
    return e[(a = clamp(a, 0, r - 1)) * t + i];
  }
  static sampleImage(e, t, r, i, a) {
    i *= t - 1;
    a *= r - 1;
    var s = Math.floor(i);
    var h = Math.floor(a);
    var l = s + 1;
    var n = h + 1;
    var i = i - s;
    var a = a - h;
    var o = this.getColor(e, t, r, s, h);
    var h = this.getColor(e, t, r, l, h);
    var s = this.getColor(e, t, r, s, n);
    var h = o + (h - o) * i;
    return h + (s + (this.getColor(e, t, r, l, n) - s) * i - h) * a;
  }
  sample(e, t) {
    return this._pixelData === null || this._image === null
      ? 1
      : TerrainImageBrush.sampleImage(
          this._pixelData,
          this._image.width,
          this._image.height,
          e,
          t
        );
  }
  getDelta(e, t) {
    let r = this.position.x - e;
    let i = this.position.z - t;

    if (this.rotation != 0) {
      e = Math.sin(this.rotation);
      t = Math.cos(this.rotation);
      a = r * t + i * e;
      e = r * -e + i * t;
      r = a;
      i = e;
    }

    var t = (r / this.radius) * 0.5 + 0.5;
    var a = (i / this.radius) * 0.5 + 0.5;
    return t < 0 || t > 1 || a < 0 || a > 1
      ? 0
      : this.sample(t, a) * this.strength;
  }
  getBound(e, t) {
    var r;
    var i;
    var a;
    var s;
    var h;
    var l;
    var n;
    var o;
    var u = -this.radius;
    var c = -this.radius;
    var p = this.radius;
    var d = this.radius;

    if (this.rotation != 0) {
      i = -(a = Math.sin(this.rotation));
      a = a;
      s = r = Math.cos(this.rotation);
      h = new cc_1.Vec2();
      h.x = u * r + c * i;
      h.y = u * a + c * s;
      l = new cc_1.Vec2();
      l.x = p * r + c * i;
      l.y = p * a + c * s;
      n = new cc_1.Vec2();
      n.x = p * r + c * i;
      n.y = p * a + c * s;
      o = new cc_1.Vec2();
      o.x = p * r + d * i;
      o.y = p * a + d * s;
      e.x = h.x;
      e.y = h.y;
      e.x = Math.min(e.x, n.x);
      e.y = Math.min(e.y, n.y);
      e.x = Math.min(e.x, l.x);
      e.y = Math.min(e.y, l.y);
      e.x = Math.min(e.x, o.x);
      e.y = Math.min(e.y, o.y);
      t.x = h.x;
      t.y = h.y;
      t.x = Math.max(t.x, n.x);
      t.y = Math.max(t.y, n.y);
      t.x = Math.max(t.x, l.x);
      t.y = Math.max(t.y, l.y);
      t.x = Math.max(t.x, o.x);
      t.y = Math.max(t.y, o.y);
    }

    e.x = u + this.position.x;
    e.y = c + this.position.z;
    t.x = p + this.position.x;
    t.y = d + this.position.z;
  }
  update(r, e) {
    super.update(r, e);

    if (this.material !== null) {
      var t = this.radius;
      var i = new cc_1.Vec4();
      var a = new cc_1.Vec4();
      i.x = r.node.getWorldPosition().x + e.x;
      i.y = r.node.getWorldPosition().y + e.y;
      i.z = r.node.getWorldPosition().z + e.z;
      a.x = t;
      a.y = 1;
      a.z = this.rotation;
      for (let t = 0; t < r.blockCount[0]; ++t) {
        for (let e = 0; e < r.blockCount[1]; ++e) {
          var s = r.getBlock(t, e);

          if (
            s._getBrushMaterial() == this.material &&
            s._getBrushPass() != null &&
            null != (s = s.material)
          ) {
            s.setProperty("BrushPos", i);
            s.setProperty("BrushParams", a);
            TerrainBrush.updateBrushDepthOffsetToMaterial(s);

            this._image !== null
              ? s.setProperty("BrushImage", this._image)
              : s.setProperty(
                  "BrushImage",
                  cc_1.builtinResMgr.get("grey-texture")
                );
          }
        }
      }
    }
  }
}
exports.TerrainImageBrush = TerrainImageBrush;
