Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { createCrashReport } = require("../data");

const esm_require = require("esm")(module);
const uploadMgr = esm_require("../../dist/browser/upload").uploadMgr;
const crashReportArr = [];
function load() {}
function unload() {}
exports.methods = {
  async onCrashReport(r) {
    var e = r && r.details;
    if (!e || ["crashed", "oom"].includes(e.reason)) {
      if (await Editor.Network.__protected__.testConnectServer()) {
        try {
          r.param = await Editor.Metrics.__protected__._trackCrashEvent({
            category: "crash",
            value: r.value,
          });

          if (await uploadMgr.check()) {
            const a = await createCrashReport(r);

            if (!crashReportArr.find((r) => r.process === a.process)) {
              crashReportArr.push(a);
            }

            if (await Editor.Panel.has("crash-reporter")) {
              Editor.Message.send("crash-reporter", "refresh", a);
            } else {
              Editor.Panel.open("crash-reporter", a);
            }
          }
        } catch (r) {
          console.debug(r);
        }
      } else {
        console.debug("[crash-report] Offline status, no reporting.");
      }
    }
  },
  queryCrashReportInfos() {
    return crashReportArr;
  },
  async onUpload(r) {
    if (crashReportArr.length !== 0) {
      await uploadMgr.packMultipleZipAndUpload(r, crashReportArr);
      crashReportArr.length = 0;
    }
  },
};
