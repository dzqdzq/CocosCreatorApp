"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.update=exports.$=exports.template=exports.style=void 0;const fs_extra_1=require("fs-extra"),path_1=require("path"),lodash=require("lodash"),Vue=require("vue/dist/vue.js"),PKG_NAME=(Vue.config.productionTip=!1,Vue.config.devtools=!1,exports.style=(0,fs_extra_1.readFileSync)((0,path_1.join)(__dirname,"./style.css"),"utf8"),"builder"),I18N_HEADER=`i18n:${PKG_NAME}.assets.auto_atlas`,vueTemplate=`
<section class="asset-auto-atlas">
    <div class="content"
        v-if="meta && metas.length === 1"
    >
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.max_width"
                tooltip="${I18N_HEADER}.max_width_tips"
            ></ui-label>
            <ui-num-input slot="content"
                :disabled="info.readonly"
                :invalid="getInvalid('maxWidth')"
                :value="meta.userData.maxWidth"
                @change="onChanged($event, 'maxWidth')"
                step="1"
            ></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.max_height"
                tooltip="${I18N_HEADER}.max_height_tips"
            ></ui-label>
            <ui-num-input slot="content"
                :disabled="info.readonly"
                :invalid="getInvalid('maxHeight')"
                :value="meta.userData.maxHeight"
                @confirm="onChanged($event, 'maxHeight')"
            ></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.padding"
                tooltip="${I18N_HEADER}.padding_tips"
            ></ui-label>
            <ui-num-input slot="content"
                :disabled="info.readonly"
                :invalid="getInvalid('padding')"
                :value="meta.userData.padding"
                @confirm="onChanged($event, 'padding')"
            ></ui-num-input>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.padding_bleed"
                tooltip="${I18N_HEADER}.padding_bleed_tips"
            ></ui-label>
            <ui-checkbox slot="content"
                :disabled="info.readonly"
                :value="meta.userData.paddingBleed"
                @confirm="onChanged($event, 'paddingBleed')"
            ></ui-checkbox>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.power_of_two"
                tooltip="${I18N_HEADER}.power_of_two_tips"
            ></ui-label>
            <ui-checkbox slot="content"
                :disabled="info.readonly"
                :value="meta.userData.powerOfTwo"
                @confirm="onChanged($event, 'powerOfTwo')"
            ></ui-checkbox>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.force_squared"
                tooltip="${I18N_HEADER}.force_squared_tips"
            ></ui-label>
            <ui-checkbox slot="content"
                :disabled="info.readonly"
                :value="meta.userData.forceSquared"
                @confirm="onChanged($event, 'forceSquared')"
            ></ui-checkbox>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.filter_unused"
                tooltip="${I18N_HEADER}.filter_unused_tips"
            ></ui-label>
            <div slot="content">
                <ui-checkbox slot="content"
                    :disabled="info.readonly"
                    :value="meta.userData.filterUnused"
                    @confirm="onChanged($event, 'filterUnused')"
                ></ui-checkbox>
                <ui-icon color="true" value="warn-triangle"
                    tooltip="${I18N_HEADER}.only_work_after_build"
                ></ui-icon>
            </div>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.remove_texture_force_in_bundle"
                tooltip="${I18N_HEADER}.remove_texture_force_in_bundle_tips"
            ></ui-label>
            <div slot="content">
                <ui-checkbox slot="content"
                    :disabled="info.readonly"
                    :value="meta.userData.removeTextureInBundle"
                    @confirm="onChanged($event, 'removeTextureInBundle')"
                ></ui-checkbox>
                <ui-icon color="true" value="warn-triangle"
                    tooltip="${I18N_HEADER}.only_work_after_build"
                ></ui-icon>
            </div>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.remove_image_force_in_bundle"
                tooltip="${I18N_HEADER}.remove_image_force_in_bundle_tips"
            ></ui-label>
            <div slot="content">
                <ui-checkbox slot="content"
                    :disabled="info.readonly"
                    :value="meta.userData.removeImageInBundle"
                    @confirm="onChanged($event, 'removeImageInBundle')"
                ></ui-checkbox>
                <ui-icon color="true" value="warn-triangle"
                    tooltip="${I18N_HEADER}.only_work_after_build"
                ></ui-icon>
            </div>
        </ui-prop>
        <ui-prop>
            <ui-label slot="label"
                value="${I18N_HEADER}.remove_sprite_atlas_in_bundle"
                tooltip="${I18N_HEADER}.remove_sprite_atlas_in_bundle_tips"
            ></ui-label>
            <div slot="content">
                <ui-checkbox slot="content"
                    :disabled="info.readonly"
                    :value="meta.userData.removeSpriteAtlasInBundle"
                    @confirm="onChanged($event, 'removeSpriteAtlasInBundle')"
                ></ui-checkbox>
                <ui-icon color="true" value="warn-triangle"
                    tooltip="${I18N_HEADER}.only_work_after_build"
                ></ui-icon>
            </div>
        </ui-prop>

        <compress-texture
            :meta="meta"
            :metas="metas"
            :readonly="info.readonly"
            @confirm="onConfirm"
        ></compress-texture>

        <div class="footer">
            <ui-button tabindex="0"
                :disabled="info.readonly"
                @mouseup.stop
                @confirm.stop="_onPreviewClick"
            >
                <ui-label value="${I18N_HEADER}.preview"></ui-label>
            </ui-button>
			<ui-label class="images-title" value="${I18N_HEADER}.packedTextures"></ui-label>
            <div class="images"
                v-if="packedTextures.length !== 0"
            >
            <div class="image"
                v-for="(src, index) in packedTextures"
            >
                    <img class="img"
                        :src="src + '?' + Math.random()"
                    >
                    <ui-link :value="src" :tooltip="src">
                        <ui-label value="${I18N_HEADER}.packedImage"></ui-label>
                        ({{ index + 1 }})
                    </ui-link>
                </div>
            </div>
            <div class="images-title"
                v-if="unpackedTextures.length !== 0"
            >
                Unpacked Textures:
            </div>
            <div class="images"
                v-if="unpackedTextures.length !== 0"
            >
                <div class="image"
                    v-for="spriteFrameInfo in unpackedTextures"
                    @click="twinkle(spriteFrameInfo.imageUuid)"
                >
                    <img class="img"
                        :src="spriteFrameInfo.libraryPath + '?' + Math.random()"
                    >
                </div>
            </div>
        </div>
        <ui-loading v-if="generating"></ui-loading>
    </div>
    <ui-label class="multiple-warn-tip" value="i18n:ENGINE.assets.multipleWarning"
        v-else
    ></ui-label>
