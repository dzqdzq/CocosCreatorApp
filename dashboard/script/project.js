const existsSync = require("fs").existsSync;
const { readJSONSync, outputJSONSync } = require("fs-extra");
const join = require("path").join;
const semver = require("semver");
const project = require("@editor/project");
const ipc = require("@base/electron-base-ipc");
const Dialog = require("@editor/creator/dist/dialog").Dialog;
const { t, errorDialog, chooseProjectPath } = require("./util");
const version = require("@editor/setting").version;
exports.openProject = async (o) => {
  try {
    if (!(o = o || (await chooseProjectPath(t("open_project"))))) {
      return false;
    }
    if (!existsSync(o)) {
      await Dialog.warn(t("message.project_missing"), {
        title: t("project_missing"),
        buttons: [t("cancel")],
      });

      return false;
    }
    var e = join(o, "package.json");
    var i = readJSONSync(e);
    let s = true;
    var a = i.creator?.version || i.version;
    if (a) {
      var c;

      var n = semver.gt(
        semver.valid(semver.coerce(version)),
        semver.valid(semver.coerce(a))
      );

      var v = semver.lt(
        semver.valid(semver.coerce(version)),
        semver.valid(semver.coerce(a))
      );

      let e = "";
      let r = "";

      if (n) {
        e = t("message.upgrade_message");
        r = t("message.upgrade_detail");
      }

      if (v) {
        e = t("message.degrade_message");
        r = t("message.degrade_detail");
      }

      if (e) {
        r = r
          .replace("$$projectVersion", i.version)
          .replace("$$editorVersion", version)
          .replace("$$projectPath", o);

        c = await Dialog.warn(e, {
          title: t("warn"),
          detail: r,
          buttons: [t("confirm"), t("cancel")],
        });

        s = c.response === 0;
      }

      if (!s) {
        return false;
      }
    }
    i.version = version;
    outputJSONSync(e, i, { spaces: 2 });
    project.open(o);
    return true;
  } catch (e) {
    await errorDialog(
      t("message.check_version_error", { error: e.message }),
      o
    );

    console.error(e);
    return false;
  }
};
