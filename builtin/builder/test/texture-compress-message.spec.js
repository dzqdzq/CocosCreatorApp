const { expect } = require('chai');
if (Editor.Project.name !== 'build-example') {
    console.log('测试用例需要在 build-example 项目下执行');
    return;
}
const etc1rgb_a = 'a30be7e2-9364-44cf-83b6-7ba8e74f03ea';
// 测试前需要清理缓存
before(async () => {
    await Editor.Message.request('builder', 'clear-assets-cache');
});

const taskAllKeys = ['src', 'presetId', 'compressOptions', 'hasAlpha', 'mtime', 'hasMipmaps', 'dest', 'suffix', 'dirty'];
describe('第一次查询缓存无法查询到', async () => {
    const cache = await Editor.Message.request('builder', 'request-to-build-worker', 'build-worker:query-compress-texture-cache', etc1rgb_a);
    expect(cache).to.be.null;
});

describe('第一次执行 etc1rgb_a 压缩', async () => {
    const res = await Editor.Message.request('builder', 'request-to-build-worker', 'build-worker:compress-texture', etc1rgb_a);
    it('返回完整信息的压缩 task 信息', () => {
        expect(res).to.include.keys(taskAllKeys);
    });

    it('正常执行压缩', () => {
        expect(res.dest.length).to.equal(2);
        expect(res.suffix.length).to.equal(2);
    });
    it('dirty = TRUE', () => {
        expect(res.dirty).to.be.true;
    });
    it('hasMipmaps = false', () => {
        expect(res.hasMipmaps).to.be.false;
    });
    it('hasAlpha = true', () => {
        expect(res.hasAlpha).to.be.true;
    });
});

describe('第二次查询缓存信息', async () => {
    const cache = await Editor.Message.request('builder', 'request-to-build-worker', 'build-worker:query-compress-texture-cache', etc1rgb_a);
    expect(cache).to.be.not.empty;
});

describe('第二次执行 etc1rgb_a 压缩', async () => {
    const res = await Editor.Message.request('builder', 'request-to-build-worker', 'build-worker:compress-texture', etc1rgb_a);
    it('返回完整信息的压缩 task 信息', () => {
        expect(res).to.include.keys(taskAllKeys);
    });
    it('正常执行压缩', () => {
        expect(res.dest.length).to.equal(2);
        expect(res.suffix.length).to.equal(2);
    });
    it('dirty = false', () => {
        expect(res.dirty).to.be.false;
    });
    it('hasMipmaps = false', () => {
        expect(res.hasMipmaps).to.be.false;
    });
    it('hasAlpha = true', () => {
        expect(res.hasAlpha).to.be.true;
    });
});