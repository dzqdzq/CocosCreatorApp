const { readJSONSync, existsSync, emptyDirSync } = require('fs-extra');
const { expect } = require('chai');
const { checkHasError } = require('./../dist/share/utils');

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
});
