"use strict";function data(){return{}}Object.defineProperty(exports,"__esModule",{value:!0}),exports.methods=exports.data=exports.props=exports.template=void 0,exports.template=`
<div class="inputs">
    <div class="row"
        v-for="(input,index) in dump.inputs" 
        :key="$root.queryData.assetInfo.uuid + '-pose-node-input-' + input.id"
        :type="input.value.type"
    >
        <div class="point input"
            :ref="'point-'+input.id"
            :style="inputPointStyle(input)"
            :node-id="dump.id"
            :point-id="input.id"
            :connect="isConnect(input)"
            @mousedown.left.stop="mouseDownStarter(input)"
        ></div>
        <ui-icon class="pose" value="pose"
            v-if="isPoseInput(input)"
        ></ui-icon>
        <ui-label class="name" 
            :value="input.name"
            :tooltip="input.name"
        ></ui-label>
        <ui-prop class="prop" type="dump" no-label
            v-if="showInputProp(input)"
            :render="JSON.stringify(input.value)"
            @confirm-dump="updatePoseNodeInput($event,input.id)"
            @mousedown.stop
        ></ui-prop>
    </div>
</div>
`,exports.props=["dump"],exports.data=data,exports.methods={mouseDownStarter(t){var e=new Array(4);e[3]=t.id,this.$parent.addShadowLine(!1,e)},showInputProp(e){if(!e.value)return!1;if("Unknown"===e.value.type)return!1;const p=this.dump.id;return!this.$parent.$parent.graph.links.some(t=>t.destinationID===p&&t.destinationInputID===e.id)},updatePoseNodeInput(t,e){t=t.target;this.$root.updatePoseNodeInput(this.dump.id,e,t.dump)},inputPointStyle(t){t=this.$root.queryData.view.poseExpr.inputOutputTypeInfos[t.type];return!!t&&"--input-output-color:"+t.themeColor},isPoseInput(t){return 5===t.type},isConnect(t){return t.sourceOutputs&&0<t.sourceOutputs.length}};