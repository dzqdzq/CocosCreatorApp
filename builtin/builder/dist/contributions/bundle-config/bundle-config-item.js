Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.data = undefined;
exports.props = undefined;
exports.template = undefined;
const bundle_utils_1 = require("../../share/bundle-utils");

const { checkRemoteDisabled, getInvalidRemote } = bundle_utils_1;

exports.template = `
<div @change="onBundleConfigChange">
  <ui-select-pro path="compressionType"
      :value="option.compressionType || 'merge_dep'"
      :disabled="readonly"
      @click.stop
  >
      <template v-for="type of supportOptions.compressionType">
          <ui-select-option-pro 
              :key='type' 
              :value='type' 
              :label='compressRenderList[type]'
              :selected="(option.compressionType || 'merge_dep') === type"
          >
          </ui-select-option-pro>
      </template>
  </ui-select-pro>
  <div>
      <ui-checkbox path="isRemote"
          :value="getInvalidRemote(option.compressionType, option.isRemote)"
          :disabled="readonly || isRemoteLocked(option.compressionType)"
          @click.stop
      ></ui-checkbox>
  </div>
</div>
`;

exports.props = ["option", "readonly", "supportOptions", "filterList", "type"];

const data = () => ({
  compressRenderList: Object.freeze(bundle_utils_1.BundlecompressionTypeMap),
});

exports.data = data;

exports.methods = {
  onBundleConfigChange(e) {
    var t = e.target.value;
    var e = e.target.getAttribute("path");

    if (e) {
      this.$emit("update", e, t, this.type);
    }
  },
  isRemoteLocked(e) {
    return checkRemoteDisabled(e);
  },
  getInvalidRemote(e, t) {
    return getInvalidRemote(e, t);
  },
};
