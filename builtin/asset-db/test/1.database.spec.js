'use strict';

const { expect } = require('chai');
const { join } = require('path');

describe('测试 DB 中 Database 的 IPC 接口：', () => {
    // 以下对应功能代码 asset-db/index.ts 上的接口顺序

    // ------ 数据库
    describe('数据库查询相关接口', () => {
        describe('query-db-list', async () => {
            const result = await Editor.Message.request('asset-db', 'query-db-list');
            expect(result).to.be.an('array');
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

            describe('传入正确的参数', async () => {
                const keys = [
                    'name', 'target', 'readonly', 'temp',
                    'library', 'level', 'ignoreGlob', 'ignoreFiles',
                    'visible', 'state', 'preImportExtList', 'flags',
                ];

                const queue = [
                    {
                        args: 'assets',
                        expect: {
                            keys,
                            values: {
                                library: join(Editor.Project.path, 'library'),
                                name: 'assets',
                                readonly: false,
                                target: join(Editor.Project.path, 'assets'),
                                temp: join(Editor.Project.path, 'temp/asset-db/assets'),
                                visible: true,
                            },
                        },
                    },
                ];

                for (const test of queue) {
                    const result = await Editor.Message.request('asset-db', 'query-db-info', test.args);
                    it('验证查询结果是否正常', () => {
                        expect(result).to.include.keys(test.expect.keys);
                    });
                    for (const key of test.expect.keys) {
                        if (!(key in test.expect.values)) {
                            continue;
                        }
                        it(`验证 ${key} 的结果是否等于 ${test.expect.values[key]}`, () => {
                            expect(result[key]).to.equal(test.expect.values[key]);
                        });
                    }
                }
            });
        });
    });
    describe('数据库操作相关接口', () => {
        describe('暂停恢复数据库相关', () => {
            let isResume = false;
            let pauseState = '';
            function onResume() {
                isResume = true;
            }
            function onPause(state) {
                pauseState = state;
            }
            before(() => {
                Editor.Message.addBroadcastListener('asset-db:resume', onResume);
                Editor.Message.addBroadcastListener('asset-db:pause', onPause);
            });

            it('is-busy', async () => {
                const isBusy = await Editor.Message.request('asset-db', 'is-busy');
                expect(isBusy).to.be.false;
            });
            describe('pause', async () => {
                const pauseSuccess = await Editor.Message.request('asset-db', 'pause', 'test');
                it('正常执行并收到操作的消息回调', () => {
                    expect(pauseSuccess).to.be.true;
                });
                setTimeout(() => {
                    it('收到 pause 广播', () => {
                        expect(pauseState).to.equal('test');
                    });
                }, 500);
            });
            describe('resume', async () => {
                const resumeSuccess = await Editor.Message.request('asset-db', 'resume');
                if (resumeSuccess) {
                    const isBusy = await Editor.Message.request('asset-db', 'is-busy');
                    expect(isBusy).to.be.false;
                }
                it('正常执行并收到操作的消息回调', () => {
                    expect(resumeSuccess).to.be.true;
                });
                it('收到 pause 广播', () => {
                    expect(isResume).to.be.true;
                });
            });

            after(() => {
                Editor.Message.removeBroadcastListener('asset-db:resume', onResume);
                Editor.Message.removeBroadcastListener('asset-db:pause', onPause);
            });
        });

        if (Editor.Project.name === 'build-example') {
            describe('start db', async () => {
                await Editor.Message.request('asset-db', 'start-db', {
                    name: 'test',
                    target: join(Editor.Project.path, 'test-asset-db'),
                    readonly: false,
                    visible: true,
                });
                const info = await Editor.Message.request('asset-db', 'query-db-info', 'test');
                it('正常查询到新开启的数据库 test', () => {
                    expect(info.name).to.equal('test');
                });
            });
    
            describe('stop db', async () => {
                await Editor.Message.request('asset-db', 'stop-db', 'test');
                const info = await Editor.Message.request('asset-db', 'query-db-info', 'test');
                it('关闭后无法查询到新开启的数据库 test', () => {
                    expect(info).not.exist;
                });
            });
        }

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
                it('刷新数据库时，ready = false', () => {
                    expect(ready).to.be.false;
                });

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
    });
});
