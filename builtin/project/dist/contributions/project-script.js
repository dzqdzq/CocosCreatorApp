"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.beforeClose=exports.importConfig=exports.exportConfig=exports.ready=exports.$=exports.template=exports.style=void 0;const fs_1=require("fs"),path_1=require("path"),Vue=require("vue/dist/vue.js"),vueTemplate=(Vue.config.productionTip=!1,Vue.config.devtools=!1,`
<div>
    <ui-prop type="ui" class="container"
        tooltip="i18n:project.scripts.exportsConditionsTips"
    >
        <ui-label slot="label" value="i18n:project.scripts.exportsConditions"></ui-label>
        <ui-input slot="content"
            :value="exportsConditions"
            @confirm="changeExportsConditions($event.target.value)"
        ></ui-input>
    </ui-prop>
    <ui-section class="sorting-plugin" expand>
        <header slot="header"style="width: 100%; justify-content: space-between;">
            <ui-label value="i18n:project.scripts.pluginSortingConfig"></ui-label>
            <div class="toolbar">
                <template v-if="editMode === 'json'">
                    <ui-button type="icon" class="transparent"
                        :disabled="!jsonStrDirty"
                        @click.stop="resetJSONData"
                    >
                        <ui-icon value="reset" color="true"></ui-icon>
                    </ui-button>
                    <ui-button type="icon" class="transparent"
                        :disabled="!jsonStrDirty"
                        @click.stop="applyJSONData"
                    >
                        <ui-icon value="check" color="true"></ui-icon>
                    </ui-button>
                </template>
                <template v-else>
                    <ui-button type="icon" class="transparent"
                        :disabled="!selectPlugin.length"
                        @click.stop="remove"
                    >
                        <ui-icon value="mini"></ui-icon>
                    </ui-button>
                    <ui-button type="icon" class="transparent"
                        @click.stop="add"
                    >
                        <ui-icon value="add-more"></ui-icon>
                    </ui-button>
                </template>
                <ui-button type="icon" class="transparent"
                    @click.stop="popMenu"
                >
                    <ui-icon value="menu"></ui-icon>
                </ui-button>
            </div>
        </header>
        <div ref="editor" class="script-content">
            <ui-textarea v-if="editMode === 'json'" 
                :value="jsonStr"
                @change="onJSONChange"
            ></ui-textarea>
            <ui-list v-if="editMode === 'list'"
                :list.prop="pluginScript"
                @change="onListChange"
            >
                <ui-list-item class="script-item" show-prefix draggable="true"
                    v-for="(script, index) in pluginScript"
                    :key="script.uuid"
                    :index="index"
                    :missing="script.missing"
                    :selected="selectPlugin.includes(script.uuid)"
                    @click.stop="onToggleSelectPlugin(script.uuid)"
                >
                    <span class="drag"></span>
                    <ui-label class="index"
                        :value="index"
                    ></ui-label>
                    <ui-label class="script"
                        :value="script.url || script.uuid"
                    ></ui-label>
                </ui-list-item>
            </ui-list>
        </div>
    </ui-section>
