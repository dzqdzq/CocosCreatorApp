Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync, existsSync } = require("fs-extra");

const { join, normalize } = require("path");

const Constant = require("./const");
const Http = require("./lib/http");
let comp;
module.exports = {
  platform: Constant.PLATFORM,
  name: Constant.PLATFORM + "-upload",
  template: readFileSync(
    join(
      __dirname,
      "../../../static",
      `platform/${Constant.PLATFORM}/upload.html`
    ),
    "utf8"
  ),
  props: ["info", "compName"],
  async created() {
    const e = this;

    global.xxxx = this;
    (comp = e)._registerEvent();
    const n =
      (await Editor.Profile.getConfig(Constant.PLATFORM, "config")) || {};

    if (n) {
      Object.keys(e.config).forEach((t) => {
        var o = n[t];

        if (o) {
          e.config[t] = o;
        }
      });
    }

    if (e.config.loginType === Constant.LOGIN_TYPE.oauth) {
      await e.checkNeedLogin();
    }
  },
  computed: {
    oAuth() {
      return this.config.loginType === Constant.LOGIN_TYPE.oauth;
    },
    showLoginBtn() {
      return this.oAuth && this.needLogin;
    },
    isLogin() {
      return !this.needLogin && this.oAuth;
    },
  },
  data() {
    return {
      config: {
        loginType: Constant.LOGIN_TYPE.oauth,
        clientId: "",
        clientSecret: "",
        appid: "",
        version: "1.0",
        apkPath: "",
        description: "",
      },
      page: this.compName,
      loginChecked: false,
      loading: false,
      needLogin: true,
      accessToken: "",
      loginType: [
        { type: Constant.LOGIN_TYPE.oauth, name: this.t("oauth") },
        { type: Constant.LOGIN_TYPE.client, name: this.t("client") },
      ],
    };
  },
  watch: {
    page(t) {
      comp.$emit("update:compName", t);
    },
    info(t) {
      comp.$emit("update:info", t);
    },
    async "config.loginType"(t) {
      if (t === Constant.LOGIN_TYPE.oauth && !comp.loginChecked) {
        await comp.checkNeedLogin();
      }
    },
    config: {
      async handler(t) {
        var o =
          (await Editor.Profile.getConfig(Constant.PLATFORM, "config")) || {};

        var o = Object.assign(o, t);
        Editor.Profile.setConfig(Constant.PLATFORM, "config", o, "local");
      },
      deep: true,
    },
  },
  methods: {
    oauthTypeChange(t) {
      this.config.loginType = t.target.value;
    },
    async checkNeedLogin() {
      var t = this;

      if (await Editor.User.isLoggedIn()) {
        t.loading = true;
        t.needLogin = await Http.needLogin();
        t.loading = false;
        t.loginChecked = true;
      } else {
        t.popupWarns(comp.t("need_login"));
      }
    },
    _registerEvent() {
      var t = this;
      t.$root.$on("loginResult", t.updateLoginResult);
      t.$root.$on("oAuthWindowClose", t.oAuthWindowClose);
    },
    async updateLoginResult(t, o) {
      var e = this;

      if (t === module.exports.platform && o === "success") {
        e.needLogin = await Http.needLogin();
        e.accessToken = await Http.getOAuthToken();
        e.loading = false;
      }
    },
    async oAuthWindowClose() {
      comp.needLogin = await Http.needLogin();
      comp.loading = false;
    },
    async onChooseDistPathClick(t) {
      t.stopPropagation();
    },
    async onUpdateValue(t, o) {
      t.stopPropagation();
      comp.config[o] = t.target.value;
    },
    cancelClick() {
      Editor.Panel.close("channel-upload-tools");
    },
    popupWarns(t) {
      return Editor.Dialog.warn(t, {
        title: comp.t("notice_title"),
        buttons: [comp.t("confirm")],
        default: -1,
        cancel: -1,
      });
    },
    async oauthClick() {
      comp.loading = true;

      if (!(await Editor.User.isLoggedIn())) {
        comp.loading = false;
        return comp.popupWarns(comp.t("need_login"));
      }

      var t = await Http.getOAuthUrl();

      if (t) {
        Editor.Panel.open("channel-upload-tools.oauth", {
          platform: Constant.PLATFORM,
          url: t.url,
          redirect: t.redirect,
          method: "loginResult",
        });
      } else {
        console.error("Get OAuth url fail, please retry");
      }
    },
    async uploadClick() {
      var t = this;

      if (t.oAuth || t.config.clientId) {
        if (t.oAuth || t.config.clientSecret) {
          if (t.config.appid) {
            if (t.config.version) {
              if (t.config.apkPath && existsSync(normalize(t.config.apkPath))) {
                if (t.oAuth && t.needLogin) {
                  if (
                    (await t.popupWarns(t.t("need_huawei_login"))).response ===
                    0
                  ) {
                    t.oauthClick();
                  }
                } else {
                  t.info.config = t.config;
                  t.page = Constant.PLATFORM + "-upload-list";
                }
              } else {
                t.popupWarns(t.t("need_apk"));
              }
            } else {
              t.popupWarns(t.t("need_version"));
            }
          } else {
            t.popupWarns(t.t("need_appid"));
          }
        } else {
          t.popupWarns(t.t("need_client_secret"));
        }
      } else {
        t.popupWarns(t.t("need_clientid"));
      }
    },
    async logoutClick() {
      comp.loading = true;
      try {
        await Http.logout();
        await comp.checkNeedLogin();
      } catch (t) {}
      comp.loading = false;
    },
    t(t) {
      return Editor.I18n.t("channel-upload-tools." + t);
    },
  },
};
