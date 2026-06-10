var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, s = i) => {
        var r = Object.getOwnPropertyDescriptor(t, i);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : t.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, s, r);
      }
    : (e, t, i, s) => {
        e[(s = s === undefined ? i : s)] = t[i];
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
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = r(e), s = 0; s < i.length; s++) {
          if (i[s] !== "default") {
            __createBinding(t, e, i[s]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsPreviewHomeVM = undefined;

const { readFileSync } = require("fs");

const { join } = require("path");

const Vue = require("vue/dist/vue.js");

Vue.config.productionTip = false;
Vue.config.devtools = false;
const utils = __importStar(require("../../../components/utils"));

const { previewPopupContextMenu } = require("../../../components/panel-menu");

const template = readFileSync(
  join(__dirname, "../../../../static", "/template/preview/index.html"),
  "utf8"
);

exports.AssetsPreviewHomeVM = Vue.extend({
  data() {
    return {
      active: "",
      uuid: "",
      path: "",
      crumbs: [],
      list: [],
      prev: [],
      next: [],
      requestAnimationId: null,
    };
  },
  methods: {
    async select(e) {
      const i = this;
      i.crumbs = [];
      i.path = "";
      i.uuid = e;
      i.list = [];
      window.cancelAnimationFrame(i.requestAnimationId);
      var t = await utils.getAssetForPreview(e);
      if (t) {
        if (
          i.next[i.next.length - 1] !== e &&
          i.prev[i.prev.length - 1] !== e
        ) {
          i.prev.length > 100 && i.prev.shift();
          i.prev.push(e);
          i.next = [];
        }

        i.path = t.path;
        i.crumbs = t.url.substr(5).split("/");
        const s = await utils.getChildrenForPreview(e);
        if (s && s.length) {
          const s_length = s.length;
          if (s_length < 200) {
            i.list = s;
          } else {
            let t = 0;
            i.requestAnimationId = window.requestAnimationFrame(function e() {
              if (t < s_length) {
                for (let e = 0; e < 10; e++) {
                  t++;

                  if (!s[t]) {
                    return;
                  }

                  i.list.push(s[t]);
                }
                i.requestAnimationId = window.requestAnimationFrame(e);
              }
            });
          }
        }
      }
    },
    async unselect() {
      var e = this;
      e.path = "";
      e.crumbs = [];
      e.list = [];
    },
    getTypes(e) {
      return JSON.parse(this.getAdditional(e))
        .map((e) => e.type)
        .join();
    },
    getAdditional(t) {
      const i = [{ type: t.type, value: t.uuid }];

      if (t.redirect) {
        utils.pushAdditional(i, {
          type: t.redirect.type,
          value: t.redirect.uuid,
        });
      }

      if (t.extends && t.extends.length > 0) {
        t.extends.forEach((e) => {
          utils.pushAdditional(i, { type: e, value: t.uuid });
        });
      }

      for (const e in t.subAssets) {
        const s = t.subAssets[e];

        if (!t.redirect || t.redirect.uuid !== s.uuid) {
          utils.pushAdditional(i, { type: s.type, value: s.uuid });

          s.extends &&
            s.extends.length > 0 &&
            s.extends.forEach((e) => {
              utils.pushAdditional(i, { type: e, value: s.uuid });
            });
        }
      }
      return JSON.stringify(i);
    },
    dblClick(e) {
      if (e.isDirectory) {
        Editor.Selection.clear("asset");
        Editor.Selection.select("asset", e.uuid);
        Editor.Message.send("assets", "twinkle", e.uuid, "light");
      } else {
        utils.openAsset(e);
      }
    },
    async crumbsClick(e) {
      e = this.crumbs.slice(0, e + 1);

      e = await Editor.Message.request(
        "asset-db",
        "query-uuid",
        "db://" + e.join("/")
      );

      Editor.Selection.clear("asset");

      if (e) {
        Editor.Selection.select("asset", e);
        Editor.Message.send("assets", "twinkle", e);
      }
    },
    async prevClick() {
      var e = this;
      var t = e.prev.pop();

      if (
        t &&
        (e.next[e.next.length - 1] !== t && e.next.push(t), e.prev.length !== 0)
      ) {
        t = e.prev[e.prev.length - 1];

        (await Editor.Message.request("asset-db", "query-asset-info", t))
          ? (Editor.Selection.clear("asset"),
            Editor.Selection.select("asset", t))
          : e.prevClick();
      }
    },
    async nextClick() {
      var e = this;
      var t = e.next.pop();

      if (t) {
        if (await Editor.Message.request("asset-db", "query-asset-info", t)) {
          e.prev[e.prev.length - 1] !== t && e.prev.push(t);
          Editor.Selection.clear("asset");
          Editor.Selection.select("asset", t);
        } else {
          e.nextClick();
        }
      }
    },
    popupMenu(e) {
      previewPopupContextMenu(e);
    },
  },
  template,
});
