
export * from "../../../../builtin/builder/@types/protect";
import { IInternalBuildOptions, IPolyFills, ISettings } from "../../../../builtin/builder/@types/protect";

export type IOrientation = 'auto' | 'landscape' | 'portrait';
export interface IOptions {
    orientation: IOrientation;
    embedWebDebugger: boolean;
    polyfills?: IPolyFills;
    remoteServerAddress?: string;
}
export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'web-mobile': IOptions;
    }
}
export interface IUserSettings extends ISettings {
    orientation: IOrientation;
}
