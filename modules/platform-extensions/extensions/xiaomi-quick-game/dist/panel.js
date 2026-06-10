Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const build_1 = require("./build");

const { verificationFunc } = require("./utils/verification");

const lodash = require("lodash");

const methods = {
  onNewCertificate() {
    Editor.Panel.open("certificate");
  },
  t(e, t = "") {
    return Editor.I18n.t("xiaomi-quick-game." + t + e);
  },
  async onChange(e) {
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

    var t = verificationFunc(
      "privatePemPath",
      e.pkgOptions.privatePemPath,
      panel.options
    );

    var a = verificationFunc(
      "certificatePemPath",
      e.pkgOptions.certificatePemPath,
      panel.options
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
  updateCertificationPenPath(e) {
    var t;

    if (e) {
      (t = this).pkgOptions.certificatePemPath = join(e, "certificate.pem");
      t.pkgOptions.privatePemPath = join(e, "private.pem");
      t.updatePemPathCheckRes();
    }
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
  updateKey(e) {
    var t;
    var a = this;

    if (e) {
      if (
        !(
          (t = e.replace(`packages.${panel.pkgName}.`, "")) in
          build_1.optionsInPanel
        )
      ) {
        lodash.set(a.pkgOptions, t, lodash.get(panel.options, e));
        lodash.set(a.verifyRes, t, lodash.get(panel.errorMap, e));
        a.updatePemPathCheckRes(a.pkgOptions.useDebugKey);
      }
    } else {
      a.init(e);
    }
  },
};

let panel;
function update(e, t) {
  panel = this;

  if (!t || t.startsWith("packages." + panel.pkgName)) {
    panel.options = e;
    panel.vm.updateKey(t);
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
    data() {
      return {
        pkgName: a,
        optionsConfig: build_1.optionsInPanel,
        pkgOptions: {},
        verifyRes: {},
      };
    },
    mounted() {
      this.init();
    },
    methods,
  });

  Editor.Message.__protected__.addBroadcastListener(
    "certificate:generate-certificate-success",
    panel.vm && panel.vm.updateCertificationPenPath
  );
}
function close() {
  Editor.Message.__protected__.removeBroadcastListener(
    "certificate:generate-certificate-success",
    panel.vm && panel.vm.updateCertificationPenPath
  );
}

exports.style = `
.new-certificate { margin-left: 4px; }
`;

exports.template = readFileSync(join(__dirname, "../static/view.html"), "utf8");

exports.$ = { root: ".xiaomi-quick-game" };
