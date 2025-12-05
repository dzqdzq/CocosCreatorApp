
export * from "../../../../builtin/builder/@types/protect";
import { IInternalBuildOptions } from "../../../../builtin/builder/@types/protect";

export type IOrientation = 'auto' | 'landscape' | 'portrait';

export interface IOptions {
    appid: string;
    remoteServerAddress: string;
    buildOpenDataContextTemplate: boolean;
    orientation: IOrientation;
}

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'baidu-mini-game': IOptions;
    };
}
