"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0}),exports.PackageSearchList=exports.createDefaultGroup=void 0;const vue_js_1=__importDefault(require("vue/dist/vue.js")),interface_1=require("../../public/interface"),utils_1=require("../../public/utils"),pkg_node_1=__importDefault(require("./pkg-node")),template=`
    <div class="pkg-list">
        <div ref="main" class="content">
            <section v-for="(group) in groups" v-show="group.list.length > 0" :key="group.key" class="content-group">
                <div class="pkg-list__subtitle">
                    <ui-label>{{ "i18n:extension.manager." + group.key }}</ui-label>
                </div>
                <pkg-node
                    class="pkg-list-item"
                    v-for="(pkg, index) in group.list"
                    :key="\`\${index}__\${pkg.name}\`"
                    :choosed="choosed === pkg.name"
                    :pkg="pkg"
                    :label="label"
                    @choose="choose"
                    @toggle-enable="toggleEnable"
                    @update-package="updatePackage"
                    @remove-package="removePackage"
                    @uninstall-package="uninstallPackage"
                ></pkg-node>
            </section>
        </div>

        <div class="extenstions-empty" v-show="loading && isGroupEmpty">
            <ui-loading></ui-loading>
        </div>

        <div class="extenstions-empty" v-show="isNoData && !errorMessage">
            <ui-label value="i18n:extension.manager.not_data"></ui-label>
        </div>

        <div class="extenstions-empty error" v-show="errorMessage">
            <ui-label :value="errorMessage"></ui-label>
            <ui-button outline @click.stop="refresh">
                <ui-label value="i18n:extension.manager.refresh"></ui-label>
            </ui-button>
        </div>
    </div>
`;function createDefaultGroup(){return[{key:interface_1.ExtensionManagerTab.BuiltIn,label:interface_1.ExtensionManagerTab.BuiltIn,list:[],total:0},{key:interface_1.ExtensionManagerTab.Cocos,label:interface_1.ExtensionManagerTab.Cocos,list:[],total:0},{key:interface_1.ExtensionManagerTab.Installed,label:interface_1.ExtensionManagerTab.Installed,list:[],total:0}]}exports.createDefaultGroup=createDefaultGroup,exports.PackageSearchList=vue_js_1.default.extend({name:"PackageSearchList",components:{pkgNode:pkg_node_1.default},mixins:[],props:{label:{type:String,default:interface_1.ExtensionManagerTab.Search},active:{type:Boolean,default:!1},choosed:{type:String,default:""},pageSize:{type:Number,default:15},searchKey:{type:String,default:""}},data(){return{groups:createDefaultGroup(),page:1,loading:!1,errorMessage:""}},computed:{isGroupEmpty(){return this.groups.every(e=>0===e.list.length)},isNoData(){return!this.loading&&this.isGroupEmpty&&""!==this.searchKey},isNoMore(){return!0}},watch:{},mounted(){},methods:{t(e){return Editor.I18n.t("extension.manager."+e)},scrollToBottom(e){this.loading||this.errorMessage||this.isNoMore||(e=e.path[0]).scrollHeight-e.scrollTop-5<e.clientHeight&&(this.page+=1,this.$emit("update-list",this.label,this.page,this.pageSize))},updateList(t,e,s){var a=this.groups.find(e=>e.key===t);null!=a&&(a.list.push(...e),a.total=s,this.active)&&1===this.page&&0<a.list.length&&this.choose(a.list[0])},batchUpdateList(e){let t=void 0;for(const a of this.groups){var s;(0,utils_1.hasOwn)(e,a.key)&&(s=e[a.key],a.list.push(...s.list),a.total=s.total,void 0===t)&&0<a.list.length&&(t=a.list[0])}this.active&&1===this.page&&void 0!==t&&this.choose(t)},updateDownloadStatus(t,s,a,i){for(const e of this.groups)e.list.forEach(e=>{e.name===t&&(s?(e.state="none",e.progress=0):a?(e.state="none",e.isInstalled=!0,e.enable=!0,e.isBuiltIn&&!e.builtInVersion?(e.builtInPath=e.path,e.builtInVersion=e.version,e.version=a.version,e.path=a.path):(e.path=a.path,e.version=a.version),e.progress=0):("installing"!==e.state&&(e.state="installing"),e.progress=i))})},updateUninstallStatus(s,a,i,o){for(const e of this.groups)e.list.forEach(e=>{var t;e.name===s&&(a?(e.state="none",e.progress=0):i?(e.state="none",e.progress=0,t="function"==typeof i?i(e):i,e.version=t.version,e.path=t.path,""===t.path&&(e.isInstalled=!1)):("uninstalling"!==e.state&&(e.state="uninstalling"),e.progress=o))})},refresh(){this.$emit("refresh")},reset(){this.groups=createDefaultGroup(),this.page=1,this.loading=!1,this.errorMessage=""},setError(e){this.groups=createDefaultGroup(),this.errorMessage=e},remove(t){for(const s of this.groups){var e=s.list.findIndex(e=>e.name===t);-1<e&&(s.list.splice(e,1),this.active)&&(0<s.list.length?this.choose(s.list[0]):this.choose(void 0))}},toggleEnableHandle(t){for(const e of this.groups)e.list.forEach(e=>{e.name===t.name&&e.path===t.path&&(e.enable=t.enable)})},handleListUpdate(e){if(!this.groups.every(e=>0===e.list.length))for(const s of this.groups)e.forEach(t=>{var e=s.list.findIndex(e=>e.name===t.name&&e.path===t.path);-1<e&&this.$set(s.list,e,{...s.list[e],enable:t.enable,isInstalled:t.isInstalled,progress:t.progress,state:t.state,version:t.version,path:t.path})})},updateUninstallLoading(t,s){for(const e of this.groups)e.list.forEach(e=>{e.name===t&&(e.state=s?"uninstalling":"none")})},toggleEnable(e,t,s){this.$emit("set-enable",e,!t,s)},removePackage(t){for(const e of this.groups)e.list.forEach(e=>{e.name===t&&(e.state="uninstalling")});this.$emit("remove-package",t)},uninstallPackage(e,t,s){this.$emit("uninstall-package",e,t,s)},updatePackage(t,e,s){for(const a of this.groups)a.list.forEach(e=>{e.name===t&&(e.state="installing")});this.$emit("update-package",t,e,s)},choose(e){this.$emit("choose",e)}},template:template});