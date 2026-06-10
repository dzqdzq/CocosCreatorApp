Object.defineProperty(exports, "__esModule", { value: true });

exports.close = undefined;
exports.beforeClose = undefined;
exports.ready = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.style = undefined;
exports.template = undefined;

const readFileSync = require("fs").readFileSync;
const join = require("path").join;
const Vue = require("vue/dist/vue.js");
let panel = null;
let vm;
Vue.config.productionTip = false;
Vue.config.devtools = false;

exports.template = readFileSync(
  join(__dirname, "../static/index.html"),
  "utf8"
);

exports.style = readFileSync(join(__dirname, "../dist/index.css"), "utf8");
exports.$ = { certificate: "#certificate" };
exports.methods = {};

const ready = async function (e) {
  panel = this;

  vm = new Vue({
    el: panel.$.certificate,
    data: {
      platform: e,
      settings: {
        country: "CN",
        state: "福建省",
        locality: "厦门市",
        organization: "",
        organizationalUnit: "",
        commonName: "",
        email: "",
        certificatePath: "",
      },
      saveBtnState: false,
      saveBtnDisabled: false,
      generateSuccess: false,
      verifyResult: {
        country: undefined,
        state: undefined,
        locality: undefined,
        organization: undefined,
        organizationalUnit: undefined,
        commonName: undefined,
        email: undefined,
        certificatePath: undefined,
      },
      verifyFuncMap: {
        certificatePath(e) {
          let t = "";
          return (t = Editor.Utils.Path.contains(
            join(Editor.Project.path, "./build"),
            e
          )
            ? "i18n:certificate.certificatePath_error"
            : t);
        },
        country(e) {
          let t = "";
          return (t = /^[A-Z]{2}$/.test(e)
            ? t
            : "i18n:certificate.country_error");
        },
        email(e) {
          let t = "";
          return (t = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/.test(
            e
          )
            ? t
            : "i18n:certificate.email_error");
        },
      },
    },
    async mounted() {
      this.netStatus = "success";
      await this.initData();
    },
    methods: {
      onChange(t) {
        var t = t.target;
        var i = t.getAttribute("name");
        if (i) {
          var t = t.value;
          var s = this;
          s.saveBtnState = false;
          let e = s.judgeEmptyAndSpace(i, t);
          e = e || s.verifyFuncMap[i]?.call(s, t);
          s.verifyResult[i] = e;
          s.saveBtnDisabled = s.calcBtnState();
        }
      },
      onConfirm(e) {
        var t;
        var e = e.target;
        var i = e.getAttribute("name");

        if (i) {
          e = e.value;
          (t = this).settings[i] = e;
          t = t.platform || "settings";

          Editor.Profile.setConfig("certificate", t + "." + i, e, "global");
        }
      },
      judgeEmptyAndSpace(e, t) {
        let i = "";

        if (!t || (typeof t == "string" && !t.trim().length)) {
          i = "i18n:certificate.empty_error";
        } else if (!t || !/^[^\s]*$/.test(t)) {
          i = "i18n:certificate.space_error";
        }

        return i;
      },
      onGenerate() {
        const t = this;
        process.env.PATH = process.env.PATH || "";

        if (!process.env.PATH.includes("/usr/bin/openssl")) {
          process.env.PATH += ":/usr/bin/openssl";
        }

        const i = Editor.UI.__protected__.File.resolveToRaw(
          t.settings.certificatePath
        );

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

        var state = join(Editor.App.path, "../tools/openSSLWin64/bin");
        var locality = join(state, "openssl");

        var organization =
          (process.platform === "win32" ? locality : "openssl") +
          " req -newkey rsa:2048 -nodes -keyout private.pem -x509 -days 3650 -out certificate.pem -subj " +
          country;

        var organizationalUnit = join(state, "openssl.cfg");

        var commonName =
          process.platform === "win32"
            ? { OPENSSL_CONF: organizationalUnit }
            : process.env;

        (0, require("child_process").exec)(
          organization,
          { env: commonName, cwd: i },
          async (e) => {
            if (e) {
              t.generateSuccess = false;

              console.error(
                Editor.I18n.t("certificate.build_certificate_fail") + e
              );

              Editor.Task.addNotice({
                title: Editor.I18n.t("certificate.title"),
                message:
                  Editor.I18n.t("certificate.build_certificate_fail") + e,
                type: "error",
              });
            } else {
              console.log(
                Editor.I18n.t("certificate.build_certificate_complete")
              );

              Editor.Task.addNotice({
                title: Editor.I18n.t("certificate.title"),
                message: Editor.I18n.t(
                  "certificate.build_certificate_complete"
                ),
                type: "success",
              });

              t.generateSuccess = true;

              Editor.Message.broadcast(
                "certificate:generate-certificate-success",
                i
              );

              Editor.Panel.close("certificate");
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
        var t = this;
        const i = t.platform || "settings";
        var e = await Editor.Profile.getConfig("certificate", i, "global");
        Object.assign(t.settings, e);

        if (t.platform && t.platform === "android") {
          t.verifyResult = Object.assign(
            {},
            {
              validity: undefined,
              password: undefined,
              confirmPassword: undefined,
              alias: undefined,
              aliasPassword: undefined,
              confirmAliasPassword: undefined,
            },
            t.verifyResult
          );

          t.settings = Object.assign(
            {},
            {
              validity: 1,
              password: "",
              confirmPassword: "",
              alias: "",
              aliasPassword: "",
              confirmAliasPassword: "",
            },
            t.settings
          );
        }

        for (const i of Object.keys(t.settings)) {
          let e = t.judgeEmptyAndSpace(i, t.settings[i]);
          e = e || t.verifyFuncMap[i]?.call(t, t.settings[i]);

          if ((t.verifyResult[i] = e)) {
            t.saveBtnState = true;
            t.saveBtnDisabled = true;
          }
        }
      },
    },
  });
};

exports.ready = ready;
const beforeClose = async () => {};
exports.beforeClose = beforeClose;

const close = async () => {
  if (vm) {
    vm.$destroy();
  }
};

exports.close = close;
