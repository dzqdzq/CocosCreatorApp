'use strict';

const { expect } = require('chai');
const { join, extname } = require('path');
const { existsSync, statSync, readJSONSync, writeJSONSync, readFileSync, removeSync, copy, readJsonSync } = require('fs-extra');

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
    { name: 'readonly url', value: 'db://internal/primitives.fbx/lambert1.material'},
];

describe('测试 db 的操作接口', async function() {
    const name = `__${Date.now()}__`;
    const databasePath = join(Editor.Project.path, 'assets', '__asset-db-test__');

    after(async function() {
        removeSync(databasePath);
    });

    describe('create-asset', async function() {
        it('创建文件夹', async function() {
            const asset = await Editor.Message.request('asset-db', 'create-asset', `db://assets/__asset-db-test__/${name}.directory`);

            const exists = existsSync(join(databasePath, `${name}.directory`));
            console.log(join(databasePath, `${name}.directory`));
            expect(exists).is.equal(true);

            const stat = statSync(join(databasePath, `${name}.directory`));
            expect(stat.isDirectory()).is.equal(true);

            const meta = readJSONSync(join(databasePath, `${name}.directory.meta`));
            expect(meta.uuid).is.equal(asset.uuid);
        });

        it('创建普通资源', async function() {
            const asset = await Editor.Message.request('asset-db', 'create-asset', `db://assets/__asset-db-test__/${name}.normal`, 'test');

            const exists = existsSync(join(databasePath, `${name}.normal`));
            expect(exists).is.equal(true);

            const stat = statSync(join(databasePath, `${name}.normal`));
            expect(stat.isDirectory()).is.equal(false);

            const meta = readJSONSync(join(databasePath, `${name}.normal.meta`));
            expect(meta.uuid).is.equal(asset.uuid);

            const content = readFileSync(join(databasePath, `${name}.normal`), 'utf8');
            expect(content).is.equal('test');
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const info = await Editor.Message.request('asset-db', 'create-asset', item.value);
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });
        });
    });

    describe('copy-asset', () => {
        it('复制文件夹', async function() {
            await Editor.Message.request('asset-db', 'copy-asset',
                `db://assets/__asset-db-test__/${name}.directory`,
                `db://assets/__asset-db-test__/${name}.directory2`,
            );

            const uuid = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/__asset-db-test__/${name}.directory2`);

            const exists = existsSync(join(databasePath, `${name}.directory`));
            expect(exists).is.equal(true);

            const exists2 = existsSync(join(databasePath, `${name}.directory2`));
            expect(exists2).is.equal(true);

            const stat = statSync(join(databasePath, `${name}.directory2`));
            expect(stat.isDirectory()).is.equal(true);

            const meta = readJSONSync(join(databasePath, `${name}.directory2.meta`));
            expect(meta.uuid).is.equal(uuid);
        });

        it('复制普通资源', async function() {
            await Editor.Message.request('asset-db', 'copy-asset',
                `db://assets/__asset-db-test__/${name}.normal`,
                `db://assets/__asset-db-test__/${name}.normal2`,
            );

            const uuid = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/__asset-db-test__/${name}.normal2`);

            const exists = existsSync(join(databasePath, `${name}.normal`));
            expect(exists).is.equal(true);

            const exists2 = existsSync(join(databasePath, `${name}.normal2`));
            expect(exists2).is.equal(true);

            const stat = statSync(join(databasePath, `${name}.normal2`));
            expect(stat.isDirectory()).is.equal(false);

            const meta = readJSONSync(join(databasePath, `${name}.normal2.meta`));
            expect(meta.uuid).is.equal(uuid);

            const content = readFileSync(join(databasePath, `${name}.normal2`), 'utf8');
            expect(content).is.equal('test');
        });

        invalidParams.forEach((item) => {
            it(`第一个参数传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const info = await Editor.Message.request('asset-db', 'copy-asset', item.value, join(databasePath, `${name}.normal10`));
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });

            it(`第二个参数传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const info = await Editor.Message.request('asset-db', 'copy-asset', join(databasePath, `${name}.normal`), item.value);
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });
        });
    });

    describe('move-asset', () => {
        it('移动文件夹', async function() {
            await Editor.Message.request('asset-db', 'move-asset',
                `db://assets/__asset-db-test__/${name}.directory2`,
                `db://assets/__asset-db-test__/${name}.directory3`,
            );

            const exists = existsSync(join(databasePath, `${name}.directory2`));
            expect(exists).is.equal(false);

            const exists2 = existsSync(join(databasePath, `${name}.directory3`));
            expect(exists2).is.equal(true);

            const stat = statSync(join(databasePath, `${name}.directory3`));
            expect(stat.isDirectory()).is.equal(true);

            // move 传出的是一个 bool，不是预期的 uuid
            // const meta = readJSONSync(join(databasePath, `${name}.directory3.meta`));
            // expect(meta.uuid).is.equal(uuid);
        });

        it('移动普通资源', async function() {
            await Editor.Message.request('asset-db', 'move-asset',
                `db://assets/__asset-db-test__/${name}.normal2`,
                `db://assets/__asset-db-test__/${name}.normal3`,
            );

            const exists = existsSync(join(databasePath, `${name}.normal2`));
            expect(exists).is.equal(false);

            const exists2 = existsSync(join(databasePath, `${name}.normal3`));
            expect(exists2).is.equal(true);

            const stat = statSync(join(databasePath, `${name}.normal3`));
            expect(stat.isDirectory()).is.equal(false);

            // move 传出的是一个 bool，不是预期的 uuid
            // const meta = readJSONSync(join(databasePath, `${name}.normal3.meta`));
            // expect(meta.uuid).is.equal(uuid);

            const content = readFileSync(join(databasePath, `${name}.normal3`), 'utf8');
            expect(content).is.equal('test');
        });

        it('普通的移动重命名资源', async function() {
            const testName1 = name;
            const testName2 = name + 'A';
            await Editor.Message.request('asset-db', 'move-asset',
                `db://assets/__asset-db-test__/${testName1}.normal3`,
                `db://assets/__asset-db-test__/${testName2}.normal3`,
            );

            const exists = existsSync(join(databasePath, `${testName1}.normal3`));
            expect(exists).is.equal(false);

            const exists2 = existsSync(join(databasePath, `${testName2}.normal3`));
            expect(exists2).is.equal(true);

            const content = readFileSync(join(databasePath, `${testName2}.normal3`), 'utf8');
            expect(content).is.equal('test');
        });

        it('大小写差异的重命名资源', async function() {
            const testName1 = name + 'A';
            const testName2 = name + 'a';
            await Editor.Message.request('asset-db', 'move-asset',
                `db://assets/__asset-db-test__/${testName1}.normal3`,
                `db://assets/__asset-db-test__/${testName2}.normal3`,
            );

            const testName1Uuid = await Editor.Message.request('asset-db', 'query-uuid', join(databasePath, `${testName1}.normal3`));
            expect(!!testName1Uuid).is.equal(false);

            const testName2Uuid = await Editor.Message.request('asset-db', 'query-uuid', join(databasePath, `${testName2}.normal3`));
            expect(!!testName2Uuid).is.equal(true);

            const metaExist = existsSync(join(databasePath, `${testName2}.normal3.meta`));
            expect(metaExist).is.equal(true);

            const content = readFileSync(join(databasePath, `${testName2}.normal3`), 'utf8');
            expect(content).is.equal('test');
        });

        invalidParams.forEach((item) => {
            it(`第一个参数传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const info = await Editor.Message.request('asset-db', 'move-asset', item.value, join(databasePath, `${name}.normal10`));
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });

            it(`第二个参数传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const info = await Editor.Message.request('asset-db', 'move-asset', join(databasePath, `${name}.normal`), item.value);
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });
        });
    });

    describe('delete-asset', () => {
        describe('删除文件夹', async function() {
            await Editor.Message.request('asset-db', 'delete-asset', `db://assets/__asset-db-test__/${name}.directory3`);

            it('删除文件夹后源文件不存在', () => {
                const exists = existsSync(join(databasePath, `${name}.directory3`));
                expect(exists).is.equal(false);
            });

            it('删除文件夹后源文件 meta 应该不存在', () => {
                const metaExists = existsSync(join(databasePath, `${name}.directory3.meta`));
                console.log(Date.now());
                expect(metaExists).is.equal(false);
            });
        });

        it('使用 url 删除普通资源', async function() {
            await Editor.Message.request('asset-db', 'delete-asset', `db://assets/__asset-db-test__/${name}a.normal3`, 'test');

            const exists = existsSync(join(databasePath, `${name}a.normal3`));
            expect(exists).is.equal(false);

            const metaExists = existsSync(join(databasePath, `${name}a.normal3.meta`));
            expect(metaExists).is.equal(false);
        });

        it('使用 uuid 删除普通资源', async function() {
            const testName = `${name}_delete.normal`;
            const asset = await Editor.Message.request('asset-db', 'create-asset', `db://assets/__asset-db-test__/${testName}`, 'test');
            await Editor.Message.request('asset-db', 'delete-asset', asset.uuid);

            const exists = existsSync(join(databasePath, `${testName}`));
            expect(exists).is.equal(false);

            const metaExists = existsSync(join(databasePath, `${testName}.meta`));
            expect(metaExists).is.equal(false);
        });
        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const asset = await Editor.Message.request('asset-db', 'delete-asset', item.value);
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });
        });
    });

    describe('save-asset', () => {
        it('保存普通资源', async function() {
            await Editor.Message.request('asset-db', 'save-asset', `db://assets/__asset-db-test__/${name}.normal`, 'test2');

            const exists = existsSync(join(databasePath, `${name}.normal`));
            expect(exists).is.equal(true);

            const content = readFileSync(join(databasePath, `${name}.normal`), 'utf8');
            expect(content).is.equal('test2');
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const bool = await Editor.Message.request('asset-db', 'save-asset', item.value);
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });
        });

        // 保存场景、prefab、材质、动画
    });

    describe('reimport-asset', () => {

        it('普通资源 uuid 的 reimport', async () => {
            const uuid = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/__asset-db-test__/${name}.normal`);
    
            const metaJson = readJSONSync(join(databasePath, `${name}.normal.meta`));
            metaJson.userData.testReimport = true;
            writeJSONSync(join(databasePath, `${name}.normal.meta`), metaJson);

            await Editor.Message.request('asset-db', 'reimport-asset', uuid);
            const assetMeta = await Editor.Message.request('asset-db', 'query-asset-meta', uuid);
            expect(assetMeta.userData.testReimport).is.equal(true);
        });

        it('子资源 url 的 reimport', async () => {
            const parentUrl = 'db://internal/default_ui/default_toggle_disabled.png';
            const subAssetUrl = `${parentUrl}/texture`;
            const subAssetUuid = await Editor.Message.request('asset-db', 'query-uuid', subAssetUrl);
            let hasRefresh = false;
            function testListener(uuid) {
                if (subAssetUuid === uuid) {
                    hasRefresh = true;
                }
            }
            Editor.Message.__protected__.addBroadcastListener('asset-db:asset-change', testListener);
            await Editor.Message.request('asset-db', 'reimport-asset', subAssetUrl);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            Editor.Message.__protected__.removeBroadcastListener('asset-db:asset-change', testListener);

            expect(hasRefresh).to.be.true;
        });
    });
    describe('save-asset-meta', () => {
        it('保存资源的 meta', async function() {
            const uuid = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/__asset-db-test__/${name}.normal`);

            const metaJson = readJSONSync(join(databasePath, `${name}.normal.meta`));
            metaJson.userData.test = true;

            await Editor.Message.request('asset-db', 'save-asset-meta', uuid, JSON.stringify(metaJson));
            const meta = await Editor.Message.request('asset-db', 'query-asset-meta', uuid);

            expect(meta.userData.test).is.equal(true);
        });

        invalidParams.forEach((item) => {
            it(`传入参数错误 - ${item.name}`, async function() {
                const uuid = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/__asset-db-test__/${name}.normal`);

                let err = false;
                try {
                    const result = await Editor.Message.request('asset-db', 'save-asset-meta', uuid, item.value);
                    if (result === null) {
                        err = true;
                    }
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;

                const meta = await Editor.Message.request('asset-db', 'query-asset-meta', uuid);
                expect(meta.userData.test).is.equal(true);
            });
        });
    });

    describe('refresh-all-database', async () => {
        let resultResolve = null;

        function test() {
            resultResolve && resultResolve(true);
            Editor.Message.removeBroadcastListener('asset-db:refresh-finish', test);
        }
        const result = new Promise((resolve) => {
            resultResolve = resolve;
        });
        Editor.Message.addBroadcastListener('asset-db:refresh-finish', test);
        // 删除 effect.bin 的缓存
        const effectBin = join(Editor.Project.path, 'temp', 'asset-db', 'effect/effect.bin');
        removeSync(effectBin);
        await Editor.Message.request('asset-db', 'refresh-all-database');
        // 刷新资源后，需要重新生成 effect.bin

        expect(await result).to.be.true;
        expect(existsSync(effectBin)).to.be.true;
    });

    describe('rename-asset', () => {
        it('重命名文件夹', async function() {
            await Editor.Message.request('asset-db', 'rename-asset',
                `db://assets/__asset-db-test__/${name}.directory`,
                `db://assets/__asset-db-test__/${name}rename.directory`,
            );

            const exists = existsSync(join(databasePath, `${name}.directory`));
            expect(exists).is.equal(false);

            const exists2 = existsSync(join(databasePath, `${name}rename.directory`));
            expect(exists2).is.equal(true);

            const stat = statSync(join(databasePath, `${name}rename.directory`));
            expect(stat.isDirectory()).is.equal(true);
        });

        it('重命名普通资源', async function() {
            await Editor.Message.request('asset-db', 'rename-asset',
                `db://assets/__asset-db-test__/${name}.normal`,
                `db://assets/__asset-db-test__/${name}.normal2`,
            );

            const exists = existsSync(join(databasePath, `${name}.normal`));
            expect(exists).is.equal(false);

            const exists2 = existsSync(join(databasePath, `${name}.normal2`));
            expect(exists2).is.equal(true);

            const stat = statSync(join(databasePath, `${name}.normal2`));
            expect(stat.isDirectory()).is.equal(false);

            // move 传出的是一个 bool，不是预期的 uuid
            // const meta = readJSONSync(join(databasePath, `${name}.normal3.meta`));
            // expect(meta.uuid).is.equal(uuid);

            const content = readFileSync(join(databasePath, `${name}.normal2`), 'utf8');
            expect(content).is.equal('test2');
        });

        it('大小写差异的重命名资源', async function() {
            const testName1 = name;
            const testName2 = name + 'a';
            await Editor.Message.request('asset-db', 'rename-asset',
                `db://assets/__asset-db-test__/${testName1}.normal2`,
                `db://assets/__asset-db-test__/${testName2}.normal2`,
            );

            const testName1Uuid = await Editor.Message.request('asset-db', 'query-uuid', join(databasePath, `${testName1}.normal2`));
            expect(!!testName1Uuid).is.equal(false);

            const testName2Uuid = await Editor.Message.request('asset-db', 'query-uuid', join(databasePath, `${testName2}.normal2`));
            expect(!!testName2Uuid).is.equal(true);

            const metaExist = existsSync(join(databasePath, `${testName2}.normal2.meta`));
            expect(metaExist).is.equal(true);

            const content = readFileSync(join(databasePath, `${testName2}.normal2`), 'utf8');
            expect(content).is.equal('test2');
        });

        it('重命名资源但实际为移动文件', async function() {
            const testName1 = name + 'a';
            const testName2 = name;
            await Editor.Message.request('asset-db', 'rename-asset',
                `db://assets/__asset-db-test__/${testName1}.normal2`,
                `db://assets/__asset-db-test__/move/${testName2}.normal2`,
            );

            const exists = existsSync(join(databasePath, `${testName1}.normal2`));
            expect(exists).is.equal(false);

            const exists2 = existsSync(join(databasePath, `move/${testName2}.normal2`));
            expect(exists2).is.equal(true);

            const content = readFileSync(join(databasePath, `move/${testName2}.normal2`), 'utf8');
            expect(content).is.equal('test2');
        });
        invalidParams.forEach((item) => {
            it(`第一个参数传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const info = await Editor.Message.request('asset-db', 'move-asset', item.value, join(databasePath, `${name}.normal10`));
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });

            it(`第二个参数传入参数错误 - ${item.name}`, async function() {
                let err = false;
                try {
                    const info = await Editor.Message.request('asset-db', 'move-asset', join(databasePath, `${name}.normal`), item.value);
                } catch (error) {
                    err = true;
                }
                expect(err).is.true;
            });
        });
    });

    // TODO 
    describe('new-asset', async () => {
        // 1. 验证所有开放出去的新建菜单可以正常创建（已在 query.spec 内验证），主要验证包含模板的相关功能
        // 2. 验证 url + content 的创建，(已在 create-asset 处验证)
        // 3. 验证传递 userData/uuid/overwrite/rename 等附加参数的生效情况

        describe('创建普通资源 overwrite', async function() {
            const uuid = Editor.Utils.UUID.generate(false);
            const assetUrl = `db://assets/__asset-db-test__/${name}.normal`;
            const asset = await Editor.Message.request('asset-db', 'new-asset', {
                target: assetUrl,
                content: 'new-asset',
                overwrite: true,
                uuid,
                userData: {
                    test: 2,
                },
            });

            it('UUID 需要与指定的一致', () => {
                expect(asset.uuid).is.equal(uuid);
            });

            it('指定 userData 生效', () => {
                const meta = readJSONSync(join(databasePath, `${name}.normal.meta`));
                expect(meta.userData.test).equal(2);
            });

            it('overwrite 生效，正确修改文件内容', () => {
                const content = readFileSync(join(databasePath, `${name}.normal`), 'utf8');
                expect(content).is.equal('new-asset');
            });
            
        });

        describe('创建空文件 cubemap', async () => {
            const assetUrl = `db://assets/__asset-db-test__/${name}.cubemap`;
            const asset = await Editor.Message.request('asset-db', 'new-asset', {
                target: assetUrl,
                content: '',
            });

            expect(asset.type).equal('cc.TextureCube');
        });

        describe('创建空文件夹', async () => {
            const assetUrl = `db://assets/__asset-db-test__/${name}_folder`;
            const asset = await Editor.Message.request('asset-db', 'new-asset', {
                target: assetUrl,
            });
            expect(asset.isDirectory).to.be.true;
        });

        describe('同时传递 content 与 template 时，优先使用 content', async () => {
            const assetUrl = `db://assets/__asset-db-test__/${name}.custom`;
            const asset = await Editor.Message.request('asset-db', 'new-asset', {
                target: assetUrl,
                content: 'test',
                template: 'db://internal/default_file_content/auto-atlas/default.pac',
            });
            expect(extname(asset.file)).equal('.custom');
            expect(readFileSync(asset.file, 'utf-8')).equal('test');
        });

    });

    describe('import-asset', () => {
        // 把外部文件拷贝到 assets 指定目录下，并且导入刷新
        // 导入文件
        // 导入文件夹
    });

    describe('open-asset', () => {
        // 打开 ts 脚本（1：未配置脚本编辑器，2：已配置脚本编辑器）
        // 打开 image 资源（1：未配置图片编辑器，2：已配置图片编辑器）
        // 打开场景 prefab 
        // 打开 video 文件（使用系统默认）

        if (Editor.Project.name === 'build-example') {
            describe('打开 ts 脚本', async () => {
                const hasScriptEditor = await Editor.Profile.getConfig('program', 'scriptEditor.path');
                const testTs = 'db://assets/altas-bundle/test-atlas-config.ts';
                it('未配置脚本编辑器', async () => {
                    hasScriptEditor && (await Editor.Profile.removeConfig('program', 'scriptEditor.path'));
                    const res = await Editor.Message.request('asset-db', 'open-asset', testTs);
                    expect(res).equal(true);
                });
                if (hasScriptEditor) {
                    it('已配置脚本编辑器', async () => {
                        const res = await Editor.Message.request('asset-db', 'open-asset', testTs);
                        expect(res).equal(true);
                    });
                }
            });
        }

        it('打开图片', async () => {
            const res = await Editor.Message.request('asset-db', 'open-asset', 'db://internal/default_ui/default_btn_pressed.png');
            expect(res).equal(true);
        });

        it('不允许打开内置模板的 scene', async () => {
            const res = await Editor.Message.request('asset-db', 'open-asset', 'db://internal/default_file_content/scene/default.scene');
            expect(res).equal(false);
        });
        it('不允许打开内置模板的 prefab', async () => {
            const res = await Editor.Message.request('asset-db', 'open-asset', 'db://internal/default_file_content/prefab/default.prefab');
            expect(res).equal(false);
        });
    });

    describe('batch-message-handler', async () => {
        // 批量资源操作

        const testList = ['b5b27ab1-e740-4398-b407-848fc2b2c897', '1263d74c-8167-4928-91a6-4e2672411f47'];
        const testResult = ['db://internal/Default-Particle.png', 'db://internal/primitives.fbx'];

        const res = await Editor.Message.request('asset-db', 'batch-message-handler', testList.map((uuid) => {
            return {
                name: 'query-url',
                args: [uuid],
            };
        }));

        expect(res).to.has.members(testResult);
    });

    describe('generate-available-url', () => {
        // 类似 getName 的作用

        it('db://internal/default_ui 作为目标路径自动更名', async () => {
            const testUrl = 'db://internal/default_ui';
            const validUrl = await Editor.Message.request('asset-db', 'generate-available-url', testUrl);
            expect(testUrl).not.equal(validUrl);
        });
    });

    describe('update-default-user-data', () => {
        const defaultMetaPath = join(Editor.Project.path, '.creator/default-meta.json');
        let testImageType = 'texture';
        let testTrimType = 'none';
        if (existsSync(defaultMetaPath)) {
            describe('获取用户本地导入配置数据，验证接口查询结果适合正常', async () => {
                const info = readJsonSync(defaultMetaPath);
                const assetConfigMap = await Editor.Message.request('asset-db', 'query-asset-config-map');
                Object.keys(info).forEach((assetHandlerName) => {
                    if (!assetConfigMap[assetHandlerName] || !Object.keys(info[assetHandlerName])) {
                        return;
                    }
                    Object.keys(info[assetHandlerName]).forEach((type) => {
                        const { userDataConfig } = assetConfigMap[assetHandlerName];
                        it(`验证 ${assetHandlerName} ${type} 的默认值 ${userDataConfig[type].default} 是否与用户文件内容 ${info[assetHandlerName][type]}一致 `, (() => {
                            expect(userDataConfig[type].default).to.equal(info[assetHandlerName][type]);
                        }));
                    });
                });

                // 根据用户本地配置，修改类型，方便验证是否正确修改
                if (info.image?.type === testImageType) {
                    testImageType = 'sprite-frame';
                }
                if (info['sprite-frame']?.trimType === testTrimType) {
                    testTrimType = 'custom';
                }
            });
        }

        describe(`更新 image 的默认导入类型为 ${testImageType}`, async () => {
            await Editor.Message.request('asset-db', 'update-default-user-data', 'image', 'type', testImageType);

            it(`验证拷贝的 image 的导入类型为 ${testImageType}`, async () => {
                // 拷贝一张图到编辑器内并导入，获取到的导入类型与配置的一致
                const testImage = await Editor.Message.request('asset-db', 'query-path', 'db://internal/default_ui/default_btn_disabled.png');
                const testImageDest = join(databasePath, 'testImage.png');
                await copy(testImage, testImageDest);
                await Editor.Message.request('asset-db', 'refresh-asset', testImageDest);
                const assetMeta = await Editor.Message.request('asset-db', 'query-asset-meta', testImageDest);
                expect(assetMeta.userData.type).equal(testImageType);
            });

            it('验证实际写入文件的内容修改正常', () => {
                expect(readJSONSync(defaultMetaPath).image.type).equal(testImageType);
            });
        });

        describe(`更新 sprite-frame 的 trim type 类型为 ${testTrimType}`, async () => {
            await Editor.Message.request('asset-db', 'update-default-user-data', 'sprite-frame', 'trimType', testTrimType);
            it('验证实际写入文件的内容修改正常', () => {
                expect(readJSONSync(defaultMetaPath)['sprite-frame'].trimType).equal(testTrimType);
            });
        });
    });

    // 旧版本使用，新版本已不再使用
    // describe('refresh-default-user-data-config', () => {
        
    // });

    // init-asset create-asset-dialog
    // update-config
});