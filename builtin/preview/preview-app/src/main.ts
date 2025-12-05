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
    let launchScene = options.settings.launch.launchScene;

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
    cc.assetManager.onAssetMissing(async (parentAsset: any, owner: any, propName: string, uuid: string) => {
        let assetPathOrUuid = uuid;
        let errorInfo = `The asset ${uuid} used by ${parentAsset.name}{${cc.js.getClassName(parentAsset)}(${parentAsset.uuid})} is missing! \n`;
        try {
            const info = await getData(`/missing-asset/${uuid}`);
            if (info) {
                errorInfo = `The asset ${info.path} used by ${parentAsset.name}{${cc.js.getClassName(parentAsset)}(${parentAsset.uuid})} is missing! \n`;
            }
            assetPathOrUuid = info.path;
            info && (errorInfo += `asset ${info.path}(${uuid}) has been deleted at ${new Date(info.removeTime).toLocaleString()}. \n`);
        } catch (error) {
            console.debug(`query missing asset ${uuid} failed`);
        }
        if (owner && owner.node instanceof cc.Node) {
            errorInfo += `Node path: ${owner.node.getPathInHierarchy()}\n`;
        }
        propName && (errorInfo += `PropName: ${propName}`);
        console.error(errorInfo);
    });

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
        try {
            launchScene = json[1]._id;
        } catch (error) {
            console.debug(error);
        }
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
    return getData(`scene/${launchScene}.json`);
}

/**
 * 根据 url 获取数据
 * @param url 
 * @returns 
 */
function getData(url: string) {
    return new Promise<any>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.responseType = 'text';
        request.addEventListener('load', () => {
            if (request.status === 200) {
                resolve(JSON.parse(request.response));
            }
        });
        request.open('GET', url, true);
        request.send();
    });
}