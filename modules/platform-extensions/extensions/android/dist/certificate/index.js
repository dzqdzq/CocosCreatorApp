Object.defineProperty(exports, "__esModule", { value: true });

exports.close = undefined;
exports.beforeClose = undefined;
exports.ready = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

const fs_1 = require("fs");
const path_1 = require("path");
let panel = null;
let vm;
const Vue = require("vue/dist/vue.js");
async function ready() {
  panel = this;

  vm = new Vue({
    el: panel.$.certificate,
    data: {
      settings: {
        password: "",
        confirmPassword: "",
        alias: "",
        aliasPassword: "",
        confirmAliasPassword: "",
        validity: 3650,
        commonName: "",
        organization: "",
        organizationalUnit: "",
        locality: "",
        state: "",
        country: "",
      },
      dirty: false,
      saveBtnState: false,
      saveBtnDisabled: false,
      generateSuccess: false,
      verifyResult: {},
    },
    async mounted() {
      this.netStatus = "success";
      await this.initData();
    },
    methods: {
      onConfirm(e) {
        var t;
        var s;
        var i = e.target.getAttribute("name");

        if (i) {
          e = e.target.value;
          t = this;
          t.dirty = true;
          t.saveBtnState = false;
          s = t.judgeEmpty(i, e);
          (t.verifyResult[i] = s) && console.warn(i + " can't be empty!");
          t.saveBtnDisabled = t.calcBtnState();
          t.settings[i] = e;
          Editor.Profile.setConfig("android", "certificate." + i, e);
        }
      },
      judgeEmpty(e, t) {
        let s = "";
        return (s =
          !t || (t.trim && t.trim().length == 0) ? e + " Can't be empty" : s);
      },
      onGenerate() {
        const t = this;

        if (!process.env.PATH.includes("/usr/bin/openssl")) {
          process.env.PATH += ":/usr/bin/openssl";
        }

        var e = t.settings.certificatePath;

        var {
          country,
          state,
          locality,
          organization,
          organizationalUnit,
          commonName,
          email,
        } = t.settings;

        var country =
          `/C=${country}/ST=${state}/L=${locality}/O=${organization}/OU=${organizationalUnit}/CN=${commonName}/emailAddress=` +
          email;

        var state = path_1.join(Editor.App.path, "../tools/openSSLWin64/bin");
        var locality = path_1.join(state, "openssl");

        var organization =
          (process.platform === "win32" ? locality : "openssl") +
          " req -newkey rsa:2048 -nodes -keyout private.pem -x509 -days 3650 -out certificate.pem -subj " +
          country;

        var organizationalUnit = path_1.join(state, "openssl.cfg");

        var commonName =
          process.platform === "win32"
            ? { OPENSSL_CONF: organizationalUnit }
            : process.env;

        (0, require("child_process").exec)(
          organization,
          { env: commonName, cwd: e },
          (e) => {
            if (e) {
              t.generateSuccess = false;

              console.error(
                Editor.I18n.t("builder.certificate.build_certificate_fail") + e
              );
            } else {
              console.log(
                Editor.I18n.t("builder.certificate.build_certificate_complete")
              );

              t.generateSuccess = true;
              Editor.Panel.close("builder.certificate");
            }
          }
        );
      },
      calcBtnState() {
        var e = this;
        if (e.saveBtnState) {
          return true;
        }
        for (const t of Object.keys(e.verifyResult)) {
          if (e.verifyResult[t]) {
            return true;
          }
        }
        return false;
      },
      async initData() {
        var e = await Editor.Profile.getConfig("builder", "certificate");
        Object.assign(this.settings, e);
      },
    },
  });
}
async function beforeClose() {}
async function close() {}
async function checkIsSave() {
  var e;
  if (vm && vm.dirty) {
    e = Editor.I18n.t;

    return (
      (e = await Editor.Dialog.warn(
        e("builder.splash_setting.is_save_dialog.title"),
        {
          buttons: [
            e("builder.splash_setting.is_save_dialog.save"),
            e("builder.splash_setting.is_save_dialog.cancel"),
            e("builder.splash_setting.is_save_dialog.abort"),
          ],
          default: 0,
          cancel: 1,
        }
      )).response !== 1 && (e.response === 0 && (await vm.saveSettings()), true)
    );
  }
}
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.style = fs_1.readFileSync(
  path_1.join(__dirname, "../../dist/certificate.css"),
  "utf8"
);

exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../../static/certificate.html"),
  "utf8"
);

exports.$ = { certificate: ".certificate" };
exports.methods = {};
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;
