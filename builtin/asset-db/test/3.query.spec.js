'use struct';

const { expect } = require('chai');
const { join } = require('path');
const { existsSync, remove } = require('fs-extra');

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

const internalSpriteUuid = '951249e0-9f16-456d-8b85-a6ca954da16b@f9941';
const internalSpriteImageUuid = '951249e0-9f16-456d-8b85-a6ca954da16b';

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

    describe('query-all-importer', async () => {
        const result = await Editor.Message.request('asset-db', 'query-all-importer');
        expect(result).to.be.an('array');
        expect(!!result.length).to.be.true;
        expect(result.includes('sprite-frame')).to.be.true;
    });

    describe('query-all-asset-types', async () => {
        const result = await Editor.Message.request('asset-db', 'query-all-asset-types');
        expect(result).to.be.an('array');
        expect(result.includes('cc.Prefab')).to.be.true;
    });

    describe('query-create-list', async () => {
        const result = await Editor.Message.request('asset-db', 'query-create-list');
        it('正常查询到资源创建列表', () => {
            expect(result).to.be.an('array');
            expect(!!result.length).to.be.true;
        });

        it('所有数据都包含必要信息', () => {
            const keys = ['handler', 'label', 'fullFileName'];
            const hasAllKeys = result.every((info) => {
                return keys.every((key) => key in info);
            });
            expect(hasAllKeys).to.be.true;
        });

        it('艺术字菜单数据正常', () => {
            const atlasMenu = result.find((info) => info.handler === 'label-atlas');
            expect(atlasMenu).not.null;
            const value = {
                fullFileName: 'label-atlas.labelatlas',
                handler: 'label-atlas',
                label: 'i18n:ENGINE.assets.newLabelAtlas',
                template: 'db://internal/default_file_content/label-atlas/default.labelatlas',
            };
            expect(atlasMenu).to.deep.equal(value);
        });

        describe('给出的菜单都可以正常创建资源', () => {
            const assetRoot = join(Editor.Project.path, 'assets', '__test__create__asset__');

            function testCreate(info) {
                describe(`测试创建 ${Editor.I18n.t(info.label) || info.label}(${info.fullFileName})`, async () => {
                    const target = join(assetRoot, info.fullFileName);
                    try {
                        const targetUrl = `db://assets/__test__create__asset__/${info.fullFileName}`;
                        const assetInfo = await Editor.Message.request('asset-db', 'new-asset', {
                            ...info,
                            target: targetUrl,
                            overwrite: true,
                        });
                        if (info.label.startsWith('i18n:')) {
                            it('创建菜单 i18n 正常', () => {
                                expect(!!Editor.I18n.t(info.label.replace('i18n:', ''))).to.be.true;
                            });
                        }
                        it('创建后返回新建资源信息', () => {
                            expect(assetInfo.uuid).to.be.a('string');
                            expect(assetInfo.source).to.equal(targetUrl);
                        });
                        it('创建文件存在', () => {
                            expect(existsSync(target)).to.be.true;
                        });
                    } catch (error) {
                        console.error(error);
                    }
                });
            }
            for (const info of result) {
                if (info.submenu) {
                    for (const subInfo of info.submenu) {
                        testCreate(subInfo);
                    }
                } else {
                    testCreate(info);
                }
            }

            after(async () => {
                await Editor.Message.request('asset-db', 'delete-asset', assetRoot);
            });
        });
    });

    describe('query-create-menu-list', async () => {
        const result = await Editor.Message.request('asset-db', 'query-create-menu-list');
        it('正常查询到资源创建菜单列表', () => {
            expect(result).to.be.an('array');
            expect(!!result.length).to.be.true;
        });
        // TODO 其他子菜单的查询
    });

    describe('query-icon-config-map', async () => {
        const result = await Editor.Message.request('asset-db', 'query-icon-config-map');
        it('正常查询到图标配置列表', () => {
            expect(result).to.be.an('object');
            expect(Object.keys(result).length > 30).to.be.true;
        });
        describe('给出的所有图标信息正常', () => {
            const keys = ['type', 'thumbnail', 'value'];
            const hasAllKeys = Object.values(result).every((info) => {
                return keys.every((key) => key in info);
            });
            expect(hasAllKeys).to.be.true;
        });
        it('查询到的 gltf 图标信息正常', () => {
            const gltfIcon = result.gltf;
            expect(gltfIcon).not.null;
            const value = {
                thumbnail: false,
                type: 'icon',
                value: 'gltf',
            };
            expect(gltfIcon).to.deep.equal(value);
        });
    });

    describe('query-asset-thumbnail', async () => {
        it('查询 sprite 资源的缩略图信息', async () => {
            const thumbnailInfo = await Editor.Message.request('asset-db', 'query-asset-thumbnail', internalSpriteUuid);
            expect(thumbnailInfo.type).to.equal('image');
            expect(existsSync(thumbnailInfo.value)).to.be.true;
        });

        it('查询 mesh 资源的缩略图信息', async () => {
            const thumbnailInfo = await Editor.Message.request('asset-db', 'query-asset-thumbnail', '1263d74c-8167-4928-91a6-4e2672411f47@8abdc');
            expect(thumbnailInfo.type).to.equal('image');
            expect(existsSync(thumbnailInfo.value)).to.be.true;
        });

        it('查询 prefab 资源的缩略图信息', async () => {
            const thumbnailInfo = await Editor.Message.request('asset-db', 'query-asset-thumbnail', '90bdd2a9-2838-4888-b66c-e94c8b7a5169');
            expect(thumbnailInfo.type).to.equal('icon');
            expect(thumbnailInfo.value).to.equal('prefab');
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
            expect(info.meta && typeof (info.meta) === 'object').to.be.true;
        });
        it('dataKeys: 查询 mtime 信息', async function() {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', 'd032ac98-05e1-4090-88bb-eb640dcb5fc1', ['mtime']);
            expect(typeof (info.mtime) === 'number').to.be.true;
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
        it('查询 internal 目录下 ccType = cc.SceneAsset 资源', async () => {
            const allScenes = await Editor.Message.request('asset-db', 'query-assets', { ccType: 'cc.SceneAsset', pattern: 'db://internal/**/*'});
            expect(allScenes.length).equal(3);  
        });
        it('查询 internal 目录下 extname = mp4资源', async () => {
            const allMP4 = await Editor.Message.request('asset-db', 'query-assets', { extname: '.mp4', pattern: 'db://internal/**/*'});
            expect(allMP4.length).equal(1);  
        });
        it('查询 internal 目录下 importer = video-clip 资源', async () => {
            const allMP4 = await Editor.Message.request('asset-db', 'query-assets', { importer: 'video-clip', pattern: 'db://internal/**/*'});
            expect(allMP4.length).equal(1);  
        });
        it('查询 assets 目录下 userData.isPlugin = true 的插件脚本资源', async () => {
            const allPlugins = await Editor.Message.request('asset-db', 'query-assets', { userData: { isPlugin: true }, pattern: 'db://assets/**/*'});
            expect(allPlugins.length).equal(1);  
        });
    });

    describe('query-asset-mtime', async () => {
        const mtime = await Editor.Message.request('asset-db', 'query-asset-mtime', internalSpriteImageUuid);
        expect(mtime).to.be.an('number');
    });

    describe('query-ready', async () => {
        const ready = await Editor.Message.request('asset-db', 'query-ready');
        expect(ready).to.be.true;
    });

    describe('query-asset-data', async () => {
        const data = await Editor.Message.request('asset-db', 'query-asset-data', internalSpriteUuid);
        expect(data).to.exist;

        it('查询 data 数据是否完整', () => {
            expect(data).to.have.all.keys([
                'value',
                'url',
                'versionCode',
            ]);
        });
        it('data 数据需要包含依赖信息', () => {
            expect(!!data.value.depends.length).to.be.true;
        });
    });

    if (Editor.Project.name === 'build-example') {
        // db://assets/atlas-compress/atlas/test-compress.ts
        const scriptUuid = 'f14e1127-f4ff-418d-a54a-5d7daaa942c8';
        // db://assets/atlas-compress/atlas-compress.scene
        const sceneUuid = '4437972c-9b71-4af0-aae3-251f640ee42a';
        // db://assets/atlas-compress/atlas/testScriptDepend.prefab
        const prefabUuid = '2fbecd81-cbb4-47d1-8d97-7ec9961df865';
        // db://assets/atlas-compress/atlas/sheep_jump_4.png/spriteFrame
        const spriteUuid = '05a0ccff-8e54-44dc-93ea-69c1e783f56a@f9941';
        // db://assets/resources/testScriptDepend.ts required by test-compress
        const scriptRequired = 'b02a8776-6b86-4f1a-8ecf-93bcc1a55bea';
        // db://internal/effects/legacy/standard.effect required by test-texture
        const internalEffect = '1baf0fc9-befa-459c-8bdd-af1a450a0319';
        // db://assets/atlas/test-texture.mtl
        const material = 'b58097d1-e862-45dd-8f04-5ae4704761cf';

        describe('query-asset-users', function() {
            it('脚本 uuid, asset -> 使用此脚本 uuid 的资源列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-users', scriptUuid);
                expect(assetUuids).to.include(sceneUuid);
            });
            it('脚本 uuid, script -> 使用此脚本 uuid 的脚本列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-users', scriptRequired, 'script');
                expect(assetUuids).to.include(scriptUuid);
            });
            it('资源 uuid, asset -> 使用此资源 uuid 的资源列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-users', spriteUuid);
                expect(assetUuids).to.include(sceneUuid);
                expect(assetUuids).to.include(prefabUuid);
            });
            it('资源 uuid, asset -> 使用此资源 uuid 的资源列表(跨数据库依赖）', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-users', internalEffect);
                expect(assetUuids).to.include(material);
            });
            it('脚本 uuid, all -> 使用此脚本 uuid 的prefab/脚本列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-users', scriptRequired, 'all');
                expect(assetUuids).to.include(scriptUuid);
                expect(assetUuids).to.include(prefabUuid);
            });
        });

        describe('query-asset-dependencies', function() {
            it('脚本 uuid, asset -> 脚本使用的资源列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-dependencies', scriptUuid);
                expect(assetUuids.length).to.equal(0);
            });
            it('场景 uuid, asset -> 场景使用的资源列表', async () => {
                const assetUuids = await Editor.Message.request('asset-db', 'query-asset-dependencies', sceneUuid);
                expect(assetUuids).to.include(spriteUuid);
            });
            it('场景 uuid, script -> 场景使用的脚本列表', async () => {
                const uuids = await Editor.Message.request('asset-db', 'query-asset-dependencies', sceneUuid, 'script');
                expect(uuids).to.include(scriptUuid);
            });
            it('脚本 uuid, script -> 脚本依赖的脚本列表', async () => {
                const uuids = await Editor.Message.request('asset-db', 'query-asset-dependencies', scriptUuid, 'script');
                expect(uuids).to.include(scriptRequired);
            });
            it('prefab uuid, all -> prefab 内使用的脚本与资源 uuid', async () => {
                const uuids = await Editor.Message.request('asset-db', 'query-asset-dependencies', prefabUuid, 'all');
                expect(uuids.length).to.equal(2);
                expect(uuids.includes(scriptRequired)).to.be.true;
                expect(uuids.includes(spriteUuid)).to.be.true;
            });
        });
    }

    describe('query-asset-userData-config', async () => {
        const config = await Editor.Message.request('asset-db', 'query-asset-userData-config', internalSpriteImageUuid);
        expect(config).to.exist;
        expect(config.type.label).to.equal('i18n:ENGINE.assets.image.type');
    });

    describe('query-asset-config-map', async () => {
        const configMap = await Editor.Message.request('asset-db', 'query-asset-config-map');
        expect(configMap).to.exist;
        expect(configMap.image).to.hasAllKeys(['description', 'displayName', 'iconInfo', 'userDataConfig']);
    });

    // TODO query-missing-asset-info

    describe('batch-message-handler', async () => {

        const result = [
            'db://internal/default_ui/default_sprite.png',
            'db://internal/default_ui/default_radio_button_on.png',
        ];
        const urls = await Editor.Message.request('asset-db', 'batch-message-handler', [{
            name: 'query-url',
            args: ['57520716-48c8-4a19-8acf-41c9f8777fb0'],
        }, {
            name: 'query-url',
            args: ['45828f25-b50d-4c52-a591-e19491a62b8c'],
        }], true);

        expect(urls).to.deep.equal(result);
    });
});