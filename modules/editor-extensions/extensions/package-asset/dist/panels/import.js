"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const fs_1=require("fs"),path_1=require("path"),utlis_1=require("../common/utlis"),{I18n,Message}=(exports.style=(0,fs_1.readFileSync)((0,path_1.join)(__dirname,"../../css/index.css"),"utf8"),Editor);exports.listeners={resize(){this.$.tree.render(!0)}},exports.template=`
    <header>
        <h1>
            <ui-label value="i18n:package-asset.import.title"></ui-label>
        </h1>
        <ui-progress></ui-progress>
        <ui-label class="info"></ui-label>
    </header>
    <section>
        <ui-tree></ui-tree>
        <ui-loading class="loading"></ui-loading> 
    </section>
        
    <footer>
        <ui-checkbox class="btn_sellect_all">
            <ui-label value="i18n:package-asset.common.select_all"></ui-label>
        </ui-checkbox>
        <ui-button class="import">
            <ui-label value="i18n:package-asset.import.button"></ui-label>
        </ui-button>
    </footer>
`,exports.$={tree:"ui-tree",select:".select",progress:"ui-progress",btnImport:".import",loading:".loading",info:".info",btn_sellect_all:".btn_sellect_all"};let _state=0;exports.methods={setState(t,e=0,s=""){switch(_state=t){case utlis_1.STATE.WAIT:this.$.progress.value=0,this.$.info.setAttribute("value",I18n.t("package-asset.import.message.wait"));break;case utlis_1.STATE.IDLE:this.$.progress.value=0,this.$.info.setAttribute("value",I18n.t("package-asset.import.message.idle",{total:this.total}));break;case utlis_1.STATE.LOADING:this.$.info.setAttribute("value",I18n.t("package-asset.import.message.loading",{name:s,current:e.toString(),total:this.total})),this.$.progress.value=e/this.total*100}},async scanAssets(t){this.setState(utlis_1.STATE.WAIT);try{this.zipAssets=await(0,utlis_1.getImportAssets)(t);var e=await(0,utlis_1.analyticalContent)(this.zipAssets);this.$.loading.style.display="none",this.$.tree.tree=e,this.updateTotal()}catch(t){console.error(t),await Editor.Dialog.error(I18n.t("package-asset.import.message.failure"),{buttons:[Editor.I18n.t("package-asset.script.confirm")]}),Editor.Panel.close("package-asset.import")}},updateTotal(){this.list=[],this.$.btn_sellect_all.value=!0;const s=t=>{t.forEach(e=>{if(e.detail.checked){if(e.detail.legal){let t=e.detail.asset.name;t.endsWith("/")&&(t=t.substring(t.length-1,0)),this.zipAssets[t+".meta"]?(this.list.push(e.detail.asset),this.list.push(this.zipAssets[t+".meta"]),s(e.children)):console.warn(I18n.t("package-asset.import.message.meta_missing",{name:t}))}}else this.$.btn_sellect_all.value=!1})};s(this.$.tree.tree),this.total=this.list.length/2,this.setState(utlis_1.STATE.IDLE),0<this.total?this.$.btnImport.removeAttribute("disabled"):this.$.btnImport.setAttribute("disabled","")},async importAssets(){this.updateTotal(),this.$.btnImport.setAttribute("disabled","");let t=I18n.t("package-asset.import.message.normal_asset");if(0!==utlis_1.importOverrideTipMarker.length){let e="";utlis_1.importOverrideTipMarker.forEach(t=>{e+=t+"\n"}),t=I18n.t("package-asset.import.message.conflict_asset",{list:e})}if(1!==(await Editor.Dialog.info(t,{buttons:[I18n.t("package-asset.script.confirm"),I18n.t("package-asset.script.cancel")],default:0,cancel:1})).response){this.$.btn_sellect_all.setAttribute("disabled","");try{await(0,utlis_1.doImportAssets)(this.list,async(t,e)=>{this.setState(utlis_1.STATE.LOADING,e,t)}),Editor.Message.send("package-asset","refresh-after-import")}catch(t){console.error(t)}this.$.btn_sellect_all.removeAttribute("disabled")}this.$.btnImport.removeAttribute("disabled")}},exports.ready=async function(t){(0,utlis_1.initTemplate)(this),Message.__protected__.addBroadcastListener("i18n:change",()=>{this.setState(_state)}),this.$.btn_sellect_all.value=!0,this.$.btn_sellect_all.addEventListener("confirm",async()=>{const e=t=>{t.forEach(t=>{t.detail.checked=this.$.btn_sellect_all.value,e(t.children)})};e(this.$.tree.tree),this.updateTotal(),this.$.tree.render(!0)}),this.$.btnImport.addEventListener("confirm",async()=>{await this.importAssets()}),await this.scanAssets(t)},exports.beforeClose=utlis_1.beforeClose,exports.close=utlis_1.close;