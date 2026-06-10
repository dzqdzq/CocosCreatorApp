Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {};
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-checkbox.html"),
  "utf8"
);

exports.methods = {
  onConfirm(e) {
    console.log("onConfirm", e.target.value);
    this.$refs.value.innerHTML = e.target.value;
  },
  onChange(e) {
    console.log("onChange", e.target.value);
  },
};
