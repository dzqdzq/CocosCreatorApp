'use strict';

import { ensureDirSync, copy as copyExtra, copySync as copySyncExtra, remove, readdirSync, lstatSync, chmodSync, existsSync } from 'fs-extra';
import { spawn } from 'child_process';
import { basename, dirname, extname, join } from 'path';

/**
 * 初始化一个可用的文件名
 * Initializes a available filename
 * 返回可用名称的文件路径
 * Returns the file path with the available name
 * 
 * @param file 初始文件路径 Initial file path
 */
export function getName(file: string): string {
    if (!existsSync(file)) {
        return file;
    }

    const dir = dirname(file);
    const ext = extname(file);
    let name = basename(file, ext);

    do {
        if ((/(\d+)$/.test(name))) {
            name = name.replace(/(\d+)$/, (strA: string, strB: string) => {
                let num = parseInt(strB, 10);
                num += 1;
                // @ts-ignore
                num = num.toString().padStart(strB.length, '0');
                return num + '';
            });
        } else {
            name += '-001';
        }

        file = join(dir, name);
    } while (existsSync(file + ext));

    return file + ext;
}

/**
 * mac 上的解压方法
 */
const unzipOfDarwin = function(src: string, dist: string, callback: Function) {
    const path = dirname(dist);
    ensureDirSync(path);

    // @ts-ignore
    const child = spawn('unzip', [
        src,
        '-d', dist,
    ]);

    let errText = '';
    // @ts-ignore
    child.stderr.on('data', (data) => {
        errText += data;
    });
    let text = '';
    // @ts-ignore
    child.stdout.on('data', (data) => {
        text += data;
    });
    // @ts-ignore
    child.on('close', (code) => {
        if (text) {
            console.log(text);
        }
        if (errText) {
            console.warn(errText);
        }
        // code == 0 测试通过，其余的为文件有问题
        let error = null;
        if (code !== 0) {
            error = new Error('The decompression has failed');
        }
        callback(error);
    });
};

/**
 * windows 上的解压方法
 * @param src 
 * @param dist 
 * @param callback 
 */
const unzipOfWin32 = function(src: string, dist: string, callback: Function) {
    const path = dirname(dist);
    ensureDirSync(path);

    const child = spawn(join(Editor.App.path, '../tools/unzip.exe'), [
        src,
        '-d', dist,
    ]);

    let errText = '';
    // @ts-ignore
    child.stderr.on('data', (data: string) => {
        errText += data;
    });
    let text = '';
    // @ts-ignore
    child.stdout.on('data', (data: string) => {
        text += data;
    });
    child.on('close', (code: number) => {
        if (text) {
            console.log(text);
        }
        if (errText) {
            console.warn(errText);
        }
        // code == 0 测试通过，其余的为文件有问题
        let error = null;
        if (code !== 0) {
            error = new Error('The decompression has failed');
        }
        callback(error);
    });
};

interface UnzipOptions {
    // 如果压缩包内有独立的一个文件夹，则去除这个层级
    peel?: boolean;
}

/**
 * 解压文件夹
 * Unzip folder
 * 
 * @param zip 
 * @param target 
 * @param options 
 */
export async function unzip(zip: string, target: string, options: UnzipOptions = {}) {
    let unzip: Function;
    if (process.platform === 'win32') {
        unzip = unzipOfWin32;
    } else {
        unzip = unzipOfDarwin;
    }

    const temp = join(Editor.Project.tmpDir, '.utils_temp', basename(zip, '.zip'));
    await remove(temp);
    await new Promise<void>((resolve, reject) => {
        unzip(zip, temp, (error: Error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    });

    if (options.peel) {
        const list = readdirSync(temp);
        if (list.length === 1) {
            await copyExtra(join(temp, list[0]), target);
        } else {
            await copyExtra(temp, target);
        }
    } else {
        await copyExtra(temp, target);
    }
    await remove(temp);
}

/**
 * 复制一个文件到另一个位置
 * Copy a file to another location
 * 
 * @param source 
 * @param target 
 */
export function copy(source: string, target: string) {
    /**
     * asar 里不能复制文件夹，需要用 mkdir 创建
     */
    function step(src: string, dist: string) {
        if (!existsSync(src)) {
            return;
        }
        const fileStat = lstatSync(src);
        if (fileStat.isDirectory()) {
            ensureDirSync(dist);
            if (!fileStat.isSymbolicLink()) chmodSync(dist, 511);
            const list = readdirSync(src);
            for (const name of list) {
                step(join(src, name), join(dist, name));
            }
        } else {
            copySyncExtra(src, dist);
            if (!fileStat.isSymbolicLink()) chmodSync(dist, 511);
        }
    }

    step(source, target);
}

/**
 * 将文件或文件移动到回收站
 * @param file 
 */
export async function trashItem(file: string) {
    if (process.type === 'browser') {
        const { shell } = require('electron');
        await shell.trashItem(file);
    } else {
        const { shell } = require('@electron/remote');
        await shell.trashItem(file);
    }
}