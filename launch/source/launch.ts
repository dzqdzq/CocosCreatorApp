'use strict';

const __StartTime__ = Date.now();

const { readJSONSync } = require('fs-extra');
const { join } = require('path');
const { app, crashReporter } = require('electron');

export async function launch(): Promise<void> {
    const setting = require('@editor/setting');
    // 在 logger 启动前打印相应的启动数据
    console.debug('Arguments:');
    Object.keys(setting.args).forEach((key) => {
        console.debug(`  ${key}: ${setting.args[key]}`);
    });
    console.debug(' ');

    /**
     * 监听dashboard商城发送的安装消息
     */
    const { editorProcessManager, ProcessMainManager } = require('@editor/process-message');
    // 监听dashboard商城的安装消息
    const creatorProcessManager = new ProcessMainManager(process);
    editorProcessManager('DASHBOARD_STORE_EXTENSION_INSTALL', creatorProcessManager);

    if (setting.PATH.PROJECT) {
        const tmpDir = join(setting.PATH.PROJECT, 'temp/crash');
        // 设置crash文件保存路径
        app.setPath('crashDumps', tmpDir);
        // 启用crashReporter  可用process.crash()手动测试crash
        crashReporter.start({
            uploadToServer: false,
        });
    }

    // 如果没有输入项目地址，则启动 dashboard
    if (!setting.PATH.PROJECT) {
        if (!app.requestSingleInstanceLock()) {
            // 关闭第二次打开的程序
            // 注意，mac 上如果存在多个 creator，同时监听同一个协议，会导致交叉响应的情况
            // 例如点击协议 cocos-dashboard://download/2d_.2.0
            // 但是响应到了其他程序，当前程序触发了锁定，所以后续的 second-instance 会拿到一个没有参数的事件
            app.quit();
            process.exit(0);
        }

        const startup = require('./../../dashboard/startup');

        // 等待 app 启动
        await startup.app();
        // 检测是否有新的 dashboard
        await startup.validation(setting.dev);
        return;
    } else {
        try {
            // 安装项目依赖插件
            const util = require('./../../dashboard/script/util');
            await util.installProjectDepend(setting.PATH.PROJECT);
        } catch (e) {
            console.error(e);
        }
    }

    //todo:放到命令行判断之前，避免命令行模式会不引用
    const { inject } = require('./inject');
    await inject();

    // 如果发现 build 命令，视为想要不打开编辑器的情况下，发布项目
    if (setting.args.build) {
        // 等待 manager 初始化
        await Editor.Startup.__protected__.manager(true, !!setting.args.metric);
        const preExtensionList = await scanPrePackage();
        const extensionList = await scanPackage();
        // 打开各个插件, 这是个异步流程
        // 在启动插件过程中会实时与窗口进行交互，等待加载完成
        await Editor.Startup.__protected__.startPackage({
            preList: preExtensionList,
            list: extensionList,
        });
        // 插件加载完成之后，开始构建流程
        const params: string[] = setting.args.build.split(';');
        const options: Record<string, any> = {};
        params.forEach((str) => {
            if (!str) {
                return;
            }
            const arr = str.split('=');
            options[arr[0].trim()] = arr[1];
        });
        const code = await Editor.Startup.__protected__.build(options, setting.args.dev);
        app.exit(code);
        process.exit(code);
    }

    const useNative = await useNativeScene(setting);
    let first = false;
    await Promise.all([
        // 等待 manager 初始化
        Editor.Startup.__protected__.manager(!!setting.args.test || !!setting.args.nologin, !!setting.args.metric),

        // 启动窗口
        Editor.Startup.__protected__.window({
            async beforeOpen(options, userData) {
                // 初始化主窗口的 title
                options.title = `Untitled - ${Editor.Project.name} - ${setting.title} ${Editor.App.version}`;

                const scenePreview = checkLayout(userData.layout);
                if (!first) {
                    first = true;
                    if (useNative) {
                        if (process.platform === 'win32') {
                            options.transparent = true;
                            options.resizable = true;
                            options.frame = false;
                        }
                        if (!scenePreview) {
                            userData.layout = readJSONSync(join(__dirname, './../../static/layout-native.json'));
                        }
                    } else {
                        if (scenePreview) {
                            userData.layout = readJSONSync(join(__dirname, './../../static/layout-web.json'));
                        }
                    }
                }
            },
            async afterOpen(windows) {
                Editor.Metrics.trackTimeEnd('main-window:start-up', { value: Date.now() - __StartTime__ });
            },
        }),
    ]);

    // 打开各个插件, 这是个异步流程
    // 在启动插件过程中会实时与窗口进行交互，等待加载完成
    const preExtensionList = await scanPrePackage();
    const extensionList = await scanPackage();
    await Editor.Startup.__protected__.startPackage({
        preList: preExtensionList,
        list: extensionList,
    });

    await runTest(setting);
}

