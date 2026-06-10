Object.defineProperty(exports, "__esModule", { value: true });

exports.components = undefined;
exports.methods = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const remote_1 = require("@electron/remote");

const { existsSync, readFileSync, outputFileSync } = require("fs-extra");

const { join, isAbsolute } = require("path");

const { getTaskLogDest } = require("../../share/utils");

const plugin_1 = require("../plugin");
function data() {
  return { missing: false, customIconDisabilities: [] };
}
function mounted() {
  var t;
  var e = this;

  if (e.progress === 1) {
    t = Editor.UI.__protected__.File.resolveToRaw(e.task.options.buildPath);
    e.missing = existsSync(t);
  }
}
function t(t) {
  return Editor.I18n.t("builder." + t);
}
async function showShouldBreakTask(e) {
  return (
    await Editor.Dialog.info(t("isBreakBuildTask.title") + " " + e, {
      title: e,
      buttons: [t("isBreakBuildTask.break"), t("cancel")],
      default: 1,
      cancel: 1,
    })
  ).response;
}

exports.template = readFileSync(
  join(__dirname, "../../../static", "/template/components/task.html"),
  "utf8"
);

exports.props = ["task", "free", "dbReady", "runningTaskId", "activeTasks"];

exports.computed = {
  isPluginTaskBusy() {
    var t = this.task;
    return t.state === "processing" || t.state === "waiting";
  },
  isPlatformDisabled() {
    return !plugin_1.pluginManager.platformInfoMap[this.task.options.platform];
  },
  customIconConfigs() {
    return (
      plugin_1.pluginManager.getCustomIconConfigs(this.task.options.platform) ||
      []
    );
  },
};

exports.methods = {
  t,
  _onEditOptions() {
    var t = this;

    if (!t.isPlatformDisabled) {
      t.$root.editTaskOptions(t.task.id);
    }
  },
  _onRebuild() {
    Editor.Message.send(
      "builder",
      "recompile-task",
      String(this.task.id),
      this.task.options
    );
  },
  async _onRemoveTask(t) {
    var e = this;

    if (e.activeTasks.includes(e.task.id)) {
      e.$root.deleteSelectedTask();
    } else {
      e.$root.removeTask(e.task.id);
    }
  },
  async _onBreakTask() {
    var t = this;

    if (
      0 ===
      (await showShouldBreakTask(
        t.task.options.taskName || t.task.options.outputName
      ))
    ) {
      Editor.Message.send("builder", "break-task", String(t.task.id));
    }
  },
  async revealInExplorer() {
    var t = this;
    var e = t.task.options;

    var s = join(
      Editor.UI.__protected__.File.resolveToRaw(e.buildPath),
      e.outputName || ""
    );

    if (!existsSync(s)) {
      return t.isPluginTaskBusy
        ? undefined
        : void (
            (
              await Editor.Dialog.info(
                Editor.I18n.t("builder.isRemoveBuildTask.title"),
                {
                  title: e.taskName || e.outputName,
                  buttons: [
                    Editor.I18n.t("builder.cancel"),
                    Editor.I18n.t("builder.delete"),
                  ],
                  default: 0,
                  cancel: 0,
                }
              )
            ).response === 1 && t._onRemoveTask()
          );
    }
    await remote_1.shell.openPath(s);
  },
  async showBuildLog() {
    var t = this;

    var t = Editor.UI.__protected__.File.resolveToRaw(
      t.task.options.logDest ||
        getTaskLogDest(t.task.options.platform, t.task.id)
    );

    if (!existsSync(t)) {
      outputFileSync(t, "", "utf-8");
      console.debug("log file is empty: ", t);
    }

    var e = await Editor.Profile.getConfig("builder", "log.openType");

    if (e === "openFileDir") {
      remote_1.shell.showItemInFolder(t);
    } else if (
      !(await Editor.Message.request(
        "program",
        "open-program",
        "scriptEditor",
        { _args: [t] }
      ))
    ) {
      await remote_1.shell.openPath(t);
    }
  },
  async checkTask() {
    var t = this;
    let e = t.task.options.buildPath;

    if (!isAbsolute(e)) {
      e = join(
        Editor.UI.__protected__.File.resolveToRaw(t.task.options.buildPath),
        t.task.options.outputName || ""
      );
    }

    return (
      !!existsSync(e) ||
      ((
        await Editor.Dialog.info(Editor.I18n.t("builder.check_task.message"), {
          title: e,
          buttons: [
            Editor.I18n.t("builder.check_task.cancel"),
            Editor.I18n.t("builder.check_task.delete"),
          ],
          default: 0,
          cancel: 0,
        })
      ).response === 1 && t._onRemoveTask(),
      false)
    );
  },
  async onCustomIconConfirm(t) {
    var e;
    var s;

    if (t.executeType === "hook") {
      Editor.Message.send(
        "builder",
        "execute-hook-task",
        t.pkgName,
        t.hook,
        this.task.options
      );
    } else {
      ({ target: t, name: e, params: s } = t.message);
      Editor.Message.send(t, e, ...(s || []));
    }
  },
};

exports.components = { buttons: require("./buttons") };
