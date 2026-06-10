Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.optionsInPanel = undefined;

const { join } = require("path");

exports.optionsInPanel = {
  useDebugKey: { default: true },
  privatePemPath: { default: "" },
  certificatePemPath: { default: "" },
};

exports.configs = {
  "vivo-mini-game": {
    platformName: "i18n:vivo-mini-game.title",
    platformType: "VIVO",
    doc: "editor/publish/publish-vivo-mini-game.html",
    hooks: "./hooks.js",
    panel: "./panel.js",
    options: {
      package: {
        default: "com.vivo.cocos",
        label: "i18n:vivo-mini-game.options.package",
        description: "i18n:vivo-mini-game.options.package_hint",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: "i18n:vivo-mini-game.options.package_hint",
          },
        },
        verifyRules: ["required"],
      },
      icon: {
        default: Editor.App.icon,
        label: "i18n:vivo-mini-game.options.icon",
        render: { ui: "ui-file", attributes: { protocols: "project,file" } },
        verifyRules: ["required", "pathExist"],
      },
      versionName: {
        default: "1.0.0",
        label: "i18n:vivo-mini-game.options.version_name",
        description: "i18n:vivo-mini-game.options.version_name_hint",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: "i18n:vivo-mini-game.options.version_name_hint",
          },
        },
        verifyRules: ["required"],
      },
      versionCode: {
        default: 1201,
        label: "i18n:vivo-mini-game.options.version_code",
        description: "i18n:vivo-mini-game.options.version_code_tips",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: "i18n:vivo-mini-game.options.version_code_hint",
          },
        },
        verifyRules: ["required"],
      },
      minPlatformVersion: {
        default: 1056,
        label: "i18n:vivo-mini-game.options.support_min_platform",
        description: "i18n:vivo-mini-game.options.support_min_platform_hint",
        render: {
          ui: "ui-num-input",
          attributes: {
            placeholder:
              "i18n:vivo-mini-game.options.support_min_platform_hint",
          },
        },
        verifyRules: ["required"],
      },
      deviceOrientation: {
        default: "portrait",
        label: "i18n:vivo-mini-game.options.screen_orientation",
        render: {
          ui: "ui-select-pro",
          items: [
            {
              label: "i18n:vivo-mini-game.options.landscape",
              value: "landscape",
            },
            {
              label: "i18n:vivo-mini-game.options.portrait",
              value: "portrait",
            },
          ],
        },
      },
      ...exports.optionsInPanel,
      separateEngine: {
        label: "i18n:vivo-mini-game.options.separate_engine",
        description: "i18n:vivo-mini-game.options.separate_engine_tips",
        default: false,
        render: { ui: "ui-checkbox" },
      },
    },
    commonOptions: {
      buildStageGroup: { default: { build: ["make"] } },
      useBuiltinServer: { hidden: false },
      startSceneAssetBundle: { hidden: false },
    },
    buildTemplateConfig: {
      templates: [
        {
          path: join(
            __dirname,
            "../../static/build-template/project.config.json"
          ),
          destUrl: "project.config.json",
        },
        {
          path: join(__dirname, "../../static/build-template/game.ejs"),
          destUrl: "game.ejs",
        },
      ],
      version: "1.0.0",
    },
    textureCompressConfig: {
      platformType: "miniGame",
      support: { rgb: ["etc1_rgb"], rgba: ["etc1_rgb_a"] },
    },
    debugConfig: { custom: "../vivo-preview/debug-tools" },
    assetBundleConfig: {
      supportedCompressionTypes: [
        "none",
        "merge_dep",
        "merge_all_json",
        "zip",
        "subpackage",
      ],
      platformType: "miniGame",
    },
    customBuildStages: [
      {
        type: "hook",
        name: "make",
        displayName: "i18n:vivo-mini-game.make.label",
        hook: "make",
      },
      {
        type: "message",
        name: "run",
        displayName: "i18n:vivo-mini-game.run.label",
        message: { name: "run", target: "vivo-mini-game" },
        parallelism: "other",
      },
    ],
  },
};
