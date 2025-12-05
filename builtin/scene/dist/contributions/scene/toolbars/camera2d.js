"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,r,o){void 0===o&&(o=r);var a=Object.getOwnPropertyDescriptor(t,r);a&&("get"in a?t.__esModule:!a.writable&&!a.configurable)||(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,o,a)}:function(e,t,r,o){e[o=void 0===o?r:o]=t[r]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&__createBinding(t,e,r);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.ready=exports.methods=exports.$=exports.template=exports.position=void 0;const Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let $scene=null,panel=null,vm=null;const vueTemplate=`
<div class="camera2d"
    v-show="is2D"
>
    <ui-button type="icon" class="transparent" tooltip="i18n:scene.ui_tools.zoom_reset"
        @click.stop="zoomReset"
    >
         <ui-icon value="scale-origin"></ui-icon>
    </ui-button>
</div>
`,SceneCamera2DVM=Vue.extend({name:"SceneCamera2DVM",data(){return{is2D:!1}},methods:{zoomReset(){$scene&&$scene.callSceneMethod("resetSceneViewZoom")}},template:vueTemplate});function ready(e){close(),panel=this,$scene=e.nextElementSibling,null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new SceneCamera2DVM).$mount(panel.$.container),Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged)}function close(){panel&&(Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",panel.dimensionChanged)),null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null,$scene=null}exports.position="right",exports.template=`
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
`,exports.$={container:".camera2d"},exports.methods={dimensionChanged(e){vm&&(vm.is2D=e)},async sceneReady(){var e=await Editor.Message.request("scene","query-is2D");panel&&panel.dimensionChanged(e)}},exports.ready=ready,exports.close=close,exports.default=__importStar(require("./camera2d"));