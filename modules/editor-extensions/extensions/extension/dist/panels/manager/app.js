var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, i = a) => {
        var n = Object.getOwnPropertyDescriptor(t, a);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, i, n);
      }
    : (e, t, a, i) => {
        e[(i = i === undefined ? a : i)] = t[a];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = n(e), i = 0; i < a.length; i++) {
          if (a[i] !== "default") {
            __createBinding(t, e, a[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelApp = undefined;
exports.updateExtensionOption = undefined;

const { existsSync, statSync } = require("fs");

const path_1 = __importStar(require("path"));

const { ref, defineComponent, getCurrentInstance } = require("vue/dist/vue.js");

const semver_1 = __importDefault(require("semver"));

const { throttle, escapeRegExp } = require("lodash");

const pkg_node_1 = __importDefault(require("./pkg-node"));
const detail_1 = __importDefault(require("./detail"));
const pkg_list_1 = __importDefault(require("./pkg-list"));
const pkg_search_list_1 = require("./pkg-search-list");
const components_1 = require("../components");

const { useInjectSdk } = require("./sdk");

const { useInjectStore } = require("./store");

const event_bus_1 = require("./event-bus");
const utils_1 = require("../../public/utils");

const {
  sleep,
  matchInternalName,
  isOnlineExtension,
  handleDecompressFail,
  handleCancelImport,
  handleInvalidPath,
  handleUnexpectedImportError,
} = utils_1;

const { containsEventTarget } = require("../../public/utils-dom");

const import_1 = require("../../public/import");

const { importPackage, importPackageFolder, importPackageSymlink } = import_1;

const interface_1 = require("../../public/interface");
const profile_1 = require("../../shared/profile");
exports.updateExtensionOption = { isReRegister: false, path: "" };

const template = `
<div
    ref="containerEl"
    class="extension"
    @dragover="onAppDragover"
    @dragleave="onAppDragleave"
    @dragend="onAppDragend"
    @drop="onAppDrop"
>
    <!-- <div class="extension-layout"> -->
    <div class="list-layout">
        <header class="header" v-show="!isShowSearching">
            <div class="entry-tabs">
                <tab-dropdown
                    v-for="(tab, index) in tabs"
                    :key="tab.id"
                    :active-label="active"
                    :label="tab.label"
                    :children="tab.children"
                    @select="onTabSelect"
                ></tab-dropdown>
            </div>
            <div class="feature">
                <ui-button
                    class="transparent feature-col feature-btn"
                    tooltip="i18n:extension.manager.search_extensions"
                    @click="switchSearchStatus()"
                >
                    <ui-icon value="search"></ui-icon>
                </ui-button>

                <CustomDropdown class="button-group feature-col" size="mini">
                    <ui-button
                        class="transparent feature-btn"
                        tooltip="i18n:extension.manager.import_extensions_zip"
                        @click.stop="install()"
                    >
                        <ui-icon value="import"></ui-icon>
                    </ui-button>

                    <template #overlay>
                        <CustomDropdownItem @click="installPkgFolder()">
                            {{ t('import_extensions_folder') }}
                        </CustomDropdownItem>

                        <CustomDropdownItem @click="installPkgDev()">
                            {{ t('import_extensions_dev') }}
                        </CustomDropdownItem>
                    </template>
                </CustomDropdown>

                <ui-button
                    class="transparent feature-col feature-btn"
                    tooltip="i18n:extension.manager.refresh_extensions"
                    @click.stop="refreshList()"
                >
                    <ui-icon value="refresh"></ui-icon>
                </ui-button>
            </div>
        </header>
        <header class="header" v-show="isShowSearching">
            <div class="search">
                <ui-input
                    show-clear
                    ref="search"
                    placeholder="i18n:extension.manager.search"
                    @change="doSearch($event)"
                    @blur="onSearchBlur"
                    :value="searchKey"
                >
                </ui-input>
                <ui-button
                    class="transparent"
                    tooltip="i18n:extension.manager.exit_search"
                    @click.stop="switchSearchStatus()"
                >
                    <ui-label value="i18n:extension.manager.cancel"></ui-label>
                </ui-button>
            </div>
        </header>
        <div
            v-show="!isShowSearching && active === item.label"
            v-for="item of flatTabs"
            :key="item.label"
            class="list"
        >
            <pkg-list
                :ref="item.label"
                :label="item.label"
                :active="!isShowSearching && active === item.label"
                @refresh="refreshList"
                :page-size="pageSize"
                :choosed="currentPackage ? currentPackage.name : ''"
                @update-list="updateList"
                @choose="choose"
                @update-package="updatePackage"
                @remove-package="removePackage"
                @uninstall-package="uninstallPackage"
                @set-enable="setEnable"
            >
            </pkg-list>
        </div>
        <div class="list" v-show="isShowSearching">
            <pkg-search-list
                ref="search_list"
                label="search_list"
                :is-search="true"
                :active="isShowSearching"
                @refresh="refreshList"
                :search-key="searchKey"
                :page-size="pageSize"
                :choosed="currentPackage ? currentPackage.name : ''"
                @update-list="updateList"
                @choose="choose"
                @update-package="updatePackage"
                @remove-package="removePackage"
                @uninstall-package="uninstallPackage"
                @set-enable="setEnable"
            >
            </pkg-search-list>
        </div>
    </div>
    <div class="detail-layout">
        <pkg-detail
            :detail="currentPackageDetail"
            :info="currentPackage"
            :loading="getDetailLoading"
            :error-message="detailErrorMessage"
            @refresh="refreshDetail"
        ></pkg-detail>
    </div>
    <!-- </div> -->
    <div class="import-loading-layout" v-if="importLoading">
        <ui-loading></ui-loading>
        <ui-label v-if="importErrorMessage" value="i18n:extension.manager.import_error_tip"> </ui-label>
        <div v-if="importErrorMessage">
            <ui-button class="transparent" @click="cancelRetryImport">
                <ui-label value="i18n:extension.manager.cancel"></ui-label>
            </ui-button>
            <ui-button @click="retryImport">
                <ui-label value="i18n:extension.manager.retry"></ui-label>
            </ui-button>
        </div>
    </div>

    <div v-show="zipDraggingOver" class="file-drop-layer">
        <div class="file-drop-layer__tip">
            <ui-icon value="extension"></ui-icon>
            <ui-label value="i18n:extension.manager.drop_to_import_tip" class=""></ui-label>
        </div>
    </div>
    <!-- <custom-dialog v-if="extensionDependencies" :info="extensionDependencies" @cancel="dialogCancel"
    @confirm="dialogConfirm"></custom-dialog> -->
</div>
`;

function useFileDrop(a, i) {
  const n = ref(false);
  return {
    draggingOver: n,
    onAppDragenter(e) {
      n.value = false;
    },
    onAppDragend(e) {
      n.value = false;
    },
    onAppDragleave(e) {
      var t = a.value && containsEventTarget(a.value, e);
      var e = e.relatedTarget == null;

      if (t && e) {
        n.value = false;
      }
    },
    onAppDragover(e) {
      if (e.dataTransfer) {
        n.value = true;
        e.preventDefault();

        Array.from(e.dataTransfer.items ?? []).filter((e) => e.kind === "file")
          .length > 0
          ? (e.dataTransfer.dropEffect = "copy")
          : (e.dataTransfer.dropEffect = "none");
      }
    },
    onAppDrop(e) {
      n.value = false;
      var t = Array.from(e.dataTransfer?.items ?? []);
      if (e.dataTransfer && !(t.length < 1)) {
        e = t[0];
        if (e.kind === "file") {
          t = e.getAsFile();
          if (t != null && t.path.endsWith(".zip")) {
            if (!existsSync(t.path)) {
              e = Editor.I18n.t(
                "extension.manager.drop_to_import_file_not_exists",
                { path: t.path }
              );

              Editor.Dialog.info(e, {
                title: Editor.I18n.t("extension.title"),
                buttons: [Editor.I18n.t("extension.manager.confirm")],
              });

              throw new Error(e);
            }
            try {
              i(t.path);
            } catch (e) {
              console.error(e);
            }
          } else {
            Editor.Dialog.info(
              Editor.I18n.t("extension.manager.drop_to_import_requires_zip"),
              {
                title: Editor.I18n.t("extension.title"),
                buttons: [Editor.I18n.t("extension.manager.confirm")],
              }
            );
          }
        }
      }
    },
  };
}
exports.PanelApp = defineComponent({
  name: "ExtensionManager",
  components: {
    "pkg-node": pkg_node_1.default,
    "pkg-detail": detail_1.default,
    "pkg-list": pkg_list_1.default,
    PkgSearchList: pkg_search_list_1.PackageSearchList,
    "custom-dialog": components_1.CustomDialog,
    TabDropdown: components_1.TabDropdown,
    CustomDropdown: components_1.CustomDropdown,
    CustomDropdownItem: components_1.CustomDropdownItem,
  },
  setup(e, t) {
    var draggingOver = getCurrentInstance();
    var i = ref();
    var { extensionPaths, sdk } = useInjectSdk();
    var r = useInjectStore();

    var {
      draggingOver,
      onAppDragend,
      onAppDragleave,
      onAppDragover,
      onAppDrop,
    } = useFileDrop(i, (a?.proxy).install);

    return {
      containerEl: i,
      extensionPaths: extensionPaths,
      sdk: sdk,
      store: r,
      zipDraggingOver: draggingOver,
      onAppDragend: onAppDragend,
      onAppDragleave: onAppDragleave,
      onAppDragover: onAppDragover,
      onAppDrop: onAppDrop,
    };
  },
  data() {
    return {
      tabs: [
        {
          label: interface_1.ExtensionManagerTab.Cocos,
          id: 1,
          children: [
            { label: interface_1.ExtensionManagerTab.Cocos },
            { label: interface_1.ExtensionManagerTab.BuiltIn },
          ],
        },
        { label: interface_1.ExtensionManagerTab.Installed, id: 3 },
      ],
      flatTabs: [],
      active: interface_1.ExtensionManagerTab.BuiltIn,
      currentPackage: null,
      currentPackageDetail: null,
      detailErrorMessage: "",
      isShowSearching: false,
      page: 1,
      pageSize: 99999,
      sourceList: [],
      getDetailLoading: false,
      searchKey: "",
      searchTimestamp: -1,
      searchThrottle: null,
      installedList: [],
      allPackages: [],
      extensionDependenciesList: [],
      extensionDependencies: null,
      importErrorMessage: "",
      importLoading: false,
      importPathCache: "",
    };
  },
  watch: {
    extensionDependencies(e) {
      if (!e && this.extensionDependenciesList.length > 0) {
        this.extensionDependencies = this.extensionDependenciesList.shift();
      }
    },
  },
  created() {
    Editor.Package.__protected__.on("enable", this.toggleEnableHandle);
    Editor.Package.__protected__.on("disable", this.toggleEnableHandle);

    Editor.Message.__protected__.addBroadcastListener(
      "i18n:change",
      this.onI18nChange
    );
  },
  mounted() {
    this.handleFlatTabs();
    this.init();
    var e = this.store.startupParams.value;

    if (typeof e.search == "string") {
      this.onSearchEvent(e.search);
    }

    this.$root.$on(event_bus_1.INTERNAL_EVENTS.search, this.onSearchEvent);
  },
  beforeDestroy() {
    Editor.Package.__protected__.removeListener(
      "enable",
      this.toggleEnableHandle
    );

    Editor.Package.__protected__.removeListener(
      "disable",
      this.toggleEnableHandle
    );

    this.$root.$off(event_bus_1.INTERNAL_EVENTS.search, this.onSearchEvent);

    Editor.Message.__protected__.removeBroadcastListener(
      "i18n:change",
      this.onI18nChange
    );
  },
  methods: {
    t(e, t) {
      Editor.I18n.getLanguage;
      return Editor.I18n.t("extension.manager." + e, t);
    },
    curLanguage() {
      return Editor.I18n.getLanguage();
    },
    onI18nChange() {
      this.refreshList();
    },
    async init() {
      this.installedList = await this.scanLocal();
      this.active = this.tabs[0].label;

      this.searchThrottle = throttle(this.handleSearch, 300, {
        leading: true,
        trailing: true,
      });
    },
    handleFlatTabs() {
      const a = new Map();
      const e = [];

      this.tabs.forEach((t) => {
        e.push({ label: t.label });

        if (t.children) {
          t.children.forEach((e) => {
            if (e.label !== t.label) {
              a.set(e.label, { label: e.label });
            }
          });
        }
      });

      a.forEach((t) => {
        if (!e.find((e) => e.label === t.label)) {
          e.push({ label: t.label });
        }
      });

      this.flatTabs = e;
    },
    async choose(e) {
      if (e == null) {
        this.clearCurrentDetail();
      } else if (
        (e && !this.currentPackage) ||
        !this.currentPackageDetail ||
        e.name !== this.currentPackage?.name ||
        e.version !== this.currentPackage.version ||
        e.version !== this.currentPackageDetail.version
      ) {
        this.getPackageDetail(e);
      }
    },
    clearCurrentDetail() {
      this.currentPackage = null;
      this.currentPackageDetail = null;
      this.detailErrorMessage = "";
      this.getDetailLoading = false;
    },
    getPackageDetail(e) {
      this.getDetailLoading = true;
      this.currentPackage = { ...e };
      this.currentPackageDetail = null;
      this.detailErrorMessage = "";
      var t = { name: e.name, version: e.version, lang: this.curLanguage() };
      return this.sdk
        .getExtensionDetail(t)
        .then((t) => {
          if (t && typeof t.name == "string") {
            if (this.currentPackage) {
              this.currentPackageDetail = {
                name: t.name,
                version: t.version,
                publish_at: t.publish_at,
                version_limit: t.editor_limit,
                detail: t.detail,
                size: t.size,
                icon_url: t.icon_url,
              };
            }
          } else {
            if (e.path !== "") {
              return this.sdk
                .queryLocalExtensionDetail(e.path, this.curLanguage())
                .then((e) => {
                  if (e && typeof e.name == "string") {
                    if (this.currentPackage) {
                      this.currentPackageDetail = {
                        author: { id: utils_1.FAKE_AUTHOR_ID, name: e.author },
                        name: e.name,
                        version: e.version,
                        publish_at: 0,
                        version_limit: e.editor_limit,
                        detail: e.detail,
                        size: t.size,
                        icon_url: t.icon_url,
                      };

                      this.currentPackage.version = e.version;
                    }
                  } else {
                    this.clearCurrentDetail();
                    this.detailErrorMessage = this.t("detail_error_tip");
                  }
                })
                .catch((e) => {
                  this.clearCurrentDetail();
                  this.detailErrorMessage = this.t("network_error_tip");
                  throw e;
                });
            }

            if (this.currentPackage) {
              this.currentPackageDetail = {
                name: e.name,
                version: e.version,
                publish_at: 0,
                version_limit: "",
                detail: "",
                size: 0,
                icon_url: e.icon_url,
              };

              this.currentPackage.version = e.version;
            }
          }
        })
        .catch((e) => {
          this.detailErrorMessage = this.t("network_error_tip");
          throw e;
        })
        .finally(() => {
          this.getDetailLoading = false;
        });
    },
    async setEnable(e, t, a) {
      try {
        if (t) {
          await Editor.Package.enable(a);
        } else {
          await Editor.Package.disable(a, {});
        }

        return true;
      } catch (e) {
        console.error(e);

        Editor.Dialog.error(
          this.t(t ? "disable_error_tip" : "enable_error_tip")
        );

        return false;
      }
    },
    toggleEnableHandle(t) {
      [
        ...this.flatTabs,
        { label: interface_1.ExtensionManagerTab.Search },
      ].forEach((e) => {
        e = this.$refs[e.label];

        if (e) {
          (e.length ? e[0] : e).toggleEnableHandle(t);
        }
      });
    },
    refreshDetail() {
      if (this.currentPackage) {
        this.getPackageDetail(this.currentPackage);
      }
    },
    onTabSelect(e) {
      this.active = e;
    },
    switchSearchStatus(e) {
      this.isShowSearching = typeof e == "boolean" ? e : !this.isShowSearching;
      this.searchKey = "";

      if (this.isShowSearching) {
        this.clearCurrentDetail();

        this.$nextTick(() => {
          this.$refs.search.focus();
        });
      } else {
        ((e = this.$refs[interface_1.ExtensionManagerTab.Search]).length
          ? e[0]
          : e
        ).reset();
      }
    },
    formatInstalledExtension(t) {
      var e = this.allPackages.find(
        (e) => e.name === t.name && this.checkPathType(e.path) === "local"
      );

      var a = {
        name: t.name,
        version: t.version,
        icon_url: t.icon_url,
        description: t.description,
        enable: !!e && e.enable,
        isInstalled: true,
        state: "none",
        progress: 0,
        path: t.extension_path,
        isBuiltIn: false,
        isCocosSource: false,
      };

      if (e?.info.author) {
        a.author = { id: utils_1.FAKE_AUTHOR_ID, name: e.info.author };
      }

      try {
        var i = statSync(t.extension_path);

        if (i && typeof i.mtimeMs == "number") {
          a.mtime = i.mtimeMs;
        }
      } catch (e) {}
      return a;
    },
    formatNetExtension(e) {
      var t =
        !(!e.label || !e.label.length) &&
        -1 <
          e.label.findIndex(
            (e) => e === interface_1.ExtensionManagerTab.BuiltIn
          );
      let a = undefined;
      let i = undefined;
      let n = undefined;
      let s = undefined;
      for (const r of this.allPackages) {
        if (r.name === e.name) {
          switch (this.checkPathType(r.path)) {
            case "builtin": {
              if (a == null) {
                a = r;
              }

              break;
            }
            case "cover": {
              if (i == null) {
                i = r;
              }

              if (r.enable && n == null) {
                n = r;
              }

              break;
            }
            case "local": {
              if (s == null) {
                s = r;
              }
            }
          }
          if (a != null && i != null && s != null && n != null) {
            break;
          }
        }
      }
      const r = (t = t || a != null || i != null) ? a : s;
      t = {
        name: e.name,
        version: r ? r.version : e.latest_version,
        icon_url: e.icon_url,
        description: e.description,
        enable: r?.enable ?? false,
        isInstalled: !!r,
        latest_version: e.latest_version,
        latest_description: e.latest_description,
        update_at: e.update_at,
        state: "none",
        progress: 0,
        path: r ? r.path : "",
        isBuiltIn: t,
        isCocosSource: true,
      };

      if (t.isBuiltIn) {
        t.builtInPath = t.path;
        t.builtInVersion = t.version;

        n != null
          ? ((t.version = n.version), (t.path = n.path), (t.enable = n.enable))
          : i != null &&
            t.enable !== true &&
            ((t.version = i.version), (t.path = i.path), (t.enable = i.enable));
      }

      return t;
    },
    mergeBuiltInExtension(e) {
      const a = e.map((e) => this.formatNetExtension(e));

      var e = this.allPackages.filter(
        (t) =>
          !a.find((e) => e.name === t.name) &&
          this.checkPathType(t.path) === "builtin"
      );

      var t = this.allPackages.filter(
        (t) =>
          !a.find((e) => e.name === t.name) &&
          this.checkPathType(t.path) === "cover"
      );

      e.forEach((e) => {
        a.push({
          name: e.name,
          version: e.version,
          icon_url: "",
          description: e.info.description ?? "",
          enable: e.enable,
          isInstalled: true,
          state: "none",
          progress: 0,
          path: e.path,
          isBuiltIn: true,
          isCocosSource: true,
        });
      });

      t.forEach((t) => {
        var e = a.findIndex((e) => e.name === t.name);

        if (e < 0) {
          a.push({
            name: t.name,
            version: t.version,
            icon_url: "",
            description: t.info.description ?? "",
            enable: t.enable,
            isInstalled: true,
            state: "none",
            progress: 0,
            path: t.path,
            isBuiltIn: true,
            isCocosSource: false,
          });
        } else if (t.enable === true) {
          a[e].builtInPath = a[e].path;
          a[e].builtInVersion = a[e].version;
          a[e].version = t.version;
          a[e].path = t.path;
          a[e].enable = t.enable;
        }
      });

      return a;
    },
    doSearch(e) {
      e = e?.target?.value ?? "";

      if (e !== this.searchKey && this.searchThrottle) {
        this.searchThrottle(e);
      }
    },
    onSearchBlur(e) {
      if (this.searchKey === "") {
        this.switchSearchStatus(false);
      }
    },
    handleSearch(e) {
      var t = this.$refs[interface_1.ExtensionManagerTab.Search];
      (t.length ? t[0] : t).reset();
      this.clearCurrentDetail();

      if ((this.searchKey = e)) {
        this.page = 1;

        this.updateSearchExtensions(this.searchKey, this.page, this.pageSize);
      }
    },
    onSearchEvent(e) {
      if (e === false) {
        this.switchSearchStatus(false);
      } else if (e === true || typeof e == "string") {
        this.switchSearchStatus(true);
        this.handleSearch(e === true ? "" : e);
      }
    },
    async updateSearchExtensions(e, t, a) {
      const i = Date.now();

      this.searchTimestamp = i;
      const n = new RegExp(escapeRegExp(e));

      var s = this.$refs[interface_1.ExtensionManagerTab.Search];
      const r = {
        e: Editor.App.version,
        q: e,
        lang: this.curLanguage(),
        page: t,
        pageSize: a,
        label: [
          interface_1.ExtensionManagerTab.Cocos,
          interface_1.ExtensionManagerTab.BuiltIn,
        ].join(","),
      };
      s.loading = true;
      let o = [];
      try {
        o = await Promise.all([
          ...[
            interface_1.ExtensionManagerTab.BuiltIn,
            interface_1.ExtensionManagerTab.Cocos,
          ].map(async (t) => {
            try {
              var e = await this.sdk.getExtensionList({ ...r, label: t });
              if (this.searchTimestamp !== i) {
                throw new utils_1.CancelError("timestamp cancel");
              }
              return {
                key: t,
                label: t,
                list:
                  t === interface_1.ExtensionManagerTab.BuiltIn
                    ? this.mergeBuiltInExtension(e.packages).filter((e) =>
                        n.test(e.name)
                      )
                    : e.packages.map(this.formatNetExtension),
                total: e.count,
              };
            } catch (e) {
              if (utils_1.CancelError.isCancel(e)) {
                throw e;
              }
              console.error(e);
              return { key: t, label: t, list: [], total: 0 };
            }
          }),
        ]);
      } catch (e) {
        if (utils_1.CancelError.isCancel(e)) {
          return;
        }
        console.error(e);
      }
      try {
        var l = this.installedList.filter((e) => n.test(e.name));

        o.push({
          key: interface_1.ExtensionManagerTab.Installed,
          label: interface_1.ExtensionManagerTab.Installed,
          list: l,
          total: l.length,
        });

        s.batchUpdateList(
          o.reduce((e, t) => {
            e[t.key] = t;
            return e;
          }, {})
        );
      } finally {
        s.loading = false;
      }
    },
    async updateList(e, t, a) {
      var i = this.isShowSearching ? interface_1.ExtensionManagerTab.Search : e;

      if (i === interface_1.ExtensionManagerTab.Installed) {
        this.updateLocationExtensions();
      } else if (i === interface_1.ExtensionManagerTab.Search) {
        await this.refreshAllPackages();
        await this.updateSearchExtensions(this.searchKey, 1, this.pageSize);
      } else {
        await this.refreshAllPackages();
        this.updateExtensions(e, this.searchKey, t, a);
      }
    },
    async refreshList() {
      var e = this.isShowSearching
        ? interface_1.ExtensionManagerTab.Search
        : this.active;

      var t = this.$refs[e];
      function a(e) {
        return Editor.Message.request("extension", "scanning", e);
      }

      if (t) {
        await a("global");
        await a("project");
        t = t.length ? t[0] : t;

        e === interface_1.ExtensionManagerTab.Installed
          ? await this.updateLocationExtensions()
          : e === interface_1.ExtensionManagerTab.Search
          ? (t.reset(),
            await this.refreshAllPackages(),
            await this.updateSearchExtensions(this.searchKey, 1, this.pageSize))
          : (t.reset(),
            await this.refreshAllPackages(),
            await this.updateExtensions(e, this.searchKey, 1, this.pageSize));
      }
    },
    async updateExtensions(a, e, t, i) {
      var n = this.$refs[a];
      if (n && a !== interface_1.ExtensionManagerTab.Search) {
        const r = n.length ? n[0] : n;
        r.loading = true;

        if (t === 1) {
          this.clearCurrentDetail();
        }

        var s = {
          e: Editor.App.version,
          q: e,
          lang: this.curLanguage(),
          page: t,
          pageSize: i,
          label: "",
        };
        switch (a) {
          case interface_1.ExtensionManagerTab.Installed:
          case interface_1.ExtensionManagerTab.Purchased:
          case interface_1.ExtensionManagerTab.Search: {
            break;
          }
          default: {
            s.label = a;
          }
        }
        return this.sdk
          .getExtensionList(s)
          .then((e) => {
            var t =
              a === interface_1.ExtensionManagerTab.BuiltIn
                ? this.mergeBuiltInExtension(e.packages)
                : e.packages.map((e) => this.formatNetExtension(e));
            r.updateList(t, e.count);
          })
          .catch((e) => {
            this.clearCurrentDetail();

            if (
              this.isShowSearching ||
              a === interface_1.ExtensionManagerTab.Purchased ||
              a === interface_1.ExtensionManagerTab.Cocos
            ) {
              r.setError(this.t("network_error_tip"));
            } else {
              r.setError(this.t("local_error_tip"));
            }

            throw e;
          })
          .finally(() => {
            r.loading = false;
          });
      }
    },
    async updateLocationExtensions() {
      var e;
      var t = this.$refs[interface_1.ExtensionManagerTab.Installed];

      if (t) {
        (t = t.length ? t[0] : t).reset();
        t.loading = true;
        this.clearCurrentDetail();
        e = await this.scanLocal();
        this.installedList = e;
        t.updateList(e, e.length);
        this.handleListUpdate(e, interface_1.ExtensionManagerTab.Installed);
        t.loading = false;
      }
    },
    handleListUpdate(t, a) {
      [...this.flatTabs, { label: interface_1.ExtensionManagerTab.Search }]
        .filter((e) => e.label !== a)
        .forEach((e) => {
          e = this.$refs[e.label];

          if (e) {
            (e.length ? e[0] : e).handleListUpdate(t);
          }
        });
    },
    async refreshAllPackages() {
      this.allPackages = Editor.Package.getPackages();
    },
    async scanLocal() {
      var e = await this.sdk.scanLocalExtensions();
      await sleep(100);
      await this.refreshAllPackages();
      const a = [];

      e.forEach((t) => {
        if (
          this.allPackages.filter(
            (e) =>
              e.name === t.name &&
              typeof e.path == "string" &&
              this.checkPathType(e.path) === "local"
          ).length > 0
        ) {
          a.push(this.formatInstalledExtension(t));
        }
      });

      a.sort(
        (e, t) =>
          (typeof t.mtime == "number" ? t.mtime : 0) -
          (typeof e.mtime == "number" ? e.mtime : 0)
      );

      return a;
    },
    checkPathType(e) {
      return Editor.Package.__protected__.checkType(e);
    },
    updatePackage(e, t, a) {
      if (!a.isInstalled || !semver_1.default.eq(t, a.version)) {
        if (
          a.isBuiltIn &&
          typeof a.builtInVersion == "string" &&
          semver_1.default.eq(t, a.builtInVersion)
        ) {
          this.resetBuiltInVersion(a);
        } else {
          this.download(e, t, a);
        }
      }
    },
    addInstalledPackage(e) {
      var t = this.$refs[interface_1.ExtensionManagerTab.Installed];

      if (t) {
        (t.length ? t[0] : t).addPackage(e);
      }
    },
    async resetBuiltInVersion(e) {
      if (e && e.builtInPath && e.builtInVersion) {
        var t = async () => {
          try {
            await this.sdk.uninstall(e.name, this.extensionPaths.global);
          } catch (e) {
            console.error(e);
          }
        };
        if (matchInternalName(e.name)) {
          if (
            (
              await Editor.Dialog.warn(this.t("update_extension_tip"), {
                buttons: [this.t("confirm"), this.t("cancel")],
                default: 0,
                cancel: 1,
                title: Editor.I18n.t("assets.operate.dialogQuestion"),
              })
            ).response === 0
          ) {
            return void Editor.Message.send("extension", "self-update", {
              currentPath: e.path,
              newInstallPath: e.builtInPath,
              builtInPath: e.builtInPath,
            });
          }
          exports.updateExtensionOption.isReRegister = true;
          exports.updateExtensionOption.path = e.builtInPath;

          this.updateDownloadStatus(
            e.name,
            null,
            { version: e.version, path: e.path },
            null
          );
        } else {
          await this.setEnable(e.name, false, e.path);
          await Editor.Package.unregister(e.path);
          await t();
          await this.setEnable(e.name, true, e.builtInPath);

          this.updateDownloadStatus(
            e.name,
            null,
            { version: e.builtInVersion, path: e.builtInPath },
            null
          );

          e.path = e.builtInPath;
          e.version = e.builtInVersion;
          this.choose(e);
        }
        this.installedList = await this.scanLocal();
      }
    },
    download(a, i, n) {
      var e = this.extensionPaths;
      var e = n.isBuiltIn ? e.global : e.project;
      return this.sdk
        .getDownloader(
          { name: a, version: i, installPath: e },
          {
            downloadProgress: (e) => {
              e = Math.floor(100 * e);
              this.updateDownloadStatus(a, null, null, e);
            },
            perDownloaded: async (e) => {
              if (n.isBuiltIn) {
                if (matchInternalName(n.name)) {
                  const t =
                    e.installPkgPath ??
                    path_1.default.resolve(e.installPath, e.name);

                  if (
                    existsSync(t) &&
                    this.allPackages.find((e) => e.path === t)
                  ) {
                    await this.setEnable(n.name, false, t);
                    await Editor.Package.unregister(t);
                  }
                } else {
                  await this.setEnable(n.name, false, n.path);

                  if (n.path !== n.builtInPath) {
                    await Editor.Package.unregister(n.path);
                  }
                }
              } else {
                if (n.isInstalled && n.path !== "") {
                  await this.setEnable(n.name, false, n.path);
                  await Editor.Package.unregister(n.path);
                }
              }
            },
            perInstalled: async (e) => {
              var t = { ...n };
              try {
                if (typeof e.tempPath != "string" || e.tempPath === "") {
                  throw new Error(`invalid info.tempPath: "${e.tempPath}"`);
                }
                if (matchInternalName(a)) {
                  if (
                    (
                      await Editor.Dialog.warn(this.t("update_extension_tip"), {
                        buttons: [this.t("confirm"), this.t("cancel")],
                        default: 0,
                        cancel: 1,
                        title: Editor.I18n.t("assets.operate.dialogQuestion"),
                      })
                    ).response === 0
                  ) {
                    return void Editor.Message.send(
                      "extension",
                      "self-update",
                      {
                        currentPath: n.path,
                        newInstallPath: e.tempPath,
                        builtInPath: n.builtInPath,
                      }
                    );
                  }
                  exports.updateExtensionOption.isReRegister = true;
                  exports.updateExtensionOption.path = e.tempPath;

                  this.updateDownloadStatus(
                    a,
                    null,
                    { version: n.version, path: n.path },
                    null
                  );
                } else {
                  if (!n.isBuiltIn && n.isCocosSource && !n.path) {
                    t.isInstalled = true;
                    t.enable = true;
                  }

                  await Editor.Package.register(e.tempPath);
                  await this.setEnable(a, true, e.tempPath);
                  t.version = i;
                  t.path = e.tempPath;

                  this.updateDownloadStatus(
                    a,
                    null,
                    { version: i, path: e.tempPath },
                    null
                  );
                }
                this.choose(t);
                this.updateLocationExtensions();
              } catch (e) {
                console.error(e);

                this.updateDownloadStatus(
                  a,
                  this.t("install_error_tip"),
                  null,
                  null
                );

                Editor.Dialog.error(this.t("install_error_tip"));
              }
            },
            downloaded: async (e) => {
              const t = { name: a, dependencies: [] };

              e.forEach((e) => {
                t.dependencies.push({
                  name: e.name,
                  desc: "",
                  checked: false,
                  disable: false,
                  version: e.version,
                });
              });

              this.openDialog(t);
            },
          }
        )
        .download()
        .catch((e) => {
          Editor.Dialog.error(this.t("install_error_tip"));

          this.updateDownloadStatus(a, this.t("install_error_tip"), null, null);

          throw e;
        });
    },
    updateDownloadStatus(t, a, i, n) {
      [
        ...this.flatTabs,
        { label: interface_1.ExtensionManagerTab.Search },
      ].forEach((e) => {
        e = this.$refs[e.label];

        if (e) {
          (e.length ? e[0] : e).updateDownloadStatus(t, a, i, n);
        }
      });
    },
    updateUninstallStatus(s, i, r, o) {
      [
        ...this.flatTabs,
        { label: interface_1.ExtensionManagerTab.Search },
      ].forEach((e) => {
        var t = this.$refs[e.label];
        if (t) {
          var a = t.length ? t[0] : t;
          if (r) {
            const n = this.allPackages.find((e) => {
              var t = this.checkPathType(e.path);
              return e.name === s.name && (t === "builtin" || t === "cover");
            });
            switch (e.label) {
              case interface_1.ExtensionManagerTab.Cocos: {
                if (s.isBuiltIn && n) {
                  a.updateUninstallStatus(
                    s.name,
                    null,
                    { path: n?.path, version: n.version },
                    null
                  );
                } else {
                  a.updateUninstallStatus(
                    s.name,
                    null,
                    (e) => {
                      var t = s.path === e.path;
                      return {
                        path: t ? "" : e.path,
                        version:
                          t && isOnlineExtension(e)
                            ? e.latest_version
                            : e.version,
                      };
                    },
                    null
                  );
                }

                break;
              }
              case interface_1.ExtensionManagerTab.BuiltIn: {
                a.updateUninstallStatus(
                  s.name,
                  null,
                  (e) => {
                    var t = s.path === e.path;

                    let { path, version } = e;

                    if (t) {
                      path = n?.path ?? "";
                      version = n?.version ?? "";
                    }

                    return { path: path, version: version };
                  },
                  null
                );
                break;
              }
              case interface_1.ExtensionManagerTab.Search: {
                if (s.isCocosSource) {
                  a.updateUninstallStatus(
                    s.name,
                    null,
                    (e) => ({
                      path: "",

                      version: isOnlineExtension(e)
                        ? e.latest_version
                        : e.version,
                    }),
                    null
                  );
                } else {
                  a.remove(s.name);
                }

                break;
              }
              case interface_1.ExtensionManagerTab.Installed: {
                a.remove(s.name);
              }
            }
          } else {
            if (i) {
              a.updateUninstallStatus(s.name, i, r, o);
              Editor.Dialog.error(i);
            } else {
              a.updateDownloadStatus(s.name, i, r, o);
            }
          }
        }
      });
    },
    updateUninstallLoading(t, a) {
      [
        ...this.flatTabs,
        { label: interface_1.ExtensionManagerTab.Search },
      ].forEach((e) => {
        e = this.$refs[e.label];

        if (e) {
          (e.length ? e[0] : e).updateUninstallLoading(t, a);
        }
      });
    },
    async uninstallPackage(t, e, a) {
      var i = this.$refs[a];
      if (i) {
        const n = i.length ? i[0] : i;
        if (a !== interface_1.ExtensionManagerTab.BuiltIn) {
          i = e.enable
            ? this.t("close_enabled_extensions_tip")
            : this.t("close_extensions_tip");
          if (
            (
              await Editor.Dialog.warn(i, {
                buttons: [this.t("confirm"), this.t("cancel")],
                default: 0,
                cancel: 1,
                title: Editor.I18n.t("assets.operate.dialogQuestion"),
              })
            ).response === 1
          ) {
            return void n.updateUninstallStatus(
              t,
              null,
              { path: e.path, version: e.version },
              null
            );
          }
          await this.setEnable(t, !e.enable, e.path);
        }
        this.clearCurrentDetail();
        this.updateUninstallLoading(t, true);
        await Editor.Package.unregister(e.path);

        return this.sdk
          .uninstall(t, {
            uninstallProgress: (e) => {
              e = Math.floor(100 * e);
              n.updateUninstallStatus(t, null, null, e);
            },
            uninstalled: async () => {
              if (
                matchInternalName(t) &&
                typeof e.builtInPath == "string" &&
                e.builtInPath !== ""
              ) {
                await this.setEnable(t, true, e.builtInPath);
              }

              this.updateUninstallStatus(
                e,
                null,
                { path: "", version: "" },
                null
              );

              this.installedList = await this.scanLocal();
            },
          })
          .catch((e) => {
            Editor.Dialog.error(this.t("uninstall_error_tip"));

            n.updateUninstallStatus(
              t,
              this.t("uninstall_error_tip"),
              null,
              null
            );

            throw e;
          });
      }
    },
    removePackage(e) {
      var t = this.isShowSearching
        ? interface_1.ExtensionManagerTab.Search
        : this.active;

      var t = this.$refs[t];
      if (t) {
        const a = t.length ? t[0] : t;
        return this.sdk
          .uninstall(e, {
            uninstalled: async () => {
              a.remove(e);
            },
          })
          .catch((e) => {
            Editor.Dialog.error(this.t("remove_error_tip"));
            throw e;
          });
      }
    },
    openDialog(e) {
      if (!(e.dependencies.length < 1)) {
        let a = "";

        e.dependencies.forEach((e, t) => {
          a += t > 0 ? `、${e.name}@` + e.version : e.name;
        });

        Editor.Task.addNotice({
          title: e.name + " " + this.t("install_dependence_tip"),
          message: a,
          type: "warn",
          source: "extension",
          timeout: 5000 /* 5e3 */,
        });
      }
    },
    dialogCancel() {
      this.extensionDependencies = null;
    },
    dialogConfirm(e) {
      if (e.callback) {
        e.callback();
      }

      this.extensionDependencies = null;
    },
    retryImport() {
      this.importErrorMessage = "";
      this.install(this.importPathCache);
    },
    cancelRetryImport() {
      this.importErrorMessage = "";
      this.importPathCache = "";
      this.importLoading = false;
    },
    onPopupImportMore() {
      Editor.Menu.popup({
        menu: [
          {
            label: this.t("import_extensions_folder"),
            click: () => {
              this.installPkgFolder();
            },
          },
          {
            label: this.t("import_extensions_dev"),
            click: () => {
              this.installPkgDev();
            },
          },
        ],
      });
    },
    async selectDirectoryFromDialog(e = {}) {
      var t;
      var a = await profile_1.LastImportFolderPath.tryGet();

      var e = await Editor.Dialog.select({
        title: Editor.I18n.t("extension.menu.selectDirectory"),
        type: "directory",
        multi: false,
        path: a ?? undefined,
        ...e,
      });

      return !Array.isArray(e.filePaths) || e.filePaths.length < 1
        ? ""
        : ((e = e.filePaths[0]),
          (t = path_1.default.dirname(e)) !== a &&
            (await profile_1.LastImportFolderPath.trySet(t)),
          e);
    },
    async install(t = "") {
      if (!t) {
        var a = await profile_1.LastImportFolderPath.tryGet();

        var a = await Editor.Dialog.select({
          title: Editor.I18n.t("extension.menu.selectZip"),
          filters: [{ name: "ZIP", extensions: ["zip"] }],
          path: a ?? undefined,
        });

        if (!a || !a.filePaths[0]) {
          return;
        }
        t = a.filePaths[0];
        a = path_1.default.dirname(t);
        await profile_1.LastImportFolderPath.trySet(a);
      }
      const i = (0, path_1.basename)(t, ".zip");
      try {
        await this.installPkgTemplate({
          selectedPath: t,
          importHandler: async () =>
            importPackage("project", t, {
              extensionDisplayName: i,
            }),
        });
      } catch (e) {
        if (!(e instanceof Error)) {
          throw e;
        }
        a = e.message;
        if (a !== import_1.ImportPackageErrorMessage.decompressFail) {
          throw e;
        }
        handleDecompressFail(t, i, true);
      }
    },
    async installPkgTemplate(e) {
      this.importLoading = true;
      this.importErrorMessage = "";
      var e_selectedPath = e.selectedPath;
      try {
        const n = await e.importHandler();
        if (!n) {
          throw new Error(`invalid imported package path: "${n}"`);
        }
        this.importLoading = false;
        this.importPathCache = "";
        this.active = interface_1.ExtensionManagerTab.Installed;
        this.installedList = await this.scanLocal();
        var a = this.installedList.find((e) => e.path === n);
        if (!a) {
          throw new Error(
            "unexpted package import: cannot find in installed list"
          );
        }
        await this.setEnable(a.name, true, n);
        this.refreshList();
        this.choose(a);
      } catch (e) {
        this.importLoading = false;
        this.importErrorMessage = this.t("import_error_tip");
        this.importPathCache = e_selectedPath;

        if (!(e instanceof Error)) {
          throw e;
        }

        switch (e.message) {
          case import_1.ImportPackageErrorMessage.cancel: {
            this.cancelRetryImport();
            handleCancelImport();
            break;
          }
          case import_1.ImportPackageErrorMessage.invalidPath: {
            handleInvalidPath(e_selectedPath);
            break;
          }
          case import_1.ImportPackageErrorMessage.cannotFindPackageJson: {
            var e_path = e.path;
            Editor.Task.addNotice({
              title: Editor.I18n.t("extension.menu.importError"),
              message: Editor.I18n.t("extension.menu.cannotFindPackageJson", {
                path: e_path,
              }),
              type: "error",
              source: "extension",
              timeout: 10000 /* 1e4 */,
            });
            break;
          }
          case import_1.ImportPackageErrorMessage.decompressFail: {
            throw e;
          }
          default: {
            console.error(e);
            handleUnexpectedImportError(e);
          }
        }
      }
    },
    async installPkgFolder(e = "") {
      if (e || "" !== (e = await this.selectDirectoryFromDialog())) {
        await this.installPkgTemplate({
          selectedPath: e,
          importHandler: async () => await importPackageFolder("project", e),
        });
      }
    },
    async installPkgDev(e = "") {
      if (!e && "" === (e = await this.selectDirectoryFromDialog())) {
        return "";
      }
      await this.installPkgTemplate({
        importHandler: async () => importPackageSymlink("project", e),
        selectedPath: e,
      });
    },
  },
  template,
});
