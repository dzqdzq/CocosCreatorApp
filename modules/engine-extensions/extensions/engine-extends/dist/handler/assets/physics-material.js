Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsMaterialHandler = undefined;

exports.PhysicsMaterialHandler = {
  name: "physics-material",
  assetType: "cc.PhysicsMaterial",
  createInfo: {
    generateMenuInfo() {
      return [
        {
          label: "i18n:ENGINE.assets.newPhysicsMaterial",
          fullFileName: "physics-material.pmtl",
          template:
            "db://internal/default_file_content/physics-material/default.pmtl",
          group: "material",
        },
      ];
    },
  },
  importer: {
    version: "1.0.1",
    async import(e) {
      await e.copyToLibrary(".json", e.source);
      return true;
    },
  },
};

exports.default = exports.PhysicsMaterialHandler;
