Object.defineProperty(exports, "__esModule", { value: true });

exports.modifyPackageName = undefined;
exports.checkPackageNameValidity = undefined;
exports.changePackageName = undefined;

const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
async function changePackageName(e, t) {
  var c = path_1.join(e, ".cocos-project.json");
  if (fs_extra_1.existsSync(c)) {
    var r = await fs_extra_1.readJSON(c);
    if (checkPackageNameValidity((t = t || r.packageName))) {
      let r_packageName = r.packageName;
      var i =
        (r_packageName =
          r.mac && r.mac.packageName ? r.mac.packageName : r_packageName) !== t;
      if (i) {
        var o = path_1.join(e, "cocos-project-template.json");
        if (fs_extra_1.existsSync(o)) {
          var s = (await fs_extra_1.readJSON(o)).do_add_native_support;
          if (i) {
            for (var n of s.project_replace_mac_bundleid.files) {
              var l = path_1.join(e, n);
              if (fs_extra_1.existsSync(l)) {
                let e = await fs_extra_1.readFile(l, "utf8");
                e = e.replace(new RegExp(r_packageName, "gm"), t);
                await fs_extra_1.writeFile(l, e);
              } else {
                console.error(
                  `Can't not find file [${n}], replace package name failed`
                );
              }
            }
          }

          if (!r.mac) {
            r.mac = {};
          }

          r.mac.packageName = t;
          await fs_extra_1.writeFile(c, JSON.stringify(r, null, 2));
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
  return /^([a-zA-Z0-9-.])+$/.test(e);
}
function modifyPackageName(e) {
  return e;
}
exports.changePackageName = changePackageName;
exports.checkPackageNameValidity = checkPackageNameValidity;
exports.modifyPackageName = modifyPackageName;
