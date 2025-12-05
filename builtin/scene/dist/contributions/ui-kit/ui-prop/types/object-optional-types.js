"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.close=exports.ready=exports.update=exports.methods=exports.listeners=exports.$=exports.style=exports.template=void 0;const object_1=require("./object");async function update(s){var e=this,t=(e._dump=s,e.$this.renderInfo.panel);let o=!1,l="";Array.isArray(s.optionalTypes)&&s.optionalTypes.forEach(e=>{e===s.type&&(o=!0),l+=`<option value="${e}">${e}</option>`}),e.$.select.innerHTML=l,e.$.select.value=s.type,t.setReadonly(s,e.$.select),o||Object.keys(s.value).forEach((e,t)=>{e=s.value[e];e.visible&&(e.readonly=!0)}),object_1.update.call(e,s)}async function ready(){object_1.ready.call(this)}async function close(){await object_1.close.call(this)}exports.template=`
<ui-section no-border expand>
    <div slot="header" class="prop-name">
        <ui-label style="flex: 1;"></ui-label>
        <ui-link style="display: none;" tooltip="i18n:scene.menu.help_url">
            <ui-icon value="help"><ui-icon>
        </ui-link>
    </div>
    <ui-select slot="header" class="prop-content"></ui-select>
</ui-section>
`,exports.style=`
:host { margin-left: 0; }
`,exports.$={container:"ui-section",label:"ui-label",help:"ui-link",select:"ui-select"},exports.listeners={change(e){var t=this;const s=e.target.value;t._dump.type=s,"values"in t._dump&&t._dump.values.forEach(e=>{e.type=s})}},exports.methods=Object.assign({},object_1.methods),exports.update=update,exports.ready=ready,exports.close=close;