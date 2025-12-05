// 生成测试需要的模拟数据方法

// {
//     // 带有分量轨道、图片轨道、基本类型轨道的动画数据
//     pathsDump: { },
//     menu: [],
// }
const ps = require('path');
const fse = require('fs-extra');
const TEST_DATA_DEST = ps.join(__dirname, 'mock-data.json');

async function getMockData() {
    if (!(await fse.pathExists(TEST_DATA_DEST))) {
        return {};
    }
    try {
        return await fse.readJSON(TEST_DATA_DEST);
    } catch (error) {
        console.warn(error);
        return {};
    }
}

async function outputMockData(json) {
    return await fse.outputJSON(TEST_DATA_DEST, json, {
        spaces: 4,
    });
}

function generateMockData() {
    return {
        pathsDump: AnimationEditor.animationCtrl.clipsDump.pathsDump,
        menu: AnimationEditor.animationCtrl.vm.propertiesMenu,
        curvesDump: AnimationEditor.animationCtrl.__copyNodeInfo,
    };
}
exports.outputMockData = function () {
    return outputMockData(generateMockData());
};

exports.getMockData = getMockData;
