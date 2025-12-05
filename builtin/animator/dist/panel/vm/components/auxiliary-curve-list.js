"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.AuxiliaryCurves=void 0;const vue_js_1=require("vue/dist/vue.js"),ipc_event_1=require("../../share/ipc-event"),animation_ctrl_1=require("../../share/animation-ctrl"),pop_menu_1=require("../../share/pop-menu"),animation_editor_1=require("../../share/animation-editor"),hooks_1=require("../hooks"),directives_1=require("../directives"),keyframe_btn_1=require("./keyframe-btn"),utils_1=require("../../utils"),sharedProps={offset:{type:Number,default:0}},AuxListItem=(0,vue_js_1.defineComponent)({name:"AuxListItem",components:{KeyframeBtn:keyframe_btn_1.KeyframeBtn},directives:{AutoFocus:directives_1.AutoFocus},props:{...sharedProps,name:{type:String,default:""},selected:{type:Boolean,default:!1},keyframeEmpty:{type:Boolean,default:!0}},emits:{select:null,remove:null,rename:null},setup(i,a){const r=(0,vue_js_1.ref)(""),n=(0,hooks_1.useAuxCurveStore)();var e=(0,vue_js_1.computed)(()=>n.renaming.includes(i.name));return{tempName:r,onNameChange:e=>{r.value=e.target.value},onNameConfirm:e=>{r.value=e.target.value,a.emit("rename",{oldName:i.name,newName:(0,vue_js_1.unref)(r)}),n.switchRename(i.name,!1),r.value=""},onNameBlur:e=>{r.value="",n.switchRename(i.name,!1)},isEditing:e,onSwitchFrame:e=>{i.keyframeEmpty?animation_ctrl_1.animationCtrl.createAuxKey(i.name):animation_ctrl_1.animationCtrl.removeAuxKey(i.name)},onClick:e=>{a.emit("select")},onContextmenu:e=>{var t=(0,pop_menu_1.getPopMenuMap)(pop_menu_1.onAuxNameContextMenus,!0);t.removeAuxCurve.click=async()=>{a.emit("remove")},t.renameAuxCurve.click=async()=>{r.value=i.name,n.switchRename(i.name,!0)},Editor.Menu.popup({menu:Object.values(t)})}}},template:`
        <div
            :class="{
                selected: selected,
            }"
            class="auxiliary-curves-list-item"
            @click="onClick"
            @contextmenu="onContextmenu"
        >
            <span class="auxiliary-curves-list-item__name">
                <ui-input
                    v-if="isEditing"
                    v-auto-focus
                    :value="tempName"
                    @change="onNameChange"
                    @confirm="onNameConfirm"
                    @blur="onNameBlur"
                ></ui-input>
                <template v-else>{{ name }}</template>
            </span>
            <div class="auxiliary-curves-list-item__operate">
                <KeyframeBtn :empty="keyframeEmpty" @click.native="onSwitchFrame"></KeyframeBtn>
            </div>
        </div>
    `});exports.AuxiliaryCurves=(0,vue_js_1.defineComponent)({name:"AuxiliaryCurvesList",components:{KeyframeBtn:keyframe_btn_1.KeyframeBtn,AuxListItem:AuxListItem},props:{...sharedProps,expand:{type:Boolean,default:!1},currentClip:{type:String,required:!0},currentFrame:{type:Number,default:0}},setup(t,e){const i=Editor.I18n.t.bind(Editor.I18n),a=(0,hooks_1.useAuxCurveStore)();return{curves:(0,vue_js_1.computed)(()=>a.curves),getListItemKey:(e,t)=>t+"__"+e,isItemSelected:e=>{var t=a.selectedCurveName;return""!=t&&t===e.displayName},isKeyframeEmpty:e=>void 0===e.find(e=>e.frame===t.currentFrame),onHeaderMousedown:e=>{animation_editor_1.animationEditor.onStartResize(e,"auxCurve")},onAddClick:()=>{const e="aux_curve_"+Date.now();(0,ipc_event_1.IApplyOperation)((0,ipc_event_1.addNewAuxiliaryCurve)(t.currentClip,e)).then(()=>{a.switchRename(e,!0)}),(0,utils_1.multiplyTrackWithTimer)("hippoAnimator",{add_auxiliary_curve:1,project_id:Editor.Project.uuid,clip_id:t.currentClip,version:Editor.App.version})},onItemSelect:e=>{a.selectedCurveName=e.displayName},onItemRemove:e=>{(0,ipc_event_1.IApplyOperation)((0,ipc_event_1.removeAuxiliaryCurve)(t.currentClip,e.key))},onItemRename:async e=>{if(void 0===a.curveNameMap[e.newName])return(0,ipc_event_1.IApplyOperation)((0,ipc_event_1.renameAuxiliaryCurve)(t.currentClip,e.oldName,e.newName));e=i("animator.auxiliaryCurve.nameExistedTip",{name:e.newName}),await Editor.Dialog.info(e,{title:i("animator.title"),buttons:[i("animator.ok")]})},toggleExpand:()=>{e.emit("toggle-expand",!t.expand)}}},template:`
        <div class="auxiliary-curves">
            <div class="auxiliary-curves__header content-device ns-resize" @mousedown="onHeaderMousedown">
                <ui-icon value="arrow-triangle"
                    :class="expand ? 'expand' : 'collapse'"
                    @click="toggleExpand"
                ></ui-icon>
                <ui-label value="i18n:animator.auxiliaryCurve.title" class="tw-flex-0 tw-min-w-0"></ui-label>
                <ui-icon color="true" value="experiment" class="tw-flex-0"></ui-icon>
                <div class="tw-flex-1"></div>
                <ui-button
                    tooltip="i18n:animator.auxiliaryCurve.createNew"
                    class="icon-btn tw-flex-0"
                    transparent
                    @click="onAddClick"
                >
                    <ui-icon value="add"></ui-icon>
                </ui-button>
            </div>

            <div class="auxiliary-curves__list auxiliary-curves-list">
                <template v-for="(curve, index) in curves">
                    <AuxListItem
                        :key="getListItemKey(curve.displayName, index)"
                        :name="curve.displayName"
                        :keyframe-empty="isKeyframeEmpty(curve.keyframes)"
                        :selected="isItemSelected(curve)"
                        @select="onItemSelect(curve)"
                        @remove="onItemRemove(curve)"
                        @rename="onItemRename"
                    >
                    </AuxListItem>
                </template>
            </div>
        </div>
    `});