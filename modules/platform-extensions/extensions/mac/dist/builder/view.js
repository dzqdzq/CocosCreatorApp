"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.template=void 0;const lodash=require("lodash");let panel;const methods={changeRenderBackEndType(e){var t=this,e=e.target.value;t.pkgOptions.renderBackEnd="metal"===e?{metal:!0,gles3:!1}:{metal:!1,gles3:!0},t.emitChange()},emitChange(){panel.dispatch("update","packages."+this.pkgName,this.pkgOptions)},init(){this.pkgOptions=lodash.get(panel.options,"packages."+panel.options.platform)||{}}};async function mounted(){this.dev=Editor.App.dev,this.init()}function update(e,t){panel=this,t&&!t.startsWith("packages."+panel.pkgName)||(panel.options=e,panel.vm.init())}function ready(e,t,a,p){panel=this;var n=require("vue/dist/vue.js");panel.options=e,panel.pkgName=a,panel.vm=new n({el:panel.$.root,data(){return{pkgOptions:{}}},mounted:mounted,methods:methods})}exports.template=`
<div class="mac" v-if="pkgOptions && pkgOptions.renderBackEnd">
    <ui-prop>
        <ui-label slot="label" value="i18n:mac.options.render_back_end"></ui-label>
        <div slot="content">METAL</div>
    </ui-prop>
</div>
`,exports.$={root:".mac"},exports.update=update,exports.ready=ready;