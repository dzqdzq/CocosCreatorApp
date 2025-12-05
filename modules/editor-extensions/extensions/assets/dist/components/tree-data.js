'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildrenInvalid = exports.pointExpand = exports.toggleExpand = exports.loopExpand = exports.outputDisplay = exports.resort = exports.renderImmediately = exports.render = exports.unFreeze = exports.deleted = exports.added = exports.changed = exports.clear = exports.reset = exports.uuidToExpand = exports.uuidToIndex = exports.uuidToDepth = exports.displayArray = exports.uuidToChildrenSorted = exports.uuidToChildren = exports.uuidToParentUuid = exports.uuidToState = exports.fileToUuid = exports.urlToUuid = exports.uuidToAsset = exports.dbInternal = exports.dbAssets = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const panelData = __importStar(require("./panel-data"));
const utils = __importStar(require("./utils"));
exports.dbAssets = 'db://assets';
exports.dbInternal = 'db://internal';
exports.uuidToAsset = {};
exports.urlToUuid = {};
exports.fileToUuid = {};
exports.uuidToState = {};
exports.uuidToParentUuid = {};
exports.uuidToChildren = {};
exports.uuidToChildrenSorted = {};
exports.displayArray = [];
exports.uuidToDepth = {};
exports.uuidToIndex = {};
// 不参与 refresh 重置
exports.uuidToExpand = {};
// 刷新时间，主要给图片缩略图使用
let refreshTime;
let renderAnimationId;
/**
 * 重置面板
 */
async function reset() {
    const arr = (await Editor.Message.request('asset-db', 'query-assets'));
    if (!arr) {
        console.error('The data requested from asset-db is empty.');
        return;
    }
    clear();
    /**
     * 重要：排序是为了优先获得文件夹的 uuid，避免部分文件早于文件夹时出现 空挂载 的情况
     * 空挂载 uuidToChildren[parentUuid] = IAssetInfo，此时 parentUuid = '';
     * 默认顺序为 assets, internal, 其他按字母排序
     */
    arr.sort((a, b) => {
        const aStartAssets = a.url.startsWith(exports.dbAssets);
        const aStartInternal = a.url.startsWith(exports.dbInternal);
        const bStartAssets = b.url.startsWith(exports.dbAssets);
        const bStartInternal = b.url.startsWith(exports.dbInternal);
        if ((aStartAssets || aStartInternal) && !bStartAssets && !bStartInternal) {
            return -1;
        }
        else if (!aStartAssets && !aStartInternal && (bStartAssets || bStartInternal)) {
            return 1;
        }
        else {
            return collator.compare(a.url, b.url);
        }
    });
    exports.uuidToChildrenSorted[panelData.config.protocol] = true;
    buildTree(arr);
    initExpand();
    render();
}
exports.reset = reset;
/**
 * 清空数据
 */
function clear() {
    exports.uuidToAsset = {};
    exports.urlToUuid = {};
    exports.fileToUuid = {};
    exports.uuidToChildren = {};
    exports.uuidToChildrenSorted = {};
    exports.uuidToDepth = {};
    exports.uuidToIndex = {};
    exports.uuidToParentUuid = {};
    exports.uuidToState = {};
    exports.displayArray = [];
    exports.uuidToIndex = { length: 0 };
    refreshTime = Date.now();
}
exports.clear = clear;
function initExpand() {
    if (exports.uuidToExpand[panelData.config.protocol]) {
        return;
    }
    exports.uuidToExpand[panelData.config.protocol] = true;
    exports.uuidToExpand[exports.dbAssets] = true;
}
/**
 * 收到变动的 ipc 消息
 * @param uuid 资源
 * @param asset 资源信息
 */
function changed(uuid, asset) {
    /**
     * 按现在的 changed 顺序，subAssets 早于父级发送
     * 任意 subAsset 都不能脱离实体资源，所以单一 subAsset 的变动可以忽略
     * 父级的正确数据还没有发过来，所以加一个 loading
     */
    if (uuid.includes('@')) {
        const parentUuid = exports.uuidToParentUuid[uuid];
        if (parentUuid) {
            if (unFreeze(parentUuid)) {
                render();
            }
        }
        else {
            return;
        }
    }
    refreshTime = Date.now();
    const oldAsset = exports.uuidToAsset[uuid];
    const oldParentUuid = exports.uuidToParentUuid[uuid];
    if (!oldAsset) {
        console.error(`Can not change the asset "${asset.url}", because the original asset is not exist. Maybe it is a new asset.`);
        return;
    }
    // 1/3 自身
    // 删除原先的 urlToUuid, fileToUuid 存储
    delete exports.urlToUuid[oldAsset.url];
    delete exports.fileToUuid[oldAsset.file];
    // 清空 subAssets
    if ('isParent' in oldAsset && oldAsset.isParent && !oldAsset.isDirectory) {
        const children = exports.uuidToChildren[uuid];
        for (const child of children) {
            loopDeleteSelf(child);
        }
        delete exports.uuidToChildren[uuid];
        delete exports.uuidToChildrenSorted[uuid];
        // 如果有 subAssets 则递归继续查询内部的 subAssets
        const subNames = Object.keys(asset.subAssets);
        if (subNames.length) {
            const infoTree = {
                children: {},
                uuid,
            };
            for (const name of subNames) {
                infoTree.children[name] = { children: {} };
                buildTreeData(asset.subAssets[name], infoTree.children[name], infoTree);
            }
        }
    }
    exports.uuidToAsset[uuid] = asset;
    exports.urlToUuid[asset.url] = uuid;
    if (asset.file) {
        exports.fileToUuid[asset.file] = uuid;
    }
    exports.uuidToState[uuid] = '';
    const parentUrl = (0, path_1.dirname)(asset.url);
    const parentUuid = exports.urlToUuid[parentUrl];
    if (!parentUuid) {
        return;
    }
    // 2/3 从原来的父节点删除，添加到新的父级
    if (parentUuid && parentUuid !== oldParentUuid) {
        const children = exports.uuidToChildren[oldParentUuid];
        if (children) {
            const index = children.indexOf(uuid);
            if (index !== -1) {
                children.splice(children.indexOf(uuid), 1);
            }
        }
        if (!exports.uuidToChildren[parentUuid]) {
            exports.uuidToChildren[parentUuid] = [];
            unFreeze(parentUuid);
        }
        if (!exports.uuidToChildren[parentUuid].includes(uuid)) {
            exports.uuidToChildren[parentUuid].push(uuid);
        }
        exports.uuidToParentUuid[uuid] = parentUuid;
        exports.uuidToChildrenSorted[parentUuid] = false;
        exports.uuidToState[parentUuid] = '';
    }
    // 3/3 如果是文件夹，解冻子集以便重新计算层级
    unFreezeDirectory(uuid);
    render();
}
exports.changed = changed;
/**
 * 收到新增的 ipc 消息
 * @param uuid 资源
 * @param asset 信息
 */
function added(uuid, asset) {
    const parentUrl = (0, path_1.dirname)(asset.url);
    const parentUuid = exports.urlToUuid[parentUrl];
    if (!parentUuid) {
        return;
    }
    refreshTime = Date.now();
    // 1/2 自身添加
    exports.uuidToAsset[uuid] = asset;
    exports.urlToUuid[asset.url] = uuid;
    if (asset.file) {
        exports.fileToUuid[asset.file] = uuid;
    }
    // 如果有 subAssets 则递归继续查询内部的 subAssets
    const subNames = Object.keys(asset.subAssets);
    if (subNames.length) {
        const infoTree = {
            children: {},
            uuid,
        };
        for (const name of subNames) {
            infoTree.children[name] = { children: {} };
            buildTreeData(asset.subAssets[name], infoTree.children[name], infoTree);
        }
    }
    // 2/2 添加到父级
    if (!exports.uuidToChildren[parentUuid]) {
        exports.uuidToChildren[parentUuid] = [];
        unFreeze(parentUuid);
    }
    if (!exports.uuidToChildren[parentUuid].includes(uuid)) {
        exports.uuidToChildren[parentUuid].push(uuid);
    }
    exports.uuidToParentUuid[uuid] = parentUuid;
    exports.uuidToState[parentUuid] = '';
    exports.uuidToChildrenSorted[parentUuid] = false;
    updateRootAsset(parentUuid);
    unFreezeDirectory(parentUuid);
    render();
}
exports.added = added;
/**
 * 收到删除的 ipc 消息
 * @param uuid 资源
 * @param info 信息
 */
function deleted(uuid, info) {
    loopDeleteSelf(uuid);
    const parentUuid = exports.uuidToParentUuid[uuid];
    if (parentUuid) {
        unFreeze(parentUuid);
        const children = exports.uuidToChildren[parentUuid];
        if (children && children.length) {
            const index = children.indexOf(uuid);
            if (index !== -1) {
                children.splice(index, 1);
            }
        }
    }
    updateRootAsset(parentUuid);
    render();
}
exports.deleted = deleted;
/**
 * 内部循环删除
 * @param uuid 资源
 */
function loopDeleteSelf(uuid) {
    const children = exports.uuidToChildren[uuid];
    if (children && children.length) {
        for (const child of children) {
            loopDeleteSelf(child);
        }
    }
    const asset = exports.uuidToAsset[uuid];
    if (asset) {
        delete exports.urlToUuid[asset.url];
        delete exports.fileToUuid[asset.file];
    }
    delete exports.uuidToAsset[uuid];
    delete exports.uuidToChildren[uuid];
    delete exports.uuidToChildrenSorted[uuid];
    delete exports.uuidToExpand[uuid];
    delete exports.uuidToDepth[uuid];
    delete exports.uuidToIndex[uuid];
    delete exports.uuidToState[uuid];
}
/**
 * Hack: 目前在 db://assets 根路径下添加资源，根路径没有发送 change 过来
 * @param uuid 资源
 */
function updateRootAsset(uuid) {
    if (exports.uuidToParentUuid[uuid] === panelData.config.protocol) {
        unFreeze(uuid);
    }
}
function unFreezeDirectory(uuid) {
    const asset = exports.uuidToAsset[uuid];
    if (asset && asset.isDirectory) {
        unFreeze(uuid);
        const children = exports.uuidToChildren[uuid];
        if (Array.isArray(children)) {
            for (const child of children) {
                unFreeze(child);
            }
        }
    }
}
/**
 * 数据有更新后解冻数据
 * @param uuid 资源
 */