</div>
`),ProjectScriptVM=Vue.extend({name:"ProjectScriptVM",data(){return{exportsConditions:"",pluginScript:[],selectPlugin:[],editMode:"list",jsonStr:"",jsonStrDirty:!1}},computed:{sortingPlugins(){return this.pluginScript.map(t=>t.uuid)}},destroyed(){document.removeEventListener("click",this.onBlankClick)},async mounted(){var t=await Editor.Profile.getProject("project","script.exportsConditions"),t=(this.exportsConditions=t.join(","),await Editor.Profile.getProject("project","script.sortingPlugin"));if(t)for(const e of t){var i=e&&await Editor.Message.request("asset-db","query-url",e);i?this.pluginScript.push({uuid:e,url:i}):this.pluginScript.push({uuid:e,missing:!0})}this.onBlankClick=this.clearSelect.bind(this),document.addEventListener("click",this.onBlankClick)},methods:{onBlankClick(){},onListChange(t){this.pluginScript=t.detail.list,this.saveData()},onJSONChange(t){this.jsonStr=t.target.value,this.jsonStrDirty=!0},resetJSONData(){this.jsonStr=JSON.stringify(this.pluginScript.map(t=>t.url||t.uuid),null,4),this.jsonStrDirty=!1},async applyJSONData(){try{var t=JSON.parse(this.jsonStr);const e=await Editor.Message.request("asset-db","batch-message-handler",t.map(t=>({name:"query-uuid",args:[t]}))),s=[],r=[];if(t.forEach((t,i)=>{e[i]?s.push({url:t,uuid:e[i]}):r.push(t)}),r.length)if(0===(await Editor.Dialog.info(Editor.I18n.t("project.scripts.invalidPlugins",{plugin:r.toString()}),{buttons:[Editor.I18n.t("project.scripts.continueEdit"),Editor.I18n.t("project.scripts.confirmCommit")],default:0,cancel:1})).response)return!1;this.pluginScript=s,await Editor.Profile.setProject("project","script.sortingPlugin",e),this.jsonStrDirty=!1,this.editMode="list"}catch(t){return console.warn(t),Editor.Dialog.error(t.message,{title:t.stack}),!1}return!0},changeExportsConditions(t){Editor.Profile.setProject("project","script.exportsConditions",t.split(","))},onToggleSelectPlugin(t){this.selectPlugin.includes(t)?this.selectPlugin.splice(this.selectPlugin.indexOf(t),1):this.selectPlugin.push(t)},remove(){if(this.selectPlugin.length){for(let t=0;t<this.selectPlugin.length;t++){const e=this.selectPlugin[t];var i=this.pluginScript.findIndex(t=>t.uuid===e);-1!==i&&this.pluginScript.splice(i,1)}this.selectPlugin=[],this.saveData()}},_addPlugin(i){this.pluginScript.find(t=>t.uuid===i.uuid)||this.pluginScript.push(i)},async add(t){t=t.target;let i=await Editor.Message.request("asset-db","query-assets",{userData:{isPlugin:!0}});i=i.filter(t=>!this.sortingPlugins.includes(t.uuid)),Editor.Panel.__protected__.openKit("ui-kit.searcher",{elem:t,params:[{type:"asset",droppable:"cc.Script",data:i}],listeners:{confirm:t=>{t&&(this._addPlugin({url:t.info.path,uuid:t.info.uuid}),this.saveData())}}})},popMenu(t){var i=[{label:"i18n:project.scripts.addAllPlugins",click:()=>{this.onAddAll()}}];"list"===this.editMode?i.push({label:"i18n:project.scripts.editInJSONMode",click:()=>{this.editMode="json",this.jsonStr=JSON.stringify(this.pluginScript.map(t=>t.url||t.uuid),null,4)}}):i.push({label:"i18n:project.scripts.editInListMode",click:async()=>{this.jsonStrDirty&&!await this.applyJSONData()||(this.editMode="list")}}),this.pluginScript.find(t=>t.missing)&&i.push({label:"i18n:project.scripts.clearMissingPlugin",click:()=>{this.pluginScript=this.pluginScript.filter(t=>!t.missing),this.saveData()}}),Editor.Menu.popup({menu:i})},async onAddAll(){(await Editor.Message.request("asset-db","query-assets",{ccType:"cc.Script",userData:{isPlugin:!0}})).forEach(t=>{this._addPlugin({url:t.url,uuid:t.uuid})}),await this.saveData()},async saveData(){await Editor.Profile.setProject("project","script.sortingPlugin",this.sortingPlugins)},async checkSave(){return!this.jsonStrDirty||this.applyJSONData()},clearSelect(){this.selectPlugin=[]}},template:vueTemplate});function ready(){var t,i=this;null!=(t=i.vm)&&t.$destroy(),i.vm=new ProjectScriptVM,i.vm.$mount(i.$.container)}async function exportConfig(){var t={};return t["script.exportsConditions"]=await Editor.Message.request("project","query-config","project","script.exportsConditions")||[],t}async function importConfig(t){t["script.exportsConditions"]&&await Editor.Message.request("project","set-config","project","script.exportsConditions",t["script.exportsConditions"])}async function beforeClose(){var t;return null==(t=this.vm)?void 0:t.checkSave()}function close(){var t;null!=(t=this.vm)&&t.$destroy(),this.vm=null}exports.style=(0,fs_1.readFileSync)((0,path_1.join)(__dirname,"../../dist/contributions/project-script.css")),exports.template='<div class="container"></div>',exports.$={container:".container"},exports.ready=ready,exports.exportConfig=exportConfig,exports.importConfig=importConfig,exports.beforeClose=beforeClose,exports.close=close;