var __awaiter =
  (this && this.__awaiter) ||
  ((e, n, a, u) =>
    new (a = a || Promise)((r, t) => {
      function s(e) {
        try {
          o(u.next(e));
        } catch (e) {
          t(e);
        }
      }
      function i(e) {
        try {
          o(u.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        var t;

        if (e.done) {
          r(e.value);
        } else {
          ((t = e.value) instanceof a
            ? t
            : new a((e) => {
                e(t);
              })
          ).then(s, i);
        }
      }
      o((u = u.apply(e, n || [])).next());
    }));
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
    panel: "./view",
    hooks: "./hooks",
    options: {
      startSceneAssetBundle: {
        default: view_1.platformSettings.startSceneAssetBundle,
      },
      resourceURL: { default: view_1.platformSettings.resourceURL },
    },
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
  },
};
