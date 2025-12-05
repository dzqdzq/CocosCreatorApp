"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.AuxiliaryCurveFrames=void 0;const vue_js_1=require("vue/dist/vue.js"),lodash_1=require("lodash"),ipc_event_1=require("../../share/ipc-event"),hooks_1=require("../hooks"),directives_1=require("../directives"),preview_row_aux_1=require("./preview-row-aux"),animation_editor_1=require("../../share/animation-editor"),template=`
    <div class="auxiliary-curves-frames">
        <div
            class="auxiliary-curves-frames__header content-device property-tools ns-resize"
            @mousedown="onHeaderMousedown"
        >
            <!-- TODO: should use ui-radio-group instead -->
            <div>
                <ui-prop
                    v-if="isPropEditable"
                    type="dump"
                    v-prop-dump="renderDump"
                    @change-dump="onFrameValueChange"
                    @confirm-dump="onFrameValueConfirm"
                ></ui-prop>
            </div>
            <div class="icon-group">
                <ui-icon :active="curveVisible" value="curve" @click="showCurve"></ui-icon>
                <ui-icon :active="!curveVisible" value="slider" @click="hideCurve"></ui-icon>
            </div>
        </div>

        <div
            ref="framesArea"
            name="aux-curves"
            class="auxiliary-curves-frames__content"
            @mousedown.self="onCurveAreaMousedown"
        >
            <div v-show="curveVisible" class="tw-full">
                <ui-curve-editor
                    ref="editor"
                    class="tw-block tw-full"
                    tabindex="0"
                    @transform="onTransform"
                    @focus="onCurveFocus"
                    @blur="onCurveBlur"
                ></ui-curve-editor>
            </div>

            <div v-show="!curveVisible">
                <PreviewRow
                    v-for="(item, index) in curves"
                    :key="String(index) + '__' + item.displayName"
                    :name="item.displayName"
                    :hidden="false"
                    :key-frames="item.keyframes"
                    :list-index="index"
                    :update-position="$root.updatePosition"
                    :update-frame="$root.updateKeyFrame"
                    :update-select="$root.updateSelectKey"
                    :lock="false"
                    :offset="offset"
                    :select-info="selectedKeyInfo"
                    :scroll="scrollInfo"
                    :param="[]"
                    @select-key="updateSelectKey"
                    @remove-key="onKeyRemove"
                    @paste-key="onKeyPaste"
                    @create-key="onKeyCreate"
                ></PreviewRow>
            </div>
        </div>
    </div>
`;function useFrameDump(){const r=(0,hooks_1.useAuxCurveStore)(),a=(0,vue_js_1.ref)(-1),s=(0,vue_js_1.computed)({get:()=>r.selectedFrameDump,set:e=>{r.selectedFrameDump=e}});var e=(0,vue_js_1.computed)(()=>null!=s.value);const i=()=>{s.value=null};return{renderDump:s,isEditable:e,update:async(e,r,u)=>{var o;""===r||""===e?i():(o=Date.now(),a.value=o,e=await(0,ipc_event_1.getAuxCurveValueAtFrame)(e,r,u),a.value===o&&((0,lodash_1.isPlainObject)(e)?s.value={...e,displayName:"Value"}:s.value=e))},reset:i}}exports.AuxiliaryCurveFrames=(0,vue_js_1.defineComponent)({name:"AuxiliaryCurveFrames",components:{PreviewRow:preview_row_aux_1.PreviewRowAux},directives:{propDump:directives_1.UiPropDump},props:{offset:{type:Number,default:0},currentFrame:{type:Number,default:0}},setup(r,e){const u=(0,hooks_1.useBaseStore)(),o=(0,hooks_1.useAuxCurveStore)();var a=(0,vue_js_1.ref)({}),s=(0,vue_js_1.ref)();const i=(0,vue_js_1.computed)(()=>u.currentClip);var t=(0,hooks_1.useElementSize)(s);const{visible:n,show:v,hide:l,onTransform:c,getExposedAPI:d,onBlur:m,onFocus:p}=(0,hooks_1.useAuxCurveEditor)({currentClip:i,size:t});t=(0,vue_js_1.computed)(()=>o.curves);const _=(0,vue_js_1.toRef)(o,"selectedCurveName");var f=(0,vue_js_1.toRef)(o,"selectKeyInfo"),y=(0,vue_js_1.computed)(()=>o.curveNameMap);const{isEditable:w,renderDump:h,update:C}=useFrameDump();(0,vue_js_1.watch)(i,()=>{o.reset()}),(0,vue_js_1.watch)(()=>[(0,vue_js_1.unref)(i),_.value,r.currentFrame],async([e,r,u],o,a)=>{C(e,r,u)}),(0,vue_js_1.watch)(()=>o.selectedFrameDumpRenderKey,()=>{C((0,vue_js_1.unref)(i),_.value,r.currentFrame)});const x=(e,r)=>{_.value=e,o.selectKeyInfo=r};const F=d();return{framesArea:s,curveVisible:n,showCurve:v,hideCurve:l,scrollInfo:a,curves:t,selectedKeyInfo:f,keyframeMap:y,renderDump:h,isPropEditable:w,onFrameValueChange:e=>{var e=e.target?.dump?.value;w.value&&Number.isFinite(e)&&(e={newValue:e},(0,ipc_event_1.IApplyOperation)((0,ipc_event_1.createAuxKey)((0,vue_js_1.unref)(i),_.value,r.currentFrame,e),{recordUndo:!1}))},onFrameValueConfirm:e=>{var e=e.target?.dump?.value;w.value&&Number.isFinite(e)&&(e={newValue:e},(0,ipc_event_1.IApplyOperation)((0,ipc_event_1.createAuxKey)((0,vue_js_1.unref)(i),_.value,r.currentFrame,e)))},updateSelectKey:x,onKeyRemove:(e,r)=>{e===_.value&&C((0,vue_js_1.unref)(i),_.value,r)},onKeyPaste:(e,r)=>{e===_.value&&C((0,vue_js_1.unref)(i),_.value,r)},onKeyCreate:(e,r)=>{e===_.value&&C((0,vue_js_1.unref)(i),_.value,r)},onCurveBlur:m,onCurveFocus:p,onHeaderMousedown:e=>{animation_editor_1.animationEditor.onStartResize(e,"auxCurve")},onCurveAreaMousedown:e=>{n.value||x("",null)},onTransform:c,...d(),zoomToFit:()=>{n.value&&F.zoomToFit()},zoomToSelectedKeys:()=>{n.value&&F.zoomToSelectedKeys()}}},template:template});