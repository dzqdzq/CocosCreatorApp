var applyContourBleed = (e, t, i, r, o, f, d) => {
  if (r.width !== 0 && r.height !== 0) {
    for (
      var l,
        a,
        n,
        p = r.x,
        h = r.xMax,
        y = r.y,
        g = r.yMax,
        c = 4 * i,
        s = 0,
        u = o.length,
        x = 0,
        m = y * c + 4 * p,
        B = y,
        w = 0;
      B < g;
      ++B, m += c
    ) {
      x = m;

      for (w = p; w < h; ++w, x += 4) {
        if (t[x + 3] === 0) {
          for (s = 0; s < u; s++) {
            l = w + o[s];
            a = B + f[s];

            if (
              p <= l &&
              l < h &&
              y <= a &&
              a < g &&
              t[(n = x + d[s]) + 3] > 0
            ) {
              e[x] = t[n];
              e[x + 1] = t[n + 1];
              e[x + 2] = t[n + 2];
              break;
            }
          }
        }
      }
    }
  }
};

var applyPaddingBleed = (e, t, i, r, o) => {
  if (o.width !== 0 && o.height !== 0) {
    var { y: y_2, x } = o;

    var d = o.yMax - 1;
    var o = o.xMax - 1;
    var a = 4 * i;
    var n = 4 * x;
    var p = 4 * o;
    var h = y_2 * a;
    var y = d * a;
    var g = 0;
    var c = 0;
    if (0 <= y_2 - 1) {
      g = h + n;

      for (c = h + p + 3; g <= c; ++g) {
        e[g - a] = t[g];
      }
    }
    if (1 + d < r) {
      g = y + n;

      for (c = y + p + 3; g <= c; ++g) {
        e[g + a] = t[g];
      }
    }
    if (0 <= x - 1) {
      g = h + n;

      for (c = y + n; g <= c; g += a) {
        e[g - 4] = t[g];
        e[g - 3] = t[g + 1];
        e[g - 2] = t[g + 2];
        e[g - 1] = t[g + 3];
      }
    }
    if (1 + o < i) {
      g = h + p;

      for (c = y + p; g <= c; g += a) {
        e[g + 4] = t[g];
        e[g + 5] = t[g + 1];
        e[g + 6] = t[g + 2];
        e[g + 7] = t[g + 3];
      }
    }
    if (0 <= x - 1 && 0 <= y_2 - 1) {
      for (c = (g = h + n) + 4; g < c; g++) {
        e[g - a - 4] = t[g];
      }
    }
    if (1 + o < i && 0 <= y_2 - 1) {
      for (c = (g = h + p) + 4; g < c; g++) {
        e[g - a + 4] = t[g];
      }
    }
    if (0 <= x - 1 && 1 + d < r) {
      for (c = (g = y + n) + 4; g < c; g++) {
        e[g + a - 4] = t[g];
      }
    }
    if (1 + o < i && 1 + d < r) {
      for (c = (g = y + p) + 4; g < c; g++) {
        e[g + a + 4] = t[g];
      }
    }
  }
};

var applyBleed = (e, t, i, r) => {
  let o = 0;
  let f = null;
  if (e.contourBleed) {
    for (
      var d = 4 * t.width,
        l = [-1, 0, 1, -1, 1, -1, 0, 1],
        a = [-1, -1, -1, 0, 0, 1, 1, 1],
        n = [],
        p = 0;
      p < l.length;
      p++
    ) {
      n[p] = 4 * l[p] + a[p] * d;
    }
    o = 0;

    for (f = null; o < t.spriteFrameInfos.length; o++) {
      f = t.spriteFrameInfos[o].trim;

      applyContourBleed(
        r,
        i,
        t.width,
        cc.rect(f.x, f.y, f.rotatedWidth, f.rotatedHeight),
        l,
        a,
        n
      );
    }
  }
  if (e.paddingBleed) {
    console.time("apply padding bleed");
    o = 0;

    for (f = null; o < t.spriteFrameInfos.length; o++) {
      f = t.spriteFrameInfos[o].trim;

      applyPaddingBleed(
        r,
        i,
        t.width,
        t.height,
        cc.rect(f.x, f.y, f.rotatedWidth, f.rotatedHeight)
      );
    }

    console.timeEnd("apply padding bleed");
  }
};

module.exports = { applyBleed };
