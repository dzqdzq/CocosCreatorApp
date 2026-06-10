Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.data = undefined;
exports.template = undefined;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

exports.template = readFileSync(
  join(__dirname, "../../../../static/contributions/config-toolbar.html"),
  "utf8"
);

const data = () => ({
  currentConfigName: "",
});

exports.data = data;

exports.methods = {
  onConfigNameChange(e) {
    var t = this;
    t.currentConfigName = e.target.value;
    t.$emit("update", "search-name", t.currentConfigName);
  },
};
