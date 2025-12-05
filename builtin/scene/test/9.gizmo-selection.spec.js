'use strict';

const { assert } = require('chai');
const GizmoSelectionLogic = require('../dist/script/public/selection/gizmo-selection-logic').default;

describe('gizmo-selection的单选/多选/框选/反选以及按下meta键的正确性测试', () => {
    const selection = new GizmoSelectionLogic();
    // 以数字模拟场景中节点
    const items = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    // 表示items某个索引是否被选中，默认都未选中
    const currents = new Array(items.length).fill(false);
    // 预期对照组
    const expect = new Array(items.length).fill(false);

    function select(shouldSelects) {
        if (shouldSelects.length > 0) {
            console.log(`选中${shouldSelects}`);
        }
        for (const item of shouldSelects) {
            currents[parseInt(item)] = true;
            selection.selected.add(item);
        }
    }

    function unselect(shouldUnselects) {
        if (shouldUnselects.length > 0) {
            console.log(`取消选中${shouldUnselects}`);
        }
        for (const item of shouldUnselects) {
            currents[parseInt(item)] = false;
            selection.selected.delete(item);
        }
    }

    const beforeEach = () => {
        currents.fill(false);
        expect.fill(false);
        selection.clear();
        console.log('============================================================');
    };

    const process = (items, metaKey) => {
        const pr = selection.process(items, metaKey);
        select(Array.from(pr.shouldSelects));
        unselect(Array.from(pr.shouldUnselects));
    };

    const assertFun = () => assert.sameOrderedMembers(currents, expect);

    describe('常规框选', async () => {
        beforeEach();

        process(items.slice(0, 0));
        assertFun();

        expect[0] = true;
        process(items.slice(0, 1));
        assertFun();

        expect[1] = true;
        process(items.slice(0, 2));
        assertFun();

        expect[2] = true;
        process(items.slice(0, 3));
        assertFun();

        expect[3] = true;
        process(items.slice(0, 4));
        assertFun();

        expect[3] = false;
        process(items.slice(0, 3));
        assertFun();

        expect[2] = false;
        process(items.slice(0, 2));
        assertFun();

        expect[1] = false;
        process(items.slice(0, 1));
        assertFun();

        expect[0] = false;
        process(items.slice(0, 0));
        assertFun();
    });

    describe('按下MetaKey的框选', async () => {
        beforeEach();
        process(['0', '3']);
        expect[0] = true;
        expect[3] = true;
        assertFun();
        selection.confirm();

        process(items.slice(0, 0), true);
        process(items.slice(0, 0), true);
        process(items.slice(0, 0), true);
        assertFun();

        process(items.slice(0, 1), true);
        expect[0] = false;
        assertFun();

        process(items.slice(0, 2), true);
        expect[1] = true;
        assertFun();

        process(items.slice(0, 3), true);
        process(items.slice(0, 3), true);
        process(items.slice(0, 3), true);
        expect[2] = true;
        assertFun();

        process(items.slice(0, 4), true);
        process(items.slice(0, 4), true);
        expect[3] = false;
        assertFun();

        process(items.slice(0, 3), true);
        process(items.slice(0, 3), true);
        process(items.slice(0, 3), true);
        expect[3] = true;
        assertFun();

        process(items.slice(0, 4), true);
        expect[3] = false;
        assertFun();

        process(items.slice(0, 2), true);
        expect[2] = false;
        expect[3] = true;
        assertFun();
    });

    describe('当已有选择项时，常规框选应反选所有已选择', async () => {
        beforeEach();
        process(items);
        expect.fill(true);
        assertFun();
        selection.confirm();

        process(items.slice(0, 0));
        expect.fill(false);
        assertFun();

        process(items.slice(0, 1));
        expect[0] = true;
        assertFun();
    });

    describe('点击单选', async () => {
        beforeEach();
        process(items);
        expect.fill(true);
        assertFun();
        selection.confirm();

        process([items[4]]);
        expect.fill(false);
        expect[4] = true;
        assertFun();
        selection.confirm();

        process([items[5]]);
        expect[4] = false;
        expect[5] = true;
        assertFun();
        selection.confirm();

        process([items[4]], true);
        expect[4] = true;
        assertFun();
        selection.confirm();
    });

    after(() => {
        console.log('============================================================');
    });
});
