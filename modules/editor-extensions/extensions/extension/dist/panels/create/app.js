Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionCreation = undefined;
exports.LocationType = undefined;

const { join } = require("path");

const { existsSync, readFileSync } = require("fs");

const { defineComponent } = require("vue/dist/vue.js");

const utils_build_1 = require("../../public/utils-build");

const {
  getExtensionDirPath,
  getFallbackExtensionName,
  getEditorVersion,
  isExtensionNameError,
  isEditorVersionError,
  getExtensionDist,
} = utils_build_1;

exports.LocationType = { "extension.create_package.local": "0" };

exports.ExtensionCreation = defineComponent({
  name: "ExtensionCreationApp",
  props: {
    preloadExtensionInfo: { type: Object, required: true },
    author: { type: String, default: "" },
    showInManager: Boolean,
    showInFolder: Boolean,
  },
  data() {
    var e = "extension";
    var t = this.preloadExtensionInfo[e]?.templates[0];

    var i = Editor.Utils.File.resolveFileNameConflict(
      getExtensionDirPath(),
      t?.defaultName ?? getFallbackExtensionName()
    );

    return {
      LocationType: exports.LocationType,
      extensionInfoMap: this.preloadExtensionInfo,
      currentLocation: "0",
      name: i,
      currentTemplate: t,
      currentExtension: e,
      editorVersion: getEditorVersion(),
      extensionExist: false,
      timeoutId: { selectionScroll: null },
      applying: false,
    };
  },
  computed: {
    wrongName() {
      return isExtensionNameError(this.name);
    },
    wrongAuthor() {
      return !this.author;
    },
    wrongEditorVersion() {
      return isEditorVersionError(this.editorVersion);
    },
    distPath() {
      return getExtensionDist(this.name);
    },
  },
  watch: {
    name(e, t) {
      if (e !== t) {
        this.updateExtensionIsExist();
      }
    },
    currentLocation(e, t) {
      if (e !== t) {
        this.updateExtensionIsExist();
      }
    },
  },
  methods: {
    selectTemplate(e, t) {
      this.currentExtension = e;
      this.currentTemplate = t;

      this.name = Editor.Utils.File.resolveFileNameConflict(
        getExtensionDirPath(),
        t.defaultName ?? getFallbackExtensionName()
      );

      if (this.timeoutId.selectionScroll) {
        window.clearTimeout(this.timeoutId.selectionScroll);
      }

      this.timeoutId.selectionScroll = window.setTimeout(() => {
        var e = this.$refs.content?.querySelector(
          `[data-template-id="${t.id}"]`
        );

        if (e) {
          e.scrollIntoView({ block: "nearest" });
        }

        this.timeoutId.selectionScroll = null;
      }, 0);
    },
    getAvailableTemplate(e, t) {
      if (this.extensionInfoMap[e]) {
        e = this.extensionInfoMap[e].templates;

        return typeof t == "string"
          ? e.find((e) => e.rawPath === t)
          : e.length > 0
          ? e[0]
          : undefined;
      }
    },
    async loadAllCreatorModule(e) {
      e = e || {};
      e.force = e.force || false;
      var t;

      var i = await Editor.Message.request(
        "extension",
        "get-extension-info-map"
      );

      this.extensionInfoMap = {};
      for (const s in i) {
        if (e.force || !this.extensionInfoMap[s]) {
          t = i[s];
          this.$set(this.extensionInfoMap, s, t);
        }
      }
    },
    async unloadAllCreatorModule(e) {
      for (const t in this.extensionInfoMap) {
        if (!e || e.name === t) {
          this.$delete(this.extensionInfoMap, t);
        }
      }
    },
    async onPluginEnable(e) {
      await this.loadAllCreatorModule();
    },
    async onPluginDisable(e) {
      await this.unloadAllCreatorModule(e);
    },
    isEmptyObject(e) {
      return Object.keys(e).length === 0;
    },
    t(...e) {
      return Editor.I18n.t(...e);
    },
    async apply() {
      if (this.applying) {
        throw new Error("template is applying, please wait for a moment");
      }
      this.applying = true;
      try {
        await Editor.Profile.setTemp(
          "extension",
          utils_build_1.TempProfileKeys.author,
          this.author
        );

        await Editor.Profile.setTemp(
          "extension",
          utils_build_1.TempProfileKeys.showInManager,
          this.showInManager
        );

        await Editor.Profile.setTemp(
          "extension",
          utils_build_1.TempProfileKeys.showInFolder,
          this.showInFolder
        );

        var e = await Editor.Message.request(
          "extension",
          "create-extension-template",
          {
            type: this.currentExtension,
            templateId: this.currentTemplate.id,
            dist: this.distPath,
            author: this.author,
            editorVersion: this.editorVersion,
            name: this.name,
            showInFolder: this.showInFolder,
          },
          true
        );

        if (e.success) {
          Editor.Task.addNotice({
            title: this.name,
            message: this.t(
              "extension.create_package.create_extension_successful",
              { name: this.name, path: this.distPath }
            ),
            timeout: 5000 /* 5e3 */,
            type: "success",
          });

          setTimeout(() => {
            this.applying = false;

            Editor.Panel.has("extension.create").then((e) => {
              if (e) {
                Editor.Panel.close("extension.create");
              }
            });
          }, 200);
        } else {
          this.applying = false;

          Editor.Dialog.error(e.msg, {
            title: "Creator Extension",
            detail: e.msg,
          });

          this.updateExtensionIsExist();
        }
      } catch (e) {
        this.applying = false;

        if (e instanceof Error) {
          Editor.Dialog.error(e.message, {
            title: e.name,
            detail: e.stack,
          });
        }

        this.updateExtensionIsExist();
      }
    },
    updateExtensionIsExist() {
      this.extensionExist = this.name !== "" && existsSync(this.distPath);
    },
  },
  template: readFileSync(
    join(__dirname, "../../../static", "/template/create/index.html"),
    "utf8"
  ),
});
