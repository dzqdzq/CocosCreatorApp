const { expect } = require('chai');
const shareUtils = require('../dist/panel/utils');
const { getMockData } = require('./tools/generate-mock-data');

describe('动画编辑器数据转换方法', async () => {
    const dumps = await getMockData();
    describe('transFrameByType 根据指定的显示类型计算实际的显示结果字符串', () => {
        it('type = frame', () => {
            expect(shareUtils.transFrameByType(0, 'frame')).to.equal('0');
        });

        // time
        it('type = time, frame = 0', () => {
            expect(shareUtils.transFrameByType(0, 'time')).to.equal('0-00');
        });
        it('type = time, frame = -12', () => {
            expect(shareUtils.transFrameByType(-12, 'time')).to.equal('-0-12');
        });
        it('type = time, frame = 12', () => {
            expect(shareUtils.transFrameByType(12, 'time')).to.equal('0-12');
        });
        it('type = time, frame = -32, sample = 10', () => {
            expect(shareUtils.transFrameByType(-32, 'time', 10)).to.equal('-3-02');
        });
        it('type = time, frame = 32, sample = 10', () => {
            expect(shareUtils.transFrameByType(32, 'time', 10)).to.equal('3-02');
        });

        // time_s
        it('type = time_s, frame = 0', () => {
            expect(shareUtils.transFrameByType(0, 'time_s')).to.equal('0s');
        });
        it('type = time_s, frame = -12', () => {
            expect(shareUtils.transFrameByType(-12, 'time_s')).to.equal('-0.2s');
        });
        it('type = time_s, frame = 12', () => {
            expect(shareUtils.transFrameByType(12, 'time_s')).to.equal('0.2s');
        });
        it('type = time_s, frame = -32, sample = 10', () => {
            expect(shareUtils.transFrameByType(-32, 'time_s', 10)).to.equal('-3.2s');
        });
        it('type = time_s, frame = 32, sample = 10', () => {
            expect(shareUtils.transFrameByType(32, 'time_s', 10)).to.equal('3.2s');
        });
        it('type = time_s, frame = 1234, sample = 15 -> 显示分钟', () => {
            expect(shareUtils.transFrameByType(1234, 'time_s', 15)).to.equal('1m22.27s');
        });
    });
    describe('pickTargetCurveDump 筛选出数据中最符合指定节点指定属性轨道 key 的属性轨道数据', () => {
        const positionRes = shareUtils.pickTargetCurveDump({
            nodePath: '/Same Name',
            prop: 'position',
        }, dumps.pathsDump);
        const positionXRes = shareUtils.pickTargetCurveDump({
            nodePath: '/Same Name',
            prop: 'position.x',
        }, dumps.pathsDump);

    });
    describe('sortKeysToTreeMap 将关键帧数据，整理为按照节点属性轨道属性结构的对象', () => {

    });
    describe('propDataToCurveDump 将单个属性轨道数据转换为 curvesDump 的场景数据格式', () => {

    });
    describe('transCurveKeyToDumpKey 将界面使用的带 curve 的关键帧数据转换为场景需要的数据格式', () => {

    });
    describe('transDumpKeyToCurveKey 场景关键帧数据格式界面转换为使用的带 curve 的关键帧数据', () => {

    });
    describe('transCurveKeyToDumpKey 将界面使用的带 curve 的关键帧数据转换为场景需要的数据格式', () => {

    });
    describe('transDumpKeyToCurveKey 场景关键帧数据格式界面转换为使用的带 curve 的关键帧数据', () => {

    });
    describe('mockDumpToCtrl 将场景关键帧数据格式模拟为 ui-curve 组件需要的 ctrl 关键帧数据格式', () => {

    });
    describe('checkPropertyInMenu 检查指定的属性轨道是否存在在当前支持的属性菜单内', () => {

    });
    describe('sortMenuByProperties 根据已添加的属性轨道信息，对属性菜单做分类、禁用标记', () => {

    });
    describe('changeParentToPart 根据已添加的属性轨道信息，对属性菜单做分类、禁用标记', () => {

    });
});
