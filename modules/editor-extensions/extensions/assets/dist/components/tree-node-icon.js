var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeNodeIcon = undefined;
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const template = readFileSync(
  join(__dirname, "../../static/template/tree-node-icon.html"),
  "utf8"
);

exports.TreeNodeIcon = vue_js_1.default.extend({
  name: "TreeNodeIcon",
  props: { asset: Object, origin: String, expand: Boolean },
  computed: {
    directoryIcon() {
      var e = this.asset;
      return e.isDirectory && !e.isDB
        ? e.isBundle
          ? this.expand
            ? "bundle-folder-open"
            : "bundle-folder"
          : this.expand
          ? "folder-open"
          : "folder"
        : null;
    },
  },
  template,
});
