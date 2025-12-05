"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const fs_1=require("fs"),path_1=require("path"),electron_1=require("electron"),utlis_1=require("../common/utlis"),JSZip=require("../../lib/jszip.min"),{I18n,Message}=(exports.style=(0,fs_1.readFileSync)((0,path_1.join)(__dirname,"../../css/index.css"),"utf8"),Editor);exports.listeners={resize(){this.$.tree.render(!0)}},exports.template=`
    <header>
        <h1>
            <ui-label value="i18n:package-asset.export.title"></ui-label>
        </h1>
        <ui-progress></ui-progress>
        <ui-label class="info"></ui-label>
    </header>
    
    <section>
        <ui-tree></ui-tree>
        <ui-loading class="loading"></ui-loading>
        <ui-label class="mask" value="i18n:package-asset.export.tips"></ui-label>
    </section>
    
    <footer>
        <ui-checkbox class="btn_sellect_all">
            <ui-label value="i18n:package-asset.common.select_all"></ui-label>
        </ui-checkbox>
        <ui-checkbox class="btn_depend">
            <ui-label value="i18n:package-asset.export.btn_depend"></ui-label>
        </ui-checkbox>
        <ui-button class="export">
            <ui-label value="i18n:package-asset.export.button"></ui-label>
        </ui-button>
    </footer>    
`,exports.$={tree:"ui-tree",select:".select",progress:"ui-progress",btnExport:".export",btnDepend:".btn_depend",loading:".loading",info:".info",mask:".mask",btn_sellect_all:".btn_sellect_all"};let _state=0;exports.methods={onRefresh(e){},setState(e,t=0,s=""){switch(_state=e){case utlis_1.STATE.WAIT:this.$.progress.value=0,this.$.info.setAttribute("value",I18n.t("package-asset.export.message.wait"));break;case utlis_1.STATE.IDLE:this.$.progress.value=0,this.$.info.setAttribute("value",I18n.t("package-asset.export.message.idle",{total:this.total}));break;case utlis_1.STATE.LOADING:this.$.info.setAttribute("value",Editor.I18n.t("package-asset.export.message.loading",{name:s,current:t.toString(),total:this.total})),this.$.progress.value=t/this.total*100;break;case utlis_1.STATE.COMPLETED:this.$.info.setAttribute("value",I18n.t("package-asset.export.message.complete"))}},async scanAssets(e){this.uuids=Editor.Selection.getSelected("asset"),0===this.uuids.length&&(this.uuids=[e.uuid]),this.setState(utlis_1.STATE.WAIT);e=await Message.request("scene","execute-scene-script",{name:"package-asset",method:"getExportAssets",args:[{uuids:this.uuids,includeDepend:this.$.btnDepend.value}]});this.$.loading.style.display="none",this.$.tree.tree=e,this.updateTotal(),0===this.total&&(this.$.mask.style.visibility="visible")},updateTotal(){this.list=[],this.$.btn_sellect_all.value=!0;const t=e=>{e.forEach(e=>{e.detail.checked?e.detail.legal&&(this.list.push(e.detail.asset),t(e.children)):this.$.btn_sellect_all.value=!1})};t(this.$.tree.tree),this.total=this.list.length,this.setState(utlis_1.STATE.IDLE),0<this.total?this.$.btnExport.removeAttribute("disabled"):this.$.btnExport.setAttribute("disabled","")},async exportAssets(){var e=this.$.tree.tree;if(0!==e.length){const t=(await Editor.Dialog.save({path:await Editor.Profile.getConfig("package-asset","export-path")||Editor.Project.path,title:I18n.t("package-asset.export.title"),filters:[{name:"Package",extensions:["zip"]}]})).filePath||"";if((0,utlis_1.isPath)(t,!0)){await Editor.Profile.setConfig("package-asset","export-path",t);const r=new JSZip;let a=0;const i=(e,t)=>{var s=e.detail,i=s.asset;s.checked&&s.legal&&(a++,this.setState(utlis_1.STATE.LOADING,a,i.name),s=i.isDirectory||"database"===i.importer,t=t||r,s?(s=t.folder(i.name),t.file(i.name+".meta",(0,fs_1.readFileSync)(i.file+".meta")),l(e.children,s)):(t.file(i.name,(0,fs_1.readFileSync)(i.file)),t.file(i.name+".meta",(0,fs_1.readFileSync)(i.file+".meta"))))};function l(e,t){for(const s of e)i(s,t)}l(e,null),r.generateNodeStream({type:"nodebuffer"}).pipe((0,fs_1.createWriteStream)(t)).on("finish",()=>{electron_1.shell.showItemInFolder(t),setTimeout(()=>{Editor.Panel.close("package-asset.export")},500)})}}}},exports.ready=function(e){(0,utlis_1.initTemplate)(this),Message.__protected__.addBroadcastListener("i18n:change",()=>{this.setState(_state)}),this.$.btnExport.addEventListener("confirm",()=>{this.exportAssets()}),this.$.btn_sellect_all.value=!0,this.$.btn_sellect_all.addEventListener("confirm",async()=>{const t=e=>{e.forEach(e=>{e.detail.checked=this.$.btn_sellect_all.value,t(e.children)})};t(this.$.tree.tree),this.updateTotal(),this.$.tree.render(!0)}),this.$.btnDepend.value=!0,this.$.btnDepend.addEventListener("confirm",async()=>{this.$.loading.style.display="",this.$.tree.tree=await Message.request("scene","execute-scene-script",{name:"package-asset",method:"getExportAssets",args:[{uuids:this.uuids,includeDepend:this.$.btnDepend.value}]}),this.$.loading.style.display="none",this.updateTotal(),this.$.tree.render(!0)}),this.scanAssets(e)},exports.beforeClose=utlis_1.beforeClose,exports.close=utlis_1.close;