Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultBezier = undefined;
exports.findBezierDataByName = findBezierDataByName;
exports.transformBezierDataToPoint = transformBezierDataToPoint;

const { ref } = require("vue/dist/vue.js");

const defaultBezierMap = {
  Linear: { Default: { name: "linear", data: [0.3, 0.3, 0.7, 0.7] } },
  "Ease In": {
    Cubic: { name: "cubicIn", data: [0.4, 0, 0.5, 0.5] },
    Quad: { name: "quadIn", data: [0.55, 0.08, 0.68, 0.53] },
    Quart: { name: "quartIn", data: [0.89, 0.03, 0.68, 0.21] },
    Quint: { name: "quintIn", data: [0.75, 0.05, 0.85, 0.06] },
    Sine: { name: "sineIn", data: [0.48, 0, 0.73, 0.71] },
    Expo: { name: "expoIn", data: [0.95, 0.04, 0.79, 0.03] },
    Circ: { name: "circIn", data: [0.6, 0.04, 0.98, 0.33] },
  },
  "Ease Out": {
    Cubic: { name: "cubicOut", data: [0.06, 0.12, 0.58, 1] },
    Quad: { name: "quadOut", data: [0.25, 0.46, 0.45, 0.95] },
    Quart: { name: "quartOut", data: [0.16, 0.84, 0.43, 1] },
    Quint: { name: "quintOut", data: [0.22, 1, 0.31, 1] },
    Sine: { name: "sineOut", data: [0.39, 0.59, 0.56, 1] },
    Expo: { name: "expoOut", data: [0.18, 1, 0.22, 1] },
    Circ: { name: "circOut", data: [0.08, 0.82, 0.01, 1] },
  },
  "Ease In Out": {
    Cubic: { name: "cubicInOut", data: [0.42, 0, 0.58, 1] },
    Quad: { name: "quadInOut", data: [0.48, 0.04, 0.52, 0.96] },
    Quart: { name: "quartInOut", data: [0.83, 0, 0.17, 1] },
    Quint: { name: "quintInOut", data: [0.94, 0, 0.06, 1] },
    Sine: { name: "sineInOut", data: [0.46, 0.05, 0.54, 0.95] },
    Expo: { name: "expoInOut", data: [1, 0, 0, 1] },
    Circ: { name: "circInOut", data: [0.86, 0.14, 0.14, 0.86] },
  },
};

let presetArr = [];
function findBezierDataByName(a) {
  if (typeof a == "string") {
    for (const t of Object.keys(exports.defaultBezier)) {
      for (const a of Object.keys(exports.defaultBezier[t])) {
        var e = exports.defaultBezier[t][a];
        if (e && a === e.name) {
          return e.data;
        }
      }
    }
  }
  return null;
}
function transformBezierDataToPoint(a) {
  return { p1: [0, 1], p2: [a[0], 1 - a[1]], p3: [a[2], 1 - a[3]], p4: [1, 0] };
}

Object.values(defaultBezierMap).forEach((a) => {
  presetArr = presetArr.concat(Object.values(a));
});

exports.defaultBezier = ref(presetArr);