function unFreeze(uuid) {
    if (exports.uuidToAsset[uuid] === undefined) {
        return true;
    }
    if (exports.uuidToAsset[uuid] && Object.isFrozen(exports.uuidToAsset[uuid])) {
        exports.uuidToAsset[uuid] = JSON.parse(JSON.stringify(exports.uuidToAsset[uuid]));
        return true;
    }
    else {
        return false;
    }
}
exports.unFreeze = unFreeze;
/**
 * 重新渲染
 */
function render() {
    cancelAnimationFrame(renderAnimationId);
    renderAnimationId = requestAnimationFrame(() => {
        renderImmediately();
    });
}
exports.render = render;
async function renderImmediately() {
    exports.displayArray = [];
    exports.uuidToIndex = { length: 0 };
    renderData(panelData.config.protocol, -1);
    if (utils.isSearchingMode()) {
        await searchData(exports.displayArray);
    }
    else {
        getAllExpands(panelData.config.protocol, exports.displayArray);
    }
    panelData.$.tree.render();
}
exports.renderImmediately = renderImmediately;
/**
 * 重新排序
 */
function resort() {
    // 删除已排序记录
    exports.uuidToChildrenSorted = {};
    render();
}
exports.resort = resort;
/**
 * 输出树形显示的节点
 * @param start 索引起始位置
 * @param end 索引结束位置
 */
function outputDisplay(start, end) {
    const rangeDisplay = [];
    if (exports.displayArray.length) {
        start = start < 0 ? 0 : start;
        end = exports.displayArray.length < end ? exports.displayArray.length : end;
        for (let i = start; i < end; i++) {
            const asset = displayData(exports.displayArray[i]);
            if (asset) {
                rangeDisplay.push(asset);
            }
        }
    }
    Object.freeze(rangeDisplay);
    return rangeDisplay;
}
exports.outputDisplay = outputDisplay;
/**
 * 内部循环切换展开状态
 * @param uuid 资源
 * @param expand 是否展开
 */
function loopExpand(uuid, expand) {
    if (expand === undefined) {
        expand = !exports.uuidToExpand[uuid];
    }
    /**
     * 单步
     * @param uuid 资源
     * @param expand 是否展开
     */
    function step(uuid, expand) {
        const children = exports.uuidToChildren[uuid];
        if (children) {
            const length = children.length;
            for (let i = 0; i < length; i++) {
                const child = children[i];
                exports.uuidToExpand[child] = expand;
                step(child, expand);
            }
        }
    }
    if (!expand) {
        toggleExpand(uuid, expand);
        step(uuid, expand);
        // step 后需要刷新视图
        render();
    }
    else {
        step(uuid, expand);
        toggleExpand(uuid, expand);
    }
}
exports.loopExpand = loopExpand;
/**
 * 切换折叠状态
 * @param uuid 资源
 * @param expand 是否展开
 */
function toggleExpand(uuid, expand) {
    if (expand === undefined) {
        expand = !exports.uuidToExpand[uuid];
    }
    if (exports.uuidToExpand[uuid] === expand) {
        return;
    }
    exports.uuidToExpand[uuid] = expand;
    render();
}
exports.toggleExpand = toggleExpand;
/**
 * 指定单个节点展开
 * @param uuid 资源
 */
async function pointExpand(uuid) {
    let pointUuid = uuid;
    let isVisible = exports.displayArray.includes(pointUuid);
    while (pointUuid && !isVisible) {
        pointUuid = exports.uuidToParentUuid[pointUuid];
        exports.uuidToExpand[pointUuid] = true;
        isVisible = exports.displayArray.includes(pointUuid);
    }
    await renderImmediately();
}
exports.pointExpand = pointExpand;
/**
 * 查询一个资源的 children 中是否存在 invalid 的资源
 * @param assetId
 * @returns
 */
const getChildrenInvalid = (assetId) => {
    const asset = exports.uuidToAsset[assetId];
    if (!asset) {
        return false;
    }
    if (!('isParent' in asset) || asset.isParent !== true) {
        return asset.invalid;
    }
    const children = exports.uuidToChildren[assetId];
    if (!Array.isArray(children)) {
        return false;
    }
    return children.some((childId) => {
        return (0, exports.getChildrenInvalid)(childId);
    });
};
exports.getChildrenInvalid = getChildrenInvalid;
/**
 * 构建树形
 * @param assets 资源列表原始数据
 */
function buildTree(assets) {
    const assetsTree = {
        children: {},
        uuid: panelData.config.protocol,
    };
    const rootLength = assetsTree.uuid.length;
    for (const asset of assets) {
        if (!asset.url) {
            return;
        }
        const names = asset.url.substring(rootLength).split('/');
        // 根据搜索路径，补全路径上缺失的所有数据
        let parent = assetsTree;
        let child = assetsTree;
        for (const name of names) {
            if (name) {
                if (!child.children[name]) {
                    child.children[name] = { children: {}, uuid: '' };
                }
                parent = child;
                child = child.children[name];
            }
        }
        buildTreeData(asset, child, parent);
    }
}
/**
 * 递归资源，使之从平级转为树形
 * @param asset 原数据
 * @param child 当前节点
 * @param parent 父节点
 */
function buildTreeData(asset, child, parent) {
    if (!asset.uuid) {
        return;
    }
    child.uuid = asset.uuid;
    if (asset.isDirectory && !exports.uuidToChildren[asset.uuid]) {
        exports.uuidToChildren[asset.uuid] = [];
    }
    // 自身
    exports.uuidToAsset[asset.uuid] = asset;
    exports.urlToUuid[asset.url] = asset.uuid;
    if (asset.file) {
        exports.fileToUuid[asset.file] = asset.uuid;
    }
    // 父级关系
    if (!exports.uuidToChildren[parent.uuid]) {
        exports.uuidToChildren[parent.uuid] = [];
    }
    if (!exports.uuidToChildren[parent.uuid].includes(asset.uuid)) {
        exports.uuidToChildren[parent.uuid].push(asset.uuid);
    }
    exports.uuidToParentUuid[asset.uuid] = parent.uuid;
    // 如果有 subAssets 则递归继续查询内部的 subAssets
    for (const name in asset.subAssets) {
        child.children[name] = { children: {} };
        buildTreeData(asset.subAssets[name], child.children[name], child);
    }
}
/**
 * 重新渲染所有数据
 * @param uuid 资源
 * @param depth 树形层级
 */
function renderData(uuid, depth) {
    exports.uuidToDepth[uuid] = depth;
    exports.uuidToIndex[uuid] = exports.uuidToIndex.length;
    exports.uuidToIndex.length++;
    const children = exports.uuidToChildren[uuid];
    if (!children || !children.length) {
        return;
    }
    const length = children.length;
    if (!exports.uuidToChildrenSorted[uuid]) {
        sortTree(children);
        exports.uuidToChildrenSorted[uuid] = true;
    }
    depth++;
    for (let i = 0; i < length; i++) {
        renderData(children[i], depth);
    }
}
/**
 * 输出格式化数据并冻结它，使它不在 vue 监听中生效
 * @param uuid 资源
 */
function displayData(uuid) {
    const asset = exports.uuidToAsset[uuid];
    if (!asset || Object.isFrozen(asset)) {
        return asset;
    }
    const depth = exports.uuidToDepth[uuid];
    const isDB = depth === 0;
    const fileExt = (0, path_1.extname)(asset.name);
    asset.isDB = isDB;
    asset.isDirectory = isDB ? true : asset.isDirectory;
    // 树形的父级三角形依据此字段，如果所有子资源没有显示的话，就设置为 false
    asset.isParent = exports.uuidToChildren[uuid] && exports.uuidToChildren[uuid].some((sub) => exports.uuidToAsset[sub]?.visible);
    asset.isSubAsset = uuid.includes('@') ? true : false;
    asset.fileExt = asset.isDirectory ? '' : fileExt.toLocaleLowerCase();
    asset.fileName = asset.isDirectory ? asset.name : asset.name.substr(0, asset.name.lastIndexOf(fileExt));
    asset.depth = depth;
    const { iconWidth, nodeLeft } = panelData.config;
    asset.left = nodeLeft + depth * iconWidth / 2 + (asset.isParent ? 0 : iconWidth);
    asset.refreshTime = refreshTime;
    const additional = [];
    if (asset.redirect) {
        pushAdditional(additional, {
            type: asset.redirect.type,
            value: asset.redirect.uuid,
            name: asset.name,
        });
        // 修复 ui-asset 拖入识别没有考虑继承链的问题，比如 cc.TextureBase 要能接收 cc.Texture2D 的图片拖入
        const redirectAsset = exports.uuidToAsset[asset.redirect.uuid];
        if (redirectAsset) {
            if (redirectAsset.extends && redirectAsset.extends.length > 0) {
                redirectAsset.extends.forEach((item) => {
                    pushAdditional(additional, {
                        type: item,
                        value: redirectAsset.uuid,
                        name: asset.name,
                    });
                });
            }
        }
    }
    if (asset.extends && asset.extends.length > 0) {
        asset.extends.forEach((item) => {
            pushAdditional(additional, {
                type: item,
                value: asset.uuid,
                name: asset.name,
            });
        });
    }
    // 将自己的子节点增加到 additional 数组里
    for (const key in asset.subAssets) {
        const child = asset.subAssets[key];
        if (asset.redirect && asset.redirect.uuid === child.uuid) {
            continue;
        }
        pushAdditional(additional, {
            type: child.type,
            value: child.uuid,
            name: child.name,
        });
        if (child.extends && child.extends.length > 0) {
            child.extends.forEach((item) => {
                pushAdditional(additional, {
                    type: item,
                    value: child.uuid,
                    name: child.name,
                });
            });
        }
    }
    asset.additional = additional;
    Object.freeze(asset);
    return asset;
}
function pushAdditional(additional, data) {
    const exist = additional.some(item => {
        return item.type === data.type && item.value === data.value;
    });
    if (!exist) {
        additional.push(data);
    }
}
/**
 * 搜索数据
 * @param displays 要显示的数据，循环使用，为了提高速度降低内存
 */
