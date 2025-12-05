'use strict';

var fs = require('fs');
var ps = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

class Profile {
    /** 获取上次烘焙结果的 uuid 列表 */
    static async getLatestLightmapResults(currentSceneUUID) {
        return await Editor.Profile.getProject('lightmap', `latestLightmapResultMap.${currentSceneUUID}.results`) ?? [];
    }
    static setLatestLightmapResults(currentSceneUUID, uuids) {
        Editor.Profile.setProject('lightmap', `latestLightmapResultMap.${currentSceneUUID}.results`, uuids);
    }
    static async setLatestLightmapResultsDir(currentSceneUUID, dir) {
        Editor.Profile.setProject('lightmap', `latestLightmapResultMap.${currentSceneUUID}.dir`, Editor.Utils.Path.normalize(dir));
    }
    static async getLatestLightmapResultDir(currentSceneUUID) {
        return await Editor.Profile.getProject('lightmap', `latestLightmapResultMap.${currentSceneUUID}.dir`);
    }
}

let filesList = [];
/**
 * 这种格式的时间转为正常的日期
 * Thu May 12 2016 08:00:00 GMT+0800 (中国标准时间)
 */
function convertTime(target) {
    const d = new Date(target);
    return (d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0') + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0'));
}
async function readImageList(path, isSub = false) {
    isSub || (filesList = []);
    const files = fs__default['default'].readdirSync(path);
    await Promise.all(files.map(async (itm) => {
        const res = ps.join(path, itm);
        const stat = fs__default['default'].statSync(res);
        if (stat.isDirectory()) {
            // 递归读取文件
            readImageList(res, true);
        }
        else {
            if (itm.endsWith('.png')) {
                const url = await Editor.Message.request('asset-db', 'query-url', res);
                let uuid = null;
                if (url) {
                    uuid = await Editor.Message.request('asset-db', 'query-uuid', url);
                }
                // 定义一个对象存放图片的路径和名字
                const obj = {
                    path: res,
                    filename: itm,
                    size: formatBytes(stat.size),
                    birthtime: convertTime(stat.birthtime),
                    uuid,
                    mtime: convertTime(stat.mtime),
                };
                filesList.push(obj);
            }
        }
    }));
    return filesList;
}
async function getImageInfo(imageUUID) {
    const path = await Editor.Message.request('asset-db', 'query-path', imageUUID);
    if (!path) {
        return null;
    }
    try {
        const stat = fs__default['default'].statSync(path);
        const obj = {
            path,
            filename: ps.basename(path),
            size: formatBytes(stat.size),
            birthtime: convertTime(stat.birthtime),
            uuid: imageUUID,
            mtime: convertTime(stat.mtime),
        };
        return obj;
    }
    catch (error) {
        console.debug(error);
        return null;
    }
}
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.Profile = Profile;
exports.formatBytes = formatBytes;
exports.getImageInfo = getImageInfo;
exports.readImageList = readImageList;
