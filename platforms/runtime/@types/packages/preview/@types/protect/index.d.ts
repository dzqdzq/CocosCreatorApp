import { Platform } from "../../../builder/@types/public";

export type IPreviewType = 'game-view' | 'simulator' | 'browser';

export type ISupportDataType = 'settings' | 'renderData';

export interface IHookConfig {
    methods: string;
    hook: string;
}
export interface IGenerateSettingsOptions {
    type: IPreviewType;
    startScene?: string;
    platform?: Platform;
}

export interface IPreviewPluginConfig {
    methods?: string;
    hooks?: Record<string, string>;
}
