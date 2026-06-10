'use strict';

const { join } = require('path');

/**
 * 获取 .app 包内 Resources/app 路径，避免软链接被 Node 解析为真实路径。
 */
function getBundleAppPath() {
    try {
        if (process.type === 'renderer') {
            return require('@electron/remote').app.getAppPath();
        }
        const { app } = require('electron');
        if (app && typeof app.getAppPath === 'function') {
            return app.getAppPath();
        }
    } catch (_) {
        // electron 在当前进程不可用
    }
    if (process.resourcesPath) {
        return join(process.resourcesPath, 'app');
    }
    return null;
}

/**
 * 将 Editor.App.path 指向 bundle 内的 app 目录（保留软链接路径）。
 */
function patchAppPathToBundleRoot(tag) {
    const bundleAppPath = getBundleAppPath();
    if (!bundleAppPath) {
        return;
    }
    const { App } = require('@editor/creator/dist/app');
    Object.defineProperty(App, 'path', {
        get() {
            return bundleAppPath;
        },
        configurable: true,
    });
    console.debug(`[${tag}] Editor.App.path -> ${bundleAppPath}`);
}

exports.getBundleAppPath = getBundleAppPath;
exports.patchAppPathToBundleRoot = patchAppPathToBundleRoot;
