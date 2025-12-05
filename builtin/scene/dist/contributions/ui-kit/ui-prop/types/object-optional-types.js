"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});const utils_1=require("../utils"),object_class_1=__importDefault(require("./object-class"));class ObjectOptionalTypes extends object_class_1.default{type=["objectOptionalTypes"];$select=null;_listeners=["change"];change(e,t){if(e.target){const l=e.target.value;t.type=l,t.values&&t.values.forEach(e=>{e.type=l})}}template=`
        <ui-section no-border expand>
            <div slot="header" class="prop-name">
                <ui-label style="flex: 1;"></ui-label>
                <ui-link style="display: none;" tooltip="i18n:scene.menu.help_url">
                    <ui-icon value="help"><ui-icon>
                </ui-link>
            </div>
            <ui-select slot="header" class="prop-content"></ui-select>
        </ui-section>`;style=":host { margin-left: 0; }";mounted(e){super.mounted(e),this.$label=e.querySelector("ui-label"),this.$select=e.querySelector("ui-select")}ready(){super.ready()}update(s){if(super.update(s),this.$select){let t=!1,l="";Array.isArray(s.optionalTypes)&&s.optionalTypes.forEach(e=>{e===s.type&&(t=!0),l+=`<option value="${e}">${e}</option>`}),this.$select.innerHTML=l,this.$select.value=s.type||"",(0,utils_1.setElementReadonly)(s,this.$select),t||Object.keys(s.value).forEach((e,t)=>{e=s.value[e];e.visible&&(e.readonly=!0)})}}close(){super.close()}}exports.default=ObjectOptionalTypes;