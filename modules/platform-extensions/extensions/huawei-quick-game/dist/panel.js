Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;

const { join } = require("path");

const { readFileSync, existsSync } = require("fs");

const build_1 = require("./build");

const { verificationFunc } = require("./utils/verification");

const lodash = require("lodash");
let panel;
const fixPath = require("fix-path");

fixPath();

exports.style = `
.new-certificate { margin-left: 4px; }
.print-finger { margin-top: 4px; }
`;

exports.template = readFileSync(join(__dirname, "../static/view.html"), "utf8");

const methods = {
  onNewCertificate() {
    Editor.Panel.open("certificate");
  },
  t(e, t = "") {
    return Editor.I18n.t("huawei-quick-game." + t + e);
  },
  async onChange(e) {
    var t = this;
    var i = e.target.value;
    var e = e.target.getAttribute("path");
    lodash.set(t.pkgOptions, e, i);

    if (["useDebugKey", "certificatePemPath", "privatePemPath"].includes(e)) {
      t.updatePemPathCheckRes();
    }

    if (["separateEngine", "minPlatformVersion"].includes(e)) {
      t.updateMinPlatformVersion();
    }

    panel.dispatch("update", `packages.${t.pkgName}.` + e, i, t.verifyRes[e]);
  },
  updatePemPathCheckRes() {
    var e = this;
    var t = e.pkgOptions.useDebugKey;

    var i = verificationFunc(
      "privatePemPath",
      e.pkgOptions.privatePemPath,
      panel.options
    );

    var r = verificationFunc(
      "certificatePemPath",
      e.pkgOptions.certificatePemPath,
      panel.options
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
  updateMinPlatformVersion() {
    var e = this;

    var t = verificationFunc(
      "minPlatformVersion",
      "" + e.pkgOptions.minPlatformVersion,
      panel.options
    );

    if (t.error) {
      e.verifyRes.minPlatformVersion = t.error;

      panel.dispatch(
        "update",
        `packages.${e.pkgName}.minPlatformVersion`,
        e.pkgOptions.minPlatformVersion,
        e.verifyRes.minPlatformVersion
      );
    } else {
      e.verifyRes.minPlatformVersion = null;

      panel.dispatch(
        "update",
        `packages.${e.pkgName}.minPlatformVersion`,
        e.pkgOptions.minPlatformVersion,
        null
      );
    }
  },
  init() {
    var e = this;

    e.pkgOptions =
      lodash.get(panel.options, "packages." + panel.options.platform) || {};

    e.verifyRes =
      lodash.get(panel.errorMap, "packages." + panel.options.platform) || {};

    e.updatePemPathCheckRes();
    e.updateMinPlatformVersion();
  },
  async onPrintFinger() {
    var e = "/usr/local/bin/";

    if (process.platform !== "win32" && !process.env.PATH.includes(e)) {
      process.env.PATH += ":" + e;
    }

    if (process.platform === "win32" || existsSync(join(e, "node"))) {
      if (await this.isInstallNodeJs()) {
        this.printFinger();
      }
    } else {
      console.log(
        new Error(
          Editor.I18n.t(
            "huawei-quick-game.tips.install_nodejs_before_view_certificate"
          )
        )
      );
    }
  },
  printFinger() {
    var e = require("child_process").exec;
    var t = join(Editor.App.path, "../tools/huawei-rpk-tools");
    e(
      `node ${join(t, "print-cert-fp.js")} ` +
        this.pkgOptions.certificatePemPath,
      { cwd: t },
      (e, t) => {
        if (!e) {
          return t
            ? void console.log(
                Editor.I18n.t("huawei-quick-game.tips.certificate_fingerprint"),
                t
              )
            : void console.error(
                new Error(
                  Editor.I18n.t(
                    "huawei-quick-game.tips.select_certificate_path_after_view_certificate"
                  )
                )
              );
        }

        if (process.platform === "win32") {
          console.log(
            new Error(
              Editor.I18n.t(
                "huawei-quick-game.tips.certificate_fingerprint_window_error"
              ) + e
            )
          );
        } else {
          console.log(
            new Error(
              Editor.I18n.t(
                "huawei-quick-game.tips.certificate_fingerprint_mac_error"
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
                  Editor.I18n.t(
                    "huawei-quick-game.tips.not_install_nodejs_windows_error"
                  )
                )
              )
            : console.error(
                new Error(
                  Editor.I18n.t(
                    "huawei-quick-game.tips.not_install_nodejs_mac_error"
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
    data() {
      return {
        pkgName: i,
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
}
exports.$ = { root: ".huawei-quick-game" };
