
export * from "../../../../builtin/builder/@types/protect";
import { IInternalBuildOptions } from "../../../../builtin/builder/@types/protect";

export type IOrientation = 'auto' | 'landscape' | 'portrait';

export interface IOptions {
    appid: string;
    remoteServerAddress: string;
    buildOpenDataContextTemplate: boolean;
    orientation: IOrientation;
    separateEngine: boolean;
    wasm: 'js' | 'wasm' | boolean;
}

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        wechatgame: IOptions;
    };
}
