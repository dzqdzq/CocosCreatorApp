var __awaiter =
  (this && this.__awaiter) ||
  ((e, s, a, c) =>
    new (a = a || Promise)((o, t) => {
      function n(e) {
        try {
          r(c.next(e));
        } catch (e) {
          t(e);
        }
      }
      function i(e) {
        try {
          r(c.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function r(e) {
        var t;

        if (e.done) {
          o(e.value);
        } else {
          ((t = e.value) instanceof a
            ? t
            : new a((e) => {
                e(t);
              })
          ).then(n, i);
        }
      }
      r((c = c.apply(e, s || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
const const_1 = require("./utils/const");
const view_1 = require("./view");
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.cocos-play"))) {
    exports.configs["cocos-play"] = {};
  }
}
exports.load = load;

exports.configs = {
  "cocos-play": {
    platformName: `i18n:${const_1.PLATFORM_NAME}.title`,
    panel: "./view",
    hooks: "./hooks",
    options: {
      deviceOrientation: {
        default: view_1.platformSettings.deviceOrientation,
      },
      startSceneAssetBundle: {
        default: view_1.platformSettings.startSceneAssetBundle,
      },
      resourceURL: { default: view_1.platformSettings.resourceURL },
    },
    textureCompressConfig: {
      platformType: "miniGame",
      support: { rgb: ["etc1_rgb"], rgba: ["etc1_rgb_a"] },
    },
    assetBundleConfig: {
      supportedCompressionTypes: ["none", "merge_dep", "merge_all_json", "zip"],
    },
  },
};
