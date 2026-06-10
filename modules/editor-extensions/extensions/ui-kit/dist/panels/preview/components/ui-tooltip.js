Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {};
}
function mounted() {}
async function beforeClose() {}
async function close() {}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-tooltip.html"),
  "utf8"
);

exports.methods = {};
