var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, o, n);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
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
        for (var r = n(e), o = 0; o < r.length; o++) {
          if (r[o] !== "default") {
            __createBinding(t, e, r[o]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.default = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.position = undefined;

exports.ready = ready;
exports.close = close;
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let $scene = null;
let panel = null;
let vm = null;

const vueTemplate = `
<div class="camera2d"
    v-show="is2D"
>
    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.zoom_reset"
        @click.stop="zoomReset"
    >
         <ui-icon value="scale-origin"></ui-icon>
    </ui-button>
</div>
`;

const SceneCamera2DVM = Vue.extend({
  name: "SceneCamera2DVM",
  data() {
    return { is2D: false };
  },
  methods: {
    zoomReset() {
      if ($scene) {
        $scene.callSceneMethod("resetSceneViewZoom");
      }
    },
  },
  template: vueTemplate,
});

function ready(e) {
  close();
  panel = this;
  $scene = e.nextElementSibling;
  vm?.$destroy();
  (vm = new SceneCamera2DVM()).$mount(panel.$.container);

  Editor.Message.__protected__.addBroadcastListener(
    "scene:ready",
    panel.sceneReady
  );

  Editor.Message.__protected__.addBroadcastListener(
    "scene:dimension-changed",
    panel.dimensionChanged
  );
}
function close() {
  if (panel) {
    Editor.Message.__protected__.removeBroadcastListener(
      "scene:ready",
      panel.sceneReady
    );

    Editor.Message.__protected__.removeBroadcastListener(
      "scene:dimension-changed",
      panel.dimensionChanged
    );
  }

  vm?.$destroy();
  vm = null;
  panel = null;
  $scene = null;
}
exports.position = "right";

exports.template = `
<style>
.camera2d {
    position: relative;
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    background-color: var(--color-default-fill-emphasis);
    border-top: 1px solid var(--color-default-border-normal);
    border-bottom: 1px solid var(--color-default-border-normal);
    border-left: 1px solid var(--color-default-border-normal);
    border-radius: calc(var(--size-normal-radius) * 2px) 0 0 calc(var(--size-normal-radius) * 2px);
}

.camera2d > ui-button {
    margin-top: -1px;
    margin-left: -1px;
    border-radius: calc(var(--size-normal-radius) * 2px) 0 0 calc(var(--size-normal-radius) * 2px);
}
</style>
<div class="camera2d"></div>
`;

exports.$ = { container: ".camera2d" };

exports.methods = {
  dimensionChanged(e) {
    if (vm) {
      vm.is2D = e;
    }
  },
  async sceneReady() {
    var e = await Editor.Message.request("scene", "query-is2D");

    if (panel) {
      panel.dimensionChanged(e);
    }
  },
};

exports.default = __importStar(require("./camera2d"));
