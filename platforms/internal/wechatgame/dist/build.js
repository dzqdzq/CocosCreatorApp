var __awaiter =
  (this && this.__awaiter) ||
  ((e, s, o, p) =>
    new (o = o || Promise)((a, t) => {
      function i(e) {
        try {
          n(p.next(e));
        } catch (e) {
          t(e);
        }
      }
      function r(e) {
        try {
          n(p.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function n(e) {
        var t;

        if (e.done) {
          a(e.value);
        } else {
          ((t = e.value) instanceof o
            ? t
            : new o((e) => {
                e(t);
              })
          ).then(i, r);
        }
      }
      n((p = p.apply(e, s || [])).next());
    }));
async function load() {
  if (await Editor.Profile.getConfig("utils", "features.wechatgame")) {
    if (
      !(await Editor.Profile.getConfig(
        "utils",
        "features.wechat-separation-engine"
      ))
    ) {
      delete exports.configs.wechatgame.options.separateEngine;
    }
  } else {
    exports.configs.wechatgame = {};
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
exports.load = load;

const isNormalVersion =
  /\d*\.\d*\.\d*$/.test(Editor.App.version) || Editor.App.dev;

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
        func(t, a) {
          return __awaiter(this, undefined, undefined, function* () {
            var e;
            return !(
              t &&
              !a.debug &&
              (e = yield Editor.Message.request(
                "engine",
                "query-info",
                Editor.Project.type
              )) &&
              e.version !== "builtin"
            );
          });
        },
        message: "i18n:wechatgame.error.separate_engine",
      },
    },
    platformName: "i18n:wechatgame.title",
    options: {
      startSceneAssetBundle: {
        label: "i18n:wechatgame.options.start_scene_asset_bundle",
        default: false,
        render: { ui: "ui-checkbox" },
      },
      orientation: {
        default: "portrait",
        label: "i18n:wechatgame.options.orientation",
        render: {
          ui: "ui-select",
          items: [
            { label: "Landscape", value: "landscapeRight" },
            { label: "Portrait", value: "portrait" },
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
      },
      remoteServerAddress: {
        label: "i18n:wechatgame.options.remote_server_address",
        description: "i18n:wechatgame.options.remote_server_address_tips",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: "i18n:wechatgame.options.remote_server_address_tips",
          },
        },
        verifyRules: ["http"],
      },
      buildOpenDataContextTemplate: {
        label: "i18n:wechatgame.options.gen_open_data_context_template",
        description:
          "i18n:wechatgame.options.gen_open_data_context_template_tips",
        render: { ui: "ui-checkbox" },
      },
      separateEngine: {
        label: "i18n:wechatgame.options.separate_engine",
        description: isNormalVersion
          ? "i18n:wechatgame.options.separate_engine_tips"
          : "i18n:wechatgame.tips.separate_engine_only_in_normal_version",
        default: false,
        render: {
          ui: "ui-checkbox",
          attributes: { disabled: !isNormalVersion },
        },
      },
      wasm: { default: "wasm" },
      enabelWebGL2: { default: "off" },
    },
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
    },
  },
};
