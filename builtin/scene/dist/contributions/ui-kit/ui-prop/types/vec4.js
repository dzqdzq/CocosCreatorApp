"use strict";function update(e){var t=this;t._dump=e;const n=t.$this.renderInfo.panel;var u=t.$.label;n.setLabel(e,u),t.$.numList.forEach(t=>{n.setVecInput(e,t)})}function ready(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.style=exports.template=exports.listeners=void 0,exports.listeners={change(t){var e=this;const n=t.target.getAttribute("local"),u=t.target.value;n&&n in e._dump.value&&(e._dump.value[n]=u,"values"in e._dump)&&e._dump.values.forEach(t=>{t[n]=u})}},exports.template=`
<ui-label slot="label"></ui-label>
<ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
<ui-num-input preci="6" label="Y" slot="content" local="y"> </ui-num-input>
<ui-num-input preci="6" label="Z" slot="content" local="z"></ui-num-input>
<ui-num-input preci="6" label="W" slot="content" local="w"></ui-num-input>
`,exports.style=`
:host .content { flex-wrap: wrap; }
:host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
:host .content::slotted(ui-num-input:nth-child(-n+3)) { margin-bottom: 4px; }
:host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
`,exports.$={label:"ui-label",numList:"ui-num-input"},exports.update=update,exports.ready=ready;