Object.defineProperty(exports, "__esModule", { value: true });
exports.Metrics = undefined;

const { getClientID, getMainDisplay } = require("../utils");

const log_1 = require("./log");
const google_metrics_observer_v4_1 = require("../observers/google-metrics-observer-v4");
class Metrics {
  _clientID = "";
  _userID = "";
  _metricsDebugMode = false;
  _init = false;
  _eventGroup = {};
  _timer;
  _metricsObservers = [];
  get trackInfoList() {
    return Editor.Metrics.__protected__.getTrackInfoList();
  }
  get trackTimeStartMap() {
    return Editor.Metrics.__protected__.getTrackTimeStartMap();
  }
  get processMemoryMap() {
    return Editor.Metrics.__protected__.getProcessMemoryMap();
  }
  get metricInitData() {
    return Editor.Metrics.__protected__.getMetricInitData();
  }
  set metricInitData(e) {
    Editor.Metrics.__protected__.setMetricInitData(e);
  }
  get trackAwaitHandler() {
    return Editor.Metrics.__protected__.getTrackAwaitHandler();
  }
  replyAsyncFunction(t, e, r) {
    var i = this.trackAwaitHandler.findIndex((e) => e.index === t);

    var s = this.trackAwaitHandler[i];

    if (s) {
      this.trackAwaitHandler.splice(i, 1);
      e ? s.reject(e) : s.resolve(r);
    }
  }
  addMetricsObserver(e) {
    if (!this._metricsObservers.includes(e)) {
      this._metricsObservers.push(e);
    }
  }
  getTrackInfoMapByTime(t) {
    var e = this.trackInfoList.findIndex((e) => e.index === t);

    var r = this.trackInfoList[e];
    if (r) {
      this.trackInfoList.splice(e, 1);
      return r;
    }
  }
  register() {
    var e = Editor.Metrics.__protected__;
    e.register("init", this.init.bind(this));
    e.register("clear", this.clear.bind(this));
    e.register("close", this.close.bind(this));
    e.register("trackEvent", this.trackEvent.bind(this));
    e.register("trackException", this.trackException.bind(this));
    e.register("trackProcessMemory", this.trackProcessMemory.bind(this));
    e.register("trackTimeStart", this.trackTimeStart.bind(this));
    e.register("trackTimeEnd", this.trackTimeEnd.bind(this));

    e.register(
      "trackProcessMemoryStart",
      this.trackProcessMemoryStart.bind(this)
    );

    e.register("trackProcessMemoryEnd", this.trackProcessMemoryEnd.bind(this));

    e.register("_trackEventWithTimer", this._trackEventWithTimer.bind(this));
    e.register("_sendEventGroup", this._sendEventGroup.bind(this));
    e.register("_trackCrashEvent", this._trackCrashEvent.bind(this));

    setInterval(() => {
      this.sync();
    }, 1800000 /* 18e5 */);
  }
  async sync() {
    if (this.metricInitData) {
      await this.init();
      this.metricInitData = undefined;
    }

    var t = [...this.trackInfoList];
    for (let e = 0; e < t.length; e++) {
      var r = t[e];
      var r_index = r.index;
      var s = this[r.funcName];
      if (s) {
        let e = null;
        let t = null;
        try {
          var o = s.constructor.name === "AsyncFunction";
          e = o
            ? await Promise.resolve(s.bind(this)(r_index))
            : s.bind(this)(r_index);
        } catch (e) {
          t = new Error(e.message);
        }
        this.replyAsyncFunction(r_index, t, e);
      } else {
        console.debug("Function not queried " + r.funcName);
      }
    }
    Editor.Metrics.__protected__.reset();
  }
  clear() {
    log_1.logMgr.collectToFile(
      "[clear]",
      JSON.stringify({
        trackInfoList: this.trackInfoList,
        trackAwaitHandler: this.trackAwaitHandler,
      })
    );
  }
  async init() {
    if (this.metricInitData) {
      var e = this.metricInitData.outputMetricLog;
      this._clientID = await getClientID();
      var t = await Editor.User.getData();

      var t =
        ((this._userID = t && t.cocos_uid ? t.cocos_uid : "-1"),
        (this._metricsDebugMode = !!(await Editor.Profile.getConfig(
          "metrics",
          "analytics-debug"
        ))),
        await log_1.logMgr.init(e, this._metricsDebugMode),
        !!(await Editor.Profile.getConfig("metrics", "disable-analytics-ga")));

      if (!t) {
        this.addMetricsObserver(
          require("../observers/google-metrics-observer")
        );
      }

      this.addMetricsObserver(
        google_metrics_observer_v4_1.googleG4MetricsObserver
      );

      var e = require("../observers/cocos-metrics-observer");

      try {
        var r =
          require("../../package.json").contributions.profile.editor.appID
            .default;

        if (r) {
          e._analyticsID = r;
        }
      } catch (e) {
        console.error(e);
      }
      this.addMetricsObserver(e);
      t = getMainDisplay();
      const i = {
        cid: this._clientID,
        uid: this._userID,
        debug: this._metricsDebugMode ?? false,
        resolution: t.size.width + "x" + t.size.height,
        scaleFactor: "" + t.scaleFactor,
      };

      this._metricsObservers.forEach((e) => {
        e.sendAppInfo(i);
      });

      this._init = true;
    }
  }
  trackEvent(e) {
    if (this._userID) {
      e = this.getTrackInfoMapByTime(e);
      if (e) {
        const t = {
          cid: this._clientID,
          uid: this._userID,
          debug: this._metricsDebugMode || false,
          useTestServer: this._metricsDebugMode || false,
        };

        const e_info = e.info;
        try {
          if (!e_info.sendToCocosAnalyticsOnly) {
            delete e_info.sendToCocosAnalyticsOnly;
          }

          if (!e_info.sendToNewCocosAnalyticsOnly) {
            delete e_info.sendToNewCocosAnalyticsOnly;
          }
        } catch (e) {
          console.debug(e);
        }
        e_info.projectID = Editor.Project.uuid || "";
        try {
          log_1.logMgr.collectToFile("[trackEvent]", JSON.stringify(e_info));

          this._metricsObservers.forEach((e) => {
            e.trackEvent(e_info, t);
          });
        } catch (e) {
          console.debug(e);
        }
      }
    }
  }
  close() {
    const t = {
      cid: this._clientID,
      uid: this._userID,
      debug: this._metricsDebugMode || false,
      useTestServer: this._metricsDebugMode || false,
    };
    log_1.logMgr.collectToFile("[close]", JSON.stringify(t));

    this._metricsObservers.forEach((e) => {
      e.close(t);
    });
  }
  _trackEventWithTimer(e) {
    e = this.getTrackInfoMapByTime(e);
    if (e && e.info) {
      var t;
      var e = e.info;
      try {
        log_1.logMgr.collectToFile("[trackEventWithTimer]", JSON.stringify(e));

        if (!this._eventGroup[e.category]) {
          this._eventGroup[e.category] = {};
        }

        if (!this._eventGroup[e.category][e.id]) {
          this._eventGroup[e.category][e.id] = {};
        }

        if (typeof this._eventGroup[e.category][e.id] == "number") {
          this._eventGroup[e.category][e.id] =
            ((100 * (this._eventGroup[e.category][e.id] + e.value)) | 0) / 100;
        } else {
          this._eventGroup[e.category][e.id] = e.value;
        }

        if (!this._timer) {
          t = this._metricsDebugMode ? 60000 /* 6e4 */ : 300000 /* 3e5 */;

          this._timer = setTimeout(() => {
            if (this._timer) {
              clearTimeout(this._timer);
            }

            this._timer = undefined;
            this._sendEventGroup();
          }, t);
        }
      } catch (e) {
        console.debug(e);
      }
    }
  }
  trackException(e) {
    if (this._userID) {
      e = this.getTrackInfoMapByTime(e);
      if (e) {
        const e_info = e.info;

        const r = {
          cid: this._clientID,
          uid: this._userID,
          debug: this._metricsDebugMode || false,
        };

        try {
          this._metricsObservers.forEach((e) => {
            e.trackException(e_info, r);
          });

          log_1.logMgr.collectToFile(
            "[trackException]",
            JSON.stringify(e_info)
          );
        } catch (e) {
          console.debug(e);
        }
      }
    }
  }
  trackProcessMemory(e) {
    var t;
    var e = this.getTrackInfoMapByTime(e);

    if (e) {
      t = `[trackMemory][${process}]`;
      e = "" + JSON.stringify(e.memoryInfo);
      log_1.logMgr.collectToFile(t, e);
      console.debug(t + ":" + e);
    }
  }
  trackTimeStart() {}
  trackTimeEnd(e) {
    var t;
    var r;
    var i;
    var e = this.getTrackInfoMapByTime(e);
    return e && e.info
      ? ((t = (r = e.info).message),
        (r = r.options),
        (i = this.trackTimeStartMap),
        r.value || i.has(t)
          ? ((e = r.value || (e.time || Date.now()) - i.get(t)),
            i.delete(t),
            log_1.logMgr.collectToFile("[trackTime]" + t, e + "ms"),
            r.output &&
              ((i =
                (typeof r.label == "string" &&
                  (Editor.I18n.t(r.label.replace("i18n:", "")) || r.label)) ||
                t),
              console.debug(i + ` (${e}ms)`)),
            e)
          : void console.debug(
              `trackTimeEnd failed! Can not find the track time ${t} start`
            ))
      : -1;
  }
  trackProcessMemoryStart(e) {}
  async trackProcessMemoryEnd(e) {
    var t;
    var r;
    var i;
    var s;
    var e = this.getTrackInfoMapByTime(e);
    return e && e.info
      ? ((e = e.info),
        (r = (t = this.processMemoryMap).get(e.message) || 0),
        (s = (i = e.memory.heapUsed) - r),
        t.delete(e.message),
        log_1.logMgr.collectToFile("[trackProcessMemory]" + e.message, {
          start: r,
          end: i,
          incremental: s,
        }),
        s)
      : -1;
  }
  _sendEventGroup() {
    if (Object.keys(this._eventGroup).length) {
      log_1.logMgr.collectToFile(
        "[sendCollectData]",
        String(Object.keys(this._eventGroup).length)
      );
      const t = JSON.parse(JSON.stringify(this._eventGroup));
      this._eventGroup = {};

      Object.keys(t).forEach((e) => {
        Editor.Metrics.trackEvent({
          category: e,
          value: t[e],
          sendToNewCocosAnalyticsOnly: true,
        });
      });
    }
  }
  async _trackCrashEvent(e) {
    try {
      if (!this._userID) {
        throw new Error("User ID invalid");
      }
      var t;
      var r;
      var i = this.getTrackInfoMapByTime(e);
      if (i) {
        t = i.info;

        r = {
          cid: this._clientID,
          uid: this._userID,
          debug: this._metricsDebugMode || false,
          useTestServer: this._metricsDebugMode || false,
        };

        t.projectID = Editor.Project.uuid || "";
        log_1.logMgr.collectToFile("[trackCrashEvent]", JSON.stringify(t));

        return await require("../observers/cocos-metrics-observer")._trackCrashEvent(
          t,
          r
        );
      }
    } catch (e) {
      log_1.logMgr.collectToFile("[trackCrashEvent fail]", e);
      console.debug(e);
      throw e;
    }
  }
}
exports.Metrics = Metrics;
exports.default = new Metrics();
