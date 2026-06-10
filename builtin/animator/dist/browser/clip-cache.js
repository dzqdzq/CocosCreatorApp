Object.defineProperty(exports, "__esModule", { value: true });
exports.animationClipCacheManager = undefined;
exports.getCachePath = getCachePath;

const { join, basename, extname } = require("path");

const { readdir, outputFile } = require("fs-extra");

const { existsSync, statSync } = require("fs");

const electron_1 = require("electron");
const _ = require("lodash");

const ANIMATION_CACHE_DIR = join(Editor.Project.tmpDir, "animator/cache");

class AnimationClipCacheManager {
  cacheTimerList = {};
  cacheJsonList = {};
  save;
  saveJsonToFile;
  _saveInterval = 5000 /* 5e3 */;
  _maxFileNum = 5;
  _disabled = false;
  _hasInit = false;
  set disabled(e) {
    if (e !== this._disabled && !(this._disabled = e)) {
      this.init();
    }
  }
  get disabled() {
    return this._disabled;
  }
  async updateConfig() {
    var e = await Editor.Profile.getConfig("animator", "clip_cache");
    this.disabled = !e.use;
    this._saveInterval = e.interval;
    this._maxFileNum = e.maxFileNum;
  }
  async _initClipCacheMap() {
    var e;

    if (existsSync(ANIMATION_CACHE_DIR)) {
      e = await readdir(ANIMATION_CACHE_DIR);

      await Promise.all(
        e.map(async (t) => {
          var e;
          var a;

          if (await Editor.Message.request("asset-db", "query-asset-info", t)) {
            (e = (await readdir(join(ANIMATION_CACHE_DIR, t))).map((e) =>
              Number(basename(e, extname(e)))
            )).sort((e, t) => Number(t) - Number(e));

            a = e.splice(0, this._maxFileNum - 1);

            e.length &&
              (await Promise.all(
                e.map((e) => electron_1.shell.trashItem(getCachePath(t, e)))
              ));

            this.cacheTimerList[t] = a;
          }
        })
      );
    }
  }
  async init() {
    if (this._hasInit) {
      return true;
    }
    await this.updateConfig();

    if (this.disabled) {
      console.log("The clip cache function is turned off");
      return false;
    }

    this.save = _.throttle(
      (e, t) => {
        this._saveClipDump(e, t);
      },
      this._saveInterval,
      { leading: true, trailing: true }
    );

    this.saveJsonToFile = _.debounce(
      (e, t, a) => {
        this._saveJsonToFile(e, t, a);
      },
      this._saveInterval + 300,
      { leading: true }
    );

    if (await Editor.Message.request("asset-db", "query-ready")) {
      await this._initClipCacheMap();
    } else {
      const e = async () => {
        await this._initClipCacheMap();

        Editor.Message.__protected__.removeBroadcastListener(
          "asset-db:ready",
          e
        );
      };
      Editor.Message.__protected__.addBroadcastListener("asset-db:ready", e);
    }

    this._hasInit = true;
  }
  async queryLatestCache(e) {
    if (!this.disabled && (this.cacheJsonList[e] || this.cacheTimerList[e])) {
      var t = await Editor.Message.request("asset-db", "query-asset-info", e);
      if (t) {
        var a = this.cacheTimerList[e];
        var i = statSync(t.file).mtimeMs;
        if (this.cacheJsonList[e] && this.cacheJsonList[e][0].time > i) {
          return { url: t.url, ...this.cacheJsonList[e][0] };
        }
        if (a && a[a.length - 1] > i) {
          i = getCachePath(e, a[a.length - 1]);
          if (existsSync(i)) {
            return { time: a[a.length - 1], file: i, url: t.url };
          }
        }
      }
    }
    return null;
  }
  async _saveClipDump(e, t) {
    var e = await Editor.Message.request("scene", "execute-scene-script", {
      name: "animator",
      method: "queryClipDump",
      args: [e, t],
    });

    if (!this.cacheJsonList[t]) {
      this.cacheJsonList[t] = [];
    }

    var a = this.cacheJsonList[t];
    if ((a.length && a[0].data === e) || !e) {
      return false;
    }
    var i = Date.now();
    a.unshift({ time: i, data: e });
    a.length = Math.min(this._maxFileNum, a.length);
    this.saveJsonToFile(t, i, e);
  }
  async _saveJsonToFile(e, t, a) {
    return outputFile(getCachePath(e, t), a);
  }
}
function getCachePath(e, t) {
  return join(ANIMATION_CACHE_DIR, e, t + ".json");
}
exports.animationClipCacheManager = new AnimationClipCacheManager();
