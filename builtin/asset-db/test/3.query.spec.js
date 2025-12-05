'use struct';

const { expect } = require('chai');
const { join } = require('path');
const { existsSync } = require('fs-extra');

const invalidParams = [
    { name: 'undefined', value: undefined },
    { name: 'null', value: null },
    { name: 'number - 0', value: 0 },
    { name: 'number - 2', value: 2 },
    { name: 'string - empty', value: '' },
    { name: 'string - str', value: 'str' },
    { name: 'boolean - true', value: true },
    { name: 'boolean- false', value: false },
    { name: 'array', value: [] },
    { name: 'object', value: {} },
];

describe('测试 db 的查询接口', async function() {
    const name = `__${Date.now()}__.test`;
    let uuid = '';
    // 测试前的准备工作
    before(async function() {
        const asset = await Editor.Message.request('asset-db', 'create-asset', `db://assets/${name}`);
        uuid = asset.uuid;
    });

    after(async function() {
        await Editor.Message.request('asset-db', 'delete-asset', `db://assets/${name}`);
    });

    describe('query-db-info', async function() {
        const keys = [
            'alwaysStat',
            'binaryInterval',
            'followSymlinks',
            'ignoreFiles',
            'ignoreGlob',
            'interval',
            'level',
            'library',
            'name',
            'readonly',
            'target',
            'temp',
            'usePolling',
            'visible',
            'flags',
        ].sort();
        it('查询 assets 数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-db-info', 'db://assets');
            expect(info).not.null;
            expect(info).to.have.all.keys(keys);
        });
        it('查询 internal 数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-db-info', 'db://internal');
            expect(info).not.null;
            expect(info).to.have.all.keys(keys);
        });
        it('查询不存在的数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-db-info', 'db://不存在');
            expect(info).is.null;
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const info = await Editor.Message.request('asset-db', 'query-db-info', item.value);
                expect(info).is.null;
            });
        });
    });

    describe('query-path', async function() {
        it('查询 assets 数据库', async function() {
            const path = await Editor.Message.request('asset-db', 'query-path', 'db://assets');
            expect(path).not.null;
            const exists = existsSync(path);
            expect(exists).is.equal(true);
        });
        it('查询 internal 数据库', async function() {
            const path = await Editor.Message.request('asset-db', 'query-path', 'db://internal');
            expect(path).not.null;
            const exists = existsSync(path);
            expect(exists).is.equal(true);
        });
        it('查询不存在的数据库', async function() {
            const path = await Editor.Message.request('asset-db', 'query-path', 'db://不存在');
            expect(path).is.null;
        });
        it('查询 assets 数据库里测试生成的临时资源', async function() {
            const path = await Editor.Message.request('asset-db', 'query-path', `db://assets/${name}`);
            expect(path).not.null;
            const exists = existsSync(path);
            expect(exists).is.equal(true);
        });
        it('查询 assets 数据库里不存在的资源', async function() {
            const path = await Editor.Message.request('asset-db', 'query-path', `db://assets/${name}.xxx`);
            expect(path).not.null;
            const exists = existsSync(path);
            expect(exists).is.equal(false);
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const info = await Editor.Message.request('asset-db', 'query-db-info', item.value);
                expect(info).is.null;
            });
        });
    });

    describe('query-url', async function() {
        const assetsPath = join(Editor.Project.path, 'assets');
        // const internalPath = join(__dirname, '../static/internal/assets');
        it('查询 assets 数据库', async function() {
            const url = await Editor.Message.request('asset-db', 'query-url', assetsPath);
            expect(url).is.equal('db://assets');
        });
        // it('查询 internal 数据库', async function() {
        //     const url = await Editor.Message.request('asset-db', 'query-url', internalPath);
        //     expect(url).is.equal('db://internal');
        // });
        it('查询不存在的数据库', async function() {
            const url = await Editor.Message.request('asset-db', 'query-url', __dirname);
            expect(url).is.null;
        });
        it('查询 assets 数据库里测试生成的临时资源', async function() {
            const url = await Editor.Message.request('asset-db', 'query-url', join(assetsPath, name));
            expect(url).is.equal(`db://assets/${name}`);
        });
        it('查询 assets 数据库里不存在的资源', async function() {
            const url = await Editor.Message.request('asset-db', 'query-url', join(assetsPath, name + '.xxx'));
            expect(url).is.equal(`db://assets/${name}.xxx`);
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const info = await Editor.Message.request('asset-db', 'query-db-info', item.value);
                expect(info).is.null;
            });
        });
    });

    describe('query-uuid', async function() {
        it('查询 assets 数据库', async function() {
            const id = await Editor.Message.request('asset-db', 'query-uuid', 'db://assets');
            expect(id).is.equal('db://assets');
        });
        it('查询 internal 数据库', async function() {
            const id = await Editor.Message.request('asset-db', 'query-uuid', 'db://internal');
            expect(id).is.equal('db://internal');
        });
        it('查询不存在的数据库', async function() {
            const id = await Editor.Message.request('asset-db', 'query-uuid', 'db://不存在');
            expect(id).is.equal('');
        });
        it('查询 assets 数据库里测试生成的临时资源', async function() {
            const id = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/${name}`);
            expect(id).is.equal(uuid);
        });
        it('查询 assets 数据库里不存在的资源', async function() {
            const id = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/${name}.xxx`);
            expect(id).is.equal('');
        });
        it('查询 assets 数据库里不存在的资源', async function() {
            const id = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/${name}.xxx`);
            expect(id).is.equal('');
        });
        it('查询 assets 数据库里不存在的资源2', async function() {
            const id = await Editor.Message.request('asset-db', 'query-uuid', 'db://internal/default_file_content/abc.xxx');
            expect(id).is.equal('');
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const info = await Editor.Message.request('asset-db', 'query-db-info', item.value);
                expect(info).is.null;
            });
        });
    });

    describe('query-asset-info', async function() {
        const values = {
            displayName: 'string',
            file: 'string',
            imported: 'boolean',
            importer: 'string',
            invalid: 'boolean',
            isDirectory: 'boolean',
            library: 'object',
            name: 'string',
            path: 'string',
            readonly: 'boolean',
            source: 'string',
            subAssets: 'object',
            type: 'string',
            url: 'string',
            uuid: 'string',
            visible: 'boolean',
        };
        const keys = Object.keys(values);

        it('查询 assets 数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', 'db://assets');
            expect(info).to.have.all.keys(keys);
        });
        it('查询 internal 数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', 'db://internal');
            expect(info).to.have.all.keys(keys);
        });
        it('查询不存在的数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', 'db://不存在');
            expect(info).is.null;
        });
        it('查询 assets 数据库里测试生成的临时资源', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid);
            expect(info).not.null;
            expect(info).to.have.all.keys(keys);
        });
        it('查询 assets 数据库里测试生成的临时资源', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', `db://assets/${name}`);
            expect(info).not.null;
            expect(info).to.have.all.keys(keys);
        });
        it('查询 assets 数据库里不存在的资源', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid + '@xxx');
            expect(info).is.null;
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const info = await Editor.Message.request('asset-db', 'query-db-info', item.value);
                expect(info).is.null;
            });
        });
    });

    describe('query-asset-meta', async function() {
        const values = {
            ver: 'string',
            importer: 'string',
            imported: 'boolean',
            // name: 'string',
            // id: 'string',
            uuid: 'string',
            // displayName: 'string',
            files: 'array',
            subMetas: 'object',
            userData: 'object',
        };
        const keys = Object.keys(values);

        it('查询 assets 数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-meta', 'db://assets');
            expect(info).to.have.all.keys(keys);
        });
        it('查询 internal 数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-meta', 'db://internal');
            expect(info).to.have.all.keys(keys);
        });
        it('查询不存在的数据库', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-meta', 'db://不存在');
            expect(info).is.null;
        });
        it('查询 assets 数据库里测试生成的临时资源', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-meta', uuid);
            expect(info).not.null;
            expect(info).to.have.all.keys(keys);
        });
        it('查询 assets 数据库里不存在的资源', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-meta', uuid + '@xxx');
            expect(info).is.null;
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const info = await Editor.Message.request('asset-db', 'query-asset-meta', item.value);
                expect(info).is.null;
            });
        });
    });

    describe('query-assets', async function() {
        const all = await Editor.Message.request('asset-db', 'query-assets');
        const allAssets = await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://assets' });
        const allInternal = await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://internal' });

        it('查询所有资源', async function() {
            expect(all).not.null;
            expect(all.length).not.equal(0);
        });
        it('查询 assets 数据库内的资源', async function() {
            expect(allAssets).not.null;
            expect(allAssets.length).not.equal(0);
            expect(allAssets.length).not.equal(all.length);
        });
        it('查询 internal 数据库内的资源', async function() {
            expect(allInternal).not.null;
            expect(allInternal.length).not.equal(all.length);
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const assets = await Editor.Message.request('asset-db', 'query-assets', item.value);
                expect(assets.length).is.equal(all.length);
            });
        });
    });
});
