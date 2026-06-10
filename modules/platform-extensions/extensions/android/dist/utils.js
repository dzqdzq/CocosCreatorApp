Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProgramConfig = checkProgramConfig;

const { existsSync, readFileSync, readdirSync } = require("fs-extra");

const { join } = require("path");

function checkProgramConfig(r, e) {
  let a = "";
  switch (r) {
    case "androidNDK": {
      if (!e) {
        return a;
      }
      var t = join(e, "source.properties");
      if (existsSync(t)) {
        try {
          var o = readFileSync(t, "utf8").match(/Pkg\.Revision\s*=\s*(.*)/);

          var i = o ? o[1] : null;
          var n = i ? i.split(".")[0] : null;

          if (n && parseInt(n) < 21) {
            a = Editor.I18n.t("android.program.androidNDKVersionErr", {
              version: n,
            });
          }
        } catch (r) {
          console.debug(r);
          a = "i18n:android.program.androidNDKPathErr";
        }
      } else {
        a = "i18n:android.program.androidNDKPathErr";
      }
      break;
    }
    case "androidSDK": {
      if (!e) {
        return a;
      }
      t = join(e, "build-tools");
      o = join(e, "platforms");
      try {
        var s = readdirSync(o).length === 0;

        if (!existsSync(t) || !existsSync(o) || s) {
          a = "i18n:android.program.androidSDKPathErr";
        }
      } catch (r) {
        console.debug(r);
        a = "i18n:android.program.androidSDKPathErr";
      }
    }
  }
  return a;
}
