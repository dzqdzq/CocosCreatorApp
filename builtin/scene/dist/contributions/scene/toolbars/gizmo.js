"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(i,e,o,t){void 0===t&&(t=o);var s=Object.getOwnPropertyDescriptor(e,o);s&&("get"in s?e.__esModule:!s.writable&&!s.configurable)||(s={enumerable:!0,get:function(){return e[o]}}),Object.defineProperty(i,t,s)}:function(i,e,o,t){i[t=void 0===t?o:t]=e[o]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(i,e){Object.defineProperty(i,"default",{enumerable:!0,value:e})}:function(i,e){i.default=e}),__importStar=this&&this.__importStar||function(){var s=function(i){return(s=Object.getOwnPropertyNames||function(i){var e,o=[];for(e in i)Object.prototype.hasOwnProperty.call(i,e)&&(o[o.length]=e);return o})(i)};return function(i){if(i&&i.__esModule)return i;var e={};if(null!=i)for(var o=s(i),t=0;t<o.length;t++)"default"!==o[t]&&__createBinding(e,i,o[t]);return __setModuleDefault(e,i),e}}();Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.methods=exports.$=exports.template=exports.position=void 0,exports.ready=ready,exports.close=close;const Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let $scene=null,panel=null,vm=null;const vueTemplate=`
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
        <ui-prop :hidden="is2D" style="--left-width: auto;">
            <ui-checkbox slot="label"
                :value="gizmo.toolsVisibility3d"
                @confirm="set3DToolsVisibility($event.target.value)"
            >
                <ui-label value="i18n:scene.gizmos.tools_visibility_3d"></ui-label>
            </ui-checkbox>
        </ui-prop>
        <ui-prop :hidden="is2D">
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
        <ui-prop>
            <ui-checkbox slot="label"
                :value="getOriginAxis()"
                @confirm="changeOriginAxis($event.target.value)"
            >
                <ui-label value="i18n:scene.gizmos.showOriginAxis"></ui-label>
            </ui-checkbox>
            <div slot="content">
                <ui-button class="origin-axis-button" outline :checked="getOriginAxisByXYZ('x')"
                    @confirm="onCheckOriginAxisButton($event, 'x')"
                >
                    <ui-label value="X"></ui-label>
                </ui-button>
                <ui-button class="origin-axis-button" outline :checked="getOriginAxisByXYZ('y')"
                    @confirm="onCheckOriginAxisButton($event, 'y')"
                >
                    <ui-label value="Y"></ui-label>
                </ui-button>
                <ui-button :hidden="is2D" class="origin-axis-button" outline :checked="getOriginAxisByXYZ('z')"
                    @confirm="onCheckOriginAxisButton($event, 'z')"
                >
                    <ui-label value="Z"></ui-label>
                </ui-button>
            </div>
        </ui-prop>
    </div>
</div>
`,SceneGizmoVM=Vue.extend({name:"SceneGizmoVM",data(){return{menuName:"gizmo-settings",toolsVisibility3d:!1,is2D:!1,showMenu:!1,mouseOver:!1,showColorPanel:!1,gizmo:{originAxis2D:{x_visible:!0,y_visible:!0,z_visible:!0},originAxis3D:{x_visible:!0,y_visible:!0,z_visible:!0}}}},methods:{getOriginAxis(){var i=this.is2D?this.gizmo.originAxis2D:this.gizmo.originAxis3D;return i.x_visible||i.y_visible||i.z_visible},getOriginAxisByXYZ(i){var e=this.is2D?this.gizmo.originAxis2D:this.gizmo.originAxis3D;return"x"===i?e.x_visible:"y"===i?e.y_visible:"z"===i&&e.z_visible},toolbarMenu(){Editor.Message.broadcast("scene:toolbar-menu-active",this.menuName)},async setGridVisible(i){$scene&&await $scene.callSceneMethod("setGridVisible",[i]),await Editor.Profile.setConfig("scene","gizmos-infos.gridVisible",i)},changeOriginAxis(i){i={x_visible:i,y_visible:i,z_visible:i};this.is2D?(this.gizmo.originAxis2D=i,Editor.Profile.setConfig("scene","gizmos-infos.originAxis2D",i)):(this.gizmo.originAxis3D=i,Editor.Profile.setConfig("scene","gizmos-infos.originAxis3D",i))},onCheckOriginAxisButton(i,e){var o,e=e+"_visible";this.is2D?(o=!this.gizmo.originAxis2D[e],this.gizmo.originAxis2D[e]=o,Editor.Profile.setConfig("scene","gizmos-infos.originAxis2D",this.gizmo.originAxis2D)):(o=!this.gizmo.originAxis3D[e],this.gizmo.originAxis3D[e]=o,Editor.Profile.setConfig("scene","gizmos-infos.originAxis3D",this.gizmo.originAxis3D))},async set3DToolsVisibility(i){$scene&&await $scene.callSceneMethod("setToolsVisibility3d",[i]),await Editor.Profile.setConfig("scene","gizmos-infos.toolsVisibility3d",i)},async set3DIcon(i){$scene&&await $scene.callSceneMethod("setIconGizmo3D",[i]),await Editor.Profile.setConfig("scene","gizmos-infos.is3DIcon",i)},async setIconSize(i){$scene&&await $scene.callSceneMethod("setIconGizmoSize",[i]),await Editor.Profile.setConfig("scene","gizmos-infos.iconSize",i)},async setGridLineColor(i){$scene&&await $scene.callSceneMethod("setGridLineColor",[i]),await Editor.Profile.setConfig("scene","gizmos-infos.gridColor",i)}},template:vueTemplate});function ready(i){close(),panel=this,$scene=i.nextElementSibling,vm?.$destroy(),(vm=new SceneGizmoVM).$mount(panel.$.container),Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.addBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive),panel.sceneReady()}function close(){panel&&(Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.removeBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive)),vm?.$destroy(),vm=null,panel=null,$scene=null}exports.position="right",exports.template=`
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

.origin-axis-button[checked] {
    color: var(--color-active-contrast, #cccccc);
    background-color: var(--color-info-fill-important, #094a5d);
    border-color: var(--color-focus-border-emphasis, #227f9b);
}
.origin-axis-button[hidden] {
    display: none;
}
</style>

<div class="gizmo-settings"></div>
`,exports.$={container:".gizmo-settings"},exports.methods={dimensionChanged(i){vm&&(vm.is2D=i)},async sceneReady(){var i=await Editor.Message.request("scene","query-is2D");panel&&panel.dimensionChanged(i)},toolbarMenuActive(i){vm&&(i!==vm.menuName||vm.showMenu?vm.showMenu&&(vm.showMenu=!1):(vm.showMenu=!0,panel.gizmoConfig()))},async gizmoConfig(){var i=await Editor.Profile.getConfig("scene","gizmos-infos");vm&&vm.$set(vm,"gizmo",i)}},exports.default=__importStar(require("./gizmo"));