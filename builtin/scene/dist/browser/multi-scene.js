function addMultiSceneListener() {
  Editor.Profile.__protected__.on("change", async (e, t, n, i) => {
    if (t === "packages/scene.json" && n === "scene.multi") {
      Editor.Dialog.info(Editor.I18n.t("scene.multi_scene.tips"), {
        title: Editor.I18n.t("scene.multi_scene.title"),
        buttons: [Editor.I18n.t("scene.multi_scene.confirm")],
      });
    }
  });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMultiSceneListener = addMultiSceneListener;
