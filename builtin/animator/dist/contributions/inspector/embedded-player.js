var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var n = Object.getOwnPropertyDescriptor(t, a);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
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
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = n(e), r = 0; r < a.length; r++) {
          if (a[r] !== "default") {
            __createBinding(t, e, a[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.update = update;
exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join, basename } = require("path");

const utils_1 = require("../../panel/utils");
const vue_js_1 = __importStar(require("vue/dist/vue.js"));

const vueTemplate = readFileSync(
  join(__dirname, "../../../static/embedded-player.html"),
  "utf8"
);

let panel = null;
let vm = null;

const EmbeddedPlayerVM = (0, vue_js_1.defineComponent)({
  name: "EmbeddedPlayerVM",
  setup(e, { expose }) {
    const a = (0, vue_js_1.ref)("");
    const r = (0, vue_js_1.ref)();
    const n = (0, vue_js_1.ref)({ root: "", clipUuid: "" });
    const u = (0, vue_js_1.ref)(null);
    const l = (0, vue_js_1.ref)("{}");
    const o = (0, vue_js_1.ref)({});
    var s = (0, vue_js_1.computed)(() => {
      var e = (0, vue_js_1.unref)(r);
      if (e && e.playable) {
        return utils_1.EmbeddedPlayerMenuMap[e.playable.type];
      }
    });
    const i = (0, vue_js_1.computed)(() => {
      var e = (0, vue_js_1.unref)(r);
      const t = (0, vue_js_1.unref)(o);
      if (!e || !e.playable || !e.playable.path) {
        return "";
      }
      const a = "" + n.value.root + e.playable.path;
      return Object.keys(t).find((e) => t[e] === a) || "";
    });
    var d = (0, vue_js_1.computed)(() => {
      var e = (0, vue_js_1.unref)(r);
      return e
        ? e.displayName ||
            (e.playable && e.playable.path ? basename(e.playable.path) : "")
        : "";
    });

    const p = (e, t = {}) => {
      t[e.uuid] = e.path;

      if (e.children) {
        e.children.forEach((e) => {
          p(e, t);
        });
      }
    };

    (0, vue_js_1.onMounted)(async () => {
      var e;

      var t = await Editor.Message.request(
        "scene",
        "query-current-animation-info"
      );

      if (t) {
        a.value = t.rootid;

        t = await Editor.Message.request("scene", "query-node-tree", t.rootid);

        e = {};
        p(t, e);
        o.value = e;
      }
    });

    const _ = (e) => {
      var t = (0, vue_js_1.unref)(r.value);
      Editor.Message.request("scene", "animation-operation", [
        {
          funcName: "updateEmbeddedPlayer",
          args: [n.value.clipUuid, t, e],
        },
      ]);
    };

    expose({
      updatePlayerData: (e) => {
        var t = { rootNode: a.value, pathPattern: e.root + "/**" };
        l.value = JSON.stringify(t);
        r.value = e.dump;
        n.value = e;
      },
    });

    return {
      selectInfo: n,
      childNodeRef: u,
      embeddedPlayer: r,
      nodeFilterOptionsStr: l,
      typeInfo: s,
      childNodeUuid: i,
      defaultDisplayName: d,
      onDisplayNameConfirm: (e) => {
        var t = (0, vue_js_1.unref)(r);

        if (t) {
          t = { ...t, displayName: e };
          _(t);
          r.value = t;
        }
      },
      onReconciledSpeed: (e) => {
        var t = (0, vue_js_1.unref)(r);

        if (t) {
          t = { ...t, reconciledSpeed: e };
          _(t);
          r.value = t;
        }
      },
      onNodeConfirm: (e) => {
        var t = (0, vue_js_1.unref)(r);
        var a = (0, vue_js_1.unref)(o);

        if (t?.playable) {
          t = { ...t, playable: { ...t.playable } };

          !(a = (a[e] || "").replace(n.value.root, "")) && e
            ? (u.value.value = i.value)
            : ((t.playable.path = e && a), _(t), (r.value = t));
        }
      },
      onAssetConfirm: (e) => {
        var t = (0, vue_js_1.unref)(r);

        if (t && t.playable) {
          t = { ...t, playable: { ...t.playable, clip: e } };
          _(t);
          r.value = t;
        }
      },
    };
  },
  template: vueTemplate,
});

const EmbeddedPlayerVMExtend = vue_js_1.default.extend(EmbeddedPlayerVM);
async function update(e) {
  if (vm) {
    try {
      var t = e.map((e) => JSON.parse(e));
      vm.updatePlayerData(t[0]);
    } catch (e) {
      console.error(e);
    }
  }
}
function ready() {
  panel = this;
  vm?.$destroy();
  (vm = new EmbeddedPlayerVMExtend()).$mount(panel.$.container);
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(
  join(__dirname, "../../../dist/embedded-player.css"),
  "utf8"
);

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };
