const { expect } = require('chai');
const { checkBuildCommonOptionsByKey } = require('./../dist/share/common-options-validator');

describe('构建通用配置验证测试', () => {

    describe('name 名称验证测试', () => {
        it('名称不能为空', async () => {
            const result = await checkBuildCommonOptionsByKey('name', '');
            expect(result.error).to.not.equal('');
        });
    });

    describe('outputName 名称验证测试', () => {
        it('名称不能为空', async () => {
            const result = await checkBuildCommonOptionsByKey('outputName', '');
            expect(result.error).to.not.equal('');
        });
    });

    describe('platform 验证测试', () => {
        it('不支持的构建平台 newPlatform', async () => {
            const result = await checkBuildCommonOptionsByKey('platform', 'newPlatform');
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.be.null;
        });
    });

    describe('startScene 验证测试', () => {
        it('startScene 52fbcf09 不存在', async () => {
            const result = await checkBuildCommonOptionsByKey('startScene', '52fbcf09');
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.not.equal('52fbcf09');
        });
        it('Bundle 内的场景不能作为首场景', async () => {
            const result = await checkBuildCommonOptionsByKey('startScene', '7f5ba957-296e-4230-824c-46d9a65ec5f1');
            expect(result.error).to.not.equal('');
        });
    });

    describe('scenes 验证测试', () => {
        it('场景数据为空后需要改成默认场景数据', async () => {
            const result = await checkBuildCommonOptionsByKey('scenes', []);
            expect(result.error).to.not.equal('');
            expect(result.newValue.length !== 0).to.be.true;
        });

        it('场景数据混入不存在的资源要被剔除，剔除后的场景数据为空要报错', async () => {
            const result = await checkBuildCommonOptionsByKey('scenes', [{ uuid: 'ahisbfbj', url: 'ad://asset/njjdks.scene' }]);
            expect(result.error).to.not.equal('');
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
            const result = await checkBuildCommonOptionsByKey('scenes', scenes);
            expect(result.error).to.not.equal('');
            expect(result.newValue.length).to.be.equal(scenes.length - 1);
        });
    });

    describe('buildPath 路径验证测试', () => {
        const options = { platform: 'wechatgame' };
        it('路径不能为空', async () => {
            const result = await checkBuildCommonOptionsByKey('buildPath', '', options);
            expect(result.error).to.not.equal('');
            expect(result.newValue).to.equal('project://build');
        });
    });
});
