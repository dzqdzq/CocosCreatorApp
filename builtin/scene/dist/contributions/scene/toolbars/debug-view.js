var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, i, l, n = l) => {
        var a = Object.getOwnPropertyDescriptor(i, l);

        if (
          !a ||
          (!("get" in a) ? !a.writable && !a.configurable : i.__esModule)
        ) {
          a = {
            enumerable: true,
            get() {
              return i[l];
            },
          };
        }

        Object.defineProperty(e, n, a);
      }
    : (e, i, l, n) => {
        e[(n = n === undefined ? l : n)] = i[l];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, i) => {
        Object.defineProperty(e, "default", { enumerable: true, value: i });
      }
    : (e, i) => {
        e.default = i;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var a = (e) =>
      (a =
        Object.getOwnPropertyNames ||
        ((e) => {
          var i;
          var l = [];
          for (i in e) {
            if (Object.prototype.hasOwnProperty.call(e, i)) {
              l[l.length] = i;
            }
          }
          return l;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var i = {};
      if (e != null) {
        for (var l = a(e), n = 0; n < l.length; n++) {
          if (l[n] !== "default") {
            __createBinding(i, e, l[n]);
          }
        }
      }
      __setModuleDefault(i, e);
      return i;
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
const debug_view_component_1 = require("./debug-view-component");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let $scene = null;
let panel = null;
let vm = null;

const vueTemplate = `
    <ui-prop class="debug-view"
        v-show="!is2D"
        @click.stop="toolbarMenu"
    >
        <ui-label class="select-text" 
            :value="selectText"
        ></ui-label>
        <ui-icon class="select-icon" value="arrow-triangle"></ui-icon>
        
        <debug-view-component class="wrap" ref="component"
            :children="children"
        ></debug-view-component>
    </ui-prop>
`;

const SceneDebugViewVM = Vue.extend({
  name: "SceneDebugViewVM",
  components: {
    "debug-view-component": debug_view_component_1.DebugViewComponent,
  },
  data() {
    return {
      is2D: false,
      showMenu: false,
      selectText: "i18n:scene.debug_view.shaded",
      menuName: "debug-view",
      children: [
        {
          label: "i18n:scene.debug_view.base_shading",
          el: "ui-label",
          group: "radio",
          value: "SHADED",
          children: [
            {
              label: "i18n:scene.debug_view.shaded",
              el: "ui-radio",
              value: "SHADED",
            },
          ],
        },
        {
          label: "i18n:scene.debug_view.rendering_debug_options",
          el: "ui-label",
          nextPanel: true,
          children: [
            {
              label: "i18n:scene.debug_view.lighting_with_base_color",
              el: "ui-checkbox",
              value: true,
              type: "LIGHTING_WITH_BASE_COLOR",
            },
            {
              label: "i18n:scene.debug_view.CSM_layer_coloration",
              el: "ui-checkbox",
              value: false,
              type: "CSM_LAYER_COLORATION",
            },
            {
              label: "i18n:scene.debug_view.rendering_single_option",
              el: "ui-label",
              group: "radio",
              value: "NONE",
              children: [
                {
                  label: "i18n:scene.debug_view.disable_all_single_options",
                  el: "ui-radio",
                  value: "NONE",
                  type: "single",
                },
                { label: "i18n:scene.debug_view.model_info", el: "ui-label" },
                {
                  label: "i18n:scene.debug_view.vertex_colors",
                  el: "ui-radio",
                  value: "VERTEX_COLOR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.world_normal",
                  el: "ui-radio",
                  value: "VERTEX_NORMAL",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.world_tangent",
                  el: "ui-radio",
                  value: "VERTEX_TANGENT",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.world_position",
                  el: "ui-radio",
                  value: "WORLD_POS",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.mirrored_normal",
                  el: "ui-radio",
                  value: "VERTEX_MIRROR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.front_face_coloration",
                  el: "ui-radio",
                  value: "FACE_SIDE",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.UV0",
                  el: "ui-radio",
                  value: "UV0",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.UV1",
                  el: "ui-radio",
                  value: "UV1",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.light_map_uv",
                  el: "ui-radio",
                  value: "UV_LIGHTMAP",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.projection_depth_z",
                  el: "ui-radio",
                  value: "PROJ_DEPTH",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.liner_depth_w",
                  el: "ui-radio",
                  value: "LINEAR_DEPTH",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.material_info",
                  el: "ui-label",
                },
                {
                  label: "i18n:scene.debug_view.world_space_pixel_normals",
                  el: "ui-radio",
                  value: "FRAGMENT_NORMAL",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.world_space_pixel_tangents",
                  el: "ui-radio",
                  value: "FRAGMENT_TANGENT",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.world_space_pixel_binormals",
                  el: "ui-radio",
                  value: "FRAGMENT_BINORMAL",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.base_color",
                  el: "ui-radio",
                  value: "BASE_COLOR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.diffuse_color",
                  el: "ui-radio",
                  value: "DIFFUSE_COLOR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.specular_color",
                  el: "ui-radio",
                  value: "SPECULAR_COLOR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.opacity",
                  el: "ui-radio",
                  value: "TRANSPARENCY",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.metallic",
                  el: "ui-radio",
                  value: "METALLIC",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.roughness",
                  el: "ui-radio",
                  value: "ROUGHNESS",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.specular_intensity",
                  el: "ui-radio",
                  value: "SPECULAR_INTENSITY",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ior",
                  el: "ui-radio",
                  value: "IOR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.lighting_info",
                  el: "ui-label",
                },
                {
                  label: "i18n:scene.debug_view.direct_diffuse",
                  el: "ui-radio",
                  value: "DIRECT_DIFFUSE",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.direct_specular",
                  el: "ui-radio",
                  value: "DIRECT_SPECULAR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.direct_lighting",
                  el: "ui-radio",
                  value: "DIRECT_ALL",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ambient_diffuse",
                  el: "ui-radio",
                  value: "ENV_DIFFUSE",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ambient_specular",
                  el: "ui-radio",
                  value: "ENV_SPECULAR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ambient_lighting",
                  el: "ui-radio",
                  value: "ENV_ALL",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.emissive",
                  el: "ui-radio",
                  value: "EMISSIVE",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.light_map",
                  el: "ui-radio",
                  value: "LIGHT_MAP",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.shadows",
                  el: "ui-radio",
                  value: "SHADOW",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ambient_occlusion",
                  el: "ui-radio",
                  value: "AO",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.adv_lighting_info",
                  el: "ui-label",
                },
                {
                  label: "i18n:scene.debug_view.fresnel",
                  el: "ui-radio",
                  value: "FRESNEL",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.direct_transmit_diffuse",
                  el: "ui-radio",
                  value: "DIRECT_TRANSMIT_DIFFUSE",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.direct_transmit_specular",
                  el: "ui-radio",
                  value: "DIRECT_TRANSMIT_SPECULAR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ambient_transmit_diffuse",
                  el: "ui-radio",
                  value: "ENV_TRANSMIT_DIFFUSE",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ambient_transmit_specular",
                  el: "ui-radio",
                  value: "ENV_TRANSMIT_SPECULAR",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.transmit_lighting",
                  el: "ui-radio",
                  value: "TRANSMIT_ALL",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.direct_trt",
                  el: "ui-radio",
                  value: "DIRECT_TRT",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.ambient_trt",
                  el: "ui-radio",
                  value: "ENV_TRT",
                  type: "single",
                },
                {
                  label: "i18n:scene.debug_view.trt_lighting",
                  el: "ui-radio",
                  value: "TRT_ALL",
                  type: "single",
                },
                { label: "i18n:scene.debug_view.misc_info", el: "ui-label" },
                {
                  label: "i18n:scene.debug_view.fog_factor",
                  el: "ui-radio",
                  value: "FOG",
                  type: "single",
                },
              ],
            },
            {
              label: "i18n:scene.debug_view.rendering_composite_options",
              el: "ui-label",
              group: "checkbox",
              children: [
                {
                  label: "i18n:scene.debug_view.enable_all_composite_options",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "ALL",
                },
                { label: "i18n:scene.debug_view.lighting", el: "ui-label" },
                {
                  label: "i18n:scene.debug_view.direct_diffuse",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "DIRECT_DIFFUSE",
                },
                {
                  label: "i18n:scene.debug_view.direct_specular",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "DIRECT_SPECULAR",
                },
                {
                  label: "i18n:scene.debug_view.ambient_diffuse",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "ENV_DIFFUSE",
                },
                {
                  label: "i18n:scene.debug_view.ambient_specular",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "ENV_SPECULAR",
                },
                {
                  label: "i18n:scene.debug_view.emissive",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "EMISSIVE",
                },
                {
                  label: "i18n:scene.debug_view.light_map",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "LIGHT_MAP",
                },
                {
                  label: "i18n:scene.debug_view.shadows",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "SHADOW",
                },
                {
                  label: "i18n:scene.debug_view.ambient_occlusion",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "AO",
                },
                { label: "i18n:scene.debug_view.misc_info", el: "ui-label" },
                {
                  label: "i18n:scene.debug_view.normalMap",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "NORMAL_MAP",
                },
                {
                  label: "i18n:scene.debug_view.fog_factor",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "FOG",
                },
                {
                  label: "i18n:scene.debug_view.tone_mapping",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "TONE_MAPPING",
                },
                {
                  label: "i18n:scene.debug_view.cammacorrection",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "GAMMA_CORRECTION",
                },
                {
                  label: "i18n:scene.debug_view.adv_lighting_info",
                  el: "ui-label",
                },
                {
                  label: "i18n:scene.debug_view.fresnel",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "FRESNEL",
                },
                {
                  label: "i18n:scene.debug_view.transmit_diffuse",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "TRANSMIT_DIFFUSE",
                },
                {
                  label: "i18n:scene.debug_view.transmit_specular",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "TRANSMIT_SPECULAR",
                },
                {
                  label: "i18n:scene.debug_view.trt_lighting",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "TRT",
                },
                {
                  label: "i18n:scene.debug_view.tt_lighting",
                  el: "ui-checkbox",
                  value: true,
                  type: "composite",
                  key: "TT",
                },
              ],
            },
          ],
        },
      ],
    };
  },
  watch: {
    showMenu(e) {
      var i = this.$refs.component;

      if (i) {
        i.show = e;
      }
    },
  },
  methods: {
    toolbarMenu() {
      Editor.Message.broadcast("scene:toolbar-menu-active", "debug-view");
    },
    changeSelectText(e) {
      this.selectText = e;
    },
    getFitHeight() {
      return $scene ? $scene.getBoundingClientRect().height - 55 : 0;
    },
  },
  template: vueTemplate,
});

async function ready(e) {
  close();
  panel = this;
  $scene = e.nextElementSibling;
  vm?.$destroy();
  (vm = new SceneDebugViewVM()).$mount(panel.$.container);

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
exports.position = "right";

exports.template = `
    <style>
        ui-prop[disabled] {
            opacity: 55%;
        }

        .debug-view {
            position: relative;
            background-color: var(--color-default-fill-emphasis);
            box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal);
            margin-right: 8px;
            border-radius: calc(var(--size-normal-radius) * 2px);
            cursor: pointer;
            padding: 0px 6px;
            white-space: nowrap;
            line-height: 24px;
            height: 24px;
        }

         .debug-view > .select-icon {
            margin-left: 12px;
         }

         .debug-view:hover > .select-text,
         .debug-view:hover > .select-icon {
             color: var(--color-focus-contrast-emphasis);
         }
         
         .debug-view .panel {
            position: absolute;
            display: none;
            white-space: nowrap;
            background-color: var(--color-normal-fill);
            border-radius: calc(var(--size-normal-radius) * 2px);
            border: 1px solid var(--color-normal-fill-weakest);
         }

         .debug-view .panel.wrap {
            top: 30px;
            right: 0;
            z-index: 2;
         }

         .debug-view .panel.inner {
            top: -35px;
            right: -90px;
            width: 200px;
            z-index: 3;
            overflow: auto;
         }

        .debug-view .list {
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .debug-view .list .group {
            flex: 1;
        }
        
        .debug-view .list .column {
            display: block;
            height: 24px;
            padding-left: 10px;
        }

        .debug-view .title {
            display: flex;
            padding-left: 8px;
            color: var(--color-normal-contrast-emphasis);
            background-color: var(--color-normal-fill-emphasis);
            cursor: auto;
        }

        .debug-view .title.next {
            cursor: pointer;
        }

        .debug-view .title.next:hover {
            color: var(--color-normal-contrast);
             background-color: var(--color-hover-fill);
        }

        .debug-view .title.next > ui-label {
            flex: 1;
        }

        .debug-view .title.next > ui-icon {
            font-size: 9px;
            margin-left: 6px;
            margin-right: 6px;
        }
           
        .debug-view .label {
            color: var(--color-normal-contrast-emphasis);
            padding-left: 8px;

        }

        .debug-view .panel.wrap .list:first-child .title {
            border-top-left-radius: calc(var(--size-normal-radius) * 2px);
            border-top-right-radius: calc(var(--size-normal-radius) * 2px);
        }

        .debug-view .panel.wrap .list:last-child .title {
            border-bottom-left-radius: calc(var(--size-normal-radius) * 2px);
            border-bottom-right-radius: calc(var(--size-normal-radius) * 2px);
        }

        .debug-view .panel.inner .list .title {
            border-radius: 0!important;
        }
    </style>
    <ui-prop class="debug-view"></ui-prop>
`;

exports.$ = { container: ".debug-view" };

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

exports.default = __importStar(require("./debug-view"));
