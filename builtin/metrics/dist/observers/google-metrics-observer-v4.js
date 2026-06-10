Object.defineProperty(exports, "__esModule", { value: true });
exports.googleG4MetricsObserver = undefined;
exports.GoogleG4MetricsObserver = undefined;

const { readJSONSync } = require("fs-extra");

const metrics_observer_base_1 = require("./metrics-observer-base");
const MeasurementId = "G-JXC4Z86YBG";
const ApiSecret = "OtGhpiWGSCmHl0xjL1P5TQ";
const QueryParams = `?&measurement_id=${MeasurementId}&api_secret=` + ApiSecret;
const HOST = "www.google-analytics.com";
const PATH = "/mp/collect" + QueryParams;
const Debug_PATH = "/debug/mp/collect" + QueryParams;

const { sendHttpRequest } = require("./request");

const log_1 = require("../libs/log");

const { join } = require("path");

const electron_1 = require("electron");
const headers = { "Content-Type": "application/json", "User-Agent": "" };
let g4Table;
class GoogleG4MetricsObserver extends metrics_observer_base_1.MetricsObserverBase {
  static get googleG4ID() {
    return "G-JXC4Z86YBG";
  }
  DEBUG = false;
  session_id = "";
  params = {
    app_name: "",
    app_id: "",
    app_version: "",
    scale_factor: "",
    language: "",
    arch: "",
  };
  time = Date.now();
  firstTime = new Date();
  _reportEvents = [];
  htmlUrl = "";
  async getHtmlUrl() {
    var e;

    if (!this.htmlUrl) {
      e = (await Editor.Message.request("server", "query-port")) || 7456;
      this.htmlUrl = `http://localhost:${e}/a032ffca62d9edac706b578840ab182b/index.html`;
      this.limitGoogleG4Request(this.htmlUrl);
    }

    return this.htmlUrl;
  }
  limitGoogleG4Request(s) {
    electron_1.session.defaultSession.webRequest.onBeforeSendHeaders((e, t) => {
      if (e.url.startsWith(s)) {
        e.requestHeaders["x-custom-header"] =
          "2c2d5f6b07c59e4a4595501a71e93b7c";
      }

      t({ requestHeaders: e.requestHeaders });
    });
  }
  getReportEvents() {
    var e = JSON.parse(JSON.stringify(this._reportEvents));
    this._reportEvents.length = 0;
    return e;
  }
  trackEvent(e, t) {
    if (!e.sendToCocosAnalyticsOnly) {
      if (t.cid) {
        if (e.category) {
          if (e.category !== "editor" || e.value.A100002 === undefined) {
            g4Table =
              g4Table ||
              readJSONSync(join(__dirname, "../../statics/googleG4Table.json"));
            const e_category = e.category;
            const l = Object.assign({}, e);
            delete l.sendToGoogleG4;
            delete l.sendToNewCocosAnalyticsOnly;
            delete l.category;
            let a = e.action ? e_category + "_" + e.action : e_category;
            let o = [];
            let i = "";

            if (typeof l.value == "object") {
              delete l.value.projectID;

              Object.keys(l.value).forEach((e) => {
                var t;
                var s;
                var r;

                if (e !== "project_id") {
                  t = l.value[e];

                  s = Object.assign({
                    action: e_category,
                    value: t,
                    count: t,
                    time: t,
                    baseKey: e,
                  });

                  r = (r = e.split("_")).length > 1 ? r : [e];

                  i =
                    (e.startsWith("A")
                      ? ((s.action = r[0]),
                        r[1] !== undefined && (s.label = r[1]))
                      : ((a = e_category),
                        (s.action = e_category),
                        (s.label = e)),
                    e_category + "_" + r[0]);

                  (e = g4Table[i + "_" + r[1]] || g4Table[i]) &&
                    ((s.action = e.action),
                    e.label.includes("{*}")
                      ? (s.label = e.label.replace(/{\*}/g, r[1] ?? t))
                      : e.label && (s.label = e.label));

                  o = o.concat(this.createNewEvent(e_category, s));
                }
              });
            } else {
              o = [this.createNewEvent(a, l)];
            }

            this.sendToGA4(this.createNewData(t, o));
          }
        } else {
          console.debug("Metrics: no valid info. trackEventInfo: ", e);
        }
      } else {
        console.debug("Metrics: no valid client ID, trackEventInfo: ", e);
      }
    }
  }
  trackException(e, t) {
    if (t.cid) {
      this.sendToGA4(
        this.createNewData(t, [
          this.createNewEvent("exception", {
            description: e.code + "-" + e.message,
            fatal: true,
          }),
        ])
      );
    } else {
      console.debug("Metrics: no valid client ID, trackEventInfo: ", t);
    }
  }
  sendAppInfo(e) {
    this.DEBUG = e.debug !== undefined ? e.debug : this.DEBUG;
    var { App, I18n } = this.getEditor();
    headers["User-Agent"] = App.userAgent;
    this.time = Date.now();
    this.firstTime = new Date();
    this.session_id = e.uid + "_" + this.time;

    this.params = {
      app_name: Editor.App.name,
      app_id: "com.cocos.creator",
      app_version: App.version,
      scale_factor: e.scaleFactor || "1",
      language: I18n.getLanguage() || "unknown",
      arch: process.arch,
    };
  }
  close(e) {
    e = this.createNewData(e, [
      this.createNewEvent("close", { action: "close" }),
    ]);
    this.sendToGA4(e);
  }
  getEditor() {
    return Editor;
  }
  createNewData(e, t) {
    return {
      client_id: String(e.cid),
      user_id: String(e.uid),
      timestamp_micros: String(1000 /* 1e3 */ * Date.now()),
      events: t || [],
    };
  }
  createNewEvent(e, t) {
    return {
      name: (e = (e = e.replace(/ +/g, "")).replace(/[^A-Za-z0-9_]/g, "_")),
      params: Object.assign({}, this.params, t),
    };
  }
  sendToGA4(e) {
    if (this.DEBUG) {
      console.debug("start analytics... ", JSON.stringify(e));
    }

    this._reportEvents = this._reportEvents.concat(e.events);

    if (this.DEBUG) {
      log_1.logMgr.collectToFile("[sendToGA4]", JSON.stringify(e.events));
    }

    Editor.Message.broadcast("metrics:google-v4-report-change");
  }
  sendToNormalGA4(s) {
    var e = {
      method: "POST",
      protocol: "https",
      host: HOST,
      path: PATH,
      headers,
      data: JSON.stringify(s),
      useStringifyData: false,
    };
    const r = Date.now();

    if (this.DEBUG) {
      log_1.logMgr.collectToFile("[send analytics ga4]: " + r, s);
    }

    sendHttpRequest(e, (e, t) => {
      if (e) {
        if (this.DEBUG) {
          log_1.logMgr.collectToFile("[send analytics ga4 fail]: " + r, e);
        }
      } else if (this.DEBUG) {
        log_1.logMgr.collectToFile("[send analytics ga4 done]: " + r, s);
      }
    });
  }
  sendToDebugGA4(r) {
    var e = {
      method: "POST",
      protocol: "https",
      host: HOST,
      path: Debug_PATH,
      headers,
      data: JSON.stringify(r),
      useStringifyData: false,
    };
    sendHttpRequest(e, (e, t) => {
      try {
        var s;

        if (e) {
          console.debug(e);
        } else if (!(s = JSON.parse(t).validationMessages) || s.length > 0) {
          console.debug(
            `sending failure.
  `,
            s,
            JSON.stringify(r)
          );
        } else {
          this.sendToNormalGA4(r);
        }
      } catch (e) {
        console.debug(
          "sending failure. \n",
          `error: 
`,
          e,
          `content: 
`,
          t
        );
      }
    });
  }
}
exports.GoogleG4MetricsObserver = GoogleG4MetricsObserver;
exports.googleG4MetricsObserver = new GoogleG4MetricsObserver();
