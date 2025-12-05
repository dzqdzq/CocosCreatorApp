// ********************************* plugin ****************************************

import {
    BundleCompressionType,
    IBuildPluginConfig,
    IBuildTaskOption,
    IDisplayOptions,
    IConfigItem,
    ISettings,
    IVerificationRuleMap,
} from '../public';
import { BuilderAssetCache } from './asset-manager';
import { InternalBuildResult } from './build-result';
import { IInternalBuildOptions, IConsoleType } from './options';
import { ITextureCompressPlatform, ITextureCompressType } from '../public/texture-compress';

export interface IBuildWorkerPluginInfo {
    assetHandlers?: string;
    // 注册到各个平台的钩子函数
    hooks?: Record<string, string>;
    pkgName: string;
    internal: boolean; // 是否为内置插件
    priority: number; // 优先级
    // [platform][stageName]: ICustomBuildStageItem
    customBuildStages?: {
        [platform: string]: ICustomBuildStageItem[];
    };
}

export type IPluginHookName =
    | 'onBeforeBuild'
    | 'onAfterInit'
    | 'onBeforeInit'
    | 'onAfterInit'
    | 'onBeforeBuildAssets'
    | 'onAfterBuildAssets'
    | 'onBeforeCompressSettings'
    | 'onAfterCompressSettings'
    | 'onAfterBuild'
    | 'onError';
// | 'onBeforeCompile'
// | 'compile'
// | 'onAfterCompile'
// | 'run';

export type IPluginHook = Record<IPluginHookName, IInternalBaseHooks>;
export interface IInternalHook {
    throwError?: boolean; // 插件注入的钩子函数，在执行失败时是否直接退出构建流程
    title?: string; // 插件任务整体 title，支持 i18n 写法
    // ------------------ 钩子函数 --------------------------
    onBeforeBuild?: IInternalBaseHooks;
    onBeforeInit?: IInternalBaseHooks;
    onAfterInit?: IInternalBaseHooks;
    onBeforeBuildAssets?: IInternalBaseHooks;
    onAfterBuildAssets?: IInternalBaseHooks;
    onBeforeCompressSettings?: IInternalBaseHooks;
    onAfterCompressSettings?: IInternalBaseHooks;
    onAfterBuild?: IInternalBaseHooks;
    // ------------------ 其他操作函数 ---------------------
    // 内置插件才有可能触发这个函数
    run?: (dest: string, options: IBuildTaskOption) => Promise<boolean>;
    // 内置插件才有可能触发这个函数
    compile?: (dest: string, options: IBuildTaskOption) => boolean;
}

export type IInternalBaseHooks = (
    options: IInternalBuildOptions,
    result: InternalBuildResult,
    cache: BuilderAssetCache,
    ...args: any[]
) => void;
export interface IBuildTask {
    handle: (options: IInternalBuildOptions, result: InternalBuildResult, cache: BuilderAssetCache, settings?: ISettings) => {};
    title: string;
    name: string;
}

export type OverriteCommonOption =
    | 'buildPath'
    | 'server'
    | 'polyfills'
    | 'mainBundleIsRemote'
    | 'name'
    | 'sourceMaps'
    | 'experimentalEraseModules'
    | 'buildStageGroup';

// 允许对 build 重新定义，但指定 hookHandle 无效
export interface ICustomBuildStageItem {
    name: string; // 阶段唯一名称，同平台不允许重名
    hookHandle: string; // 执行当前插件内对应 hook 内的某个执行函数
    displayName?: string; // 阶段名称，显示在构建面板对应按钮以及一些报错提示上
    description?: string; // 构建阶段描述，将会作为构建面板对应按钮上的 tooltip
    lockConfig?: {
        platform?: 'all' | Platform[]; // 当前阶段任务执行时的锁定范围，不设置则不锁定，设为 all 则所有平台的阶段任务都不能并行，设为数组则为指定某些平台的阶段任务执行时不能并行
        stage?: 'all' | [stageName: string][]; // 指定阶段执行时的锁定范围，不设置则不锁定
    };
    requestOptions?: boolean; // 是否需要构建选项，设为 true 则构建流程将会生成一份配置选项到包内，在执行任务时将会自动读取选项
    supportCustomHook?: boolean; // 是否支持自定义钩子函数，开启后，将会调用其他插件内的 onBeforeXXX 或 onAfterXXX
    showProgressBar?: boolean; // 是否显示进度条
    showBuildButton?: boolean; // 是否显示指定的控制按钮在构建列表
}

