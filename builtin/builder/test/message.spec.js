'use strict';

const { expect } = require('chai');
const { existsSync, renameSync, removeSync, move, moveSync } = require('fs-extra');
const { join } = require('path');

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

    describe('query-platform-config', async () => { 
        const data = await Editor.Message.request('builder', 'query-platform-config');
        const keys = ['order', 'native', 'config'];
        it (`包含 ${keys.join(',')} 所有字段`, () => {
            expect(data).to.include.keys(keys);
        });

        it('检查 order 字段', () => {
            expect(data.order).to.be.an('array');
        });
        it('检查 native 字段', () => {
            expect(data.native).to.be.an('array');
        });
        it('检查 config 字段', () => {
            expect(data.config).to.be.an('object');
        });
    });

    // 平台构建模板已经归平台插件管理了
    describe('create-build-template', async () => {
        let sourcePath = '';
        const buildTemplatePath = join(Editor.Project.path, 'build-templates');

        before(() => {
            // 先转移 build-templates 下的所有文件，防止原文件的干扰
            if (existsSync(buildTemplatePath)) {
                sourcePath = join(Editor.Project.path, 'build-templates-temp');
                moveSync(buildTemplatePath, sourcePath);
            }
        });

        // 查询菜单里的模板信息
        // 使用 electron 里的 menu 查询接口查询

        const allMenu = await Editor.Menu.queryMain();
        const templateMenu = allMenu['i18n:menu.project'].submenu['i18n:builder.create_user_template'].submenu;
        // 特殊模板配置
        const specialTemplateConfig = {
            'application.ejs': 'common/application.ejs',
            'i18n:native.title': 'native',
        };
        for (const type of Object.keys(templateMenu)) {
            const message = templateMenu[type].message;
            try {
                it(`创建 ${templateMenu[type].label} 平台模板`, async () => {
                    await Editor.Message.request(message.target, message.name, ...(message.params || []));
                    const templatePath = join(Editor.Project.path, 'build-templates', type in specialTemplateConfig ? specialTemplateConfig[type] : message.params[1]);
                    expect(existsSync(templatePath)).to.be.true;
                });
            } catch (error) {
                console.error(error);
            }
        }

        after(() => {
            removeSync(buildTemplatePath);
            if (sourcePath) {
                moveSync(sourcePath, buildTemplatePath);
            }
        });
    });
});
