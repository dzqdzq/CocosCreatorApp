var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const remote_1 = require("@electron/remote");

const { readFileSync } = require("fs");

const { join } = require("path");

const vue_js_1 = __importDefault(require("vue/dist/vue.js"));

const { eq } = require("semver");

const { injectSdk } = require("./sdk");

const interface_1 = require("../../public/interface");

const { isOnlineExtension } = require("../../public/utils");

const custom_select_1 = __importDefault(require("../components/custom-select"));
const custom_option_1 = __importDefault(require("../components/custom-option"));
exports.default = vue_js_1.default.extend({
  name: "PkgNode",
  components: {
    "custom-select": custom_select_1.default,
    "custom-option": custom_option_1.default,
  },
  inject: { ...injectSdk() },
  props: {
    pkg: { type: Object, required: true },
    label: { type: String, default: "" },
    choosed: { type: Boolean, default: false },
  },
  data() {
    return {
      dev: Editor.App.dev,
      rank: Math.random(),
      selectPackageVersion: "",
      packageVersionOptions: [],
      queryHistoryLoading: false,
      page: 0,
      pageSize: 8,
      total: 0,
      errorMessage: "",
    };
  },
  computed: {
    isInstalled() {
      return this.pkg.isInstalled;
    },
    isInstalling() {
      return this.pkg.state === "installing";
    },
    isUninstalling() {
      return this.pkg.state === "uninstalling";
    },
    progress() {
      return this.pkg.progress;
    },
    enable() {
      return this.pkg.enable;
    },
    isCocosSource() {
      return (
        this.label === interface_1.ExtensionManagerTab.Cocos ||
        this.label === interface_1.ExtensionManagerTab.BuiltIn ||
        this.pkg.isCocosSource
      );
    },
    isPurchasedList() {
      return this.label === interface_1.ExtensionManagerTab.Purchased;
    },
    isBuiltinList() {
      return (
        this.label === interface_1.ExtensionManagerTab.BuiltIn ||
        this.pkg.isBuiltIn
      );
    },
    isCocosList() {
      return this.label === interface_1.ExtensionManagerTab.Cocos;
    },
    isInstalledList() {
      return this.label === interface_1.ExtensionManagerTab.Installed;
    },
    isBaseVersion() {
      return (
        typeof this.pkg.builtInVersion == "string" &&
        eq(this.pkg.version, this.pkg.builtInVersion)
      );
    },
    isShowUninstall() {
      return this.pkg.isInstalled && !this.pkg.isBuiltIn;
    },
    showVersionOptions() {
      return (
        this.isInstalled &&
        !this.isInstalledList &&
        this.packageVersionOptions.length > 1 &&
        !this.isInstalling &&
        !this.isUninstalling
      );
    },
    canFetchVersionOptions() {
      return isOnlineExtension(this.pkg);
    },
    updateDisabled() {
      return this.pkg.version === this.selectPackageVersion;
    },
  },
  mounted() {
    this.refreshOptions();
  },
  destroyed() {},
  methods: {
    t(e) {
      return Editor.I18n.t("extension.manager." + e);
    },
    toggleEnable() {
      if (!this.isBuiltinList) {
        this.$emit(
          "toggle-enable",
          this.pkg.name,
          this.pkg.enable,
          this.pkg.path
        );
      }
    },
    refreshOptions() {
      this.page = 1;
      this.updateVersionList(true);
    },
    openFolder() {
      remote_1.shell.showItemInFolder(this.pkg.path);
    },
    choose() {
      this.$emit("choose", this.pkg);
    },
    async updatePackage() {
      let e = "";

      if (this.isInstalled) {
        e = this.selectPackageVersion;
      } else if (isOnlineExtension(this.pkg)) {
        e = this.pkg.latest_version;
      }

      if (e === "") {
        throw new Error(
          `Cannot update(or install) package, version “${e}” is invalid.`
        );
      }

      this.$emit("update-package", this.pkg.name, e, this.pkg);
    },
    onUpdatePackageClick(e) {
      if (!this.updateDisabled) {
        this.updatePackage();
      }
    },
    toggleOptions(e) {
      if (this.page === 0 && e) {
        this.page = 1;
        this.updateVersionList(true);
      }
    },
    removePackage() {
      this.$emit("remove-package", this.pkg.name);
    },
    uninstallPackage() {
      this.$emit("uninstall-package", this.pkg.name, this.pkg, this.label);
    },
    updateVersionList(s) {
      var e;

      if (!this.queryHistoryLoading) {
        this.queryHistoryLoading = true;
        this.errorMessage = "";
        s && (this.packageVersionOptions = []);

        this.canFetchVersionOptions &&
          ((e = {
            name: this.pkg.name,
            e: Editor.App.version,
            page: this.page,
            pageSize: this.pageSize,
            lang: Editor.I18n.getLanguage(),
          }),
          this.sdk
            .getExtensionVersionList(e)
            .then((e) => {
              this.total = e.count;
              e = e.versions.map((e) => ({
                name: e.name,
                version: e.version,
                description: e.updateLog,
              }));
              const t = this.pkg.builtInVersion;

              if (s && this.pkg.isBuiltIn && t) {
                if (!e.find((e) => eq(e.version, t))) {
                  e.push({
                    name: this.pkg.name,
                    version: t,
                    description: this.pkg.description,
                  });
                }
              }

              this.packageVersionOptions.push(...e);

              if (s && isOnlineExtension(this.pkg)) {
                this.selectPackageVersion = this.pkg.latest_version;
              }
            })
            .catch((e) => {
              this.packageVersionOptions = [];
              this.errorMessage = this.t("network_error_tip");
              throw e;
            })
            .finally(() => {
              this.queryHistoryLoading = false;
            }));
      }
    },
    handleSelect() {},
    scrollToBottom() {
      if (!this.queryHistoryLoading) {
        this.page += 1;
        this.updateVersionList();
      }
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static/template/manager/pkg-node.html"),
    "utf8"
  ),
});
