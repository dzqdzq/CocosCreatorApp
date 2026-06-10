function onAfterInit(e, t, n) {
  var s;
  var a = e.packages.windows.renderBackEnd;

  var a =
    ((e.assetSerializeOptions["cc.EffectAsset"].glsl1 =
      null == (s = a.gles2) || s),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl3 =
      null == (s = a.gles3) || s),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl4 =
      null == (s = a.vulkan) || s),
    { packageName: e.name });

  n.__addStaticsInfo(a);

  Editor.Metrics.trackEvent({
    category: "Project",
    action: "Rendering Backend",
    label: "Vulkan",
    value: e.packages.windows.renderBackEnd.vulkan ? 100 : 0,
  });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterInit = undefined;
exports.onAfterInit = onAfterInit;
