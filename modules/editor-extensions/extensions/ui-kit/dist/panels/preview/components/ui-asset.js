Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {
    validImageUuid: "03721795-84b1-4dcd-8eb3-c8e6b88ee535",
    validImageUrl: "db://internal/default_cubemap/back.jpg",
    invalidImageUuid: "7b7d6b57-cda5-4609-b99e-9d60b8989345",
  };
}
function mounted() {
  this.$refs.value.innerHTML = "asset uuid: " + this.$refs.image.value;
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-asset.html"),
  "utf8"
);

exports.methods = {
  onChange(e) {
    console.log("onChange", e);
    this.$refs.value.innerHTML = "asset uuid: " + e;
  },
  onConfirm(e) {
    console.log("onConfirm", e);
  },
  onPreview() {
    console.log("onPreview");
  },
};
