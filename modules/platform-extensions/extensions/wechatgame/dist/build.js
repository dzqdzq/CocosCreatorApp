Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = load;

const { join } = require("path");

const share_1 = require("./share");
async function load() {
  if (
    !(await Editor.Profile.getConfig(
      "utils",
      "features.wechat-separation-engine"
    ))
  ) {
    delete exports.configs.wechatgame.options.separateEngine;
  }
}
const astcTypes = [
  "astc_4x4",
  "astc_5x5",
  "astc_6x6",
  "astc_8x8",
  "astc_10x5",
  "astc_10x10",
  "astc_12x12",
];
exports.configs = {
  wechatgame: {
    verifyRuleMap: {
      separateEngine: {
        async func(e, a) {
          return (
            !(e && !a.debug) ||
            (await Editor.Message.request("engine", "query-engine-info"))
              .typescript.type === "builtin"
          );
        },
        message: "i18n:wechatgame.error.separate_engine",
      },
    },
    platformName: "i18n:wechatgame.title",
    platformType: "WECHAT",
    doc: "editor/publish/publish-wechatgame.html",
    options: {
      orientation: {
        default: "portrait",
        label: "i18n:wechatgame.options.orientation",
        render: {
          ui: "ui-select-pro",
          items: [
            {
              label: "i18n:wechatgame.options.landscape",
              value: "landscapeRight",
            },
            { label: "i18n:wechatgame.options.portrait", value: "portrait" },
          ],
        },
      },
      appid: {
        label: "AppId",
        default: "wx6ac3f5090a6b99c5",
        render: {
          ui: "ui-input",
          attributes: { placeholder: "i18n:wechatgame.options.appid_holder" },
        },
        verifyRules: ["required"],
      },
      buildOpenDataContextTemplate: {
        label: "i18n:wechatgame.options.gen_open_data_context_template",
        description:
          "i18n:wechatgame.options.gen_open_data_context_template_tips",
        render: { ui: "ui-checkbox" },
        default: "",
      },
      wasmSubpackage: {
        label: "i18n:wechatgame.options.wasm_subpackage",
        description: "i18n:wechatgame.options.wasm_subpackage_tips",
        render: { ui: "ui-checkbox" },
      },
      separateEngine: { default: false },
      highPerformanceMode: { default: false },
    },
    commonOptions: {
      polyfills: { hidden: true },
      useBuiltinServer: { hidden: false },
      startSceneAssetBundle: { hidden: false },
      useSplashScreen: { render: { ui: "", attributes: { disabled: true } } },
      wasmCompressionMode: { hidden: false },
      nativeCodeBundleMode: { default: "wasm" },
      overwriteProjectSettings: {
        default: { macroConfig: { cleanupImageCache: "on" } },
      },
    },
    hooks: "./hooks",
    panel: "./view",
    textureCompressConfig: {
      platformType: "miniGame",
      support: {
        rgb: [
          "etc1_rgb",
          "pvrtc_4bits_rgb",
          "pvrtc_2bits_rgb",
          "etc2_rgb",
          ...astcTypes,
        ],
        rgba: [
          "etc1_rgb_a",
          "pvrtc_4bits_rgb_a",
          "pvrtc_4bits_rgba",
          "etc2_rgba",
          "pvrtc_2bits_rgb_a",
          "pvrtc_2bits_rgba",
          ...astcTypes,
        ],
      },
    },
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
        type: "message",
        name: "run",
        displayName: "i18n:wechatgame.run.label",
        message: { name: "run", target: "wechatgame" },
        parallelism: "all",
      },
    ],
    buildTemplateConfig: {
      templates: ["game.ejs", "game.json", "project.config.json"].map((e) => ({
        path: join(share_1.Paths.internalTemplateDir, e),
        destUrl: e,
      })),
      version: "1.0.0",
    },
  },
};
