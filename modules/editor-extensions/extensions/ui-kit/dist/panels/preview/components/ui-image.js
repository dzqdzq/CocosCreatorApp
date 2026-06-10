Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {
    assetUuid: "52ef29ed-bd92-4e94-ab2f-0ebc91bf3a60",
    assetUrl: "db://internal/default_ui/atom.png/texture",
    subAssetUuid: "24c419ea-63a8-4ea1-a9d0-7fc469489bbc@f9941",
    value: "24c419ea-63a8-4ea1-a9d0-7fc469489bbc@f9941",
  };
}
function mounted() {
  this.$refs.value.innerHTML = this.value;
}

exports.template = readFileSync(
  join(__dirname, "../../../../static/template/components/ui-image.html"),
  "utf8"
);

exports.methods = {
  confirm(e) {
    this.$refs.value.innerHTML = e;
  },
};
