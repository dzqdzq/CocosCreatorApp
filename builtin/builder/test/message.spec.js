'use strict';

const { expect } = require('chai');
describe('构建通用消息测试', () => {
    describe('generate-preview-setting', async () => {
        const data = await Editor.Message.request('builder', 'generate-preview-setting', {
            debug: true,
            startScene: 'current_scene',
        });
        const settingsRes = {
            debug: true,
            launchScene: 'current_scene',
            renderPipeline: '5d45ba66-829a-46d3-948e-2ed3fa7ee421',
            hasResourcesBundle: true,
            hasStartSceneBundle: false,
        };
        it('生成 settings', () => {
            expect(data.settings).to.be.not.undefined;
            expect(data.settings.jsList.includes('assets/test-js-list/plugin-not-web.js')).to.be.false;
            let res = true;
            Object.keys(settingsRes).forEach((key) => {
                if (settingsRes[key] !== data.settings[key]) {
                    res = false;
                }
            });
            expect(res).to.be.true;
        });
        it('生成 script2library', () => {
            expect(data.script2library).to.be.not.undefined;
        });
        it('生成 bundleConfigs 并且包含动画', () => {
            expect(data.bundleConfigs).to.be.not.undefined;
            const paths = data.bundleConfigs.find((item) => item.name === 'resources').paths;
            expect(paths['38cc5e6b-be65-427c-b97d-815603cc500b']).to.be.exist;
            expect(paths['38cc5e6b-be65-427c-b97d-815603cc500b'][1] === 'cc.AnimationClip').to.be.exist;
            expect(paths['0df76192-2937-40f3-a46a-8c0ab79295f5'][0] === 'font').to.be.exist;
        });
    });

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
        const bundleConfig = await Editor.Message.request('builder', 'query-bundle-config');
        Object.keys(bundleConfig).forEach((platform) => {
            expect(bundleConfig[platform].platformName).to.exist;
            expect(bundleConfig[platform].supportedCompressionTypes).to.exist;
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
