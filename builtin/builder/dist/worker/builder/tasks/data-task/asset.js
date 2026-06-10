async function handle(e, t, a) {
  await this.bundleManager.initAsset();

  if (!e.preview) {
    await this.bundleManager.bundleDataTask();
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = undefined;
exports.title = undefined;
exports.handle = handle;
exports.title = "i18n:builder.tasks.sort_asset_bundle";
exports.name = "data-task/asset_bundle";
