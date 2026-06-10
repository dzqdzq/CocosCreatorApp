Object.defineProperty(exports, "__esModule", { value: true });
const metrics_observer_base_1 = require("./metrics-observer-base");
const log_1 = require("../libs/log");
const encrypt = require("./cocos-encrypt");
const uuid = require("node-uuid");
function createParam(e, t) {
  return {
    appVersion: Editor.App.version,
    versionCode: "v1",
    uniqueID: t.uid,
    appID: module.exports._analyticsID,
    channelID: "100000",
    platform: process.platform === "darwin" ? "Mac" : "Windows",
    engine: "electron",
    userID: t.uid,
    resolution: t.resolution || "unknown",
    scaleFactor: t.scaleFactor || "1",
    osVersion: require("os").version(),
    manufacturer: "",
    store: "unknown",
    age: 0,
    sex: 0,
    callNumber: t.useTestServer ? "demo.cocos.com" : "creator.cocos.com",
    model: null,
    msgID: uuid.v4(),
    chargeTime: String((Date.now() / 1000) /* 1e3 */ | 0),
    language: Editor.I18n.getLanguage() || "unknown",
  };
}
async function sendData(e, t, o = false) {
  var n = Date.now();

  if (o) {
    log_1.logMgr.collectToFile("send cocos analytics: " + n, t);
  }

  try {
    await Editor.Network.post(e, t);

    if (o) {
      log_1.logMgr.collectToFile("send cocos analytics done: " + n, t);
    }
  } catch (e) {
    if (o) {
      log_1.logMgr.collectToFile("send cocos analytics fail: " + n, e);
    }
  }
}
class CocosMetricsObserver extends metrics_observer_base_1.MetricsObserverBase {
  _caURL;
  _analyticsID = "681395864";
  constructor() {
    super();
    this._caURL = "https://logstorage.cocos.com/log/v2?";
  }
  trackEvent(e, t) {
    if (t.cid) {
      if (e.sendToCocosAnalyticsOnly || e.sendToNewCocosAnalyticsOnly) {
        this.trackCocosEvent(e, t);
      } else {
        this.trackNormalEvent(e, t);
      }
    } else {
      console.debug("Metrics: no valid client ID");
    }
  }
  trackNormalEvent(e, t) {
    var o = { ...(e.opts || e.value || {}) };
    o.action = e.action;

    if (e.label) {
      o.label = e.label;
    }

    let n = "succeed";

    if (e.opts && e.opts.eventTag) {
      n = e.opts.eventTag;
      delete o.eventTag;
    }

    var a = createParam(e, t);
    a.eventID = e.category;
    a.eventValue = o;
    a.eventTag = n;

    if (e.exitTag) {
      a.exitTag = e.exitTag;
      a.eventTag = e.exitTag;
    }

    if (e.onlineDuration) {
      a.onlineDuration = e.onlineDuration;
    }

    delete e.onlineDuration;

    if (t.debug) {
      console.debug("send cocos analytics ---\x3e", JSON.stringify(a));
    }

    sendData(
      this._caURL,
      encodeURIComponent(encrypt.encryptPostData(JSON.stringify(a))),
      t.debug
    );
  }
  trackCocosEvent(e, t) {
    var o;
    var n;

    if (e.sendToNewCocosAnalyticsOnly) {
      delete e.sendToCocosAnalyticsOnly;
      this.trackNewCocosEvent(e, t);
    } else if (e.eventId) {
      delete e.sendToCocosAnalyticsOnly;
      o = createParam(e, t);
      e.store && ((o.store = e.store), delete e.store);

      e.packageName && ((o.packageName = e.packageName), delete e.packageName);

      n = e.eventId;
      delete e.eventId;
      o.eventID = n;
      o.eventValue = e;
      o.eventTag = "succeed";
      e.onlineDuration && (o.onlineDuration = e.onlineDuration);
      delete e.onlineDuration;

      t.debug &&
        console.debug("send cocos analytics ---\x3e", JSON.stringify(o));

      sendData(
        this._caURL,
        encodeURIComponent(encrypt.encryptPostData(JSON.stringify(o))),
        t.debug
      );
    } else {
      console.debug("Metrics: no valid eventId");
    }
  }
  trackNewCocosEvent(e, t) {
    delete e.sendToNewCocosAnalyticsOnly;
    var o = createParam(e, t);
    o.eventID = e.category;
    o.eventValue = e.value;

    if (o.eventValue && e.projectID) {
      o.eventValue.projectID = e.projectID;
    }

    if (t.debug) {
      console.debug("send cocos analytics ---\x3e", JSON.stringify(o));
    }

    o.eventTag = "successed";

    sendData(
      this._caURL,
      encodeURIComponent(encrypt.encryptPostData(JSON.stringify(o))),
      t.debug
    );
  }
  trackException(e, t) {
    var o;

    if (t.cid) {
      o = createParam({}, t);
      o.eventID = "exception";
      o.eventValue = { code: e.code, desc: e.message };
      o.eventTag = "succeed";
      sendData(this._caURL, encodeURIComponent(JSON.stringify(o)), t.debug);
    } else {
      console.debug("Metrics: no valid client ID");
    }
  }
  sendAppInfo(e) {}
  close(e) {}
  async _trackCrashEvent(e, t) {
    try {
      var o = createParam(e, t);

      o.eventID = e.category;
      o.eventValue = e.value;

      if (o.eventValue && e.projectID) {
        o.eventValue.projectID = e.projectID;
      }

      if (t.debug) {
        console.debug("send cocos analytics ---\x3e", JSON.stringify(o));
      }

      o.eventTag = "successed";
      var n = encodeURIComponent(encrypt.encryptPostData(JSON.stringify(o)));

      if (t.debug) {
        console.debug("receive cocos analytics data --\x3e", n);
      }

      await Editor.Network.post(this._caURL, n);
      return o;
    } catch (e) {
      if (t.debug) {
        console.debug("send cocos analytics data fail", e);
      }

      throw e;
    }
  }
}
module.exports = new CocosMetricsObserver();
