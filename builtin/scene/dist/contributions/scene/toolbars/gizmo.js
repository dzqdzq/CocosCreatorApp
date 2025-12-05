"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,i,o,t){void 0===t&&(t=o);var s=Object.getOwnPropertyDescriptor(i,o);s&&("get"in s?i.__esModule:!s.writable&&!s.configurable)||(s={enumerable:!0,get:function(){return i[o]}}),Object.defineProperty(e,t,s)}:function(e,i,o,t){e[t=void 0===t?o:t]=i[o]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,i){Object.defineProperty(e,"default",{enumerable:!0,value:i})}:function(e,i){e.default=i}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var i={};if(null!=e)for(var o in e)"default"!==o&&Object.prototype.hasOwnProperty.call(e,o)&&__createBinding(i,e,o);return __setModuleDefault(i,e),i};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.ready=exports.methods=exports.$=exports.template=exports.position=void 0;const Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let $scene=null,panel=null,vm=null;const vueTemplate=`
<div class="gizmo-settings"
    :style-2d="is2D"
>
    <ui-button type="icon" class="transparent" 
        @click.stop="toolbarMenu"
    >
        <ui-icon value="setting"></ui-icon>
    </ui-button>

    <div class="popup"
        v-show="showMenu"
        @click.stop
    >
        <ui-prop :disabled="is2D" style="--left-width: auto;">
            <ui-checkbox slot="label"
                :value="gizmo.toolsVisibility3d"
                @confirm="set3DToolsVisibility($event.target.value)"
            >
                <ui-label value="i18n:scene.gizmos.tools_visibility_3d"></ui-label>
            </ui-checkbox>
        </ui-prop>
        <ui-prop :disabled="is2D">
            <ui-checkbox slot="label"
                :value="gizmo.is3DIcon"
                @confirm="set3DIcon($event.target.value)"
            >
                <ui-label value="i18n:scene.gizmos.icon3d"></ui-label>
            </ui-checkbox>
            <ui-num-input slot="content" min="0" max="8" step="1"
                :value="gizmo.iconSize"
                @change="setIconSize($event.target.value)"
            ></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-checkbox slot="label"
                :value="gizmo.gridVisible"
                @confirm="setGridVisible($event.target.value)"
            >
                <ui-label value="i18n:scene.gizmos.showGrid"></ui-label>
            </ui-checkbox>
            <ui-color slot="content"
                :value="JSON.stringify(gizmo.gridColor)"
                @change="setGridLineColor($event.target.value)"
            ></ui-color>
        </ui-prop>
    </div>
</div>
`,SceneGizmoVM=Vue.extend({name:"SceneGizmoVM",data(){return{menuName:"gizmo-settings",toolsVisibility3d:!1,is2D:!1,showMenu:!1,mouseOver:!1,showColorPanel:!1,gizmo:{}}},methods:{toolbarMenu(){Editor.Message.broadcast("scene:toolbar-menu-active",this.menuName)},async setGridVisible(e){$scene&&await $scene.callSceneMethod("setGridVisible",[e]),await Editor.Profile.setConfig("scene","gizmos-infos.gridVisible",e)},async set3DToolsVisibility(e){$scene&&await $scene.callSceneMethod("setToolsVisibility3d",[e]),await Editor.Profile.setConfig("scene","gizmos-infos.toolsVisibility3d",e)},async set3DIcon(e){$scene&&await $scene.callSceneMethod("setIconGizmo3D",[e]),await Editor.Profile.setConfig("scene","gizmos-infos.is3DIcon",e)},async setIconSize(e){$scene&&await $scene.callSceneMethod("setIconGizmoSize",[e]),await Editor.Profile.setConfig("scene","gizmos-infos.iconSize",e)},async setGridLineColor(e){$scene&&await $scene.callSceneMethod("setGridLineColor",[e]),await Editor.Profile.setConfig("scene","gizmos-infos.gridColor",e)}},template:vueTemplate});function ready(e){close(),panel=this,$scene=e.nextElementSibling,null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new SceneGizmoVM).$mount(panel.$.container),Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.addBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive),panel.sceneReady()}function close(){panel&&(Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.removeBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive)),null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null,$scene=null}exports.position="right",exports.template=`
<style>
.gizmo-settings {
    position: relative;
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    background-color: var(--color-default-fill-emphasis);
    border-top: 1px solid var(--color-default-border-normal);
    border-bottom: 1px solid var(--color-default-border-normal);
    border-right: 1px solid var(--color-default-border-normal);
    border-radius: 0 calc(var(--size-normal-radius) * 2px) calc(var(--size-normal-radius) * 2px) 0;
}

.gizmo-settings > ui-button {
    margin-top: -1px;
    margin-right: -1px;
    border-radius: 0 calc(var(--size-normal-radius) * 2px) calc(var(--size-normal-radius) * 2px) 0;
}

.gizmo-settings[style-2d] {
    border-right: none;
    margin-right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.gizmo-settings[style-2d] > ui-button {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.gizmo-settings .popup {
    position: absolute;
    top: 30px;
    right: -1px;
    z-index: 2;
    padding: 10px 10px 5px 10px;
    width: 200px;
    background-color: var(--color-normal-fill);
    border-radius: calc(var(--size-normal-radius) * 2px);
    border: 1px solid var(--color-normal-fill-weakest);
}
.gizmo-settings .popup ui-prop {
    margin-bottom: 5px;
    --left-width: 45%;
}
</style>

<div class="gizmo-settings"></div>
`,exports.$={container:".gizmo-settings"},exports.methods={dimensionChanged(e){vm&&(vm.is2D=e)},async sceneReady(){var e=await Editor.Message.request("scene","query-is2D");panel&&panel.dimensionChanged(e)},toolbarMenuActive(e){vm&&(e!==vm.menuName||vm.showMenu?vm.showMenu&&(vm.showMenu=!1):(vm.showMenu=!0,panel.gizmoConfig()))},async gizmoConfig(){var e=await Editor.Profile.getConfig("scene","gizmos-infos");vm&&vm.$set(vm,"gizmo",e)}},exports.ready=ready,exports.close=close,exports.default=__importStar(require("./gizmo"));