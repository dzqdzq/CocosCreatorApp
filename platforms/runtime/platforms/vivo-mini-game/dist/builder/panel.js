var __awaiter =
  (this && this.__awaiter) ||
  ((e, r, p, s) =>
    new (p = p || Promise)((a, t) => {
      function i(e) {
        try {
          o(s.next(e));
        } catch (e) {
          t(e);
        }
      }
      function n(e) {
        try {
          o(s.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        var t;

        if (e.done) {
          a(e.value);
        } else {
          ((t = e.value) instanceof p
            ? t
            : new p((e) => {
                e(t);
              })
          ).then(i, n);
        }
      }
      o((s = s.apply(e, r || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.buttonConfig = undefined;
exports.ready = undefined;
exports.update = undefined;
exports.$ = undefined;
exports.template = undefined;

const fs_1 = require("fs");
const path_1 = require("path");
const _1 = require(".");
const verification_1 = require("../utils/verification");
const lodash = require("lodash");
let panel;
const methods = {
  onNewCertificate() {
    Editor.Panel.open("builder.certificate");
  },
  t(e, t = "") {
    return Editor.I18n.t("vivo-mini-game." + t + e);
  },
  onConfirm(i) {
    return __awaiter(this, undefined, undefined, function* () {
      var e = this;
      var t = i.target.value;
      var a = i.target.getAttribute("path");
      lodash.set(e.pkgOptions, a, t);

      if (["useDebugKey", "certificatePemPath", "privatePemPath"].includes(a)) {
        e.updatePemPathCheckRes();
      }

      panel.dispatch(
        "update",
        `packages.${e.pkgName}.` + a,
        e.pkgOptions[a],
        e.verifyRes[a]
      );
    });
  },
  updatePemPathCheckRes() {
    var e = this;
    var t = e.pkgOptions.useDebugKey;

    var a = verification_1.verificationFunc(
      "privatePemPath",
      e.pkgOptions.privatePemPath,
      e.options
    );

    var i = verification_1.verificationFunc(
      "certificatePemPath",
      e.pkgOptions.certificatePemPath,
      e.options
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
  init() {
    return __awaiter(this, undefined, undefined, function* () {
      var e = this;
      e.pkgOptions =
        lodash.get(panel.options, "packages." + panel.options.platform) || {};

      e.verifyRes =
        lodash.get(panel.errorMap, "packages." + panel.options.platform) || {};

      e.updatePemPathCheckRes();
    });
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
    methods,
    data() {
      return {
        pkgName: a,
        options: panel.options,
        errorMap: panel.errorMap,
        optionsConfig: _1.optionsInPanel,
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
  path_1.join(__dirname, "../../static/view.html"),
  "utf8"
);

exports.$ = { root: ".vivo-mini-game" };
exports.update = update;
exports.ready = ready;

exports.buttonConfig = {
  configs: {
    make: { label: "i18n:vivo-mini-game.make.label", hookHandle: "make" },
    run: { label: "i18n:vivo-mini-game.run.label", hookHandle: "run" },
    build: { label: "i18n:vivo-mini-game.build.label" },
  },
};
