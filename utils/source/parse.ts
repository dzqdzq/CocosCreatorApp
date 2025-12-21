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

/**
 * return result of versionMax > versionMin，其中仅支持纯数字版本，最高支持三位数版本号：333.666.345
 * @example (3.6.2, 3.7.0) => false; (3.9.0, 3.8.0) => true; (3.8.0, 3.8.0) => false;
 * @param versionMax
 * @param versionMin
 * @param split
 */
export function compareVersion(versionMax: string, versionMin: string, split = '.') {
    if (typeof versionMax !== 'string' || typeof versionMin !== 'string') {
        throw new Error(`invalid param: ${versionMax}, ${versionMin}`);
    }
    versionMax = versionMax.replace(split, '').padStart(3, '0');
    versionMin = versionMin.replace(split, '').padStart(3, '0');
    return Number(versionMax) > Number(versionMin);
}
