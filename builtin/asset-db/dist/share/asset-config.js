Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssetConfig = undefined;
exports.createListOrder = undefined;

exports.createListOrder = [
  "directory",
  "scene",
  "script",
  "typescript",
  "material",
  "texture-cube",
  "render-texture",
  "effect",
  "animation",
  "auto-atlas",
  "label-atlas",
  "render-pipeline",
  "terrain",
];

exports.createAssetConfig = {
  directory: { handler: "directory" },
  chunk: { handler: "effect-header" },
  RenderPipelineAsset: { handler: "render-pipeline" },
};
