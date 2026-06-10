var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.sceneCacheManager = undefined;
exports.formatTime = formatTime;

const { readJSONSync } = require("fs-extra");

const utils_1 = __importDefault(require("./utils"));
class SceneCacheManager {
  useSceneCache = true;
  async init() {
    var e = await Editor.Profile.getConfig("scene", "scene_cache");
    this.useSceneCache = e.use;

    if (!e.use) {
      console.log("The scene instant cache function is turned off");
    }
  }
  async queryLatestCache(e) {
    if (this.useSceneCache && !isPreviewProcess) {
      e = await this.queryLastCacheInfo(e);
      if (e) {
        var a = await Editor.Dialog.info(
          Editor.I18n.t("scene.messages.scene_cache.use_latest_scene", {
            time: formatTime(e.time),
            url: e.url,
          }),
          {
            buttons: [
              Editor.I18n.t("scene.messages.scene_cache.apply"),
              Editor.I18n.t("scene.messages.scene_cache.no"),
            ],
            default: 1,
            cancel: 1,
          }
        );
        if (a.response === 0) {
          try {
            return e.json;
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }
  async loadCacheScene(a = "") {
    if (!a) {
      return false;
    }
    var e = await this.queryLatestCache(a);
    if (!e) {
      return false;
    }
    try {
      await utils_1.default.loadSceneByJson(e);
      return true;
    } catch (e) {
      this.clearSceneCache(a);
      console.error("Open cache scene failed！");
      console.error(e);
      return false;
    }
  }
  async queryLastCacheInfo(e) {
    e = await Editor.Message.request("scene", "query-latest-cache", e);
    if (e) {
      try {
        return {
          time: e.time,
          json: e.data || readJSONSync(e.file),
          url: e.url,
        };
      } catch (e) {
        console.error(e);
      }
    }
  }
  clearSceneCache(e) {
    Editor.Message.send("scene", "clear-scene-cache", e);
  }
}
function formatTime(e) {
  return new Date(e).toLocaleString();
}
exports.sceneCacheManager = new SceneCacheManager();
