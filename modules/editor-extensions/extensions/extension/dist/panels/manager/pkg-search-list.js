var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageSearchList = undefined;
exports.createDefaultGroup = createDefaultGroup;
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const interface_1 = require("../../public/interface");

const { hasOwn } = require("../../public/utils");

const pkg_node_1 = __importDefault(require("./pkg-node"));

const template = `
  <div class="pkg-list">
      <div ref="main" class="content">
          <section v-for="(group) in groups" v-show="group.list.length > 0" :key="group.key" class="content-group">
              <div class="pkg-list__subtitle">
                  <ui-label>{{ "i18n:extension.manager." + group.key }}</ui-label>
              </div>
              <pkg-node
                  class="pkg-list-item"
                  v-for="(pkg, index) in group.list"
                  :key="\`\${index}__\${pkg.name}\`"
                  :choosed="choosed === pkg.name"
                  :pkg="pkg"
                  :label="label"
                  @choose="choose"
                  @toggle-enable="toggleEnable"
                  @update-package="updatePackage"
                  @remove-package="removePackage"
                  @uninstall-package="uninstallPackage"
              ></pkg-node>
          </section>
      </div>

      <div class="extenstions-empty" v-show="loading && isGroupEmpty">
          <ui-loading></ui-loading>
      </div>

      <div class="extenstions-empty" v-show="isNoData && !errorMessage">
          <ui-label value="i18n:extension.manager.not_data"></ui-label>
      </div>

      <div class="extenstions-empty error" v-show="errorMessage">
          <ui-label :value="errorMessage"></ui-label>
          <ui-button outline @click.stop="refresh">
              <ui-label value="i18n:extension.manager.refresh"></ui-label>
          </ui-button>
      </div>
  </div>
`;

