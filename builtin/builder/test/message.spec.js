'use strict';

const { expect } = require('chai');
const { existsSync } = require('fs-extra');
const { join } = require('path');
const { renameSync } = require('fs');
const { removeSync } = require('fs-extra');
describe('构建消息测试', () => {
    describe('migrate-options', async () => {
        const testOptions = {
            buildPath: 'build',
            __version__: '1.2.6',
        }
        const res = await Editor.Message.request('builder', 'migrate-options', testOptions);
        it('buildPath=build 数据迁移', () => {
            expect(res.buildPath = 'project://build');
        });
    });
    describe('generate-preview-setting', async () => {
        const data = await Editor.Message.request('builder', 'generate-preview-setting', {
            debug: true,
            startScene: 'current_scene',
        });
        it('正确生成 settings', () => {
            expect(data.settings).to.be.not.undefined;
        });
        it('正确生成 script2library', () => {
            expect(data.script2library).to.be.not.undefined;
        });
    });

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

    // describe('command-build 测试', () => {
    //     const destDir = join(Editor.Project.path, 'buildTest');
    //     let sourcePath;
    //     before(() => {
    //         // 先转移原有 build 下的所有文件，防止原文件的干扰
    //         if (existsSync(destDir)) {
    //             sourcePath = join(Editor.Project.path, 'buildTest-temp');
    //             renameSync(destDir, sourcePath);
    //         }
    //     });

    //     const platforms = ['wechatgame', 'web-desktop', 'web-mobile'];
    //     for (const platform of platforms) {
    //         const options = {platform, outputName: `test-${platform}`, buildPath: './buildTest'};
    //         const dest = join(destDir, options.outputName);
    //         describe(`${platform}命令行构建`, () => {

    //             it(`${platform}构建过程正常无报错`, async function() {
    //                 this.timeout && this.timeout(60000);
    //                 let error;
    //                 try {
    //                     const result = await Editor.Message.request('builder', 'command-build', options);
    //                     if (result) {
    //                         error = result;
    //                     }
    //                 } catch (error) {
    //                     error = error;
    //                 }
    //                 expect(error).to.be.undefined;
    //                 expect(existsSync(dest)).to.be.true;
    //             });

    //             // TODO 暂时无法统计构建运行错误
    //             // it(`${platform}正常运行`, async () => {
    //             //     const result = await Editor.Message.request('builder', 'build:run');
    //             //     expect(result).to.be.ok;
    //             // });

    //             it('正确移除任务', async () => {
    //                 const result = await Editor.Message.request('builder', 'remove-task', `test-${platform}`, true);
    //                 expect(result).to.be.true;
    //                 expect(existsSync(dest)).to.be.not.ok;
    //             });
    //         });
    //     }

    //     after(() => {
    //         // 删除测试产生的临时数据
    //         removeSync(destDir);
    //         if (sourcePath) {
    //             renameSync(sourcePath, destDir);
    //         }
    //     });
    // });

});
