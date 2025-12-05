'use strict';

import { AssetHandler } from '@cocos/creator-types/editor/packages/asset-db/@types/protected';
import { HMIScene } from './scene';
import { join } from 'path';

export const HMIPrefab: AssetHandler = {
    // 唯一字段名
    name: 'hmi-prefab',
    extends: 'prefab',
    iconInfo: {
        default: {
            type: 'image',
            value: join(__dirname, '../../static/prefab.svg'),
        },
    },
    importer: HMIScene.importer,
    createInfo: {
        save: HMIScene.createInfo?.save,
        async generateMenuInfo() {
            const sceneConfig = {
                label: 'i18n:hmi-adapter.newPrefab',
                fullFileName: 'default.hmi-prefab',
                template: join(__dirname, '../../static', 'default.hmi-prefab'),
                group: 'scene',
            };
            return [sceneConfig];
        },
        create: HMIScene.createInfo?.create,
    },

    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    validate: HMIScene.validate,
};