function createDefaultGroup() {
  return [
    {
      key: interface_1.ExtensionManagerTab.BuiltIn,
      label: interface_1.ExtensionManagerTab.BuiltIn,
      list: [],
      total: 0,
    },
    {
      key: interface_1.ExtensionManagerTab.Cocos,
      label: interface_1.ExtensionManagerTab.Cocos,
      list: [],
      total: 0,
    },
    {
      key: interface_1.ExtensionManagerTab.Installed,
      label: interface_1.ExtensionManagerTab.Installed,
      list: [],
      total: 0,
    },
  ];
}
exports.PackageSearchList = vue_js_1.default.extend({
  name: "PackageSearchList",
  components: { pkgNode: pkg_node_1.default },
  mixins: [],
  props: {
    label: { type: String, default: interface_1.ExtensionManagerTab.Search },
    active: { type: Boolean, default: false },
    choosed: { type: String, default: "" },
    pageSize: { type: Number, default: 15 },
    searchKey: { type: String, default: "" },
  },
  data() {
    return {
      groups: createDefaultGroup(),
      page: 1,
      loading: false,
      errorMessage: "",
    };
  },
  computed: {
    isGroupEmpty() {
      return this.groups.every((e) => e.list.length === 0);
    },
    isNoData() {
      return !this.loading && this.isGroupEmpty && this.searchKey !== "";
    },
    isNoMore() {
      return true;
    },
  },
  watch: {},
  mounted() {},
  methods: {
    t(e) {
      return Editor.I18n.t("extension.manager." + e);
    },
    scrollToBottom(e) {
      if (!this.loading && !this.errorMessage && !this.isNoMore) {
        e.path || (e.path = e.composedPath());

        (e = e.path[0]).scrollHeight - e.scrollTop - 5 < e.clientHeight &&
          ((this.page += 1),
          this.$emit("update-list", this.label, this.page, this.pageSize));
      }
    },
    updateList(t, e, s) {
      var a = this.groups.find((e) => e.key === t);

      if (
        a != null &&
        (a.list.push(...e), (a.total = s), this.active) &&
        this.page === 1 &&
        a.list.length > 0
      ) {
        this.choose(a.list[0]);
      }
    },
    batchUpdateList(e) {
      let t = undefined;
      for (const a of this.groups) {
        var s;

        if (
          hasOwn(e, a.key) &&
          ((s = e[a.key]),
          a.list.push(...s.list),
          (a.total = s.total),
          t === undefined) &&
          a.list.length > 0
        ) {
          t = a.list[0];
        }
      }

      if (this.active && this.page === 1 && t !== undefined) {
        this.choose(t);
      }
    },
    updateDownloadStatus(t, s, a, i) {
      for (const e of this.groups) {
        e.list.forEach((e) => {
          if (e.name === t) {
            if (s) {
              e.state = "none";
              e.progress = 0;
            } else if (a) {
              e.state = "none";
              e.isInstalled = true;
              e.enable = true;

              e.isBuiltIn && !e.builtInVersion
                ? ((e.builtInPath = e.path),
                  (e.builtInVersion = e.version),
                  (e.version = a.version),
                  (e.path = a.path))
                : ((e.path = a.path), (e.version = a.version));

              e.progress = 0;
            } else {
              e.state !== "installing" && (e.state = "installing");
              e.progress = i;
            }
          }
        });
      }
    },
    updateUninstallStatus(s, a, i, o) {
      for (const e of this.groups) {
        e.list.forEach((e) => {
          var t;

          if (e.name === s) {
            if (a) {
              e.state = "none";
              e.progress = 0;
            } else if (i) {
              e.state = "none";
              e.progress = 0;
              t = typeof i == "function" ? i(e) : i;
              e.version = t.version;
              e.path = t.path;
              t.path === "" && (e.isInstalled = false);
            } else {
              e.state !== "uninstalling" && (e.state = "uninstalling");
              e.progress = o;
            }
          }
        });
      }
    },
    refresh() {
      this.$emit("refresh");
    },
    reset() {
      this.groups = createDefaultGroup();
      this.page = 1;
      this.loading = false;
      this.errorMessage = "";
    },
    setError(e) {
      this.groups = createDefaultGroup();
      this.errorMessage = e;
    },
    remove(t) {
      for (const s of this.groups) {
        var e = s.list.findIndex((e) => e.name === t);

        if (-1 < e && (s.list.splice(e, 1), this.active)) {
          if (s.list.length > 0) {
            this.choose(s.list[0]);
          } else {
            this.choose(undefined);
          }
        }
      }
    },
    toggleEnableHandle(t) {
      for (const e of this.groups) {
        e.list.forEach((e) => {
          if (e.name === t.name && e.path === t.path) {
            e.enable = t.enable;
          }
        });
      }
    },
    handleListUpdate(e) {
      if (!this.groups.every((e) => e.list.length === 0)) {
        for (const s of this.groups) {
          e.forEach((t) => {
            var e = s.list.findIndex(
              (e) => e.name === t.name && e.path === t.path
            );

            if (-1 < e) {
              this.$set(s.list, e, {
                ...s.list[e],
                enable: t.enable,
                isInstalled: t.isInstalled,
                progress: t.progress,
                state: t.state,
                version: t.version,
                path: t.path,
              });
            }
          });
        }
      }
    },
    updateUninstallLoading(t, s) {
      for (const e of this.groups) {
        e.list.forEach((e) => {
          if (e.name === t) {
            e.state = s ? "uninstalling" : "none";
          }
        });
      }
    },
    toggleEnable(e, t, s) {
      this.$emit("set-enable", e, !t, s);
    },
    removePackage(t) {
      for (const e of this.groups) {
        e.list.forEach((e) => {
          if (e.name === t) {
            e.state = "uninstalling";
          }
        });
      }
      this.$emit("remove-package", t);
    },
    uninstallPackage(e, t, s) {
      this.$emit("uninstall-package", e, t, s);
    },
    updatePackage(t, e, s) {
      for (const a of this.groups) {
        a.list.forEach((e) => {
          if (e.name === t) {
            e.state = "installing";
          }
        });
      }
      this.$emit("update-package", t, e, s);
    },
    choose(e) {
      this.$emit("choose", e);
    },
  },
  template,
});
