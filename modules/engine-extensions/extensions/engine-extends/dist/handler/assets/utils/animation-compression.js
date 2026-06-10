"use strict";;
Object.defineProperty(exports, "__esModule", { value: !0 });
(exports.compressAnimationClip = compressAnimationClip);
const cc_1 = require("cc");
const approx = cc_1.math["approx"];
function compressAnimationClip(e) {
  for (const a of e.tracks) {
    for (var { curve: r } of a.channels()) {
      r instanceof cc_1.RealCurve && compressRealCurve(r);
    }
  }
}
function compressRealCurve(e) {
  var r;
  e.keyFramesCount < 2 ||
    (Array.from(e.values()).every(
      ({ interpolationMode: e }) => {
        return e === cc_1.RealInterpolationMode.LINEAR;
      }
    ) &&
      ((r = compress(
        Array.from(e.times()),
        Array.from(e.values()).map(({ value: e }) => {
          return e;
        }),
        [
          { type: "remove-linear-keys", maxDiff: 1e-4 },
          { type: "remove-trivial-keys", maxDiff: 1e-4 },
        ]
      )),
      e.assignSorted(r.times, r.values)));
}
function compress(e, r, a) {
  for (const s of a) {
    switch (s.type) {
      case "remove-linear-keys":
        {
          ({ keys: e, values: r } = removeLinearKeys(e, r, s.maxDiff));
          break;
        }
      case "remove-trivial-keys":
        {
          ({ keys: e, values: r } = removeTrivialKeys(e, r, s.maxDiff));
        }
    }
  }
  return { times: e, values: r };
}
function removeLinearKeys(r, a, s = 0.001) {
  var e = r.length;
  if (e < 3) {
    return { keys: r.slice(), values: a.slice() };
  }
  var o = new Array(e).fill(!1);
  var i = e - 1;
  for (let e = 1; e < i; ++e) {
    var l = e - 1;
    var t = e + 1;
    var { [l]: n, [e]: c, [t]: v } = r;
    var { [l]: l, [e]: f, [t]: t } = a;
    var t = (t - l) * ((c - n) / (v - n)) + l;
    approx(t, f, s) && (o[e] = !0);
  }
  return filterFromRemoveFlags(r, a, o);
}
function removeTrivialKeys(e, r, a = 0.001) {
  var s = e.length;
  if (s < 2) {
    return { keys: e.slice(), values: r.slice() };
  }
  var o = new Array(s).fill(!1);
  for (let e = 1; e < s; ++e) {
    var i = e - 1;
    var { [i]: i, [e]: l } = r;
    approx(i, l, a) && (o[e] = !0);
  }
  return filterFromRemoveFlags(e, r, o);
}
function filterFromRemoveFlags(a, s, o) {
  var i = a.length;

  var e = o.reduce((e, r) => {
    return (r ? e + 1 : e);
  }, 0);

  if (!e) {
    return { keys: a.slice(), values: s.slice() };
  }
  var e = i - e;
  var l = new Array(e).fill(0);
  var t = new Array(e).fill(0);
  for (let e = 0, r = 0; r < i; ++r) {
    o[r] || ((l[e] = a[r]), (t[e] = s[r]), ++e);
  }
  return { keys: l, values: t };
}
