"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.beforeDestroy=exports.created=exports.methods=exports.data=exports.props=exports.template=void 0;const event_bus_1=require("../event-bus"),data=(exports.template=`
<div class="custom-format" v-if="config && formatsInfo">
    <ui-section class="content" expand>
        <div class="config-header flex-spacing-between" slot="header">
            <span>
                <ui-input
                    v-if="inEdit"
                    :value="config.name"
                    :tooltip="config.name"
                    @click.stop
                    @confirm="onChangeFormatName($event.target.value)"
                ></ui-input>
                <ui-label v-else :value="config.name"></ui-label>
            </span>
            <ui-button type="icon" class="transparent child-margin-right"
                @click.stop="showMenu"
            >
                <ui-icon value="menu"></ui-icon>
            </ui-button>
        </div>
        <div @confirm="onConfigChange" class="config-content">
            <ui-prop>
                <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.format"></ui-label>
                <ui-select slot="content" path="format"
                    :value="config.format || Object.keys(formatsInfo)[0]"
                >
                    <option
                        v-for="(format, formatId) in formatsInfo"
                        :value="formatId"
                        :key="formatId"
                    >{{format.displayName}}</option>
                </ui-select>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.overwrite"></ui-label>
                <ui-checkbox slot="content" path="overwrite"
                    :value="config.overwrite"
                ></ui-checkbox>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.compressTools"></ui-label>
                <div slot="content">
                    <ui-prop class="config-item">
                        <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.program"></ui-label>
                        <ui-file slot="content"
                            path="path"
                            protocols="file,project"
                            :value="config.path"
                        ></ui-file>
                    </ui-prop>
                    <ui-prop class="config-item">
                        <ui-label slot="label" value="i18n:builder.project.texture_compress.customFormat.commandParams"></ui-label>
                        <div
                            slot="content"
                        >
                            <ui-input
                                path="command"
                                :value="config.command"
                            ></ui-input>
                            <ui-button @click="showAddParamsMenu">
                                <ui-icon value="arrow-triangle"></ui-icon>
                            </ui-button>
                        </div>
                    </ui-prop>
                </div>
            </ui-prop>
        </div>
    </ui-section>
</div>
`,exports.props=["formatsInfo","config","customConfigs","overwriteFormats"],function(){return{editTypList:{program:"程序",npm:"npm 库"},inEdit:""}});function created(){event_bus_1.EventBus.$on("blank-click",this.onBlankClickBind=this.onBlankClick.bind(this))}function beforeDestroy(){event_bus_1.EventBus.$off("blank-click",this.onBlankClickBind)}exports.data=data,exports.methods={removeFormat(){this.$emit("remove",this.config.id)},async onConfigChange(e){var e=e.target,t=e.getAttribute("path");if(t){var o=this,i=e.value,r=o.config.id;if("overwrite"===t||"format"===t){var a=!!("overwrite"===t?i:o.config.overwrite),n="format"===t?i:o.config.format,s=o.config[t];if(!0==a){if(o.overwriteFormats[n]&&!0==a){a=o.overwriteFormats[o.customConfigs[r].format];if(!o.customConfigs[a])return o.config[t]=!0,delete o.overwriteFormats[o.customConfigs[r].format],void o.$emit("update",r,"overwrite",!0);if(1===(await Editor.Dialog.info(Editor.I18n.t("builder.project.texture_compress.customFormat.conflictOverwrite",{rawFormat:n,conflictFormat:o.customConfigs[a]&&o.customConfigs[a].name||a}),{buttons:[Editor.I18n.t("builder.project.texture_compress.overwrite"),Editor.I18n.t("builder.project.texture_compress.cancel")],cancel:1,default:1})).response)return void(e.value=s);o.$emit("update",a,"overwrite",!1)}else o.config[t]=i;e="format"===t?s:o.config.format;delete o.overwriteFormats[e],o.$set(o.overwriteFormats,n,r)}else o.config[t]=s,"overwrite"===t&&delete o.overwriteFormats[n]}o.$emit("update",r,t,i)}},showMenu(e){Editor.Menu.popup({x:e.pageX,y:e.pageY,menu:[{label:"i18n:builder.project.texture_compress.editConfigName",enabled:!this.readonly,click:()=>{this.inEdit=!0}},{label:"i18n:builder.copyConfig",click:()=>{this.$emit("add-config",this.config.id)}},{label:"i18n:builder.project.texture_compress.copyId",click:()=>{Editor.Clipboard.write("text",this.config.id)}},{type:"separator"},{label:"i18n:builder.delete",enabled:!this.readonly,click:()=>{this.removeFormat()}}]})},onChangeFormatName(e){this.$emit("update",this.config.id,"name",e)},showAddParamsMenu(e){const t=this;var o=["src","dest","quality"].map(e=>({label:e,click:()=>{t.addParam(e)}}));Editor.Menu.popup({x:e.x,y:e.y,menu:o})},addParam(e){var t=this;t.config.command+=" ${"+e+"}",t.$emit("update",t.config.id,"command",t.config.command)},onBlankClick(){this.inEdit=!1}},exports.created=created,exports.beforeDestroy=beforeDestroy;