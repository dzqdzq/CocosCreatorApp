const { expect } = require('chai');
const { join } = require('path');
const { existsSync, removeSync } = require('fs-extra');

describe('自动图集预览生成功能测试', () => {
    const pacUuid = '8c34f9fe-8120-4901-8201-5dedb4439693';
    const texturePackerTempDir = join(Editor.Project.path, 'temp', 'asset-db', 'assets', pacUuid.substr(0, 2), pacUuid);
    removeSync(texturePackerTempDir);
    describe('自动图集第一次查询缓存文件为空', async () => {
        const result = await Editor.Message.request('builder', 'query-atlas-files', pacUuid);
        expect(result).to.be.null;
    });

    describe('自动图集合图生成与预览接口测试', async () => {
        const result = await Editor.Message.request('builder', 'preview-pac', pacUuid);
        console.debug(result);

        it('正常返回值', async () => {
            const allKeys = ['atlasImagePaths', 'dirty', 'unpackedImages'];
            expect(result).to.include.keys(allKeys);
        });

        it('合图正常生成', async () => {
            expect(existsSync(result.atlasImagePaths[0])).to.be.true;
        });

        it('unpackedImages 数据长度为 1', async () => {
            expect(result.unpackedImages.length).to.be.equal(1);
        });

        it('首次预览 dirty 状态是 true', async () => {
            expect(result.dirty).to.be.true;
        });

    });

    describe('自动图集在生成后正常查询缓存文件', async () => {
        const result = await Editor.Message.request('builder', 'query-atlas-files', pacUuid);
        expect(result).to.be.ok;
    });

    describe('自动图集合图生成与预览接口第二次查询', async () => {
        const result = await Editor.Message.request('builder', 'preview-pac', pacUuid);
        it('第二次查询 dirty 为 false', async () => {
            expect(result.dirty).to.be.false;
        });
    });

    describe('自动图集自定义传参接口测试', async () => {
        const result = await Editor.Message.request('builder', 'preview-pac', pacUuid, {
            maxWidth: 160,
            maxHeight: 1024,
        });

        it('正常返回值', async () => {
            expect(result).to.be.ok;
        });

        it('合图正常生成', async () => {
            expect(existsSync(result.atlasImagePaths[0])).to.be.true;
        });

        it('定义传参首次预览 dirty 状态是 true', async () => {
            expect(result.dirty).to.be.true;
        });

        it('unpackedImages 数据长度为 2', async () => {
            expect(result.unpackedImages.length).to.be.equal(2);
        });

    });

    describe('自动图集自定义传参第二次查询', async () => {
        const result = await Editor.Message.request('builder', 'preview-pac', pacUuid, {
            maxWidth: 160,
            maxHeight: 1024,
        });
        it('第二次查询 dirty 为 false', async () => {
            expect(result.dirty).to.be.false;
        });
    });

    // 清理合图产生的资源
    after(() => {
        removeSync(texturePackerTempDir);
    });

});