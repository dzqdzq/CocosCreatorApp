"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,n,o){void 0===o&&(o=n);var a=Object.getOwnPropertyDescriptor(t,n);a&&("get"in a?t.__esModule:!a.writable&&!a.configurable)||(a={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,o,a)}:function(e,t,n,o){e[o=void 0===o?n:o]=t[n]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&__createBinding(t,e,n);return __setModuleDefault(t,e),t};Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports.close=exports.update=exports.ready=exports.$=exports.template=exports.position=void 0;const Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let $scene=null,panel=null,vm=null;const vueTemplate=`
<div class="prefab"
    v-if="show"
>
    <ui-icon value="prefab"></ui-icon>
    <span>PREFAB</span>
    <ui-button class="save"
        @confirm="save()"
    >
        <ui-label value="i18n:scene.save_prefab"></ui-label>
    </ui-button>
    <ui-button class="close"
        @confirm="close()"
    >
        <ui-label value="i18n:scene.close_prefab"></ui-label>
    </ui-button>
</div>
`,ScenePrefabModeVM=Vue.extend({name:"ScenePrefabModeVM",data(){return{show:!1,align:!1}},methods:{async save(){$scene&&await $scene.callSceneMethod("saveScene")},async close(){$scene&&await $scene.callSceneMethod("closeScene")}},template:vueTemplate});async function ready(e){panel=this;e=await($scene=e.previousElementSibling).callSceneMethod("queryMode");null!==vm&&void 0!==vm&&vm.$destroy(),(vm=new ScenePrefabModeVM).show="prefab"===e,vm.$mount(panel.$.container)}function update(e){vm&&(vm.show="prefab"===e.modes[e.modes.length-1])}function close(){null!==vm&&void 0!==vm&&vm.$destroy(),vm=null,panel=null,$scene=null}exports.position="left",exports.template=`
<style>
     .prefab {
        line-height: 24px;
    }
    
    .prefab > ui-button{
        border: none;
    }
    
    .prefab > .save{
        margin-right: 6px;
    }
</style>
<div class="prefab"></div>
`,exports.$={container:".prefab"},exports.ready=ready,exports.update=update,exports.close=close,exports.default=__importStar(require("./prefab-mode"));