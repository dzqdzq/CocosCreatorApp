const { expect } = require('chai');
const { join } = require('path');
const { analyzeLogFile } = require('./utils');
const { readJsonSync, remove } = require('fs-extra');
const logDestDir = join(Editor.Project.tmpDir, 'builder', 'test-log');

describe('测试独立 bundle 构建', async () => {
    const bundleBuildOptions = {
        'stage': 'bundle',
        'dest': 'project://build/build-bundle',
        id: 'test-build-bundle',
        'bundleConfigs': [
            {
                'root': 'db://assets/altas-bundle',
                'output': true,
            },
        ],
        'taskName': 'build bundle db://assets/altas-bundle',
        optionList: [readJsonSync(join(Editor.Project.path, 'build-configs', 'buildConfig_web-mobile.json'))],
    };
    bundleBuildOptions.logDest = join(logDestDir, 'bundle-build.log');
    const info = {
        exitCode: 0,
        logDest: bundleBuildOptions.logDest,
    };

    before(async () => {
        await remove(bundleBuildOptions.logDest);
    });
    console.log('开始测试独立构建 bundle ');

    try {
        info.exitCode = await Editor.Message.request('builder', 'add-bundle-task', bundleBuildOptions, true);
    } catch (error) { 
        console.error(error);
    }
    console.log(`独立构建 bundle ${info.exitCode === 36 ? '成功' : '失败'}`);
    it('独立 bundle 构建正常完成', () => {
        expect(info.exitCode).equal(36);
    });
    info.logInfo = await analyzeLogFile(bundleBuildOptions.logDest);
    it('独立构建 bundle', () => {
        expect(info.logInfo.error.length).equal(0);
    });
});