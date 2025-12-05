const { expect } = require('chai');
const { checkBuildOptions } = require('./../dist/config/platforms-options.js');
const { join, relative } = require('path');

describe('构建数据验证测试', () => {
    let sceneTempUrl;
    before(async () => {
        // 要先确保项目内至少有一个场景才方便做测试
        const assets = await Editor.Message.request('asset-db', 'query-assets', {
            type: 'scene',
        });
        if (!assets || assets.length === 0) {
            const fileUrl = `db://internal/default_file_content/scene`;
            const filePath = await Editor.Message.request('asset-db', 'query-path', fileUrl);
            sceneTempUrl = 'db://assets/newScene.scene';
            await Editor.Message.request('asset-db', 'import-asset', filePath, sceneTempUrl, {
                overwrite: true,
            });
        }
    });

    describe('name 名称验证测试', () => {

        it('名称不能为空', async () => {
            const result = await checkBuildOptions('name', '');
            expect(result.error).to.not.equal('');
        });

        it('名称不能带有中文', async () => {
            const result = await checkBuildOptions('name', '测试名字');
            expect(result.error).not.to.equal('');
        });
    });

    describe('outputName 名称验证测试', () => {

        it('名称不能为空', async () => {
            const result = await checkBuildOptions('outputName', '');
            expect(result.error).to.not.equal('');
        });

        it('名称不能带有中文', async () => {
            const result = await checkBuildOptions('outputName', '测试名字');
            expect(result.error).not.to.equal('');
        });
    });

    describe('platform 验证测试', () => {
        it('不支持的构建平台 newPlatform', async () => {
            const result = await checkBuildOptions('platform', 'newPlatform');
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.be.null;
        });
    });

    describe('startScene 验证测试', () => {
        it('startScene 52fbcf09 不存在', async () => {
            const result = await checkBuildOptions('startScene', '52fbcf09');
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.be.null;
        });
    });

    describe('scenes 验证测试', () => {
        it('场景数据不能为空', async () => {
            const result = await checkBuildOptions('scenes', []);
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.be.null;
        });

        it('场景数据混入不存在的资源要被剔除，剔除后的场景数据为空要报错', async () => {
            const result = await checkBuildOptions('scenes', [{uuid: 'ahisbfbj', url: 'ad://asset/njjdks.scene'}]);
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.be.null;
        });

        it('场景数据混入不存在的资源要被剔除', async () => {
            const assets = await Editor.Message.request('asset-db', 'query-assets', {
                type: 'scene',
            });
            const scenes = assets.map((item) => {
                return {
                    url: item.url,
                    uuid: item.uuid,
                };
            });
            scenes.push({
                uuid: 'jkjdishdj',
                url: 'db://assets/jjidji.scene',
            });
            const result = await checkBuildOptions('scenes', scenes);
            expect(result.error).to.not.equal('');
            expect(result.newValue.length).to.be.equal(scenes.length - 1);
        });
    });

    describe('buildPath 路径验证测试', () => {
        const options = {platform: 'wechatgame'};
        it('路径不能包含空格', async () => {
            const result = await checkBuildOptions('buildPath', '/build test', options);
            expect(result.error).to.not.equal('');
        });

        it('路径不能带有中文', async () => {
            const result = await checkBuildOptions('buildPath', '/测试路径', options);
            expect(result.error).not.to.equal('');
        });

        it('路径检查后需要改为相对于项目的路径', async () => {
            const test = join(Editor.Project.path, './build');
            const result = await checkBuildOptions('buildPath', test, options);
            expect(result.error).to.equal('');
            expect(result.newValue).to.equal(relative(Editor.Project.path, test));
        });
    });
    after(() => {
        // 删除测试产生的临时场景数据
        if (sceneTempUrl) {
            Editor.Message.send('asset-db', 'delete-asset', sceneTempUrl);
        }
    });
});
