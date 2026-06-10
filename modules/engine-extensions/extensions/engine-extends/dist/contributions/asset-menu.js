function assetMenu(e) {
  if (
    e.importer === "texture" ||
    e.importer === "image" ||
    e.importer === "directory"
  ) {
    return [
      {
        label: "i18n:ENGINE.assets.autoGenerateMaterial",
        enable: true,
        async click() {
          Editor.Message.send("asset-db", "new-asset", {
            handler: "material",
            template: "autoGenerateMaterial",
            target: "",
          });
        },
      },
    ];
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetMenu = assetMenu;
