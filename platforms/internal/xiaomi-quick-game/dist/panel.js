Object.defineProperty(exports, "__esModule", { value: true });

exports.buttonConfig = undefined;
exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.template = undefined;

const fs_1 = require("fs");
const path_1 = require("path");
const build_1 = require("./build");
const verification_1 = require("./utils/verification");
const lodash = require("lodash");

const methods = {
  onNewCertificate() {
    Editor.Panel.open("builder.certificate");
  },
  t(e, t = "") {
    return Editor.I18n.t("xiaomi-quick-game." + t + e);
  },
  async onConfirm(e) {
    var t = this;
    var a = e.target.value;
    var e = e.target.getAttribute("path");
    lodash.set(t.pkgOptions, e, a);

    if (["useDebugKey", "certificatePemPath", "privatePemPath"].includes(e)) {
      t.updatePemPathCheckRes();
    }

    panel.dispatch("update", `packages.${t.pkgName}.` + e, a, t.verifyRes[e]);
  },
  updatePemPathCheckRes() {
    var e = this;

    var t = verification_1.verificationFunc(
      "privatePemPath",
      e.pkgOptions.privatePemPath,
      e.options
    );

    var a = verification_1.verificationFunc(
      "certificatePemPath",
      e.pkgOptions.certificatePemPath,
      e.options
    );

    e.verifyRes.privatePemPath = e.pkgOptions.useDebugKey ? null : t.error;

    e.verifyRes.certificatePemPath = e.pkgOptions.useDebugKey ? null : a.error;

    panel.dispatch(
      "update",
      `packages.${e.pkgName}.certificatePemPath`,
      e.pkgOptions.certificatePemPath,
      e.verifyRes.certificatePemPath
    );

    panel.dispatch(
      "update",
      `packages.${e.pkgName}.privatePemPath`,
      e.pkgOptions.privatePemPath,
      e.verifyRes.privatePemPath
    );
  },
  init() {
    var e = this;

    e.pkgOptions = JSON.parse(
      JSON.stringify(
        lodash.get(panel.options, "packages." + panel.options.platform) || {}
      )
    );

    e.verifyRes = JSON.parse(
      JSON.stringify(
        lodash.get(panel.errorMap, "packages." + panel.options.platform) || {}
      )
    );

    e.updatePemPathCheckRes(e.pkgOptions.useDebugKey);
  },
};

let panel;
function update(e, t) {
  panel = this;

  if (!t || t.startsWith("pacakges." + panel.pkgName)) {
    panel.options = e;
    panel.vm.init();
  }
}
function ready(e, t, a, i) {
  panel = this;
  var BuildPanel_Vue = BuildPanel.Vue;
  panel.options = e;
  panel.pkgName = a;
  panel.errorMap = i;

  panel.vm = new BuildPanel_Vue({
    el: panel.$.root,
    methods,
    data() {
      return {
        pkgName: a,
        options: panel.options,
        errorMap: panel.errorMap,
        optionsConfig: build_1.optionsInPanel,
        pkgOptions: {},
        verifyRes: {},
      };
    },
    mounted() {
      this.init();
    },
    components: {
      "build-prop": BuildPanel.vueComps.buildProp,
      "template-comp": BuildPanel.vueComps.templateComp,
    },
  });
}

exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../static/view.html"),
  "utf8"
);

exports.$ = { root: ".xiaomi-quick-game" };
exports.update = update;
exports.ready = ready;

exports.buttonConfig = {
  configs: {
    make: { label: "i18n:xiaomi-quick-game.make.label", hookHandle: "make" },
    run: { label: "i18n:xiaomi-quick-game.run.label", hookHandle: "run" },
  },
};
