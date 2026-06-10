async function onAfterInit(e, t, s) {
  var a;
  var r = (e.packages.mac.renderBackEnd = {
    gles2: false,
    gles3: false,
    metal: true,
  });

  var r =
    ((e.assetSerializeOptions["cc.EffectAsset"].glsl1 =
      null == (a = r.gles2) || a),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl3 =
      null == (a = r.gles3) || a),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl4 =
      null == (a = r.metal) || a),
    { packageName: e.packages.mac.packageName });

  s.__addStaticsInfo(r);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterInit = undefined;
exports.throwError = undefined;
exports.throwError = true;
exports.onAfterInit = onAfterInit;
