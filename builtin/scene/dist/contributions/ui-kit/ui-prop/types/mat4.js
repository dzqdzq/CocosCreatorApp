"use strict";function update(n){var t=this;t._dump=n;const u=t.$this.renderInfo.panel;var e=t.$.label;u.setLabel(n,e);const l=n.value;var i=t.$.numList;for(let t=0;t<16;t++){const o=t<10?"m0"+t:"m"+t;i[t].value=l[o],n.values&&n.values.some(t=>t[o]!==l[o])?i[t].invalid=!0:i[t].invalid=!1}i.forEach(t=>{u.setReadonly(n,t)})}function ready(){}Object.defineProperty(exports,"__esModule",{value:!0}),exports.ready=exports.update=exports.$=exports.style=exports.template=exports.listeners=void 0,exports.listeners={change(t){var n=this;const u=t.target.getAttribute("local"),e=t.target.value;u&&u in n._dump.value&&(n._dump.value[u]=e,"values"in n._dump)&&n._dump.values.forEach(t=>{t[u]=e})}},exports.template=`
<ui-label slot="label"></ui-label>
<ui-num-input preci="6" slot="content" local="m00" label="m00"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m01" label="m01"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m02" label="m02"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m03" label="m03"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m04" label="m04"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m05" label="m05"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m06" label="m06"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m07" label="m07"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m08" label="m08"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m09" label="m09"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m10" label="m10"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m11" label="m11"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m12" label="m12"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m13" label="m13"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m14" label="m14"></ui-num-input>
<ui-num-input preci="6" slot="content" local="m15" label="m15"></ui-num-input>
`,exports.style=`
:host .content { flex-wrap: wrap; }
:host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
:host .content::slotted(ui-num-input:nth-child(-n+15)) { margin-bottom: 4px; }
:host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
`,exports.$={label:"ui-label",numList:"ui-num-input"},exports.update=update,exports.ready=ready;