var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return t[i];
          },
        });
      }
    : (e, t, i, r) => {
        e[(r = r === undefined ? i : r)] = t[i];
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
exports.CCPluginGENERATE = undefined;
const cocosCli_1 = require("./cocosCli");
const os = __importStar(require("os"));
const cocosConfig_1 = require("./cocosConfig");
const childProcess = __importStar(require("child_process"));
const afs_1 = require("./afs");
const default_1 = require("./default");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const PackageNewConfig = "cocos-project-template.json";
class CCPluginGENERATE extends cocosCli_1.CCPlugin {
  depends() {
    return null;
  }
  init() {
    if (!cocosConfig_1.cocosConfig.platforms.includes(this.getPlatform())) {
      console.error(`invalidate platform "${this.getPlatform()}"`);
    }

    return true;
  }
  async run() {
    var e = this.parser.platform;
    if (e) {
      await this.generatePlatform(e);
    } else {
      for (const t of cocosConfig_1.cocosConfig.defaultGeneratePlatforms[
        this.getCurrentPlatform()
      ]) {
        await this.generatePlatform(t);
      }
    }
    return true;
  }
  async generatePlatform(e) {
    var t = this.getCurrentPlatform();

    if (e === default_1.PLATFORM_ENUM.IOSSIMULATOR) {
      e = default_1.PLATFORM_ENUM.IOS;
      this.setPlatform(default_1.PLATFORM_ENUM.IOS);
      this.extendArgv(["--ios-simulator"]);
      this.args.ios.simulator = true;
    }

    var i = cocosConfig_1.cocosConfig.availableTargetPlatforms[t];

    if (i) {
      if (!i.includes(e)) {
        console.error(`target platform "${e}" is not listed [${i.join(", ")}]`);
      } else if (e === default_1.PLATFORM_ENUM.MAC) {
        await this.generateMac();
      } else if (e === default_1.PLATFORM_ENUM.IOS) {
        await this.generateIos();
      } else if (e === default_1.PLATFORM_ENUM.WINDOWS) {
        await this.generateWindows();
      } else if (
        e === default_1.PLATFORM_ENUM.ANDROID ||
        e === default_1.PLATFORM_ENUM["HUAWEI-AGC"]
      ) {
        await this.generateAndroid();
      }
    } else {
      console.error(`current host platform ${t} is not supported.`);
    }
  }
  async generateAndroid() {
    console.log("generate android");
  }
  async generateIos() {
    await new IOSGenerateCMD(this).generate();
  }
  async generateMac() {
    await new MacGenerateCMD(this).generate();
  }
  async generateWindows() {
    await new WindowsGenerateCMD(this).generate();
  }
}
exports.CCPluginGENERATE = CCPluginGENERATE;
class PlatformGenerateCmd {
  constructor(e) {
    this.plugin = e;
  }
  get projectSrcDir() {
    return path.join(
      this.plugin.projectDir,
      "..",
      "common-" + this.plugin.args.templateName
    );
  }
  appendCmakeResDirArgs(e) {
    e.push(
      `-DRES_DIR="${cocosCli_1.cchelper.fixPath(this.plugin.projectDir)}"`
    );
  }
  async xcodeDestroyZEROCHECK() {
    const t = this.plugin.getBuildDir();
    var e = require("../../static/xcode");

    var i = fs
      .readdirSync(t)
      .filter((e) => e.endsWith(".xcodeproj"))
      .map((e) => path.join(t, e));

    if (i.length === 0) {
      console.error("can not find xcode project file in " + t);
    } else {
      try {
        for (const c of i) {
          var r = path.join(c, "project.pbxproj");
          console.log("parsing pbxfile " + r);
          const l = e.project(r);

          await new Promise((t, i) => {
            l.parse((e) => {
              if (e) {
                return i(e);
              }
              t(l);
            });
          });

          console.log("  modifiy Xcode project file " + r);
          {
            const p = path.join(this.plugin.projectDir, "assets");
            const u = l.hash.project.objects;
            const f = "Resources";

            const [d] = Object.entries(u.PBXGroup).find(
              ([, e]) => e.name === f
            );

            fs.readdirSync(p, { encoding: "utf8" })
              .filter((e) => e !== "." && e !== "..")
              .forEach((e) => {
                var t = path.normalize(path.join(p, e));
                var i = {};

                var i =
                  (fs.statSync(t).isDirectory() &&
                    (i.lastKnownFileType = "folder"),
                  l.addFile(t, d, i));

                var i = {
                  fileRef: i.fileRef,
                  uuid: l.generateUuid(),
                  isa: "PBXBuildFile",
                  basename: "" + e,
                  group: f,
                };

                var [e] =
                  (l.addToPbxBuildFileSection(i),
                  Object.entries(u.PBXResourcesBuildPhase).find(
                    ([e, t]) => e.endsWith("_comment") && t === f
                  ));

                var e = e.split("_comment")[0];
                u.PBXResourcesBuildPhase[e].files.push({
                  value: i.uuid,
                  comment: t,
                });
              });
          }
          var a = l.hash.project.objects.PBXShellScriptBuildPhase;
          var o = Object.keys(a);
          var s = [];
          for (const h of o) {
            var n = a[h];

            if (n.name && n.name.indexOf("ZERO_CHECK") > 0) {
              s.push(n);
            }
          }

          s.forEach((e) => (e.shellScript = `"echo 'Skip Xcode Update'"`));

          fs.writeFileSync(r, l.writeSync());
          console.log(`  replace pbxfile: ${r}.`);
        }
      } catch (e) {
        console.error("disable ZERO_CHECK, failed to update xcode.");
        console.error(e);
      }
    }
  }
}
class IOSGenerateCMD extends PlatformGenerateCmd {
  async generate() {
    var e = this.plugin.getBuildDir();
    if (
      this.plugin.args.ios.skipUpdateXcodeProject &&
      fs.existsSync(path.join(e, "CMakeCache.txt"))
    ) {
      console.log("Skip xcode project update");
    } else {
      var t = path.join(this.plugin.platformTemplatePath, "CMakeLists.txt");
      if (!fs.existsSync(t)) {
        throw new Error("CMakeLists.txt not found in " + t);
      }

      if (!fs.existsSync(e)) {
        cocosCli_1.cchelper.makeDirectoryRecursive(e);
      }

      var t = ["-DCMAKE_CXX_COMPILER=clang++", "-DCMAKE_C_COMPILER=clang"];

      this.appendCmakeResDirArgs(t);
      var i = this.plugin.getXcodeMajorVerion() >= 12 ? "12" : "1";

      await this.plugin.runCmake(
        [
          "-S",
          "" + this.plugin.platformTemplatePath,
          "-GXcode",
          "-B" + e,
          "-T",
          "buildsystem=" + i,
          "-DCMAKE_SYSTEM_NAME=iOS",
        ].concat(t)
      );

      if (this.plugin.args.ios.skipUpdateXcodeProject) {
        await this.xcodeDestroyZEROCHECK();
      }
    }
    return true;
  }
}
class MacGenerateCMD extends PlatformGenerateCmd {
  async generate() {
    var e = this.plugin.getBuildDir();
    if (
      this.plugin.args.mac.skipUpdateXcodeProject &&
      fs.existsSync(path.join(e, "CMakeCache.txt"))
    ) {
      console.log("Skip xcode project update");
    } else {
      var t = path.join(this.plugin.platformTemplatePath, "CMakeLists.txt");
      if (!fs.existsSync(t)) {
        throw new Error("CMakeLists.txt not found in " + t);
      }

      if (!fs.existsSync(e)) {
        cocosCli_1.cchelper.makeDirectoryRecursive(e);
      }

      t = this.plugin.getXcodeMajorVerion() >= 12 ? "12" : "1";

      t = [
        "-S",
        "" + this.plugin.platformTemplatePath,
        "-GXcode",
        "-T",
        "buildsystem=" + t,
        "-B" + e,
        "-DCMAKE_SYSTEM_NAME=Darwin",
      ];

      this.appendCmakeResDirArgs(t);
      await this.plugin.runCmake(t);

      if (this.plugin.args.mac.skipUpdateXcodeProject) {
        await this.xcodeDestroyZEROCHECK();
      }
    }
    return true;
  }
}
class WindowsGenerateCMD extends PlatformGenerateCmd {
  async windowsSelectCmakeGeneratorArgs() {
    console.log("selecting visual studio generator ...");
    var e = cocosConfig_1.cocosConfig.cmake.windows.generators;
    var t = await afs_1.afs.mkdtemp(path.join(os.tmpdir(), "cmakeTest_"));
    var i = path.join(t, "CMakeLists.txt");
    var r = path.join(t, "test.cpp");

    await afs_1.afs.writeFile(
      i,
      `
          cmake_minimum_required(VERSION 3.8)
          set(APP_NAME test-cmake)
          project(\${APP_NAME} CXX)
          add_library(\${APP_NAME} test.cpp)
          `
    );

    await afs_1.afs.writeFile(
      r,
      `
        #include<iostream>
        int main(int argc, char **argv)
        {
            std::cout << "Hello World" << std::endl;
            return 0;
        }
        `
    );

    var a = (t, r) =>
      new Promise((i, e) => {
        childProcess
          .spawn(this.plugin.getCmakePath(), t, {
            cwd: r,
            env: process.env,
            shell: true,
          })
          .on("close", (e, t) => {
            i(e === 0);
          });
      });

    const o = [];
    for (const c of e) {
      var s = path.join(t, "build_" + c.G.replace(/ /g, "_"));
      var n = [`-S"${t}"`, `-G"${c.G}"`, `-B"${s}"`];
      n.push("-A", this.plugin.args.win.targetPlatform);
      await afs_1.afs.mkdir(s);

      if (await a(n, s)) {
        o.push(c.G);
        break;
      }

      await cocosCli_1.cchelper.removeDirectoryRecursive(s);
    }
    await cocosCli_1.cchelper.removeDirectoryRecursive(t);
    i = [];
    return o.length === 0
      ? []
      : ((r = e.filter((e) => e.G === o[0])[0]),
        i.push("-A", this.plugin.args.win.targetPlatform),
        console.log(" using " + r.G),
        i);
  }
  async generate() {
    var e = this.plugin.getBuildDir();
    var t = path.join(this.plugin.platformTemplatePath, "CMakeLists.txt");
    if (!fs.existsSync(t)) {
      throw new Error("CMakeLists.txt not found in " + t);
    }

    if (!fs.existsSync(e)) {
      cocosCli_1.cchelper.makeDirectoryRecursive(e);
    }

    let i = [];
    if (!fs.existsSync(path.join(e, "CMakeCache.txt"))) {
      const r = this.plugin.getCmakeGenerator();

      if (r) {
        if (
          (t = cocosConfig_1.cocosConfig.cmake.windows.generators.filter(
            (e) => e.G.toLowerCase() === r.toLowerCase()
          )).length === 0
        ) {
          i.push(`-G"${r}"`);
        } else {
          t[0];
          i.push("-A", this.plugin.args.win.targetPlatform);
        }
      } else {
        i = i.concat(await this.windowsSelectCmakeGeneratorArgs());
      }

      this.appendCmakeResDirArgs(i);
    }

    await this.plugin.runCmake(
      [
        `-S"${cocosCli_1.cchelper.fixPath(this.plugin.platformTemplatePath)}"`,
        `-B"${cocosCli_1.cchelper.fixPath(e)}"`,
      ].concat(i)
    );

    return true;
  }
}
