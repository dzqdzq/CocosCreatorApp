"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.beforeClose=exports.mounted=exports.methods=exports.data=exports.props=exports.template=void 0;const vivo_preview_cli_1=require("./vivo-preview-cli"),fixPath=require("fix-path");function data(){return{previewIp:"",tips:"",packTools:vivo_preview_cli_1.previewManager.packToolDir,rpkPath:""}}async function mounted(){fixPath()}async function beforeClose(){this.stop()}exports.template=`
<div class="vivo-preview">
    <ui-prop>
        <ui-label slot="label" value="i18n:vivo-mini-game.debug_tools.custom_rpk_path"></ui-label>
        <ui-file :value="rpkPath" slot="content"></ui-file>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label" value="i18n:vivo-mini-game.debug_tools.pack_tool_path"></ui-label>
        <ui-file readonly :value="packTools" slot="content"></ui-file>
    </ui-prop>
</div>

`,exports.props=["args","root"],exports.data=data,exports.methods={async handleCommand(e){var i=this;return!(i.previewIp||"run"!==e||!i.rpkPath||(console.debug("rpkPath",`{link(${i.rpkPath})}`),await Editor.Panel.open("vivo-mini-game.preview",i.rpkPath),Editor.Message.send("vivo-mini-game","update-rpk-path",i.rpkPath),0))},async getPreviewIp(){const e=this;e.tips="i18n:vivo-mini-game.debug_tools.waiting_to_run_server",e.previewIp=await new Promise((o,t)=>{vivo_preview_cli_1.previewManager.run(e.rpkPath,(e,i)=>{e?t(e):o(i)})}),e.tips=Editor.I18n.t("vivo-mini-game.debug_tools.start_run_server",{rpk:e.rpkPath}),console.debug("vivo preview IP:"+`{link(${e.previewIp})}`)},stop(){vivo_preview_cli_1.previewManager.lastPid&&vivo_preview_cli_1.previewManager.kill(vivo_preview_cli_1.previewManager.lastPid),this.previewIp="",this.tips=""}},exports.mounted=mounted,exports.beforeClose=beforeClose;