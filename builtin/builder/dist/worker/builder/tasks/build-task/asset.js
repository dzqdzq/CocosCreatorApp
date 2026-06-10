Object.defineProperty(exports, "__esModule", { value: true });
exports.title = undefined;
exports.handle = handle;

const { copyFile } = require("fs-extra");

const { join, dirname } = require("path");

async function handle(e, t, s) {
  var i;
  this.updateProcess("Build bundles...");
  await this.bundleManager.buildAsset();

  if (e.includeModules.includes("custom-pipeline")) {
    i = join(Editor.Project.tmpDir, "asset-db/effect/effect.bin");
    t.paths.effectBin = join(dirname(t.paths.settings), "effect.bin");
    await copyFile(i, t.paths.effectBin);

    e.md5CacheOptions.excludes.push(
      Editor.Utils.Path.relative(t.paths.dir, t.paths.effectBin)
    );
  }

  await this.bundleManager.outputBundle();
}
exports.title = "Build Assets";
