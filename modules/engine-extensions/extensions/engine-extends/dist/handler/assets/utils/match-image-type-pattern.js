Object.defineProperty(exports, "__esModule", { value: true });
exports.matchImageTypePattern = matchImageTypePattern;
const imageTypePatternTable = [
  {
    mimeType: "image/png",
    pattern: [137, 80, 78, 71, 13, 10, 26, 10],
    mask: [255, 255, 255, 255, 255, 255, 255, 255],
  },
  { mimeType: "image/jpeg", pattern: [255, 216, 255], mask: [255, 255, 255] },
];
function matchMimeTypePattern(t, a, r, e) {
  if (t.length < r.length) {
    return false;
  }
  let n = 0;
  if (e) {
    for (; n < t.length && e.includes(t[n]); ++n) {}
  }
  for (let e = 0; e < a.length; ++e, ++n) {
    if ((r[e] & t[n]) !== a[e]) {
      return false;
    }
  }
  return true;
}
function matchImageTypePattern(e) {
  for (var { mimeType, pattern, mask, ignoredBytes } of imageTypePatternTable) {
    if (matchMimeTypePattern(e, pattern, mask, ignoredBytes)) {
      return mimeType;
    }
  }
}
