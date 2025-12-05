"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.mounted=exports.methods=exports.watch=exports.data=exports.props=exports.template=void 0;const qrcode=require("qrcode");function data(){return{previewUrl:""}}async function mounted(){}exports.template=`
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
`,exports.props=["args","root"],exports.data=data,exports.watch={root(){this.previewIp=""}},exports.methods={async handleCommand(e){return!this.previewIp&&"run"===e&&(this.showPreviewQRCode(),!0)},async showPreviewQRCode(){var e=this;e.previewUrl=await Editor.Message.request("web-mobile","set-preview-path",e.root),qrcode.toCanvas(e.$refs.canvas,e.previewUrl,{errorCorrectionLevel:"H",maskPattern:2,margin:1})}},exports.mounted=mounted;