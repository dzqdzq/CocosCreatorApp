var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, o = i) => {
        Object.defineProperty(e, o, {
          enumerable: true,
          get() {
            return t[i];
          },
        });
      }
    : (e, t, i, o) => {
        e[(o = o === undefined ? i : o)] = t[i];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var i in e) {
        if (i !== "default" && Object.prototype.hasOwnProperty.call(e, i)) {
          __createBinding(t, e, i);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = undefined;
exports.load = undefined;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const electron_1 = require("electron");
const xcode_proj_injection_1 = require("../xcode-proj-injection");
const utils_1 = require("./utils");
const Editor = __importStar(require("editor"));

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
      remoteServerAddress: {
        label: "i18n:ios-app-clip.options.remote_server_address",
        description: "i18n:ios-app-clip.options.remote_server_address_tips",
        render: {
          ui: "ui-input",
          attributes: {
            placeholder: "i18n:ios-app-clip.options.remote_server_address_tips",
          },
        },
        verifyRules: ["http"],
      },
      orientation: {
        label: "Orientation",
        type: "object",
        default: { portrait: true },
        attributes: { class: "wrap" },
        itemConfigs: {
          portrait: {
            label: "Portrait",
            default: true,
            render: { ui: "ui-checkbox" },
          },
          landscapeLeft: {
            label: "Landscape Left",
            default: false,
            render: { ui: "ui-checkbox" },
          },
          landscapeRight: {
            label: "Landscape Right",
            default: false,
            render: { ui: "ui-checkbox" },
          },
        },
      },
      polyfills: {
        label: "Polyfills",
        type: "object",
        attributes: { class: "wrap" },
        itemConfigs: {
          asyncFunctions: {
            label: "i18n:native.options.async_functions",
            description: "i18n:native.options.async_functions_tips",
            default: true,
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
    commonOptions: { buildPath: false },
    verifyRuleMap: {
      "ios-app-path": {
        func: (e, t) => !(!e || !fs_extra_1.existsSync(e)),
        message: "i18n:ios-app-clip.tips.ios_app_path_error",
      },
      "xcodeproj-path": {
        func: (e, t) => {
          t = t.packages["ios-app-clip"].mainPackagePath;
          if (e) {
            if (!e.endsWith(".xcodeproj")) {
              return false;
            }

            var i = path_1.join(
              Editor.App.path,
              "../resources/3d/engine/native"
            );

            var o = path_1.join(
              i,
              "templates/js-template-link/frameworks/runtime-src/proj.ios_mac"
            );

            var r = utils_1.findXcodeProjects(o);
            if (r.length !== 1) {
              throw new Error(
                r.length + ` Xcode projects found in ${o}, 1 expected`
              );
            }
            try {
              new xcode_proj_injection_1.XcodeProjModifer({
                appName: "_AppClip",
                doBackup: true,
                refXcodeProject: path_1.join(o, r[0]),
                inputXcodeProj: e,
                cocosRoot: i,
                projectResDir: t,
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
