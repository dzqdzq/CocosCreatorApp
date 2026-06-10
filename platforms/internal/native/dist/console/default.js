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

((t) => {
  t.UNKNOWN = "unknown";
  t.IOS = "ios";
  t.MAC = "mac";
  t.WINDOWS = "windows";
  t.ANDROID = "android";
  t.OHOS = "ohos";
  t.LINUX = "linux";
  t.IOSSIMULATOR = "iossimulator";
  t["HUAWEI-AGC"] = "huawei-agc";
})((PLATFORM_ENUM = exports.PLATFORM_ENUM || (exports.PLATFORM_ENUM = {})));

LANGUAGE = exports.LANGUAGE || (exports.LANGUAGE = {});
LANGUAGE[(LANGUAGE.JS = 0)] = "JS";

((t) => {
  t.NEW = "New";
  t.COMPILE = "Compile";
  t.GENERATE = "Generate";
  t.RUN = "Run";
})(
  (PLUGIN_NAME_ENUM =
    exports.PLUGIN_NAME_ENUM || (exports.PLUGIN_NAME_ENUM = {}))
);

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
    };

    this.orientation = "";

    this.android = {
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

    this.win = { targetPlatform: "win32" };

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
    const e = {};

    Object.keys(this).forEach((t) => {
      e[t] = this[t];
    });

    return e;
  }
}
exports.ConsoleParams = ConsoleParams;
