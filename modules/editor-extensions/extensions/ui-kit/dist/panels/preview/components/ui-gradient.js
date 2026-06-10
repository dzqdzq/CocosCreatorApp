Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {
    colorValue: {
      alpha: [
        { progress: 0, value: 0 },
        { progress: 1, value: 1 },
      ],
      color: [{ progress: 0.9174107142857143, value: "#c93333" }],
    },
  };
}
function mounted() {
  this.$refs.value.innerText = JSON.stringify(this.colorValue);
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-gradient.html"),
  "utf8"
);

exports.methods = {
  onConfirm(e) {
    console.log("onConfirm", e);
    this.$refs.value.innerText = JSON.stringify(e);
  },
  onChange(e) {
    console.log("onChange", e);
  },
  onOpen() {
    console.log("open");
  },
};
