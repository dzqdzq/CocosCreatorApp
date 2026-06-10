Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.update = update;
exports.ready = ready;

const { join } = require("path");

const { readFileSync } = require("fs-extra");

const options_1 = require("./options");

const { verificationFunc } = options_1;

const lodash = require("lodash");
let panel;
exports.template = readFileSync(
  join(__dirname, "../../static/builder/view.html"),
  "utf8"
);
const methods = {
  t(t, a) {
    return Editor.I18n.t("openharony." + t, a);
  },
  getDefaultPackageName() {
    return options_1.defaultOptions.packageName;
  },
  async onChange(t) {
    var a = t.target.value;
    var t = t.target.getAttribute("path");
    await this.onUpdateOptions(t, a);
  },
  async onUpdateOptions(t, a) {
    var e;

    if (t) {
      e = this;
      t === "apiLevel" && (a = Number(a));
      lodash.set(e.pkgOptions, t, a);
      a = await verificationFunc(t, a, panel.options);
      e.pkgErrorMap[t] = a.error;
      e.emitChange();
    }
  },
  async onChangeJsEngine() {},
  async onChangeABI(t, a) {
    var e = this;
    var t = t.target.value;

    if (!Array.isArray(e.pkgOptions.appABIs)) {
      e.pkgOptions.appABIs = [];
    }

    if (t) {
      e.pkgOptions.appABIs.push(a);
    } else {
      e.pkgOptions.appABIs.splice(e.pkgOptions.appABIs.indexOf(a), 1);
    }

    await e.onUpdateOptions("appABIs", e.pkgOptions.appABIs);
  },
  emitChange() {
    var t = this;
    panel.dispatch(
      "update",
      "packages." + t.pkgName,
      t.pkgOptions,
      t.pkgErrorMap
    );
  },
  async init() {
    var t = this;
    t.pkgOptions =
      lodash.get(panel.options, "packages." + panel.options.platform) || {};
    for (const e of Object.keys(options_1.defaultOptions)) {
      var a = await verificationFunc(e, t.pkgOptions[e], panel.options);
      t.pkgErrorMap[e] = a.error;
    }
    this.emitChange();
  },
};
async function update(t, a) {
  panel = this;

  if (!a || a.startsWith("packages." + panel.pkgName)) {
    panel.options = t;
    panel.vm.init();
  }
}
function ready(t, a, e, p) {
  panel = this;
  var BuildPanel_Vue = BuildPanel.Vue;
  panel.options = t;
  panel.pkgName = e;
  panel.errorMap = p;

  panel.vm = new BuildPanel_Vue({
    el: panel.$.root,
    data() {
      return {
        pkgName: e,
        type: a,
        pkgOptions: options_1.defaultOptions,
        pkgErrorMap: options_1.defaultOptions,
        appABIList: ["arm64-v8a"],
      };
    },
    async mounted() {
      var t = this;

      if (t.type === "check") {
        t.pkgOptions =
          lodash.get(panel.options, "packages." + panel.pkgName) || {};
        t.pkgErrorMap = {};
      } else {
        t.init();
      }
    },
    methods,
  });
}
exports.$ = { root: ".harmonyos-next" };
