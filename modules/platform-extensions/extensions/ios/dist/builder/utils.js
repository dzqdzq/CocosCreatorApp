Object.defineProperty(exports, "__esModule", { value: true });
exports.changePackageName = changePackageName;
exports.checkPackageNameValidity = checkPackageNameValidity;
exports.executableNameOrDefault = executableNameOrDefault;
exports.modifyPackageName = modifyPackageName;
exports.updateXcodeproject = updateXcodeproject;
exports.renameXcodeResource = renameXcodeResource;
exports.findSignIdentify = findSignIdentify;
exports.verificationFunc = verificationFunc;
exports.compareVersion = compareVersion;

const { join, normalize } = require("path");

const {
  existsSync,
  readJSON,
  readFile,
  writeFile,
  rename,
} = require("fs-extra");

const { execSync } = require("child_process");

async function changePackageName(e, r) {
  var t = join(e, ".cocos-project.json");
  if (existsSync(t)) {
    var i = await readJSON(t);
    if (checkPackageNameValidity((r = r || i.packageName))) {
      let i_packageName = i.packageName;
      var o =
        (i_packageName =
          i.mac && i.mac.packageName ? i.mac.packageName : i_packageName) !== r;
      if (o) {
        var n = join(e, "cocos-project-template.json");
        if (existsSync(n)) {
          var s = (await readJSON(n)).do_add_native_support;
          if (o) {
            for (const p of s.project_replace_ios_bundleid.files) {
              var c = join(e, p);
              if (existsSync(c)) {
                let e = await readFile(c, "utf8");
                e = e.replace(new RegExp(i_packageName, "gm"), r);
                await writeFile(c, e);
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

          i.ios.packageName = r;
          await writeFile(t, JSON.stringify(i, null, 2));
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
    console.error(`Can't find project json [${t}]`);
  }
}
function checkPackageNameValidity(e) {
  return /^[a-zA-Z]+([a-zA-Z0-9-.])+$/.test(e);
}
function executableNameOrDefault(e, a) {
  return (a || (/^[0-9a-zA-Z_-]+$/.test(e) ? e + "-mobile" : (console.warn(
        `The provided project name "${e}" is not suitable for use as an executable name. 'CocosGame' is applied instead.`
      ), "CocosGame")));
}
function modifyPackageName(e) {
  return e;
}
async function updateXcodeproject(a, r) {
  var t = r.engineInfo.native.builtin;
  var i = r.packages.native.template;

  var a = join(a, "frameworks/runtime-src/proj.ios_mac", r.name + ".xcodeproj");

  if (i === "link" && existsSync(a)) {
    i = join(a, "project.pbxproj");
    let e = (await readFile(i)).toString();

    e = e.replace(
      /\/Applications\/CocosCreator.app\/Contents\/Resources\/cocos2d-x/g,
      normalize(t)
    );

    await writeFile(i, e);
  }
  t = join(a, "xcshareddata/xcschemes/HelloJavascript-clip.xcscheme");
  if (existsSync(t)) {
    let e = (await readFile(t)).toString();
    e = e.replace(/HelloJavascript/g, r.name);
    await writeFile(t, e);
  }
}
async function renameXcodeResource(e, a) {
  var r = [
    join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      a.name + ".xcodeproj/xcshareddata/xcschemes/HelloJavascript-clip.xcscheme"
    ),
    join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      `${a.name}.xcodeproj/xcshareddata/xcschemes/${a.name}-clip.xcscheme`
    ),
    join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      "ios/HelloJavascript-mobileRelease.entitlements"
    ),
    join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      `ios/${a.name}-mobileRelease.entitlements`
    ),
    join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      "ios_appclip/HelloJavascript.entitlements"
    ),
    join(
      e,
      "frameworks/runtime-src/proj.ios_mac",
      `ios_appclip/${a.name}.entitlements`
    ),
  ];
  for (let e = 0; e < r.length; e += 2) {
    if (existsSync(r[e])) {
      await rename(r[e], r[e + 1]);
    } else {
      console.log(`notice: file ${r[e]} not found!`);
    }
  }
}
function flatArray(e, a) {
  if (e instanceof Array) {
    for (const r of e) {
      flatArray(r, a);
    }
  } else {
    a.push(e);
  }
}
function readOrganizationUnits(e) {
  e = execSync(`xcrun security find-certificate -c "${e}" -p`, {
    encoding: "utf8",
  });

  e = execSync("openssl x509 -inform PEM -noout -text", {
    input: e,
    encoding: "utf8",
  });

  const a = /OU\s*=\s*(\w+),/;
  e = e
    .split("\n")
    .filter((e) => e.match(/^\s*Subject:/))
    .map((e) => e.match(a))
    .filter((e) => e !== null)
    .map((e) => e[1]);
  return e.length === 0 ? [] : e;
}
async function findSignIdentify() {
  try {
    var e = execSync("xcrun security find-identity -v -p codesigning")
      .toString("utf8")
      .split("\n");
    const t = /(\w+\)) ([0-9A-Z]+) "([^"]+)"\s*(\((\w+)\))?/;

    var a = e
      .map((e) => e.match(t))
      .filter((e) => e !== null)
      .map((a) => {
        const r = a[3].split(":");
        return readOrganizationUnits(a[3]).map((e) => ({
          idx: a[1].substr(0, a[1].length - 1),
          hash: a[2],
          kind: r[0],
          displayValue: r[1].trim(),
          outputValue: e,
          fullValue: a[3].replace(/\(\w+\)/, `(TEAM:${e})`),
          errorState: a[5],
        }));
      });

    var r = [];
    flatArray(a, r);

    return r.filter((e) => e.outputValue.length > 0);
  } catch (e) {
    console.warn("ios:" + Editor.I18n.t("ios.tips.developerTeamListError"));
    console.warn(e);
    return [];
  }
}
function verificationFunc(e, a, r) {
  var t = { error: "", newValue: a, level: "error" };
  switch (e) {
    case "targetVersion":
      {
        let e = "11.0";
        if (!/^([1-9]\d|[1-9])(\.([1-9]\d|\d)){1,2}$/.test(a)) {
          t.error = "i18n:ios.tips.version_style_error";
          return t;
        }

        if (r.packages.native.JobSystem === "taskFlow") {
          e = "12.0";

          compareVersion(a, e) ||
            ((t.error = "i18n:ios.tips.targetVersionErrorWithTaskFlow"),
            (t.newValue = e));
        }

        if (!t.error && !compareVersion(a, e)) {
          t.error = "i18n:ios.tips.targetVersionError";
          t.newValue = e;
        }
      }
      break;
    case "orientation": {
      if (!a) {
        t.error = "i18n:ios.tips.not_empty";
        return t;
      }
      if (Object.keys(a).every((e) => !a[e])) {
        t.error = "i18n:ios.tips.at_least_one";
        return t;
      }
      break;
    }
    case "osTarget": {
      if (!a) {
        t.error = "i18n:ios.tips.not_empty";
        return t;
      }
      if (Object.keys(a).every((e) => !a[e])) {
        t.error = "i18n:ios.tips.at_least_one";
        return t;
      }
      break;
    }
    case "packageName": {
      if (a) {
        if (checkPackageNameValidity(a)) {
          break;
        }
        t.error = "i18n:ios.tips.packageNameRuleMessage";
      } else {
        t.error = "i18n:ios.tips.not_empty";
      }
      return t;
    }
  }
  return t;
}
function compareVersion(e, a, r = ".") {
  var t;
  return (
    typeof e != "string" ||
    typeof a != "string" ||
    ((t = Math.max(e.length, a.length)),
    (e = e.replace(r, "").padStart(t, "0")),
    (a = a.replace(r, "").padStart(t, "0")),
    Number(e) > Number(a)) ||
    Number(e) === Number(a)
  );
}
