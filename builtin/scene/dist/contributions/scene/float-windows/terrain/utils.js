async function getLibrariedSource(e) {
  var t;
  var e = await Editor.Message.request("asset-db", "query-asset-info", e.uuid);
  return e && ((e = e.library), (t = Object.keys(e).find((e) => e !== ".json")))
    ? e[t]
    : "";
}
async function getImageLikeAssetSource(e) {
  let t = "";
  switch (e.importer) {
    case "image":
    case "gltf-embeded-image": {
      t = await getLibrariedSource(e);
      break;
    }
    case "texture": {
      var e_userData = e.userData;
      var e_userData_imageUuidOrDatabaseUri = e_userData.imageUuidOrDatabaseUri;
      if (!e_userData_imageUuidOrDatabaseUri) {
        return "";
      }

      if (!e_userData.isUuid) {
        e_userData = await Editor.Message.request(
          "asset-db",
          "query-asset-info",
          e_userData_imageUuidOrDatabaseUri
        );

        t = e_userData ? e_userData.path : "";
      }

      if (!e_userData_imageUuidOrDatabaseUri) {
        return "";
      }

      e_userData = await Editor.Message.request(
        "asset-db",
        "query-asset-meta",
        e_userData_imageUuidOrDatabaseUri
      );
      t = await getImageLikeAssetSource(e_userData);
    }
  }
  return t.replace("#", "%23");
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageLikeAssetSource = getImageLikeAssetSource;
