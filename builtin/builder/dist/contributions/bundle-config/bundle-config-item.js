"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.data=exports.props=exports.template=void 0;const bundle_utils_1=require("../../share/bundle-utils"),data=(exports.template=`
<div @change="onBundleConfigChange">
    <ui-select path="compressionType"
        :value="option.compressionType || 'merge_dep'"
        :disabled="readonly"
        @click.stop
    >
        <option v-for="type of supportOptions.compressionType"
            :value="type"
        >{{compressRenderList[type]}}</option>
    </ui-select>
    <div>
        <ui-checkbox path="isRemote"
            :value="getInvalidRemote(option.compressionType, option.isRemote)"
            :disabled="readonly || isRemoteLocked(option.compressionType)"
            @click.stop
        ></ui-checkbox>
    </div>
</div>
`,exports.props=["option","readonly","supportOptions","filterList","type"],()=>({compressRenderList:Object.freeze(bundle_utils_1.BundlecompressionTypeMap)}));exports.data=data,exports.methods={onBundleConfigChange(e){var t=e.target.value,e=e.target.getAttribute("path");e&&this.$emit("update",e,t,this.type)},isRemoteLocked(e){return(0,bundle_utils_1.checkRemoteDisabled)(e)},getInvalidRemote(e,t){return(0,bundle_utils_1.getInvalidRemote)(e,t)}};