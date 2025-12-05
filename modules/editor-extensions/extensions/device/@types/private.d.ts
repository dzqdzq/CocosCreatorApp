import { IDeviceItem } from './public';

export type PreferencesProtocol = 'default' | 'global' | 'local';

export interface ExportConfig {
    [key: string]: {
        type?: PreferencesProtocol;
        value: IDeviceItem[];
    };
}