const ipacker = require("max-rects-packing");
const MaxRectsBinPack = require("./maxrects");
function getRectsFromInputs(e) {
  return e.map((e) => ({
    width: e.width,
    height: e.height,
    origin: e,
  }));
}
function getInputsFromRects(e) {
  return e.map((e) => {
    var e_origin = e.origin;
    for (const r in e) {
      if (r !== "origin") {
        e_origin[r] = e[r];
      }
    }
    return e_origin;
  });
}
function scoreMaxRects(e, t, r, c, i, s) {
  var a = new MaxRectsBinPack(t, r, i).insertRects(e, c);
  let o = 0;
  let n = 0;
  let h = 0;
  for (let e = 0; e < a.length; e++) {
    var l = a[e];
    o += l.width * l.height;
    var u = l.x + (l.rotated ? l.height : l.width);
    var l = l.y + (l.rotated ? l.width : l.height);

    if (u > n) {
      n = u;
    }

    if (l > h) {
      h = l;
    }
  }
  i = n * h;
  i = o / i;

  if (o > s.packedArea || (i > s.score && o >= s.packedArea)) {
    s.packedRects = a;
    s.unpackedRects = e;
    s.score = i;
    s.packedArea = o;
    s.binWidth = t;
    s.binHeight = r;
    s.heuristice = c;
  }
}
function scoreMaxRectsForAllHeuristics(t, r, c, i, s) {
  for (let e = 0; e <= 5; e++) {
    if (e !== 4) {
      scoreMaxRects(getRectsFromInputs(t), r, c, e, i, s);
    }
  }
}
module.exports = {
  ipacker(e, t, r, c) {
    t = new ipacker.Packer(t, r, { allowRotate: c });
    r = getRectsFromInputs(e);
    return t.fit(r).rects.map((e) => Object.assign(e.origin, e.fitInfo));
  },
  MaxRects(c, e, i, s) {
    let a = 0;
    for (let e = 0; e < c.length; e++) {
      a += c[e].width * c[e].height;
    }
    var o = {
      packedRects: [],
      unpackedRects: [],
      score: -Infinity,
      packedArea: -Infinity,
    };
    if (a < e * i) {
      for (let r = 4; r <= e; r = Math.min(2 * r, e)) {
        for (let t = 4; t <= i; t = Math.min(2 * t, i)) {
          var n = r * t;
          if (n >= a) {
            let e = a;

            while (true) {
              var h = e ** 0.5;

              if (h <= r && h <= t) {
                scoreMaxRectsForAllHeuristics(c, h, h, s, o);
              }

              scoreMaxRectsForAllHeuristics(c, e / t, t, s, o);
              scoreMaxRectsForAllHeuristics(c, r, e / r, s, o);
              var o_unpackedRects = o.unpackedRects;

              if (o_unpackedRects.length > 0) {
                let t = 0;
                for (let e = 0; e < o_unpackedRects.length; e++) {
                  t += o_unpackedRects[e].width * o_unpackedRects[e].height;
                }
                e += t / 2;
              }
              if (e >= n || o_unpackedRects.length === 0) {
                break;
              }
            }
          }
          if (t >= i) {
            break;
          }
        }
        if (r >= e) {
          break;
        }
      }
    } else {
      scoreMaxRectsForAllHeuristics(c, e, i, s, o);
    }
    return getInputsFromRects(o.packedRects);
  },
};
