'use strict';

const { expect } = require('chai');
describe('构建通用消息测试', () => {

    describe('query-worker-ready', async () => {
        const readyState = await Editor.Message.request('builder', 'query-worker-ready');
        expect(readyState).to.be.true;
    });

    describe('query-tasks-info', async () => {
        const taskInfo = await Editor.Message.request('builder', 'query-tasks-info');
        expect(typeof taskInfo.free).to.equal('boolean');
        expect(typeof taskInfo.queue).to.equal('object');
    });

    describe('query-bundle-config', async () => {
        const bundleConfigs = await Editor.Message.request('builder', 'query-bundle-config');
        const keys = ['native', 'miniGame', 'web'];
        it ('bundleConfigs 包含所有的平台 key', () => {
            expect(bundleConfigs).to.include.keys(keys);
        });
        Object.keys(bundleConfigs).forEach((platform) => {
            expect(bundleConfigs[platform].platformConfigs).to.exist;
            expect(bundleConfigs[platform].platformTypeInfo).to.exist;
            expect(bundleConfigs[platform].maxOptionList).to.exist;
        });
    });

    // 平台构建模板已经归平台插件管理了
    // describe('create-build-template', () => {
    //     let sourcePath = '';
    //     let buildTemplatePath = join(Editor.Project.path, 'build-templates');

    //     before(() => {
    //         // 先转移 build-templates 下的所有文件，防止原文件的干扰
    //         if (existsSync(buildTemplatePath)) {
    //             sourcePath = join(Editor.Project.path, 'build-templates-temp');
    //             renameSync(buildTemplatePath, sourcePath);
    //         }
    //     });

    //     it('添加 web-mobile 平台模板', async () => {
    //         await Editor.Message.request('builder', 'create-build-template', 'web-mobile');
    //         expect(existsSync(join(Editor.Project.path, 'build-templates', 'web-mobile', 'index.ejs')));
    //     });

    //     it('添加 web-desktop 平台模板', async () => {
    //         await Editor.Message.request('builder', 'create-build-template', 'web-desktop');
    //         expect(existsSync(join(Editor.Project.path, 'build-templates', 'web-desktop', 'index.ejs')));
    //     });

    //     it('添加 wechatgame 平台模板', async () => {
    //         await Editor.Message.request('builder', 'create-build-template', 'wechatgame');
    //         expect(existsSync(join(Editor.Project.path, 'build-templates', 'wechatgame', 'game.ejs')));
    //     });

    //     after(() => {
    //         removeSync(buildTemplatePath);
    //         if (sourcePath) {
    //             renameSync(sourcePath, buildTemplatePath);
    //         }
    //     });
    // });
});
