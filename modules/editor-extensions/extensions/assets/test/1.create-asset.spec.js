'use strict';

const { expect } = require('chai');
const menu = require('@base/electron-menu');

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms || 200);
    });
}

describe('测试 Assets 面板上的 UI 元素', () => {

    [
        { index: 0, zh: '文件夹', en: 'Folder' },
        { index: 2, zh: '场景文件', en: 'Scene' },
        { index: 4, zh: 'TypeScript', en: 'TypeScript' },
        { index: 6, zh: 'JavaScript', en: 'JavaScript' },
        { index: 8, zh: 'Material', en: 'Material' },
        { index: 9, zh: 'CubeMap', en: 'CubeMap' },
        { index: 11, zh: 'Effect', en: 'Effect' },
        { index: 13, zh: 'Animation Clip', en: 'Animation Clip' },
        { index: 15, zh: 'Auto Atlas', en: 'Auto Atlas' },
    ].forEach((item) => {
        describe(`选中第一个数据库并创建新的 ${item.en}`, async () => {
            await Editor.Panel.open('assets');

            const testName = `___00000000000.${item.index}`;

            const assetsSelector = Tester.Dom.selector('assets');
            assetsSelector
                .find('.content')
                .find('ui-drag-area')
                .find('ui-drag-item')
                .eq(0);

            after(async () => {
                try {
                    await Editor.Message.request('asset-db', 'delete-asset', `db://assets/${testName}`);
                } catch (error) {}
            });

            it('点击元素，检查选中状态', async () => {
                // 查找到的元素个数不能为 0
                const length = await assetsSelector.length();
                expect(length).not.equal(0);

                // 点击 assets 数据库
                await assetsSelector.click();
                const active = await assetsSelector.attr('active') !== null;
                expect(active).to.equal(true);
            });

            it('在创建菜单里点击文件夹', async () => {
                const addSelector = Tester.Dom.selector('assets');
                addSelector
                    .find('.header')
                    .find('.i-add')
                    .eq(0);

                await addSelector.click();
                // 点击菜单第 0 个位置的按钮
                menu.click('0');
                await wait(1000);

                const inputSelector = Tester.Dom.selector('assets');
                inputSelector
                    .find('.content')
                    .find('ui-drag-area')
                    .eq(0)
                    .find('input');

                await inputSelector.click();
                await inputSelector.esc();
            });

            it(`创建一个资源，然后改名成 ${testName}`, async function() {
                this.timeout(15000);

                const addSelector = Tester.Dom.selector('assets');
                addSelector
                    .find('.header')
                    .find('.i-add')
                    .eq(0);

                await addSelector.click();
                // 点击菜单第 0 个位置的按钮
                menu.click('0');
                await wait(1000);

                const inputSelector = Tester.Dom.selector('assets');
                inputSelector
                    .find('.content')
                    .find('ui-drag-area')
                    .eq(0)
                    .find('input');

                await inputSelector.data('value', '');
                await inputSelector.input(testName);
                await inputSelector.enter();

                const testSelector = Tester.Dom.selector('assets');
                testSelector
                    .find('.content')
                    .find('ui-drag-area')
                    .find('ui-drag-item')
                    .eq(1);
                const text = await testSelector.data('innerText');
                expect(text).to.equal(testName);
            });

            // dialog 暂时无法测试，先不测试这个功能
            // it('删除创建的资源', async function() {
            //     const testSelector = Tester.Dom.selector('assets');
            //     testSelector
            //         .find('.content')
            //         .find('ui-drag-area')
            //         .find('ui-drag-item')
            //         .eq(1);

            //     let text = await testSelector.data('innerText');
            //     expect(text).not.equal(testName);

            //     await testSelector.rightClick();
            //     await wait(500);
            //     menu.click('7');
            //     await wait(1000);

            //     text = await testSelector.data('innerText');
            //     expect(text).not.equal(testName);
            // });
        });
    });

});

