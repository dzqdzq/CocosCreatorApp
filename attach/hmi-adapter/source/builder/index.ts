import { IInternalBuildPluginConfig } from '@cocos/creator-types/editor/packages/builder/@types/protected';

export const configs: Record<string, IInternalBuildPluginConfig> = {
    'android': {
        hooks: './hooks',
    },
    // 方便测试
    'web-desktop': {
        hooks: './hooks',
    },
};
