var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, o, r = o) => {
        var n = Object.getOwnPropertyDescriptor(t, o);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[o];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, o, r) => {
        e[(r = r === undefined ? o : r)] = t[o];
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
          var o = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              o[o.length] = t;
            }
          }
          return o;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var o = n(e), r = 0; r < o.length; r++) {
          if (o[r] !== "default") {
            __createBinding(t, e, o[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.$ = undefined;
exports.style = undefined;
exports.template = undefined;
exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;
const Vue = require("vue/dist/vue.js");
let panel = null;
let vm;
Vue.config.productionTip = false;
Vue.config.devtools = false;
const phone_1 = require("../utils/phone");
const home = __importStar(require("./components/home"));
async function ready(e) {
  panel = this;
  phone_1.phone.options = e;
  e = await Editor.Message.request(
    "program",
    "query-program-info",
    "androidSDK"
  );
  await phone_1.phone.init(e ? e.path : "");

  vm = new Vue({
    el: panel.$.home,
    components: home.components,
    created: home.created,
    data: home.data(),
    methods: home.methods,
    watch: home.watch,
  });
}
async function beforeClose() {}
async function close() {
  if (vm) {
    vm.$destroy();
  }
}
exports.template = home.template;
exports.style = home.style;
exports.$ = { home: ".home" };
exports.methods = {};
