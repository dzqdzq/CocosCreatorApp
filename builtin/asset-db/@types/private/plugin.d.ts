'use strict';

export interface IAssetHandlerInfo {
    list: string[];
    script: string;
}

export interface EditorMethodModule {
    methods: { [name: string]: Function; };
    load(): void;
    unload(): void;
}

export interface AssetDBMountInfo {
    path: string;
    name: string;
    readonly?: boolean;
    visible?: boolean;
    enable?: string;
}

export interface PackageRegisterInfo {
    hook?: string; // 生命周期入口脚本
    assetHandlerInfo?: IAssetHandlerInfo; // 自定义资源处理器入口脚本
    name: string;
    script?: string; // db 脚本机制
    // 注册的资源数据库信息
    mount?: AssetDBMountInfo;

    // 之前的插件机制
    openMessage?: {
        [importerName: string]: string;
    };
}

export interface AssetDBRegisterInfo {
   name: string;
   target: string;
   readonly: boolean;
   visible: boolean;
   ignoreGlob?: string;
   preImportExtList?: string[];
}