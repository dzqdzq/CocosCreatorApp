"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.ready=exports.$=exports.template=exports.style=void 0;const fs_1=require("fs"),path_1=require("path"),Vue=require("vue/dist/vue.js");let vm=null;function ready(){vm=new Vue({el:this.$.assetDB})}function close(){vm&&(vm.$destroy(),vm=null)}exports.style=(0,fs_1.readFileSync)((0,path_1.join)(__dirname,"./../../dist/preferences.css")),exports.template=`
<div class="assetDB">
    <div class="default-meta">
        <ui-icon value="setting" type='local' class="setting"></ui-icon>
        <ui-label value="i18n:asset-db.preferences.defaultMeta"></ui-label>
        <ui-icon value="help" tooltip="i18n:asset-db.preferences.defaultMetaTip"></ui-icon>
    </div>
</div>
`,exports.$={assetDB:".assetDB"},exports.ready=ready,exports.close=close;