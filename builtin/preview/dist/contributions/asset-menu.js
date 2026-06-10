function assetMenu(e) {
  return [
    {
      label: "i18n:preview.assets.preview_in_browser",
      enabled: e.importer === "scene",
      click() {
        Editor.Message.send("preview", "preview-scene-in-browser", e.uuid);
      },
    },
  ];
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetMenu = assetMenu;
