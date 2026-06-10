var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (i, e, t, a = t) => {
        Object.defineProperty(i, a, {
          enumerable: true,
          get() {
            return e[t];
          },
        });
      }
    : (i, e, t, a) => {
        i[(a = a === undefined ? t : a)] = e[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (i, e) => {
        Object.defineProperty(i, "default", { enumerable: true, value: e });
      }
    : (i, e) => {
        i.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  ((i) => {
    if (i && i.__esModule) {
      return i;
    }
    var e = {};
    if (i != null) {
      for (var t in i) {
        if (t !== "default" && Object.prototype.hasOwnProperty.call(i, t)) {
          __createBinding(e, i, t);
        }
      }
    }
    __setModuleDefault(e, i);
    return e;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.CCPluginCOMPILE = undefined;
const cocosCli_1 = require("./cocosCli");
const path = __importStar(require("path"));
const cocosConfig_1 = require("./cocosConfig");
const fs = __importStar(require("fs-extra"));
const default_1 = require("./default");
const native_utils_1 = require("../builder/native-utils");
const PackageNewConfig = "cocos-project-template.json";
class CCPluginCOMPILE extends cocosCli_1.CCPlugin {
  depends() {
    return default_1.PLUGIN_NAME_ENUM.GENERATE;
  }
  init() {
    return true;
  }
  async run() {
    await this.compilePlatform(this.getPlatform());
    return true;
  }
  async compilePlatform(i) {
    var e = this.getCurrentPlatform();
    var t = cocosConfig_1.cocosConfig.availableTargetPlatforms[e];

    if (t) {
      if (!t.includes(i)) {
        console.error(`target platform "${i}" is not listed [${t.join(", ")}]`);
      } else if (i === default_1.PLATFORM_ENUM.MAC) {
        await this.compileMac();
      } else if (i === default_1.PLATFORM_ENUM.IOS) {
        await this.compileIos();
      } else if (i === default_1.PLATFORM_ENUM.WINDOWS) {
        await this.compileWindows();
      } else if (
        i === default_1.PLATFORM_ENUM.ANDROID ||
        i === default_1.PLATFORM_ENUM["HUAWEI-AGC"] ||
        i === default_1.PLATFORM_ENUM["XR-HUAWEIVR"] ||
        i === default_1.PLATFORM_ENUM["XR-META"] ||
        i === default_1.PLATFORM_ENUM["XR-PICO"] ||
        i === default_1.PLATFORM_ENUM["XR-ROKID"] ||
        i === default_1.PLATFORM_ENUM["XR-MONADO"]
      ) {
        await this.compileAndroid();
      } else if (i === default_1.PLATFORM_ENUM.OHOS) {
        await this.compileOHOS();
      }
    } else {
      console.error(`current host platform ${e} is not supported.`);
    }
  }
  async compileAndroid() {
    await new AndroidCompileCMD(this).compile();
  }
  async compileIos() {
    await new IOSCompileCMD(this).compile();
  }
  async compileMac() {
    await new MacCompileCMD(this).compile();
  }
  async compileWindows() {
    await new WindowsCompileCMD(this).compile();
  }
  async compileOHOS() {
    await new OHOSCompileCMD(this).compile();
  }
}
exports.CCPluginCOMPILE = CCPluginCOMPILE;
class PlatformCompileCmd {
  constructor(i) {
    this.plugin = i;
  }
}
class IOSCompileCMD extends PlatformCompileCmd {
  async compile() {
    if (this.plugin.args.ios.iphoneos && !this.plugin.getAppTeamId()) {
      throw new Error(
        "Error: Try to build iphoneos application but no developer team id was given!"
      );
    }
    var i = this.plugin.getBuildDir();
    var e = this.plugin.args.projectName;
    var t = require("os").cpus();
    var t = t && t[0] && t[0].model ? t[0].model : "";
    /Apple/.test(t);
    const a = new RegExp(e + ".xcworkspace$");
    t = fs.readdirSync(i).find((i) => a.test(i));

    if (t) {
      e =
        `-workspace ${i}/${t} -scheme ALL_BUILD ` +
        `-parallelizeTargets -quiet -configuration ${
          this.plugin.args.debug ? "Debug" : "Release"
        } ` +
        "-hideShellScriptEnvironment -allowProvisioningUpdates SYMROOT=" +
        i;

      this.plugin.args.ios.simulator &&
        (await this.plugin.runXcodeBuild([
          "-destination generic/platform='iOS Simulator'",
          e,
          "CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO",
        ]));

      this.plugin.args.ios.iphoneos &&
        (await this.plugin.runXcodeBuild([
          "-destination generic/platform='iOS'",
          e,
          "DEVELOPMENT_TEAM=" + this.plugin.args.teamid,
        ]));
    } else {
      t = `--build ${i} --config ${
        this.plugin.args.debug ? "Debug" : "Release"
      } -- -allowProvisioningUpdates -quiet`;

      this.plugin.args.ios.iphoneos &&
        (await this.plugin.runCmake([t, "-sdk", "iphoneos", "-arch arm64"]));

      this.plugin.args.ios.simulator &&
        (await this.plugin.runCmake([
          t,
          "-sdk",
          "iphonesimulator",
          "-arch x86_64",
        ]));
    }

    return true;
  }
}
class MacCompileCMD extends PlatformCompileCmd {
  async compile() {
    var i = this.plugin.getBuildDir();
    var e = this.plugin.isAppleSilicon() ? "-arch arm64" : "-arch x86_64";

    await this.plugin.runCmake([
      "--build",
      "" + i,
      "--config",
      this.plugin.args.debug ? "Debug" : "Release",
      "--",
      "-quiet",
      e,
    ]);

    return true;
  }
}
class WindowsCompileCMD extends PlatformCompileCmd {
  async compile() {
    var i = this.plugin.getBuildDir();

    await this.plugin.runCmake([
      "--build",
      `"${cocosCli_1.cchelper.fixPath(i)}"`,
      "--config",
      this.plugin.args.debug ? "Debug" : "Release",
      "--",
      "-verbosity:quiet",
    ]);

    return true;
  }
}
class AndroidCompileCMD extends PlatformCompileCmd {
  async compile() {
    native_utils_1.mergeAndroidPlatformConfig(this);
    this.plugin.getBuildDir();
    var i = path.join(this.plugin.projectDir, "proj");
    if (!fs.existsSync(i)) {
      console.error(`dir ${i} not exits`);
      return false;
    }
    let e = "gradlew";

    if (this.plugin.getCurrentPlatform() === default_1.PLATFORM_ENUM.WINDOWS) {
      e += ".bat";
    }

    e = path.join(i, e);
    let t = "";

    var a = this.plugin.args.debug ? "Debug" : "Release";
    t = this.plugin.args.projectName + ":assemble" + a;
    await cocosCli_1.cchelper.runCmd(e, [t], false, i);

    if (this.plugin.args.android.androidInstant) {
      t = "instantapp:assemble" + a;
      await cocosCli_1.cchelper.runCmd(e, [t], false, i);
    }

    if (this.plugin.args.android.appBundle) {
      t = this.plugin.args.android.androidInstant
        ? "bundle" + a
        : this.plugin.args.projectName + ":bundle" + a;

      await cocosCli_1.cchelper.runCmd(e, [t], false, i);
    }

    return this.copyToDist();
  }
  async copyToDist() {
    var i = this.plugin.args.debug ? "debug" : "release";
    var e = path.join(this.plugin.projectDir, "publish", i);
    fs.ensureDirSync(e);
    let t = this.plugin.args.projectName + `-${i}.apk`;

    let a = path.join(
      this.plugin.projectDir,
      `proj/build/${this.plugin.args.projectName}/outputs/apk/${i}/` + t
    );

    if (!fs.existsSync(a)) {
      console.error("apk not found at ", a);
      return false;
    }
    fs.copyFileSync(a, path.join(e, t));

    if (this.plugin.args.android.androidInstant) {
      t = `instantapp-${i}.apk`;

      a = path.join(
        this.plugin.projectDir,
        `proj/build/instantapp/outputs/apk/${i}/` + t
      );

      if (!fs.existsSync(a)) {
        console.error("instant apk not found at ", a);
        return false;
      }

      fs.copyFileSync(a, path.join(e, t));
    }

    if (this.plugin.args.android.appBundle) {
      t = this.plugin.args.projectName + `-${i}.aab`;

      a = path.join(
        this.plugin.projectDir,
        `proj/build/${this.plugin.args.projectName}/outputs/bundle/${i}/` + t
      );

      if (!fs.existsSync(a)) {
        console.error("instant apk not found at ", a);
        return false;
      }

      fs.copyFileSync(a, path.join(e, t));
    }
    return true;
  }
}
class OHOSCompileCMD extends PlatformCompileCmd {
  async compile() {
    cocosCli_1.cchelper.checkJavaHome();
    var i = this.plugin.platformTemplatePath;
    let e = "gradlew";

    if (this.plugin.getCurrentPlatform() === default_1.PLATFORM_ENUM.WINDOWS) {
      e += ".bat";
    }

    e = path.join(i, e);
    try {
      fs.accessSync(e, fs.constants.X_OK);
    } catch (i) {
      fs.chmodSync(e, 508);
    }
    var t = "assemble" + (this.plugin.args.debug ? "Debug" : "Release");
    await cocosCli_1.cchelper.runCmd(e, [t], false, i);
    return true;
  }
}
