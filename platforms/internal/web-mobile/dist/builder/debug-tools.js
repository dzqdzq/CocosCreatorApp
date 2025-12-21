"use strict";var __awaiter=this&&this.__awaiter||function(e,a,s,p){return new(s=s||Promise)(function(r,t){function o(e){try{n(p.next(e))}catch(e){t(e)}}function i(e){try{n(p.throw(e))}catch(e){t(e)}}function n(e){var t;e.done?r(e.value):((t=e.value)instanceof s?t:new s(function(e){e(t)})).then(o,i)}n((p=p.apply(e,a||[])).next())})};Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.watch=exports.data=exports.props=exports.template=void 0;const qrcode=require("qrcode");function data(){return{previewUrl:""}}function mounted(){return __awaiter(this,void 0,void 0,function*(){})}exports.template=`
<div>
    <ui-prop v-show="previewUrl">
        <ui-label slot="label" value="i18n:web-mobile.options.preview_url"></ui-label>
        <canvas slot="content" ref="canvas"></canvas>
    </ui-prop>
    <ui-prop v-show="previewUrl">
        <ui-label slot="label" value="i18n:web-mobile.options.preview_url"></ui-label>
        <div slot="content">
            <ui-link>{{previewUrl}}</ui-link>
        </div>
    </ui-prop>
</div>
`,exports.props=["args","root"],exports.data=data,exports.watch={root(){this.previewIp=""}},exports.methods={handleCommand(e){return __awaiter(this,void 0,void 0,function*(){return!this.previewIp&&"run"===e&&(this.showPreviewQRCode(),!0)})},showPreviewQRCode(){return __awaiter(this,void 0,void 0,function*(){var e=this;e.previewUrl=yield Editor.Message.request("web-mobile","set-preview-path",e.root),qrcode.toCanvas(e.$refs.canvas,e.previewUrl,{errorCorrectionLevel:"H",maskPattern:2,margin:1})})}},exports.mounted=mounted;