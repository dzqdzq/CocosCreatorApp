var __awaiter =
  (this && this.__awaiter) ||
  ((e, o, s, p) =>
    new (s = s || Promise)((t, i) => {
      function a(e) {
        try {
          r(p.next(e));
        } catch (e) {
          i(e);
        }
      }
      function n(e) {
        try {
          r(p.throw(e));
        } catch (e) {
          i(e);
        }
      }
      function r(e) {
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
      r((p = p.apply(e, o || [])).next());
    }));
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.baidu-mini-game"))) {
    exports.configs["baidu-mini-game"] = {};
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
exports.load = load;

exports.configs = {
  "baidu-mini-game": {
    platformName: "i18n:baidu-mini-game.title",
    options: {
      startSceneAssetBundle: {
        label: "i18n:baidu-mini-game.options.start_scene_asset_bundle",
        default: false,
        render: { ui: "ui-checkbox" },
      },
      orientation: {
        default: "portrait",
        label: "i18n:baidu-mini-game.options.orientation",
        render: {
          ui: "ui-select",
          items: [
            { label: "Landscape", value: "landscape" },
            { label: "Portrait", value: "portrait" },
          ],
        },
      },
      appid: {
        label: "AppId",
        default: "testappId",
        description: "i18n:baidu-mini-game.options.appid_holder",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: "i18n:baidu-mini-game.options.appid_holder",
          },
        },
      },
      remoteServerAddress: {
        label: "i18n:baidu-mini-game.options.remote_server_address",
        description: "i18n:baidu-mini-game.options.remote_server_address_tips",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder:
              "i18n:baidu-mini-game.options.remote_server_address_tips",
          },
        },
        verifyRules: ["http"],
      },
      buildOpenDataContextTemplate: {
        label: "i18n:baidu-mini-game.options.gen_open_data_context_template",
        description:
          "i18n:baidu-mini-game.options.gen_open_data_context_template_tips",
        render: { ui: "ui-checkbox" },
      },
    },
    hooks: "./hooks",
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
      supportedCompressionTypes: [
        "none",
        "merge_dep",
        "merge_all_json",
        "zip",
        "subpackage",
      ],
    },
  },
};
