
import { IInternalBuildOptions, IPolyFills, ISettings } from "../../../../builtin/builder/@types/protect";
export * from "../../../../builtin/builder/@types/protect";

export type IOrientation = 'landscape' | 'portrait';

export interface IUserSettings extends ISettings {
    orientation: IOrientation;
}

export interface ITaskOption extends IInternalBuildOptions {
    packages: {
        'alipay-mini-game': {
            deviceOrientation: IOrientation;
            remoteUrl: string;
            polyfills?: IPolyFills;
        }
    }
}
