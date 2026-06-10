var __awaiter =
  (this && this.__awaiter) ||
  ((e, r, s, l) =>
    new (s = s || Promise)((t, i) => {
      function a(e) {
        try {
          o(l.next(e));
        } catch (e) {
          i(e);
        }
      }
      function n(e) {
        try {
          o(l.throw(e));
        } catch (e) {
          i(e);
        }
      }
      function o(e) {
        var i;

        if (e.done) {
          t(e.value);
        } else {
          ((i = e.value) instanceof s
            ? i
            : new s((e) => {
                e(i);
              })
          ).then(a, n);
        }
      }
      o((l = l.apply(e, r || [])).next());
    }));
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.alipay-mini-game"))) {
    exports.configs["alipay-mini-game"] = {};
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
exports.load = load;

exports.configs = {
  "alipay-mini-game": {
    platformName: "i18n:alipay-mini-game.title",
    hooks: "./hooks.js",
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
    options: {
      startSceneAssetBundle: {
        label: "i18n:alipay-mini-game.options.start_scene_asset_bundle",
        default: false,
        render: { ui: "ui-checkbox" },
      },
      deviceOrientation: {
        label: "i18n:alipay-mini-game.options.orientation",
        default: "portrait",
        render: {
          ui: "ui-select",
          items: [
            {
              label: "i18n:alipay-mini-game.options.portrait",
              value: "portrait",
            },
            {
              label: "i18n:alipay-mini-game.options.landscape",
              value: "landscape",
            },
          ],
        },
      },
      remoteUrl: {
        label: "i18n:alipay-mini-game.options.remote_url",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: "Enter remote address like 'https: //www.cocos.com'",
          },
        },
        verifyRules: ["http"],
      },
      polyfills: {
        label: "Polyfills",
        type: "object",
        attributes: { class: "wrap" },
        itemConfigs: {
          asyncFunctions: {
            label: "i18n:alipay-mini-game.options.async_functions",
            description: "i18n:alipay-mini-game.options.async_functions_tips",
            default: true,
            render: { ui: "ui-checkbox" },
          },
        },
      },
    },
  },
};
