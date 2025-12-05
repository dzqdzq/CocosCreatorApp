"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});const utils_1=require("../utils"),object_class_1=__importDefault(require("./object-class"));class ObjectOptionalTypes extends object_class_1.default{constructor(){super(...arguments),this.type=["objectOptionalTypes"],this.$select=null,this._listeners=["change"],this.template=`
        <ui-section no-border expand>
            <div slot="header" class="prop-name">
                <ui-label style="flex: 1;"></ui-label>
                <ui-link style="display: none;" tooltip="i18n:scene.menu.help_url">
                    <ui-icon value="help"><ui-icon>
                </ui-link>
            </div>
            <ui-select slot="header" class="prop-content"></ui-select>
        </ui-section>`,this.style=":host { margin-left: 0; }"}change(e,t){if(e.target){const s=e.target.value;t.type=s,t.values&&t.values.forEach(e=>{e.type=s})}}mounted(e){super.mounted(e),this.$label=e.querySelector("ui-label"),this.$select=e.querySelector("ui-select")}ready(){super.ready()}update(l){if(super.update(l),this.$select){let t=!1,s="";Array.isArray(l.optionalTypes)&&l.optionalTypes.forEach(e=>{e===l.type&&(t=!0),s+=`<option value="${e}">${e}</option>`}),this.$select.innerHTML=s,this.$select.value=l.type||"",(0,utils_1.setElementReadonly)(l,this.$select),t||Object.keys(l.value).forEach((e,t)=>{e=l.value[e];e.visible&&(e.readonly=!0)})}}close(){super.close()}}exports.default=ObjectOptionalTypes;