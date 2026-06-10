Object.defineProperty(exports, "__esModule", { value: true });
exports.previewSettingsManager = undefined;
const plugin_1 = require("./plugin");

const DefaultPreviewOptions = {
  browser: { platform: "web-desktop" },
  simulator: { platform: "windows" },
  "game-view": { platform: "web-desktop" },
};

class PreviewSettingsManager {
  cache = new Map();
  ready = false;
  waitingTaskQueue = [];
  _defaultType = "browser";
  start() {
    this.ready = true;
    this.step();
    console.debug("start preview settings manager");
  }
  close() {
    this.ready = false;
  }
  async step() {
    if (this.ready && this.waitingTaskQueue.length) {
      var s = Array.from(this.waitingTaskQueue);
      this.waitingTaskQueue = [];
      for (let e = 0; e < s.length; e++) {
        var t = s[e];
        try {
          if (this.ready) {
            const r = await t.func(...t.args);
            if (!t.resolves) {
              return;
            }
            t.resolves.forEach((e) => e(r));
          } else {
            this.waitingTaskQueue.push(t);
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }
  _addTaskToQueue(e) {
    console.log("waiting the ready of builder worker...");
    var s = this.waitingTaskQueue[this.waitingTaskQueue.length - 1];
    var t = { func: e.func, args: e.args };

    if (e.resolve) {
      t.resolves = [e.resolve];
    }

    if (
      !s ||
      s.func.name !== t.func.name ||
      t.args.toString() !== s.args.toString()
    ) {
      this.waitingTaskQueue.push(t);
      this.step();
    } else if (e.resolve) {
      s.resolves ? s.resolves.push(e.resolve) : (s.resolves = t.resolves);
      this.step();
    }
  }
  async querySettingsData(s, t) {
    return this.ready
      ? this._querySettingsData(s, t)
      : new Promise((e) => {
          this._addTaskToQueue({
            func: this._querySettingsData.bind(this),
            args: [s, t],
            resolve: e,
          });
        });
  }
  async _querySettingsData(e, s) {
    s = s || DefaultPreviewOptions[e];
    s = await Editor.Message.request("builder", "generate-preview-setting", {
      debug: true,
      platform: s.platform || "web-desktop",
      preview: true,
      startScene: s.startScene || "",
    });
    if (s && s.settings) {
      await plugin_1.pluginManager.runHooks(e, "settings", s.settings);
      this.cache.set(e, s);
      return s;
    }
    console.error("[preview-settings] query settings data error");
  }
  async queryScript2library(s, t) {
    s = s || this._defaultType;

    return this.ready
      ? this._queryScript2library(s, t)
      : new Promise((e) => {
          this._addTaskToQueue({
            func: this._queryScript2library.bind(this),
            args: [s, t],
            resolve: e,
          });
        });
  }
  async _queryScript2library(e, s) {
    if (!this.cache.has(e)) {
      await this._querySettingsData(e, s);
    }

    return this.cache.get(e).script2library;
  }
  async queryBundleConfigs(s, t) {
    s = s || this._defaultType;

    return this.ready
      ? this._queryBundleConfigs(s, t)
      : new Promise((e) => {
          this._addTaskToQueue({
            func: this._queryBundleConfigs.bind(this),
            args: [s, t],
            resolve: e,
          });
        });
  }
  async _queryBundleConfigs(e, s) {
    if (!this.cache.has(e)) {
      await this._querySettingsData(e, s);
    }

    return this.cache.get(e).bundleConfigs;
  }
}
exports.previewSettingsManager = new PreviewSettingsManager();
