Object.defineProperty(exports, "__esModule", { value: true });

exports.versionDev = undefined;
exports.buildTempDir = undefined;
exports.previewTempDir = undefined;
exports.texturePackerTempDir = undefined;
exports.version = undefined;

const { join } = require("path");

exports.version = "1.0.1";

exports.texturePackerTempDir = join(
  Editor.Project.path,
  "temp/builder/TexturePacker" + exports.version
);

exports.previewTempDir = join(exports.texturePackerTempDir, "preview");

exports.buildTempDir = join(exports.texturePackerTempDir, "build");

exports.versionDev = "1.0.2";
