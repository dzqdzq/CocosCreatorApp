Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return { value: "#ccc" };
}
function mounted() {
  this.$refs.value.innerHTML = "current value: " + this.value;
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-color.html"),
  "utf8"
);

exports.methods = {
  onConfirm(e) {
    console.log("onConfirm", e);
    this.$refs.value.innerHTML = "current value: " + e;
  },
  onChange(e) {
    console.log("onChange", e);
  },
  onCancel(e) {
    console.log("onCancel", e);
  },
};
