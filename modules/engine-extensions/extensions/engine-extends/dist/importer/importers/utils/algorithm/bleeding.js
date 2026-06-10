function applyContourBleed(t, l, e, o, a, p, d) {
  if (o.width !== 0 && o.height !== 0) {
    var { x, xMax, y, yMax } = o;

    var h = 4 * e;
    let f = 0;
    var s;
    var v;
    var B;
    var a_length = a.length;
    let r = 0;
    let i = y * h + 4 * x;
    for (let e = y, o = 0; e < yMax; ++e, i += h) {
      r = i;

      for (o = x; o < xMax; ++o, r += 4) {
        if (l[r + 3] === 0) {
          for (f = 0; f < a_length; f++) {
            s = o + a[f];
            v = e + p[f];

            if (
              x <= s &&
              s < xMax &&
              y <= v &&
              v < yMax &&
              l[(B = r + d[f]) + 3] > 0
            ) {
              t[r] = l[B];
              t[r + 1] = l[B + 1];
              t[r + 2] = l[B + 2];
              t[r + 3] = 1;
              break;
            }
          }
        }
      }
    }
  }
}
function applyPaddingBleed(f, r, i, t, l) {
  if (l.width !== 0 && l.height !== 0) {
    var { y: y_2, x: x_2 } = l;

    var p = l.yMax - 1;
    var l = l.xMax - 1;
    var n = 4 * i;
    var x = 4 * x_2;
    var y = 4 * l;
    var u = y_2 * n;
    var h = p * n;
    let e = 0;
    let o = 0;
    if (0 <= y_2 - 1) {
      e = u + x;

      for (o = u + y + 3; e <= o; ++e) {
        f[e - n] = r[e];
      }
    }
    if (1 + p < t) {
      e = h + x;

      for (o = h + y + 3; e <= o; ++e) {
        f[e + n] = r[e];
      }
    }
    if (0 <= x_2 - 1) {
      e = u + x;

      for (o = h + x; e <= o; e += n) {
        f[e - 4] = r[e];
        f[e - 3] = r[e + 1];
        f[e - 2] = r[e + 2];
        f[e - 1] = r[e + 3];
      }
    }
    if (1 + l < i) {
      e = u + y;

      for (o = h + y; e <= o; e += n) {
        f[e + 4] = r[e];
        f[e + 5] = r[e + 1];
        f[e + 6] = r[e + 2];
        f[e + 7] = r[e + 3];
      }
    }
    if (0 <= x_2 - 1 && 0 <= y_2 - 1) {
      e = u + x;

      for (o = e + 4; e < o; e++) {
        f[e - n - 4] = r[e];
      }
    }
    if (1 + l < i && 0 <= y_2 - 1) {
      e = u + y;

      for (o = e + 4; e < o; e++) {
        f[e - n + 4] = r[e];
      }
    }
    if (0 <= x_2 - 1 && 1 + p < t) {
      e = h + x;

      for (o = e + 4; e < o; e++) {
        f[e + n - 4] = r[e];
      }
    }
    if (1 + l < i && 1 + p < t) {
      e = h + y;

      for (o = e + 4; e < o; e++) {
        f[e + n + 4] = r[e];
      }
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyContourBleed = undefined;
exports.applyContourBleed = applyContourBleed;
