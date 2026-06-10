var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, o = n) => {
        var i = Object.getOwnPropertyDescriptor(t, n);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, o, i);
      }
    : (e, t, n, o) => {
        e[(o = o === undefined ? n : o)] = t[n];
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
    var i = (e) =>
      (i =
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
        for (var n = i(e), o = 0; o < n.length; o++) {
          if (n[o] !== "default") {
            __createBinding(t, e, n[o]);
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
const panel_constant_1 = require("../../../panel/panel-constant");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;

const vueTemplate = `
<div class="scene-light" 
    v-show="!is2D"
    :active="active"
    :disabled="disabled"
>
    <ui-button 
        :disabled="disabled"
        type="icon"
        class="transparent"
        tooltip="i18n:scene.scene_view.is_scene_light_on"
        @click.stop="toggleSceneLight"
    >
        <ui-icon value='spot-light'></ui-icon>
    </ui-button>
</div>
`;

const SceneLightVM = Vue.extend({
  name: "SceneLightVM",
  data() {
    return { is2D: false, isNative: false, active: true, disabled: false };
  },
  methods: {
    toggleSceneLight() {
      if (!this.disabled) {
        this.active = !this.active;
        Editor.Message.send("scene", "set-scene-light-on", this.active);
      }
    },
  },
  template: vueTemplate,
});

function ready() {
  close();
  panel = this;
  vm?.$destroy();
  (vm = new SceneLightVM()).$mount(panel.$.container);

  Editor.Message.__protected__.addBroadcastListener(
    "scene:ready",
    panel.sceneReady
  );

  Editor.Message.__protected__.addBroadcastListener(
    "scene:dimension-changed",
    panel.dimensionChanged
  );

  Editor.Message.__protected__.addBroadcastListener(
    "scene:editor-preview-set-play",
    panel.onEditorPreviewPlay
  );

  panel.sceneReady();
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

    Editor.Message.__protected__.removeBroadcastListener(
      "scene:editor-preview-set-play",
      panel.onEditorPreviewPlay
    );
  }

  vm?.$destroy();
  vm = null;
  panel = null;
}
exports.position = "right";

exports.template = `
<style>
    .scene-light {
        position: relative;
        background-color: var(--color-default-fill-emphasis);
        box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal);
        margin-right: 8px;
        border-radius: calc(var(--size-normal-radius) * 2px);
        overflow: hidden;
    }

    .scene-light[active] {
        background-color: var(--colo-info-fill-important);
        color: var(--color-info-contrast-important);
        box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-info-fill-important);
    }
    .scene-light[active] ui-button {
        background-color: var(--color-info-fill-important);
        color: var(--color-info-contrast-important);
    }
    /* vue2 对 disabled 有特殊处理 https://v2.vuejs.org/v2/guide/syntax.html#Attributes */
    .scene-light[disabled] {
        cursor: not-allowed;
        box-shadow: none;
    }
</style>

<div class="scene-light"></div>
`;

exports.$ = { container: ".scene-light" };

exports.methods = {
  dimensionChanged(e) {
    if (vm) {
      vm.is2D = e;
    }
  },
  async sceneReady() {
    var e = await Editor.Message.request("scene", "query-is2D");

    var e =
      (panel && panel.dimensionChanged(e),
      await Editor.Message.request("scene", "query-scene-light-on"));

    var t = await Editor.Message.request("scene", "is-native");

    if (vm) {
      vm.active = e;
      vm.isNative = t;
    }
  },
  toolbarMenuActive(e) {
    if (vm) {
      if (e !== vm.menuName || vm.showMenu) {
        if (vm.showMenu) {
          vm.showMenu = false;
        }
      } else {
        vm.showMenu = true;
      }
    }
  },
  onEditorPreviewPlay(e) {
    if (vm.isNative) {
      if (e === panel_constant_1.EditorPreviewState.Start) {
        vm.disabled = true;
      } else if (e === panel_constant_1.EditorPreviewState.Stop) {
        vm.disabled = false;
      }
    }
  },
};

exports.default = __importStar(require("./scene-light"));
