Object.defineProperty(exports, "__esModule", { value: true });
exports.name = undefined;
exports.props = undefined;
exports.template = undefined;

exports.template = `
<div class="mask"
    v-if="value"
>
    <ui-label :value="value"></ui-label>
</div>
`;

exports.props = ["value"];
exports.name = "build-mask";
