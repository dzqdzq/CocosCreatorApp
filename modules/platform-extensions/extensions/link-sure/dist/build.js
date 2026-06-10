Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
const const_1 = require("./utils/const");
const view_1 = require("./view");
async function load() {
  if (await Editor.Profile.getConfig("utils", "features.link-sure")) {
    if (
      await Editor.Profile.getConfig("utils", "features.link-sure-subpackages")
    ) {
      exports.configs[
        "link-sure"
      ].assetBundleConfig.supportedCompressionTypes.push("subpackage");
    }
  } else {
    exports.configs["link-sure"] = {};
  }
}
exports.load = load;

exports.configs = {
  "link-sure": {
    platformName: `i18n:${const_1.PLATFORM_NAME}.title`,
    doc: `editor/publish/publish-${const_1.PLATFORM_NAME}.html`,
    panel: "./view",
    hooks: "./hooks",
    options: {
      startSceneAssetBundle: {
        default: view_1.platformSettings.startSceneAssetBundle,
      },
    },
    commonOptions: { buildStageGroup: { default: { build: ["make"] } } },
    textureCompressConfig: {
      platformType: "miniGame",
      support: {
        rgb: ["etc1_rgb", "pvrtc_4bits_rgb", "pvrtc_2bits_rgb"],
        rgba: [
          "etc1_rgb_a",
          "pvrtc_4bits_rgb_a",
          "pvrtc_4bits_rgba",
          "pvrtc_2bits_rgb_a",
          "pvrtc_2bits_rgba",
        ],
      },
    },
    assetBundleConfig: {
      supportedCompressionTypes: ["none", "merge_dep", "merge_all_json", "zip"],
    },
    customBuildStages: [
      {
        name: "make",
        displayName: `i18n:${const_1.PLATFORM_NAME}.make.label`,
        hookHandle: "make",
        showProgressBar: true,
        requestOptions: true,
      },
    ],
  },
};
