"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,a,t,r){void 0===r&&(r=t);var o=Object.getOwnPropertyDescriptor(a,t);o&&("get"in o?a.__esModule:!o.writable&&!o.configurable)||(o={enumerable:!0,get:function(){return a[t]}}),Object.defineProperty(e,r,o)}:function(e,a,t,r){e[r=void 0===r?t:r]=a[t]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,a){Object.defineProperty(e,"default",{enumerable:!0,value:a})}:function(e,a){e.default=a}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var a={};if(null!=e)for(var t in e)"default"!==t&&Object.prototype.hasOwnProperty.call(e,t)&&__createBinding(a,e,t);return __setModuleDefault(a,e),a};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.ready=exports.methods=exports.$=exports.template=exports.position=void 0;const Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let $scene=null,panel=null,vm=null;const vueTemplate=`
<div class="camera3d" :style-2d="is2D">
    <ui-button type="icon" class="transparent" @click.stop="toolbarMenu">
        <ui-icon value="camera"></ui-icon>
    </ui-button>
    <div class="popup"
        v-show="showMenu"
        @click.stop
    >
        <ui-section expand>
            <div class="header" slot="header">
                <ui-label> Scene Camera </ui-label>
                <ui-button class="transparent"
                    @click.right.stop="onCameraSettings"
                    @click.left.stop="onCameraSettings"
                >
                    <ui-icon value="menu"></ui-icon>
                </ui-button>        
            </div>
            <div class="content" >
                <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.fov" tooltip="i18n:scene.editor_camera.fovTip"></ui-label>
                <ui-slider slot="content" min="0.01" max="179"
                    :value="camera.fov"
                    @change="setFov($event.target.value)"
                >
                </ui-slider>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.far" tooltip="i18n:scene.editor_camera.farTip"></ui-label>
                <ui-num-input slot="content" min="0.01"
                    :value="camera.far"
                    @change="setFar($event.target.value)"
                >
                </ui-num-input>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.near" tooltip="i18n:scene.editor_camera.nearTip"></ui-label>
                <ui-num-input slot="content" min="0.01"
                    :value="camera.near"
                    @change="setNear($event.target.value)"
                >
                </ui-num-input>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.color" tooltip="i18n:scene.editor_camera.colorTip"></ui-label>
                <ui-color slot="content"
                    :value="JSON.stringify(camera.color)"
                    @change="setColor($event.target.value)"
                ></ui-color>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.wheel" tooltip="i18n:scene.editor_camera.wheelTip"></ui-label>
                <ui-slider slot="content" min="0.000001" max="100" step="0.01"
                    :value="camera.wheelSpeed"
                    @change="setWheelSpeed($event.target.value)"
                ></ui-slider>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.wander" tooltip="i18n:scene.editor_camera.wanderTip"></ui-label>
                <ui-slider slot="content" min="0.01" max="100" step="0.1"
                    :value="camera.wanderSpeed"
                    @change="setWanderSpeed($event.target.value)"
                ></ui-slider>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.enableAcceleration" tooltip="i18n:scene.editor_camera.enableAccelerationTip"></ui-label>
                <ui-checkbox slot="content"
                    :value="camera.enableAcceleration"
                    @change="setEnableAcceleration($event.target.value)"
                ></ui-checkbox>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.aperture" tooltip="i18n:scene.editor_camera.apertureTip"></ui-label>
                <ui-select slot="content"
                    :value="camera.aperture"
                    @change="setAperture($event.target.value)"
                >
                <option v-for="item in camera.apertureList" :key="item.value" :value="item.value">{{item.name}}</option>
                </ui-select>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:scene.editor_camera.shutter" tooltip="i18n:scene.editor_camera.shutterTip"></ui-label>
                <ui-select slot="content"
                    :value="camera.shutter"
                    @change="setShutter($event.target.value)"
                >
                <option v-for="item in camera.shutterList" :key="item.value" :value="item.value">{{item.name}}</option>
                </ui-select>
            </ui-prop>
            <ui-prop>
            <ui-label slot="label" value="i18n:scene.editor_camera.iso" tooltip="i18n:scene.editor_camera.isoTip"></ui-label>
            <ui-select slot="content"
                :value="camera.iso"
                @change="setIso($event.target.value)"
            >
            <option v-for="item in camera.isoList" :key="item.value" :value="item.value">{{item.name}}</option>
            </ui-select>
        </ui-prop>
        </div>
        </ui-section>
    </div>
