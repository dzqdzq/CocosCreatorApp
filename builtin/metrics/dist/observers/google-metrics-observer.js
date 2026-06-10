Object.defineProperty(exports, "__esModule", { value: true });
const metrics_observer_base_1 = require("./metrics-observer-base");

const { sendHttpRequest } = require("./request");

const log_1 = require("../libs/log");
const TrackingID = "UA-60734607-3";
function sendData(t, o = false) {
  const s = Date.now();

  if (o) {
    log_1.logMgr.collectToFile("send analytics: " + s, t);
  }

  sendHttpRequest(
    {
      method: "POST",
      host: "www.google-analytics.com",
      path: "/collect",
      protocol: "https",
      data: t,
    },
    (e) => {
      if (e) {
        if (o) {
          log_1.logMgr.collectToFile("send analytics fail: " + s, e);
        }
      } else if (o) {
        log_1.logMgr.collectToFile("send analytics done: " + s, t);
      }
    }
  );
}
class GoogleMetricsObserver extends metrics_observer_base_1.MetricsObserverBase {
  _trackID;
  constructor() {
    super();
    this._trackID = TrackingID;
  }
  trackEvent(e, t) {
    var o;

    if (!e.sendToCocosAnalyticsOnly && !e.sendToNewCocosAnalyticsOnly) {
      if (t.cid) {
        if (e.category && e.action) {
          o = {
            v: 1,
            tid: this._trackID,
            cid: t.cid,
            uid: t.uid,
            t: "event",
            ec: e.category,
            ea: e.action,
          };

          e.label && (o.el = e.label);
          e.value && (o.ev = e.value);

          t.debug &&
            console.debug(
              "send trackEvent analytics ---\x3e",
              JSON.stringify(o)
            );

          sendData(o, t.debug);
        } else {
          console.debug("Metrics: no valid info");
        }
      } else {
        console.debug("Metrics: no valid client ID");
      }
    }
  }
  trackException(e, t) {
    if (t.cid) {
      e = {
        v: 1,
        tid: this._trackID,
        cid: t.cid,
        uid: t.uid,
        t: "exception",
        exd: e.code + "-" + e.message,
        exf: 0,
      };

      t.debug &&
        console.debug(
          "send trackException analytics ---\x3e",
          JSON.stringify(e)
        );

      sendData(e, t.debug);
    } else {
      console.debug("Metrics: no valid client ID");
    }
  }
  sendAppInfo(e) {
    var t = {
      v: 1,
      tid: this._trackID,
      cid: e.cid,
      uid: e.uid,
      t: "screenView",
      an: Editor.App.name,
      aid: "com.cocos.creator",
      av: Editor.App.version,
      cd: "Home",
      sc: "start",
      sr: e.resolution || "unknown",
      cd1: e.scaleFactor || "1",
      ul: Editor.I18n.getLanguage() || "unknown",
      ua: Editor.App.userAgent,
    };

    if (e.debug) {
      console.debug("send sendAppInfo analytics ---\x3e", JSON.stringify(t));
    }

    sendData(t, e.debug);
  }
  close(e) {}
}
module.exports = new GoogleMetricsObserver();
