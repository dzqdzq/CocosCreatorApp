var __awaiter =
  (this && this.__awaiter) ||
  ((e, s, o, p) =>
    new (o = o || Promise)((i, t) => {
      function a(e) {
        try {
          r(p.next(e));
        } catch (e) {
          t(e);
        }
      }
      function n(e) {
        try {
          r(p.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function r(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof o
            ? t
            : new o((e) => {
                e(t);
              })
          ).then(a, n);
        }
      }
      r((p = p.apply(e, s || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
const astcTypes = [
  "astc_4x4",
  "astc_5x5",
  "astc_6x6",
  "astc_8x8",
  "astc_10x5",
  "astc_10x10",
  "astc_12x12",
];
async function load() {
  if (
    !(await Editor.Profile.getConfig("utils", "features.bytedance-mini-game"))
  ) {
    exports.configs["bytedance-mini-game"] = {};
  }
}
exports.load = load;

exports.configs = {
  "bytedance-mini-game": {
    platformName: "i18n:bytedance-mini-game.title",
    options: {
      startSceneAssetBundle: {
        label: "i18n:bytedance-mini-game.options.start_scene_asset_bundle",
        default: false,
        render: { ui: "ui-checkbox" },
      },
      orientation: {
        default: "portrait",
        label: "i18n:bytedance-mini-game.options.orientation",
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
        default: "testappid",
        render: { ui: "ui-input" },
      },
      remoteServerAddress: {
        label: "i18n:bytedance-mini-game.options.remote_server_address",
        description:
          "i18n:bytedance-mini-game.options.remote_server_address_tips",
        default: "",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder:
              "i18n:bytedance-mini-game.options.remote_server_address_tips",
          },
        },
        verifyRules: ["http"],
      },
      buildOpenDataContextTemplate: {
        label:
          "i18n:bytedance-mini-game.options.gen_open_data_context_template",
        description:
          "i18n:bytedance-mini-game.options.gen_open_data_context_template_tips",
        render: { ui: "ui-checkbox" },
      },
      physX: {
        default: {
          use: "project",
          notPackPhysXLibs: false,
          multiThread: false,
          subThreadCount: 1,
          epsilon: 0.001,
        },
      },
    },
    hooks: "./hooks",
    panel: "./view",
    assetBundleConfig: {
      supportedCompressionTypes: [
        "none",
        "merge_dep",
        "merge_all_json",
        "zip",
        "subpackage",
      ],
    },
    textureCompressConfig: {
      platformType: "miniGame",
      support: {
        rgb: ["etc2_rgb", "etc1_rgb", "pvrtc_4bits_rgb", "pvrtc_2bits_rgb"],
        rgba: [
          "etc2_rgba",
          "etc1_rgb_a",
          "pvrtc_4bits_rgb_a",
          "pvrtc_4bits_rgba",
          "pvrtc_2bits_rgb_a",
          "pvrtc_2bits_rgba",
        ],
      },
    },
  },
};
