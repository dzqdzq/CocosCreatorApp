Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.update = update;
exports.ready = ready;

const { join } = require("path");

const { readFileSync, existsSync } = require("fs");

const options_1 = require("./options");

const { verificationFunc } = options_1;

const lodash = require("lodash");
let panel;
exports.template = readFileSync(
  join(__dirname, "../../static/builder/view.html"),
  "utf8"
);
const methods = {
  t(e, t) {
    return Editor.I18n.t("ohos." + e, t);
  },
  async onSetSDK() {
    Editor.Message.send("preferences", "open-settings", "program");
  },
  getDefaultPackageName() {
    return options_1.defaultOptions.packageName;
  },
  async onChange(e) {
    var t = e.target.value;
    var e = e.target.getAttribute("path");
    await this.onUpdateOptions(e, t);
  },
  async onUpdateOptions(e, t) {
    var a;

    if (e) {
      a = this;
      e === "apiLevel" && (t = Number(t));
      lodash.set(a.pkgOptions, e, t);
      t = await verificationFunc(e, t, panel.options);
      a.pkgErrorMap[e] = t.error;
      a.emitChange();
    }
  },
  emitChange() {
    var e = this;
    panel.dispatch(
      "update",
      "packages." + e.pkgName,
      e.pkgOptions,
      e.pkgErrorMap
    );
  },
  async init() {
    var e = this;
    e.pkgOptions =
      lodash.get(panel.options, "packages." + panel.options.platform) || {};
    for (const a of Object.keys(options_1.defaultOptions)) {
      var t = await verificationFunc(a, e.pkgOptions[a], panel.options);
      e.pkgErrorMap[a] = t.error;
    }
    e.emitChange();
  },
};
async function update(e, t) {
  panel = this;

  if (!t || t.startsWith("packages." + panel.pkgName)) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e, t, a, p) {
  panel = this;
  var BuildPanel_Vue = BuildPanel.Vue;
  panel.options = e;
  panel.pkgName = a;
  panel.errorMap = p;

  panel.vm = new BuildPanel_Vue({
    el: panel.$.root,
    data() {
      return {
        pkgName: a,
        type: t,
        pkgOptions: options_1.defaultOptions,
        pkgErrorMap: options_1.defaultOptions,
        apiLevels: [],
        appABIList: ["armeabi-v7a", "arm64-v8a", "x86"],
      };
    },
    async mounted() {
      var e = this;

      if (e.type === "check") {
        e.pkgOptions =
          lodash.get(panel.options, "packages." + panel.pkgName) || {};
        e.pkgErrorMap = {};
      } else {
        e.init();
      }
    },
    methods,
  });
}
async function getOHOSAPILevels() {
  var e = await Editor.Message.request(
    "program",
    "query-program-info",
    "ohosSDK"
  );
  return e && e.path && existsSync(e.path) ? ["4", "5"] : [];
}
exports.$ = { root: ".ohos" };
