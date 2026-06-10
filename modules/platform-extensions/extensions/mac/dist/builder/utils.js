Object.defineProperty(exports, "__esModule", { value: true });
exports.changePackageName = changePackageName;
exports.checkPackageNameValidity = checkPackageNameValidity;
exports.modifyPackageName = modifyPackageName;
exports.executableNameOrDefault = executableNameOrDefault;

const { join } = require("path");

const { existsSync, readJSON, readFile, writeFile } = require("fs-extra");

async function changePackageName(e, t) {
  var c = join(e, ".cocos-project.json");
  if (existsSync(c)) {
    var r = await readJSON(c);
    if (checkPackageNameValidity((t = t || r.packageName))) {
      let r_packageName = r.packageName;
      var i =
        (r_packageName =
          r.mac && r.mac.packageName ? r.mac.packageName : r_packageName) !== t;
      if (i) {
        var o = join(e, "cocos-project-template.json");
        if (existsSync(o)) {
          var s = (await readJSON(o)).do_add_native_support;
          if (i) {
            for (const l of s.project_replace_mac_bundleid.files) {
              var n = join(e, l);
              if (existsSync(n)) {
                let e = await readFile(n, "utf8");
                e = e.replace(new RegExp(r_packageName, "gm"), t);
                await writeFile(n, e);
              } else {
                console.error(
                  `Can't not find file [${l}], replace package name failed`
                );
              }
            }
          }

          if (!r.mac) {
            r.mac = {};
          }

          r.mac.packageName = t;
          await writeFile(c, JSON.stringify(r, null, 2));
        } else {
          console.error(`Can't find template json [${o}]`);
        }
      }
    } else {
      console.error(
        "The package name is illegal(MAC). It can only contain these characters: [0-9], [a-z], [A-Z], [_]."
      );
    }
  } else {
    console.error(`Can't find project json [${c}]`);
  }
}
function checkPackageNameValidity(e) {
  return /^[a-zA-Z]+([a-zA-Z0-9-.])+$/.test(e);
}
function modifyPackageName(e) {
  return e;
}
function executableNameOrDefault(e, a) {
  return a || (/^[0-9a-zA-Z_-]+$/.test(e) ? e + "-desktop" : "CocosGame");
}
