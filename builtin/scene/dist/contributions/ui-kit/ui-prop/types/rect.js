"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const utils_1=require("../utils"),dum_element_base_1=require("../dum-element-base");class Rect extends dum_element_base_1.DumpElementBase{type=["cc.Rect"];$x=null;$y=null;$w=null;$h=null;_listeners=["change"];parseAndSetData(l,e){return Object.keys(l).forEach(t=>{t&&t in e.value&&(e.value[t]=l[t],Reflect.has(e,"values"))&&e.values.forEach(e=>{e[t]=l[t]})}),!0}change(e,t){var l;e.target&&(l=e.target.getAttribute("local"),e=e.target.value,l)&&this.parseAndSetData({[l]:e},t)}template=`
        <ui-label slot="label"></ui-label>
        <ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
        <ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
        <ui-num-input preci="6" label="W" slot="content" local="width"></ui-num-input>
        <ui-num-input preci="6" label="H" slot="content" local="height"></ui-num-input>
    `;style=`
        :host .content { flex-wrap: wrap; }
        :host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
        :host .content::slotted(ui-num-input:nth-child(-n+3)) { margin-bottom: 4px; }
        :host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
    `;mounted(e){e=e.querySelectorAll("ui-num-input");e&&(this.$x=e[0],this.$y=e[1],this.$w=e[2],this.$h=e[3])}ready(){super.ready()}update(e){super.update(e);const{x:t,y:l,width:i,height:u}=e.value;this.$x&&(this.$x.value=t,this.$x.invalid=e.values&&e.values.some(e=>e.x!==t),(0,utils_1.setElementReadonly)(e,this.$x)),this.$y&&(this.$y.value=l,this.$y.invalid=e.values&&e.values.some(e=>e.y!==l),(0,utils_1.setElementReadonly)(e,this.$y)),this.$w&&(this.$w.value=i,this.$w.invalid=e.values&&e.values.some(e=>e.width!==i),(0,utils_1.setElementReadonly)(e,this.$w)),this.$h&&(this.$h.value=u,this.$h.invalid=e.values&&e.values.some(e=>e.height!==u),(0,utils_1.setElementReadonly)(e,this.$h))}}exports.default=Rect;