async function searchData(displays) {
    let { searchValue } = panelData.$.panel;
    const { searchType, searchAssetTypes, searchInFolder, extendSearchFunc } = panelData.$.panel;
    let decompressUUID = searchValue;
    if ((searchType === 'name' || searchType === 'uuid') && Editor.Utils.UUID.isUUID(searchValue)) {
        // 如果
        decompressUUID = Editor.Utils.UUID.decompressUUID(searchValue);
    }
    let compressUuid = searchValue;
    if (searchType === 'usages') {
        const uuid = Editor.Utils.UUID.decompressUUID(searchValue);
        // 被使用的资源如果不是 cc.Script 类型，还是用完整 uuid 进行搜索，不需要压缩 uuid
        const asset = exports.uuidToAsset[uuid];
        if (asset && asset.type !== 'cc.Script') {
            searchValue = uuid;
        }
        else {
            // 因为打印 uuid 时第二个参数判断了被使用的资源是否为脚本，所以这边需要一致
            // 目前也没有一个资源引用另一个脚本资源的情况
            compressUuid = Editor.Utils.UUID.compressUUID(searchValue, false);
        }
    }
    panelData.$.panel.refreshLock = true;
    for (const dbRoot of exports.uuidToChildren[panelData.config.protocol]) {
        const children = exports.uuidToChildren[dbRoot];
        if (!children || !children.length) {
            continue;
        }
        for (const child of children) {
            await match(child);
        }
    }
    sortTree(displays, true);
    panelData.$.panel.refreshLock = false;
    /**
     * 匹配搜索项
     * @param child 子节点 uuid
     */
    async function match(child) {
        const asset = exports.uuidToAsset[child];
        if (!asset || asset.visible === false) {
            return;
        }
        const { name, displayName, uuid, url, type, file } = asset;
        let passFilter = true;
        // 在文件夹内搜索
        if (searchInFolder) {
            if (url === searchInFolder.url || !url.startsWith(`${searchInFolder.url}/`)) {
                passFilter = false;
            }
        }
        // 限定搜索类型
        if (searchAssetTypes.length && !searchAssetTypes.includes(type)) {
            passFilter = false;
        }
        if (searchType === 'fails' && asset.imported) {
            passFilter = false;
        }
        if (passFilter) {
            let legal = true;
            if (searchValue) {
                legal = false;
                // 名称不区分大小写
                if (searchType === 'name' || searchType === 'fails') {
                    const lowerSearchValue = searchValue.toLocaleLowerCase();
                    const totalName = `${name}${displayName}`.toLocaleLowerCase();
                    const nameIncluded = totalName.includes(lowerSearchValue);
                    if (nameIncluded || uuid.includes(decompressUUID)) {
                        legal = true;
                    }
                }
                else if (searchType === 'uuid' && uuid.includes(decompressUUID)) {
                    legal = true;
                }
                else if (searchType === 'url' && url.includes(searchValue)) {
                    legal = true;
                }
                else if (searchType === 'usages') {
                    if ((0, fs_extra_1.existsSync)(file)) {
                        const stat = (0, fs_extra_1.statSync)(file);
                        if (stat.isFile()) {
                            const data = (0, fs_extra_1.readFileSync)(file);
                            if (data.includes(searchValue)) {
                                legal = true;
                            }
                            else if (searchValue !== compressUuid && data.includes(compressUuid)) {
                                legal = true;
                            }
                        }
                    }
                }
            }
            if (extendSearchFunc[searchType]) {
                // 外部扩展搜索方法
                legal = await extendSearchFunc[searchType](searchValue, asset);
            }
            if (legal) {
                exports.uuidToIndex[uuid] = exports.uuidToIndex.length;
                exports.uuidToIndex.length++;
                displays.push(uuid);
            }
        }
        const children = exports.uuidToChildren[uuid];
        if (!children || !children.length) {
            return;
        }
        const length = children.length;
        for (let i = 0; i < length; i++) {
            await match(children[i]);
        }
    }
}
/**
 * 获取展开后的所有后代节点
 * @param uuid 资源
 * @param displays 要显示的数据，循环使用，为了提高速度降低内存
 */
function getAllExpands(uuid, displays) {
    const children = exports.uuidToChildren[uuid];
    if (children) {
        const length = children.length;
        for (let i = 0; i < length; i++) {
            const childUuid = children[i];
            const asset = exports.uuidToAsset[childUuid];
            if (!asset || asset.visible === false) {
                continue;
            }
            displays.push(childUuid);
            if (exports.uuidToExpand[childUuid]) {
                getAllExpands(childUuid, displays);
            }
        }
    }
}
// 优化原本的 localeCompare 方法，性能提升：1000 空节点 1103ms -> 31ms
const collator = new Intl.Collator('en', {
    numeric: true,
    sensitivity: 'base',
    ignorePunctuation: true, // 忽略标点符号
});
/**
 * 排序
 * @param children 一组资源 uuids
 */
