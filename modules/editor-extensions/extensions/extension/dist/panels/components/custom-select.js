var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs");

const { join } = require("path");

const vue_js_1 = __importDefault(require("vue/dist/vue.js"));

const {
  getTargetFromEvent,
  elementsContains,
} = require("../../public/utils-dom");

exports.default = vue_js_1.default.extend({
  name: "CustomSelect",
  props: {
    value: { type: String, default: "" },
    loading: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    height: { type: Number, default: 24 },
    maxCount: { type: Number, default: 15 },
    errorMessage: { type: String, default: "" },
  },
  data() {
    return {
      isShow: false,
      curValue: "",
      curLabel: "",
      curTitle: "",
      options: [],
    };
  },
  watch: {
    value() {
      this.changeValue();
    },
    loading(t) {
      if (t && this.options.length > 0) {
        this.$nextTick(() => {
          this.$refs.options.scrollTop =
            this.$refs.options.scrollTop + this.$refs.loading.scrollHeight;
        });
      }
    },
  },
  mounted() {
    document.body.addEventListener("click", this.onDocumentClick);
    this.changeValue();
  },
  destroyed() {
    document.body.removeEventListener("click", this.onDocumentClick);
  },
  methods: {
    changeValue() {
      var t = this.options.find((t) => t.value === this.value);

      if (t) {
        this.curLabel = t.label;
        this.curValue = t.value;
        this.curTitle = t.title || "";
        this.$emit("select", this.value);
      }
    },
    showOption() {
      this.isShow = !this.isShow;
      this.$emit("toggleOptions", this.isShow);
    },
    select(t) {
      this.showOption();
      this.$emit("input", t);
    },
    refresh() {
      this.$emit("refresh");
    },
    scrollHandle(t) {
      if (!this.loading && !this.errorMessage) {
        t.path || (t.path = t.composedPath());

        (t = t.path[0]).scrollHeight - t.scrollTop - 5 < t.clientHeight &&
          this.$emit("scroll-to-bottom");
      }
    },
    onDocumentClick(t) {
      t = getTargetFromEvent(t);

      if (!elementsContains(this.$el, t)) {
        this.isShow = false;
        this.$emit("toggleOptions", false);
      }
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static/template/components/custom-select.html"),
    "utf8"
  ),
});
