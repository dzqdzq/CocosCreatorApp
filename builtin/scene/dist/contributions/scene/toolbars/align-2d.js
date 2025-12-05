"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,i,n){void 0===n&&(n=i);var o=Object.getOwnPropertyDescriptor(t,i);o&&("get"in o?t.__esModule:!o.writable&&!o.configurable)||(o={enumerable:!0,get:function(){return t[i]}}),Object.defineProperty(e,n,o)}:function(e,t,i,n){e[n=void 0===n?i:n]=t[i]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var i in e)"default"!==i&&Object.prototype.hasOwnProperty.call(e,i)&&__createBinding(t,e,i);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.update=exports.ready=exports.methods=exports.$=exports.template=exports.position=void 0;const Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let $scene=null,panel=null,vm=null;const vueTemplate=`
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
`,SceneAlign2DVM=Vue.extend({name:"SceneAlign2DVM",data(){return{is2D:!1,showMenu:!1,menuName:"align-2d",validAlign:!1,validDistribute:!1}},methods:{toolbarMenu(){Editor.Message.broadcast("scene:toolbar-menu-active",this.menuName)},align(e){$scene&&$scene.callSceneMethod("alignSelectionUI",[e])},distribute(e){$scene&&$scene.callSceneMethod("distributeSelectionUI",[e])}},template:vueTemplate});function ready(e){close(),panel=this,$scene=e.nextElementSibling,null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new SceneAlign2DVM).$mount(panel.$.container),Editor.Message.__protected__.addBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.addBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.addBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive),panel.sceneReady()}function update(e){e&&vm&&(vm.validAlign=1<e.nodes.length,vm.validDistribute=2<e.nodes.length)}function close(){panel&&(Editor.Message.__protected__.removeBroadcastListener("scene:ready",panel.sceneReady),Editor.Message.__protected__.removeBroadcastListener("scene:dimension-changed",panel.dimensionChanged),Editor.Message.__protected__.removeBroadcastListener("scene:toolbar-menu-active",panel.toolbarMenuActive)),null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null,$scene=null}exports.position="left",exports.template=`
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
`,exports.$={container:".align-2d"},exports.methods={dimensionChanged(e){vm&&(vm.is2D=e)},async sceneReady(){var e=await Editor.Message.request("scene","query-is2D");panel&&panel.dimensionChanged(e)},toolbarMenuActive(e){vm&&(e!==vm.menuName||vm.showMenu?vm.showMenu&&(vm.showMenu=!1):vm.showMenu=!0)}},exports.ready=ready,exports.update=update,exports.close=close,exports.default=__importStar(require("./align-2d"));