import { Ui } from './ui.js';
import { bootstrap } from './index.js';

export async function main(ui: Ui, options: bootstrap.Options) {
    const cc = await System.import('cc');

    const debugMode = cc.DebugMode[ui.debugMode] ?? cc.DebugMode.INFO;

    // 引擎启动选项
    const option: { debugMode: boolean; overrideSettings: Record<string, any>;} = {
        debugMode,
        overrideSettings: {},
    };
    const launchScene = options.settings.launch.launchScene;

    Object.assign(option.overrideSettings, options.settings);

    option.overrideSettings.profiling = option.overrideSettings.profiling || {};
    option.overrideSettings.profiling.showFPS = ui.showFps;
    option.overrideSettings.screen = option.overrideSettings.screen || {};
    option.overrideSettings.screen.frameRate = ui.frameRate;
    option.overrideSettings.screen.exactFitScreen = ui.isFullscreen() ? true : false;
    option.overrideSettings.assets = option.overrideSettings.assets || {};
    option.overrideSettings.assets.importBase = 'assets/general/import';
    option.overrideSettings.assets.nativeBase = 'assets/general/native';
    option.overrideSettings.assets.remoteBundles = [];
    option.overrideSettings.assets.subpackages = [];
    option.overrideSettings.launch = option.overrideSettings.launch || {};
    option.overrideSettings.launch.launchScene = '';
    // 等待引擎启动
    await cc.game.init(option);

    await cc.game.run(async () => {
        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            ui.hideSplash();
            if (isCurrentSceneEmpty(cc)) {
                ui.hintEmptyScene();
            }
        });
        ui.showLoading();
        cc.game.pause();
        const json = await getCurrentScene(launchScene);
        // load scene
        cc.assetManager.loadWithJson(
            json,
            { assetId: launchScene },
            // 进度条
            (completedCount: number, totalCount: number) => {
                const progress = ((100 * completedCount) / totalCount) * 0.6; // 划分加载进度，场景加载 60%
                ui.reportLoadProgress(progress);
            },
            (error: null | Error, sceneAsset: any) => {
                if (error) {
                    ui.showError(error);
                    cc.error(error);
                    return;
                }
                const scene = sceneAsset.scene;
                scene._name = sceneAsset._name;
                cc.director.runSceneImmediate(scene, () => {
                    cc.game.resume();
                });
            },
        );
    });

    await new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
}

/**
 * Check if current scene is empty.
 */
function isCurrentSceneEmpty(cc: any) {
    const scene = cc.director.getScene();
    if (!scene || scene.children.length === 0) {
        return true;
    } else if (scene.children.length > 1) {
        return false;
    } else {
        const child0 = scene.children[0];
        if (
            child0.children.length > 0 ||
            child0._components.length > 1 ||
            (child0._components.length > 0 && !(child0._components[0] instanceof cc.Canvas))
        ) {
            return false;
        } else {
            return true;
        }
    }
}

/**
 * 读取当前场景 json 数据
 */
function getCurrentScene(launchScene?: string) {
    return new Promise<any>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.responseType = 'text';
        request.addEventListener('load', () => {
            if (request.status === 200) {
                resolve(JSON.parse(request.response));
            }
        });
        request.open('GET', `scene/${launchScene}.json`, true);
        request.send();
    });
}
