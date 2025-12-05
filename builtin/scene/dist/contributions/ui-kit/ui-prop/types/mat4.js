"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const utils_1=require("../utils"),dum_element_base_1=require("../dum-element-base");class Mat4 extends dum_element_base_1.DumpElementBase{type=["cc.Mat4"];$numList=null;_listeners=["change"];parseAndSetData(n,t){return Object.keys(n).forEach(u=>{u&&u in t.value&&(t.value[u]=n[u],Reflect.has(t,"values"))&&t.values.forEach(t=>{t[u]=n[u]})}),!0}change(t,u){var n;t.target&&(n=(t=t.target).getAttribute("local"),t=Number(t.value),n)&&this.parseAndSetData({[n]:t},u)}template=`
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
    `;style=`
        :host .content { flex-wrap: wrap; }
        :host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
        :host .content::slotted(ui-num-input:nth-child(-n+15)) { margin-bottom: 4px; }
        :host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
    `;mounted(t){this.$numList=t.querySelectorAll("ui-num-input")}ready(){super.ready()}update(e){if(super.update(e),this.$numList){const l=e.value;this.$numList.forEach((t,u)=>{const n=u<10?"m0"+u:"m"+u;u=this.$numList?this.$numList[u]:null;u&&(u.value=l[n],e.values&&e.values.some(t=>t[n]!==l[n])?u.invalid=!0:u.invalid=!1)}),this.$numList.forEach(t=>(0,utils_1.setElementReadonly)(e,t))}}}exports.default=Mat4;