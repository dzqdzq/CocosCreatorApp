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
            'ignoreFiles',
            'ignoreGlob',
            'level',
            'library',
            'name',
            'readonly',
            'target',
            'temp',
            'visible',
            'flags',
            'preImportExtList',
            'state',
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

    describe('query-asset-info 消息接口测试', async function() {
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
            expect(info).to.have.all.keys([...keys, 'extends']);
        });
        it('查询 assets 数据库里测试生成的临时资源', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', `db://assets/${name}`);
            expect(info).not.null;
            expect(info).to.have.all.keys([...keys, 'extends']);
        });
        it('查询 assets 数据库里不存在的资源', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', uuid + '@xxx');
            expect(info).is.null;
        });

        it('dataKeys: 查询 depends 信息', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', 'd032ac98-05e1-4090-88bb-eb640dcb5fc1@b47c0', ['depends']);
            expect(info.depends.length).to.equal(6);
        });
        it('dataKeys: 查询 meta 信息', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', 'd032ac98-05e1-4090-88bb-eb640dcb5fc1@b47c0', ['meta']);
            expect(info.meta && typeof(info.meta) === 'object').to.be.true;
        });
        it('dataKeys: 查询 mtime 信息', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', 'd032ac98-05e1-4090-88bb-eb640dcb5fc1', ['mtime']);
            expect(typeof(info.mtime) === 'number').to.be.true;
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

    if (Editor.Project.name === 'build-example') {
        // db://assets/atlas-compress/atlas/test-compress.ts
        const scriptUuid = 'a141f4e5-b92d-45b4-acc4-e54d98a79294';
        // db://assets/atlas-compress/atlas-compress.scene
        const sceneUuid = '4437972c-9b71-4af0-aae3-251f640ee42a';
        // db://assets/atlas-compress/atlas/testScriptDepend.prefab
        const prefabUuid = '2fbecd81-cbb4-47d1-8d97-7ec9961df865';
        // db://assets/atlas-compress/atlas/sheep_jump_4.png/spriteFrame
        const spriteUuid = '05a0ccff-8e54-44dc-93ea-69c1e783f56a@f9941';
        // db://assets/resources/testScriptDepend.ts required by test-compress
        const scriptRequired = 'b02a8776-6b86-4f1a-8ecf-93bcc1a55bea';

        describe('query-asset-used', function() {
            it ('脚本 uuid, asset -> 使用此脚本 uuid 的场景/prefab列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-used', scriptUuid);
                expect(assetUuids).to.include(sceneUuid);
            });
            it ('脚本 uuid, script -> 使用此脚本 uuid 的脚本列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-used', scriptRequired, 'script');
                expect(assetUuids).to.include(scriptUuid);
            });
            it ('资源 uuid, asset -> 使用此资源 uuid 的场景/prefab列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-used', spriteUuid);
                expect(assetUuids).to.include(sceneUuid);
                expect(assetUuids).to.include(prefabUuid);
            });
            it ('脚本 uuid, all -> 使用此脚本 uuid 的prefab/脚本列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-used', scriptRequired, 'all');
                expect(assetUuids).to.include(scriptUuid);
                expect(assetUuids).to.include(prefabUuid);
            });
        });

        describe('query-asset-dependinces', function() {
            it ('脚本 uuid, asset -> 脚本使用的资源列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-dependinces', scriptUuid);
                expect(assetUuids.length).to.equal(0);
            });
            it ('场景 uuid, asset -> 场景使用的资源列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-dependinces', sceneUuid);
                expect(assetUuids).to.include(spriteUuid);
            });
            it ('场景 uuid, script -> 场景使用的脚本列表', async () => {
                const uuids = await Editor.Message.request('asset-db', 'query-asset-dependinces', sceneUuid, 'script');
                expect(uuids).to.include(scriptUuid);
            });
            it ('脚本 uuid, script -> 脚本依赖的脚本列表', async () => {
                const uuids = await Editor.Message.request('asset-db', 'query-asset-dependinces', scriptUuid, 'script');
                expect(uuids).to.include(scriptRequired);
            });
            it ('prefab uuid, all -> prefab 内使用的脚本与资源 uuid', async () => {
                const uuids = await Editor.Message.request('asset-db', 'query-asset-dependinces', prefabUuid, 'all');
                expect(uuids.length).to.equal(2);
                expect(uuids.includes(scriptRequired)).to.be.true;
                expect(uuids.includes(spriteUuid)).to.be.true;
            });
        });
    }
});