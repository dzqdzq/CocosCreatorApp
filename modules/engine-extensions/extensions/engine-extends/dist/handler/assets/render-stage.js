Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderStageAssetHandler = undefined;

const { readFile } = require("fs-extra");

const { getDependUUIDList } = require("../utils");

exports.RenderStageAssetHandler = {
  name: "render-stage",
  assetType: "RenderStage",
  importer: {
    version: "1.0.0",
    async import(e) {
      var t = await readFile(e.source, "utf8");

      var t = (await e.saveToLibrary(".json", t), getDependUUIDList(t));

      e.setData("depends", t);
      return true;
    },
  },
};

exports.default = exports.RenderStageAssetHandler;
