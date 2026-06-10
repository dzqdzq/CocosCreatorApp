Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const electron_1 = require("electron");
const xcode_proj_injection_1 = require("../xcode-proj-injection");
const utils_1 = require("./utils");

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
  if (!(await Editor.Profile.getConfig("utils", "features.ios-app-clip"))) {
    exports.configs["ios-app-clip"] = {};
  }
}
exports.load = load;

exports.configs = {
  "ios-app-clip": {
    platformName: "iOS App Clip",
    doc: "editor/publish/native-options.html",
    commonOptions: { polyfills: { hidden: true }, buildPath: { hidden: true } },
    options: {
      mainPackagePath: {
        label: "i18n:ios-app-clip.options.ios_app_path",
        verifyRules: ["required", "ios-app-path"],
        description: "i18n:ios-app-clip.options.ios_app_path_hint",
        render: {
          ui: "ui-file",
          attributes: {
            type: "directory",
            placeholder: "i18n:ios-app-clip.options.ios_app_path_hint",
          },
        },
      },
      embedXcodeprojTarget: {
        label: "i18n:ios-app-clip.options.embed_xcodeproj_target",
        description: "i18n:ios-app-clip.options.embed_xcodeproj_target_hint",
        verifyRules: ["xcodeproj-path"],
        render: {
          ui: "ui-file",
          attributes: {
            type: "file",
            placeholder:
              "i18n:ios-app-clip.options.embed_xcodeproj_target_hint",
          },
        },
      },
      orientation: {
        label: "i18n:ios.options.orientation",
        type: "object",
        default: { portrait: true },
        itemConfigs: {
          portrait: {
            label: "i18n:ios-app-clip.options.portrait",
            default: true,
            render: { ui: "ui-checkbox" },
          },
          landscapeLeft: {
            label: "i18n:ios-app-clip.options.landscape_left",
            default: false,
            render: { ui: "ui-checkbox" },
          },
          landscapeRight: {
            label: "i18n:ios-app-clip.options.landscape_right",
            default: false,
            render: { ui: "ui-checkbox" },
          },
        },
      },
    },
    hooks: "./hooks",
    textureCompressConfig: {
      platformType: "ios",
      support: {
        rgb: ["pvrtc_4bits_rgb", "pvrtc_2bits_rgb", ...astcTypes],
        rgba: [
          "pvrtc_4bits_rgb_a",
          "pvrtc_4bits_rgba",
          "pvrtc_2bits_rgb_a",
          "pvrtc_2bits_rgba",
          ...astcTypes,
        ],
      },
    },
    assetBundleConfig: {
      supportedCompressionTypes: ["none", "merge_dep", "merge_all_json"],
    },
    verifyRuleMap: {
      "ios-app-path": {
        func: (e, i) => !(!e || !fs_extra_1.existsSync(e)),
        message: "i18n:ios-app-clip.tips.ios_app_path_error",
      },
      "xcodeproj-path": {
        func: async (e, i) => {
          i = i.packages["ios-app-clip"].mainPackagePath;
          if (e) {
            if (!e.endsWith(".xcodeproj")) {
              return false;
            }

            var o = (
              await Editor.Message.request("engine", "query-engine-info")
            ).native.builtin;

            var p = path_1.join(
              o,
              "templates/js-template-link/frameworks/runtime-src/proj.ios_mac"
            );

            var t = utils_1.findXcodeProjects(p);
            if (t.length !== 1) {
              throw new Error(
                t.length + ` xcode projects found in ${p}, 1 expected`
              );
            }
            try {
              new xcode_proj_injection_1.XcodeProjModifer({
                appName: "_AppClip",
                doBackup: true,
                refXcodeProject: path_1.join(p, t[0]),
                inputXcodeProj: e,
                cocosRoot: o,
                projectResDir: i,
              });
            } catch (e) {
              if (!e.message.includes("already loaded")) {
                console.error("" + e.message);
                return false;
              }
            }
          }
          return true;
        },
        message: "i18n:ios-app-clip.tips.xcodeproj_path_error",
      },
    },
    realInFileExplorer: (e) => {
      if (e.packages["ios-app-clip"].mainPackagePath) {
        e = path_1.join(
          e.packages["ios-app-clip"].mainPackagePath,
          "ios-app-clip"
        );

        fs_extra_1.existsSync(e)
          ? electron_1.shell.openExternal(e)
          : console.error(e + " is not exist!");
      } else {
        console.error("mainPackagePath");
      }
    },
  },
};
