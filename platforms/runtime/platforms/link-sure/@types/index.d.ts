/// <reference path="../../../@types/editor/index.d.ts"/>
/// <reference path="../../../@types/packages/builder/@types/protect/global.d.ts"/>
export * from "../../../@types/packages/builder/@types/protect";
import { IInternalBuildOptions } from "../../../@types/packages/builder/@types/protect";

export interface IGameConfig {
    subpackages: IPacakageInfo[];
}

export interface IPacakageInfo {
    name: string;
    root: string;
}
export interface IOptions {
    remoteServerAddress: string;
    startSceneAssetBundle: boolean;
}
export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'link-sure': IOptions;
    };
}
