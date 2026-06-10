var __awaiter =
  (this && this.__awaiter) ||
  ((e, n, p, s) =>
    new (p = p || Promise)((i, t) => {
      function r(e) {
        try {
          o(s.next(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        try {
          o(s.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof p
            ? t
            : new p((e) => {
                e(t);
              })
          ).then(r, a);
        }
      }
      o((s = s.apply(e, n || [])).next());
    }));
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
let panel;
const fixPath = require("fix-path");

fixPath();

exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../static/view.html"),
  "utf8"
);

const methods = {
  onNewCertificate() {
    Editor.Panel.open("builder.certificate");
  },
  t(e, t = "") {
    return Editor.I18n.t("huawei-quick-game." + t + e);
  },
  onConfirm(r) {
    return __awaiter(this, undefined, undefined, function* () {
      var e = this;
      var t = r.target.value;
      var i = r.target.getAttribute("path");
      lodash.set(e.pkgOptions, i, t);

      if (["useDebugKey", "certificatePemPath", "privatePemPath"].includes(i)) {
        e.updatePemPathCheckRes();
      }

      panel.dispatch("update", `packages.${e.pkgName}.` + i, t, e.verifyRes[i]);
    });
  },
  updatePemPathCheckRes() {
    var e = this;
    var t = e.pkgOptions.useDebugKey;

    var i = verification_1.verificationFunc(
      "privatePemPath",
      e.pkgOptions.privatePemPath,
      e.options
    );

    var r = verification_1.verificationFunc(
      "certificatePemPath",
      e.pkgOptions.certificatePemPath,
      e.options
    );

    e.verifyRes.privatePemPath = t ? null : i.error;
    e.verifyRes.certificatePemPath = t ? null : r.error;

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

    e.pkgOptions =
      lodash.get(panel.options, "packages." + panel.options.platform) || {};

    e.verifyRes =
      lodash.get(panel.errorMap, "packages." + panel.options.platform) || {};

    e.updatePemPathCheckRes();
  },
  onPrintFinger() {
    return __awaiter(this, undefined, undefined, function* () {
      var e = "/usr/local/bin/";

      if (process.platform !== "win32" && !process.env.PATH.includes(e)) {
        process.env.PATH += ":" + e;
      }

      if (
        process.platform === "win32" ||
        fs_1.existsSync(path_1.join(e, "node"))
      ) {
        if (yield this.isInstallNodeJs()) {
          this.printFinger();
        }
      } else {
        console.log(
          new Error(
            Editor.I18n.t(
              "builder.huawei.install_nodejs_before_view_certificate"
            )
          )
        );
      }
    });
  },
  printFinger() {
    var e = require("child_process").exec;
    var t = path_1.join(Editor.App.path, "../tools/huawei-rpk-tools");
    e(
      `node ${path_1.join(t, "print-cert-fp.js")} ` +
        this.pkgOptions.certificatePemPath,
      { cwd: t },
      (e, t) => {
        if (!e) {
          return t
            ? void console.log(
                Editor.I18n.t("builder.huawei.certificate_fingerprint"),
                t
              )
            : void console.error(
                new Error(
                  Editor.I18n.t(
                    "builder.huawei.select_certificate_path_after_view_certificate"
                  )
                )
              );
        }

        if (process.platform === "win32") {
          console.log(
            new Error(
              Editor.I18n.t(
                "builder.huawei.certificate_fingerprint_window_error"
              ) + e
            )
          );
        } else {
          console.log(
            new Error(
              Editor.I18n.t(
                "builder.huawei.certificate_fingerprint_huawei-quick-game_error"
              ) + e
            )
          );
        }
      }
    );
  },
  isInstallNodeJs() {
    const e = require("child_process").exec;
    return new Promise((t, i) => {
      e("node -v", { env: process.env }, (e) => {
        if (e) {
          process.platform === "win32"
            ? console.error(
                new Error(
                  Editor.I18n.t("builder.window_default_npm_path_error")
                )
              )
            : console.error(
                new Error(
                  Editor.I18n.t(
                    "builder.huawei-quick-game_default_npm_path_error"
                  )
                )
              );

          i(false);
        } else {
          t(true);
        }
      });
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
function ready(e, t, i, r) {
  panel = this;
  var BuildPanel_Vue = BuildPanel.Vue;
  panel.options = e;
  panel.pkgName = i;
  panel.errorMap = r;

  panel.vm = new BuildPanel_Vue({
    el: panel.$.root,
    methods,
    data() {
      return {
        pkgName: i,
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
exports.$ = { root: ".huawei-quick-game" };
exports.update = update;
exports.ready = ready;

exports.buttonConfig = {
  configs: {
    make: { label: "i18n:huawei-quick-game.make.label", hookHandle: "make" },
    debug: {
      label: "i18n:huawei-quick-game.debug.label",
      click(e, t) {
        t.buildPath = Editor.UI.File.resolveToRaw(t.buildPath);
        var i = path_1.join(t.buildPath, t.outputName);
        var i = path_1.join(i, "dist", t.name + ".rpk");
        Editor.Panel.open("runtime-dev-tools", {
          platform: "huawei-runtime",
          rpkPath: i,
        });
      },
    },
    build: { label: "i18n:huawei-quick-game.build.label" },
  },
};
