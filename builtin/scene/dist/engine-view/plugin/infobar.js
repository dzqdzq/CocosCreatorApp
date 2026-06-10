var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var o = Object.getOwnPropertyDescriptor(t, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, o);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
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
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = o(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = undefined;
exports.init = init;
exports.register = register;
exports.unregister = unregister;
exports.update = update;
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let vm = null;
function init(e) {
  vm?.$destroy();

  vm = new Vue({
    el: e,
    components: {
      plugin: {
        props: ["option"],
        template: '<div v-html="option.template"></div>',
        mounted() {
          const r = this;
          const i = { $: {} };
          r.option.__vm__ = i;

          if (r.option.$) {
            Object.keys(r.option.$).forEach((e) => {
              var t = r.option.$[e];
              i.$[e] = r.$el.querySelector(t);
            });
          }

          if (r.option.ready) {
            r.option.ready.call(i, vm.$el);
          }
        },
      },
    },
    data: { left: [], right: [] },
    mounted() {
      Editor.Profile.getConfig("scene", "scene.multi").then((e) => {
        if (e) {
          vm.$el.classList.add("multi-tabs");
        } else {
          vm.$el.classList.remove("multi-tabs");
        }
      });
    },
  });

  return vm;
}
const barMaps = {};
function register(e, t) {
  barMaps[e] = t;

  if (vm) {
    t.forEach((e) => {
      if (e.position === "left") {
        vm.left.push(e);
      } else if (e.position === "right") {
        vm.right.push(e);
      }
    });
  }
}
function unregister(e) {
  var t = barMaps[e];

  if (t && vm) {
    t.forEach((e) => {
      var t = vm.left.indexOf(e);
      var r = vm.right.indexOf(e);

      if (-1 !== t) {
        vm.left.splice(t, 1);
      }

      if (-1 !== r) {
        vm.right.splice(r, 1);
      }

      e.close?.call(e.__vm__);
    });

    delete barMaps[e];
  }
}
function update(t, r, i) {
  for (const e in barMaps) {
    barMaps[e].forEach((e) => {
      if (e.update) {
        e.update.call(e.__vm__, t, r, i);
      }
    });
  }
}
exports.default = __importStar(require("./infobar"));
