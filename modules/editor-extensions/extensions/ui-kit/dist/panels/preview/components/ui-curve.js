Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { readJSONSync } = require("fs-extra");

const { join } = require("path");

const defaultPresets = readJSONSync(
  join(__dirname, "../../../../static/curve-editor/preset.json")
);

const testPresets = [
  [
    { point: { x: 0, y: 0 }, interpMode: 1 },
    { point: { x: 0.5, y: 0.5 }, interpMode: 0 },
    { point: { x: 1, y: 1 }, interpMode: 0 },
  ],
];

function data() {
  return {
    value: JSON.stringify(
      transValueToCurves(
        [
          { outTangent: 1, point: { x: 0.2, y: 0.4 } },
          { inTangent: 1, outTangent: 1, point: { x: 0.8, y: 0.8 } },
          { inTangent: 0.5, point: { x: 1, y: 0.5 } },
        ],
        "test"
      )
    ),
    config: JSON.stringify({
      xRange: [0, 1],
      yRange: [0, 1],
      precision: 4,
      showPreWrapMode: true,
      showPostWrapMode: true,
      type: "hermit",
    }),
    negativeConfig: JSON.stringify({
      xRange: [-1, 1],
      yRange: [-1, 1],
      negative: true,
      precision: 4,
      showPreWrapMode: true,
      showPostWrapMode: true,
      type: "hermit",
    }),
    testPresets: [],
  };
}
function mounted() {
  var e = testPresets.concat(defaultPresets.default);
  this.testPresets = e.map((e, t) => transValueToCurves(e, "test" + t));
}
function transValueToCurves(e, t) {
  return {
    preWrapMode: 0,
    postWrapMode: 0,
    keys: (e = e.map((e) => {
      e.interpMode = e.interpMode || 0;
      e.tangentWeightMode = e.tangentWeightMode || 0;
      e.outTangentWeight = e.outTangentWeight || 1;
      e.inTangentWeight = e.inTangentWeight || 1;
      e.outTangent = e.outTangent || 0;
      e.inTangent = e.inTangent || 0;
      return e;
    })),
    color: "red",
  };
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-curve.html"),
  "utf8"
);

exports.methods = {};
