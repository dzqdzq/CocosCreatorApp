Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderPipelineAssetHandler = undefined;

const { readFile } = require("fs-extra");

const { getDependUUIDList } = require("../utils");

exports.RenderPipelineAssetHandler = {
  name: "render-pipeline",
  assetType: "cc.RenderPipeline",
  importer: {
    version: "1.0.0",
    async import(e) {
      var r = await readFile(e.source, "utf8");

      var r = (await e.saveToLibrary(".json", r), getDependUUIDList(r));

      e.setData("depends", r);
      return true;
    },
  },
};

exports.default = exports.RenderPipelineAssetHandler;
