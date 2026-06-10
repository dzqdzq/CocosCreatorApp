function applyContourBleed(t, l, e, f, a, p, d) {
  if (f.width !== 0 && f.height !== 0) {
    var { x, xMax, y, yMax } = f;

    var h = 4 * e;
    let o = 0;
    var s;
    var M;
    var c;
    var a_length = a.length;
    let r = 0;
    let i = y * h + 4 * x;
    for (let e = y, f = 0; e < yMax; ++e, i += h) {
      r = i;

      for (f = x; f < xMax; ++f, r += 4) {
        if (l[r + 3] === 0) {
          for (o = 0; o < a_length; o++) {
            s = f + a[o];
            M = e + p[o];

            if (
              x <= s &&
              s < xMax &&
              y <= M &&
              M < yMax &&
              l[(c = r + d[o]) + 3] > 0
            ) {
              t[r] = l[c];
              t[r + 1] = l[c + 1];
              t[r + 2] = l[c + 2];
              break;
            }
          }
        }
      }
    }
  }
}
function applyPaddingBleed(o, r, i, t, l) {
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
    let f = 0;
    if (0 <= y_2 - 1) {
      e = u + x;

      for (f = u + y + 3; e <= f; ++e) {
        o[e - n] = r[e];
      }
    }
    if (1 + p < t) {
      e = h + x;

      for (f = h + y + 3; e <= f; ++e) {
        o[e + n] = r[e];
      }
    }
    if (0 <= x_2 - 1) {
      e = u + x;

      for (f = h + x; e <= f; e += n) {
        o[e - 4] = r[e];
        o[e - 3] = r[e + 1];
        o[e - 2] = r[e + 2];
        o[e - 1] = r[e + 3];
      }
    }
    if (1 + l < i) {
      e = u + y;

      for (f = h + y; e <= f; e += n) {
        o[e + 4] = r[e];
        o[e + 5] = r[e + 1];
        o[e + 6] = r[e + 2];
        o[e + 7] = r[e + 3];
      }
    }
    if (0 <= x_2 - 1 && 0 <= y_2 - 1) {
      e = u + x;

      for (f = e + 4; e < f; e++) {
        o[e - n - 4] = r[e];
      }
    }
    if (1 + l < i && 0 <= y_2 - 1) {
      e = u + y;

      for (f = e + 4; e < f; e++) {
        o[e - n + 4] = r[e];
      }
    }
    if (0 <= x_2 - 1 && 1 + p < t) {
      e = h + x;

      for (f = e + 4; e < f; e++) {
        o[e + n - 4] = r[e];
      }
    }
    if (1 + l < i && 1 + p < t) {
      e = h + y;

      for (f = e + 4; e < f; e++) {
        o[e + n + 4] = r[e];
      }
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyContourBleed = applyContourBleed;
