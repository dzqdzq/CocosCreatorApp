"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.XMLLabelInspectorComponent=void 0;const cc_1=require("cc"),adapter_1=require("../adapter");class XMLLabelInspectorComponent extends adapter_1.XMLInspectorComponent{render(e){return`
            <div style="border-top: 1px solid #000; padding: 10px;">
                XML Pasrser
            </div>
            <ui-prop>
                <ui-label slot="label">CustomMaterial</ui-label>
                <ui-asset slot="content" droppable="cc.Material"
                    value="${e.customMaterial?e.customMaterial.uuid:""}"
                    @change="onMaterialChange"
                ></ui-asset>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label">Color</ui-label>
                <ui-color slot="content"
                    value="[${cc_1.Color.toArray([],e.color).map(e=>Math.round(255*e))}]"
                    @change="onColorChange"
                ></ui-asset>
            </ui-prop>
            <ui-prop class="test">
                <ui-label slot="label">String</ui-label>
                <div slot="content">
                    <ui-textarea
                        value="${e.string}"
                        @change="onStringChange"
                    ></ui-textarea>
                </div>
            </ui-prop>
            <ui-prop>
                <ui-label slot="label">Horizontal Align</ui-label>
                <div slot="content">
                    <ui-tab
                        value="${e.horizontalAlign}"
                        @change="onHorizontalAlignChange"
                    >
                        <ui-button value="0">
                            <ui-icon value="align-left"></ui-icon>
                        </ui-button>
                        <ui-button value="1">
                            <ui-icon value="align-h-center"></ui-icon>
                        </ui-button>
                        <ui-button value="2">
                            <ui-icon value="align-right"></ui-icon>
                        </ui-button>
                    </ui-tab>
                </div>
            <ui-prop>
            <ui-prop>
                <ui-label slot="label">Overflow</ui-label>
                <ui-select slot="content"
                    value="${e.overflow}"
                    @change="onOverflowChange"
                >
                    <option value="0">NONE</option>
                    <option value="1">CLAMP</option>
                    <option value="2">SHRINK</option>
                    <option value="3">RESIZE_HEIGHT</option>
                </ui-select>
            <ui-prop>
            <ui-prop>
                <ui-label slot="label">Test Button</ui-label>
                <ui-button slot="content"
                    @click="onTestButtonClick"
                >Test</ui-button>
            </ui-prop>
        `}onStringChange(e,o){e.string=o.getAttribute("value"),cce.Node.emit("change",e.node)}onMaterialChange(t,e){e=e.getAttribute("value");cc_1.assetManager.loadAny(e,(e,o)=>{t.customMaterial=o}),cce.Node.emit("change",t.node)}onColorChange(e,o){o=JSON.parse(o.getAttribute("value")).map(e=>e/255);e.color=cc_1.Color.fromArray(o,new cc_1.Color),cce.Node.emit("change",e.node)}onOverflowChange(e,o){e.overflow=parseInt(o.getAttribute("value")),cce.Node.emit("change",e.node)}onHorizontalAlignChange(e,o){e.horizontalAlign=parseInt(o.getAttribute("value")),cce.Node.emit("change",e.node)}onTestButtonClick(e,o){console.log("XML Test Click")}}exports.XMLLabelInspectorComponent=XMLLabelInspectorComponent;