let nativeSceneOriConfig = false;
async function useNativeScene(setting: any): Promise<boolean> {
    if (setting.args.testScene !== undefined) {
        nativeSceneOriConfig = await Editor.Profile.getConfig('scene', 'scene.native-engine', 'global');
        const useNative = setting.args.testScene === 'native';
        await Editor.Profile.setConfig('scene', 'scene.native-engine', useNative, 'global');
        return true;
    }
    const isNative = await Editor.Profile.getConfig('scene', 'scene.native-engine', 'global');
    if (isNative === undefined) {
        return false;
    }
    return isNative;
}

async function runTest(setting: any): Promise<void> {
    // --testScene=native测试原生场景，web测试web场景；
    if (setting.args.testScene !== undefined) {
        Editor.Dialog.__protected__.setMode('command');
        const options = {
            useNative: setting.args.testScene === 'native',
        };
        const result = await Editor.Startup.__protected__.test(options, setting.args.dev);
        // 恢复原生场景配置
        await Editor.Profile.setConfig('scene', 'scene.native-engine', !!nativeSceneOriConfig, 'global');
        console.log('测试结果', result);

        // 开发模式不主动关闭
        if (setting.args.dev) return;

        // 根据返回码判断是否测试成功;
        if (result === 'success') {
            app.exit(1);
        } else {
            app.exit(-1);
        }
        return;
    }

    function resolveParam(params: string[]) {
        const options: Record<string, any> = {};
        params.forEach((str) => {
            if (!str) {
                return;
            }
            const arr = str.split('=');
            options[arr[0].trim()] = ['true', 'false'].includes(arr[1]) ? JSON.parse(arr[1]) : arr[1];
        });
        return options;
    }
    // 如果传入 test 参数，则在编辑器启动后自动进行自动化任务
    if (setting.args.test) {
        // 设置 dialog 的命令行模式，默认返回默认值不阻断测试
        Editor.Dialog.__protected__.setMode('command');
        const options = typeof setting.args.test === 'string' ? resolveParam(setting.args.test.split(';')) : {};
        if (process.env.EDITOR_AUTO_TEST) {
            const autoTestConfig = JSON.parse(process.env.EDITOR_AUTO_TEST);
            Object.assign(options, autoTestConfig);
        }
        const code = await Editor.Startup.__protected__.test(options, setting.args.dev); // 运行tester插件里的auto-test;
        app.exit(code);
    }
}

function checkLayout(data: Editor.Layout.ILayout): boolean {
    let scenePreview = false;
    if (!data) {
        // TODO 设备第一次打开 creator 时此处无法获取到 layout，应该可以通过调整启动流程避免，但是目前这块的启动逻辑太乱，需要调整后才能支持
        return scenePreview;
    }
    function step(layout: Editor.Layout.ILayoutItem) {
        if (layout.panels && layout.panels.includes('scene.preview')) {
            scenePreview = true;
            return true;
        }
        if (layout.children) {
            layout.children.some(step);
        }
    }
    step(data.layout);
    return scenePreview;
}

async function scanPrePackage(): Promise<string[]> {
    const paths: string[] = [];
    [
        './builtin/metrics',
        './builtin/menu',
        './builtin/profile',
        './builtin/project',
        './builtin/messages',
        './builtin/utils',
        './builtin/program',
        './builtin/tester',
        './builtin/information',
        './builtin/preferences',
        './builtin/engine',
        './builtin/programming',
        './builtin/window',

        // 重复两次
        './modules/editor-extensions/extensions/device',
        './modules/editor-extensions/extensions/ui-kit',
    ].forEach((name) => {
        paths.push(join(Editor.App.path, name));
    });
    return paths;
}

async function scanPackage(): Promise<string[]> {
    const directoryList: Record<string, string> = {
        // 编辑器扩展
        editor: join(Editor.App.path, './modules/editor-extensions/extensions'),
        // 引擎扩展
        engine: join(Editor.App.path, './modules/engine-extensions/extensions'),
        // 平台扩展
        platform: join(Editor.App.path, './modules/platform-extensions/extensions'),
        // 内置的其他项目组提供的插件
        builtinOthers: join(Editor.App.path, './extension'),
        // 全局插件，即将废弃
        // global: join(Editor.App.home, './extensions'),
        // 全局放的内置更新插件
        globalBuiltin: join(Editor.App.home, `./builtin-extensions/${Editor.App.version}`),
        // 项目插件
        project: join(Editor.Project.path, 'extensions'),
    };
    const paths = [];
    [
        './builtin/asset-db',
        './builtin/scene',
        './builtin/server',
        './builtin/preview',
        './builtin/animator',
        './builtin/builder',
        './builtin/shortcuts',
        './builtin/animation-graph',
    ].forEach((name) => {
        paths.push(join(Editor.App.path, name));
    });

    for (const key in directoryList) {
        const path = directoryList[key];
        const list = await Editor.Package.__protected__.scan(path);
        paths.push(...list);
    }

    // 最后启动 placeholder，会检查插件启动状态，然后添加占位 menu
    paths.push(join(Editor.App.path, './builtin/placeholder'));

    return paths;
}
