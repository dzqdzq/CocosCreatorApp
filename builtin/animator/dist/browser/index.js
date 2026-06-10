Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const clip_cache_1 = require("./clip-cache");
async function load() {
  await clip_cache_1.animationClipCacheManager.init();
}
function unload() {}
exports.methods = {
  open() {
    Editor.Panel.open("animator");
  },
  openDocs() {
    Editor.Message.send(
      "program",
      "open-url",
      Editor.Utils.Url.getDocUrl("animation/animation.html")
    );
  },
  queryLatestClipCache(e) {
    return clip_cache_1.animationClipCacheManager.queryLatestCache(e);
  },
  saveClipCacheToFile(e, a) {
    return clip_cache_1.animationClipCacheManager.save(e, a);
  },
  updateCacheConfig() {
    clip_cache_1.animationClipCacheManager.updateConfig();
  },
  async dropClipToNode(e, a) {
    var e_value = e.value;
    for (const t of a) {
      var i = t.uuid.value;
      await Editor.Message.request("scene", "execute-scene-script", {
        name: "animator",
        method: "createAniCompFromAsset",
        args: [i, [e_value]],
      });
    }
  },
};
