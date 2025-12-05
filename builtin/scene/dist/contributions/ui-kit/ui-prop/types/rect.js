"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const utils_1=require("../utils"),dum_element_base_1=require("../dum-element-base");class Rect extends dum_element_base_1.DumpElementBase{constructor(){super(...arguments),this.type=["cc.Rect"],this.$x=null,this.$y=null,this.$w=null,this.$h=null,this._listeners=["change"],this.template=`
        <ui-label slot="label"></ui-label>
        <ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
        <ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
        <ui-num-input preci="6" label="W" slot="content" local="width"></ui-num-input>
        <ui-num-input preci="6" label="H" slot="content" local="height"></ui-num-input>
    `,this.style=`
        :host .content { flex-wrap: wrap; }
        :host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
        :host .content::slotted(ui-num-input:nth-child(-n+3)) { margin-bottom: 4px; }
        :host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
    `}parseAndSetData(l,t){return Object.keys(l).forEach(e=>{e&&e in t.value&&(t.value[e]=l[e],Reflect.has(t,"values"))&&t.values.forEach(t=>{t[e]=l[e]})}),!0}change(t,e){var l;t.target&&(l=t.target.getAttribute("local"),t=t.target.value,l)&&this.parseAndSetData({[l]:t},e)}mounted(t){t=t.querySelectorAll("ui-num-input");t&&(this.$x=t[0],this.$y=t[1],this.$w=t[2],this.$h=t[3])}ready(){super.ready()}update(t){super.update(t);const{x:e,y:l,width:s,height:i}=t.value;this.$x&&(this.$x.value=e,this.$x.invalid=t.values&&t.values.some(t=>t.x!==e),(0,utils_1.setElementReadonly)(t,this.$x)),this.$y&&(this.$y.value=l,this.$y.invalid=t.values&&t.values.some(t=>t.y!==l),(0,utils_1.setElementReadonly)(t,this.$y)),this.$w&&(this.$w.value=s,this.$w.invalid=t.values&&t.values.some(t=>t.width!==s),(0,utils_1.setElementReadonly)(t,this.$w)),this.$h&&(this.$h.value=i,this.$h.invalid=t.values&&t.values.some(t=>t.height!==i),(0,utils_1.setElementReadonly)(t,this.$h))}}exports.default=Rect;