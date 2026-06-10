async function onBeforeBuild() {
  if (!window.Build.isCommand && !(await checkCanBuild())) {
    this.break("Build task has been canceled!");
  }
}
async function checkCanBuild() {
  var e = await Editor.Message.request("scene", "query-is-ready");
  if (
    e &&
    (await Editor.Message.request("scene", "multi-scene-query")).find(
      (e) => e.dirty
    )
  ) {
    e = Editor.I18n.t;

    e = await Editor.Dialog.warn(e("builder.is_save_scene.message"), {
      title: e("builder.is_save_scene.title"),
      default: Editor.App.args.test ? 1 : 0,
      cancel: 1,
      buttons: [
        e("builder.is_save_scene.save"),
        e("builder.is_save_scene.ignore"),
        e("builder.is_save_scene.cancel"),
      ],
    });

    if (e.response === 2) {
      return false;
    }

    if (e.response === 0) {
      await Editor.Message.request("scene", "multi-save-all-scene");
      console.debug("save scene because scene is dirty");
    }
  }
  return true;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onBeforeBuild = onBeforeBuild;
exports.throwError = false;
