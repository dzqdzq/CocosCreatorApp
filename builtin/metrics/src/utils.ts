import { join } from 'path';

module.paths.push(join(Editor.App.path, 'node_modules'));

import * as windows from '@base/electron-windows';

import { Display, screen } from 'electron';
import { winBounds } from './interface';

const md5: (str: string) => string = require('md5');
const getmac = require('getmac');

/**
 * 获取当前客户端的 cid
 */
export async function getClientID(): Promise<string> {
    // @ts-ignore
    return new Promise((resolve) => {
        try {
            const macAddress = getmac.default();
            return resolve(md5(macAddress));
        } catch (error) {
            console.debug(error);
            const nwInfo = require('os').networkInterfaces();
            for (const category in nwInfo) {
                if (!category) {
                    continue;
                }
                const infoArr = nwInfo[category];
                for (let i = 0; i < infoArr.length; ++i) {
                    const info: {internal: string, mac: string} = infoArr[i];
                    if (!info.internal && info.mac) {
                        return resolve(md5(info.mac));
                    }
                }
            }
            return resolve(md5('00:00:00:00:00:00'));
        }
    });
}

export function formatBytes(bytes: number, decimals = 3) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function valueInvalid(value: any) {
    return value === undefined || value === null;
}

export function getMainDisplay(): Display {
    const mainUUID = windows.uuids[0];
    const mainWin = windows.uuid2win[mainUUID];
    let display = null;
    if (mainWin) {
        const mainBounds = mainWin.getBounds() as winBounds;
        const displays = screen.getAllDisplays();

        // 用主窗口左上角的点判断是否在某个窗口内
        // +2 是因为左右撑满的时候，x 会小 1-2 像素，原因未知
        for (let i = 0; i < displays.length; i++) {
            const displayBounds = displays[i].bounds as winBounds;
            if (
                mainBounds.x > displayBounds.x &&
                mainBounds.y > displayBounds.y &&
                mainBounds.x < displayBounds.x + displayBounds.width &&
                mainBounds.y < displayBounds.y + displayBounds.height
            ) {
                display = displays[i];
                break;
            }
        }
        // 左上的点没有命中的话，使用右上角的点继续判断
        if (!display) {
            for (let i = 0; i < displays.length; i++) {
                const displayBounds = displays[i].bounds as winBounds;
                if (
                    mainBounds.x + mainBounds.width > displayBounds.x &&
                    mainBounds.y > displayBounds.y &&
                    mainBounds.x + mainBounds.width < displayBounds.x + displayBounds.width &&
                    mainBounds.y < displayBounds.y + displayBounds.height
                ) {
                    display = displays[i];
                    break;
                }
            }
        }
    }
    // 如果都没有命中，则拿系统默认的主窗口
    if (!display) {
        display = screen.getPrimaryDisplay();
    }
    return display;
}
