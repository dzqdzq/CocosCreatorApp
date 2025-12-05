'use strict';

import { AssetHandler } from '@cocos/creator-types/editor/packages/asset-db/@types/protected';
import { Asset } from '@editor/asset-db';
import { copy, outputFile, readFileSync, readJSON, writeFile } from 'fs-extra';
import { transformHMIContentToNormalContent, transformToHMIContent } from '../hmi-translator';
import { basename, extname, join } from 'path';
export interface MigrationSwapSpace {
    json: unknown;
}
export const HMIScene: AssetHandler = {
    // 唯一字段名
    name: 'hmi-scene',
    extends: 'scene',
    iconInfo: {
        default: {
            type: 'image',
            value: join(__dirname, '../../static/scene.svg'),
        },
    },

    importer: {
        async before(asset) {
            // 导入前解密处理
            let str = readFileSync(asset.source, 'utf-8');
            str = await transformHMIContentToNormalContent(str);
            const extName = extname(asset.source);
            // HACK 处理，目前不修改名字，这样可以走原来 scene/prefab 的导入流程就完全没有风险了
            const tempSource = join(asset.temp, `${basename(asset.source, extName)}.${extName.replace('.hmi-', '')}`);
            await outputFile(tempSource, str);
            // @ts-ignore
            asset._hmiSource = asset.source;
            // @ts-ignore 临时模拟为正常的场景数据
            asset._source = tempSource;
            return true;
        },

        async after(asset) {
            // @ts-ignore
            asset._source = asset._hmiSource;
            // @ts-ignore
            delete asset._hmiSource;
            return true;
        },

        migrationHook: {
            async pre(asset: Asset) {
                const swap = asset.getSwapSpace<MigrationSwapSpace>();
                // 导入前解密处理
                let str = readFileSync(asset.source, 'utf-8');
                str = await transformHMIContentToNormalContent(str);
                swap.json = JSON.parse(str);
            },
            async post(asset: Asset, num: number) {
                const swap = asset.getSwapSpace<MigrationSwapSpace>();
                if (num > 0) {
                    // 请勿使用 writeJson，因为这个接口会在末尾增加空行
                    const json = JSON.stringify(swap.json, null, 2);
                    const content = await transformToHMIContent(json as string);
                    await outputFile(asset.source, content);
                }
                delete swap.json;
            },
        },
    },

    createInfo: {
        async save(asset, content) {
            content = await transformToHMIContent(content as string);
            await outputFile(asset.source, content);
            return true;
        },
        async generateMenuInfo() {
            const sceneConfig = {
                label: 'i18n:hmi-adapter.newScene',
                fullFileName: 'default.hmi-scene',
                template: join(__dirname, '../../static', 'default.hmi-scene'),
                group: 'scene',
            };
            return [sceneConfig];
        },
        async create(option) {
            // 由资源内容创建资源
            if (option.content) {
                // 存在资源内容的创建流程，需要先走加密处理
                option.content = await transformToHMIContent(option.content as string);
                await outputFile(option.target, option.content);
            } else if (option.template) {
                // 走正常的拷贝流程，注意此处带在插件里的模板文件可能会遇到权限问题
                await Editor.Utils.File.copy(option.template, option.target);
            }
            return option.target;
        },
    },

    /**
     * 判断是否允许使用当前的 Handler 进行导入
     * @param asset
     */
    async validate(asset: Asset) {
        if (await asset.isDirectory()) {
            return false;
        }
        // return await checkIsHMIData(asset.source);
        return true;
    },

};

