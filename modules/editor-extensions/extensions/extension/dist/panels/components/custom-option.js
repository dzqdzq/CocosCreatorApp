var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs");

const { join } = require("path");

const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
exports.default = vue_js_1.default.extend({
  name: "CustomSelectOption",
  props: {
    value: { type: String, required: true },
    label: { type: String, default: "" },
    title: { type: String, default: "" },
    selected: { type: Boolean, default: false },
  },
  computed: {
    height() {
      return this.$parent.height || 8;
    },
  },
  created() {
    this.$parent.options.push({
      label: this.label,
      value: this.value,
      title: this.title || "",
    });
  },
  destroyed() {
    var e = this.$parent.options.findIndex((e) => e.value === this.value);

    if (-1 < e) {
      this.$parent.options.splice(e, 1);
    }
  },
  methods: {
    clickItem() {
      this.$parent.select(this.value);
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static/template/components/custom-option.html"),
    "utf8"
  ),
});
