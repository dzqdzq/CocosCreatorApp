import globby from 'globby';
import { transformFileToHMIFile, transformMetaToHMIMeta } from './hmi-translator';
import { dirname, join } from 'path';
import { DropCallbackInfo, IDragAdditional } from '@cocos/creator-types/editor/packages/assets/@types/protected';
import { existsSync } from 'fs';
import { readJSONSync } from 'fs-extra';
import { app } from 'electron';

export const methods = {
    /**
     * 将给定目录下的场景文件加密为车机版场景
     * @param path 
     */
    async transformNormalSceneToHmi(path: string): Promise<boolean> {
        if (!path) {
            const result = await Editor.Dialog.select({
                type: 'directory',
            });
            path = result.filePaths[0];
        }
        if (!path) {
            console.log('请选择需要转换的 Creator 项目或者资源文件夹');
            return false;
        }
        let creatorProject = true;
        try {
            const packageJSON = require(join(path, 'package.json'));
            !packageJSON.hmi && (packageJSON.hmi = {
                version: packageJSON.version,
            });
        } catch (error) {
            creatorProject = false;
            console.warn(`${path} 不是一个合法的 Creator 项目，将仅转换文件夹下的资源`);
        }

        const sceneFiles = await globby([join(path, '**/*.scene'), join(path, '**/*.prefab')], {
            onlyFiles: true,
        });
        if (!sceneFiles.length) {
            console.log(`${path} 文件夹内不存在场景或 prefab 资源，无需处理`);
            return true;
        }

        console.log('开始转换资源 ......');
        await Promise.all(sceneFiles.map(async (file) => {
            const newDest = await transformFileToHMIFile(file);
            const fileMeta = file + '.meta';
            if (existsSync(fileMeta)) {
                const newMetaDest = newDest + '.meta';
                await transformMetaToHMIMeta(fileMeta, newMetaDest);
            }
            console.debug(`[HMI] transform ${file} to ${newDest}`);
            console.debug(`[HMI] transform meta ${fileMeta} to ${newDest + '.meta'}`);
        }));
        if (creatorProject) {
            console.log(`转换项目 ${path} 为 HMI 项目成功！`);
        } else {
            console.log(`转换文件夹 ${path} 内资源为 HMI 资源成功！`);
        }
        return true;
    },

    async dropNodesToAssets(info: DropCallbackInfo, additional: IDragAdditional[]): Promise<boolean> {
        // 判断当前编辑场景是否为 hmi-scene

        const currentSceneUuid = await Editor.Message.request('scene', 'query-current-scene');
        const currentSceneUrl = await Editor.Message.request('asset-db', 'query-url', currentSceneUuid);
        if (!currentSceneUrl || !currentSceneUrl.endsWith('.hmi-scene')) {
            return false;
        }
        //处理多选的情况
        const newAssetUuids: string[] = [];
        for (const node of additional) {
            if (node.type !== 'cc.Node') {
                continue;
            }

            const nodeUuid = node.value;
            const dump = await Editor.Message.request('scene', 'query-node', nodeUuid);
            if (!info.isDirectory) {
                // info.targetUrl 可能是文件地址需要取文件夹
                info.targetUrl = dirname(info.targetUrl);
            }
            const url = `${info.targetUrl}/${dump.name.value || 'Node'}.hmi-prefab`;
            const uuid = await Editor.Message.request('scene', 'create-prefab', nodeUuid, url);
            if (uuid) {
                newAssetUuids.push(uuid);
            }
        }

        if (newAssetUuids.length) {
            Editor.Selection.clear('asset');
            Editor.Selection.select('asset', newAssetUuids);
        }
        return true;
    },
};

// 插件在其他插件启动之前需要做好一些配置的修改工作
// 有部分需要等待编辑器启动后再修改的需要自行监听相关的广播消息
export async function load() {
    const setting = require('@editor/setting');
    if (setting.name !== 'CocosCreatorHMI') {
        return;
    }

    const enablePlatform = await Editor.Profile.getConfig('hmi-adapter', 'enablePlatform');
    // 动态修改 utils 里的 features 配置，将除安卓外的其他平台全部关闭
    const enabledPlatformExtension = ['native', 'android'];
    if (Array.isArray(enablePlatform)) {
        enabledPlatformExtension.push(...enabledPlatformExtension);
    }
    const allPlatforms = await Editor.Profile.getConfig('builder', 'allPlatforms', 'default');
    // HACK 之前支付宝有特殊处理
    allPlatforms.push('alipay-mini-game-v2');
    // 需要在构建插件启动之前修改这部分配置
    for (const platform of allPlatforms) {
        await Editor.Profile.setConfig('utils', 'features.' + platform, !!enabledPlatformExtension.includes(platform), 'global');
    }

    // TODO 自动从 .CocosCreator 全局配置下获取安卓 sdk/ndk 的配置填充，方便使用

    // 修改设备管理器内的配置，编辑器正常启动后修改
    await Editor.Profile.setConfig('device', 'deviceConfig', [{
        height: 1080,
        name: '1920*1080',
        width: 1920,
    }], 'default');
    await Editor.Profile.setConfig('device', 'enableDevice', {
        '1920*1080': true,
    }, 'default');

    // 动态修改构建的 i18n 字段
    const zhInfo: any = Editor.I18n.__protected__.exportLanguageData('zh');
    zhInfo.builder.options.name = '项目名称';
    Editor.I18n.__protected__.register('zh', 'builder', zhInfo.builder);
    const enInfo: any = Editor.I18n.__protected__.exportLanguageData('en');
    enInfo.builder.options.name = 'Project Name';
    Editor.I18n.__protected__.register('en', 'builder', enInfo.builder);

    // 修改编辑器名称
    Editor.Windows.__protected__.changeMainTitle(`Untitled - Cocos Creator 3D - V${Editor.App.version}`);

    // 启动后等待 10 分钟，再检查是否有 hmi 开关
    setTimeout(() => {
        checkHmi();
    }, (5 + Math.random() * 5) * 60 * 1000);
}

async function checkHmi() {
    try {
        const utilProfile = readJSONSync(join(Editor.App.home, 'profiles/v2/packages/utils.json'));
        if (!utilProfile.features['hmi-editor']) {
            await Editor.Dialog.error('发生未知错误（错误码：946），请联系管理员。', {
                buttons: ['确定'],
            });
            app.exit(0);
            return;
        }
    } catch (error) {
        console.error(error);
        await Editor.Dialog.error('发生未知错误（错误码：947），请联系管理员。', {
            buttons: ['确定'],
        });
        app.exit(0);
    }
}
