import { ISettings } from '../../../builder/@types/public/build-result';
declare global {
    const System: any;
}
declare function bootstrap(options: bootstrap.Options): Promise<void>;
declare namespace bootstrap {
    interface Options {
        /**
         * 引擎模块 URL。
         */
        engineBaseUrl: string;
        devices: Record<string, {
            name: string;
            width: number;
            height: number;
            ratio?: number;
        }>;
        /**
         * Settings。
         */
        settings: ISettings;
    }
}
export { bootstrap };
