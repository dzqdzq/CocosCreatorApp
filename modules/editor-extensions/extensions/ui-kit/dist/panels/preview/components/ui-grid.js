Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {
    showXConfig: JSON.stringify({ showY: false }),
    showYConfig: JSON.stringify({ showX: false }),
  };
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-grid.html"),
  "utf8"
);

exports.methods = {
  onChange(e) {
    console.log("onChange");
  },
};
