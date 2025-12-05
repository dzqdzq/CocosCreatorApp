const { checkStartScene, checkConflict, generateNewOutputName } = require('../dist/share/common-options-validator');
const { getTaskLogDest } = require('../dist/share/utils');
const { join } = require('path');
const { expect } = require('chai');

describe('构建输出目录校验工具', () => {
    const buildPath = join(Editor.Project.path, 'build');
    const buildPathDict = {
        [buildPath]: [
            'web-mobile-002',
            'web-desktop',
            'web-desktop-001',
        ],
    };
    const platform = 'web-desktop';
    let destOutputName = 'web-desktop-002';
    it('输出目录和已有任务的目录不冲突', () => {
        const res = checkConflict(buildPath, destOutputName, buildPathDict);
        expect(res).to.be.false;
    });
    it('输出目录和已有任务的目录冲突', () => {
        destOutputName = 'web-desktop-001';
        const res = checkConflict(buildPath, destOutputName, buildPathDict);
        expect(res).to.be.true;
    });
    it('生成新的构建输出目录', () => {
        const outputName = generateNewOutputName(buildPath, platform, buildPathDict);
        expect(outputName).to.be.equal('web-desktop-002');
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

describe('getTaskLogDest', () => {
    const logDest = getTaskLogDest('test', 1553068800000);
    expect(logDest).to.be.equal('project://temp/builder/log/test2019-3-20 16-00.log');
});
