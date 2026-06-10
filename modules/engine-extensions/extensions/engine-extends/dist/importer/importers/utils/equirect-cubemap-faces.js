function clamp(e, n, t) {
  return Math.min(t, Math.max(n, e));
}
function srgbToLinear(e) {
  return e ** 2.2;
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.equirectToCubemapFaces = undefined;
exports.InterpolationType = undefined;
exports.nearestPowerOfTwo = undefined;

const i255 = 1 / 255;
function betweenZeroAndOne(e) {
  return i255 * e;
}
function linearToSRGB(e) {
  return e ** 0.454545;
}
const ilog2 = 1 / Math.log(2);
function nearestPowerOfTwo(e) {
  return 1 << Math.round(Math.log(e) * ilog2);
}
var InterpolationType;
exports.nearestPowerOfTwo = nearestPowerOfTwo;

((e) => {
  e.BILINEAR = "bilinear";
  e.NEAREST = "nearest";
})(
  (InterpolationType =
    exports.InterpolationType || (exports.InterpolationType = {}))
);

const DEFAULT_OPTIONS = {
  flipTheta: false,
  interpolation: InterpolationType.BILINEAR,
  isRGBE: false,
};

const rgbe_base = 1.1;
function floatToRGBE(e, n, t, r, a) {
  var o = Math.max(Math.max(e, n), t);
  var o = Math.ceil(Math.log(o) / Math.log(rgbe_base));
  var o = Math.min(Math.max(o + 128, 0), 255);
  var i = rgbe_base ** (o - 128);
  r[a + 0] = ((e / i) * 255) | 0;
  r[a + 1] = ((n / i) * 255) | 0;
  r[a + 2] = ((t / i) * 255) | 0;
  r[a + 3] = o;
}
function transformSingleFace(e, n, t, r) {
  var o = r.flipTheta ? -1 : 1;
  var i = 0 | t.width;
  var b = 0 | e.width;
  var h = 0 | e.height;
  var e_data = e.data;
  var w = r.interpolation === InterpolationType.NEAREST;
  var r_isRGBE = r.isRGBE;
  var t_data = t.data;
  var c = 0 | t.width;
  var g = 0 | t.height;
  var G = 0 | n;
  var N = 2 / c;
  var k = 2 / g;
  for (let a = 0; a < g; ++a) {
    for (let r = 0; r < c; ++r) {
      var p = N * r;
      var T = k * a;
      var f = (r + a * i) << 2;
      let e = 0;
      let n = 0;
      let t = 0;
      switch (G) {
        case 0: {
          e = 1;
          n = 1 - p;
          t = 1 - T;
          break;
        }
        case 1: {
          e = -1;
          n = p - 1;
          t = 1 - T;
          break;
        }
        case 2: {
          e = p - 1;
          n = T - 1;
          t = 1;
          break;
        }
        case 3: {
          e = p - 1;
          n = 1 - T;
          t = -1;
          break;
        }
        case 4: {
          e = p - 1;
          n = 1;
          t = 1 - T;
          break;
        }
        case 5: {
          e = 1 - p;
          n = -1;
          t = 1 - T;
        }
      }
      var u;
      var A;
      var O;
      var m;
      var M;
      var Z;
      var I;
      var L;
      var x;
      var E;
      var P;
      var y;
      var B;
      var R;
      var v;
      var S = o * Math.atan2(n, e);
      var _ = Math.sqrt(e * e + n * n);
      var _ = Math.atan2(t, _);
      var S = ((b / 4) * 2 * (S + Math.PI)) / Math.PI;
      var _ = ((b / 4) * 2 * (Math.PI / 2 - _)) / Math.PI;
      var F = 0 | Math.floor(S);
      var C = 0 | Math.floor(_);

      if (w) {
        u = ((F % b) + b * clamp(C, 0, h - 1)) << 2;
        t_data[f] = 0 | e_data[u];
        t_data[1 + f] = 0 | e_data[1 + u];
        t_data[2 + f] = 0 | e_data[2 + u];
        t_data[3 + f] = 0 | e_data[3 + u];
      } else {
        u = 1 + F;
        v = 1 + C;
        S = S - F;
        _ = _ - C;
        R = ((F % b) + b * clamp(C, 0, h - 1)) << 2;
        C = ((u % b) + b * clamp(C, 0, h - 1)) << 2;
        F = ((F % b) + b * clamp(v, 0, h - 1)) << 2;
        v = ((u % b) + b * clamp(v, 0, h - 1)) << 2;
        A = (1 - S) * (1 - _);
        O = S * (1 - _);
        m = (1 - S) * _;
        S = S * _;

        r_isRGBE
          ? ((_ = rgbe_base ** ((0 | e_data[3 + R]) - 128)),
            (P = rgbe_base ** ((0 | e_data[3 + C]) - 128)),
            (y = rgbe_base ** ((0 | e_data[3 + F]) - 128)),
            (B = rgbe_base ** ((0 | e_data[3 + v]) - 128)),
            (M = betweenZeroAndOne(0 | e_data[R]) * _),
            (L = betweenZeroAndOne(0 | e_data[1 + R]) * _),
            (_ = betweenZeroAndOne(0 | e_data[2 + R]) * _),
            (Z = betweenZeroAndOne(0 | e_data[C]) * P),
            (x = betweenZeroAndOne(0 | e_data[1 + C]) * P),
            (P = betweenZeroAndOne(0 | e_data[2 + C]) * P),
            (I = betweenZeroAndOne(0 | e_data[F]) * y),
            (E = betweenZeroAndOne(0 | e_data[1 + F]) * y),
            (y = betweenZeroAndOne(0 | e_data[2 + F]) * y),
            floatToRGBE(
              M * A + Z * O + I * m + betweenZeroAndOne(0 | e_data[v]) * B * S,
              L * A +
                x * O +
                E * m +
                betweenZeroAndOne(0 | e_data[1 + v]) * B * S,
              _ * A +
                P * O +
                y * m +
                betweenZeroAndOne(0 | e_data[2 + v]) * B * S,
              t_data,
              f
            ))
          : ((M = betweenZeroAndOne(0 | e_data[3 + R])),
            (Z = betweenZeroAndOne(0 | e_data[3 + C])),
            (I = betweenZeroAndOne(0 | e_data[3 + F])),
            (L = betweenZeroAndOne(0 | e_data[3 + v])),
            (x = srgbToLinear(betweenZeroAndOne(0 | e_data[R])) * M),
            (E = srgbToLinear(betweenZeroAndOne(0 | e_data[1 + R])) * M),
            (_ = srgbToLinear(betweenZeroAndOne(0 | e_data[2 + R])) * M),
            (P = srgbToLinear(betweenZeroAndOne(0 | e_data[C])) * Z),
            (y = srgbToLinear(betweenZeroAndOne(0 | e_data[1 + C])) * Z),
            (B = srgbToLinear(betweenZeroAndOne(0 | e_data[2 + C])) * Z),
            (R = srgbToLinear(betweenZeroAndOne(0 | e_data[F])) * I),
            (C = srgbToLinear(betweenZeroAndOne(0 | e_data[1 + F])) * I),
            (F = srgbToLinear(betweenZeroAndOne(0 | e_data[2 + F])) * I),
            (R =
              x * A +
              P * O +
              R * m +
              srgbToLinear(betweenZeroAndOne(0 | e_data[v])) * L * S),
            (C =
              E * A +
              y * O +
              C * m +
              srgbToLinear(betweenZeroAndOne(0 | e_data[1 + v])) * L * S),
            (_ =
              _ * A +
              B * O +
              F * m +
              srgbToLinear(betweenZeroAndOne(0 | e_data[2 + v])) * L * S),
            (v = 1 / (F = M * A + Z * O + I * m + L * S)),
            (t_data[3 + f] = (255 * F) | 0),
            (t_data[f] = (255 * linearToSRGB(R * v)) | 0),
            (t_data[1 + f] = (255 * linearToSRGB(C * v)) | 0),
            (t_data[2 + f] = (255 * linearToSRGB(_ * v)) | 0));
      }
    }
  }
  return t;
}
function transformToCubeFaces(n, t, r) {
  if (t.length !== 6) {
    throw new Error("facePixArray length must be 6!");
  }
  for (let e = 0; e < 6; ++e) {
    transformSingleFace(n, e, t[e], r);
  }
  return t;
}
function imageGetPixels(e) {
  if (e instanceof ImageData) {
    return e;
  }
  let n = e;
  let t;

  if (n.tagName !== "CANVAS") {
    n = document.createElement("canvas");
    n.width = e.width;
    n.height = e.height;

    (t = n.getContext("2d")).drawImage(
      e,
      0,
      0,
      n.width,
      n.height,
      0,
      0,
      n.width,
      n.height
    );
  } else {
    t = n.getContext("2d");
  }

  return t.getImageData(0, 0, n.width, n.height);
}
async function equirectToCubemapFaces(e, n, t) {
  var r = await e.metadata();
  var a = await e.raw().toBuffer();
  let o = null;
  if (r.channels === 3) {
    var i = (r.width || 0) * (r.height || 0);
    o = new Uint8Array(4 * i);
    for (let e = 0; e < i; ++e) {
      o[4 * e + 0] = a[3 * e + 0];
      o[4 * e + 1] = a[3 * e + 1];
      o[4 * e + 2] = a[3 * e + 2];
      o[4 * e + 3] = 255;
    }
  }

  var e = {
    width: r.width || 0,
    height: r.height || 0,
    data: o ? Buffer.from(o.buffer) : a,
  };

  var b = [];
  for (let e = 0; e < 6; ++e) {
    b.push({ width: n, height: n, data: new Uint8Array(n * n * 4) });
  }
  transformToCubeFaces(e, b, (t = t || DEFAULT_OPTIONS));
  return b;
}
exports.equirectToCubemapFaces = equirectToCubemapFaces;
