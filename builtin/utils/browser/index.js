const join = require("path").join;
const existsSync = require("fs-extra").existsSync;
const shell = require("electron").shell;

exports.methods = {
  async exportDTS(t, e = true, i) {
    try {
      if (!t) {
        var o = (
          await Editor.Dialog.select({
            title: "Select Directory",
            path: Editor.Project.path,
            type: "directory",
          })
        ).filePaths;
        if (!o) {
          return;
        }
        t = o[0];
      }
      var r;
      var s;

      if (
        t &&
        existsSync(t) &&
        ((r = join(t, "@cocos", "creator-types")),
        (s = join(Editor.App.path, "./node_modules/@cocos/creator-types")),
        existsSync(s)) &&
        (await Editor.Utils.File.copy(s, r), e)
      ) {
        shell.showItemInFolder(r);
      }
    } catch (t) {
      console.error(t);
    }
  },
  testerTag(t) {
    Editor.Metrics.trackEvent({
      sendToNewCocosAnalyticsOnly: true,
      category: "test",
      value: { B100000: String(t || "") },
    });
  },
};

exports.load = async () => {
  if (!(await Editor.Profile.getConfig("utils", "3_0_0_package_dir_info"))) {
    Editor.Profile.setConfig("utils", "3_0_0_package_dir_info", true, "global");
    try {
      setTimeout(() => {
        Editor.Task.addNotice({
          title: Editor.I18n.t("utils.info.package_dir_info_title"),
          message: Editor.I18n.t("utils.info.package_dir_info_detail"),
          type: "warn",
        });
      }, 5000 /* 5e3 */);
    } catch (t) {}
  }
};

exports.unload = () => {};
