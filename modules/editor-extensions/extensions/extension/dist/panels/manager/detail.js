var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs");

const { join } = require("path");

const vue_js_1 = __importDefault(require("vue/dist/vue.js"));

const { formatDate } = require("../../public/utils");

const defaultCoverURL = "packages://extension/static/logo64.png";
exports.default = vue_js_1.default.extend({
  name: "ExtensionsDetail",
  props: {
    detail: { type: Object },
    info: { type: Object },
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: "" },
  },
  data() {
    return { currentTab: "desc" };
  },
  computed: {
    size() {
      return this.detail && this.detail.size
        ? this.formatSize(this.detail.size)
        : "";
    },
    cover() {
      let e = defaultCoverURL;

      if (
        this.detail &&
        typeof this.detail.icon_url == "string" &&
        this.detail.icon_url !== ""
      ) {
        e = this.detail.icon_url;
      } else if (
        this.info &&
        typeof this.info.icon_url == "string" &&
        this.info.icon_url !== ""
      ) {
        e = this.info.icon_url;
      }

      return e;
    },
  },
  mounted() {},
  destroyed() {},
  methods: {
    t(e) {
      return Editor.I18n.t("extension.manager." + e);
    },
    formatTime(e) {
      if (typeof e == "number") {
        e *= 1000 /* 1e3 */;
      } else {
        e += "000";
      }

      return formatDate(e);
    },
    refresh() {
      this.$emit("refresh");
    },
    formatSize(e) {
      return "";
    },
    imageError(e) {
      var e = e.target;
      var t = defaultCoverURL;

      if (e.src !== t && e.src !== "") {
        e.src = t;
      }
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static/template/manager/detail.html"),
    "utf8"
  ),
});
