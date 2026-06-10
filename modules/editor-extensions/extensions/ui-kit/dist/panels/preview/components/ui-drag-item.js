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
  join(__dirname, "../../../../static/template/components/ui-drag-item.html"),
  "utf8"
);

exports.methods = {
  dragstart(t) {
    t.dataTransfer.setData("value", t.target.getAttribute("value"));
  },
  drop(e) {
    if (e.target.hoving) {
      let t = "";
      var r = Array.from(e.dataTransfer.files);

      t =
        r && r.length > 0
          ? JSON.stringify(r.map((t) => t.path))
          : e.dataTransfer.getData("value");

      this.$refs.value.innerHTML = "drop value: " + t;

      this.$refs.currentDragInfo.innerHTML = JSON.stringify(
        Editor.UI.DragArea.currentDragInfo
      );
    }
  },
};
