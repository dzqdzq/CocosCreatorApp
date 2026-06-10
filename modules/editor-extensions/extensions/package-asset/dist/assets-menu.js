Object.defineProperty(exports, "__esModule", { value: true });
exports.dbMenu = dbMenu;
exports.assetMenu = assetMenu;

const { dirname, join, basename } = require("path");

const { isPath } = require("./common/utlis");

const Editor_I18n = Editor.I18n;
async function DialogOpenImportZip() {
  var e = await Editor.Dialog.select({
    title: Editor.I18n.t("package-asset.import.title"),
    path:
      (await Editor.Profile.getConfig("package-asset", "import-path")) ||
      Editor.Project.path,
    filters: [{ name: "Package", extensions: ["zip"] }],
  });
  if (!e.canceled) {
    e = e.filePaths && e.filePaths[0];

    return isPath(e)
      ? (await Editor.Profile.setConfig(
          "package-asset",
          "import-path",
          dirname(e)
        ),
        e)
      : undefined;
  }
}
function getImportMenu(e) {
  return {
    label: "i18n:package-asset.menu.import",
    enabled: !e || !e.readonly,
    async click() {
      var e;

      if (await Editor.Panel.has("package-asset.import")) {
        Editor.Panel.focus("package-asset.import");
      } else if ((e = await DialogOpenImportZip())) {
        Editor.Panel.open("package-asset.import", e);
      }
    },
  };
}
function getExportMenu(e) {
  return {
    label: "i18n:package-asset.menu.export",
    enabled: !e || !e.readonly,
    async click() {
      if (await Editor.Panel.has("package-asset.export")) {
        Editor.Panel.focus("package-asset.export");
      } else {
        Editor.Panel.open("package-asset.export", e);
      }
    },
  };
}
function getImportNewAssetMenu(e, t) {
  const r = (e ? e.url : "db://assets").replace("db://", "");
  e = !e || (!e.readonly && e.isDirectory);
  return {
    label:
      "i18n:package-asset.menu." +
      (t === "directory" ? "importNewFolders" : "importNewFiles"),
    enabled: e,
    async click() {
      try {
        var a = await Editor.Dialog.select({
          title: Editor.I18n.t("package-asset.importNewAsset.title"),
          path:
            (await Editor.Profile.getConfig(
              "package-asset",
              "import-new-asset-path"
            )) || Editor.Project.path,
          type: t,
          multi: true,
        });
        if (!a.canceled) {
          let t;
          for (let e = 0; e < a.filePaths.length; e++) {
            var i = a.filePaths[e];

            var s = await Editor.Message.request(
              "asset-db",
              "import-asset",
              i,
              "db://" + join(r, basename(i))
            );

            if (e === 0) {
              t = s;

              await Editor.Profile.setConfig(
                "package-asset",
                "import-new-asset-path",
                dirname(i)
              );
            }
          }

          if (t) {
            Editor.Message.send("assets", "twinkle", t.uuid);
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
  };
}
function dbMenu(e) {
  return [
    getImportNewAssetMenu(e, "file"),
    getImportNewAssetMenu(e, "directory"),
    getImportMenu(e),
  ];
}
function assetMenu(e) {
  return [
    getImportNewAssetMenu(e, "file"),
    getImportNewAssetMenu(e, "directory"),
    getImportMenu(e),
    getExportMenu(e),
  ];
}
