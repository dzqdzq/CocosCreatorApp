Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;

const { join, dirname } = require("path");

const { existsSync, readFileSync } = require("fs-extra");

const { exec } = require("child_process");

function mapToCommandArgs(e, t = " ", r = true) {
  return Object.entries(e)
    .map(([e, t]) => (r ? "--" : "") + e + "=" + t)
    .join(t);
}
function handleLaunchMethod(e, t) {
  let r = e;
  if (e === "lite") {
    t =
      process.platform === "darwin"
        ? join(t, "Contents/Resources/app/package.json")
        : join(dirname(t), "resources/app/package.json");
    if (existsSync(t)) {
      try {
        var o = JSON.parse(readFileSync(t, "utf8"));
        if (Editor.Utils.Parse.compareVersion(o.version, "4.1.0")) {
          return e;
        }
        console.log(
          Editor.I18n.t("bytedance-mini-game.tips.client_version_err", {
            currVersion: o.version || "",
            version: "4.1.0",
          })
        );
      } catch (e) {
        console.error(e);
      }
    } else {
      console.warn(
        Editor.I18n.t("bytedance-mini-game.tips.client_info_path_err", {
          path: t,
        })
      );
    }
    r = "full";
  }
  return r;
}
exports.methods = {
  async run(e, t) {
    var r = await Editor.Message.request(
      "program",
      "query-program-info",
      "bytedanceDevtools"
    );

    var r = r ? r.path : "";
    if (!r || !existsSync(r)) {
      console.warn(
        Editor.I18n.t("bytedance-mini-game.tips.bytedance_app_path_empty")
      );

      if (
        (
          await Editor.Dialog.warn(
            Editor.I18n.t("bytedance-mini-game.tips.bytedance_app_path_empty"),
            {
              buttons: [
                Editor.I18n.t("bytedance-mini-game.tips.cancel"),
                Editor.I18n.t("bytedance-mini-game.tips.setDevTools"),
              ],
            }
          )
        ).response === 1
      ) {
        Editor.Message.send("preferences", "open-settings", "program");
      }

      return false;
    }
    if (!existsSync(r)) {
      await Editor.Dialog.error(
        Editor.I18n.t("bytedance-mini-game.tips.client_path_error")
      );

      return false;
    }
    let o;
    let n = "";
    let a = "";
    e = {
      path: `"${e}"`,
      "project-type": "microgame",
      mode: handleLaunchMethod(
        t.packages["bytedance-mini-game"].devToolsLaunchMethod,
        r
      ),
    };

    a =
      process.platform === "darwin"
        ? ((o = "open"),
          (n = o + ` "${r}" --args ` + mapToCommandArgs(e)),
          `${o} "bytedanceide:?${mapToCommandArgs(e, "&", false)}"`)
        : ((o = "start"),
          (n = o + ` "" "${r}" ` + mapToCommandArgs(e)),
          `${o} "" "bytedanceide:?${mapToCommandArgs(e, "^&", false)}"`);

    console.log(`Run command: ${n} && ` + a);
    const s = exec(n + " && " + a);

    if (s && s.stdout) {
      s.stdout.on("data", (e) => {
        console.log("[Douyin IDE] " + e.toString());
      });
    }

    if (s && s.stderr) {
      s.stderr.on("data", (e) => {
        console.error("[Douyin IDE stderr] " + e.toString());
      });
    }

    s.on("close", (e) => {
      s.kill();
    });
  },
};
