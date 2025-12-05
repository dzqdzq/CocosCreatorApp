import type { InputOptions, ModuleFormat, OutputOptions, Plugin } from 'rollup';
import type VuePlugin from 'rollup-plugin-vue';
import type commonjs from '@rollup/plugin-commonjs';
import type postcss from 'rollup-plugin-postcss';
import type babel from '@rollup/plugin-babel';
import type typescript from 'rollup-plugin-typescript2';
import type { terser } from 'rollup-plugin-terser';
import type json from '@rollup/plugin-json';
import type url from '@rollup/plugin-url';
import type del from 'rollup-plugin-delete';
interface PluginOption<T extends (arg: any) => Plugin> {
    /**
    * 插件的配置，可以通过参数获得工作流中默认的配置
    */
    options?: (defaultValue?: Partial<Parameters<T>[0]>) => Parameters<T>[0],
    /**
     * 是否开启该插件，默认开启
     */
    enable?: boolean
}

interface RollupWorkflowConfig {
    /**
    * @see https://rollupjs.org/guide/zh/#%E8%BE%93%E5%85%A5%E5%8F%82%E6%95%B0inputoptions
    * 输入参数
    * （注意：别在这里修改插件）
    */
    inputOptions?: (defaultInputOptions: Omit<InputOptions, 'plugins' | 'input'>) => Omit<InputOptions, 'plugins' | 'input'>,
    /**
     * @see https://rollupjs.org/guide/zh/#%E8%BE%93%E5%87%BA%E5%8F%82%E6%95%B0outputoptions
     * 输出参数
     */
    outputOptions?: (defaultOutOptions: Omit<OutputOptions, 'format'>) => Omit<OutputOptions, 'format'>
    /**
     * tsconfig.json的路径相对于扩展目录
     */
    tsconfigPath?: string,
    /**
     * 开关以及配置插件
     */
    pluginSetting?: Partial<{
        /**
         * 允许 import .vue 文件,得到对应的 Vue 组件的类
         */
        vue: PluginOption<typeof VuePlugin>,
        /**
         * Convert CommonJS modules to ES6, so they can be included in a Rollup bundle
         */
        commonjs: PluginOption<typeof commonjs>,
        /**
         * 允许 import 样式文件，得到对应的 css 字符串
         */
        postcss: PluginOption<typeof postcss>,
        /**
        * @en ES6 syntax => ES5 syntax
        * @zh 将 ES6 格式转换为 ES5 格式
        */
        babel: PluginOption<typeof babel>,
        /**
         * 编译 typescript
         */
        typescript: PluginOption<typeof typescript>,
        /**
         * 混淆代码
         */
        terser: PluginOption<typeof terser>,
        /**
         * 允许 import json 文件，得到对应的对象
         */
        json: PluginOption<typeof json>,
        /**
         * 允许导入资源，得到资源相对根目录的路径，具体哪些资源允许导入需要参考 rollup-workflow.js 的 KNOWN_ASSET_TYPES 配置
         */
        url: PluginOption<typeof url>,
        /**
         * 清空输出目录
         */
        del: PluginOption<typeof del>,
        /**
         * 设置 import.meta.relativePath 的值为 bundle 所在目录到根目录的相对路径
         */
        relativeRoot: PluginOption<() => Plugin>
    }>,
    /**
     * 新的插件放这里
     */
    extraPlugin?: Plugin[],
    /**
     * 输出目录，相对于扩展目录
     */
    distDir: string,
    /**
     * 输入目录，相对于扩展目录
     */
    sourceDir: string,
    /**
     * 输入的源文件，相对于输入目录
     */
    sources: string[],
    /**
     * 输出的文件格式
     */
    format: ModuleFormat
}
declare interface WorkflowConfig {
    /**
    * 清理项目的时候删除的文件
    */
    clear: () => string
    /**
    * 需要编译的 less 文件
    */
    css?: () => {
        source: string,
        dist: string,
    }[],

    /**
     * 需要编译的 ts 文件夹
     */
    js?: () => string[],
    /**
     * 返回 rollup 配置
     */
    rollup?: (() => RollupWorkflowConfig[])
}

interface TaskConstructorParams {
    name: string,
    extensionDir: string,
    temp?: string,
}
