
export * from "../../../../builtin/builder/@types/protect";
import { IInternalBuildOptions } from "../../../../builtin/builder/@types/protect";

export type IOrientation = 'auto' | 'landscape' | 'portrait';

export interface IOptions {
    appid: string;
    remoteServerAddress: string;
    buildOpenDataContextTemplate: boolean;
    orientation: IOrientation;
    physX: {
        notPackPhysXLibs: boolean;
        mutiThread: boolean;
        subThreadCount: number;
        epsilon: number;
    };
}

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'bytedance-mini-game': IOptions;
    };
}
