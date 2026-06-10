Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return { config: JSON.stringify({ max: 1340, preci: 0 }), time: 12 };
}
function mounted() {
  this.$refs.scalePlate.setConfig({ min: 20, max: 66, preci: 2 });
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-scale-plate.html"),
  "utf8"
);

exports.methods = {
  onConfirm(e) {
    console.log("onConfirm", e);
  },
  onChange(e) {
    console.log("onChange", e);
  },
  onTransform(e) {
    console.log("onTransform");
  },
};
