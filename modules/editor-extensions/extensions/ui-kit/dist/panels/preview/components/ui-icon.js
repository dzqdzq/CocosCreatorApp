Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return { iconMap: Editor.UI.__protected__.Icon.Map };
}
function mounted() {}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-icon.html"),
  "utf8"
);

exports.methods = {};
