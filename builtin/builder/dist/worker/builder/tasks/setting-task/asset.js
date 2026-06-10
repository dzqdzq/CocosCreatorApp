Object.defineProperty(exports, "__esModule", { value: true });
exports.title = undefined;
exports.handle = handle;
const bundle_utils_1 = require("../../../../share/bundle-utils");
const asset_library_1 = require("../../manager/asset-library");

const { compressUuid } = require("../../utils");

exports.title = "i18n:builder.tasks.settings.options";
const layerMask = [];
for (let e = 0; e <= 19; e++) {
  layerMask[e] = 1 << e;
}
async function handle(e, s, t) {
  var n = this.bundleManager.bundles.filter((e) => e.output);
  for (const l of n) {
    switch (l.name) {
      case bundle_utils_1.BuiltinBundleName.RESOURCES:
        s.settings.assets.preloadBundles.push({
          bundle: bundle_utils_1.BuiltinBundleName.RESOURCES,
        });

        break;
      case bundle_utils_1.BuiltinBundleName.START_SCENE:
        s.settings.assets.preloadBundles.push({
          bundle: bundle_utils_1.BuiltinBundleName.START_SCENE,
        });

        break;
      case bundle_utils_1.BuiltinBundleName.MAIN:
        s.settings.assets.preloadBundles.push({
          bundle: bundle_utils_1.BuiltinBundleName.MAIN,
        });

        break;
    }

    if (l.isRemote) {
      s.settings.assets.remoteBundles.push(l.name);
    }

    if (l.isSubpackage) {
      s.settings.assets.subpackages.push(l.name);
    }
  }
  if (!e.preview) {
    var i = asset_library_1.buildAssetLibrary.getAsset(e.startScene);
    if (!i) {
      throw new Error(Editor.I18n.t("builder.error.invalidStartScene"));
    }
    e.startScene = i.url;
  }

  if (!e.debug) {
    s.settings.rendering.renderPipeline = compressUuid(
      s.settings.rendering.renderPipeline,
      true
    );
  }

  s.settings.assets.projectBundles = n.map((e) => e.name);

  s.settings.engine.builtinAssets = Array.from(
    this.bundleManager.bundleMap[bundle_utils_1.BuiltinBundleName.INTERNAL]
      ._rootAssets
  );
}
