Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return { projectPath: Editor.Project.path };
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-link.html"),
  "utf8"
);

exports.methods = {};
