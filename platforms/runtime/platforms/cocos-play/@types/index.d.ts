/// <reference path="../../../@types/editor/index.d.ts"/>
/// <reference path="../../../@types/packages/builder/@types/protect/global.d.ts"/>

export * from "../../../@types/packages/builder/@types/protect";
import { IInternalBuildOptions, ISettings } from "../../../@types/packages/builder/@types/protect";

export type IOrientation = 'landscape' | 'portrait';

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'cocos-play': IOptions;
    }
}

export interface IOptions {
    deviceOrientation: IOrientation;
    tinyPackageServer: string;
    // useCustomCpkPath: boolean;
    // outputCpkPath: string;
}

export interface ICompileOptions {
    name: string;
    tinyPackageServer: string;
}

export interface IUserSettings extends ISettings {
    orientation: IOrientation;
}
