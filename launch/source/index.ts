'use strict';

import { app } from 'electron';
import { join } from 'path';

/**
 * 禁止在本脚本中导入其它自定义模块，
 * 因为这些模块很可能在打包后变成加密文件，在需要在编辑器初始化后才能成功加载。
 * 为确保统一，其它模块请统一放到 launch.js 中进行延迟加载。
 */

// 禁止自动禁用 3D
app.disableDomainBlockingFor3DAPIs();
// 忽略 chrome 的 gpu 黑名单
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('force_high_performance_gpu');
// disable render process reuse,Fix process.nextTick and editor ANR.
// @ts-ignore
app.allowRendererProcessReuse = false;

// hack for nativize window
// 加上后，会导致窗口上缩放比例不对
// app.commandLine.appendSwitch('force-device-scale-factor', '1');

// 启用 WebGL2 Compute
app.commandLine.appendSwitch('enable-webgl2-compute-context');
if (require('os').platform() === 'win32') {
    app.commandLine.appendSwitch('use-angle', 'OpenGL');
}

// 因为 can I use 会有警告，所以这里需要暂时隐藏警告
// @ts-ignore
process.env.BROWSERSLIST_IGNORE_OLD_DATA = true;

const _uncaughtExceptionFunc = (error: Error) => {
    global.Editor &&
        Editor.Metrics.trackException({
            // 未捕获错误
            code: -1,
            // 错误信息
            message: error.message,
        });
    if (process.send && process.connected) {
        process.send({
            channel: 'editor-error',
            message: error.message,
            stack: error.stack,
        });
    }
    console.error(error);
};
process.on('uncaughtException', _uncaughtExceptionFunc);

(async function() {
    // 初始化 Editor
    // 在这个过程中，会加载每个模块，并且监听一些初始化事件
    // Editor 这个全局对象应该避免在编辑器内部使用
    const creator = require('@editor/creator');
    await creator.init({
        env: {
            LAYOUT: join(__dirname, './../../static/layout-native.json'),
        },
    });

    const appModulePath = join(__dirname, 'node_modules');
    await creator.registerFindModulePath((args: any[]) => {
        switch (args[0]) {
            case '@electron/remote':
            case 'cc': {
                args[1].splice(0, 0, appModulePath);
            }
        }
        return args;
    });

    const { launch } = require('./launch');
    await launch();
})();
