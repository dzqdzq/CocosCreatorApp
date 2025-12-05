"use strict";function getVueComponentFromConfig(o,e){var r=[];if(o.options&&r.push(createTemplateComp(o.options,e)),o.custom)try{var n=Editor.Module.__protected__.requireFile(o.custom);n.name=e+"custom",r.push(n)}catch(o){console.error(o)}return r}function createTemplateComp(o,e){return{template:`
        <div v-if="configs">
            <build-prop v-for="(config, name) in configs"
                :key="name"
                :path="name"
                :config="config"
                :value="pkgOptions && pkgOptions[name]"
                :error="errorMap[name]"
            ></build-prop>
        </div>`,data(){return{configs:o,pkgOptions:{},errorMap:{}}},props:["args","root"],components:{buildProp:require("../components/build-prop/index")},name:e+"options"}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.getVueComponentFromConfig=void 0,exports.getVueComponentFromConfig=getVueComponentFromConfig;