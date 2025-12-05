"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const preset_typescript_1 = __importDefault(require("@babel/preset-typescript"));
// @ts-ignore
const plugin_proposal_decorators_1 = __importDefault(require("@babel/plugin-proposal-decorators"));
// @ts-ignore
const plugin_proposal_class_properties_1 = __importDefault(require("@babel/plugin-proposal-class-properties"));
// @ts-ignore
const plugin_proposal_nullish_coalescing_operator_1 = __importDefault(require("@babel/plugin-proposal-nullish-coalescing-operator"));
// @ts-ignore
const plugin_proposal_optional_chaining_1 = __importDefault(require("@babel/plugin-proposal-optional-chaining"));
function $(_, options) {
    const result = {
        presets: [
            [preset_typescript_1.default, {
                    allowNamespaces: true,
                }],
        ],
        plugins: [
            [plugin_proposal_decorators_1.default, {
                    legacy: true
                }],
            [plugin_proposal_class_properties_1.default, {
                    loose: true,
                }],
            // ?? operator
            plugin_proposal_nullish_coalescing_operator_1.default,
            // ?. operator
            plugin_proposal_optional_chaining_1.default,
        ],
    };
    return result;
}
;
exports.default = $;
//# sourceMappingURL=index.js.map