const { expect } = require('chai');
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms || 200);
    });
}
describe('构建面板选项 UI 点击测试', () => {
    before(async () => {
        // 先关闭窗口防止现有的界面信息对测试造成影响
        // await Editor.Panel.close('builder');
        await Editor.Panel.open('builder');
        await wait(1000);
        const panelSelector = Tester.Dom.selector('builder');

        await panelSelector.find('.toolbar').find('ui-button').click();
        await wait(500);
    });

    const $buildBtn = Tester.Dom.selector('builder')
        .find('.settings')
        .find('footer')
        .find('ui-button');

    describe('outputName 更改名称测试', () => {
        const $inputProp = Tester.Dom.selector('builder')
            .find('.settings')
            .find('section')
            .find('ui-prop')
            .eq(0);
        const $input = Tester.Dom.selector('builder')
            .find('.settings')
            .find('section')
            .find('ui-prop')
            .eq(0).find('ui-input');

        describe('输入中文测试', async () => {
            await $input.data('value', '');
            // await $input.click();
            await $input.input('这里是中文');
            await $input.enter();
            wait(1000);
            const error = await $inputProp.attr('error');
            const title = await $input.attr('title');
            const disabled = await $buildBtn.attr('disabled');
            it('显示红色错误', () => {
                expect(error).to.be.ok;
            });
            it('title 上显示对应错误信息', () => {
                expect(title).to.be.ok;
            });
            it('构建按钮不可点击', () => {
                expect(disabled).to.be.ok;
            });
        });

        // 这一步也是为了恢复整体的正常效果防止对后续其他项目的测试造成干扰
        describe('输入正常任务名', async () => {
            wait(1000);
            await $input.data('value', '');
            // await $input.click();
            await $input.input('taskName');
            await $input.enter();
            wait(1000);
            const error = await $inputProp.attr('error');
            const title = await $input.attr('title');
            const disabled = await $buildBtn.attr('disabled');
            it('本地构建设置信息成功存储', async () => {
                const value = await Editor.Profile.getConfig('builder', 'common.taskName');
                expect(value).to.be.equal('taskName');
            });
            it('红色错误显示效果清除', () => {
                expect(error).to.be.not.ok;
            });
            it('title 上无错误信息', () => {
                expect(title).to.be.not.ok;
            });
            it('构建按钮可点击', () => {
                expect(disabled).to.be.not.ok;
            });
        });
    });
    // describe('name 更改名称测试', () => {
    //     const $inputProp = Tester.Dom.selector('builder')
    //                                 .find('.settings')
    //                                 .find('section')
    //                                 .find('ui-prop')
    //                                 .eq(1);
    //     const $input = Tester.Dom.selector('builder')
    //                             .find('.settings')
    //                             .find('section')
    //                             .find('ui-prop')
    //                             .eq(1).find('ui-input');

    //     describe('输入中文测试', async () => {
    //         await $input.data('value', '');
    //         await $input.input('这里是中文Name');
    //         await $input.enter();
    //         wait(1000);
    //         const error = await $inputProp.attr('error');
    //         const title = await $input.attr('title');
    //         const disabled = await $buildBtn.attr('disabled');
    //         it('本地构建设置信息成功存储', async () => {
    //             const value = await Editor.Profile.getConfig('builder', 'common.name');
    //             expect(value).to.be.equal('这里是中文Name');
    //         });
    //         it('显示红色错误', () => {
    //             expect(error).to.be.ok;
    //         });
    //         it('title 上显示对应错误信息', () => {
    //             expect(title).to.be.ok;
    //         });
    //         it('构建按钮不可点击', () => {
    //             expect(disabled).to.be.ok;
    //         });
    //     });

    //     describe('输入正常游戏名称', async () => {
    //         await $input.data('value', '');
    //         await $input.input('name');
    //         await $input.enter();
    //         wait(1000);
    //         const error = await $inputProp.attr('error');
    //         const title = await $input.attr('title');
    //         const disabled = await $buildBtn.attr('disabled');
    //         it('红色错误显示效果清除', () => {
    //             expect(error).to.be.not.ok;
    //         });
    //         it('title 上无错误信息', () => {
    //             expect(title).to.be.not.ok;
    //         });
    //         it('构建按钮可点击', () => {
    //             expect(disabled).to.be.not.ok;
    //         });
    //     });
    // });

});
