"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,n,r){void 0===r&&(r=n);var o=Object.getOwnPropertyDescriptor(t,n);o&&("get"in o?t.__esModule:!o.writable&&!o.configurable)||(o={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,r,o)}:function(e,t,n,r){e[r=void 0===r?n:r]=t[n]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(){var o=function(e){return(o=Object.getOwnPropertyNames||function(e){var t,n=[];for(t in e)Object.prototype.hasOwnProperty.call(e,t)&&(n[n.length]=t);return n})(e)};return function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n=o(e),r=0;r<n.length;r++)"default"!==n[r]&&__createBinding(t,e,n[r]);return __setModuleDefault(t,e),t}}();Object.defineProperty(exports,"__esModule",{value:!0}),exports.$=exports.template=exports.style=void 0,exports.ready=ready,exports.close=close;const AssetConfigComp=__importStar(require("./asset-config")),Vue=require("vue/dist/vue.js");Vue.config.productionTip=!1,Vue.config.devtools=!1;let panel=null,vm=null;const vueTemplate=`
<div class="assetDB">
    <div class="default-meta">
        <ui-label value="i18n:asset-db.preferences.defaultMeta"></ui-label>
        <ui-icon value="help" tooltip="i18n:asset-db.preferences.defaultMetaTip"></ui-icon>
        <asset-config></asset-config>
    </div>
</div>
`,PreferencesVM=Vue.extend({name:"PreferencesVM",components:{"asset-config":AssetConfigComp},template:vueTemplate});function ready(){panel=this,vm?.$destroy(),(vm=new PreferencesVM).$mount(panel.$.container)}function close(){vm?.$destroy(),vm=null,panel=null}exports.style=`
ui-prop > ui-label { padding-left: 2em; }
ui-icon { cursor: pointer; }
.setting[type='local'] { color: var(--color-warn-fill); padding-right: 2px; }
`,exports.template=`
<div class="container"></div>
`,exports.$={container:".container"};