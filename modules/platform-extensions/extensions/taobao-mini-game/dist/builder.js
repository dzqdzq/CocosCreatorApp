Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.Paths = undefined;
exports.PLATFORM = undefined;

const { join } = require("path");

exports.PLATFORM = "taobao-mini-game";

exports.Paths = {
  internalTemplateDir: join(
    __dirname,
    "../../../../../../resources/3d/engine/templates/" + exports.PLATFORM
  ),
};

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
  "taobao-mini-game": {
    verifyRuleMap: {
      separateEngine: {
        async func(e, t) {
          return (
            !(e && !t.debug) ||
            (await Editor.Message.request("engine", "query-engine-info"))
              .typescript.type === "builtin"
          );
        },
        message: "i18n:taobao-mini-game.error.separate_engine",
      },
    },
    platformName: "i18n:taobao-mini-game.title",
    platformType: "TAOBAO_MINIGAME",
    doc: "editor/publish/publish-taobao-mini-game.html",
    hooks: "./hooks",
    panel: "./view",
    textureCompressConfig: {
      platformType: "miniGame",
      support: {
        rgb: ["etc1_rgb", "pvrtc_4bits_rgb", "pvrtc_2bits_rgb", ...astcTypes],
        rgba: [
          "etc1_rgb_a",
          "pvrtc_4bits_rgb_a",
          "pvrtc_4bits_rgba",
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
    options: {
      deviceOrientation: {
        label: "i18n:taobao-mini-game.options.orientation",
        default: "portrait",
        render: {
          ui: "ui-select-pro",
          items: [
            {
              label: "i18n:taobao-mini-game.options.portrait",
              value: "portrait",
            },
            {
              label: "i18n:taobao-mini-game.options.landscape",
              value: "landscape",
            },
          ],
        },
      },
      removeGlobalAdapter: { default: false },
      separateEngine: { default: false },
      wasmSubpackage: {
        label: "i18n:taobao-mini-game.options.wasm_subpackage",
        description: "i18n:taobao-mini-game.options.wasm_subpackage_tips",
        render: { ui: "ui-checkbox" },
      },
    },
    commonOptions: {
      useBuiltinServer: { hidden: true },
      startSceneAssetBundle: { hidden: false },
    },
    buildTemplateConfig: {
      templates: ["game.ejs", "mini.project.json", "game.json"].map((e) => ({
        path: join(exports.Paths.internalTemplateDir, e),
        destUrl: e,
      })),
      version: "1.0.0",
    },
  },
};
