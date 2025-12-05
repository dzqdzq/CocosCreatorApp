"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n);var o=Object.getOwnPropertyDescriptor(t,n);o&&("get"in o?t.__esModule:!o.writable&&!o.configurable)||(o={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,i,o)}:function(e,t,n,i){e[i=void 0===i?n:i]=t[n]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&__createBinding(t,e,n);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.update=exports.ready=exports.$=exports.template=exports.position=void 0;const Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let $scene=null,panel=null,vm=null;const vueTemplate=`
<div class="animation"
    v-if="show"
>
    <ui-icon value="animation"></ui-icon>
    <span>ANIM</span>
    <ui-button class="save"
        @confirm="save()"
    >
        <ui-label value="i18n:scene.save_clip"></ui-label>
    </ui-button>
    <ui-button  class="close"
        @confirm="close()"
    >
        <ui-label value="i18n:scene.close_clip"></ui-label>
    </ui-button>
</div>
`,SceneAnimationModeVM=Vue.extend({name:"SceneAnimationModeVM",data(){return{show:!1,align:!1,isSaving:!1,isClosing:!1}},methods:{async save(){if(!this.isSaving){this.isSaving=!0;try{await $scene.callSceneMethod("saveScene")}catch(e){console.error(e)}this.isSaving=!1}},async close(){if(!this.isClosing){this.isClosing=!0;try{$scene&&await $scene.callSceneMethod("closeScene")}catch(e){console.error(e)}this.isClosing=!1}}},template:vueTemplate});async function ready(e){panel=this;e=await($scene=e.previousElementSibling).callSceneMethod("queryMode");null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new SceneAnimationModeVM).show="animation"===e,vm.$mount(panel.$.container)}function update(e){vm&&(vm.show="animation"===e.modes[e.modes.length-1])}function close(){null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null,$scene=null}exports.position="left",exports.template=`
<style>
    .animation {
        line-height: 24px;
    }
    
    .animation > ui-button{
        border: none;
    }
    
    .animation > .save{
        margin-right: 6px;
    }
</style>
<div class="animation"></div>
`,exports.$={container:".animation"},exports.ready=ready,exports.update=update,exports.close=close,exports.default=__importStar(require("./animation-mode"));