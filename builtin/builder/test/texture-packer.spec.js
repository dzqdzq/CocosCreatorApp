const { expect } = require('chai');
const { join } = require('path');
const { ensureDirSync, copyFileSync, emptyDirSync, existsSync, removeSync, readFileSync } = require('fs-extra');
describe('自动图集功能测试', () => {
    const assets = ['test.pac', '61.png', '512.png', 'back120.jpg', 'bottom120texture.jpg'];
    const testDir = join(Editor.Project.path, 'assets', 'resources', 'atlasTest');
    const assetsDir = join(__dirname, './assets', 'texture-packer');
    const pacUuid = 'fdfe5b67-dc7e-42d1-8162-fc99c7a96fc2';
    const texturePackerTempDir = join(Editor.Project.path, 'temp', 'TexturePacker', 'preview', pacUuid);

    // 先制作一个合图的测试环境
    before(async () => {
        // 1. 清空测试文件夹内容，排除干扰
        emptyDirSync(testDir);
        // 2. 清空 temp 目录下的缓存文件
        removeSync(texturePackerTempDir);
        // 3. 先拷贝 meta 文件
        assets.forEach((name) => {
            copyFileSync(join(assetsDir, name + '.meta'), join(testDir, name + '.meta'));
        });
        // 4. 再拷贝实体文件
        for (const name of assets) {
            const url = 'db://assets/resources/atlasTest/' + name;
            const src = join(assetsDir, name);
            const result = await Editor.Message.request('asset-db', 'create-asset', url, readFileSync(src), {
                overwrite: true,
            });
            if (!result) {
                console.error('create-asset failed!');
            }
        }
    });

    it('初始查询自动图集信息为空', async () => {
        const result = await Editor.Message.request('builder', 'query-atlas-files', pacUuid);
        expect(result).to.be.not.ok;
    });

    describe('自动图集合图生成与预览接口测试', async () => {
        const result = await Editor.Message.request('builder', 'preview-pac', pacUuid);

        it('正常返回值', async () => {
            expect(result).to.be.ok;
        });

        it('合图正常生成', async () => {
            expect(existsSync(result.atlasImagePaths[0])).to.be.true;
        });

        it('pac-info 文件正常生成', async () => {
            expect(existsSync(join(texturePackerTempDir, 'pac-info.json'))).to.be.true;
        });

        it('查询自动图集信息不为空', async () => {
            const result = await Editor.Message.request('builder', 'query-atlas-files', pacUuid);
            expect(result).to.be.ok;
        });

        it('首次预览 dirty 状态是 true', async () => {
            expect(result.dirty).to.be.true;
        });

        it('unpackedImages 数据长度为 1', async () => {
            expect(result.unpackedImages.length).to.be.equal(1);
        });

        it('atlasImagePaths 数据长度为 1', async () => {
            expect(result.atlasImagePaths.length).to.be.equal(1);
        });

        // 清理合图产生的资源
        after(() => {
            removeSync(texturePackerTempDir);
        });
    });

    // 清理用来测试的合图资源
    after(() => {
        removeSync(testDir);
    });
});
