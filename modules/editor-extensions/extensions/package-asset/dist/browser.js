exports.methods = {
  refreshAfterImport() {
    Editor.Panel.close("package-asset.import");

    setTimeout(() => {
      Editor.Message.request("asset-db", "refresh");
    }, 100);
  },
};

exports.load = () => {};
exports.unload = () => {};
