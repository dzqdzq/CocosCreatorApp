Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.clamp01 = clamp01;
exports.add = add;
exports.sub = sub;
exports.multi = multi;
exports.divide = divide;
exports.toFixed = toFixed;
const maxPreci = 20;
function clamp(t, e, r) {
  return Math.min.call(null, Math.max.call(null, t, e), r);
}
function clamp01(t) {
  return clamp(t, 0, 1);
}
function add(t, e) {
  var {
    maxPow: t,
    num1: e,
    num2,
  } = _computeMaxPow((t = toValidNumber(t)), (e = toValidNumber(e)));
  return (e + num2) / t;
}
function sub(t, e) {
  var {
    maxPow: t,
    num1: e,
    num2,
  } = _computeMaxPow((t = toValidNumber(t)), (e = toValidNumber(e)));
  return (e - num2) / t;
}
function multi(t, e) {
  var {
    maxPow: t,
    num1: e,
    num2,
  } = _computeMaxPow((t = toValidNumber(t)), (e = toValidNumber(e)));
  return (e * num2) / t / t;
}
function divide(t, e) {
  var r;
  t = toValidNumber(t);

  if ((e = toValidNumber(e))) {
    ({ num1: e, num2: r } = _computeMaxPow(t, e));
    return e / r;
  }

  if (t > 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Number.NEGATIVE_INFINITY;
}
function toValidNumber(t) {
  if ("number" == typeof (t = Number(t)) && !Number.isNaN(t) && isFinite(t)) {
    return t;
  }
  throw new Error("Invalid params " + t);
}
function _computeMaxPow(t, e) {
  let r;
  var t = toNonExponential(t);
  var e = toNonExponential(e);
  var o = _comPreci(t);
  var n = _comPreci(e);
  r = Math.max(o, n);
  var a = 10 ** r;

  if (r > 20) {
    r = 20;
  }

  var t = Number(
    t.replace(".", "") +
      Array(r - o)
        .fill(0)
        .join("")
  );

  var o = Number(
    e.replace(".", "") +
      Array(r - n)
        .fill(0)
        .join("")
  );

  return { maxPow: a, maxPreci: r, num1: t, num2: o };
}
function toNonExponential(t) {
  var e = t.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/);
  return t.toFixed(Math.max(0, (e[1] || "").length - Number(e[2])));
}
function _comPreci(t) {
  let e;
  try {
    e = t.split(".")[1].length;
  } catch (t) {
    e = 0;
  }
  return e;
}
function toFixed(t, e) {
  return parseFloat((Math.round(t * 10 ** e) / 10 ** e).toFixed(e));
}
