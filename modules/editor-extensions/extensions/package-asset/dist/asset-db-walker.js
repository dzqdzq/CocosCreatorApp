exports.methods = {
  async getDependMap() {
    try {
      return Manager.assetDBManager.assetDBMap.assets.dependencyManager
        .dependMap;
    } catch (e) {
      console.error(e);
      return [];
    }
  },
};
