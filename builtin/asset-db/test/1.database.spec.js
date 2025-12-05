'use strict';

const { expect } = require('chai');
const { join } = require('path');

describe('测试 DB 中 Database 的 IPC 接口：', () => {
    // 以下对应功能代码 asset-db/index.ts 上的接口顺序

    // ------ 数据库
    describe('------ 数据库', () => {
        describe('refresh, query-ready ：刷新数据库', () => {
            let interrupt = false;
            it('当前数据库已经准备就绪', async () => {
                const ready = await Editor.Message.request('asset-db', 'query-ready');
                interrupt = !ready;
                expect(ready).to.be.true;
            });

            it('刷新数据库', async function() {
                this.timeout(20000);
                if (interrupt) {
                    throw new Error('数据库没有就绪，无法进行刷新测试');
                }
                Editor.Message.request('asset-db', 'refresh');
                const ready = await Editor.Message.request('asset-db', 'query-ready');
                expect(ready).to.be.false;

                return new Promise((resolve, reject) => {
                    /**
                     * 等待数据库刷新完成
                     */
                    async function start() {
                        const ready = await Editor.Message.request('asset-db', 'query-ready');
                        if (ready) {
                            return resolve();
                        }
                        return await start();
                    }
                    return start();
                });
            });
        });

        describe('query-db-info ：查询数据库信息', async () => {
            it('传入错误的参数', async function() {
                const queue = [
                    { args: undefined, expect: null },
                    { args: null, expect: null },
                    { args: '', expect: null },
                    { args: 0, expect: null },
                    { args: false, expect: null },
                    { args: true, expect: null },
                    { args: [], expect: null },
                    { args: {}, expect: null },
                    { args: () => { }, expect: null },
                    { args: 'abc', expect: null },
                    { args: 123, expect: null },
                ];

                for (const test of queue) {
                    try {
                        const result = await Editor.Message.request('asset-db', 'query-db-info', test.args);
                        expect(result).to.equal(test.expect);
                    } catch (error) {
                        expect(null).to.equal(test.expect);
                    }
                }
            });

            it('传入正确的参数', async () => {
                const keys = [
                    'alwaysStat', 'binaryInterval', 'followSymlinks', 'ignoreFiles', 'ignoreGlob',
                    'interval', 'level', 'library', 'name',
                    'readonly', 'target', 'temp', 'usePolling', 'visible',
                ];

                const queue = [
                    {
                        args: 'assets',
                        expect: {
                            keys,
                            values: {
                                alwaysStat: true,
                                binaryInterval: 1000,
                                followSymlinks: false,
                                interval: 500,
                                // level: 3,
                                library: join(Editor.Project.path, 'library'),
                                name: 'assets',
                                project: Editor.Project.path,
                                readonly: false,
                                target: join(Editor.Project.path, 'assets'),
                                temp: join(Editor.Project.path, 'temp/asset-db/assets'),
                                usePolling: false,
                                visible: true,
                            },
                        },
                    },
                ];

                for (const test of queue) {
                    const result = await Editor.Message.request('asset-db', 'query-db-info', test.args);

                    expect(result).to.include.keys(test.expect.keys);
                    for (const key of test.expect.keys) {
                        if (!(key in test.expect.values)) {
                            continue;
                        }
                        expect(result[key]).to.equal(test.expect.values[key]);
                    }
                }
            });
        });
    });
});
