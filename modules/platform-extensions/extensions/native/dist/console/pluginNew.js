var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return t[a];
          },
        });
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
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
      for (var a in e) {
        if (a !== "default" && Object.prototype.hasOwnProperty.call(e, a)) {
          __createBinding(t, e, a);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateCreator = undefined;
exports.CCPluginNEW = undefined;
const cocosCli_1 = require("./cocosCli");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const cocosConfig_1 = require("./cocosConfig");
const afs_1 = require("./afs");
const default_1 = require("./default");
const URL = __importStar(require("url"));
const native_utils_1 = require("../builder/native-utils");
const fs_extra_1 = require("fs-extra");
const android_platform_1 = require("../android-platform");
const PackageNewConfig = "cocos-project-template.json";
const projectCONFIG = {
  projectType: "js",
  hasNative: true,
  customStepScript: null,
};
const COCOS2D_FILES_PATH = "templates/cocos2dx_files.json";
class CCPluginNEW extends cocosCli_1.CCPlugin {
  depends() {
    return null;
  }
  init() {
    this.setEnv("PROJECT_NAME", this.projectName);

    this.setEnv(
      "COMMON_DIR",
      cocosCli_1.cchelper.join(this.sharedDir, this.commonDir)
    );

    this.setEnv(
      "NATIVE_DIR",
      cocosCli_1.cchelper.join(this.sharedDir, this.platformTemplateDirName)
    );

    if (this.projectDir && !fs.existsSync(this.projectDir)) {
      cocosCli_1.cchelper.makeDirectoryRecursive(this.projectDir);
    }

    return true;
  }
  get commonDir() {
    return "common";
  }
  async run() {
    await new TemplateCreator(this).run();
    return true;
  }
  getEnginePath() {
    return this.args.enginePath;
  }
  doListTemplates() {
    console.log("templates:");
    for (const e of this.getTemplatesDirNames()) {
      console.log(` - ${e}/`);
    }
  }
  get projectName() {
    return this.args.projectName;
  }
  get projectDir() {
    return this.args.directory;
  }
  get sharedDir() {
    return path.join(Editor.Project.path, "native", "engine");
  }
  get enginePath() {
    return this.args.enginePath;
  }
}
exports.CCPluginNEW = CCPluginNEW;
class TemplateCreator {
  constructor(e) {
    this.excludes = [];
    var t = (this.plugin = e).args;
    var a = e.getTemplatesRootPath();
    this.lang = t.language;
    this.cocosRoot = e.getCocosRoot();
    this.projectName = t.projectName;
    this.projectDir = e.projectDir;
    this.tpName = t.templateName;
    this.enginePath = t.enginePath;
    this.tpDir = a;
    native_utils_1.mergeAndroidPlatformConfig(this);

    if (!cocosConfig_1.cocosConfig.supportTemplates.includes(this.tpName)) {
      console.error(`template name "${this.tpName}" is not supported!`);
    }

    if (fs.existsSync(cocosCli_1.cchelper.join(this.tpDir, PackageNewConfig))) {
      this.templateInfo = JSON.parse(
        fs
          .readFileSync(cocosCli_1.cchelper.join(this.tpDir, PackageNewConfig))
          .toString("utf8")
      );
    } else {
      console.error(`can not find ${PackageNewConfig} in ` + this.tpDir);
    }
  }
  get packageName() {
    var e = this.plugin.getPlatform();
    return e === default_1.PLATFORM_ENUM.ANDROID
      ? this.plugin.args.android.packageName
      : e === default_1.PLATFORM_ENUM["XR-HUAWEIVR"]
      ? this.plugin.args["xr-huaweivr"].packageName
      : e === default_1.PLATFORM_ENUM["XR-META"]
      ? this.plugin.args["xr-meta"].packageName
      : e === default_1.PLATFORM_ENUM["XR-PICO"]
      ? this.plugin.args["xr-pico"].packageName
      : e === default_1.PLATFORM_ENUM["XR-ROKID"]
      ? this.plugin.args["xr-rokid"].packageName
      : e === default_1.PLATFORM_ENUM["XR-MONADO"]
      ? this.plugin.args["xr-monado"].packageName
      : e == default_1.PLATFORM_ENUM.OHOS
      ? this.plugin.args.ohos.packageName
      : e === default_1.PLATFORM_ENUM.IOS
      ? this.plugin.args.ios.bundleId
      : undefined;
  }
  async doPostSteps() {
    await this.setOrientation();
    var e = this.plugin.getPlatform();

    if (
      e === default_1.PLATFORM_ENUM.ANDROID ||
      e === default_1.PLATFORM_ENUM["HUAWEI-AGC"] ||
      e === default_1.PLATFORM_ENUM["XR-HUAWEIVR"] ||
      e === default_1.PLATFORM_ENUM["XR-META"] ||
      e === default_1.PLATFORM_ENUM["XR-PICO"] ||
      e === default_1.PLATFORM_ENUM["XR-ROKID"] ||
      e === default_1.PLATFORM_ENUM["XR-MONADO"]
    ) {
      await this.updateAndroidGradleValues();
      await this.configAndroidInstant();
    }
  }
  async configAndroidInstant() {
    if (this.plugin.args.android.androidInstant) {
      var e = this.plugin.args.android.remoteUrl;
      if (e) {
        var t = cocosCli_1.cchelper.join(
          this.plugin.platformTemplatePath,
          "instantapp/AndroidManifest.xml"
        );
        if (fs.existsSync(t)) {
          const a = URL.parse(e);
          if (a.host) {
            let e = fs.readFileSync(t, "utf8");

            e = e.replace(
              /<category\s*android:name="android.intent.category.DEFAULT"\s*\/>/,
              (e) => {
                var t =
                  '<category android:name="android.intent.category.DEFAULT" />';
                return (t +=
                  `
                <data android:host="${a.host}" android:pathPattern="${a.path}" android:scheme="https"/>` +
                  `
                <data android:scheme="http"/>`);
              }
            );

            fs.writeFileSync(t, e, "utf8");
          } else {
            console.error(`parse url ${e} fail`);
          }
        } else {
          console.error(t + " not found");
        }
      }
    } else {
      console.log("android instant not configured");
    }
  }
  async run() {
    let t = this.plugin.args.platform;
    if (t === "linux") {
      fs.copySync(
        path.join(this.tpDir, t, "CMakeLists.txt"),
        path.join(this.plugin.projectDir, "proj", "CMakeLists.txt")
      );
    } else {
      var a = path.join(this.plugin.nativeTemplateDir, this.plugin.commonDir);
      fs.copySync(path.join(this.tpDir, "common"), a, { overwrite: false });

      if (t === default_1.PLATFORM_ENUM["HUAWEI-AGC"]) {
        t = default_1.PLATFORM_ENUM.ANDROID;
      }

      let e = this.plugin.sourceTemplatePath;

      if (
        t === default_1.PLATFORM_ENUM.ANDROID ||
        t === default_1.PLATFORM_ENUM["XR-HUAWEIVR"] ||
        t === default_1.PLATFORM_ENUM["XR-META"] ||
        t === default_1.PLATFORM_ENUM["XR-PICO"] ||
        t === default_1.PLATFORM_ENUM["XR-ROKID"] ||
        t === default_1.PLATFORM_ENUM["XR-MONADO"]
      ) {
        e = path.join(this.tpDir, t, "template");
        a = path.join(this.projectDir, "proj");
        fs.copySync(path.join(this.tpDir, t, "build"), a, { overwrite: false });
      }

      if (t && !fs.existsSync(this.plugin.platformTemplatePath)) {
        fs.copySync(e, this.plugin.platformTemplatePath, { overwrite: false });
      }

      for (const r in this.templateInfo) {
        await this.execute(this.templateInfo[r]);
      }
      await this.doPostSteps();
    }
    this.generateCMakeConfig();
  }
  generateCMakeConfig() {
    var e = path.join(this.plugin.projectDir, "proj", "cfg.cmake");
    let t = "";
    const a = this.plugin.args.cMakeConfig;

    Object.keys(a).forEach((e) => {
      if (typeof a[e] == "boolean") {
        a[e] = `set(${e} ${a[e] ? "ON" : "OFF"})`;
      }
    });

    Object.keys(a).forEach((e) => {
      t += a[e] + "\n";
    });

    console.debug("generateCMakeConfig, " + JSON.stringify(a));
    fs.outputFileSync(e, t);
  }
  async setOrientation() {
    const e = this.plugin.args;
    if (
      (e.platform === default_1.PLATFORM_ENUM.IOS ||
        e.platform === default_1.PLATFORM_ENUM.IOSSIMULATOR) &&
      e.ios
    ) {
      var r = e.ios.orientation;

      var i = cocosCli_1.cchelper.join(
        this.plugin.platformTemplatePath,
        "Info.plist"
      );

      if (fs.existsSync(i)) {
        var o = [];

        if (r.landscapeRight) {
          o.push("UIInterfaceOrientationLandscapeRight");
        }

        if (r.landscapeLeft) {
          o.push("UIInterfaceOrientationLandscapeLeft");
        }

        if (r.portrait) {
          o.push("UIInterfaceOrientationPortrait");
        }

        if (r.upsideDown) {
          o.push("UIInterfaceOrientationPortraitUpsideDown");
        }

        var s = `	<key>UISupportedInterfaceOrientations</key>
<array>
${o
  .map(
    (e) => `		<string>${e}</string>
`
  )
  .join("")}
</array>`;

        var n = [];
        var c = fs.readFileSync(i).toString("utf-8").split("\n");
        let t = 0;
        let a = 0;
        for (let e = 0; e < c.length; e++) {
          if (c[e].includes("UISupportedInterfaceOrientations")) {
            t += 1;
            e++;

            while (e < c.length && !c[e].includes("</array>")) {
              e++;
            }

            if (c[e].includes("</array>")) {
              a += 1;
            }

            n.push(s);
          } else {
            n.push(c[e]);
          }
        }

        if (t !== 1 || a !== 1) {
          console.error("error occurs while setting orientations for iOS");
        } else {
          await afs_1.afs.writeFile(i, n.join("\n"));
        }
      }
    }
    android_platform_1.androidsPlatform.forEach(async (r) => {
      if (e.platform === r && e[r]) {
        var r = e[r].orientation;

        var i = cocosCli_1.cchelper.join(
          this.plugin.platformTemplatePath,
          "app/AndroidManifest.xml"
        );

        var o = cocosCli_1.cchelper.join(
          this.plugin.platformTemplatePath,
          "instantapp/AndroidManifest.xml"
        );

        if (fs.existsSync(i) && fs.existsSync(o)) {
          var s = /android:screenOrientation="[^"]*"/;
          let e = 'android:screenOrientation="unspecified"';

          if (
            r.landscapeRight &&
            r.landscapeLeft &&
            r.portrait &&
            r.upsideDown
          ) {
            e = 'android:screenOrientation="fullSensor"';
          } else if (r.landscapeRight && !r.landscapeLeft) {
            e = 'android:screenOrientation="landscape"';
          } else if (!r.landscapeRight && r.landscapeLeft) {
            e = 'android:screenOrientation="reverseLandscape"';
          } else if (r.landscapeRight && r.landscapeLeft) {
            e = 'android:screenOrientation="sensorLandscape"';
          } else if (r.portrait && !r.upsideDown) {
            e = 'android:screenOrientation="portrait"';
          } else if (!r.portrait && r.upsideDown) {
            e = 'android:screenOrientation="reversePortrait"';
          } else if (r.portrait && r.upsideDown) {
            e = 'android:screenOrientation="sensorPortrait"';
          }

          let t = await afs_1.afs.readFile(i, "utf8");
          t = t.replace(s, e);
          let a = await afs_1.afs.readFile(o, "utf8");
          a = a.replace(s, e);
          await afs_1.afs.writeFile(i, t);
          await afs_1.afs.writeFile(o, a);
        }
      }
    });
  }
  parseVersion(e, t, a) {
    var t = new RegExp(t + "=(.*)");
    var e = e.match(t);
    return !e || ((t = Number.parseInt(e[1], 10)), Number.isNaN(t)) ? a : t;
  }
  async updateAndroidGradleValues() {
    var r = this.plugin.args;
    if (r) {
      console.log("update settings.properties");

      await cocosCli_1.cchelper.replaceInFile(
        [
          {
            reg: "^rootProject\\.name.*",
            text: `rootProject.name = "${r.projectName}"`,
          },
        ],
        path.join(this.projectDir, "proj/settings.gradle")
      );

      console.log("update gradle.properties");
      var i = cocosCli_1.cchelper.join(
        this.projectDir,
        "proj/gradle.properties"
      );
      if (fs.existsSync(i)) {
        let e = r.android.keyStorePath;

        if (
          this.plugin.getCurrentPlatform() === default_1.PLATFORM_ENUM.WINDOWS
        ) {
          e = cocosCli_1.cchelper.fixPath(e);
        }

        let t = r.android.apiLevel;
        t = t || 27;
        console.log("AndroidAPI level " + t);
        let a = fs.readFileSync(i, "utf-8");

        a = e
          ? (a = (a = (a = a.replace(
              /.*RELEASE_STORE_FILE=.*/,
              "RELEASE_STORE_FILE=" + e
            )).replace(
              /.*RELEASE_STORE_PASSWORD=.*/,
              "RELEASE_STORE_PASSWORD=" + r.android.keystorePassword
            )).replace(
              /.*RELEASE_KEY_ALIAS=.*/,
              "RELEASE_KEY_ALIAS=" + r.android.keystoreAlias
            )).replace(
              /.*RELEASE_KEY_PASSWORD=.*/,
              "RELEASE_KEY_PASSWORD=" + r.android.keystoreAliasPassword
            )
          : (a = (a = (a = a.replace(
              /.*RELEASE_STORE_FILE=.*/,
              "# RELEASE_STORE_FILE=" + e
            )).replace(
              /.*RELEASE_STORE_PASSWORD=.*/,
              "# RELEASE_STORE_PASSWORD=" + r.android.keystorePassword
            )).replace(
              /.*RELEASE_KEY_ALIAS=.*/,
              "# RELEASE_KEY_ALIAS=" + r.android.keystoreAlias
            )).replace(
              /.*RELEASE_KEY_PASSWORD=.*/,
              "# RELEASE_KEY_PASSWORD=" + r.android.keystoreAliasPassword
            );
        var o = this.parseVersion(a, "PROP_COMPILE_SDK_VERSION", 27);
        var s = this.parseVersion(a, "PROP_MIN_SDK_VERSION", 21);

        var o =
          ((a = (a = (a = (a = (a = (a = (a = (a = (a = a.replace(
            /PROP_TARGET_SDK_VERSION=.*/,
            "PROP_TARGET_SDK_VERSION=" + t
          )).replace(
            /PROP_COMPILE_SDK_VERSION=.*/,
            "PROP_COMPILE_SDK_VERSION=" + Math.max(t, o, 27)
          )).replace(
            /PROP_MIN_SDK_VERSION=.*/,
            "PROP_MIN_SDK_VERSION=" + Math.min(t, s)
          )).replace(
            /PROP_APP_NAME=.*/,
            "PROP_APP_NAME=" + r.projectName
          )).replace(
            /PROP_ENABLE_INSTANT_APP=.*/,
            "PROP_ENABLE_INSTANT_APP=" +
              (this.plugin.args.android.androidInstant ? "true" : "false")
          )).replace(
            /RES_PATH=.*/,
            "RES_PATH=" + cocosCli_1.cchelper.fixPath(this.projectDir)
          )).replace(
            /COCOS_ENGINE_PATH=.*/,
            "COCOS_ENGINE_PATH=" +
              cocosCli_1.cchelper.fixPath(this.plugin.getEnginePath())
          )).replace(
            /APPLICATION_ID=.*/,
            "APPLICATION_ID=" + this.plugin.args.android.packageName
          )).replace(
            /NATIVE_DIR=.*/,
            "NATIVE_DIR=" +
              cocosCli_1.cchelper.fixPath(this.plugin.getEnv("NATIVE_DIR"))
          )),
          process.platform === "win32" &&
            (r.android.ndkPath = r.android.ndkPath.replace(/\\/g, "\\\\")),
          (a = a.replace(
            /PROP_NDK_PATH=.*/,
            "PROP_NDK_PATH=" + r.android.ndkPath
          )),
          r.android.appABIs && r.android.appABIs.length > 0
            ? r.android.appABIs.join(":")
            : "armeabi-v7a");

        a = a.replace(/PROP_APP_ABI=.*/g, "PROP_APP_ABI=" + o);
        fs.writeFileSync(i, a);
        a = "";
        a += "sdk.dir=" + r.android.sdkPath;

        if (process.platform === "win32") {
          a = (a = a.replace(/\\/g, "\\\\")).replace(/:/g, "\\:");
        }

        fs.writeFileSync(
          cocosCli_1.cchelper.join(path.dirname(i), "local.properties"),
          a
        );
      } else {
        console.log(`warning: ${i} not found!`);
      }
    }
  }
  get cocos2dxFiles() {
    return fs.readJSONSync(path.join(this.enginePath, COCOS2D_FILES_PATH));
  }
  async execute(e) {
    var t;
    var a = this.plugin.args.platform;
    const r = this.plugin.args;

    if (e.appendFile) {
      e.appendFile.forEach((e) => {
        var t = cocosCli_1.cchelper.replaceEnvVariables(e.to);
        fs.ensureDirSync(path.dirname(t));
        fs.copySync(path.join(this.cocosRoot, e.from), t);
      });

      delete e.appendFile;
    }

    const i = {};
    if (e.projectReplaceProjectName) {
      const e_projectReplaceProjectName = e.projectReplaceProjectName;

      e_projectReplaceProjectName.files.forEach((e) => {
        e = cocosCli_1.cchelper.join(this.projectDir, e);
        i[e] = i[e] || [];
        i[e].push({
          reg: e_projectReplaceProjectName.srcProjectName,
          content: this.projectName,
        });
      });

      delete e.projectReplaceProjectName;
    }
    if (e.projectReplacePackageName) {
      var e_projectReplacePackageName = e.projectReplacePackageName;
      const f = e_projectReplacePackageName.srcPackageName.replace(
        /\./g,
        "\\."
      );

      e_projectReplacePackageName.files.forEach((e) => {
        e = cocosCli_1.cchelper.join(this.projectDir, e);
        i[e] = i[e] || [];
        i[e].push({ reg: f, content: this.packageName });
      });

      delete e.projectReplacePackageName;
    }
    for (const u in i) {
      const r = i[u];
      await cocosCli_1.cchelper.replaceInFile(
        r.map((e) => ({
          reg: e.reg,
          text: e.content,
        })),
        u
      );
    }
    if (Object.keys(e).length > 0) {
      for (const g in e) {
        console.error(`command "${g}" is not parsed in ` + PackageNewConfig);
      }
    }
    if (a === default_1.PLATFORM_ENUM.OHOS) {
      e_projectReplacePackageName = this.plugin.platformTemplatePath;
      e = path.normalize(this.cocosRoot);
      if (!fs.existsSync(r.ohos.sdkPath)) {
        throw new Error(`Directory hwsdk.dir ${r.ohos.sdkPath} not exists`);
      }
      if (!fs.existsSync(r.ohos.ndkPath)) {
        throw new Error(`Directory native.dir ${r.ohos.ndkPath} not exists`);
      }

      await cocosCli_1.cchelper.replaceInFile(
        [
          {
            reg: "^hwsdk\\.dir.*",
            text: "hwsdk.dir=" + cocosCli_1.cchelper.fixPath(r.ohos.sdkPath),
          },
          {
            reg: "^native\\.dir.*",
            text: "native.dir=" + cocosCli_1.cchelper.fixPath(r.ohos.ndkPath),
          },
        ],
        path.join(e_projectReplacePackageName, "local.properties")
      );

      await cocosCli_1.cchelper.replaceInFile(
        [
          {
            reg: "\\$\\{ENGINE_ROOT\\}",
            text: cocosCli_1.cchelper.fixPath(e),
          },
          {
            reg: "^rootProject\\.name.*",
            text: `rootProject.name = "${r.projectName}"`,
          },
        ],
        path.join(e_projectReplacePackageName, "settings.gradle")
      );

      await cocosCli_1.cchelper.replaceInFile(
        [
          {
            reg: "^RES_PATH.*",
            text: "RES_PATH=" + cocosCli_1.cchelper.fixPath(this.projectDir),
          },
          {
            reg: "^ENGINE_ROOT.*",
            text: "ENGINE_ROOT=" + cocosCli_1.cchelper.fixPath(e),
          },
          {
            reg: "^COMMON_DIR.*",
            text:
              "COMMON_DIR=" +
              cocosCli_1.cchelper.fixPath(process.env.COMMON_DIR || ""),
          },
        ],
        path.join(e_projectReplacePackageName, "gradle.properties")
      );

      try {
        var s = path.join(
          e_projectReplacePackageName,
          "entry/src/main/config.json"
        );
        var n = JSON.parse(await afs_1.afs.readFile(s, "utf8"));
        var c = null == (t = n.module) ? undefined : t.abilities;
        if (0 < (c == null ? undefined : c.length)) {
          var l = r.ohos.orientation;
          let t = "landscape";

          t =
            l.portrait && (l.landscapeRight || l.landscapeLeft)
              ? "unspecified"
              : !l.portrait || l.landscapeLeft || l.landscapeRight
              ? l.landscapeLeft || l.landscapeRight
                ? "landscape"
                : "unspecified"
              : "portrait";

          c.forEach((e) => {
            e.orientation = t;
          });
        }
        n.app.bundleName = r.ohos.packageName;
        fs_extra_1.outputJSONSync(s, n, { spaces: 2 });
      } catch (e) {
        console.error(e);
      }
      try {
        var p = path.join(
          e_projectReplacePackageName,
          "entry/src/main/resources/base/element/string.json"
        );

        var d = JSON.parse(await afs_1.afs.readFile(p, "utf8"));
        var h = (d.string = d.string || []);
        let e = h.find((e) => e.name === "app_name");

        if (!e) {
          e = { name: "app_name", value: "CocosGame" };
          h.push(e);
        }

        e.value = r.projectName || "CocosGame";
        fs_extra_1.outputJSONSync(p, d, { spaces: 2 });
      } catch (e) {
        console.error(e);
      }
    }
  }
}
exports.TemplateCreator = TemplateCreator;
