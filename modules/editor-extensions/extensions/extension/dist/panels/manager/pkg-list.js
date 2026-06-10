var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs");

const { join } = require("path");

const pkg_node_1 = __importDefault(require("./pkg-node"));
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.default = Vue.extend({
  name: "PkgList",
  components: { "pkg-node": pkg_node_1.default },
  props: {
    label: { type: String, default: "" },
    active: { type: Boolean, default: false },
    choosed: { type: String, default: "" },
    pageSize: { type: Number, default: 15 },
    isSearch: { type: Boolean, default: false },
    searchKey: { type: String, default: "" },
  },
  data() {
    return { list: [], page: 1, loading: false, total: 0, errorMessage: "" };
  },
  computed: {
    isNoData() {
      return !(
        this.loading ||
        this.list.length !== 0 ||
        (this.isSearch && this.searchKey === "")
      );
    },
    isNoMore() {
      return (
        this.list.length > 0 &&
        (this.list.length === this.total || this.list.length > this.total)
      );
    },
  },
  watch: {
    active(t, e) {
      if (
        this.isSearch ||
        !t ||
        this.list.length !== 0 ||
        this.errorMessage ||
        this.loading
      ) {
        if (t && this.list.length > 0) {
          this.choose(this.list[0]);
        }
      } else {
        this.page = 1;
        this.$emit("update-list", this.label, this.page, this.pageSize);
      }
    },
    loading(t) {
      if (t && this.list.length > 0) {
        this.$nextTick(() => {
          this.$refs.main.scrollTop =
            this.$refs.main.scrollTop + this.$refs.loading.scrollHeight;
        });
      }
    },
  },
  created() {},
  mounted() {},
  methods: {
    t(t) {
      return Editor.I18n.t("extension.manager." + t);
    },
    scrollToBottom(t) {
      if (!this.loading && !this.errorMessage && !this.isNoMore) {
        t.path || (t.path = t.composedPath());

        (t = t.path[0]).scrollHeight - t.scrollTop - 5 < t.clientHeight &&
          ((this.page += 1),
          this.$emit("update-list", this.label, this.page, this.pageSize));
      }
    },
    updateList(t, e) {
      this.list.push(...t);
      this.total = e;

      if (this.active && this.page === 1 && this.list.length > 0) {
        this.choose(this.list[0]);
      }
    },
    updateDownloadStatus(e, s, i, a) {
      this.list.forEach((t) => {
        if (t.name === e) {
          if (s) {
            t.state = "none";
            t.progress = 0;
          } else if (i) {
            t.state = "none";
            t.isInstalled = true;
            t.enable = true;

            t.isBuiltIn && !t.builtInVersion
              ? ((t.builtInPath = t.path),
                (t.builtInVersion = t.version),
                (t.version = i.version),
                (t.path = i.path))
              : ((t.path = i.path), (t.version = i.version));

            t.progress = 0;
          } else {
            t.state !== "installing" && (t.state = "installing");
            t.progress = a;
          }
        }
      });
    },
    updateUninstallStatus(s, i, a, l) {
      this.list.forEach((t) => {
        var e;

        if (t.name === s) {
          if (i) {
            t.state = "none";
            t.progress = 0;
          } else if (a) {
            t.state = "none";
            t.progress = 0;
            e = typeof a == "function" ? a(t) : a;
            t.version = e.version;
            t.path = e.path;
            e.path === "" && (t.isInstalled = false);
          } else {
            t.state !== "uninstalling" && (t.state = "uninstalling");
            t.progress = l;
          }
        }
      });
    },
    addPackage(t) {
      if (this.list.length > 0) {
        this.list.unshift(t);
      }
    },
    refresh() {
      this.$emit("refresh");
    },
    reset() {
      this.list = [];
      this.page = 1;
      this.loading = false;
      this.total = 0;
      this.errorMessage = "";
    },
    setError(t) {
      this.list = [];
      this.errorMessage = t;
    },
    remove(e) {
      var t = this.list.findIndex((t) => t.name === e);

      if (-1 < t && (this.list.splice(t, 1), this.active)) {
        if (this.list.length > 0) {
          this.choose(this.list[0]);
        } else {
          this.choose(undefined);
        }
      }
    },
    toggleEnableHandle(e) {
      this.list.forEach((t) => {
        if (t.name === e.name && t.path === e.path) {
          t.enable = e.enable;
        }
      });
    },
    handleListUpdate(t) {
      if (this.list.length !== 0) {
        t.forEach((e) => {
          var t = this.list.findIndex(
            (t) => t.name === e.name && t.path === e.path
          );

          if (-1 < t) {
            this.list[t].enable = e.enable;
            this.list[t].isInstalled = e.isInstalled;
            this.list[t].progress = e.progress;
            this.list[t].state = e.state;
            this.list[t].version = e.version;
            this.list[t].path = e.path;
          }
        });
      }
    },
    updateUninstallLoading(e, s) {
      this.list.forEach((t) => {
        if (t.name === e) {
          t.state = s ? "uninstalling" : "none";
        }
      });
    },
    toggleEnable(t, e, s) {
      this.$emit("set-enable", t, !e, s);
    },
    removePackage(e) {
      this.list.forEach((t) => {
        if (t.name === e) {
          t.state = "uninstalling";
        }
      });

      this.$emit("remove-package", e);
    },
    uninstallPackage(t, e, s) {
      this.$emit("uninstall-package", t, e, s);
    },
    updatePackage(e, t, s) {
      this.list.forEach((t) => {
        if (t.name === e) {
          t.state = "installing";
        }
      });

      this.$emit("update-package", e, t, s);
    },
    choose(t) {
      this.$emit("choose", t);
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static/template/manager/pkg-list.html"),
    "utf8"
  ),
});
