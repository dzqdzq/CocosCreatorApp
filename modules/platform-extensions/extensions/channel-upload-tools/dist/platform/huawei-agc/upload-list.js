Object.defineProperty(exports, "__esModule", { value: true });

const { readFileSync } = require("fs-extra");

const { join, basename } = require("path");

const Constant = require("./const");
const Http = require("./lib/http");
const API = require("./lib/api").API;
const ErrorCode = require("./lib/entity").ErrorCode;
const Pkg = require("../../../package.json");
let comp;
var UPLOAD_STATE;

!((o) => {
  o[(o.fail = 0)] = "fail";
  o[(o.idle = 1)] = "idle";
  o[(o.fetch_token = 2)] = "fetch_token";
  o[(o.fetch_token_fail = 3)] = "fetch_token_fail";
  o[(o.fetch_url = 4)] = "fetch_url";
  o[(o.fetch_url_fail = 5)] = "fetch_url_fail";
  o[(o.upload = 6)] = "upload";
  o[(o.upload_fail = 7)] = "upload_fail";
  o[(o.update_info = 8)] = "update_info";
  o[(o.update_info_fail = 9)] = "update_info_fail";
  o[(o.success = 10)] = "success";
  o[(o.cancel = 11)] = "cancel";
})((UPLOAD_STATE = UPLOAD_STATE || {}));

module.exports = {
  name: Constant.PLATFORM + "-upload-list",
  template: readFileSync(
    join(
      __dirname,
      "../../../static",
      `platform/${Constant.PLATFORM}/upload-list.html`
    ),
    "utf8"
  ),
  props: ["info", "compName"],
  async created() {
    await (comp = this).loadHistory();

    if (comp.needUpload) {
      await comp.prepareApi();
      await comp.uploadApk();
    }
  },
  computed: {
    btnStatus() {
      return comp.pause ? comp.t("resume") : comp.t("pause");
    },
    historyTips() {
      return (comp.toggle ? "▼ " : "▶ ") + comp.t("history");
    },
    uploading() {
      return (
        !!comp.info.config &&
        comp.info.config.version &&
        comp.uploadState !== UPLOAD_STATE.success &&
        comp.uploadState !== UPLOAD_STATE.cancel
      );
    },
    needUpload() {
      return !!comp.info.config && comp.info.config.version;
    },
    showBtns() {
      return !comp.cancel && comp.uploading;
    },
    processFail() {
      return [0, 3, 5, 7, 9].includes(comp.uploadState);
    },
  },
  data() {
    return {
      toggle: false,
      uploadProgress: 0,
      pause: false,
      uploadState: UPLOAD_STATE.idle,
      progressTips: "",
      history: [],
      page: this.compName,
      cancel: false,
    };
  },
  watch: {
    history: {
      deep: true,
      async handler() {
        await comp.save();
      },
    },
    page(o) {
      comp.$emit("update:compName", o);
    },
  },
  methods: {
    toggleClick() {
      comp.toggle = !comp.toggle;
    },
    returnClick() {
      comp.cancelClick();
      comp.page = Constant.PLATFORM + "-upload";
    },
    cancelClick() {
      comp.cancel = true;
      comp.checkCancel();
    },
    async loadHistory() {
      comp.history =
        (await Editor.Profile.getConfig(
          Pkg.name,
          `options.${Constant.PLATFORM}.history`,
          "local"
        )) || [];
    },
    addHistory() {
      if (comp.history.length >= Constant.MAX_HISTORY_LENGTH) {
        comp.history.pop();
      }

      comp.history.unshift({
        time: Date.now(),
        description: comp.info.config.description,
        version: comp.info.config.version,
      });
    },
    changeState(o) {
      var e = comp.getStateKey(o);
      comp.uploadState = o;
      comp.progressTips = comp.t(e);
    },
    getStateKey(o) {
      for (const e in UPLOAD_STATE) {
        if (o === UPLOAD_STATE[e]) {
          return e;
        }
      }
    },
    formatTime(o) {
      return new Date(o).toLocaleString(
        Editor.I18n.getLanguage() === "zh" ? "zh-cn" : "en"
      );
    },
    async save() {
      Editor.Profile.setConfig(
        Pkg.name,
        `options.${Constant.PLATFORM}.history`,
        comp.history,
        "local"
      );
    },
    checkCancel() {
      return (
        !!comp.cancel &&
        ((comp.uploadProgress = 0), comp.changeState(UPLOAD_STATE.cancel), true)
      );
    },
    async prepareApi() {
      let o;

      o =
        comp.info.config.loginType === Constant.LOGIN_TYPE.oauth
          ? await Http.getOAuthToken()
          : (
              await API.getAccessToken(
                comp.info.config.clientId,
                comp.info.config.clientSecret
              )
            ).accessToken;

      comp.api = new API(
        comp.info.config.loginType,
        o,
        comp.info.config.clientId
      );
    },
    async uploadApk() {
      var o;
      var e;
      comp.uploadProgress = 10;

      if (!comp.checkCancel()) {
        comp.uploadProgress = 20;
        comp.changeState(UPLOAD_STATE.fetch_url);

        (o = await comp.api.getUploadUrl(comp.info.config.appid, "apk"))
          .code !== ErrorCode.success
          ? ((comp.uploadProgress = 100),
            comp.changeState(UPLOAD_STATE.fetch_url_fail),
            console.error("Fetch upload url fail,", o.errorMessage))
          : comp.checkCancel() ||
            ((comp.uploadProgress = 30),
            comp.changeState(UPLOAD_STATE.upload),
            (o = await comp.api.uploadFile(
              o.uploadUrl,
              comp.info.config.apkPath,
              o.authCode
            )).code !== ErrorCode.success
              ? ((comp.uploadProgress = 100),
                comp.changeState(UPLOAD_STATE.upload_fail),
                console.error("Upload fail,", o.errorMessage))
              : comp.checkCancel() ||
                ((comp.uploadProgress = 90),
                (e = basename(comp.info.config.apkPath)),
                comp.changeState(UPLOAD_STATE.update_info),
                (e = await comp.api.updateApkInfo(
                  comp.info.config.appid,
                  e,
                  o.files[0].fileDestUrl
                )).code !== ErrorCode.success
                  ? ((comp.uploadProgress = 100),
                    comp.changeState(UPLOAD_STATE.update_info_fail),
                    console.error("Update apk info fail,", e.errorMessage))
                  : (comp.changeState(UPLOAD_STATE.success),
                    (comp.uploadProgress = 100),
                    comp.addHistory())));
      }
    },
    t(o) {
      return Editor.I18n.t("channel-upload-tools." + o);
    },
  },
};
