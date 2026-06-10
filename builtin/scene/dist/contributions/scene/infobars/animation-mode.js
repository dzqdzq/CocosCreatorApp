var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, i = n) => {
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

        Object.defineProperty(e, i, o);
      }
    : (e, t, n, i) => {
        e[(i = i === undefined ? n : i)] = t[n];
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
        for (var n = o(e), i = 0; i < n.length; i++) {
          if (n[i] !== "default") {
            __createBinding(t, e, n[i]);
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
<div class="animation"
    v-if="show"
>
    <ui-icon value="animation"></ui-icon>
    <span>ANIM</span>
    <ui-button class="save"
        @confirm="save()"
    >
        <ui-label value="i18n:scene.save_clip"></ui-label>
    </ui-button>
    <ui-button  class="close"
        @confirm="close()"
    >
        <ui-label value="i18n:scene.close_clip"></ui-label>
    </ui-button>
</div>
`;

const SceneAnimationModeVM = Vue.extend({
  name: "SceneAnimationModeVM",
  data() {
    return { show: false, align: false, isSaving: false, isClosing: false };
  },
  methods: {
    async save() {
      if (!this.isSaving) {
        this.isSaving = true;
        try {
          await $scene.callSceneMethod("saveScene");
        } catch (e) {
          console.error(e);
        }
        this.isSaving = false;
      }
    },
    async close() {
      if (!this.isClosing) {
        this.isClosing = true;
        try {
          if ($scene) {
            await $scene.callSceneMethod("closeScene");
          }
        } catch (e) {
          console.error(e);
        }
        this.isClosing = false;
      }
    },
  },
  template: vueTemplate,
});

async function ready(e) {
  panel = this;
  e = await ($scene = e.previousElementSibling).callSceneMethod("queryMode");
  vm?.$destroy();
  vm = new SceneAnimationModeVM();
  vm.show = e === "animation";
  vm.$mount(panel.$.container);
}
function update(e) {
  if (vm) {
    vm.show = e.modes[e.modes.length - 1] === "animation";
  }
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
    .animation {
        line-height: 24px;
    }
    
    .animation > ui-button{
        border: none;
    }
    
    .animation > .save{
        margin-right: 6px;
    }
</style>
<div class="animation"></div>
`;

exports.$ = { container: ".animation" };
exports.default = __importStar(require("./animation-mode"));