export interface IInternalBuildPluginConfig extends IBuildPluginConfig {
    doc?: string; // 注册文档地址
    platformName?: string; // 平台名，可以指定为 i18n 写法, 只有官方构建插件的该字段有效
    hooks?: string; // 钩子函数的存储路径
    panel?: string; // 存储导出 vue 组件、button 配置的脚本路径
    textureCompressConfig?: {
        // 仅对内部插件开放
        platformType: ITextureCompressPlatform; // 注册的纹理压缩平台类型
        support: {
            rgba: ITextureCompressType[];
            rgb: ITextureCompressType[];
        }; // 该平台支持的纹理压缩格式，按照推荐优先级排列
    };
    assetBundleConfig?: {
        // asset bundle 的配置
        supportedCompressionTypes: BundleCompressionType[];
    };
    priority?: number;
    wrapWithFold?: boolean; // 是否将选项显示在折叠框内（默认 true ）
    options?: IDisplayOptions; // 需要注入的平台参数配置
    verifyRuleMap?: IVerificationRuleMap; // 注入的需要更改原有参数校验规则的函数
    commonOptions?: Record<string, IConfigItem>; // 允许修改部分内置配置的界面显示方式
    // TODO 之前为 ios-app-clip HACK 出来的接口，之后需要重新设计
    realInFileExplorer?: (options: IInternalBuildOptions | any) => void; // 根据构建配置计算输出地址（界面中的在文件夹中显示）
    debugConfig?: IDebugConfig;
    // 阶段性任务注册信息，由于涉及到按钮排序问题，需要指定为数组
    customBuildStages?: ICustomBuildStageItem[];

    internal?: boolean; // 注册后，构建插件赋予的标记，插件指定无效
}

export interface ICustomBuildStageDisplayItem extends ICustomBuildStageItem {
    groupItems: ICustomBuildStageItem[]; // 是否是复合按钮
    inGroup: boolean;
}

export interface BuildCheckResult {
    error: string;
    newValue: any;
    level: IConsoleType;
}

export type IBuildVerificationFunc = (value: any, options: IBuildTaskOption) => boolean | Promise<boolean>;

export interface IDebugConfig {
    options?: IDisplayOptions; // 显示在构建平台编译运行调试工具上的配置选项
    custom?: string; // 显示在构建平台编译运行调试工具上的配置 vue 组件
}

// ui-panel 注册数据
export interface PanelInfo {
    $?: { [name: string]: string | HTMLElement | null };
    template?: string; // TODO 暂时设置为可选
    style?: string;
    methods?: { [name: string]: Function };
    ready?: Function;
    close?: Function;
    update?: (options: IBuildTaskOption, path: string, value: any) => void | Promise<void>;
}

export interface IPanelThis {
    $: Record<string, HTMLElement>;
    dispatch: (name: string, ...args: any[]) => void;
}

export interface IPanelInfo extends PanelInfo {
    component?: any; // 注入面板的 vue 组件，可与与 options 共存，options 会优先显示
    customButton?: string; // 要注入的构建按钮 ui-panel 组件
}

export interface ICompInfo {
    displayName?: string;
    doc?: string;
    custom?: any;
    options?: IDisplayOptions;
    panelInfo?: PanelInfo;
    wrapWithFold: boolean;

    // ..... 初始化时未存在的字段 .....
    panel?: any; // 实例化后的 panel 对象
    pkgName?: string; // 插件名称
}

// 构建平台下架状态
export interface IPlatformDelisted {
    status: 'preDelisted' | 'delisted'; // 状态
    message: string; // 默认下架提示信息
    [key: string]: string; // 对应语言的下架提示信息。例如 message_zh
}
