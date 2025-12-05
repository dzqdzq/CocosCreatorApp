"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,o,i){void 0===i&&(i=o);var n=Object.getOwnPropertyDescriptor(t,o);n&&("get"in n?t.__esModule:!n.writable&&!n.configurable)||(n={enumerable:!0,get:function(){return t[o]}}),Object.defineProperty(e,i,n)}:function(e,t,o,i){e[i=void 0===i?o:i]=t[o]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var o in e)"default"!==o&&Object.prototype.hasOwnProperty.call(e,o)&&__createBinding(t,e,o);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.ready=exports.methods=exports.$=exports.template=exports.position=void 0;const panel_constant_1=require("../../../panel/panel-constant"),Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let panel=null,vm=null;const vueTemplate=`
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
`,SceneLightVM=Vue.extend({name:"SceneLightVM",data(){return{is2D:!1,isNative:!1,active:!0,disabled:!1}},methods:{toggleSceneLight(){this.disabled||(this.active=!this.active,Editor.Message.send("scene","set-scene-light-on",this.active))}},template:vueTemplate});function ready(){close(),panel=this,null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new SceneLightVM).$mount(panel.$.container),Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.addBroadcastListener("scene:editor-preview-set-play",panel.onEditorPreviewPlay),panel.sceneReady()}function close(){panel&&(Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.removeBroadcastListener("scene:editor-preview-set-play",panel.onEditorPreviewPlay)),null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null}exports.position="right",exports.template=`
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
`,exports.$={container:".scene-light"},exports.methods={dimensionChanged(e){vm&&(vm.is2D=e)},async sceneReady(){var e=await Editor.Message.request("scene","query-is2D"),e=(panel&&panel.dimensionChanged(e),await Editor.Message.request("scene","query-scene-light-on")),t=await Editor.Message.request("scene","is-native");vm&&(vm.active=e,vm.isNative=t)},toolbarMenuActive(e){vm&&(e!==vm.menuName||vm.showMenu?vm.showMenu&&(vm.showMenu=!1):vm.showMenu=!0)},onEditorPreviewPlay(e){vm.isNative&&(e===panel_constant_1.EditorPreviewState.Start?vm.disabled=!0:e===panel_constant_1.EditorPreviewState.Stop&&(vm.disabled=!1))}},exports.ready=ready,exports.close=close,exports.default=__importStar(require("./scene-light"));