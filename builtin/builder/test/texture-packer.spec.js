const { expect } = require('chai');
const { join, basename } = require('path');
const { existsSync, removeSync, readFileSync } = require('fs-extra');
describe('自动图集预览生成功能测试', () => {
    const pacUuid = '8c34f9fe-8120-4901-8201-5dedb4439693';
    const texturePackerTempDir = join(Editor.Project.path, 'temp', 'build', 'TexturePacker1.0.1');
    const pacPreviewCacheDir = join(texturePackerTempDir, 'preview', pacUuid);
    removeSync(texturePackerTempDir);

    it('初始查询自动图集信息为空', async () => {
        const result = await Editor.Message.request('builder', 'query-atlas-files', pacUuid);
        expect(result).to.be.not.ok;
    });

    describe('自动图集合图生成与预览接口测试', async () => {
        const result = await Editor.Message.request('builder', 'preview-pac', pacUuid);
        console.debug(result);

        it('正常返回值', async () => {
            expect(result).to.be.ok;
        });

        it('合图正常生成', async () => {
            expect(existsSync(result.atlasImagePaths[0])).to.be.true;
        });

        it('pac-info 文件正常生成', async () => {
            const path = result.atlasImagePaths[0].replace(basename(result.atlasImagePaths[0]), 'pac-info.json');
            const info = readFileSync(path);
            console.debug(path, info);
            expect(existsSync(path)).to.be.true;
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

    });
    // 清理合图产生的资源
    after(() => {
        removeSync(texturePackerTempDir);
    });

});