</div>
`,SceneCamera3DVM=Vue.extend({name:"SceneCamera3dToolbar",data(){return{is2D:!1,showMenu:!1,menuName:"camera-3d",camera:{fov:45,far:1e4,near:.01,aperture:19,apertureList:[],iso:0,isoList:[],shutter:7,shutterList:[],color:[51,51,51,255],wheelSpeed:.01,wanderSpeed:10,enableAcceleration:!0}}},methods:{toolbarMenu(){Editor.Message.broadcast("scene:toolbar-menu-active",this.menuName)},setFov(e){this.camera.fov=e-=0,$scene&&$scene.callSceneMethod("setCameraProperty",[{fov:e}])},setFar(e){this.camera.far=e-=0,$scene&&$scene.callSceneMethod("setCameraProperty",[{far:e}])},setNear(e){this.camera.near=e-=0,$scene&&$scene.callSceneMethod("setCameraProperty",[{near:e}])},setColor(e){this.camera.color=e,$scene&&$scene.callSceneMethod("setCameraProperty",[{clearColor:e}])},setWheelSpeed(e){this.camera.wheelSpeed=e-=0,$scene&&$scene.callSceneMethod("setCameraWheelSpeed",[e])},setWanderSpeed(e){this.camera.wanderSpeed=e-=0,$scene&&$scene.callSceneMethod("setCameraWanderSpeed",[e])},setEnableAcceleration(e){this.camera.enableAcceleration=e,$scene&&$scene.callSceneMethod("setCameraEnableAcceleration",[e])},setAperture(e){this.camera.aperture=e,$scene&&$scene.callSceneMethod("setCameraProperty",[{aperture:e}])},setShutter(e){this.camera.shutter=e,$scene&&$scene.callSceneMethod("setCameraProperty",[{shutter:e}])},setIso(e){this.camera.iso=e,$scene&&$scene.callSceneMethod("setCameraProperty",[{iso:e}])},onCameraSettings(){Editor.Menu.popup({menu:[{label:"i18n:scene.editor_camera.settings.reset",click:async()=>{$scene&&(await $scene.callSceneMethod("resetCameraProperty"),await panel.cameraConfig())}}]})}},template:vueTemplate});function ready(e){close(),panel=this,$scene=e.nextElementSibling,null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new SceneCamera3DVM).$mount(panel.$.container),Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.addBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive),panel.sceneReady()}function close(){panel&&(Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.removeBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive)),null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null,$scene=null}exports.position="right",exports.template=`
<style>
.camera3d {
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

.camera3d > ui-button {
    margin-top: -1px;
    margin-left: -1px;
    border-radius: calc(var(--size-normal-radius) * 2px) 0 0 calc(var(--size-normal-radius) * 2px);
}

.camera3d[style-2d] {
    border-left: none;
    margin-left: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.camera3d[style-2d] > ui-button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

.camera3d .popup {
    position: absolute;
    top: 30px;
    right: 0;
    z-index: 2;
    padding: 10px 10px 5px 10px;
    width: 210px;
    background-color: var(--color-normal-fill);
    border-radius: calc(var(--size-normal-radius) * 2px);
    border: 1px solid var(--color-normal-fill-weakest);
}

.camera3d .popup ui-prop {
    margin-bottom: 5px;
    --left-width: 40%;
}
.camera3d .popup ui-prop ui-slider {
    --ui-slider-bar-width: 55%;
}

.camera3d .header {
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;
    flex-direction: row;
    width: 100%;
}

.camera3d .content {
    padding: 4px;
}
</style>

<div class="camera3d"></div>
`,exports.$={container:".camera3d"},exports.methods={dimensionChanged(e){vm&&(vm.is2D=e)},async sceneReady(){var e=await Editor.Message.request("scene","query-is2D");panel&&panel.dimensionChanged(e)},toolbarMenuActive(e){vm&&(e!==vm.menuName||vm.showMenu?vm.showMenu&&(vm.showMenu=!1):(vm.showMenu=!0,panel.cameraConfig()))},async cameraConfig(){var e,a,t,r;$scene&&(e=await $scene.callSceneMethod("getCameraProperty"),a=await $scene.callSceneMethod("getCameraWheelSpeed"),t=await $scene.callSceneMethod("getCameraWanderSpeed"),r=await $scene.callSceneMethod("getCameraEnableAcceleration"),vm)&&vm.$set(vm,"camera",{fov:e.fov.value,far:e.far.value,near:e.near.value,aperture:e.aperture.value,apertureList:e.aperture.enumList,iso:e.iso.value,isoList:e.iso.enumList,shutter:e.shutter.value,shutterList:e.shutter.enumList,color:Object.values(e.clearColor.value),wheelSpeed:a,wanderSpeed:t,enableAcceleration:r})}},exports.ready=ready,exports.close=close,exports.default=__importStar(require("./camera3d"));