</section>
`;function update(e,t){const i=this;var a;i.vm||((a=new Vue({components:{"compress-texture":require("../image/compress-texture")},data(){return{infos:null,info:null,metas:null,meta:null,packedTextures:[],unpackedTextures:[],generating:!1}},computed:{isIllegalWrapModeT(){var e;return"repeat"===(null==(e=this.meta)?void 0:e.userData.textureSetting.wrapModeT)},isIllegalWrapModeS(){var e;return"repeat"===(null==(e=this.meta)?void 0:e.userData.textureSetting.wrapModeS)}},methods:{getInvalid(t){var e;const i=lodash.get(null==(e=this.meta)?void 0:e.userData,t);return!(null!=(e=this.metas)&&e.every(e=>i===lodash.get(e.userData,t)))},t(e){return Editor.I18n.t("inspector.asset.autoAtlas."+e)},onChanged(e,t){var i,e=e.target;lodash.set(null==(i=this.meta)?void 0:i.userData,t,e.value),this.onConfirm()},onConfirm(){i.dispatch("change"),i.dispatch("snapshot")},async _onPreviewClick(){if(this.meta){this.generating=!0;try{var e=await Editor.Message.request("builder","preview-pac",this.meta.uuid,this.meta.userData);e&&this.showImages(e)}catch(e){console.warn("Auto Atlas Preview Error: "+e)}this.generating=!1}},async showImages(e){e?(this.packedTextures=e.atlasImagePaths,this.unpackedTextures=e.unpackedImages):(this.packedTextures=[],this.unpackedTextures=[])},twinkle(e){Editor.Message.send("assets","twinkle",e)},async refresh(){var e;this.meta&&(this.generating=!1,e=await Editor.Message.request("builder","query-atlas-files",this.meta.uuid),this.showImages(e))}},template:vueTemplate})).$mount(i.$.container),i.vm=a),i.vm.infos=e,i.vm.metas=t,i.vm.info=e[0],i.vm.meta=t[0],i.vm.refresh()}function close(){var e;null!=(e=this.vm)&&e.$destroy(),this.vm=null}exports.template='<div class="container"></div>',exports.$={container:".container"},exports.update=update,exports.close=close;