var __awaiter =
  (this && this.__awaiter) ||
  ((t, s, a, c) =>
    new (a = a || Promise)((o, e) => {
      function r(t) {
        try {
          n(c.next(t));
        } catch (t) {
          e(t);
        }
      }
      function i(t) {
        try {
          n(c.throw(t));
        } catch (t) {
          e(t);
        }
      }
      function n(t) {
        var e;

        if (t.done) {
          o(t.value);
        } else {
          ((e = t.value) instanceof a
            ? e
            : new a((t) => {
                t(e);
              })
          ).then(r, i);
        }
      }
      n((c = c.apply(t, s || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
const const_1 = require("./utils/const");
const view_1 = require("./view");
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.qtt"))) {
    exports.configs.qtt = {};
  }
}
exports.load = load;

exports.configs = {
  qtt: {
    platformName: `i18n:${const_1.PLATFORM_NAME}.title`,
    panel: "./view",
    hooks: "./hooks",
    options: {
      startSceneAssetBundle: {
        default: view_1.platformSettings.startSceneAssetBundle,
      },
      resourceURL: { default: view_1.platformSettings.resourceURL },
      package: { default: view_1.platformSettings.package },
      icon: { default: view_1.platformSettings.icon },
      versionName: { default: view_1.platformSettings.versionName },
      versionCode: { default: view_1.platformSettings.versionCode },
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
