"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,o,i){void 0===i&&(i=o);var n=Object.getOwnPropertyDescriptor(t,o);n&&("get"in n?t.__esModule:!n.writable&&!n.configurable)||(n={enumerable:!0,get:function(){return t[o]}}),Object.defineProperty(e,i,n)}:function(e,t,o,i){e[i=void 0===i?o:i]=t[o]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var o in e)"default"!==o&&Object.prototype.hasOwnProperty.call(e,o)&&__createBinding(t,e,o);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.ready=exports.methods=exports.$=exports.template=void 0;const utils_1=require("./utils"),Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let panel=null,vm=null;const vueTemplate=`
<div class="camera-size" v-show="show" >
    <view-select tooltip="i18n:scene.camera_size.render_target_resolution"
        :options="options"
        :value="outputDevice"
        @change="onChange"
    >
    </view-select>

    <div
        :class="{'device-rotate': true, selected: deviceRotate}"
        @click="handleOnRotate"
    >
        <ui-icon value="rotate"></ui-icon>
    </div>
</div>
`,SceneCameraSizeVM=Vue.extend({name:"SceneCameraSizeVM",components:{"view-select":require("../../../../ui-kit/view-select/index")},data(){return{options:[],outputDevice:"__default_design__",show:!0,deviceRotate:!1}},methods:{async refresh(){var e=await Editor.Message.request("device","query")||[],t=await Editor.Profile.getProject("project","general.designResolution")||{},o=await Editor.Profile.getConfig("scene","camera.size")||"__default_design__",i=null!=(i=await Editor.Profile.getConfig("scene","camera.size_rotate"))&&i,o=(this.outputDevice=o,this.deviceRotate=i,e.map(e=>({label:`${e.name} (${e.width}x${e.height})`,name:e.name})));this.options=[{label:`${Editor.I18n.t("scene.game_view.design_resolution")} (${t.width}x${t.height})`,name:"__default_design__"},{name:"__separator__"},...o,{name:"__separator__"},{label:Editor.I18n.t("scene.game_view.edit"),name:"edit..."}]},async onChange(e){"edit..."===e?Editor.Message.send("preferences","open-settings","device"):(this.outputDevice=e||"__default_design__",await Editor.Profile.setConfig("scene","camera.size",this.outputDevice),Editor.Message.send("scene","change-target-resolution"))},async handleOnRotate(){this.deviceRotate=!this.deviceRotate,await Editor.Profile.setConfig("scene","camera.size_rotate",this.deviceRotate),Editor.Message.send("scene","change-target-resolution")}},template:vueTemplate});async function ready(){close(),panel=this,null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new SceneCameraSizeVM).$mount(panel.$.container),Editor.Profile.__protected__.on("change",panel.generalDesignResolutionChanged),Editor.Message.__protected__.addBroadcastListener("device:devices-changed",panel.deviceChanged),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("i18n:change",vm.refresh),vm&&await vm.refresh(),panel&&await panel.sceneReady()}function close(){panel&&(Editor.Profile.__protected__.removeListener("change",panel.generalDesignResolutionChanged),Editor.Message.__protected__.removeBroadcastListener("device:devices-changed",panel.deviceChanged),Editor.Message.__protected__.removeBroadcastListener("device:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady)),vm&&Editor.Message.__protected__.removeBroadcastListener("i18n:change",vm.refresh),null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null}exports.template=`
<style>
    .view-select-container {
        user-select: none;
        box-sizing: border-box;
        border-radius: calc(var(--size-normal-radius) * 2px);
        display: flex;
        align-items: center;
        position: relative;
        cursor: pointer;
        background-color: rgba(5, 5, 5, 0.68);
        width: 100%;
        height: 24px;
        box-shadow: inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal);
        outline: none;
        text-align: left;
    }

    .view-select-container .view-select {
        display: flex;
        padding-left: 6px;
        padding-right: 20px;
        width: 100%;
        box-sizing: border-box;
        outline: none;
    }

    .view-select #placeholder {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translate(-4px, -50%);
        padding: 0 2em 0 0.8em;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        pointer-events: none;
    }

    .view-select .arrow-triangle {
        display: block;
        position: absolute;
        right: 0;
        top: 50%;
        transform: translate(-4px, -50%);
        font-size: 12px;
        pointer-events: none;
        outline: none;
    }

    .view-select .label {
        overflow: hidden;
    }

    .view-select .label > span {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
    }

    .view-select-container .options {
        background-color: var(--color-normal-fill);
        position: absolute;
        will-change: top, left;
        transform-origin: center top 0px;
        bottom: 28px;
        right: 10px;
        /* 场景容器高度 - 预览的高度 - 工具栏高度30 - 自己的高度30 - 20空隙 */ 
        max-height: calc(var(--scene-height) - var(--float-window-height) - 30px - 30px - 20px);
        max-width: 396px;
        overflow: auto;
        padding: 5px 0;
        box-sizing: border-box;
        border-radius: calc(var(--size-normal-radius) * 2px);
        z-index: 99;
    }

    .options ul {
        width: 100%;
        list-style: none;
        display: flex;
        flex-direction: column;
        padding: 0;
        margin: 0;
    }

    .options ul > li {
        margin: 0;
        padding-left: 8px;
        clear: both;
        font-size: inherit;
        list-style: none;
        cursor: pointer;
        transition: background 0.2s ease-in-out;
        height: 24px;
        line-height: 24px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        box-sizing: border-box;
    }

    .view-select-container .view-select:hover {
        color: var(--color-focus-contrast-emphasis);
    }

    .options ul > li:hover {
        background: var(--color-hover-fill);
    }

    .options ul > .selected {
        background-color: var(--color-info-fill-important);
        color: var(--color-info-contrast-important);
    }

    .options ul > .separator {
        font-size: 0px;
        height: 1px;
        width: calc(100% - 8px);
        overflow: hidden;
        background-color: var(--color-default-border-weakest);
        pointer-events: none;
        margin: 4px 0;
        align-self: center;
    }

    .options ul .no_options {
        display: inline-block;
        min-width: 98px;
        pointer-events: none;
    }

    .view-select-container[focused] {
        border-color: var(--color-focus-border);
    }
    .view-select-container[disabled] {
        cursor: not-allowed;
        opacity: 0.4;
        pointer-events: none;
    }
    .view-select-container[readonly] {
        pointer-events: none;
    }
    .view-select-container[hidden] {
        display: none;
    }

    .camera-size {
        --color-normal-fill-weaker: var(--color-default-fill-emphasis);
        display: flex;
        align-items: center;
    }
    .camera-size .device-rotate {
        margin-left: 4px;
        width: 24px;
        height:24px;
        display:flex;
        justify-content: center;
        align-items: center;
        border-radius:calc(var(--size-normal-radius) * 2px);
        cursor:pointer;
        flex-shrink: 0;
        background-color: rgba(5, 5, 5, 0.68);
        color: var(--ui-button-color-base);
    }
    .camera-size .device-rotate.selected {
        background-color: var(--color-info-fill-important);
        color: var(--color-info-contrast-important);
    }
</style>

<div class="camera-size"></div>
`,exports.$={container:".camera-size"},exports.methods={async deviceChanged(){vm&&(await vm.refresh(),vm)&&"__default_design__"!==vm.outputDevice&&!vm.options.find(e=>e.name===vm.outputDevice)&&vm.onChange("__default_design__")},generalDesignResolutionChanged(e,t,o,i){"project"===e&&t.includes("project")&&o.includes("general.designResolution")&&panel&&panel.deviceChanged()},dimensionChanged(e){vm&&(vm.show=!e)},async sceneReady(){var e;vm&&(e=(0,utils_1.getParentRecursive)(vm.$el,e=>e instanceof HTMLElement&&"ENGINE-VIEW"===e.tagName))&&(e=await e.callSceneMethod("queryIs2D"),vm)&&(vm.show=!e)}},exports.ready=ready,exports.close=close,exports.default=__importStar(require("./camera-size"));