"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.PropertyCurve=void 0;const vue_js_1=require("vue/dist/vue.js"),store_grid_1=require("../hooks/store-grid"),use_curve_editor_1=require("../hooks/use-curve-editor"),use_grid_scroll_1=require("../hooks/use-grid-scroll"),directives_1=require("../directives"),template=`
    <div class="curve-editor">
        <ui-curve-editor
            ref="editor"
            class="tw-w-full tw-h-full curve-editor__editor"
            tabindex="0"
            @transform="onTransform"
            @focus="onCurveFocus"
            @blur="onCurveBlur"
        ></ui-curve-editor>

        <ui-grid-scrollbar
            v-set:scale="xScale"
            v-set:offset="xOffset"
            class="curve-editor__horizontal"
            @change="onXChange"
        ></ui-grid-scrollbar>

        <ui-grid-scrollbar
            v-set:scale="yScale"
            v-set:offset="yOffset"
            vertical
            class="curve-editor__vertical"
            @change="onYChange"
        ></ui-grid-scrollbar>
    </div>
`;exports.PropertyCurve=(0,vue_js_1.defineComponent)({name:"PropertiesCurve",components:{},directives:(0,directives_1.adaptDirectives)({set:directives_1.PropSet}),props:{},emits:{},setup(e,r){const o=(0,use_curve_editor_1.useCurveEditor)({uniqueName:"curve",configure(){}});var s=o["curveEditor"];const t=(0,store_grid_1.useTransformEvent)();const{xOffset:i,xScale:u,yOffset:c,yScale:n,onXChange:l,onTransform:a,onYChange:v,updateScrollFromCurve:d}=(0,use_grid_scroll_1.useGridScrollSync)({curveElement:s,emitGlobalTransform:()=>t.emitUpdate("property")});return{...{...o.getExposedAPI(),paint:e=>{o.paint(e),d()}},xOffset:i,xScale:u,yOffset:c,yScale:n,onXChange:l,onYChange:v,onTransform:a,onCurveBlur:o.onBlur,onCurveFocus:o.onFocus}},template:template});