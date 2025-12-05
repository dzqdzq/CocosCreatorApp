"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.components=exports.watch=exports.data=exports.props=exports.template=void 0;const animation_ctrl_1=require("../../share/animation-ctrl"),animation_editor_1=require("../../share/animation-editor");function data(){return{multi:!1}}exports.template=`
<div class="property-tools tw-items-center"
    @mousedown.stop="$root.onStartResize($event, 'center')"
>
    <div
        @click="$root.toggleExpandLayoutChange('property')"
    >
        <ui-icon value="arrow-triangle"
            :class="$root.expandLayout.property ? 'expand' : 'collapse'"
        ></ui-icon>
        <ui-label value="i18n:animator.property.title"></ui-label>
    </div>
    <div class="right">
        <slot></slot>
        <ui-button class="transparent icon-btn" @mousedown.stop="showPropMenu">
            <ui-icon 
                tooltip="i18n:animator.property.create_prop" 
                value="add" 
            ></ui-icon>
        </ui-button>
    </div>
</div>
`,exports.props=["menu","lock","selectNode","nodePath"],exports.data=data,exports.watch={async updateFlag(){await this.refresh()}},exports.components={},exports.methods={t(t){return Editor.I18n.t("animator.property."+t)},createMenu(t){const e=this;let o=[];var r;if(t.key)r=t.menuName||t.displayName,o.push({label:r,enabled:!t.disable,click(){e.createProp(t.key)}});else for(const i of Object.keys(t)){var a=t[i];a.key?o=o.concat(e.createMenu(a)):o.push({label:i,submenu:e.createMenu(a)})}return o},async createProp(t){let e=!1;var o=this;if(o.selectedIds&&1<o.selectedIds.size){let t=Array.from(o.selectedIds);if(1<(t=t.filter(t=>animation_ctrl_1.animationCtrl.nodesDump.uuid2path[t])).length){o=await Editor.Dialog.info(Editor.I18n.t("animator.is_add_prop_multi.title"),{buttons:[Editor.I18n.t("animator.is_add_prop_multi.add_to_current"),Editor.I18n.t("animator.is_add_prop_multi.add_to_all")],default:0,cancel:-1});if(-1===o.response)return;e=!!o.response}}animation_ctrl_1.animationCtrl.createProp({prop:t},e)},showPropMenu(t){var e=this;e.lock||e.nodePath&&!e.selectNode?animation_editor_1.animationEditor.showToast("i18n:animator.property.create_prop_tips"):e.menu&&e.selectNode?Editor.Menu.popup({menu:e.menu}):(animation_editor_1.animationEditor.showToast("i18n:animator.property.should_select_node_first"),console.warn("[Animation Editor]"+Editor.I18n.t("animator.property.should_select_node_first")))}};