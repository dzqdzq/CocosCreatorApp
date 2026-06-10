Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.ready = ready;
exports.close = close;
exports.exportConfig = exportConfig;
exports.importConfig = importConfig;

const { readFileSync, existsSync } = require("fs");

const { join, basename } = require("path");

const { copy } = require("fs-extra");

const preview_container_1 = require("./preview-container");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm;
const SELECT_IMAGE = "i18n:builder.splashSetting.selectImage";
const SPLASH_DIR = join(Editor.Project.path, "settings");
function jointWatermarkPosLabel(t, e) {
  return (
    Editor.I18n.t("builder.splashSetting.watermarkLocationConfig." + t) +
    " - " +
    Editor.I18n.t("builder.splashSetting.watermarkLocationConfig." + e)
  );
}

const vueTemplate = readFileSync(
  join(__dirname, "../../../static/contributions/splash-setting.html"),
  "utf8"
);

const SplashSettingVM = Vue.extend({
  name: "SplashSettingVM",
  components: { PreviewContainer: preview_container_1.PreviewContainer },
  data() {
    return {
      settings: {},
      defaultSettings: null,
      watermarkLocationConfig: [
        {
          label: Editor.I18n.t("builder.splashSetting.default"),
          value: "default",
        },
        { label: jointWatermarkPosLabel("top", "left"), value: "topLeft" },
        {
          label: jointWatermarkPosLabel("top", "center"),
          value: "topCenter",
        },
        { label: jointWatermarkPosLabel("top", "right"), value: "topRight" },
        {
          label: jointWatermarkPosLabel("bottom", "left"),
          value: "bottomLeft",
        },
        {
          label: jointWatermarkPosLabel("bottom", "center"),
          value: "bottomCenter",
        },
        {
          label: jointWatermarkPosLabel("bottom", "right"),
          value: "bottomRight",
        },
      ],
      designResolution: {
        width: 1280,
        height: 720,
        fitHeight: false,
        fitWidth: true,
      },
      showMask: false,
    };
  },
  computed: {
    displayRatio() {
      return this.settings.displayRatio
        ? (100 * this.settings.displayRatio).toFixed()
        : "100";
    },
    logoType() {
      return this.settings.logo?.type || "default";
    },
    backgroundType() {
      return this.settings.background?.type || "default";
    },
    backgroundColor() {
      var t;
      return this.settings.background?.color
        ? ((t = ["x", "y", "z", "w"].map(
            (t) => 255 * this.settings.background.color[t]
          )),
          JSON.stringify(t))
        : "[4,9,10,255]";
    },
    customLogoSrcLabel() {
      return this.settings.logo?.image &&
        this.defaultSettings?.logo &&
        this.settings.logo.image !== this.defaultSettings.logo.image
        ? basename(this.settings.logo.image)
        : SELECT_IMAGE;
    },
    customBackgroundSrcLabel() {
      return this.settings.background?.image
        ? basename(this.settings.background.image)
        : SELECT_IMAGE;
    },
    customLogoDisable() {
      return this.customLogoSrcLabel === SELECT_IMAGE;
    },
    customBackgroundDisable() {
      return this.customBackgroundSrcLabel === SELECT_IMAGE;
    },
    backgroundTooltip() {
      return Editor.I18n.t(
        "builder.splashSetting.settings.background.customTips",
        {
          fitWidth: Editor.I18n.t(
            "builder." + (this.designResolution.fitWidth ? "yes" : "no")
          ),
          fitHeight: Editor.I18n.t(
            "builder." + (this.designResolution.fitHeight ? "yes" : "no")
          ),
        }
      );
    },
  },
  async mounted() {
    await this.initData();
  },
  methods: {
    async onConfirm(e) {
      var s = e.target.getAttribute("name");
      if (s) {
        let t = e.target.value;

        if (s === "displayRatio" && t) {
          t /= 100;
        }

        this.saveSettings(s, t);
      }
    },
    async saveSettings(t, e) {
      this.$set(this.settings, t, e);
      await Editor.Profile.setProject("builder", "splash-setting." + t, e);
    },
    async onTypeChange(t, e) {
      e = e.target.value;
      this.$set(this.settings[t], "type", e);

      await Editor.Profile.setProject("builder", `splash-setting.${t}.type`, e);

      if (t === "logo") {
        this.handleLogoSrc();
      } else {
        this.handleBackgroundSrc();
      }
    },
    async onBackgroundColorConfirm(t) {
      t = t.target.value;
      t = { x: t[0] / 255, y: t[1] / 255, z: t[2] / 255, w: t[3] / 255 };
      this.$set(this.settings.background, "color", t);

      await Editor.Profile.setProject(
        "builder",
        "splash-setting.background.color",
        t
      );

      this.handleBackgroundSrc();
    },
    async initData() {
      if (await checkCustomSplash()) {
        this.showMask = true;
      }

      this.defaultSettings = await Editor.Profile.getProject(
        "builder",
        "splash-setting",
        "default"
      );

      this.settings = await Editor.Profile.getProject(
        "builder",
        "splash-setting"
      );

      var t = await Editor.Profile.getProject(
        "project",
        "general.designResolution"
      );
      this.designResolution = t;
      this.handleBackgroundSrc();
      this.handleLogoSrc();
    },
    async reset() {
      this.settings = JSON.parse(JSON.stringify(this.defaultSettings));

      await Editor.Profile.removeProject(
        "builder",
        "splash-setting",
        "project"
      );

      this.handleBackgroundSrc();
      this.handleLogoSrc();
    },
    async selectImage(t) {
      var e = (
        await Editor.Dialog.select({
          type: "file",
          multi: false,
          filters: [{ extensions: ["png", "jpg", "jpeg"], name: "Image" }],
        })
      ).filePaths[0];

      if (e) {
        await this.updateImageSrc(t, e);
      }
    },
    async updateImageSrc(t, e) {
      let s;
      if (existsSync(e)) {
        s = e;
      } else {
        var i = await Editor.Message.request("asset-db", "query-asset-info", e);
        if (!i) {
          return void console.error(`Can't get asset info(${e}) from uuid`);
        }
        s = i.file;
      }
      i = join(SPLASH_DIR, basename(s));

      if (s !== i) {
        await copy(s, i, { overwrite: true });
        e = Editor.UI.__protected__.File.resolveToUrl(i, "project");
        this.$set(this.settings[t], "image", e);

        await Editor.Profile.setProject(
          "builder",
          `splash-setting.${t}.image`,
          e
        );

        t === "logo" ? this.handleLogoSrc() : this.handleBackgroundSrc();
      }
    },
    handleLogoSrc() {
      var t;

      if (this.settings.logo.type === "none") {
        this.$delete(this.settings, "logoSrc");
      } else {
        t = (
          this.settings.logo.type === "custom"
            ? this.settings.logo
            : this.defaultSettings?.logo
        ).image;

        this.$set(
          this.settings,
          "logoSrc",
          Editor.UI.__protected__.File.resolveToRaw(t) +
            ("?timestamp=" + Date.now())
        );
      }
    },
    handleBackgroundSrc() {
      var t;

      if (this.settings.background.type !== "custom") {
        this.$delete(this.settings, "backgroundSrc");
      } else {
        t = this.settings.background.image;

        this.$set(
          this.settings,
          "backgroundSrc",
          Editor.UI.__protected__.File.resolveToRaw(t) +
            ("?timestamp=" + Date.now())
        );
      }
    },
    async enableCustomSplash() {
      try {
        if (
          !(await Editor.Message.request(
            "information",
            "has-dialog",
            "customSplash"
          ))
        ) {
          switch (
            (
              await Editor.Message.request(
                "information",
                "open-information-dialog",
                "customSplash"
              )
            ).action
          ) {
            case "resolve": {
              this.showMask = false;
              break;
            }
            case "unusual": {
              console.warn(
                Editor.I18n.t("builder.splashSetting.informationDialogUnusual")
              );
            }
          }
        }
      } catch (t) {
        console.debug(t);
      }
    },
    async previewInBrowser() {
      Editor.Message.send("preview", "open-terminal", {
        openMode: "browser",
        splashPreview: true,
      });
    },
  },
  template: vueTemplate,
});

function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new SplashSettingVM()).$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}
async function exportConfig() {
  var t = {};

  t["splash-setting"] =
    (await Editor.Message.request(
      "project",
      "query-config",
      "builder",
      "splash-setting"
    )) || {};

  return t;
}
async function importConfig(t) {
  if (t["splash-setting"]) {
    await Editor.Message.request(
      "project",
      "set-config",
      "builder",
      "splash-setting",
      t["splash-setting"]
    );
  }
}
async function checkCustomSplash() {
  try {
    var t = await Editor.Message.request(
      "information",
      "query-information",
      "customSplash"
    );
    if (
      t &&
      (t.status === "network_failure" ||
        t.status === "network_exception" ||
        (t.data && t.data.enable && !t.data[t.data.id].complete))
    ) {
      return true;
    }
  } catch (t) {
    console.debug(t);
  }
  return false;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/splash-setting.css"),
  "utf8"
);

exports.template = `
<div class="container"></div>
`;

exports.$ = { container: ".container" };
