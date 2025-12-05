/// <reference path="../../../@types/index.d.ts"/>
/// <reference path="../../../@types/packages/builder/@types/protect/global.d.ts"/>
export * from "../../../@types/packages/builder/@types/protect/index";
import { IInternalBuildOptions } from "../../../@types/packages/builder/@types/protect/index";

export type IOrientation = 'landscape' | 'portrait';

export interface ITaskOption extends IInternalBuildOptions {
    packages:{
        'huawei-quick-game': IOptions;
    };
}

export interface IOptions {
    package: string;
    icon: string;
    versionName: string;
    versionCode: string;
    minPlatformVersion: string;
    deviceOrientation: IOrientation;
    tinyPackageServer: string;
    useDebugKey: boolean;
    privatePemPath: string;
    certificatePemPath: string;

    fullScreen: boolean;
    logLevel: string;
    manifestPath?: string;
}

export interface ICompileOptions {
    name: string;
    tinyPackageServer: string;
}
