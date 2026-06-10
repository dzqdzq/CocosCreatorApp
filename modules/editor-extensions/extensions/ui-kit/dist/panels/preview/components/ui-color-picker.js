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
  this.$refs.value.innerHTML =
    "current value: " + this.$refs["color-picker"].value;
}

exports.template = readFileSync(
  join(
    __dirname,
    "../../../../static/template/components/ui-color-picker.html"
  ),
  "utf8"
);

exports.methods = {
  onConfirm(e) {
    console.log("onConfirm", e);
  },
  onChange(e) {
    console.log("onChange", e);
    this.$refs.value.innerHTML = "current value: " + e;
  },
  onCancel(e) {
    console.log("onCancel", e);
  },
};
