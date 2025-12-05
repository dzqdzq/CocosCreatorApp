"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.importConfig=exports.exportConfig=exports.close=exports.ready=exports.$=exports.template=exports.style=void 0;const utils_1=require("./utils"),Vue=require("vue/dist/vue.js"),vueTemplate=(Vue.config.productionTip=!1,Vue.config.devtools=!1,`
<ui-section expand whole class="modules">
    <ui-label slot="header" value="i18n:engine.project.macroConfig.customMacro"></ui-label>

    <template
        v-for="(item, index) in macro"
    >
        <div class="item"
            :key="index"
        >
            <ui-prop>
                <div slot="label"
                    :editing="item.key === editName"
                >
                    <ui-label
                        :value="item.key"
                    ></ui-label>
                    <ui-input
                        :class="!!errorInfo ? 'danger' : ''"
                        :value="item.key"
                        @change="changeMacroName($event.target.value)"
                        @blur="confirmMacroName(item, $event.target.value)"
                        @keyup.enter.stop="$event.target.blur()"
                    ></ui-input>
                    <ui-button class="btn transparent" type="icon"
                        tooltip="i18n:engine.project.macroConfig.edit"
                        @click="editMacro($event, item.key)"
                    >
                        <ui-icon value="edit"></ui-icon>
                    </ui-button>
                    <ui-button class="btn transparent" type="icon"
                        tooltip="i18n:engine.project.macroConfig.del"
                        @click="delMacro(item)"
                    >
                        <ui-icon color="true" value="del"></ui-icon>
                    </ui-button>
                </div>
                <ui-checkbox slot="content"
                    :value="item.value"
                    :disabled="item.key === editName && !!errorInfo"
                    @confirm="toggleMacro(item)"
                ></ui-checkbox>
            </ui-prop>
        </div>
        <div class="error-info"
            v-if="item.key === editName && !!errorInfo"
        >
            <ui-label
                :value="errorInfo"
            ></ui-label>
        </div>
    </template>
    
    <div class="generateMacro"
        v-show="generateMacro"
    >
        <ui-prop>
            <div slot="label" editing>
                <ui-input ref="addInput"
                    :class="!!errorInfo ? 'danger' : ''"
                    @change="changeMacroName($event.target.value)"
                    @blur="confirmNewMacro"
                    @keyup.enter.stop="$event.target.blur()"
                ></ui-input>
            </div>
            <ui-checkbox slot="content" disabled></ui-checkbox>
        </ui-prop>
        <div class="error-info"
            v-if="!!errorInfo"
        >
            <ui-label
                :value="errorInfo"
            ></ui-label>
        </div>
    </div>

    <div class="add">
        <ui-button class="blue"
            @confirm="addMacro"
        >
            <ui-icon value="add"></ui-icon>
            <ui-label value="i18n:engine.project.macroConfig.add"></ui-label>
        </ui-button>
    </div>
</ui-section>
`),EngineProjectMacroVM=Vue.extend({data(){return{generateMacro:!1,macro:[],editName:"",errorInfo:""}},methods:{t(e){return e?(e=e.replace("i18n:",""),Editor.I18n.t(e)||e):""},async refresh(){this.editName=this.errorInfo="";var e=await Editor.Profile.getProject("engine","macroCustom");this.macro=e},async save(){await Editor.Profile.setProject("engine","macroCustom",this.macro)},addMacro(){this.errorInfo="";const e=this.$refs.addInput;e.value="",this.generateMacro=!0,requestAnimationFrame(()=>{e.focus()})},editMacro(e,i){this.editName=i,this.errorInfo="";i=e.target;const o=null==(e=i.parentElement)?void 0:e.parentElement;requestAnimationFrame(()=>{var e;o&&(e=o.querySelector("ui-input"))&&e.focus()})},async delMacro(e){0===(await Editor.Dialog.info(Editor.I18n.t("engine.project.macroConfig.delete.msg",{name:e.key}),{title:Editor.I18n.t("engine.project.macroConfig.delete.title"),buttons:[Editor.I18n.t("engine.project.macroConfig.delete.confirm"),Editor.I18n.t("engine.project.macroConfig.delete.cancel")],default:0,cancel:1})).response&&0<=(e=this.macro.indexOf(e))&&(this.macro.splice(e,1),this.save())},confirmNewMacro(){this.generateMacro=!1;var e=this.$refs.addInput,i=e.value;e.value="",i&&!this.errorInfo&&(this.macro.push({key:i,value:!1}),this.editName="",this.save())},toggleMacro(e){e.value=!e.value,this.save()},changeMacroName(e){e=(0,utils_1.checkMacro)(this.macro,e);!e.value&&e.msg?this.errorInfo=e.msg:this.errorInfo=""},confirmMacroName(e,i){this.editName="",this.errorInfo||e.key===i||(e.key=i,this.save())}},template:vueTemplate});async function ready(){var e=this;e.vm=new EngineProjectMacroVM,e.vm.$mount(e.$.container),await e.vm.refresh()}function close(){var e;null!=(e=this.vm)&&e.$destroy(),this.vm=null}async function exportConfig(){var e={};return e.macroCustom=await Editor.Message.request("project","query-config","engine","macroCustom")||[],e}async function importConfig(e){e.macroCustom&&await Editor.Message.request("project","set-config","engine","macroCustom",e.macroCustom)}exports.style=`
.modules { margin-top: 2em; }
.modules .item { display: flex; margin: 4px 0; }
.modules .item:hover ui-prop > div:not([editing]) > .btn { display: flex; }
.modules ui-prop { flex: 1; --left-width: 40%; }
.modules ui-prop > div { display: flex; flex: 1; }

.modules ui-prop > div ui-input { display: none; }

.modules ui-prop > div[editing] ui-input { display: flex; }

.modules ui-prop > div[editing] ui-label,
.modules ui-prop > div[editing] ui-button { display: none; }

.modules ui-prop > div > ui-label,
.modules ui-prop > div > ui-input { flex: 1; }

.modules ui-prop > div > ui-input.danger { border-color: var(--color-danger-fill-weaker); }
.modules ui-prop > div > .btn { display: none; margin: 0 4px; }
.modules .add { margin-top: 1em; }
.modules .add > ui-button { width: 200px; }
.modules .add > ui-button > ui-icon { margin-right: 8px; }

.modules .error-info {
    color: var(--color-danger-fill-weaker);
    margin-bottom: 4px;
}
`,exports.template='<div class="container"></div>',exports.$={container:".container"},exports.ready=ready,exports.close=close,exports.exportConfig=exportConfig,exports.importConfig=importConfig;