Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.style = undefined;
exports.template = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

const remote = require("@electron/remote");
const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const Pkg = require("../../package.json");

let params;
let panel = null;
let vm;
async function ready(e) {
  panel = this;
  params = e;
  var t = {
    el: panel.$.oauth,
    data() {
      return {
        loading: true,
        url: e.url,
        platform: e.platform,
        redirect: e.redirect,
      };
    },
    methods: {
      clearCache() {
        var e = panel.$.webview.getWebContentsId();
        var e = remote.webContents.fromId(e);

        if (e !== undefined) {
          e.session.clearStorageData({
            storages: [
              "appcache",
              "cookies",
              "filesystem",
              "indexdb",
              "localstorage",
              "shadercache",
              "websql",
              "serviceworkers",
              "cachestorage",
            ],
          });
        }
      },
      startLoading(e) {
        this.loading = true;
      },
      finishLoading(e) {
        var t = this;

        if (t.$refs.webview.src.startsWith(t.redirect)) {
          this.notifyLoginResult();
          Editor.Panel.close(Pkg.name + ".oauth");
        }

        t.loading = false;
      },
      notifyLoginResult() {
        Editor.Message.send(
          "" + Pkg.name,
          "loginResult",
          this.platform,
          "success"
        );
      },
    },
  };
  vm = new Vue(t);
}
async function beforeClose() {}
async function close() {
  Editor.Message.send("" + Pkg.name, "oAuthWindowClose", params.platform);
}

exports.template = readFileSync(
  join(__dirname, "../../static/oauth/index.html"),
  "utf-8"
);

exports.style = readFileSync(join(__dirname, "index.css"), "utf8");

exports.$ = { oauth: ".channel-oauth", webview: "#webview" };
exports.methods = {};
