Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;

const { readFileSync } = require("fs");

const { join } = require("path");

const { verificationFunc } = require("./utils/verification");

const lodash = require("lodash");
let panel;
const methods = {
  onNewCertificate() {
    Editor.Panel.open("certificate");
  },
  t(e, t = "") {
    return Editor.I18n.t("oppo-mini-game." + t + e);
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
    var t = e.pkgOptions.useDebugKey;

    var a = verificationFunc(
      "privatePemPath",
      e.pkgOptions.privatePemPath,
      panel.options
    );

    var i = verificationFunc(
      "certificatePemPath",
      e.pkgOptions.certificatePemPath,
      panel.options
    );

    e.verifyRes.privatePemPath = t ? null : a.error;
    e.verifyRes.certificatePemPath = t ? null : i.error;

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
  async init() {
    var e = this;

    e.pkgOptions = lodash.get(
      panel.options,
      "packages." + panel.options.platform
    );

    e.verifyRes =
      lodash.get(panel.errorMap, "packages." + panel.options.platform) || {};
    e.updatePemPathCheckRes();
  },
};
async function update(e, t) {
  panel = this;

  if (!t || t.startsWith("packages." + panel.pkgName)) {
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
    data() {
      return { pkgName: a, pkgOptions: {}, verifyRes: {} };
    },
    mounted() {
      this.init();
    },
    methods,
  });
}

exports.style = `
.new-certificate {
    margin-left: 4px;
}
`;

exports.template = readFileSync(join(__dirname, "../static/view.html"), "utf8");

exports.$ = { root: ".oppo-mini-game" };
