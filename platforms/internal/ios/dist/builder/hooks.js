async function onAfterInit(e, t, s) {
  var o;
  var r = (e.packages.ios.renderBackEnd = {
    gles2: false,
    gles3: false,
    metal: true,
  });

  var r =
    ((e.assetSerializeOptions["cc.EffectAsset"].glsl1 =
      null == (o = r.gles2) || o),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl3 =
      null == (o = r.gles3) || o),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl4 =
      null == (o = r.metal) || o),
    {
      packageName: e.packages.ios.packageName,
      orientation: e.packages.ios.orientation,
    });

  s.__addStaticsInfo(r);
}
async function onAfterBuild(e, t) {}
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterBuild = undefined;
exports.onAfterInit = undefined;
exports.throwError = undefined;
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onAfterBuild = onAfterBuild;
