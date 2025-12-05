'use struct';

const { expect } = require('chai');
const { join } = require('path');
const { existsSync, statSync, readJSONSync, readFileSync, removeSync } = require('fs-extra');

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

        it('删除普通资源', async function() {
            await Editor.Message.request('asset-db', 'delete-asset', `db://assets/__asset-db-test__/${name}.normal3`, 'test');

            const exists = existsSync(join(databasePath, `${name}.normal3`));
            expect(exists).is.equal(false);

            const metaExists = existsSync(join(databasePath, `${name}.normal3.meta`));
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
        await Editor.Message.request('asset-db', 'refresh-all-database');

        expect(await result).to.be.true;
    });

    // reimport-asset
    // init-asset
    // open-asset
});
