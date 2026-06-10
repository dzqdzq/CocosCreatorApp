Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {};
}
function mounted() {
  this.$refs.graph.render(require("./ui-node-graph/layout").layout);
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-node-graph.html"),
  "utf8"
);

exports.methods = {};

const testA = {
  title: "StringToNumber",
  size: { width: 200, height: 80 },
  input: { name_1: { type: "string" }, name_2: { type: "string" } },
  output: { name_1: { type: "number" }, name_2: { type: "number" } },
  panel: join(__dirname, "ui-node-graph/a.js"),
};

const testB = {
  title: "NumberToString",
  size: { width: 200, height: 120 },
  input: { name_1: { type: "number" }, name_2: { type: "number" } },
  output: {
    name_1: { type: "string" },
    name_2: { type: "string" },
    name_3: { type: "string" },
    name_4: { type: "string" },
  },
  panel: join(__dirname, "ui-node-graph/b.js"),
};

Editor.UI.__protected__.NodeGraph.registerNodeRender("testA", testA);
Editor.UI.__protected__.NodeGraph.registerNodeRender("testB", testB);

Editor.UI.__protected__.NodeGraph.registerNodeRender("string", {
  panel: join(__dirname, "ui-node-graph/string.js"),
});
