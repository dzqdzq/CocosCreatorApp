Object.defineProperty(exports, "__esModule", { value: true });

exports.verificationFunc = undefined;
exports.compareVersion = undefined;
exports.checkTargetVersion = undefined;
exports.findSignIdentify = undefined;
exports.renameXcodeResource = undefined;
exports.updateXcodeproject = undefined;
exports.modifyPackageName = undefined;
exports.checkPackageNameValidity = undefined;
exports.changePackageName = undefined;
exports.updateOrientation = undefined;

const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const plist = require("plist");
const child_process_1 = require("child_process");
async function updateOrientation(e, a) {
  var t;
  var r;
  var i;

  if (
    a &&
    ((e = path_1.join(e, "frameworks/runtime-src/proj.ios_mac/ios/Info.plist")),
    fs_extra_1.existsSync(e))
  ) {
    t = await fs_extra_1.readFile(e, "utf8");
    r = plist.parse(t);
    i = [];
    a.landscapeRight && i.push("UIInterfaceOrientationLandscapeRight");
    a.landscapeLeft && i.push("UIInterfaceOrientationLandscapeLeft");
    a.portrait && i.push("UIInterfaceOrientationPortrait");
    a.upsideDown && i.push("UIInterfaceOrientationPortraitUpsideDown");
    r.UISupportedInterfaceOrientations = i;
    t = plist.build(r);
    await fs_extra_1.writeFile(e, t);
  }
}
async function changePackageName(e, t) {
  var r = path_1.join(e, ".cocos-project.json");
  if (fs_extra_1.existsSync(r)) {
    var i = await fs_extra_1.readJSON(r);
    if (checkPackageNameValidity((t = t || i.packageName))) {
      let i_packageName = i.packageName;
      var o =
        (i_packageName =
          i.mac && i.mac.packageName ? i.mac.packageName : i_packageName) !== t;
      if (o) {
        var n = path_1.join(e, "cocos-project-template.json");
        if (fs_extra_1.existsSync(n)) {
          var s = (await fs_extra_1.readJSON(n)).do_add_native_support;
          if (o) {
            for (const p of s.project_replace_ios_bundleid.files) {
              var c = path_1.join(e, p);
              if (fs_extra_1.existsSync(c)) {
                let e = await fs_extra_1.readFile(c, "utf8");
                e = e.replace(new RegExp(i_packageName, "gm"), t);
                await fs_extra_1.writeFile(c, e);
              } else {
                console.error(
                  `Can't not find file [${p}], replace package name failed`
                );
              }
            }
          }

          if (!i.ios) {
            i.ios = {};
          }

          i.ios.packageName = t;
          await fs_extra_1.writeFile(r, JSON.stringify(i, null, 2));
        } else {
          console.error(`Can't find template json [${n}]`);
        }
      }
    } else {
      console.error(
        "The package name is illegal(iOS). It can only contain these characters: [0-9], [a-z], [A-Z], [_]."
      );
    }
  } else {
    console.error(`Can't find project json [${r}]`);
  }
}
function checkPackageNameValidity(e) {
  return /^([a-zA-Z0-9-.])+$/.test(e);
}
function modifyPackageName(e) {
  return e;
}
async function updateXcodeproject(a, t) {
  var r = path_1.join(Editor.App.path, "../resources/3d/engine/native");
  var i = t.packages.native.template;

  var a = path_1.join(
    a,
    "frameworks/runtime-src/proj.ios_mac",
    t.name + ".xcodeproj"
  );

  if (i === "link" && fs_extra_1.existsSync(a)) {
    i = path_1.join(a, "project.pbxproj");
    let e = (await fs_extra_1.readFile(i)).toString();

    e = e.replace(
      /\/Applications\/CocosCreator.app\/Contents\/Resources\/cocos2d-x/g,
      path_1.normalize(r)
    );

    await fs_extra_1.writeFile(i, e);
  }
  r = path_1.join(a, "xcshareddata/xcschemes/HelloJavascript-clip.xcscheme");
  if (fs_extra_1.existsSync(r)) {
    let e = (await fs_extra_1.readFile(r)).toString();
    e = e.replace(/HelloJavascript/g, t.name);
    await fs_extra_1.writeFile(r, e);
  }
}
async function renameXcodeResource(e, a) {
  var t = [
    path_1.join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      a.name + ".xcodeproj/xcshareddata/xcschemes/HelloJavascript-clip.xcscheme"
    ),
    path_1.join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      `${a.name}.xcodeproj/xcshareddata/xcschemes/${a.name}-clip.xcscheme`
    ),
    path_1.join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      "ios/HelloJavascript-mobileRelease.entitlements"
    ),
    path_1.join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      `ios/${a.name}-mobileRelease.entitlements`
    ),
    path_1.join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      "ios_appclip/HelloJavascript.entitlements"
    ),
    path_1.join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      `ios_appclip/${a.name}.entitlements`
    ),
  ];
  for (let e = 0; e < t.length; e += 2) {
    if (fs_extra_1.existsSync(t[e])) {
      await fs_extra_1.rename(t[e], t[e + 1]);
    } else {
      console.log(`notice: file ${t[e]} not found!`);
    }
  }
}
function readOrganizationUnit(a) {
  var e = child_process_1.execSync(
    `xcrun security find-certificate -c "${a}" -p`
  );

  var e = child_process_1
    .execSync("openssl x509 -inform PEM -noout -text", { input: e })
    .toString("utf8");

  const t = /OU=(\w+),/;
  e = e
    .split("\n")
    .filter((e) => e.includes(a))
    .map((e) => e.match(t))
    .filter((e) => e !== null)
    .map((e) => e[1]);
  return e.length === 0 ? "" : e[0];
}
async function findSignIdentify() {
  try {
    var e = child_process_1
      .execSync("xcrun security find-identity -v -p codesigning")
      .toString("utf8")
      .split("\n");
    const a = /(\w+\)) ([0-9A-Z]+) "([^"]+)"/;
    return e
      .map((e) => e.match(a))
      .filter((e) => e !== null)
      .map((e) => {
        var a = e[3].split(":");
        return {
          idx: e[1].substr(0, e[1].length - 1),
          hash: e[2],
          kind: a[0],
          displayValue: a[1],
          outputValue: readOrganizationUnit(e[3]),
          fullValue: e[3],
        };
      })
      .filter((e) => e.outputValue.length > 0);
  } catch (e) {
    console.warn("ios:" + Editor.I18n.t("ios.tips.developerTeamListError"));
    console.warn(e);
    return [];
  }
}
function checkTargetVersion(a, t) {
  var r = { error: "", newValue: "" };
  if (/^([1-9]\d|[1-9])(\.([1-9]\d|\d)){1,2}$/.test(a)) {
    let e = "10.0";

    if (
      t.packages.native.JobSystem === "taskFlow" &&
      !compareVersion(a, (e = "12.0"))
    ) {
      r.error = "i18n:ios.tips.targetVersionErrorWithTaskFlow";
      r.newValue = e;
    }

    if (!r.error && !compareVersion(a, e)) {
      r.error = "i18n:ios.tips.targetVersionError";
      r.newValue = e;
    }
  } else {
    r.error = "i18n:ios.tips.version_style_error";
  }
  return r;
}
function compareVersion(e, a, t = ".") {
  var r;
  return (
    typeof e != "string" ||
    typeof a != "string" ||
    ((r = Math.max(e.length, a.length)),
    (e = e.replace(t, "").padStart(r, "0")),
    (a = a.replace(t, "").padStart(r, "0")),
    Number(e) > Number(a)) ||
    Number(e) === Number(a)
  );
}
function verificationFunc(e, a) {
  var t = { error: "", newValue: a };
  if (e === "osTarget") {
    if (!a) {
      t.error = "i18n:ios.tips.not_empty";
      return t;
    }
    if (Object.keys(a).every((e) => !a[e])) {
      t.error = "i18n:ios.tips.at_least_one";
    }
  }
  return t;
}
exports.updateOrientation = updateOrientation;
exports.changePackageName = changePackageName;
exports.checkPackageNameValidity = checkPackageNameValidity;
exports.modifyPackageName = modifyPackageName;
exports.updateXcodeproject = updateXcodeproject;
exports.renameXcodeResource = renameXcodeResource;
exports.findSignIdentify = findSignIdentify;
exports.checkTargetVersion = checkTargetVersion;
exports.compareVersion = compareVersion;
exports.verificationFunc = verificationFunc;
