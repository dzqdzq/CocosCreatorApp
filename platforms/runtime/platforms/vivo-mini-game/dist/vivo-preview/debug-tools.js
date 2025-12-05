"use strict";var __awaiter=this&&this.__awaiter||function(e,p,n,v){return new(n=n||Promise)(function(t,i){function o(e){try{a(v.next(e))}catch(e){i(e)}}function r(e){try{a(v.throw(e))}catch(e){i(e)}}function a(e){var i;e.done?t(e.value):((i=e.value)instanceof n?i:new n(function(e){e(i)})).then(o,r)}a((v=v.apply(e,p||[])).next())})};Object.defineProperty(exports,"__esModule",{value:!0}),exports.beforeClose=exports.mounted=exports.methods=exports.data=exports.props=exports.template=void 0;const vivo_preview_cli_1=require("./vivo-preview-cli"),fixPath=require("fix-path");function data(){return{previewIp:"",tips:"",packTools:vivo_preview_cli_1.previewManager.packToolDir,rpkPath:""}}function mounted(){return __awaiter(this,void 0,void 0,function*(){fixPath()})}function beforeClose(){return __awaiter(this,void 0,void 0,function*(){this.stop()})}exports.template=`
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

`,exports.props=["args","root"],exports.data=data,exports.methods={handleCommand(i){return __awaiter(this,void 0,void 0,function*(){var e=this;return!(e.previewIp||"run"!==i||!e.rpkPath||(console.debug("rpkPath",`{link(${e.rpkPath})}`),yield Editor.Panel.open("vivo-mini-game.preview",e.rpkPath),Editor.Message.send("vivo-mini-game","update-rpk-path",e.rpkPath),0))})},getPreviewIp(){return __awaiter(this,void 0,void 0,function*(){const e=this;e.tips="i18n:vivo-mini-game.debug_tools.waiting_to_run_server",e.previewIp=yield new Promise((t,o)=>{vivo_preview_cli_1.previewManager.run(e.rpkPath,(e,i)=>{e?o(e):t(i)})}),e.tips=Editor.I18n.t("vivo-mini-game.debug_tools.start_run_server",{rpk:e.rpkPath}),console.debug("vivo preview IP:"+`{link(${e.previewIp})}`)})},stop(){vivo_preview_cli_1.previewManager.lastPid&&vivo_preview_cli_1.previewManager.kill(vivo_preview_cli_1.previewManager.lastPid),this.previewIp="",this.tips=""}},exports.mounted=mounted,exports.beforeClose=beforeClose;