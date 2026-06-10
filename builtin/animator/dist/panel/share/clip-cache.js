Object.defineProperty(exports, "__esModule", { value: true });
exports.animationClipCacheManager = undefined;
exports.formatTime = formatTime;

const { readJSONSync, readJSON } = require("fs-extra");

const { join } = require("path");

const { queryLatestClipCache, saveClipCacheToFile } = require("./ipc-event");

const ANIMATION_CACHE_DIR = join(Editor.Project.tmpDir, "animator/cache");

class AnimationClipCacheManager {
  useClipCache = true;
  animationMode = false;
  get disabled() {
    return !this.useClipCache || !this.animationMode;
  }
  async init() {
    var e = await Editor.Profile.getConfig("animator", "clip_cache");
    this.useClipCache = e.use;

    if (!e.use) {
      console.log("The animator instant cache function is turned off");
    }
  }
  async queryLatestCache(e) {
    if (this.useClipCache) {
      e = await queryLatestClipCache(e);
      if (e) {
        var a = await Editor.Dialog.info(
          Editor.I18n.t("animator.clip_cache.use_latest_clip", {
            time: formatTime(e.time),
            url: e.url,
          }),
          {
            buttons: [
              Editor.I18n.t("animator.clip_cache.apply"),
              Editor.I18n.t("animator.clip_cache.no"),
            ],
            default: 1,
            cancel: 1,
          }
        );
        if (a.response === 0) {
          try {
            return e.data || readJSONSync(e.file);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }
  async selectClipCache(e) {
    e = await Editor.Dialog.select({
      type: "file",
      path: join(ANIMATION_CACHE_DIR, e),
      extensions: "json",
      filters: [
        { extensions: ["json"], name: Editor.I18n.t("animator.toolbar.clips") },
      ],
    });
    try {
      return e.canceled || !e.filePaths[0]
        ? null
        : await readJSON(e.filePaths[0]);
    } catch (e) {
      console.error(e);
    }
    return null;
  }
  async cacheClipDump(e, a) {
    if (!this.disabled) {
      await saveClipCacheToFile(e, a);
    }
  }
}
function formatTime(e) {
  return new Date(e).toLocaleString();
}
exports.animationClipCacheManager = new AnimationClipCacheManager();
