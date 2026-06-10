var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, s = r) => {
        Object.defineProperty(e, s, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, s) => {
        e[(s = s === undefined ? r : s)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });

exports.ready = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

const electron_1 = require("electron");
const fs_1 = require("fs");
const path_1 = require("path");
const querystring = __importStar(require("querystring"));
const url_1 = require("url");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;

const openExternal = (e) => electron_1.shell.openExternal(e);

const getJumpUrl = (e, t) =>
  `https://creator-api.cocos.com/api/account/client_signin?session_id=${e}&client_type=2&redirect_url=` +
  encodeURIComponent(t);

function ready() {
  panel = this;

  vm = new Vue({
    el: panel.$.store,
    data: {
      isloading: true,
      show: { slider: false },
      domReady: false,
      language: Editor.I18n.getLanguage(),
      list: [],
    },
    computed: {
      sortList() {
        return this.list.sort((e, t) => t.date - e.date);
      },
    },
    components: { item: require("./package-item") },
    async mounted() {
      var e = Buffer.from(
        await Editor.Network.get(
          "https://creator-api.cocos.com/api/service/get_store_setting"
        )
      ).toString();
      const t = JSON.parse(e);
      const s = this.$refs.webview;
      const o = await Editor.User.getData();

      requestAnimationFrame(async () => {
        s.setAttribute("useragent", Editor.App.userAgent);

        s.setAttribute(
          "preload",
          "file://" + path_1.join(__dirname, "/preload.js")
        );

        vm.domReady = false;

        s.setAttribute(
          "src",
          getJumpUrl(
            o.session_id,
            t.data.entry_url +
              "/creator/index/#/c?language=" +
              Editor.I18n.getLanguage()
          )
        );
      });

      s.addEventListener("ipc-message", (e) => {
        switch (e.channel) {
          case "_selectFile": {
            !(async (e) => {
              e = await Editor.Dialog.select(JSON.parse(e.args[0]));
              s.send("_selectFileFinished", e);
            })(e);
            break;
          }
          case "_translate": {
            r = e;
            s.send("_translate_finished", Editor.I18n.t(r.args[0]));
            break;
          }
          case "__cocos_jump": {
            r = e;
            openExternal(getJumpUrl(o.session_id, r.args[0]));
            break;
          }
          case "__normal_jump": {
            t = e;
            openExternal(t.args[0]);
          }
        }
        var t;
        var r;
      });

      s.addEventListener("did-navigate-in-page", async (e) => {
        var t = await Editor.User.getData();
        console.debug("本地导航 - " + e.url);
        vm.domReady = true;

        if (/app/.test(e.url)) {
          this.isloading = false;
        }

        if (/order_pay/.test(e.url)) {
          electron_1.shell.openExternal(getJumpUrl(t.session_id, e.url));
          e.stopPropagation();
          e.preventDefault();
        }
      });

      s.addEventListener("dom-ready", async () => {});

      s.addEventListener("new-window", async (e) => {
        var t;
        var r = await Editor.User.getData();
        e.stopPropagation();
        e.preventDefault();
        console.debug("打开新页面 - " + e.url);

        if (/pay/.test(e.url)) {
          electron_1.shell.openExternal(getJumpUrl(r.session_id, e.url));
        } else if (/\/creator\/download/.test(e.url)) {
          t = url_1.parse(e.url);
          t = querystring.parse(t.query || "");

          t = JSON.parse(
            String(Buffer.from(await Editor.Network.get(e.url, t)))
          );

          vm && (vm.show.slider = true);
          await Editor.Message.request("extension", "download-item", t);
          vm && (vm.show.slider = true);
        } else if (/cocos\.[com|org|net]/.test(e.url)) {
          electron_1.shell.openExternal(getJumpUrl(r.session_id, e.url));
        } else if (!/cocos\.[com|org|net]/.test(e.url)) {
          openExternal(e.url);
        }
      });

      this.refreshList();
    },
    methods: {
      i18n(e) {
        return Editor.I18n.t(e);
      },
      toggleSilder(e) {
        this.show.slider = !!e;
      },
      async removeAll() {
        if (
          (
            await Editor.Dialog.info(
              "" + Editor.I18n.t("extension.menu.removeAllConfirm"),
              {
                title: Editor.I18n.t("extension.menu.confirm"),
                default: 0,
                cancel: 1,
                buttons: [
                  Editor.I18n.t("extension.store.confirm"),
                  Editor.I18n.t("extension.store.cancel"),
                ],
              }
            )
          ).response !== 1
        ) {
          await Editor.Message.request("extension", "remove-all-item");
        }
      },
      async refreshList(r) {
        var e;

        if (r) {
          this.list.find((e) => {
            if (
              e.version_id === r.version_id &&
              e.production_id &&
              r.production_id
            ) {
              for (const t in r) {
                e[t] = r[t];
              }
            }
          });
        } else {
          e = await Editor.Message.request(
            "extension",
            "query-downloader-list"
          );

          this.list = e;
        }
      },
      goBack() {
        this.$refs.webview.goBack();
      },
      goForward() {
        this.$refs.webview.goForward();
      },
      refresh() {
        this.$refs.webview.reload();
      },
      async goHome() {
        var e = await Editor.User.getData();

        var t = JSON.parse(
          String(
            Buffer.from(
              await Editor.Network.get(
                "https://creator-api.cocos.com/api/service/get_store_setting"
              )
            )
          )
        );

        var r = this.$refs.webview;
        vm.domReady = false;

        r.setAttribute(
          "src",
          getJumpUrl(
            e.session_id,
            t.data.entry_url +
              "/creator/index/#/c?language=" +
              Editor.I18n.getLanguage()
          )
        );
      },
    },
  });
}

exports.style = fs_1.readFileSync(
  path_1.join(__dirname, "../../store.css"),
  "utf8"
);

exports.template = fs_1.readFileSync(
  path_1.join(__dirname, "../../../static", "/template/store/index.html"),
  "utf8"
);

exports.$ = { store: ".store", uiLoader: "ui-loading" };

exports.methods = {
  downloaderUpdate(e) {
    if (vm) {
      return vm.refreshList(e);
    }
  },
};

exports.ready = ready;
