var __awaiter =
  (this && this.__awaiter) ||
  ((e, a, r, s) =>
    new (r = r || Promise)((o, i) => {
      function n(e) {
        try {
          p(s.next(e));
        } catch (e) {
          i(e);
        }
      }
      function t(e) {
        try {
          p(s.throw(e));
        } catch (e) {
          i(e);
        }
      }
      function p(e) {
        var i;

        if (e.done) {
          o(e.value);
        } else {
          ((i = e.value) instanceof r
            ? i
            : new r((e) => {
                e(i);
              })
          ).then(n, t);
        }
      }
      p((s = s.apply(e, a || [])).next());
    }));
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.oppo-mini-game"))) {
    exports.configs["oppo-mini-game"] = {};
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
exports.optionsInPanel = undefined;

exports.optionsInPanel = {
  useDebugKey: { default: true },
  privatePemPath: { default: "" },
  certificatePemPath: { default: "" },
};

exports.load = load;

exports.configs = {
  "oppo-mini-game": {
    platformName: "i18n:oppo-mini-game.title",
    options: Object.assign(
      Object.assign(
        {
          startSceneAssetBundle: {
            default: false,
            label: "i18n:oppo-mini-game.options.start_scene_asset_bundle",
            description:
              "i18n:oppo-mini-game.options.start_scene_asset_bundle_tooltip",
            render: { ui: "ui-checkbox" },
          },
          tinyPackageServer: {
            default: "",
            label: "i18n:oppo-mini-game.options.tiny_packet_path",
            description: "i18n:oppo-mini-game.options.tiny_packet_path_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder:
                  "i18n:oppo-mini-game.options.tiny_packet_path_hint",
              },
            },
          },
          package: {
            default: "com.oppo.cocos",
            label: "i18n:oppo-mini-game.options.package",
            description: "i18n:oppo-mini-game.options.package_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder: "i18n:oppo-mini-game.options.package_hint",
              },
            },
            verifyRules: ["required"],
          },
          icon: {
            default: Editor.App.icon,
            label: "i18n:oppo-mini-game.options.desktop_icon",
            render: { ui: "ui-file" },
            verifyRules: ["required", "pathExist"],
          },
          versionName: {
            default: "1.0.0",
            label: "i18n:oppo-mini-game.options.version_name",
            description: "i18n:oppo-mini-game.options.version_name_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder: "i18n:oppo-mini-game.options.version_name_hint",
              },
            },
            verifyRules: ["required"],
          },
          versionCode: {
            default: 1201,
            label: "i18n:oppo-mini-game.options.version_number",
            description: "i18n:oppo-mini-game.options.version_number_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder: "i18n:oppo-mini-game.options.version_number_hint",
              },
            },
            verifyRules: ["required"],
          },
          minPlatformVersion: {
            default: 1056,
            label: "i18n:oppo-mini-game.options.support_min_platform",
            description:
              "i18n:oppo-mini-game.options.support_min_platform_hint",
            render: {
              ui: "ui-num-input",
              attributes: {
                placeholder:
                  "i18n:oppo-mini-game.options.support_min_platform_hint",
              },
            },
            verifyRules: ["required"],
          },
          deviceOrientation: {
            default: "portrait",
            label: "i18n:oppo-mini-game.options.screen_orientation",
            render: {
              ui: "ui-select",
              items: [
                { label: "Landscape", value: "landscape" },
                { label: "Portrait", value: "portrait" },
              ],
            },
          },
          logLevel: { default: "log" },
        },
        exports.optionsInPanel
      ),
      {
        separateEngine: {
          label: "i18n:oppo-mini-game.options.separate_engine",
          description: "i18n:oppo-mini-game.options.separate_engine_tips",
          default: false,
          render: { ui: "ui-checkbox" },
        },
      }
    ),
    panel: "./panel",
    hooks: "./hooks",
    textureCompressConfig: {
      platformType: "miniGame",
      support: { rgb: ["etc1_rgb"], rgba: ["etc1_rgb_a"] },
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
