const { expect } = require('chai');
const { checkHasError, defaultsDeep, defaultMerge, changeToLocalTime, getTaskLogDest, transTimeToNumber } = require('./../dist/share/utils');
const { checkStartScene } = require('./../dist/share/common-options-validator');
const { checkAssetWithFilterConfig, filterAssetWithBundleConfig } = require('../dist/worker/builder/utils/bundle');
const { basename } = require('path');

describe('构建工具函数的基本使用', () => {
    describe('changeToLocalTime', () => {
        it('changeToLocalTime', () => {
            const time = changeToLocalTime(1553068800000);
            expect(time).to.be.equal('2019-3-20 16:00:00');
        });
        it('transTimeToNumber', () => {
            const time = transTimeToNumber('bundle-build-2019-3-20 16-00.log');
            expect(time).to.be.equal(1553068800000);
        });
        it('getTaskLogDest', () => {
            const logDest = getTaskLogDest('test', 1553068800000);
            expect(logDest).to.be.equal('project://temp/builder/log/test2019-3-20 16-00.log');
        });
    });
    describe('checkHasError 校验是否含有错误信息', () => {
        // 测试一些非字符串嵌套深的数据校验是否有问题
        it('checkHasError 函数校验非字符串真值与假值', () => {
            const errorMap = {
                test: null,
                testOpt: {
                    test: undefined,
                    testOpt: {
                        test: '',
                        testOpt: {
                            test: 1,
                        },
                        testBoolean: true,
                    },
                    testArr: [null, undefined, 1, ''],
                },
            };
            expect(checkHasError(errorMap)).to.be.false;
        });
        it('checkHasError 函数校验字符串真值', () => {
            const errorMap = {
                test: null,
                testOpt: {
                    test: undefined,
                    testOpt: {
                        test: '',
                        testOpt: {
                            test: 1,
                            error: 'Error',
                        },
                        testBoolean: true,
                    },
                    testArr: [null, undefined, 1, ''],
                },
            };
            expect(checkHasError(errorMap)).to.be.true;
        });
    });
    describe('checkStartScene', () => {
        // 测试一些非字符串嵌套深的数据校验是否有问题
        it('checkStartScene 首场景不能在 bundle 内', async () => {
            const res = await checkStartScene('66352519-f4f6-443e-b7fb-016d2b29ab64');
            expect(res).to.be.false;
        });
        it('checkStartScene project 目录下', async () => {
            const res = await checkStartScene('42e68f34-5f5f-4a8a-938a-ec9d5fe61b0d');
            expect(res).to.be.true;
        });
    });
    describe('defaultsDeep 接口校验', () => {
        it('defaultsDeep 纯对象', () => {
            const testData = {
                a: 1,
                b: {
                    c: {
                        d: 3,
                        e: [2, 3],
                        r: true,
                    },
                    m: '',
                    g: false,
                },
                u: 'test',
                group: undefined,
            };
            const testDefaultData = {
                a: 44,
                b: {
                    c: {
                        d: 55,
                        e: [4, 5, 6, 7],
                        r: false,
                        f: '360',
                    },
                    m: 'ffff',
                    g: true,
                },
                c: 'default',
                j: {
                    f: '666',
                },
                group: {
                    test: ['test'],
                },
            };
            defaultsDeep(testData, testDefaultData);
            expect(testData.a).to.be.equal(1);
            expect(Array.isArray(testData.group.test)).to.be.true;
            expect(testData.c).to.be.equal('default');
            expect(testData.b.c.e[0]).to.be.equal(2);
            expect(testData.b.c.e.length).to.be.equal(2);
            expect(testData.b.c.r).to.be.true;
            expect(testData.b.g).to.be.false;
            expect(testData.b.m).to.be.equal('');
            expect(testData.u).to.be.equal('test');
            expect(testData.j.f).to.be.equal('666');
        });
    });
    describe('defaultMerge 接口校验', () => {
        it('defaultMerge 默认递归合并', () => {
            const target = {
                name: {
                    label: 'name',
                    render: {
                        ui: 'ui-input',
                    },
                    default: 'test-cases',
                    verifyRules: ['required', 'customNameCheck'],
                },
                server: {
                    label: 'server', 
                    description: 'remote_server_address',
                    render: {
                        ui: 'ui-input',
                    },
                },
            };
            const source1 = {
                name: {
                    label: 'name',
                    render: {
                        ui: 'ui-input',
                    },
                    default: 'test-cases',
                    verifyRules: ['testNameCheck'],
                },
            };
            const source2 = {
                server: {
                    label: 'server',
                    render: {
                        ui: 'ui-input',
                    },
                    verifyRules: ['http'],
                },
            };

            defaultMerge(target, source1, source2);
            expect(target.name.default).to.be.equal('test-cases');
            expect(target.name.verifyRules.length).to.be.equal(1);
            expect(target.server.description).to.be.equal('remote_server_address');
            expect(target.server.verifyRules.length).to.be.equal(1);
        });
    });
    describe('checkAssetWithFilterConfig', () => {
        const assetIncludeCheck = {
            type: 'asset',
            assets: ['123'],
            range: 'include',
        };
        const assetIncludeEmptyCheck = {
            type: 'asset',
            assets: [],
            range: 'include',
        };
        const assetExcludeCheck = {
            type: 'asset',
            assets: ['456'],
            range: 'exclude',
        };
        const urlIncludeCheck = {
            type: 'url',
            range: 'include',
            patchOption: {
                value: 'db://assets/Test/**/*',
                patchType: 'glob',
            },
        };
        const urlIncludeEmptyCheck = {
            type: 'url',
            range: 'include',
            patchOption: {
                value: '',
                patchType: 'glob',
            },
        };
        const urlExcludeCheck = {
            type: 'url',
            range: 'exclude',
            patchOption: {
                value: 'db://assets/Bundle/**/*',
                patchType: 'glob',
            },
        };

        const testAssets = [{
            url: 'db://assets/test/123.jpg',
            uuid: '123',
        },
        {
            url: 'db://assets/test/456.png',
            uuid: '456',
        },
        {
            url: 'db://assets/bundle/789.text',
            uuid: '789',
        },
        ];

        it('asset include', () => {
            const res = filterAssetWithBundleConfig(testAssets, [assetIncludeCheck]);
            expect(res.length).to.equal(1);
            expect(res[0].uuid).to.equal('123');
        });

        it('asset include empty 过滤无效', () => {
            const res = filterAssetWithBundleConfig(testAssets, [assetIncludeEmptyCheck]);
            expect(res.length).to.equal(testAssets.length);
        });
        it('asset exclude', () => {
            const res = filterAssetWithBundleConfig(testAssets, [assetExcludeCheck]);
            expect(res.length).to.equal(2);
        });
        it('url include empty 过滤无效', () => {
            const res = filterAssetWithBundleConfig(testAssets, [urlIncludeEmptyCheck]);
            expect(res.length).to.equal(testAssets.length);
        });
        it('url include', () => {
            const res = filterAssetWithBundleConfig(testAssets, [urlIncludeCheck]);
            expect(res.length).to.equal(2);
            expect(res[0].uuid).to.equal('123');
        });
        it('url exclude', () => {
            const res = filterAssetWithBundleConfig(testAssets, [urlExcludeCheck]);
            expect(res.length).to.equal(2);
            expect(res[0].uuid).to.equal('123');
        });
        it('url include endWith PNG', () => {
            const urlIncludeCheckEndWith = {
                type: 'url',
                range: 'include',
                patchOption: {
                    value: '.PNG',
                    patchType: 'endWith',
                },
            };
            const res = filterAssetWithBundleConfig(testAssets, [urlIncludeCheckEndWith]);
            expect(res.length).to.equal(1);
            expect(res[0].uuid).to.equal('456');
        });
        it('url exclude endWith PNG', () => {
            const urlExcludeCheckEndWith = {
                type: 'url',
                range: 'exclude',
                patchOption: {
                    value: '.PNG',
                    patchType: 'endWith',
                },
            };
            const res = filterAssetWithBundleConfig(testAssets, [urlExcludeCheckEndWith]);
            expect(res.length).to.equal(2);
            expect(res[1].uuid).to.equal('789');
        });
        it('url include contains tEst/456', () => {
            const urlIncludeCheckEndWith = {
                type: 'url',
                range: 'include',
                patchOption: {
                    value: 'tEst/456',
                    patchType: 'contain',
                },
            };
            const res = filterAssetWithBundleConfig(testAssets, [urlIncludeCheckEndWith]);
            expect(res.length).to.equal(1);
            expect(res[0].uuid).to.equal('456');
        });
        it('url exclude contains tEst/456', () => {
            const urlExcludeCheckEndWith = {
                type: 'url',
                range: 'exclude',
                patchOption: {
                    value: 'tEst/456',
                    patchType: 'contain',
                },
            };
            const res = filterAssetWithBundleConfig(testAssets, [urlExcludeCheckEndWith]);
            expect(res.length).to.equal(2);
            expect(res[1].uuid).to.equal('789');
        });

        it('url include beginWith DB://assets/bundle', () => {
            const urlIncludeCheckBeginWith = {
                type: 'url',
                range: 'include',
                patchOption: {
                    value: 'DB://assets/bundle',
                    patchType: 'beginWith',
                },
            };
            const res = filterAssetWithBundleConfig(testAssets, [urlIncludeCheckBeginWith]);
            expect(res.length).to.equal(1);
            expect(res[0].uuid).to.equal('789');
        });
        it('url exclude beginWith DB://assets/bundle', () => {
            const urlExcludeCheckBeginWith = {
                type: 'url',
                range: 'exclude',
                patchOption: {
                    value: 'DB://assets/test',
                    patchType: 'beginWith',
                },
            };
            const res = filterAssetWithBundleConfig(testAssets, [urlExcludeCheckBeginWith]);
            expect(res.length).to.equal(1);
            expect(res[0].uuid).to.equal('789');
        });
        it('allTestBundleConfig', () => {
            const allTestBundleConfig = [
                assetIncludeEmptyCheck,
                assetIncludeCheck,
                urlIncludeCheck,
                urlExcludeCheck,
            ];
            const res = filterAssetWithBundleConfig(testAssets, allTestBundleConfig);
            expect(res.length).to.equal(2);
            expect(res[0].url).to.equal(testAssets[0].url);
            expect(res[1].url).to.equal(testAssets[1].url);
        });
    });
});