var PLATFORM_ENUM;
var LANGUAGE;
var PLUGIN_NAME_ENUM;
Object.defineProperty(exports, "__esModule", { value: true });

exports.ConsoleParams = undefined;
exports.PLUGIN_NAME_ENUM = undefined;
exports.LANGUAGE = undefined;
exports.PLATFORM_ENUM = undefined;
exports.DEFAULT_VALUES = undefined;

exports.DEFAULT_VALUES = {
  QUIET: false,
  IOS_BUNDLE_ID: "com.cocos.demo",
  MAC_BUNDLE_ID: "com.cocos.demo",
  ANDROID_BUNDLE_ID: "com.cocos.demo",
  OHOS_BUNDLE_ID: "com.cocos.demo",
  CMAKE_GENERATOR: "",
  CMAKE_PATH: "",
  TEAM_ID: "",
};

((o) => {
  o.UNKNOWN = "unknown";
  o.IOS = "ios";
  o.MAC = "mac";
  o.WINDOWS = "windows";
  o.ANDROID = "android";
  o.OHOS = "ohos";
  o.IOSSIMULATOR = "iossimulator";
  o["HUAWEI-AGC"] = "huawei-agc";
  o["XR-HUAWEIVR"] = "xr-huaweivr";
  o["XR-META"] = "xr-meta";
  o["XR-PICO"] = "xr-pico";
  o["XR-ROKID"] = "xr-rokid";
  o["XR-MONADO"] = "xr-monado";
  o.LINUX = "linux";
})((PLATFORM_ENUM = exports.PLATFORM_ENUM || (exports.PLATFORM_ENUM = {})));

LANGUAGE = exports.LANGUAGE || (exports.LANGUAGE = {});
LANGUAGE[(LANGUAGE.JS = 0)] = "JS";

((o) => {
  o.NEW = "New";
  o.COMPILE = "Compile";
  o.GENERATE = "Generate";
  o.RUN = "Run";
})(
  (PLUGIN_NAME_ENUM =
    exports.PLUGIN_NAME_ENUM || (exports.PLUGIN_NAME_ENUM = {}))
);

const androidConfig = {
  packageName: exports.DEFAULT_VALUES.ANDROID_BUNDLE_ID,
  keyStorePath: "",
  sdkPath: "",
  ndkPath: "",
  androidInstant: false,
  remoteUrl: "",
  apiLevel: 27,
  appABIs: [],
  keystorePassword: "",
  keystoreAlias: "",
  keystoreAliasPassword: "",
  appBundle: false,
  orientation: {
    portrait: true,
    landscapeLeft: false,
    landscapeRight: false,
    upsideDown: false,
  },
};
class ConsoleParams {
  constructor() {
    this.quiet = false;
    this.portrait = false;
    this.platform = PLATFORM_ENUM.ANDROID;
    this.language = LANGUAGE.JS;
    this.projDir = "";
    this.buildDir = "";
    this.directory = "";
    this.enginePath = "";
    this.templatePath = "";
    this.templateName = "";
    this.cmakeGenerator = "";
    this.cmakePath = "";
    this.teamid = "";
    this.sharedDir = "";
    this.pluginName = PLUGIN_NAME_ENUM.NEW;
    this.projectName = "";
    this.debug = true;

    this.cMakeConfig = {
      CC_USE_GLES3: false,
      CC_USE_GLES2: true,
      USE_SERVER_MODE: "set(USE_SERVER_MODE OFF)",
      NET_MODE: "set(NET_MODE 0)",
      XXTEAKEY: "",
      CC_ENABLE_SWAPPY: false,
    };

    this.orientation = "";
    this.android = androidConfig;
    this["xr-huaweivr"] = androidConfig;
    this["xr-meta"] = androidConfig;
    this["xr-pico"] = androidConfig;
    this["xr-rokid"] = androidConfig;
    this["xr-monado"] = androidConfig;

    this.ios = {
      bundleId: exports.DEFAULT_VALUES.IOS_BUNDLE_ID,
      simulator: true,
      iphoneos: false,
      orientation: {
        portrait: true,
        landscapeLeft: false,
        landscapeRight: false,
        upsideDown: false,
      },
      skipUpdateXcodeProject: false,
    };

    this.mac = {
      bundleId: exports.DEFAULT_VALUES.MAC_BUNDLE_ID,
      skipUpdateXcodeProject: false,
    };

    this.win = { targetPlatform: "x64" };

    this.ohos = {
      packageName: exports.DEFAULT_VALUES.OHOS_BUNDLE_ID,
      orientation: {
        portrait: true,
        landscapeLeft: false,
        landscapeRight: false,
        upsideDown: false,
      },
      apiLevel: 5,
      sdkPath: "",
      ndkPath: "",
    };
  }
  toJSON() {
    const t = {};

    Object.keys(this).forEach((o) => {
      t[o] = this[o];
    });

    return t;
  }
}
exports.ConsoleParams = ConsoleParams;
