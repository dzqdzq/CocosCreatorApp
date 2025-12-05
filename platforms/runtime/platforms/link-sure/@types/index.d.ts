/// <reference path="../../../@types/index.d.ts"/>
/// <reference path="../../../@types/packages/builder/@types/protect/global.d.ts"/>

export * from "../../../@types/packages/builder/@types/protect";
import { IInternalBuildOptions } from "../../../@types/packages/builder/@types/protect";

export type IOrientation = 'landscape' | 'portrait';

export interface PlatformSettings {
    runtimeVersion: string,
    deviceOrientation: IOrientation,
    statusbarDisplay: boolean,
    startSceneAssetBundle: false,
    resourceURL: string,
    workerPath: string,
    XHRTimeout: number,
    WSTimeout: number,
    uploadFileTimeout: number,
    downloadFileTimeout: number,
    cameraPermissionHint: string,
    userInfoPermissionHint: string,
    locationPermissionHint: string,
    albumPermissionHint: string
}

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        "link-sure": PlatformSettings
    }
}
