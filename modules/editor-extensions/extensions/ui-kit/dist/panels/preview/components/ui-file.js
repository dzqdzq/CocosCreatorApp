Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return { filepath: Editor.App.path };
}
function mounted() {
  this.$refs.value.innerHTML = "file path: " + this.filepath;
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-file.html"),
  "utf8"
);

exports.methods = {
  onConfirm(e) {
    console.log("onConfirm", e);
  },
  onChange(e) {
    console.log("onChange", e);
    this.$refs.value.innerHTML = "file path: " + e;
  },
};
