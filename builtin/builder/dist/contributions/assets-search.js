Object.defineProperty(exports, "__esModule", { value: true });
exports.onSearchMenu = onSearchMenu;

const { basename } = require("path");

function onSearchMenu() {
  return [
    {
      label: "i18n:builder.assets.bundle.searchBundle",
      key: "searchBundle",
      async handler(e, a) {
        var r;
        return !!(
          a &&
          a.isDirectory &&
          (r = await Editor.Message.request(
            "asset-db",
            "query-asset-meta",
            a.uuid
          ))?.userData.isBundle &&
          ((r = r.userData.bundleName || basename(a.url)),
          a.fileName?.includes(e) || r.includes(e))
        );
      },
    },
  ];
}
