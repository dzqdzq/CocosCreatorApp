import * as babel from '@babel/core';
// @ts-ignore
import presetTypeScript from '@babel/preset-typescript';
// @ts-ignore
import pluginDecorators from '@babel/plugin-proposal-decorators';
// @ts-ignore
import pluginClassProperties from '@babel/plugin-proposal-class-properties';
// @ts-ignore
import pluginNullishCoalescingOperator from '@babel/plugin-proposal-nullish-coalescing-operator';
// @ts-ignore
import pluginOptionalChaining from '@babel/plugin-proposal-optional-chaining';

function $ (_: any, options: $.Options): babel.PluginItem {
    const result = {
        presets: [
            [presetTypeScript, {
                allowNamespaces: true,
            }],
        ],
        plugins: [
            [pluginDecorators, {
                legacy: true
            }],

            [pluginClassProperties, {
                loose: true,
            }],

            // ?? operator
            pluginNullishCoalescingOperator,

            // ?. operator
            pluginOptionalChaining,
        ],
    };
    return result;
};

namespace $ {
    export interface Options {
    }
}

export default $;