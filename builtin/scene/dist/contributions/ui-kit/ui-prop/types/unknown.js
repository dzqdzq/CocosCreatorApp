"use strict";function update(e){var t=this,o=t.$this.renderInfo.panel,s=t.$.label;o.setLabel(e,s),t.$this.removeAttribute("no-label")}function ready(){const t=this;t.$.button.addEventListener("change",e=>{e.stopPropagation()}),t.$.button.addEventListener("confirm",e=>{e.stopPropagation(),t.$this.dispatch("reset")})}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.template=void 0,exports.template=`
<ui-label slot="label"></ui-label>
<div slot="content" style="display: flex;">
    <span>Unknown Type</span>
    <ui-button class="blue" style="flex: 1;margin-left: 10px;">Reset</ui-button>
</div>
`,exports.$={label:"ui-label",button:"ui-button"},exports.update=update,exports.ready=ready;