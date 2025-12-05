'use strict';

const { expect } = require('chai');
const { join } = require('path');
const { existsSync, removeSync } = require('fs-extra');

describe('预览消息通知测试', () => {
    describe('query-preview-url', async () => {
        const url = await Editor.Message.request('preview', 'query-preview-url');
        expect(url).to.be.a('string');
    });

    describe('get-preview-ip', async () => {
        const ip = await Editor.Message.request('preview', 'get-preview-ip');
        expect(ip).to.be.a('string');
    });

    describe('generate-settings in web', async () => {
        const data = await Editor.Message.request('preview', 'generate-settings', {
            type: 'browser',
            platform: 'web-desktop',
        });
        const dataKeys = [
            'settings',
            'script2library',
            'bundleConfigs',
        ];
        expect(data.settings).to.be.exist;
        expect(data).to.include.keys(dataKeys);
        if (Editor.Project.name === 'build-example') {
            it('生成 指定的 jsList (build-example 仓库)', () => {
                expect(data.settings.plugins.jsList.includes('assets/test-js-list/plugin-not-web.js')).to.be.false;
            });
        }
        if (Editor.Project.name === 'test-cases') {
            it('生成 指定的 jsList (case 3d 仓库)', () => {
                expect(data.settings.plugins.jsList.includes('assets/test-plugin.js')).to.be.true;
            });
        }
    });

    describe('generate-settings in windows', async () => {
        const data = await Editor.Message.request('preview', 'generate-settings', {
            type: 'simulator',
            platform: 'windows',
        });
        const dataKeys = [
            'settings',
            'script2library',
            'bundleConfigs',
        ];
        expect(data.settings).to.be.exist;
        expect(data).to.include.keys(dataKeys);
        if (Editor.Project.name === 'build-example') {
            it('生成 指定的 jsList (build-example 仓库)', () => {
                expect(data.settings.plugins.jsList.includes('assets/test-js-list/plugin-not-native.js')).to.be.false;
            });
        }
        if (Editor.Project.name === 'test-cases') {
            it('生成 指定的 jsList (case 3d 仓库)', () => {
                expect(data.settings.plugins.jsList.includes('assets/test-plugin.js')).to.be.true;
            });
        }
    });

    describe('query-preview-url', async () => {
        const url = await Editor.Message.request('preview', 'query-preview-url');
        expect(url).to.be.exist;
    });

    describe('get-preview-ip', async () => {
        const ip = await Editor.Message.request('preview', 'get-preview-ip');
        expect(ip).to.be.exist;
    });

    describe('create-template', async () => {
        const dest = join(Editor.Project.path, 'preview-template', 'index.ejs');
        if (existsSync(dest)) {
            removeSync(dest);
        }
        const res = await Editor.Message.request('preview', 'create-template');
        expect(res).to.be.true;
        expect(existsSync(dest)).to.be.true;
    });

    describe('open-terminal:打开终端预览', () => {
        before(() => {
            Editor.Message.send('preview', 'change-platform', 'browser');
            Editor.Message.send('preview', 'open-terminal');
        });
        it('open-terminal:打开终端预览,连接设备数至少为 1', async () => {
            const num = await Editor.Message.request('preview', 'query-connect-num');
            expect(num).to.be.at.least(1);
        });
    });

});
