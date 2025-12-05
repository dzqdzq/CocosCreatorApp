'use strict';

interface WhenParam {
    PanelName?: string;
    EditMode?: string;
}

/**
 * 解析 when 参数
 * when 的格式：
 *     PanelName === '' && EditMode === ''
 * 整理后的数据格式：
 *     {
 *         PanelName: '',
 *         EditMode: '',
 *     }
 */
export function when(when: string): WhenParam {
    if (typeof when !== 'string') {
        return {};
    }

    const result: {[key: string]: string} = {};

    const results = when.split('&&');
    results.forEach((str) => {
        try {
            const array = str.match(/ ?(\S+) ?!?=+ ?(\S+) ?/);
            if (array && array[1] && array[2]) {
                result[array[1]] = eval(array[2]);
            }
        } catch (error) {
            console.error(error);
        }
    });

    return result;
}

/**
 * 判断一个 when 数据是否符合当前条件
 * @param when 
 */
export function checkWhen(when: string): boolean {
    if (!when) {
        return true;
    }
    if (typeof when !== 'string') {
        return false;
    }

    const $panel = require('@editor/panel');
    const $focusPanel = $panel.getFocusPanel();

    // eval 里需要使用这些参数
    const EditMode = Editor.EditMode.getMode();
    const PanelName = $focusPanel.current;

    try {
        return eval(when);
    } catch (error) {
        console.error(error);
        return false;
    }
}
