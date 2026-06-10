Object.defineProperty(exports, "__esModule", { value: true });
exports.random = undefined;
exports.EPSILON = undefined;
exports.equals = equals;
exports.approx = approx;
exports.clamp = clamp;
exports.clamp01 = clamp01;
exports.lerp = lerp;
exports.toRadian = toRadian;
exports.toDegree = toDegree;
exports.randomRange = randomRange;
exports.randomRangeInt = randomRangeInt;
exports.pseudoRandom = pseudoRandom;
exports.pseudoRandomRange = pseudoRandomRange;
exports.pseudoRandomRangeInt = pseudoRandomRangeInt;
exports.nextPow2 = nextPow2;
exports.repeat = repeat;
exports.pingPong = pingPong;
exports.inverseLerp = inverseLerp;
const _d2r = Math.PI / 180;
const _r2d = 180 / Math.PI;
function equals(e, n) {
  return (
    Math.abs(e - n) <= exports.EPSILON * Math.max(1, Math.abs(e), Math.abs(n))
  );
}
function approx(e, n, o) {
  o = o || exports.EPSILON;
  return Math.abs(e - n) <= o;
}
function clamp(e, n, o) {
  var r;

  if (o < n) {
    r = n;
    n = o;
    o = r;
  }

  return e < n ? n : o < e ? o : e;
}
function clamp01(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function lerp(e, n, o) {
  return e + (n - e) * o;
}
function toRadian(e) {
  return e * _d2r;
}
function toDegree(e) {
  return e * _r2d;
}
function randomRange(e, n) {
  return Math.random() * (n - e) + e;
}
function randomRangeInt(e, n) {
  return Math.floor(randomRange(e, n));
}
function pseudoRandom(e) {
  return (e = (9301 * e + 49297) % 233280) / 233280;
}
function pseudoRandomRange(e, n, o) {
  return pseudoRandom(e) * (o - n) + n;
}
function pseudoRandomRangeInt(e, n, o) {
  return Math.floor(pseudoRandomRange(e, n, o));
}
function nextPow2(e) {
  --e;

  e =
    (e = (e = (e = (e |= e >> 1) | (e >> 2)) | (e >> 4)) | (e >> 8)) |
    (e >> 16);

  return ++e;
}
function repeat(e, n) {
  return e - Math.floor(e / n) * n;
}
function pingPong(e, n) {
  e = repeat(e, 2 * n);
  e = n - Math.abs(e - n);
  return e;
}
function inverseLerp(e, n, o) {
  return (o - e) / (n - e);
}
exports.EPSILON = 0.000001 /* 1e-6 */;
exports.random = Math.random;
