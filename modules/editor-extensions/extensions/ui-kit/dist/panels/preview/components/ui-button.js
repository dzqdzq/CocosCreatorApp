Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return { clickedNumber: 0 };
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-button.html"),
  "utf8"
);

exports.methods = {
  click() {
    console.log("onConfirm");
    this.clickedNumber++;
  },
};
