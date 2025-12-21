"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const template=`
<ui-section class="stashes config" expand cache-expand="animation-graph:layer-stashes">
    <ui-label slot="header" value="i18n:animation-graph.layer.layer_stashes_area.header"></ui-label>
    <ui-prop class="prop"
        v-for="(stash, stashId) in stashes"
        :key="stashId"
        :message="t('animation-graph.layer.layer_stashes_area.reference_count_label.displayName', { referenceCount: stash.referenceCount })"
    >
        <ui-label slot="label" value="i18n:animation-graph.layer.layer_stashes_area.stash_name_label.displayName"></ui-label>
        <div slot="content" class="content">
            <ui-input class="name-input"
                :value="stashId"
                @confirm.stop="renameLayerStash(stashId, $event)"
                @change.stop
            ></ui-input>
            <ui-button class="transparent" icon
                tooltip="i18n:animation-graph.layer.layer_stashes_area.edit_stash_button.displayName"
                @click.stop="editLayerStash(stashId)"
            >
                <ui-icon value="edit"></ui-icon>
            </ui-button>
            <ui-button class="red transparent" icon
            tooltip="i18n:animation-graph.layer.layer_stashes_area.remove_stash_button.displayName"
                @click.stop="removeLayerStash(stashId)"
            >
                <ui-icon value="del"></ui-icon>
            </ui-button>
        </div>
    </ui-prop>
    <ui-button class="add"
        @click.stop="addLayerStash()"
    >
        <ui-label value="i18n:animation-graph.layer.layer_stashes_area.add_stash_button.displayName"></ui-label>
    </ui-button>
</ui-section>
`,layerStashesArea={props:["stashes","layerId"],template:template,methods:{t(...e){return Editor.I18n.t(...e)},addLayerStash(){Editor.Message.send("scene","execute-scene-script",{name:"animation-graph",method:"addLayerStash",args:[this.layerId]})},async removeLayerStash(e){var a=this.stashes[e].referenceCount;if(0<a&&0!==(await Editor.Dialog.info(Editor.I18n.t("animation-graph.layer.layer_stashes_area.remove_stash_button.confirm_dialog.message",{referenceCount:a}),{title:Editor.I18n.t("animation-graph.layer.layer_stashes_area.remove_stash_button.confirm_dialog.title"),buttons:[Editor.I18n.t("animation-graph.layer.layer_stashes_area.remove_stash_button.confirm_dialog.yes"),Editor.I18n.t("animation-graph.layer.layer_stashes_area.remove_stash_button.confirm_dialog.cancel")],default:1,cancel:1})).response)return;Editor.Message.send("scene","execute-scene-script",{name:"animation-graph",method:"removeLayerStash",args:[this.layerId,e]})},renameLayerStash(e,a){var a=a.target;a&&e in this.stashes&&(!(a=a.value.trim())||a in this.stashes||Editor.Message.send("scene","execute-scene-script",{name:"animation-graph",method:"renameLayerStash",args:[this.layerId,e,a]}))},renameLayerStashCancel(){},editLayerStash(e){Editor.Message.send("scene","execute-scene-script",{name:"animation-graph",method:"editLayerStash",args:[this.layerId,e]})}}};exports.default=layerStashesArea;