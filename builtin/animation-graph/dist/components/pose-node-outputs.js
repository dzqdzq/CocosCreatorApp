function data() {
  return {};
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.props = undefined;
exports.template = undefined;
exports.data = data;

exports.template = `
<div class="outputs">
    <div class="row"
        v-for="(output,index) in dump.outputs" 
        :key="$root.queryData.assetInfo.uuid + '-pose-node-output' + output.id"
    >
        <div class="point output"
            :ref="'point-'+output.id"
            :style="outputPointStyle(output)"
            :node-id="dump.id"
            :point-id="output.id"
            :connect="isConnect(output)"
            @mousedown.left.stop="mouseDownStarter(output)"
        ></div>
        <ui-label class="name" 
            :value="output.name"
            :tooltip="output.name"
        ></ui-label>
        <ui-icon class="pose" value="pose"
            v-if="isPoseOutput(output)"
        ></ui-icon>
    </div>
</div>
`;

exports.props = ["dump"];

exports.methods = {
  mouseDownStarter(t) {
    var o = new Array(4);
    o[1] = t.id;
    this.$parent.addShadowLine(true, o);
  },
  outputPointStyle(t) {
    t = this.$root.queryData.view.poseExpr.inputOutputTypeInfos[t.type];
    return !!t && "--input-output-color:" + t.themeColor;
  },
  isPoseOutput(t) {
    return t.type === 5;
  },
  isConnect(t) {
    return t.destinationInputs && t.destinationInputs.length > 0;
  },
};
