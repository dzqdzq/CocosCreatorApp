const { readJSONSync, existsSync, emptyDirSync } = require('fs-extra');
const { expect } = require('chai');
const { checkHasError, defaultsDeep } = require('./../dist/share/utils');
const { checkStartScene } = require('./../dist/share/common-options-validator');

describe('构建工具函数的基本使用', () => {
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
});
