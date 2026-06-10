function clamp(e, n, t) {
  return Math.min(t, Math.max(n, e));
}
function srgbToLinear(e) {
  return e ** 2.2;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterpolationType = undefined;
exports.srgbToLinear = srgbToLinear;
exports.linearToSRGB = linearToSRGB;
exports.nearestPowerOfTwo = nearestPowerOfTwo;
exports.equirectToCubemapFaces = equirectToCubemapFaces;
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
!((e) => {
  e.BILINEAR = "bilinear";
  e.NEAREST = "nearest";
})(InterpolationType || (exports.InterpolationType = InterpolationType = {}));

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
  var g = 0 | t.width;
  var c = 0 | t.height;
  var C = 0 | n;
  var N = 2 / g;
  var U = 2 / c;
  for (let a = 0; a < c; ++a) {
    for (let r = 0; r < g; ++r) {
      var T = N * r;
      var p = U * a;
      var A = (r + a * i) << 2;
      let e = 0;
      let n = 0;
      let t = 0;
      switch (C) {
        case 0: {
          e = 1;
          n = 1 - T;
          t = 1 - p;
          break;
        }
        case 1: {
          e = -1;
          n = T - 1;
          t = 1 - p;
          break;
        }
        case 2: {
          e = T - 1;
          n = p - 1;
          t = 1;
          break;
        }
        case 3: {
          e = T - 1;
          n = 1 - p;
          t = -1;
          break;
        }
        case 4: {
          e = T - 1;
          n = 1;
          t = 1 - p;
          break;
        }
        case 5: {
          e = 1 - T;
          n = -1;
          t = 1 - p;
        }
      }
      var f;
      var u;
      var O;
      var M;
      var Z;
      var m;
      var I;
      var L;
      var x;
      var y;
      var E;
      var R;
      var B;
      var S;
      var P;
      var v = o * Math.atan2(n, e);
      var G = Math.sqrt(e * e + n * n);
      var G = Math.atan2(t, G);
      var v = ((b / 4) * 2 * (v + Math.PI)) / Math.PI;
      var G = ((b / 4) * 2 * (Math.PI / 2 - G)) / Math.PI;
      var _ = 0 | Math.floor(v);
      var F = 0 | Math.floor(G);

      if (w) {
        f = ((_ % b) + b * clamp(F, 0, h - 1)) << 2;
        t_data[A] = 0 | e_data[f];
        t_data[1 + A] = 0 | e_data[1 + f];
        t_data[2 + A] = 0 | e_data[2 + f];
        t_data[3 + A] = 0 | e_data[3 + f];
      } else {
        f = 1 + _;
        P = 1 + F;
        v = v - _;
        G = G - F;
        S = ((_ % b) + b * clamp(F, 0, h - 1)) << 2;
        F = ((f % b) + b * clamp(F, 0, h - 1)) << 2;
        _ = ((_ % b) + b * clamp(P, 0, h - 1)) << 2;
        P = ((f % b) + b * clamp(P, 0, h - 1)) << 2;
        u = (1 - v) * (1 - G);
        O = v * (1 - G);
        M = (1 - v) * G;
        v = v * G;

        r_isRGBE
          ? ((G = rgbe_base ** ((0 | e_data[3 + S]) - 128)),
            (E = rgbe_base ** ((0 | e_data[3 + F]) - 128)),
            (R = rgbe_base ** ((0 | e_data[3 + _]) - 128)),
            (B = rgbe_base ** ((0 | e_data[3 + P]) - 128)),
            (Z = betweenZeroAndOne(0 | e_data[S]) * G),
            (L = betweenZeroAndOne(0 | e_data[1 + S]) * G),
            (G = betweenZeroAndOne(0 | e_data[2 + S]) * G),
            (m = betweenZeroAndOne(0 | e_data[F]) * E),
            (x = betweenZeroAndOne(0 | e_data[1 + F]) * E),
            (E = betweenZeroAndOne(0 | e_data[2 + F]) * E),
            (I = betweenZeroAndOne(0 | e_data[_]) * R),
            (y = betweenZeroAndOne(0 | e_data[1 + _]) * R),
            (R = betweenZeroAndOne(0 | e_data[2 + _]) * R),
            floatToRGBE(
              Z * u + m * O + I * M + betweenZeroAndOne(0 | e_data[P]) * B * v,
              L * u +
                x * O +
                y * M +
                betweenZeroAndOne(0 | e_data[1 + P]) * B * v,
              G * u +
                E * O +
                R * M +
                betweenZeroAndOne(0 | e_data[2 + P]) * B * v,
              t_data,
              A
            ))
          : ((Z = betweenZeroAndOne(0 | e_data[3 + S])),
            (m = betweenZeroAndOne(0 | e_data[3 + F])),
            (I = betweenZeroAndOne(0 | e_data[3 + _])),
            (L = betweenZeroAndOne(0 | e_data[3 + P])),
            (x = srgbToLinear(betweenZeroAndOne(0 | e_data[S])) * Z),
            (y = srgbToLinear(betweenZeroAndOne(0 | e_data[1 + S])) * Z),
            (G = srgbToLinear(betweenZeroAndOne(0 | e_data[2 + S])) * Z),
            (E = srgbToLinear(betweenZeroAndOne(0 | e_data[F])) * m),
            (R = srgbToLinear(betweenZeroAndOne(0 | e_data[1 + F])) * m),
            (B = srgbToLinear(betweenZeroAndOne(0 | e_data[2 + F])) * m),
            (S = srgbToLinear(betweenZeroAndOne(0 | e_data[_])) * I),
            (F = srgbToLinear(betweenZeroAndOne(0 | e_data[1 + _])) * I),
            (_ = srgbToLinear(betweenZeroAndOne(0 | e_data[2 + _])) * I),
            (S =
              x * u +
              E * O +
              S * M +
              srgbToLinear(betweenZeroAndOne(0 | e_data[P])) * L * v),
            (F =
              y * u +
              R * O +
              F * M +
              srgbToLinear(betweenZeroAndOne(0 | e_data[1 + P])) * L * v),
            (G =
              G * u +
              B * O +
              _ * M +
              srgbToLinear(betweenZeroAndOne(0 | e_data[2 + P])) * L * v),
            (P = 1 / (_ = Z * u + m * O + I * M + L * v)),
            (t_data[3 + A] = (255 * _) | 0),
            (t_data[A] = (255 * linearToSRGB(S * P)) | 0),
            (t_data[1 + A] = (255 * linearToSRGB(F * P)) | 0),
            (t_data[2 + A] = (255 * linearToSRGB(G * P)) | 0));
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
    data: o ? new Uint8Array(o.buffer) : new Uint8Array(a.buffer),
  };

  var b = [];
  for (let e = 0; e < 6; ++e) {
    b.push({ width: n, height: n, data: new Uint8Array(n * n * 4) });
  }
  transformToCubeFaces(e, b, (t = t || DEFAULT_OPTIONS));
  return b;
}
