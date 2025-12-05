"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.update=exports.$=exports.template=exports.style=void 0;const fs_1=require("fs"),path_1=require("path"),Vue=require("vue/dist/vue.js"),CompressTexture=(Vue.config.productionTip=!1,Vue.config.devtools=!1,require("./compress-texture")),vueTemplate=`
<div class="compress-texture">
    <compress-texture
        v-if="meta"
        :meta="meta"
        :metas="metas"
        :readonly="info.readonly"
        @confirm="onChanged"
        ref="child"
    ></compress-texture>
</div>`;function update(e,t){const s=this;var r;s.vm||((r=new Vue({name:"InspectorImage",components:{"compress-texture":CompressTexture},data:{infos:[],metas:[],meta:{},info:{}},methods:{onChanged(){s.dispatch("change"),s.dispatch("snapshot")},refresh(){this.$refs.child.refresh()}},template:vueTemplate})).$mount(s.$.container),s.vm=r),s.vm.infos=e,s.vm.metas=t,s.vm.info=e[0],s.vm.meta=t[0],s.vm.refresh()}function close(){var e;null!=(e=this.vm)&&e.$destroy(),this.vm=null}exports.style=(0,fs_1.readFileSync)((0,path_1.join)(__dirname,"./compress-texture.css"),"utf8"),exports.template='<div class="container"></div>',exports.$={container:".container"},exports.update=update,exports.close=close;