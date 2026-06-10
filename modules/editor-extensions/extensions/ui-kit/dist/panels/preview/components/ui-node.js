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
  this.$refs.value.innerHTML = this.$refs.node.value;
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-node.html"),
  "utf8"
);

exports.methods = {
  onChange(e) {
    this.$refs.value.innerHTML = e;
  },
  onConfirm(e) {
    console.log("onConfirm", e);
  },
  onCancel(e) {
    console.log("onCancel", e);
  },
};
