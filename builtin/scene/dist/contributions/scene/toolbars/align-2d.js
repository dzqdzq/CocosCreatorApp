var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, n = i) => {
        var o = Object.getOwnPropertyDescriptor(t, i);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, n, o);
      }
    : (e, t, i, n) => {
        e[(n = n === undefined ? i : n)] = t[i];
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
        for (var i = o(e), n = 0; n < i.length; n++) {
          if (i[n] !== "default") {
            __createBinding(t, e, i[n]);
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
exports.update = update;
exports.close = close;
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let $scene = null;
let panel = null;
let vm = null;

const vueTemplate = `
<div class="align-2d" 
    v-show="is2D"
>
    <ui-button type="icon" class="transparent" 
        @click.stop="toolbarMenu"
    >
        <ui-icon value="align-more-down"></ui-icon>
    </ui-button>
    <div class="wrap" 
        v-show="showMenu" 
        @click.stop
    >
        <div class="item">
            <ui-label value="i18n:scene.alignment"></ui-label>
            <div class="content">
                <div class="alignment"
                    :valid="validAlign"
                >
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.align_top" 
                        @click="align('top')"
                    >
                        <ui-icon value="align-top"></ui-icon>
                    </ui-button>
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.align_v_center" 
                        @click="align('v-center')"
                    >
                        <ui-icon value="align-v-center"></ui-icon>
                    </ui-button>
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.align_bottom" 
                        @click="align('bottom')"
                    >
                        <ui-icon value="align-bottom"></ui-icon>
                    </ui-button>
                    
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.align_left" 
                        @click="align('left')"
                    >
                        <ui-icon value="align-left"></ui-icon>
                    </ui-button>
                    
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.align_h_center"
                        @click="align('h-center')"
                    >
                       <ui-icon value="align-h-center"></ui-icon>
                    </ui-button>
                    
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.align_right"
                        @click="align('right')"
                    >
                        <ui-icon value="align-right"></ui-icon>
                    </ui-button>
                </div>
            </div>
        </div>
        <div class="item distribute">
            <ui-label value="i18n:scene.distribution"></ui-label>
            <div class="content">
                <div class="alignment"
                    :valid="validDistribute"
                >
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.distribute_top"
                        @click="distribute('top')"
                    >
                        <ui-icon value="distribute-top"></ui-icon>
                    </ui-button>
                
                     <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.distribute_v_center"
                        @click="distribute('v-center')"
                    >
                        <ui-icon value="distribute-v-center"></ui-icon>
                    </ui-button>
                
                     <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.distribute_bottom" 
                        @click="distribute('bottom')"
                    >
                         <ui-icon value="distribute-bottom"></ui-icon>
                    </ui-button>
                    
                     <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.distribute_left" 
                        @click="distribute('left')"
                    >
                        <ui-icon value="distribute-left"></ui-icon>    
                    </ui-button>
                   
                   <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.distribute_h_center"
                        @click="distribute('h-center')"
                    >
                        <ui-icon value="distribute-h-center"></ui-icon>    
                    </ui-button>
                    
                    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.distribute_right"
                        @click="distribute('right')"
                    >
                        <ui-icon value="distribute-right"></ui-icon>
                    </ui-button>
                </div>
            </div>
        </div>
    </div>
</div>
`;

const SceneAlign2DVM = Vue.extend({
  name: "SceneAlign2DVM",
  data() {
    return {
      is2D: false,
      showMenu: false,
      menuName: "align-2d",
      validAlign: false,
      validDistribute: false,
    };
  },
  methods: {
    toolbarMenu() {
      Editor.Message.broadcast("scene:toolbar-menu-active", this.menuName);
    },
    align(e) {
      if ($scene) {
        $scene.callSceneMethod("alignSelectionUI", [e]);
      }
    },
    distribute(e) {
      if ($scene) {
        $scene.callSceneMethod("distributeSelectionUI", [e]);
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
  (vm = new SceneAlign2DVM()).$mount(panel.$.container);

  Editor.Message.__protected__.addBroadcastListener(
    "scene:ready",
    panel.sceneReady
  );

  Editor.Message.__protected__.addBroadcastListener(
    "scene:dimension-changed",
    panel.dimensionChanged
  );

  Editor.Message.__protected__.addBroadcastListener(
    "scene:toolbar-menu-active",
    panel.toolbarMenuActive
  );

  panel.sceneReady();
}
function update(e) {
  if (e && vm) {
    vm.validAlign = e.nodes.length > 1;
    vm.validDistribute = e.nodes.length > 2;
  }
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
      "scene:toolbar-menu-active",
      panel.toolbarMenuActive
    );
  }

  vm?.$destroy();
  vm = null;
  panel = null;
  $scene = null;
}
exports.position = "left";

exports.template = `
<style>
    .align-2d {
        position: relative;
        background-color: var(--color-default-fill-emphasis);
        box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal);
        margin-right: 8px;
        border-radius: calc(var(--size-normal-radius) * 2px);
    }
    
    .align-2d > ui-button {
        border-radius: calc(var(--size-normal-radius) * 2px);
    }
    
    .align-2d > .wrap {
        position: absolute;
        top: 30px;
        left: 0;
        z-index: 2;
        padding: 10px;
        background-color: var(--color-normal-fill);
        border-radius: calc(var(--size-normal-radius) * 2px);
        border: 1px solid var(--color-normal-fill-weakest);
    }
    
    .align-2d > .wrap > .item > ui-label {
        color: var(--color-normal-contrast-emphasis);
    }
    
    .alignment { 
        display: flex;
    }

    .alignment > ui-button { 
        pointer-events: none;
        opacity: 0.55;
    }

    .alignment > ui-button:nth-of-type(4) {
        margin-left: 24px;
    }

    .alignment[valid] > ui-button { 
        pointer-events: auto;
        opacity: 1;
    }

    .distribute { 
        margin-top: 10px;
    }

</style>

<div class="align-2d"></div>
`;

exports.$ = { container: ".align-2d" };

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
};

exports.default = __importStar(require("./align-2d"));
