Object.defineProperty(exports, "__esModule", { value: true });
exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.template = undefined;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const options_1 = require("./options");
const lodash = require("lodash");
let panel;
exports.template = fs_extra_1.readFileSync(
  path_1.join(__dirname, "../../static/builder/view.html"),
  "utf8"
);
const methods = {
  t(e, t) {
    return Editor.I18n.t("openharony." + e, t);
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
      t = await options_1.verificationFunc(e, t, panel.options);
      a.pkgErrorMap[e] = t.error;
      a.emitChange();
    }
  },
  async onChangeABI(e, t) {
    var a = this;
    var e = e.target.value;

    if (!Array.isArray(a.pkgOptions.appABIs)) {
      a.pkgOptions.appABIs = [];
    }

    if (e) {
      a.pkgOptions.appABIs.push(t);
    } else {
      a.pkgOptions.appABIs.splice(a.pkgOptions.appABIs.indexOf(t), 1);
    }

    await a.onUpdateOptions("appABIs", a.pkgOptions.appABIs);
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
      var t = await options_1.verificationFunc(
        a,
        e.pkgOptions[a],
        panel.options
      );
      e.pkgErrorMap[a] = t.error;
    }
    this.emitChange();
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
        appABIList: ["armeabi-v7a", "arm64-v8a"],
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
function getAPILevels() {
  if (!process.env.OHOS_SDK_HOME) {
    console.warn(Editor.I18n.t("openharmony.tips.sdk_home_empty"));
    return [];
  }
  const t = path_1.join(process.env.OHOS_SDK_HOME, "ets");
  const a = [];
  try {
    fs_extra_1.readdirSync(t).forEach((e) => {
      e = fs_extra_1.readJSONSync(path_1.join(t, e, "oh-uni-package.json"));
      a.push(e.apiVersion);
    });
  } catch (e) {
    console.warn(e);
  }
  return a;
}
exports.$ = { root: ".openharmony" };
exports.update = update;
exports.ready = ready;
