var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, a = n) => {
        var o = Object.getOwnPropertyDescriptor(t, n);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, a, o);
      }
    : (e, t, n, a) => {
        e[(a = a === undefined ? n : a)] = t[n];
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
          var n = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              n[n.length] = t;
            }
          }
          return n;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var n = o(e), a = 0; a < n.length; a++) {
          if (n[a] !== "default") {
            __createBinding(t, e, n[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.position = undefined;
exports.ready = ready;
exports.update = update;
exports.close = close;
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let $scene = null;
let panel = null;
let vm = null;

const vueTemplate = `
<div class="prefab"
    v-if="show"
>
    <ui-icon value="prefab"></ui-icon>
    <span>PREFAB</span>
    <ui-button class="save"
        @confirm="save()"
    >
        <ui-label value="i18n:scene.save_prefab"></ui-label>
    </ui-button>
    <ui-button class="close"
        @confirm="close()"
    >
        <ui-label value="i18n:scene.close_prefab"></ui-label>
    </ui-button>
</div>
`;

const ScenePrefabModeVM = Vue.extend({
  name: "ScenePrefabModeVM",
  data() {
    return { show: false, align: false };
  },
  methods: {
    async save() {
      if ($scene) {
        await $scene.callSceneMethod("saveScene");
      }
    },
    async close() {
      if ($scene) {
        await $scene.callSceneMethod("closeScene");
      }
    },
  },
  template: vueTemplate,
});

async function ready(e) {
  panel = this;
  e = await ($scene = e.previousElementSibling).callSceneMethod("queryMode");
  vm?.$destroy();
  vm = new ScenePrefabModeVM();
  vm.show = e === "prefab";
  vm.$mount(panel.$.container);
  vm.isMultiSceneEdit = await isMultiSceneEdit();
}
async function update(e) {
  if (vm) {
    vm.show = e.modes[e.modes.length - 1] === "prefab";
  }
}
async function isMultiSceneEdit() {
  return Boolean(await Editor.Profile.getConfig("scene", "scene.multi"));
}
function close() {
  vm?.$destroy();
  vm = null;
  panel = null;
  $scene = null;
}
exports.position = "left";

exports.template = `
<style>
     .prefab {
        line-height: 24px;
    }
    
    .prefab > ui-button {
        border: none;
    }
    
    .prefab > .save{
        margin-right: 6px;
    }
</style>
<div class="prefab"></div>
`;

exports.$ = { container: ".prefab" };
exports.default = __importStar(require("./prefab-mode"));
