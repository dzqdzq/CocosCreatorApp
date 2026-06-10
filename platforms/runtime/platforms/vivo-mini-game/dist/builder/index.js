var __awaiter =
  (this && this.__awaiter) ||
  ((i, r, s, p) =>
    new (s = s || Promise)((n, e) => {
      function t(i) {
        try {
          a(p.next(i));
        } catch (i) {
          e(i);
        }
      }
      function o(i) {
        try {
          a(p.throw(i));
        } catch (i) {
          e(i);
        }
      }
      function a(i) {
        var e;

        if (i.done) {
          n(i.value);
        } else {
          ((e = i.value) instanceof s
            ? e
            : new s((i) => {
                i(e);
              })
          ).then(t, o);
        }
      }
      a((p = p.apply(i, r || [])).next());
    }));
async function load() {
  if (!(await Editor.Profile.getConfig("utils", "features.vivo-mini-game"))) {
    exports.configs["vivo-mini-game"] = {};
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
  "vivo-mini-game": {
    platformName: "i18n:vivo-mini-game.title",
    hooks: "./hooks.js",
    panel: "./panel.js",
    options: Object.assign(
      Object.assign(
        {
          startSceneAssetBundle: {
            default: false,
            label: "i18n:vivo-mini-game.options.start_scene_asset_bundle",
            description:
              "i18n:vivo-mini-game.options.start_scene_asset_bundle_tooltip",
            render: {
              ui: "ui-checkbox",
              attributes: {
                placeholder:
                  "i18n:vivo-mini-game.options.start_scene_asset_bundle_tooltip",
              },
            },
          },
          tinyPackageServer: {
            default: "",
            label: "i18n:vivo-mini-game.options.tiny_packet_path",
            description: "i18n:vivo-mini-game.options.tiny_packet_path_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder:
                  "i18n:vivo-mini-game.options.tiny_packet_path_hint",
              },
            },
            verifyRules: ["http"],
          },
          package: {
            default: "com.vivo.cocos",
            label: "i18n:vivo-mini-game.options.package",
            description: "i18n:vivo-mini-game.options.package_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder: "i18n:vivo-mini-game.options.package_hint",
              },
            },
            verifyRules: ["required"],
          },
          icon: {
            default: Editor.App.icon,
            label: "i18n:vivo-mini-game.options.icon",
            render: { ui: "ui-file" },
            verifyRules: ["required", "pathExist"],
          },
          versionName: {
            default: "1.0.0",
            label: "i18n:vivo-mini-game.options.version_name",
            description: "i18n:vivo-mini-game.options.version_name_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder: "i18n:vivo-mini-game.options.version_name_hint",
              },
            },
            verifyRules: ["required"],
          },
          versionCode: {
            default: 1201,
            label: "i18n:vivo-mini-game.options.version_code",
            description: "i18n:vivo-mini-game.options.version_code_hint",
            render: {
              ui: "ui-input",
              attributes: {
                placeholder: "i18n:vivo-mini-game.options.version_code_hint",
              },
            },
            verifyRules: ["required"],
          },
          minPlatformVersion: {
            default: 1056,
            label: "i18n:vivo-mini-game.options.support_min_platform",
            description:
              "i18n:vivo-mini-game.options.support_min_platform_hint",
            render: {
              ui: "ui-num-input",
              attributes: {
                placeholder:
                  "i18n:vivo-mini-game.options.support_min_platform_hint",
              },
            },
            verifyRules: ["required"],
          },
          deviceOrientation: {
            default: "portrait",
            label: "i18n:vivo-mini-game.options.screen_orientation",
            render: {
              ui: "ui-select",
              items: [
                { label: "Landscape", value: "landscape" },
                { label: "Portrait", value: "portrait" },
              ],
            },
          },
        },
        exports.optionsInPanel
      ),
      {
        separateEngine: {
          label: "i18n:vivo-mini-game.options.separate_engine",
          description: "i18n:vivo-mini-game.options.separate_engine_tips",
          default: false,
          render: { ui: "ui-checkbox" },
        },
      }
    ),
    textureCompressConfig: {
      platformType: "miniGame",
      support: { rgb: ["etc1_rgb"], rgba: ["etc1_rgb_a"] },
    },
    debugConfig: { custom: "../vivo-preview/debug-tools" },
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
