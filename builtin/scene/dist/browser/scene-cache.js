Object.defineProperty(exports, "__esModule", { value: true });
exports.sceneCacheManager = undefined;
exports.SceneCacheManager = undefined;
exports.getCachePath = getCachePath;

const { join, basename, extname } = require("path");

const { remove, readJSONSync, readdir, outputJSONSync } = require("fs-extra");

const { existsSync, statSync } = require("fs");

const { createHash } = require("crypto");

const _ = require("lodash");
const SCENE_CACHE_DIR = join(Editor.Project.tmpDir, "scene/cache");
const UnSaveSceneId = "unSave";
async function safeRemove(e) {
  if (existsSync(e)) {
    await remove(e);
  }
}
class SceneCacheManager {
  cacheTimerList = {};
  cacheJsonList = {};
  saveSceneCache;
  saveJsonToFile;
  _currentSceneUUID = "";
  _mode = "general";
  _disabled = false;
  _saveInterval = 5000 /* 5e3 */;
  _maxFileNum = 3;
  _hasInit = false;
  _eventList = {};
  _sceneReady = false;
  _sceneReadyTimer;
  _cacheInfo;
  _systemInfo;
  _deviceMd5 = "";
  _unSaveSceneUUID = "";
  constructor() {
    var e = require("os");

    this._systemInfo = {
      arch: e.arch(),
      cpu: e.cpus()[0].model,
      version: e.version(),
    };

    this._deviceMd5 = this._calcDeviceInfoMd5(this._systemInfo);

    this._cacheInfo = {
      systemInfo: this._systemInfo,
      sceneListMap: {},
      deviceMd5: this._deviceMd5,
    };
  }
  set disabled(e) {
    if (e !== this._disabled) {
      if ((this._disabled = e)) {
        this._removeEventListener();
      } else {
        this.init();
      }
    }
  }
  get disabled() {
    return this._disabled || this._mode !== "general";
  }
  async getCurrentSceneUUID() {
    if (!this._currentSceneUUID) {
      this._currentSceneUUID = await Editor.Message.request(
        "scene",
        "query-current-scene",
        true
      );
    }

    return this._currentSceneUUID;
  }
  async getCurrentCacheID(e) {
    var t;
    return this._unSaveSceneUUID === e
      ? UnSaveSceneId
      : (t = await Editor.Message.request("asset-db", "query-asset-info", e)) &&
        t.visible
      ? e
      : ((this._unSaveSceneUUID = e), UnSaveSceneId);
  }
  async updateConfig() {
    var e = await Editor.Profile.getConfig("scene", "scene_cache");
    this.disabled = !e.use;
    this._saveInterval = e.interval;
    this._maxFileNum = e.maxFileNum;
  }
  async init() {
    if (this._hasInit) {
      this._addEventListener();
    } else {
      await this.updateConfig();

      if (this.disabled) {
        console.log("The scene cache function is turned off");
      } else {
        this.saveSceneCache = _.throttle(
          () => {
            this._saveSceneDump();
          },
          this._saveInterval,
          { leading: true, trailing: true }
        );

        this.saveJsonToFile = _.debounce(
          (e, t, s) => {
            this._saveJsonToFile(e, t, s);
          },
          this._saveInterval + 300,
          { leading: true }
        );

        if (await Editor.Message.request("asset-db", "query-ready")) {
          this._initSceneCacheMap();
        } else {
          const e = () => {
            this._initSceneCacheMap();

            Editor.Message.__protected__.removeBroadcastListener(
              "asset-db:ready",
              e
            );
          };
          Editor.Message.__protected__.addBroadcastListener(
            "asset-db:ready",
            e
          );
        }

        this._hasInit = true;
        this._addEventListener();
      }
    }
  }
  async _initSceneCacheMap() {
    if (existsSync(SCENE_CACHE_DIR)) {
      var t = join(SCENE_CACHE_DIR, "info.json");
      let e = false;
      try {
        this._cacheInfo = readJSONSync(t);
        this._cacheInfo.sceneListMap = this._cacheInfo.sceneListMap || {};
        e = true;
      } catch (e) {
        this._cacheInfo = {
          systemInfo: this._systemInfo,
          sceneListMap: {},
          deviceMd5: this._deviceMd5,
        };
      }
      var s = await readdir(SCENE_CACHE_DIR);

      await Promise.all(
        s.map(async (t) => {
          var e;
          var s;

          var a =
            t &&
            (await Editor.Message.request("asset-db", "query-asset-info", t));

          var i = getCacheDirWithId(t);

          if (a || t === UnSaveSceneId) {
            (e = (await readdir(join(SCENE_CACHE_DIR, t))).map((e) =>
              Number(basename(e, extname(e)))
            )).sort((e, t) => e - t);

            s = e.splice(this._maxFileNum - 1, e.length - this._maxFileNum);
            await Promise.all(s.map((e) => safeRemove(getCachePath(t, e))));

            (a && a.file !== this._cacheInfo.sceneListMap[t]) ||
            this._deviceMd5 !== this._cacheInfo.deviceMd5
              ? (console.debug(
                  `invalid cache: uuid(${t}} file(${a && a.file})`
                ),
                await safeRemove(i),
                delete this._cacheInfo.sceneListMap[t])
              : (a && (this._cacheInfo.sceneListMap[t] = a.file),
                (this.cacheTimerList[t] = e));
          } else {
            await safeRemove(i);
          }
        })
      );

      this._cacheInfo.systemInfo = this._systemInfo;
      this._cacheInfo.deviceMd5 = this._deviceMd5;

      console.debug(
        "init cacheTimerList " + JSON.stringify(this.cacheTimerList)
      );

      if (!e) {
        outputJSONSync(t, this._cacheInfo, { spaces: 4 });
      }
    }
  }
  async _addEventListener() {
    if (this._hasInit && !Object.keys(this._eventList).length) {
      this._eventList = {
        "scene:save": this.onSceneSaved.bind(this),
        "scene:change-node": this.saveSceneCache.bind(this),
        "asset-db:asset-delete": this.onAssetDelete.bind(this),
        "scene:change-mode": (e) => (this._mode = e),
      };

      Object.keys(this._eventList).forEach((e) => {
        Editor.Message.__protected__.addBroadcastListener(
          e,
          this._eventList[e]
        );
      });
    }
  }
  async _removeEventListener() {
    if (this._hasInit && Object.keys(this._eventList).length) {
      Object.keys(this._eventList).forEach((e) => {
        Editor.Message.__protected__.removeBroadcastListener(
          e,
          this._eventList[e]
        );
      });

      this._eventList = {};
    }
  }
  async _saveJsonToFile(e, t, s) {
    try {
      outputJSONSync(getCachePath(e, t), s, { spaces: 4 });
    } catch (e) {
      console.log(e);
    }
  }
  onSceneSaved(e) {
    this._unSaveSceneUUID = "";
  }
  async queryLatestCache(e) {
    var t = await this.getCurrentCacheID(e);
    if (!this.disabled && (this.cacheJsonList[t] || this.cacheTimerList[t])) {
      var e =
        (e &&
          (await Editor.Message.request("asset-db", "query-asset-info", e))) ||
        null;

      var s = this.cacheTimerList[t];
      var a = (e && statSync(e.file).mtimeMs) || 0;
      if (this.cacheJsonList[t] && this.cacheJsonList[t][0].time > a) {
        return { url: (e && e.url) || "", ...this.cacheJsonList[t][0] };
      }
      if (s && s[s.length - 1] > a) {
        a = getCachePath(t, s[s.length - 1]);
        if (existsSync(a)) {
          return { time: s[s.length - 1], file: a, url: (e && e.url) || "" };
        }
      }
    }
  }
  async onAssetDelete(e, t) {
    if (t?.type === "cc.SceneAsset") {
      await this.clearSceneCache(e);
    }
  }
  async clearSceneCache(e) {
    if (!this.disabled) {
      if ((e = e || (await this.getCurrentSceneUUID()))) {
        await safeRemove(
          getCacheDirWithId((e = await this.getCurrentCacheID(e)))
        );

        delete this.cacheTimerList[e];
        delete this.cacheJsonList[e];
        this._currentSceneUUID = "";
      }
    }
  }
  async save() {
    var e;

    if (!this.disabled) {
      e = join(SCENE_CACHE_DIR, "info.json");
      outputJSONSync(e, this._cacheInfo, { spaces: 4 });
    }
  }
  _calcDeviceInfoMd5(e) {
    return createHash("md5").update(JSON.stringify(e)).digest("hex");
  }
  async onSceneReady(e) {
    this._sceneReady = false;
    this._currentSceneUUID = e;
    this.clearSceneCache(e);

    this._sceneReadyTimer = setTimeout(() => {
      this._sceneReady = true;
    }, 1000 /* 1e3 */);
  }
  onSceneClosed() {
    if (this._sceneReadyTimer) {
      clearTimeout(this._sceneReadyTimer);
    }

    this._currentSceneUUID = "";
    this._sceneReady = false;
    this._unSaveSceneUUID = "";
  }
  async _saveSceneDump() {
    var e;
    var t;
    var s;
    var a;
    var i;
    return !(
      this.disabled ||
      !this._sceneReady ||
      !(e = await this.getCurrentSceneUUID()) ||
      !(await Editor.Message.request("scene", "query-dirty")) ||
      !(t = await Editor.Message.request("scene", "query-scene-json")) ||
      ((s = await this.getCurrentCacheID(e)),
      this.cacheJsonList[s] || (this.cacheJsonList[s] = []),
      (i = this.cacheJsonList[s]).length && i[0].data === t) ||
      ((a = Date.now()),
      i.unshift({ time: a, data: t }),
      (i.length = Math.min(this._maxFileNum, i.length)),
      this.saveJsonToFile(s, a, t),
      e &&
        !this._cacheInfo.sceneListMap[s] &&
        (i =
          e &&
          (await Editor.Message.request("asset-db", "query-asset-info", e))) &&
        (this._cacheInfo.sceneListMap[s] = i.file),
      this.save(),
      0)
    );
  }
}
function getCachePath(e, t) {
  return join(SCENE_CACHE_DIR, e, t + ".json");
}
function getCacheDirWithId(e) {
  return join(SCENE_CACHE_DIR, e);
}
exports.SceneCacheManager = SceneCacheManager;
exports.sceneCacheManager = new SceneCacheManager();
