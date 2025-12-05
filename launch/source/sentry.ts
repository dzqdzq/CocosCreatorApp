import { join } from 'path';
import { readJSONSync } from 'fs-extra';
import type { InitInfo } from '@editor/sentry';
import { sentry } from '@editor/sentry';
import { app } from 'electron';

interface SentryConfig { enable: boolean; skipTags: string[] }
let isKipSentry = false;
/**
 * 初始化 sentry
 * @param config 
 * @returns 
 */
export async function initSentry() {
    // TODO 由于 @editor/settings 加密了，依赖了 creator-base 的 require 定制处理，无法在 creator 模块 init 之前使用, dev 和 home 都自行计算
    isKipSentry = process.argv.find(arg => arg === '--skipSentry') !== undefined;
    if (isKipSentry) {
        return;
    }
    const dev = process.argv.find(arg => arg === '--dev') !== undefined;
    const remoteConfig = await queryRemoteConfig(join(app.getPath('home'), `.${app.getName()}` + (dev ? '_Develop' : '')));
    if (remoteConfig && remoteConfig.enable === false) {
        return;
    }
    const packageJSON = require(join(__dirname, '../../package.json'));
    const initInfo: InitInfo = {
        dsn: packageJSON.dsn || 'https://d1228c9c9d49468a9f6795d0f8f66df3@sentry.cocos.org/11',
        debug: false, // fixme: 开启会导致启动非常卡
        appPath: join(__dirname, '../../'),
        skipTags: ['[PreviewInEditor]', '[Scene]', '[Programming]', '[Assets]'],
        version: packageJSON.version,
    };

    if (app.isPackaged) {
        try {
            const releaseInfo = readJSONSync(join(__dirname, '../../.HEAD'));
            initInfo.releaseInfo = {
                hash: {
                    'editor-hash': releaseInfo.editor,
                    'engine-hash': releaseInfo.engine,
                },
                time: releaseInfo.time,
            };
        } catch (error) {
            console.debug(error);
        }
    }

    sentry.init(initInfo);
}

export async function initUserInfo() {
    if (isKipSentry) {
        return;
    }
    sentry.setUserInfo(await Editor.User.getData());

    // 监听用户信息变化
    Editor.User.on('login', async () => {
        sentry.setUserInfo(await Editor.User.getData());
    });
    Editor.User.on('logout', () => {
        sentry.setUserInfo();
    });
}

function queryRemoteConfig(home: string): SentryConfig | undefined {
    try {
        const utilsProfile = readJSONSync(join(home, 'profiles/v2/packages/utils.json'));
        return utilsProfile && utilsProfile.features && utilsProfile.features.logger;
    } catch (error) { }
}
