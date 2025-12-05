import { Ui } from './ui.js';
import { bootstrap } from './index.js';

function addClass(element: { className: string; }, name: string) {
    const hasClass = (' ' + element.className + ' ').indexOf(' ' + name + ' ') > -1;
    if (!hasClass) {
        if (element.className) {
            element.className += ' ';
        }
        element.className += name;
    }
}

function findCanvas() {
    const frame = document.querySelector('#GameDiv');
    const container = document.querySelector('#Cocos3dGameContainer');
    const canvas = document.querySelector('#GameCanvas');
    canvas!.setAttribute('tabindex', '99');

    return { frame, container, canvas };
}

export async function main(ui: Ui, options: bootstrap.Options) {
    const cc = await System.import('cc');

    // 抗锯齿
    cc.macro.ENABLE_WEBGL_ANTIALIAS = true;

    // 用户宏配置优先级最高
    if (options.settings.macros) {
        for (const key in options.settings.macros) {
            cc.macro[key] = options.settings.macros[key];
        }
    }

    // @ts-ignore
    window.CC_WECHATGAME = false;

    // 配置资源路径
    const assetOptions = {
        importBase: 'assets/general/import',
        nativeBase: 'assets/general/native',
    };

    const adapter = findCanvas();
    if (!adapter) {
        throw new Error(cc.getError(200));
    }

    const debugMode = cc.DebugMode[ui.debugMode] ?? cc.DebugMode.INFO;

    // 引擎启动选项
    const option = {
        id: ui.gameCanvas,
        showFPS: ui.showFps,
        debugMode,
        frameRate: ui.frameRate,
        groupList: options.settings.groupList,
        collisionMatrix: options.settings.collisionMatrix,
        adapter,
        renderPipeline: options.settings.renderPipeline,
        assetOptions,
        customJointTextureLayouts: options.settings.customJointTextureLayouts || [],
        physics: options.settings.physics,
        exactFitScreen: false,
    };

    // need to exact fit screen on web mobile preview
    if (ui.isFullscreen()) {
        option.exactFitScreen = true;
    }

    const jsList: string[] = (options.settings.jsList || []).map((x: any) => '/plugins/' + x);
    for (const url of jsList) {
        await new Promise<void>((resolve, reject) => {
            let err: any;
            function windowErrorListener(evt: any) {
                if (evt.filename === url) {
                    err = evt.error;
                }
            }

            window.addEventListener('error', windowErrorListener);

            const script = document.createElement('script');
            script.charset = 'utf-8';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.addEventListener('error', function() {
                window.removeEventListener('error', windowErrorListener);
                const error = Error('Error loading ' + url);
                ui.showError(error.message);
                error.stack && ui.showError(error.stack);
                console.error(error);
                reject(error);
            });
            script.addEventListener('load', function() {
                window.removeEventListener('error', windowErrorListener);
                document.head.removeChild(script);
                // Note that if an error occurs that isn't caught by this if statement,
                // that getRegister will return null and a "did not instantiate" error will be thrown.
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
            script.src = url.replace('#', '%23');
            document.head.appendChild(script);
        });
    }

    // 等待引擎启动
    await cc.game.init(option);

    try {
        if (options.settings.customLayers) {
            options.settings.customLayers.forEach((layer) => {
                cc.Layers.addLayer(layer.name, layer.bit);
            });
        }
    } catch (error) {
        console.warn(error);
    }

    await import('./init-loader.js');
    await import('cce:/internal/x/prerequisite-imports');

    const { RESOURCES, MAIN } = cc.AssetManager.BuiltinBundleName;
    const bundleRoot = options.settings.hasResourcesBundle ? [RESOURCES, MAIN] : [MAIN];

    for (const bundle of bundleRoot) {
        await new Promise<void>((resolve, reject) => {
            cc.assetManager.loadBundle(bundle, (error: Error) => {
                if (error) {
                    ui.showError(error.message);
                    error.stack && ui.showError(error.stack);
                    console.error(error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    const json = await getCurrentScene(options.settings.launchScene);

    await cc.game.run(() => {
        cc.game.canvas.setAttribute('tabindex', -1);
        cc.game.canvas.style.backgroundColor = '';
        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            ui.hideSplash();
            if (isCurrentSceneEmpty(cc)) {
                ui.hintEmptyScene();
            }
        });

        cc.view.resizeWithBrowserSize(true);
        const { width, height, policy } = options.settings.designResolution;
        // 引擎如果接受到字符串会出问题
        cc.view.setDesignResolutionSize(Number(width), Number(height), policy || cc.ResolutionPolicy.FIXED_HEIGHT);
        cc.game.pause();

        // load scene
        cc.assetManager.loadWithJson(json, { assetId: options.settings.launchScene },
            // 进度条
            (completedCount: number, totalCount: number) => {
                const progress = 100 * completedCount / totalCount * 0.6; // 划分加载进度，场景加载 60%
                ui.reportLoadProgress(progress);
            },
            (error: null | Error, sceneAsset: any) => {
                if (error) {
                    ui.showError(error.message);
                    error.stack && ui.showError(error.stack);
                    cc.error(error.stack);
                    return;
                }
                const scene = sceneAsset.scene;
                scene._name = sceneAsset._name;
                cc.director.runSceneImmediate(scene, () => {
                    cc.game.resume();
                });
            }
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
        if (child0.children.length > 0 ||
            child0._components.length > 1 ||
            (child0._components.length > 0 && !(child0._components[0] instanceof cc.Canvas))) {
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
