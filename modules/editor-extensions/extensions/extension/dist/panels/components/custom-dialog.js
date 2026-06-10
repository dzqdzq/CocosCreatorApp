var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs");

const { join } = require("path");

const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
exports.default = vue_js_1.default.extend({
  name: "CustomDialog",
  template: readFileSync(
    join(__dirname, "../../../static/template/components/custom-dialog.html"),
    "utf8"
  ),
  props: { info: { type: Object } },
  data() {
    return { detail: this.info };
  },
  computed: {
    allChecked() {
      return (
        this.detail &&
        this.detail.dependencies.filter((e) => !e.disable && !e.checked)
          .length === 0
      );
    },
  },
  watch: {
    info(e) {
      if (e) {
        this.detail = e;
      }
    },
  },
  methods: {
    cancel() {
      this.$emit("cancel");
    },
    confirm() {
      this.$emit("confirm", this.detail);
    },
    selectAll() {
      const t = !this.allChecked;
      this.detail.dependencies.forEach((e) => {
        if (!e.disable) {
          e.checked = t;
        }
      });
    },
    select(e) {
      if (!this.detail.dependencies[e].disable) {
        this.detail.dependencies[e].checked =
          !this.detail.dependencies[e].checked;
      }
    },
  },
});