function sortTree(children, isSearchingMode) {
    children.sort((aUuid, bUuid) => {
        const a = exports.uuidToAsset[aUuid];
        const b = exports.uuidToAsset[bUuid];
        // 文件夹优先
        if (a.isDirectory === true && !b.isDirectory) {
            return -1;
        }
        else if (!a.isDirectory && b.isDirectory === true) {
            return 1;
        }
        else {
            if (panelData.$.panel.sortType === 'type' && a.importer !== b.importer) {
                return collator.compare(a.importer, b.importer);
            }
            else {
                // 搜索模式下根据 name 排序
                if (isSearchingMode) {
                    return collator.compare(`${a.displayName}${a.name}`, `${b.displayName}${b.name}`);
                }
                return collator.compare(a.path, b.path);
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS1kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2NvbXBvbmVudHMvdHJlZS1kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJYix1Q0FBOEQ7QUFDOUQsK0JBQXdDO0FBQ3hDLHdEQUEwQztBQUMxQywrQ0FBaUM7QUFFcEIsUUFBQSxRQUFRLEdBQUcsYUFBYSxDQUFDO0FBQ3pCLFFBQUEsVUFBVSxHQUFHLGVBQWUsQ0FBQztBQUMvQixRQUFBLFdBQVcsR0FBMkMsRUFBRSxDQUFDO0FBQ3pELFFBQUEsU0FBUyxHQUEyQixFQUFFLENBQUM7QUFDdkMsUUFBQSxVQUFVLEdBQTJCLEVBQUUsQ0FBQztBQUN4QyxRQUFBLFdBQVcsR0FBMkIsRUFBRSxDQUFDO0FBQ3pDLFFBQUEsZ0JBQWdCLEdBQTJCLEVBQUUsQ0FBQztBQUU5QyxRQUFBLGNBQWMsR0FBNkIsRUFBRSxDQUFDO0FBQzlDLFFBQUEsb0JBQW9CLEdBQTRCLEVBQUUsQ0FBQztBQUVuRCxRQUFBLFlBQVksR0FBYSxFQUFFLENBQUM7QUFDNUIsUUFBQSxXQUFXLEdBQTJCLEVBQUUsQ0FBQztBQUN6QyxRQUFBLFdBQVcsR0FBMkIsRUFBRSxDQUFDO0FBRXBELGlCQUFpQjtBQUNKLFFBQUEsWUFBWSxHQUE0QixFQUFFLENBQUM7QUFFeEQsa0JBQWtCO0FBQ2xCLElBQUksV0FBZ0IsQ0FBQztBQUVyQixJQUFJLGlCQUFzQixDQUFDO0FBRTNCOztHQUVHO0FBQ0ksS0FBSyxVQUFVLEtBQUs7SUFDdkIsTUFBTSxHQUFHLEdBQWlCLENBQUMsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQWlCLENBQUM7SUFDckcsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztRQUM1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QUksRUFBRTtZQUNqRCxPQUFPLENBQUMsQ0FBQztTQUNaO2FBQU07WUFDSCxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsS0FBSyxNQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFO2dCQUNwRSxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbkQ7aUJBQU07Z0JBQ0gsa0JBQWtCO2dCQUNsQixJQUFJLGVBQWUsRUFBRTtvQkFDakIsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2lCQUNyRjtnQkFDRCxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0M7U0FDSjtJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQXNzZXRJbmZvLCBJQXNzZXRJbmZvLCBJRHJhZ0FkZGl0aW9uYWwgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IGV4aXN0c1N5bmMsIHN0YXRTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBleHRuYW1lLCBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9wYW5lbC1kYXRhJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5leHBvcnQgY29uc3QgZGJBc3NldHMgPSAnZGI6Ly9hc3NldHMnO1xuZXhwb3J0IGNvbnN0IGRiSW50ZXJuYWwgPSAnZGI6Ly9pbnRlcm5hbCc7XG5leHBvcnQgbGV0IHV1aWRUb0Fzc2V0OiBSZWNvcmQ8c3RyaW5nLCBJQXNzZXRJbmZvIHwgQXNzZXRJbmZvPiA9IHt9O1xuZXhwb3J0IGxldCB1cmxUb1V1aWQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbmV4cG9ydCBsZXQgZmlsZVRvVXVpZDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuZXhwb3J0IGxldCB1dWlkVG9TdGF0ZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuZXhwb3J0IGxldCB1dWlkVG9QYXJlbnRVdWlkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbmV4cG9ydCBsZXQgdXVpZFRvQ2hpbGRyZW46IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuZXhwb3J0IGxldCB1dWlkVG9DaGlsZHJlblNvcnRlZDogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcblxuZXhwb3J0IGxldCBkaXNwbGF5QXJyYXk6IHN0cmluZ1tdID0gW107XG5leHBvcnQgbGV0IHV1aWRUb0RlcHRoOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5leHBvcnQgbGV0IHV1aWRUb0luZGV4OiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cbi8vIOS4jeWPguS4jiByZWZyZXNoIOmHjee9rlxuZXhwb3J0IGNvbnN0IHV1aWRUb0V4cGFuZDogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcblxuLy8g5Yi35paw5pe26Ze077yM5Li76KaB57uZ5Zu+54mH57yp55Wl5Zu+5L2/55SoXG5sZXQgcmVmcmVzaFRpbWU6IGFueTtcblxubGV0IHJlbmRlckFuaW1hdGlvbklkOiBhbnk7XG5cbi8qKlxuICog6YeN572u6Z2i5p2/XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBjb25zdCBhcnI6IElBc3NldEluZm9bXSA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldHMnKSkgYXMgSUFzc2V0SW5mb1tdO1xuICAgIGlmICghYXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RoZSBkYXRhIHJlcXVlc3RlZCBmcm9tIGFzc2V0LWRiIGlzIGVtcHR5LicpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2xlYXIoKTtcblxuICAgIC8qKlxuICAgICAqIOmHjeimge+8muaOkuW6j+aYr+S4uuS6huS8mOWFiOiOt+W+l+aWh+S7tuWkueeahCB1dWlk77yM6YG/5YWN6YOo5YiG5paH5Lu25pep5LqO5paH5Lu25aS55pe25Ye6546wIOepuuaMgui9vSDnmoTmg4XlhrVcbiAgICAgKiDnqbrmjILovb0gdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0gPSBJQXNzZXRJbmZv77yM5q2k5pe2IHBhcmVudFV1aWQgPSAnJztcbiAgICAgKiDpu5jorqTpobrluo/kuLogYXNzZXRzLCBpbnRlcm5hbCwg5YW25LuW5oyJ5a2X5q+N5o6S5bqPXG4gICAgICovXG5cbiAgICBhcnIuc29ydCgoYTogSUFzc2V0SW5mbywgYjogSUFzc2V0SW5mbykgPT4ge1xuICAgICAgICBjb25zdCBhU3RhcnRBc3NldHMgPSBhLnVybC5zdGFydHNXaXRoKGRiQXNzZXRzKTtcbiAgICAgICAgY29uc3QgYVN0YXJ0SW50ZXJuYWwgPSBhLnVybC5zdGFydHNXaXRoKGRiSW50ZXJuYWwpO1xuXG4gICAgICAgIGNvbnN0IGJTdGFydEFzc2V0cyA9IGIudXJsLnN0YXJ0c1dpdGgoZGJBc3NldHMpO1xuICAgICAgICBjb25zdCBiU3RhcnRJbnRlcm5hbCA9IGIudXJsLnN0YXJ0c1dpdGgoZGJJbnRlcm5hbCk7XG5cbiAgICAgICAgaWYgKChhU3RhcnRBc3NldHMgfHwgYVN0YXJ0SW50ZXJuYWwpICYmICFiU3RhcnRBc3NldHMgJiYgIWJTdGFydEludGVybmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoIWFTdGFydEFzc2V0cyAmJiAhYVN0YXJ0SW50ZXJuYWwgJiYgKGJTdGFydEFzc2V0cyB8fCBiU3RhcnRJbnRlcm5hbCkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxhdG9yLmNvbXBhcmUoYS51cmwsIGIudXJsKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdXVpZFRvQ2hpbGRyZW5Tb3J0ZWRbcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF0gPSB0cnVlO1xuXG4gICAgYnVpbGRUcmVlKGFycik7XG5cbiAgICBpbml0RXhwYW5kKCk7XG5cbiAgICByZW5kZXIoKTtcbn1cblxuLyoqXG4gKiDmuIXnqbrmlbDmja5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHV1aWRUb0Fzc2V0ID0ge307XG4gICAgdXJsVG9VdWlkID0ge307XG4gICAgZmlsZVRvVXVpZCA9IHt9O1xuICAgIHV1aWRUb0NoaWxkcmVuID0ge307XG4gICAgdXVpZFRvQ2hpbGRyZW5Tb3J0ZWQgPSB7fTtcbiAgICB1dWlkVG9EZXB0aCA9IHt9O1xuICAgIHV1aWRUb0luZGV4ID0ge307XG4gICAgdXVpZFRvUGFyZW50VXVpZCA9IHt9O1xuICAgIHV1aWRUb1N0YXRlID0ge307XG4gICAgZGlzcGxheUFycmF5ID0gW107XG4gICAgdXVpZFRvSW5kZXggPSB7IGxlbmd0aDogMCB9O1xuXG4gICAgcmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xufVxuXG5mdW5jdGlvbiBpbml0RXhwYW5kKCkge1xuICAgIGlmICh1dWlkVG9FeHBhbmRbcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHV1aWRUb0V4cGFuZFtwYW5lbERhdGEuY29uZmlnLnByb3RvY29sXSA9IHRydWU7XG4gICAgdXVpZFRvRXhwYW5kW2RiQXNzZXRzXSA9IHRydWU7XG59XG5cbi8qKlxuICog5pS25Yiw5Y+Y5Yqo55qEIGlwYyDmtojmga9cbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICogQHBhcmFtIGFzc2V0IOi1hOa6kOS/oeaBr1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2hhbmdlZCh1dWlkOiBzdHJpbmcsIGFzc2V0OiBBc3NldEluZm8pIHtcbiAgICAvKipcbiAgICAgKiDmjInnjrDlnKjnmoQgY2hhbmdlZCDpobrluo/vvIxzdWJBc3NldHMg5pep5LqO54i257qn5Y+R6YCBXG4gICAgICog5Lu75oSPIHN1YkFzc2V0IOmDveS4jeiDveiEseemu+WunuS9k+i1hOa6kO+8jOaJgOS7peWNleS4gCBzdWJBc3NldCDnmoTlj5jliqjlj6/ku6Xlv73nlaVcbiAgICAgKiDniLbnuqfnmoTmraPnoa7mlbDmja7ov5jmsqHmnInlj5Hov4fmnaXvvIzmiYDku6XliqDkuIDkuKogbG9hZGluZ1xuICAgICAqL1xuICAgIGlmICh1dWlkLmluY2x1ZGVzKCdAJykpIHtcbiAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IHV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG4gICAgICAgIGlmIChwYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICBpZiAodW5GcmVlemUocGFyZW50VXVpZCkpIHtcbiAgICAgICAgICAgICAgICByZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIGNvbnN0IG9sZEFzc2V0ID0gdXVpZFRvQXNzZXRbdXVpZF07XG4gICAgY29uc3Qgb2xkUGFyZW50VXVpZCA9IHV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG5cbiAgICBpZiAoIW9sZEFzc2V0KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYENhbiBub3QgY2hhbmdlIHRoZSBhc3NldCBcIiR7YXNzZXQudXJsfVwiLCBiZWNhdXNlIHRoZSBvcmlnaW5hbCBhc3NldCBpcyBub3QgZXhpc3QuIE1heWJlIGl0IGlzIGEgbmV3IGFzc2V0LmApO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gMS8zIOiHqui6q1xuICAgIC8vIOWIoOmZpOWOn+WFiOeahCB1cmxUb1V1aWQsIGZpbGVUb1V1aWQg5a2Y5YKoXG4gICAgZGVsZXRlIHVybFRvVXVpZFtvbGRBc3NldC51cmxdO1xuICAgIGRlbGV0ZSBmaWxlVG9VdWlkW29sZEFzc2V0LmZpbGVdO1xuICAgIC8vIOa4heepuiBzdWJBc3NldHNcbiAgICBpZiAoJ2lzUGFyZW50JyBpbiBvbGRBc3NldCAmJiBvbGRBc3NldC5pc1BhcmVudCAmJiAhb2xkQXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgbG9vcERlbGV0ZVNlbGYoY2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIHV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgICAgICBkZWxldGUgdXVpZFRvQ2hpbGRyZW5Tb3J0ZWRbdXVpZF07XG5cbiAgICAgICAgLy8g5aaC5p6c5pyJIHN1YkFzc2V0cyDliJnpgJLlvZLnu6fnu63mn6Xor6LlhoXpg6jnmoQgc3ViQXNzZXRzXG4gICAgICAgIGNvbnN0IHN1Yk5hbWVzID0gT2JqZWN0LmtleXMoYXNzZXQuc3ViQXNzZXRzKTtcbiAgICAgICAgaWYgKHN1Yk5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaW5mb1RyZWU6IGFueSA9IHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjoge30sXG4gICAgICAgICAgICAgICAgdXVpZCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2Ygc3ViTmFtZXMpIHtcbiAgICAgICAgICAgICAgICBpbmZvVHJlZS5jaGlsZHJlbltuYW1lXSA9IHsgY2hpbGRyZW46IHt9IH07XG4gICAgICAgICAgICAgICAgYnVpbGRUcmVlRGF0YShhc3NldC5zdWJBc3NldHNbbmFtZV0sIGluZm9UcmVlLmNoaWxkcmVuW25hbWVdLCBpbmZvVHJlZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1dWlkVG9Bc3NldFt1dWlkXSA9IGFzc2V0O1xuICAgIHVybFRvVXVpZFthc3NldC51cmxdID0gdXVpZDtcbiAgICBpZiAoYXNzZXQuZmlsZSkge1xuICAgICAgICBmaWxlVG9VdWlkW2Fzc2V0LmZpbGVdID0gdXVpZDtcbiAgICB9XG4gICAgdXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcblxuICAgIGNvbnN0IHBhcmVudFVybCA9IGRpcm5hbWUoYXNzZXQudXJsKTtcbiAgICBjb25zdCBwYXJlbnRVdWlkID0gdXJsVG9VdWlkW3BhcmVudFVybF07XG5cbiAgICBpZiAoIXBhcmVudFV1aWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIDIvMyDku47ljp/mnaXnmoTniLboioLngrnliKDpmaTvvIzmt7vliqDliLDmlrDnmoTniLbnuqdcbiAgICBpZiAocGFyZW50VXVpZCAmJiBwYXJlbnRVdWlkICE9PSBvbGRQYXJlbnRVdWlkKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdXVpZFRvQ2hpbGRyZW5bb2xkUGFyZW50VXVpZF07XG4gICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjaGlsZHJlbi5pbmRleE9mKHV1aWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuLnNwbGljZShjaGlsZHJlbi5pbmRleE9mKHV1aWQpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0pIHtcbiAgICAgICAgICAgIHV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdID0gW107XG4gICAgICAgICAgICB1bkZyZWV6ZShwYXJlbnRVdWlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICB1dWlkVG9DaGlsZHJlbltwYXJlbnRVdWlkXS5wdXNoKHV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIHV1aWRUb1BhcmVudFV1aWRbdXVpZF0gPSBwYXJlbnRVdWlkO1xuICAgICAgICB1dWlkVG9DaGlsZHJlblNvcnRlZFtwYXJlbnRVdWlkXSA9IGZhbHNlO1xuICAgICAgICB1dWlkVG9TdGF0ZVtwYXJlbnRVdWlkXSA9ICcnO1xuICAgIH1cblxuICAgIC8vIDMvMyDlpoLmnpzmmK/mlofku7blpLnvvIzop6PlhrvlrZDpm4bku6Xkvr/ph43mlrDorqHnrpflsYLnuqdcbiAgICB1bkZyZWV6ZURpcmVjdG9yeSh1dWlkKTtcblxuICAgIHJlbmRlcigpO1xufVxuXG4vKipcbiAqIOaUtuWIsOaWsOWinueahCBpcGMg5raI5oGvXG4gKiBAcGFyYW0gdXVpZCDotYTmupBcbiAqIEBwYXJhbSBhc3NldCDkv6Hmga9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZGVkKHV1aWQ6IHN0cmluZywgYXNzZXQ6IEFzc2V0SW5mbykge1xuICAgIGNvbnN0IHBhcmVudFVybCA9IGRpcm5hbWUoYXNzZXQudXJsKTtcbiAgICBjb25zdCBwYXJlbnRVdWlkID0gdXJsVG9VdWlkW3BhcmVudFVybF07XG5cbiAgICBpZiAoIXBhcmVudFV1aWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIC8vIDEvMiDoh6rouqvmt7vliqBcbiAgICB1dWlkVG9Bc3NldFt1dWlkXSA9IGFzc2V0O1xuICAgIHVybFRvVXVpZFthc3NldC51cmxdID0gdXVpZDtcbiAgICBpZiAoYXNzZXQuZmlsZSkge1xuICAgICAgICBmaWxlVG9VdWlkW2Fzc2V0LmZpbGVdID0gdXVpZDtcbiAgICB9XG5cbiAgICAvLyDlpoLmnpzmnIkgc3ViQXNzZXRzIOWImemAkuW9kue7p+e7reafpeivouWGhemDqOeahCBzdWJBc3NldHNcbiAgICBjb25zdCBzdWJOYW1lcyA9IE9iamVjdC5rZXlzKGFzc2V0LnN1YkFzc2V0cyk7XG4gICAgaWYgKHN1Yk5hbWVzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBpbmZvVHJlZTogYW55ID0ge1xuICAgICAgICAgICAgY2hpbGRyZW46IHt9LFxuICAgICAgICAgICAgdXVpZCxcbiAgICAgICAgfTtcbiAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIHN1Yk5hbWVzKSB7XG4gICAgICAgICAgICBpbmZvVHJlZS5jaGlsZHJlbltuYW1lXSA9IHsgY2hpbGRyZW46IHt9IH07XG4gICAgICAgICAgICBidWlsZFRyZWVEYXRhKGFzc2V0LnN1YkFzc2V0c1tuYW1lXSwgaW5mb1RyZWUuY2hpbGRyZW5bbmFtZV0sIGluZm9UcmVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIDIvMiDmt7vliqDliLDniLbnuqdcbiAgICBpZiAoIXV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdKSB7XG4gICAgICAgIHV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdID0gW107XG4gICAgICAgIHVuRnJlZXplKHBhcmVudFV1aWQpO1xuICAgIH1cbiAgICBpZiAoIXV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgIHV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdLnB1c2godXVpZCk7XG4gICAgfVxuICAgIHV1aWRUb1BhcmVudFV1aWRbdXVpZF0gPSBwYXJlbnRVdWlkO1xuICAgIHV1aWRUb1N0YXRlW3BhcmVudFV1aWRdID0gJyc7XG4gICAgdXVpZFRvQ2hpbGRyZW5Tb3J0ZWRbcGFyZW50VXVpZF0gPSBmYWxzZTtcblxuICAgIHVwZGF0ZVJvb3RBc3NldChwYXJlbnRVdWlkKTtcbiAgICB1bkZyZWV6ZURpcmVjdG9yeShwYXJlbnRVdWlkKTtcblxuICAgIHJlbmRlcigpO1xufVxuXG4vKipcbiAqIOaUtuWIsOWIoOmZpOeahCBpcGMg5raI5oGvXG4gKiBAcGFyYW0gdXVpZCDotYTmupBcbiAqIEBwYXJhbSBpbmZvIOS/oeaBr1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgIGxvb3BEZWxldGVTZWxmKHV1aWQpO1xuXG4gICAgY29uc3QgcGFyZW50VXVpZCA9IHV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG4gICAgaWYgKHBhcmVudFV1aWQpIHtcbiAgICAgICAgdW5GcmVlemUocGFyZW50VXVpZCk7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF07XG4gICAgICAgIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2hpbGRyZW4uaW5kZXhPZih1dWlkKTtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlUm9vdEFzc2V0KHBhcmVudFV1aWQpO1xuXG4gICAgcmVuZGVyKCk7XG59XG5cbi8qKlxuICog5YaF6YOo5b6q546v5Yig6ZmkXG4gKiBAcGFyYW0gdXVpZCDotYTmupBcbiAqL1xuZnVuY3Rpb24gbG9vcERlbGV0ZVNlbGYodXVpZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICBpZiAoY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGxvb3BEZWxldGVTZWxmKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFzc2V0ID0gdXVpZFRvQXNzZXRbdXVpZF07XG4gICAgaWYgKGFzc2V0KSB7XG4gICAgICAgIGRlbGV0ZSB1cmxUb1V1aWRbYXNzZXQudXJsXTtcbiAgICAgICAgZGVsZXRlIGZpbGVUb1V1aWRbYXNzZXQuZmlsZV07XG4gICAgfVxuXG4gICAgZGVsZXRlIHV1aWRUb0Fzc2V0W3V1aWRdO1xuICAgIGRlbGV0ZSB1dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICBkZWxldGUgdXVpZFRvQ2hpbGRyZW5Tb3J0ZWRbdXVpZF07XG4gICAgZGVsZXRlIHV1aWRUb0V4cGFuZFt1dWlkXTtcbiAgICBkZWxldGUgdXVpZFRvRGVwdGhbdXVpZF07XG4gICAgZGVsZXRlIHV1aWRUb0luZGV4W3V1aWRdO1xuICAgIGRlbGV0ZSB1dWlkVG9TdGF0ZVt1dWlkXTtcbn1cblxuLyoqXG4gKiBIYWNrOiDnm67liY3lnKggZGI6Ly9hc3NldHMg5qC56Lev5b6E5LiL5re75Yqg6LWE5rqQ77yM5qC56Lev5b6E5rKh5pyJ5Y+R6YCBIGNoYW5nZSDov4fmnaVcbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICovXG5mdW5jdGlvbiB1cGRhdGVSb290QXNzZXQodXVpZDogc3RyaW5nKSB7XG4gICAgaWYgKHV1aWRUb1BhcmVudFV1aWRbdXVpZF0gPT09IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wpIHtcbiAgICAgICAgdW5GcmVlemUodXVpZCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1bkZyZWV6ZURpcmVjdG9yeSh1dWlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhc3NldCA9IHV1aWRUb0Fzc2V0W3V1aWRdO1xuICAgIGlmIChhc3NldCAmJiBhc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICB1bkZyZWV6ZSh1dWlkKTtcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbikpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICB1bkZyZWV6ZShjaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICog5pWw5o2u5pyJ5pu05paw5ZCO6Kej5Ya75pWw5o2uXG4gKiBAcGFyYW0gdXVpZCDotYTmupBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuRnJlZXplKHV1aWQ6IHN0cmluZykge1xuICAgIGlmICh1dWlkVG9Bc3NldFt1dWlkXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodXVpZFRvQXNzZXRbdXVpZF0gJiYgT2JqZWN0LmlzRnJvemVuKHV1aWRUb0Fzc2V0W3V1aWRdKSkge1xuICAgICAgICB1dWlkVG9Bc3NldFt1dWlkXSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodXVpZFRvQXNzZXRbdXVpZF0pKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiDph43mlrDmuLLmn5NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZShyZW5kZXJBbmltYXRpb25JZCk7XG4gICAgcmVuZGVyQW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICByZW5kZXJJbW1lZGlhdGVseSgpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVuZGVySW1tZWRpYXRlbHkoKSB7XG4gICAgZGlzcGxheUFycmF5ID0gW107XG4gICAgdXVpZFRvSW5kZXggPSB7IGxlbmd0aDogMCB9O1xuXG4gICAgcmVuZGVyRGF0YShwYW5lbERhdGEuY29uZmlnLnByb3RvY29sLCAtMSk7XG5cbiAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgYXdhaXQgc2VhcmNoRGF0YShkaXNwbGF5QXJyYXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdldEFsbEV4cGFuZHMocGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCwgZGlzcGxheUFycmF5KTtcbiAgICB9XG5cbiAgICBwYW5lbERhdGEuJC50cmVlLnJlbmRlcigpO1xufVxuXG4vKipcbiAqIOmHjeaWsOaOkuW6j1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb3J0KCkge1xuICAgIC8vIOWIoOmZpOW3suaOkuW6j+iusOW9lVxuICAgIHV1aWRUb0NoaWxkcmVuU29ydGVkID0ge307XG4gICAgcmVuZGVyKCk7XG59XG5cbi8qKlxuICog6L6T5Ye65qCR5b2i5pi+56S655qE6IqC54K5XG4gKiBAcGFyYW0gc3RhcnQg57Si5byV6LW35aeL5L2N572uXG4gKiBAcGFyYW0gZW5kIOe0ouW8lee7k+adn+S9jee9rlxuICovXG5leHBvcnQgZnVuY3Rpb24gb3V0cHV0RGlzcGxheShzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICAgIGNvbnN0IHJhbmdlRGlzcGxheTogSUFzc2V0SW5mb1tdID0gW107XG5cbiAgICBpZiAoZGlzcGxheUFycmF5Lmxlbmd0aCkge1xuICAgICAgICBzdGFydCA9IHN0YXJ0IDwgMCA/IDAgOiBzdGFydDtcbiAgICAgICAgZW5kID0gZGlzcGxheUFycmF5Lmxlbmd0aCA8IGVuZCA/IGRpc3BsYXlBcnJheS5sZW5ndGggOiBlbmQ7XG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IGRpc3BsYXlEYXRhKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByYW5nZURpc3BsYXkucHVzaChhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBPYmplY3QuZnJlZXplKHJhbmdlRGlzcGxheSk7XG4gICAgcmV0dXJuIHJhbmdlRGlzcGxheTtcbn1cblxuLyoqXG4gKiDlhoXpg6jlvqrnjq/liIfmjaLlsZXlvIDnirbmgIFcbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICogQHBhcmFtIGV4cGFuZCDmmK/lkKblsZXlvIBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvb3BFeHBhbmQodXVpZDogc3RyaW5nLCBleHBhbmQ/OiBib29sZWFuKSB7XG4gICAgaWYgKGV4cGFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGV4cGFuZCA9ICF1dWlkVG9FeHBhbmRbdXVpZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Y2V5q2lXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGV4cGFuZCDmmK/lkKblsZXlvIBcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzdGVwKHV1aWQ6IHN0cmluZywgZXhwYW5kOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgY29uc3QgbGVuZ3RoID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgdXVpZFRvRXhwYW5kW2NoaWxkXSA9IGV4cGFuZDtcbiAgICAgICAgICAgICAgICBzdGVwKGNoaWxkLCBleHBhbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFleHBhbmQpIHtcbiAgICAgICAgdG9nZ2xlRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIHN0ZXAodXVpZCwgZXhwYW5kKTtcblxuICAgICAgICAvLyBzdGVwIOWQjumcgOimgeWIt+aWsOinhuWbvlxuICAgICAgICByZW5kZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdGVwKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIHRvZ2dsZUV4cGFuZCh1dWlkLCBleHBhbmQpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDliIfmjaLmipjlj6DnirbmgIFcbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICogQHBhcmFtIGV4cGFuZCDmmK/lkKblsZXlvIBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUV4cGFuZCh1dWlkOiBzdHJpbmcsIGV4cGFuZD86IGJvb2xlYW4pIHtcbiAgICBpZiAoZXhwYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZXhwYW5kID0gIXV1aWRUb0V4cGFuZFt1dWlkXTtcbiAgICB9XG5cbiAgICBpZiAodXVpZFRvRXhwYW5kW3V1aWRdID09PSBleHBhbmQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHV1aWRUb0V4cGFuZFt1dWlkXSA9IGV4cGFuZDtcbiAgICByZW5kZXIoKTtcbn1cblxuLyoqXG4gKiDmjIflrprljZXkuKroioLngrnlsZXlvIBcbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcG9pbnRFeHBhbmQodXVpZDogc3RyaW5nKSB7XG4gICAgbGV0IHBvaW50VXVpZCA9IHV1aWQ7XG4gICAgbGV0IGlzVmlzaWJsZSA9IGRpc3BsYXlBcnJheS5pbmNsdWRlcyhwb2ludFV1aWQpO1xuICAgIHdoaWxlIChwb2ludFV1aWQgJiYgIWlzVmlzaWJsZSkge1xuICAgICAgICBwb2ludFV1aWQgPSB1dWlkVG9QYXJlbnRVdWlkW3BvaW50VXVpZF07XG4gICAgICAgIHV1aWRUb0V4cGFuZFtwb2ludFV1aWRdID0gdHJ1ZTtcbiAgICAgICAgaXNWaXNpYmxlID0gZGlzcGxheUFycmF5LmluY2x1ZGVzKHBvaW50VXVpZCk7XG4gICAgfVxuXG4gICAgYXdhaXQgcmVuZGVySW1tZWRpYXRlbHkoKTtcbn1cblxuLyoqXG4gKiDmn6Xor6LkuIDkuKrotYTmupDnmoQgY2hpbGRyZW4g5Lit5piv5ZCm5a2Y5ZyoIGludmFsaWQg55qE6LWE5rqQXG4gKiBAcGFyYW0gYXNzZXRJZFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGNvbnN0IGdldENoaWxkcmVuSW52YWxpZCA9IChhc3NldElkOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBhc3NldCA9IHV1aWRUb0Fzc2V0W2Fzc2V0SWRdO1xuXG4gICAgaWYgKCFhc3NldCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghKCdpc1BhcmVudCcgaW4gYXNzZXQpIHx8IGFzc2V0LmlzUGFyZW50ICE9PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiBhc3NldC5pbnZhbGlkO1xuICAgIH1cblxuICAgIGNvbnN0IGNoaWxkcmVuID0gdXVpZFRvQ2hpbGRyZW5bYXNzZXRJZF07XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGRyZW4uc29tZSgoY2hpbGRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gZ2V0Q2hpbGRyZW5JbnZhbGlkKGNoaWxkSWQpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiDmnoTlu7rmoJHlvaJcbiAqIEBwYXJhbSBhc3NldHMg6LWE5rqQ5YiX6KGo5Y6f5aeL5pWw5o2uXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkVHJlZShhc3NldHM6IEFzc2V0SW5mb1tdKSB7XG4gICAgY29uc3QgYXNzZXRzVHJlZTogYW55ID0ge1xuICAgICAgICBjaGlsZHJlbjoge30sXG4gICAgICAgIHV1aWQ6IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wsXG4gICAgfTtcblxuICAgIGNvbnN0IHJvb3RMZW5ndGggPSBhc3NldHNUcmVlLnV1aWQubGVuZ3RoO1xuICAgIGZvciAoY29uc3QgYXNzZXQgb2YgYXNzZXRzKSB7XG4gICAgICAgIGlmICghYXNzZXQudXJsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuYW1lcyA9IGFzc2V0LnVybC5zdWJzdHJpbmcocm9vdExlbmd0aCkuc3BsaXQoJy8nKTtcblxuICAgICAgICAvLyDmoLnmja7mkJzntKLot6/lvoTvvIzooaXlhajot6/lvoTkuIrnvLrlpLHnmoTmiYDmnInmlbDmja5cbiAgICAgICAgbGV0IHBhcmVudCA9IGFzc2V0c1RyZWU7XG4gICAgICAgIGxldCBjaGlsZCA9IGFzc2V0c1RyZWU7XG5cbiAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGlmICghY2hpbGQuY2hpbGRyZW5bbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQuY2hpbGRyZW5bbmFtZV0gPSB7IGNoaWxkcmVuOiB7fSwgdXVpZDogJycgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBjaGlsZDtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYnVpbGRUcmVlRGF0YShhc3NldCwgY2hpbGQsIHBhcmVudCk7XG4gICAgfVxufVxuXG4vKipcbiAqIOmAkuW9kui1hOa6kO+8jOS9v+S5i+S7juW5s+e6p+i9rOS4uuagkeW9olxuICogQHBhcmFtIGFzc2V0IOWOn+aVsOaNrlxuICogQHBhcmFtIGNoaWxkIOW9k+WJjeiKgueCuVxuICogQHBhcmFtIHBhcmVudCDniLboioLngrlcbiAqL1xuZnVuY3Rpb24gYnVpbGRUcmVlRGF0YShhc3NldDogQXNzZXRJbmZvLCBjaGlsZDogYW55LCBwYXJlbnQ6IGFueSkge1xuICAgIGlmICghYXNzZXQudXVpZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2hpbGQudXVpZCA9IGFzc2V0LnV1aWQ7XG4gICAgaWYgKGFzc2V0LmlzRGlyZWN0b3J5ICYmICF1dWlkVG9DaGlsZHJlblthc3NldC51dWlkXSkge1xuICAgICAgICB1dWlkVG9DaGlsZHJlblthc3NldC51dWlkXSA9IFtdO1xuICAgIH1cbiAgICAvLyDoh6rouqtcbiAgICB1dWlkVG9Bc3NldFthc3NldC51dWlkXSA9IGFzc2V0O1xuICAgIHVybFRvVXVpZFthc3NldC51cmxdID0gYXNzZXQudXVpZDtcbiAgICBpZiAoYXNzZXQuZmlsZSkge1xuICAgICAgICBmaWxlVG9VdWlkW2Fzc2V0LmZpbGVdID0gYXNzZXQudXVpZDtcbiAgICB9XG5cbiAgICAvLyDniLbnuqflhbPns7tcbiAgICBpZiAoIXV1aWRUb0NoaWxkcmVuW3BhcmVudC51dWlkXSkge1xuICAgICAgICB1dWlkVG9DaGlsZHJlbltwYXJlbnQudXVpZF0gPSBbXTtcbiAgICB9XG4gICAgaWYgKCF1dWlkVG9DaGlsZHJlbltwYXJlbnQudXVpZF0uaW5jbHVkZXMoYXNzZXQudXVpZCkpIHtcbiAgICAgICAgdXVpZFRvQ2hpbGRyZW5bcGFyZW50LnV1aWRdLnB1c2goYXNzZXQudXVpZCk7XG4gICAgfVxuICAgIHV1aWRUb1BhcmVudFV1aWRbYXNzZXQudXVpZF0gPSBwYXJlbnQudXVpZDtcblxuICAgIC8vIOWmguaenOaciSBzdWJBc3NldHMg5YiZ6YCS5b2S57un57ut5p+l6K+i5YaF6YOo55qEIHN1YkFzc2V0c1xuICAgIGZvciAoY29uc3QgbmFtZSBpbiBhc3NldC5zdWJBc3NldHMpIHtcbiAgICAgICAgY2hpbGQuY2hpbGRyZW5bbmFtZV0gPSB7IGNoaWxkcmVuOiB7fSB9O1xuICAgICAgICBidWlsZFRyZWVEYXRhKGFzc2V0LnN1YkFzc2V0c1tuYW1lXSwgY2hpbGQuY2hpbGRyZW5bbmFtZV0sIGNoaWxkKTtcbiAgICB9XG59XG5cbi8qKlxuICog6YeN5paw5riy5p+T5omA5pyJ5pWw5o2uXG4gKiBAcGFyYW0gdXVpZCDotYTmupBcbiAqIEBwYXJhbSBkZXB0aCDmoJHlvaLlsYLnuqdcbiAqL1xuZnVuY3Rpb24gcmVuZGVyRGF0YSh1dWlkOiBzdHJpbmcsIGRlcHRoOiBudW1iZXIpIHtcbiAgICB1dWlkVG9EZXB0aFt1dWlkXSA9IGRlcHRoO1xuICAgIHV1aWRUb0luZGV4W3V1aWRdID0gdXVpZFRvSW5kZXgubGVuZ3RoO1xuICAgIHV1aWRUb0luZGV4Lmxlbmd0aCsrO1xuXG4gICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICBpZiAoIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsZW5ndGggPSBjaGlsZHJlbi5sZW5ndGg7XG5cbiAgICBpZiAoIXV1aWRUb0NoaWxkcmVuU29ydGVkW3V1aWRdKSB7XG4gICAgICAgIHNvcnRUcmVlKGNoaWxkcmVuKTtcbiAgICAgICAgdXVpZFRvQ2hpbGRyZW5Tb3J0ZWRbdXVpZF0gPSB0cnVlO1xuICAgIH1cblxuICAgIGRlcHRoKys7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlbmRlckRhdGEoY2hpbGRyZW5baV0sIGRlcHRoKTtcbiAgICB9XG59XG5cbi8qKlxuICog6L6T5Ye65qC85byP5YyW5pWw5o2u5bm25Ya757uT5a6D77yM5L2/5a6D5LiN5ZyoIHZ1ZSDnm5HlkKzkuK3nlJ/mlYhcbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICovXG5mdW5jdGlvbiBkaXNwbGF5RGF0YSh1dWlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhc3NldCA9IHV1aWRUb0Fzc2V0W3V1aWRdIGFzIElBc3NldEluZm87XG5cbiAgICBpZiAoIWFzc2V0IHx8IE9iamVjdC5pc0Zyb3plbihhc3NldCkpIHtcbiAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgIH1cblxuICAgIGNvbnN0IGRlcHRoID0gdXVpZFRvRGVwdGhbdXVpZF07XG4gICAgY29uc3QgaXNEQiA9IGRlcHRoID09PSAwO1xuXG4gICAgY29uc3QgZmlsZUV4dCA9IGV4dG5hbWUoYXNzZXQubmFtZSk7XG5cbiAgICBhc3NldC5pc0RCID0gaXNEQjtcbiAgICBhc3NldC5pc0RpcmVjdG9yeSA9IGlzREIgPyB0cnVlIDogYXNzZXQuaXNEaXJlY3Rvcnk7XG4gICAgLy8g5qCR5b2i55qE54i257qn5LiJ6KeS5b2i5L6d5o2u5q2k5a2X5q6177yM5aaC5p6c5omA5pyJ5a2Q6LWE5rqQ5rKh5pyJ5pi+56S655qE6K+d77yM5bCx6K6+572u5Li6IGZhbHNlXG4gICAgYXNzZXQuaXNQYXJlbnQgPSB1dWlkVG9DaGlsZHJlblt1dWlkXSAmJiB1dWlkVG9DaGlsZHJlblt1dWlkXS5zb21lKChzdWIpID0+IHV1aWRUb0Fzc2V0W3N1Yl0/LnZpc2libGUpO1xuICAgIGFzc2V0LmlzU3ViQXNzZXQgPSB1dWlkLmluY2x1ZGVzKCdAJykgPyB0cnVlIDogZmFsc2U7XG5cbiAgICBhc3NldC5maWxlRXh0ID0gYXNzZXQuaXNEaXJlY3RvcnkgPyAnJyA6IGZpbGVFeHQudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICBhc3NldC5maWxlTmFtZSA9IGFzc2V0LmlzRGlyZWN0b3J5ID8gYXNzZXQubmFtZSA6IGFzc2V0Lm5hbWUuc3Vic3RyKDAsIGFzc2V0Lm5hbWUubGFzdEluZGV4T2YoZmlsZUV4dCkpO1xuXG4gICAgYXNzZXQuZGVwdGggPSBkZXB0aDtcblxuICAgIGNvbnN0IHsgaWNvbldpZHRoLCBub2RlTGVmdCB9ID0gcGFuZWxEYXRhLmNvbmZpZztcbiAgICBhc3NldC5sZWZ0ID0gbm9kZUxlZnQgKyBkZXB0aCAqIGljb25XaWR0aCAvIDIgKyAoYXNzZXQuaXNQYXJlbnQgPyAwIDogaWNvbldpZHRoKSA7XG5cbiAgICBhc3NldC5yZWZyZXNoVGltZSA9IHJlZnJlc2hUaW1lO1xuXG4gICAgY29uc3QgYWRkaXRpb25hbDogSURyYWdBZGRpdGlvbmFsW10gPSBbXTtcbiAgICBpZiAoYXNzZXQucmVkaXJlY3QpIHtcbiAgICAgICAgcHVzaEFkZGl0aW9uYWwoYWRkaXRpb25hbCwge1xuICAgICAgICAgICAgdHlwZTogYXNzZXQucmVkaXJlY3QudHlwZSxcbiAgICAgICAgICAgIHZhbHVlOiBhc3NldC5yZWRpcmVjdC51dWlkLFxuICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5L+u5aSNIHVpLWFzc2V0IOaLluWFpeivhuWIq+ayoeacieiAg+iZkee7p+aJv+mTvueahOmXrumimO+8jOavlOWmgiBjYy5UZXh0dXJlQmFzZSDopoHog73mjqXmlLYgY2MuVGV4dHVyZTJEIOeahOWbvueJh+aLluWFpVxuICAgICAgICBjb25zdCByZWRpcmVjdEFzc2V0ID0gdXVpZFRvQXNzZXRbYXNzZXQucmVkaXJlY3QudXVpZF0gYXMgSUFzc2V0SW5mbztcbiAgICAgICAgaWYgKHJlZGlyZWN0QXNzZXQpIHtcbiAgICAgICAgICAgIGlmIChyZWRpcmVjdEFzc2V0LmV4dGVuZHMgJiYgcmVkaXJlY3RBc3NldC5leHRlbmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZWRpcmVjdEFzc2V0LmV4dGVuZHMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwdXNoQWRkaXRpb25hbChhZGRpdGlvbmFsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBpdGVtLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJlZGlyZWN0QXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChhc3NldC5leHRlbmRzICYmIGFzc2V0LmV4dGVuZHMubGVuZ3RoID4gMCkge1xuICAgICAgICBhc3NldC5leHRlbmRzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHB1c2hBZGRpdGlvbmFsKGFkZGl0aW9uYWwsIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBpdGVtLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8g5bCG6Ieq5bex55qE5a2Q6IqC54K55aKe5Yqg5YiwIGFkZGl0aW9uYWwg5pWw57uE6YeMXG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXNzZXQuc3ViQXNzZXRzKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkID0gYXNzZXQuc3ViQXNzZXRzW2tleV07XG4gICAgICAgIGlmIChhc3NldC5yZWRpcmVjdCAmJiBhc3NldC5yZWRpcmVjdC51dWlkID09PSBjaGlsZC51dWlkKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBwdXNoQWRkaXRpb25hbChhZGRpdGlvbmFsLCB7XG4gICAgICAgICAgICB0eXBlOiBjaGlsZC50eXBlLFxuICAgICAgICAgICAgdmFsdWU6IGNoaWxkLnV1aWQsXG4gICAgICAgICAgICBuYW1lOiBjaGlsZC5uYW1lLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNoaWxkLmV4dGVuZHMgJiYgY2hpbGQuZXh0ZW5kcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjaGlsZC5leHRlbmRzLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBwdXNoQWRkaXRpb25hbChhZGRpdGlvbmFsLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0sXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjaGlsZC51dWlkLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjaGlsZC5uYW1lLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3NldC5hZGRpdGlvbmFsID0gYWRkaXRpb25hbDtcblxuICAgIE9iamVjdC5mcmVlemUoYXNzZXQpO1xuXG4gICAgcmV0dXJuIGFzc2V0O1xufVxuXG5mdW5jdGlvbiBwdXNoQWRkaXRpb25hbChhZGRpdGlvbmFsOiBJRHJhZ0FkZGl0aW9uYWxbXSwgZGF0YTogSURyYWdBZGRpdGlvbmFsKXtcbiAgICBjb25zdCBleGlzdCA9IGFkZGl0aW9uYWwuc29tZShpdGVtID0+IHsgXG4gICAgICAgIHJldHVybiBpdGVtLnR5cGUgPT09IGRhdGEudHlwZSAmJiBpdGVtLnZhbHVlID09PSBkYXRhLnZhbHVlO1xuICAgIH0pO1xuICAgIGlmICghZXhpc3Qpe1xuICAgICAgICBhZGRpdGlvbmFsLnB1c2goZGF0YSk7XG4gICAgfVxufVxuXG4vKipcbiAqIOaQnOe0ouaVsOaNrlxuICogQHBhcmFtIGRpc3BsYXlzIOimgeaYvuekuueahOaVsOaNru+8jOW+queOr+S9v+eUqO+8jOS4uuS6huaPkOmrmOmAn+W6pumZjeS9juWGheWtmFxuICovXG5hc3luYyBmdW5jdGlvbiBzZWFyY2hEYXRhKGRpc3BsYXlzOiBzdHJpbmdbXSkge1xuICAgIGxldCB7IHNlYXJjaFZhbHVlIH0gPSBwYW5lbERhdGEuJC5wYW5lbDtcbiAgICBjb25zdCB7IHNlYXJjaFR5cGUsIHNlYXJjaEFzc2V0VHlwZXMsIHNlYXJjaEluRm9sZGVyLCBleHRlbmRTZWFyY2hGdW5jIH0gPSBwYW5lbERhdGEuJC5wYW5lbDtcblxuICAgIGxldCBkZWNvbXByZXNzVVVJRCA9IHNlYXJjaFZhbHVlO1xuICAgIGlmICgoc2VhcmNoVHlwZSA9PT0gJ25hbWUnIHx8IHNlYXJjaFR5cGUgPT09ICd1dWlkJykgJiYgRWRpdG9yLlV0aWxzLlVVSUQuaXNVVUlEKHNlYXJjaFZhbHVlKSkge1xuICAgICAgICAvLyDlpoLmnpxcbiAgICAgICAgZGVjb21wcmVzc1VVSUQgPSBFZGl0b3IuVXRpbHMuVVVJRC5kZWNvbXByZXNzVVVJRChzZWFyY2hWYWx1ZSk7XG4gICAgfVxuXG4gICAgbGV0IGNvbXByZXNzVXVpZCA9IHNlYXJjaFZhbHVlO1xuICAgIGlmIChzZWFyY2hUeXBlID09PSAndXNhZ2VzJykge1xuICAgICAgICBjb25zdCB1dWlkID0gRWRpdG9yLlV0aWxzLlVVSUQuZGVjb21wcmVzc1VVSUQoc2VhcmNoVmFsdWUpO1xuICAgICAgICAvLyDooqvkvb/nlKjnmoTotYTmupDlpoLmnpzkuI3mmK8gY2MuU2NyaXB0IOexu+Wei++8jOi/mOaYr+eUqOWujOaVtCB1dWlkIOi/m+ihjOaQnOe0ou+8jOS4jemcgOimgeWOi+e8qSB1dWlkXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gZXhwb3J0cy51dWlkVG9Bc3NldFt1dWlkXTtcbiAgICAgICAgaWYgKGFzc2V0ICYmIGFzc2V0LnR5cGUgIT09ICdjYy5TY3JpcHQnKSB7XG4gICAgICAgICAgICBzZWFyY2hWYWx1ZSA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDlm6DkuLrmiZPljbAgdXVpZCDml7bnrKzkuozkuKrlj4LmlbDliKTmlq3kuobooqvkvb/nlKjnmoTotYTmupDmmK/lkKbkuLrohJrmnKzvvIzmiYDku6Xov5novrnpnIDopoHkuIDoh7RcbiAgICAgICAgICAgIC8vIOebruWJjeS5n+ayoeacieS4gOS4qui1hOa6kOW8leeUqOWPpuS4gOS4quiEmuacrOi1hOa6kOeahOaDheWGtVxuICAgICAgICAgICAgY29tcHJlc3NVdWlkID0gRWRpdG9yLlV0aWxzLlVVSUQuY29tcHJlc3NVVUlEKHNlYXJjaFZhbHVlLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYW5lbERhdGEuJC5wYW5lbC5yZWZyZXNoTG9jayA9IHRydWU7XG5cbiAgICBmb3IgKGNvbnN0IGRiUm9vdCBvZiB1dWlkVG9DaGlsZHJlbltwYW5lbERhdGEuY29uZmlnLnByb3RvY29sXSkge1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHV1aWRUb0NoaWxkcmVuW2RiUm9vdF07XG4gICAgICAgIGlmICghY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgYXdhaXQgbWF0Y2goY2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc29ydFRyZWUoZGlzcGxheXMsIHRydWUpO1xuXG4gICAgcGFuZWxEYXRhLiQucGFuZWwucmVmcmVzaExvY2sgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIOWMuemFjeaQnOe0oumhuVxuICAgICAqIEBwYXJhbSBjaGlsZCDlrZDoioLngrkgdXVpZFxuICAgICAqL1xuICAgIGFzeW5jIGZ1bmN0aW9uIG1hdGNoKGNoaWxkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSB1dWlkVG9Bc3NldFtjaGlsZF07XG4gICAgICAgIGlmICghYXNzZXQgfHwgYXNzZXQudmlzaWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IG5hbWUsIGRpc3BsYXlOYW1lLCB1dWlkLCB1cmwsIHR5cGUsIGZpbGUgfSA9IGFzc2V0O1xuICAgICAgICBsZXQgcGFzc0ZpbHRlciA9IHRydWU7XG5cbiAgICAgICAgLy8g5Zyo5paH5Lu25aS55YaF5pCc57SiXG4gICAgICAgIGlmIChzZWFyY2hJbkZvbGRlcikge1xuICAgICAgICAgICAgaWYgKHVybCA9PT0gc2VhcmNoSW5Gb2xkZXIudXJsIHx8ICF1cmwuc3RhcnRzV2l0aChgJHtzZWFyY2hJbkZvbGRlci51cmx9L2ApKSB7XG4gICAgICAgICAgICAgICAgcGFzc0ZpbHRlciA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6ZmQ5a6a5pCc57Si57G75Z6LXG4gICAgICAgIGlmIChzZWFyY2hBc3NldFR5cGVzLmxlbmd0aCAmJiAhc2VhcmNoQXNzZXRUeXBlcy5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICAgICAgcGFzc0ZpbHRlciA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlYXJjaFR5cGUgPT09ICdmYWlscycgJiYgYXNzZXQuaW1wb3J0ZWQpIHtcbiAgICAgICAgICAgIHBhc3NGaWx0ZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXNzRmlsdGVyKSB7XG4gICAgICAgICAgICBsZXQgbGVnYWwgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAoc2VhcmNoVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBsZWdhbCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8g5ZCN56ew5LiN5Yy65YiG5aSn5bCP5YaZXG4gICAgICAgICAgICAgICAgaWYgKHNlYXJjaFR5cGUgPT09ICduYW1lJyB8fCBzZWFyY2hUeXBlID09PSAnZmFpbHMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvd2VyU2VhcmNoVmFsdWUgPSBzZWFyY2hWYWx1ZS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b3RhbE5hbWUgPSBgJHtuYW1lfSR7ZGlzcGxheU5hbWV9YC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lSW5jbHVkZWQgPSB0b3RhbE5hbWUuaW5jbHVkZXMobG93ZXJTZWFyY2hWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lSW5jbHVkZWQgfHwgdXVpZC5pbmNsdWRlcyhkZWNvbXByZXNzVVVJRCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZ2FsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VhcmNoVHlwZSA9PT0gJ3V1aWQnICYmIHV1aWQuaW5jbHVkZXMoZGVjb21wcmVzc1VVSUQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxlZ2FsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlYXJjaFR5cGUgPT09ICd1cmwnICYmIHVybC5pbmNsdWRlcyhzZWFyY2hWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVnYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VhcmNoVHlwZSA9PT0gJ3VzYWdlcycpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBzdGF0U3luYyhmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0LmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHJlYWRGaWxlU3luYyhmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5pbmNsdWRlcyhzZWFyY2hWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVnYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VhcmNoVmFsdWUgIT09IGNvbXByZXNzVXVpZCAmJiBkYXRhLmluY2x1ZGVzKGNvbXByZXNzVXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVnYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV4dGVuZFNlYXJjaEZ1bmNbc2VhcmNoVHlwZV0pIHtcbiAgICAgICAgICAgICAgICAvLyDlpJbpg6jmianlsZXmkJzntKLmlrnms5VcbiAgICAgICAgICAgICAgICBsZWdhbCA9IGF3YWl0IGV4dGVuZFNlYXJjaEZ1bmNbc2VhcmNoVHlwZV0oc2VhcmNoVmFsdWUsIGFzc2V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxlZ2FsKSB7XG4gICAgICAgICAgICAgICAgdXVpZFRvSW5kZXhbdXVpZF0gPSB1dWlkVG9JbmRleC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdXVpZFRvSW5kZXgubGVuZ3RoKys7XG5cbiAgICAgICAgICAgICAgICBkaXNwbGF5cy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICAgICAgaWYgKCFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGVuZ3RoID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhd2FpdCBtYXRjaChjaGlsZHJlbltpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICog6I635Y+W5bGV5byA5ZCO55qE5omA5pyJ5ZCO5Luj6IqC54K5XG4gKiBAcGFyYW0gdXVpZCDotYTmupBcbiAqIEBwYXJhbSBkaXNwbGF5cyDopoHmmL7npLrnmoTmlbDmja7vvIzlvqrnjq/kvb/nlKjvvIzkuLrkuobmj5Dpq5jpgJ/luqbpmY3kvY7lhoXlrZhcbiAqL1xuZnVuY3Rpb24gZ2V0QWxsRXhwYW5kcyh1dWlkOiBzdHJpbmcsIGRpc3BsYXlzOiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IGNoaWxkcmVuID0gdXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IGNoaWxkcmVuLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2hpbGRVdWlkID0gY2hpbGRyZW5baV07XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXVpZFRvQXNzZXRbY2hpbGRVdWlkXSBhcyBJQXNzZXRJbmZvO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0IHx8IGFzc2V0LnZpc2libGUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRpc3BsYXlzLnB1c2goY2hpbGRVdWlkKTtcblxuICAgICAgICAgICAgaWYgKHV1aWRUb0V4cGFuZFtjaGlsZFV1aWRdKSB7XG4gICAgICAgICAgICAgICAgZ2V0QWxsRXhwYW5kcyhjaGlsZFV1aWQsIGRpc3BsYXlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8g5LyY5YyW5Y6f5pys55qEIGxvY2FsZUNvbXBhcmUg5pa55rOV77yM5oCn6IO95o+Q5Y2H77yaMTAwMCDnqbroioLngrkgMTEwM21zIC0+IDMxbXNcbmNvbnN0IGNvbGxhdG9yID0gbmV3IEludGwuQ29sbGF0b3IoJ2VuJywge1xuICAgIG51bWVyaWM6IHRydWUsXG4gICAgc2Vuc2l0aXZpdHk6ICdiYXNlJyxcbiAgICBpZ25vcmVQdW5jdHVhdGlvbjogdHJ1ZSwgLy8g5b+955Wl5qCH54K556ym5Y+3XG59KTtcblxuLyoqXG4gKiDmjpLluo9cbiAqIEBwYXJhbSBjaGlsZHJlbiDkuIDnu4TotYTmupAgdXVpZHNcbiAqL1xuZnVuY3Rpb24gc29ydFRyZWUoY2hpbGRyZW46IHN0cmluZ1tdLCBpc1NlYXJjaGluZ01vZGU/OiBib29sZWFuKSB7XG4gICAgY2hpbGRyZW4uc29ydCgoYVV1aWQ6IHN0cmluZywgYlV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBhID0gdXVpZFRvQXNzZXRbYVV1aWRdO1xuICAgICAgICBjb25zdCBiID0gdXVpZFRvQXNzZXRbYlV1aWRdO1xuXG4gICAgICAgIC8vIOaWh+S7tuWkueS8mOWFiFxuICAgICAgICBpZiAoYS5pc0RpcmVjdG9yeSA9PT0gdHJ1ZSAmJiAhYi5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9IGVsc2UgaWYgKCFhLmlzRGlyZWN0b3J5ICYmIGIuaXNEaXJlY3RvcnkgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLnNvcnRUeXBlID09PSAndHlwZScgJiYgYS5pbXBvcnRlciAhPT0gYi5pbXBvcnRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2xsYXRvci5jb21wYXJlKGEuaW1wb3J0ZXIsIGIuaW1wb3J0ZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvmoLnmja4gbmFtZSDmjpLluo9cbiAgICAgICAgICAgICAgICBpZiAoaXNTZWFyY2hpbmdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xsYXRvci5jb21wYXJlKGAke2EuZGlzcGxheU5hbWV9JHthLm5hbWV9YCwgYCR7Yi5kaXNwbGF5TmFtZX0ke2IubmFtZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbGxhdG9yLmNvbXBhcmUoYS5wYXRoLCBiLnBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG4iXX0=