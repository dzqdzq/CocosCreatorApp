"use strict";function update(t){var e=this,a=(e.$this.removeAttribute("no-label"),e.$this.renderInfo.panel),e=e.$.label;a.setLabel(t,e)}function ready(){const e=this;e.$.button.addEventListener("change",t=>{t.stopPropagation()}),e.$.button.addEventListener("confirm",t=>{t.stopPropagation(),e.$this.dispatch("create")})}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.template=void 0,exports.template=`
<ui-label slot="label"></ui-label>
<div slot="content" style="display: flex;">
    <span>Null</span>
    <ui-button class="blue" style="flex: 1;margin-left: 10px;">Create</ui-button>
</div>
`,exports.$={label:"ui-label",button:"ui-button"},exports.update=update,exports.ready=ready;