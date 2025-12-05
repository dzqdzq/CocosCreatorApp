'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    const parentUrl = path_1.dirname(asset.url);
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
    const parentUrl = path_1.dirname(asset.url);
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
        return exports.getChildrenInvalid(childId);
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
    const fileExt = path_1.extname(asset.name);
    asset.isDB = isDB;
    asset.isDirectory = isDB ? true : asset.isDirectory;
    // 树形的父级三角形依据此字段，如果所有子资源没有显示的话，就设置为 false
    asset.isParent = exports.uuidToChildren[uuid] && exports.uuidToChildren[uuid].some((sub) => exports.uuidToAsset[sub]?.visible);
    asset.isSubAsset = uuid.includes('@') ? true : false;
    asset.fileExt = asset.isDirectory ? '' : fileExt.toLocaleLowerCase();
    asset.fileName = asset.isDirectory ? asset.name : asset.name.substr(0, asset.name.lastIndexOf(fileExt));
    asset.depth = depth;
    const { iconWidth, iconWidthMinus, nodeLeft } = panelData.config;
    asset.left = (asset.isParent ? depth : depth + 1) * iconWidth + nodeLeft;
    if (!asset.isParent) {
        asset.left += iconWidthMinus;
    }
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
                    if (fs_extra_1.existsSync(file)) {
                        const stat = fs_extra_1.statSync(file);
                        if (stat.isFile()) {
                            const data = fs_extra_1.readFileSync(file);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS1kYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL2NvbXBvbmVudHMvdHJlZS1kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUliLHVDQUE4RDtBQUM5RCwrQkFBd0M7QUFDeEMsd0RBQTBDO0FBQzFDLCtDQUFpQztBQUVwQixRQUFBLFFBQVEsR0FBRyxhQUFhLENBQUM7QUFDekIsUUFBQSxVQUFVLEdBQUcsZUFBZSxDQUFDO0FBQy9CLFFBQUEsV0FBVyxHQUEyQyxFQUFFLENBQUM7QUFDekQsUUFBQSxTQUFTLEdBQTJCLEVBQUUsQ0FBQztBQUN2QyxRQUFBLFVBQVUsR0FBMkIsRUFBRSxDQUFDO0FBQ3hDLFFBQUEsV0FBVyxHQUEyQixFQUFFLENBQUM7QUFDekMsUUFBQSxnQkFBZ0IsR0FBMkIsRUFBRSxDQUFDO0FBRTlDLFFBQUEsY0FBYyxHQUE2QixFQUFFLENBQUM7QUFDOUMsUUFBQSxvQkFBb0IsR0FBNEIsRUFBRSxDQUFDO0FBRW5ELFFBQUEsWUFBWSxHQUFhLEVBQUUsQ0FBQztBQUM1QixRQUFBLFdBQVcsR0FBMkIsRUFBRSxDQUFDO0FBQ3pDLFFBQUEsV0FBVyxHQUEyQixFQUFFLENBQUM7QUFFcEQsaUJBQWlCO0FBQ0osUUFBQSxZQUFZLEdBQTRCLEVBQUUsQ0FBQztBQUV4RCxrQkFBa0I7QUFDbEIsSUFBSSxXQUFnQixDQUFDO0FBRXJCLElBQUksaUJBQXNCLENBQUM7QUFFM0I7O0dBRUc7QUFDSSxLQUFLLFVBQVUsS0FBSztJQUN2QixNQUFNLEdBQUcsR0FBaUIsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBaUIsQ0FBQztJQUNyRyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1FBQzVELE9B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QUssSUFBSSxFQUFFO1lBQ2pELE9BQU8sQ0FBQyxDQUFDO1NBQ1o7YUFBTTtZQUNILElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxRQUFRLEVBQUU7Z0JBQ3BFLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNuRDtpQkFBTTtnQkFDSCxrQkFBa0I7Z0JBQ2xCLElBQUksZUFBZSxFQUFFO29CQUNqQixPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7aUJBQ3JGO2dCQUNELE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzQztTQUNKO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBBc3NldEluZm8sIElBc3NldEluZm8sIElEcmFnQWRkaXRpb25hbCB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHsgZXhpc3RzU3luYywgc3RhdFN5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGV4dG5hbWUsIGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHBhbmVsRGF0YSBmcm9tICcuL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbmV4cG9ydCBjb25zdCBkYkFzc2V0cyA9ICdkYjovL2Fzc2V0cyc7XG5leHBvcnQgY29uc3QgZGJJbnRlcm5hbCA9ICdkYjovL2ludGVybmFsJztcbmV4cG9ydCBsZXQgdXVpZFRvQXNzZXQ6IFJlY29yZDxzdHJpbmcsIElBc3NldEluZm8gfCBBc3NldEluZm8+ID0ge307XG5leHBvcnQgbGV0IHVybFRvVXVpZDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuZXhwb3J0IGxldCBmaWxlVG9VdWlkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5leHBvcnQgbGV0IHV1aWRUb1N0YXRlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5leHBvcnQgbGV0IHV1aWRUb1BhcmVudFV1aWQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuZXhwb3J0IGxldCB1dWlkVG9DaGlsZHJlbjogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+ID0ge307XG5leHBvcnQgbGV0IHV1aWRUb0NoaWxkcmVuU29ydGVkOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuXG5leHBvcnQgbGV0IGRpc3BsYXlBcnJheTogc3RyaW5nW10gPSBbXTtcbmV4cG9ydCBsZXQgdXVpZFRvRGVwdGg6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbmV4cG9ydCBsZXQgdXVpZFRvSW5kZXg6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcblxuLy8g5LiN5Y+C5LiOIHJlZnJlc2gg6YeN572uXG5leHBvcnQgY29uc3QgdXVpZFRvRXhwYW5kOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuXG4vLyDliLfmlrDml7bpl7TvvIzkuLvopoHnu5nlm77niYfnvKnnlaXlm77kvb/nlKhcbmxldCByZWZyZXNoVGltZTogYW55O1xuXG5sZXQgcmVuZGVyQW5pbWF0aW9uSWQ6IGFueTtcblxuLyoqXG4gKiDph43nva7pnaLmnb9cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGNvbnN0IGFycjogSUFzc2V0SW5mb1tdID0gKGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0cycpKSBhcyBJQXNzZXRJbmZvW107XG4gICAgaWYgKCFhcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVGhlIGRhdGEgcmVxdWVzdGVkIGZyb20gYXNzZXQtZGIgaXMgZW1wdHkuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjbGVhcigpO1xuXG4gICAgLyoqXG4gICAgICog6YeN6KaB77ya5o6S5bqP5piv5Li65LqG5LyY5YWI6I635b6X5paH5Lu25aS555qEIHV1aWTvvIzpgb/lhY3pg6jliIbmlofku7bml6nkuo7mlofku7blpLnml7blh7rnjrAg56m65oyC6L29IOeahOaDheWGtVxuICAgICAqIOepuuaMgui9vSB1dWlkVG9DaGlsZHJlbltwYXJlbnRVdWlkXSA9IElBc3NldEluZm/vvIzmraTml7YgcGFyZW50VXVpZCA9ICcnO1xuICAgICAqIOm7mOiupOmhuuW6j+S4uiBhc3NldHMsIGludGVybmFsLCDlhbbku5bmjInlrZfmr43mjpLluo9cbiAgICAgKi9cblxuICAgIGFyci5zb3J0KChhOiBJQXNzZXRJbmZvLCBiOiBJQXNzZXRJbmZvKSA9PiB7XG4gICAgICAgIGNvbnN0IGFTdGFydEFzc2V0cyA9IGEudXJsLnN0YXJ0c1dpdGgoZGJBc3NldHMpO1xuICAgICAgICBjb25zdCBhU3RhcnRJbnRlcm5hbCA9IGEudXJsLnN0YXJ0c1dpdGgoZGJJbnRlcm5hbCk7XG5cbiAgICAgICAgY29uc3QgYlN0YXJ0QXNzZXRzID0gYi51cmwuc3RhcnRzV2l0aChkYkFzc2V0cyk7XG4gICAgICAgIGNvbnN0IGJTdGFydEludGVybmFsID0gYi51cmwuc3RhcnRzV2l0aChkYkludGVybmFsKTtcblxuICAgICAgICBpZiAoKGFTdGFydEFzc2V0cyB8fCBhU3RhcnRJbnRlcm5hbCkgJiYgIWJTdGFydEFzc2V0cyAmJiAhYlN0YXJ0SW50ZXJuYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSBlbHNlIGlmICghYVN0YXJ0QXNzZXRzICYmICFhU3RhcnRJbnRlcm5hbCAmJiAoYlN0YXJ0QXNzZXRzIHx8IGJTdGFydEludGVybmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGF0b3IuY29tcGFyZShhLnVybCwgYi51cmwpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB1dWlkVG9DaGlsZHJlblNvcnRlZFtwYW5lbERhdGEuY29uZmlnLnByb3RvY29sXSA9IHRydWU7XG5cbiAgICBidWlsZFRyZWUoYXJyKTtcblxuICAgIGluaXRFeHBhbmQoKTtcblxuICAgIHJlbmRlcigpO1xufVxuXG4vKipcbiAqIOa4heepuuaVsOaNrlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdXVpZFRvQXNzZXQgPSB7fTtcbiAgICB1cmxUb1V1aWQgPSB7fTtcbiAgICBmaWxlVG9VdWlkID0ge307XG4gICAgdXVpZFRvQ2hpbGRyZW4gPSB7fTtcbiAgICB1dWlkVG9DaGlsZHJlblNvcnRlZCA9IHt9O1xuICAgIHV1aWRUb0RlcHRoID0ge307XG4gICAgdXVpZFRvSW5kZXggPSB7fTtcbiAgICB1dWlkVG9QYXJlbnRVdWlkID0ge307XG4gICAgdXVpZFRvU3RhdGUgPSB7fTtcbiAgICBkaXNwbGF5QXJyYXkgPSBbXTtcbiAgICB1dWlkVG9JbmRleCA9IHsgbGVuZ3RoOiAwIH07XG5cbiAgICByZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG59XG5cbmZ1bmN0aW9uIGluaXRFeHBhbmQoKSB7XG4gICAgaWYgKHV1aWRUb0V4cGFuZFtwYW5lbERhdGEuY29uZmlnLnByb3RvY29sXSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdXVpZFRvRXhwYW5kW3BhbmVsRGF0YS5jb25maWcucHJvdG9jb2xdID0gdHJ1ZTtcbiAgICB1dWlkVG9FeHBhbmRbZGJBc3NldHNdID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiDmlLbliLDlj5jliqjnmoQgaXBjIOa2iOaBr1xuICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gKiBAcGFyYW0gYXNzZXQg6LWE5rqQ5L+h5oGvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VkKHV1aWQ6IHN0cmluZywgYXNzZXQ6IEFzc2V0SW5mbykge1xuICAgIC8qKlxuICAgICAqIOaMieeOsOWcqOeahCBjaGFuZ2VkIOmhuuW6j++8jHN1YkFzc2V0cyDml6nkuo7niLbnuqflj5HpgIFcbiAgICAgKiDku7vmhI8gc3ViQXNzZXQg6YO95LiN6IO96ISx56a75a6e5L2T6LWE5rqQ77yM5omA5Lul5Y2V5LiAIHN1YkFzc2V0IOeahOWPmOWKqOWPr+S7peW/veeVpVxuICAgICAqIOeItue6p+eahOato+ehruaVsOaNrui/mOayoeacieWPkei/h+adpe+8jOaJgOS7peWKoOS4gOS4qiBsb2FkaW5nXG4gICAgICovXG4gICAgaWYgKHV1aWQuaW5jbHVkZXMoJ0AnKSkge1xuICAgICAgICBjb25zdCBwYXJlbnRVdWlkID0gdXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICAgICAgaWYgKHBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgIGlmICh1bkZyZWV6ZShwYXJlbnRVdWlkKSkge1xuICAgICAgICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgY29uc3Qgb2xkQXNzZXQgPSB1dWlkVG9Bc3NldFt1dWlkXTtcbiAgICBjb25zdCBvbGRQYXJlbnRVdWlkID0gdXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcblxuICAgIGlmICghb2xkQXNzZXQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgQ2FuIG5vdCBjaGFuZ2UgdGhlIGFzc2V0IFwiJHthc3NldC51cmx9XCIsIGJlY2F1c2UgdGhlIG9yaWdpbmFsIGFzc2V0IGlzIG5vdCBleGlzdC4gTWF5YmUgaXQgaXMgYSBuZXcgYXNzZXQuYCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyAxLzMg6Ieq6LqrXG4gICAgLy8g5Yig6Zmk5Y6f5YWI55qEIHVybFRvVXVpZCwgZmlsZVRvVXVpZCDlrZjlgqhcbiAgICBkZWxldGUgdXJsVG9VdWlkW29sZEFzc2V0LnVybF07XG4gICAgZGVsZXRlIGZpbGVUb1V1aWRbb2xkQXNzZXQuZmlsZV07XG4gICAgLy8g5riF56m6IHN1YkFzc2V0c1xuICAgIGlmICgnaXNQYXJlbnQnIGluIG9sZEFzc2V0ICYmIG9sZEFzc2V0LmlzUGFyZW50ICYmICFvbGRBc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICBsb29wRGVsZXRlU2VsZihjaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgdXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgICAgIGRlbGV0ZSB1dWlkVG9DaGlsZHJlblNvcnRlZFt1dWlkXTtcblxuICAgICAgICAvLyDlpoLmnpzmnIkgc3ViQXNzZXRzIOWImemAkuW9kue7p+e7reafpeivouWGhemDqOeahCBzdWJBc3NldHNcbiAgICAgICAgY29uc3Qgc3ViTmFtZXMgPSBPYmplY3Qua2V5cyhhc3NldC5zdWJBc3NldHMpO1xuICAgICAgICBpZiAoc3ViTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBpbmZvVHJlZTogYW55ID0ge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiB7fSxcbiAgICAgICAgICAgICAgICB1dWlkLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBzdWJOYW1lcykge1xuICAgICAgICAgICAgICAgIGluZm9UcmVlLmNoaWxkcmVuW25hbWVdID0geyBjaGlsZHJlbjoge30gfTtcbiAgICAgICAgICAgICAgICBidWlsZFRyZWVEYXRhKGFzc2V0LnN1YkFzc2V0c1tuYW1lXSwgaW5mb1RyZWUuY2hpbGRyZW5bbmFtZV0sIGluZm9UcmVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHV1aWRUb0Fzc2V0W3V1aWRdID0gYXNzZXQ7XG4gICAgdXJsVG9VdWlkW2Fzc2V0LnVybF0gPSB1dWlkO1xuICAgIGlmIChhc3NldC5maWxlKSB7XG4gICAgICAgIGZpbGVUb1V1aWRbYXNzZXQuZmlsZV0gPSB1dWlkO1xuICAgIH1cbiAgICB1dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuXG4gICAgY29uc3QgcGFyZW50VXJsID0gZGlybmFtZShhc3NldC51cmwpO1xuICAgIGNvbnN0IHBhcmVudFV1aWQgPSB1cmxUb1V1aWRbcGFyZW50VXJsXTtcblxuICAgIGlmICghcGFyZW50VXVpZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gMi8zIOS7juWOn+adpeeahOeItuiKgueCueWIoOmZpO+8jOa3u+WKoOWIsOaWsOeahOeItue6p1xuICAgIGlmIChwYXJlbnRVdWlkICYmIHBhcmVudFV1aWQgIT09IG9sZFBhcmVudFV1aWQpIHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlbltvbGRQYXJlbnRVdWlkXTtcbiAgICAgICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGNoaWxkcmVuLmluZGV4T2YodXVpZCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW4uc3BsaWNlKGNoaWxkcmVuLmluZGV4T2YodXVpZCksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dWlkVG9DaGlsZHJlbltwYXJlbnRVdWlkXSkge1xuICAgICAgICAgICAgdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0gPSBbXTtcbiAgICAgICAgICAgIHVuRnJlZXplKHBhcmVudFV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0uaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIHV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdLnB1c2godXVpZCk7XG4gICAgICAgIH1cbiAgICAgICAgdXVpZFRvUGFyZW50VXVpZFt1dWlkXSA9IHBhcmVudFV1aWQ7XG4gICAgICAgIHV1aWRUb0NoaWxkcmVuU29ydGVkW3BhcmVudFV1aWRdID0gZmFsc2U7XG4gICAgICAgIHV1aWRUb1N0YXRlW3BhcmVudFV1aWRdID0gJyc7XG4gICAgfVxuXG4gICAgLy8gMy8zIOWmguaenOaYr+aWh+S7tuWkue+8jOino+WGu+WtkOmbhuS7peS+v+mHjeaWsOiuoeeul+Wxgue6p1xuICAgIHVuRnJlZXplRGlyZWN0b3J5KHV1aWQpO1xuXG4gICAgcmVuZGVyKCk7XG59XG5cbi8qKlxuICog5pS25Yiw5paw5aKe55qEIGlwYyDmtojmga9cbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICogQHBhcmFtIGFzc2V0IOS/oeaBr1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkZWQodXVpZDogc3RyaW5nLCBhc3NldDogQXNzZXRJbmZvKSB7XG4gICAgY29uc3QgcGFyZW50VXJsID0gZGlybmFtZShhc3NldC51cmwpO1xuICAgIGNvbnN0IHBhcmVudFV1aWQgPSB1cmxUb1V1aWRbcGFyZW50VXJsXTtcblxuICAgIGlmICghcGFyZW50VXVpZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgLy8gMS8yIOiHqui6q+a3u+WKoFxuICAgIHV1aWRUb0Fzc2V0W3V1aWRdID0gYXNzZXQ7XG4gICAgdXJsVG9VdWlkW2Fzc2V0LnVybF0gPSB1dWlkO1xuICAgIGlmIChhc3NldC5maWxlKSB7XG4gICAgICAgIGZpbGVUb1V1aWRbYXNzZXQuZmlsZV0gPSB1dWlkO1xuICAgIH1cblxuICAgIC8vIOWmguaenOaciSBzdWJBc3NldHMg5YiZ6YCS5b2S57un57ut5p+l6K+i5YaF6YOo55qEIHN1YkFzc2V0c1xuICAgIGNvbnN0IHN1Yk5hbWVzID0gT2JqZWN0LmtleXMoYXNzZXQuc3ViQXNzZXRzKTtcbiAgICBpZiAoc3ViTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGluZm9UcmVlOiBhbnkgPSB7XG4gICAgICAgICAgICBjaGlsZHJlbjoge30sXG4gICAgICAgICAgICB1dWlkLFxuICAgICAgICB9O1xuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2Ygc3ViTmFtZXMpIHtcbiAgICAgICAgICAgIGluZm9UcmVlLmNoaWxkcmVuW25hbWVdID0geyBjaGlsZHJlbjoge30gfTtcbiAgICAgICAgICAgIGJ1aWxkVHJlZURhdGEoYXNzZXQuc3ViQXNzZXRzW25hbWVdLCBpbmZvVHJlZS5jaGlsZHJlbltuYW1lXSwgaW5mb1RyZWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gMi8yIOa3u+WKoOWIsOeItue6p1xuICAgIGlmICghdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0pIHtcbiAgICAgICAgdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0gPSBbXTtcbiAgICAgICAgdW5GcmVlemUocGFyZW50VXVpZCk7XG4gICAgfVxuICAgIGlmICghdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0uaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgdXVpZFRvQ2hpbGRyZW5bcGFyZW50VXVpZF0ucHVzaCh1dWlkKTtcbiAgICB9XG4gICAgdXVpZFRvUGFyZW50VXVpZFt1dWlkXSA9IHBhcmVudFV1aWQ7XG4gICAgdXVpZFRvU3RhdGVbcGFyZW50VXVpZF0gPSAnJztcbiAgICB1dWlkVG9DaGlsZHJlblNvcnRlZFtwYXJlbnRVdWlkXSA9IGZhbHNlO1xuXG4gICAgdXBkYXRlUm9vdEFzc2V0KHBhcmVudFV1aWQpO1xuICAgIHVuRnJlZXplRGlyZWN0b3J5KHBhcmVudFV1aWQpO1xuXG4gICAgcmVuZGVyKCk7XG59XG5cbi8qKlxuICog5pS25Yiw5Yig6Zmk55qEIGlwYyDmtojmga9cbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICogQHBhcmFtIGluZm8g5L+h5oGvXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgbG9vcERlbGV0ZVNlbGYodXVpZCk7XG5cbiAgICBjb25zdCBwYXJlbnRVdWlkID0gdXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICBpZiAocGFyZW50VXVpZCkge1xuICAgICAgICB1bkZyZWV6ZShwYXJlbnRVdWlkKTtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlbltwYXJlbnRVdWlkXTtcbiAgICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjaGlsZHJlbi5pbmRleE9mKHV1aWQpO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVSb290QXNzZXQocGFyZW50VXVpZCk7XG5cbiAgICByZW5kZXIoKTtcbn1cblxuLyoqXG4gKiDlhoXpg6jlvqrnjq/liKDpmaRcbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICovXG5mdW5jdGlvbiBsb29wRGVsZXRlU2VsZih1dWlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgbG9vcERlbGV0ZVNlbGYoY2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYXNzZXQgPSB1dWlkVG9Bc3NldFt1dWlkXTtcbiAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgZGVsZXRlIHVybFRvVXVpZFthc3NldC51cmxdO1xuICAgICAgICBkZWxldGUgZmlsZVRvVXVpZFthc3NldC5maWxlXTtcbiAgICB9XG5cbiAgICBkZWxldGUgdXVpZFRvQXNzZXRbdXVpZF07XG4gICAgZGVsZXRlIHV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgIGRlbGV0ZSB1dWlkVG9DaGlsZHJlblNvcnRlZFt1dWlkXTtcbiAgICBkZWxldGUgdXVpZFRvRXhwYW5kW3V1aWRdO1xuICAgIGRlbGV0ZSB1dWlkVG9EZXB0aFt1dWlkXTtcbiAgICBkZWxldGUgdXVpZFRvSW5kZXhbdXVpZF07XG4gICAgZGVsZXRlIHV1aWRUb1N0YXRlW3V1aWRdO1xufVxuXG4vKipcbiAqIEhhY2s6IOebruWJjeWcqCBkYjovL2Fzc2V0cyDmoLnot6/lvoTkuIvmt7vliqDotYTmupDvvIzmoLnot6/lvoTmsqHmnInlj5HpgIEgY2hhbmdlIOi/h+adpVxuICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVJvb3RBc3NldCh1dWlkOiBzdHJpbmcpIHtcbiAgICBpZiAodXVpZFRvUGFyZW50VXVpZFt1dWlkXSA9PT0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCkge1xuICAgICAgICB1bkZyZWV6ZSh1dWlkKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVuRnJlZXplRGlyZWN0b3J5KHV1aWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGFzc2V0ID0gdXVpZFRvQXNzZXRbdXVpZF07XG4gICAgaWYgKGFzc2V0ICYmIGFzc2V0LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgIHVuRnJlZXplKHV1aWQpO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIHVuRnJlZXplKGNoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiDmlbDmja7mnInmm7TmlrDlkI7op6PlhrvmlbDmja5cbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5GcmVlemUodXVpZDogc3RyaW5nKSB7XG4gICAgaWYgKHV1aWRUb0Fzc2V0W3V1aWRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh1dWlkVG9Bc3NldFt1dWlkXSAmJiBPYmplY3QuaXNGcm96ZW4odXVpZFRvQXNzZXRbdXVpZF0pKSB7XG4gICAgICAgIHV1aWRUb0Fzc2V0W3V1aWRdID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh1dWlkVG9Bc3NldFt1dWlkXSkpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIOmHjeaWsOa4suafk1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlbmRlckFuaW1hdGlvbklkKTtcbiAgICByZW5kZXJBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgIHJlbmRlckltbWVkaWF0ZWx5KCk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXJJbW1lZGlhdGVseSgpIHtcbiAgICBkaXNwbGF5QXJyYXkgPSBbXTtcbiAgICB1dWlkVG9JbmRleCA9IHsgbGVuZ3RoOiAwIH07XG5cbiAgICByZW5kZXJEYXRhKHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wsIC0xKTtcblxuICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICBhd2FpdCBzZWFyY2hEYXRhKGRpc3BsYXlBcnJheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0QWxsRXhwYW5kcyhwYW5lbERhdGEuY29uZmlnLnByb3RvY29sLCBkaXNwbGF5QXJyYXkpO1xuICAgIH1cblxuICAgIHBhbmVsRGF0YS4kLnRyZWUucmVuZGVyKCk7XG59XG5cbi8qKlxuICog6YeN5paw5o6S5bqPXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvcnQoKSB7XG4gICAgLy8g5Yig6Zmk5bey5o6S5bqP6K6w5b2VXG4gICAgdXVpZFRvQ2hpbGRyZW5Tb3J0ZWQgPSB7fTtcbiAgICByZW5kZXIoKTtcbn1cblxuLyoqXG4gKiDovpPlh7rmoJHlvaLmmL7npLrnmoToioLngrlcbiAqIEBwYXJhbSBzdGFydCDntKLlvJXotbflp4vkvY3nva5cbiAqIEBwYXJhbSBlbmQg57Si5byV57uT5p2f5L2N572uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvdXRwdXREaXNwbGF5KHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gICAgY29uc3QgcmFuZ2VEaXNwbGF5OiBJQXNzZXRJbmZvW10gPSBbXTtcblxuICAgIGlmIChkaXNwbGF5QXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIHN0YXJ0ID0gc3RhcnQgPCAwID8gMCA6IHN0YXJ0O1xuICAgICAgICBlbmQgPSBkaXNwbGF5QXJyYXkubGVuZ3RoIDwgZW5kID8gZGlzcGxheUFycmF5Lmxlbmd0aCA6IGVuZDtcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gZGlzcGxheURhdGEoZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgIHJhbmdlRGlzcGxheS5wdXNoKGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIE9iamVjdC5mcmVlemUocmFuZ2VEaXNwbGF5KTtcbiAgICByZXR1cm4gcmFuZ2VEaXNwbGF5O1xufVxuXG4vKipcbiAqIOWGhemDqOW+queOr+WIh+aNouWxleW8gOeKtuaAgVxuICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gKiBAcGFyYW0gZXhwYW5kIOaYr+WQpuWxleW8gFxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9vcEV4cGFuZCh1dWlkOiBzdHJpbmcsIGV4cGFuZD86IGJvb2xlYW4pIHtcbiAgICBpZiAoZXhwYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZXhwYW5kID0gIXV1aWRUb0V4cGFuZFt1dWlkXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDljZXmraVcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gZXhwYW5kIOaYr+WQpuWxleW8gFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHN0ZXAodXVpZDogc3RyaW5nLCBleHBhbmQ6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICAgICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICAgICAgICBjb25zdCBsZW5ndGggPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICB1dWlkVG9FeHBhbmRbY2hpbGRdID0gZXhwYW5kO1xuICAgICAgICAgICAgICAgIHN0ZXAoY2hpbGQsIGV4cGFuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWV4cGFuZCkge1xuICAgICAgICB0b2dnbGVFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgc3RlcCh1dWlkLCBleHBhbmQpO1xuXG4gICAgICAgIC8vIHN0ZXAg5ZCO6ZyA6KaB5Yi35paw6KeG5Zu+XG4gICAgICAgIHJlbmRlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ZXAodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgdG9nZ2xlRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgfVxufVxuXG4vKipcbiAqIOWIh+aNouaKmOWPoOeKtuaAgVxuICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gKiBAcGFyYW0gZXhwYW5kIOaYr+WQpuWxleW8gFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlRXhwYW5kKHV1aWQ6IHN0cmluZywgZXhwYW5kPzogYm9vbGVhbikge1xuICAgIGlmIChleHBhbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBleHBhbmQgPSAhdXVpZFRvRXhwYW5kW3V1aWRdO1xuICAgIH1cblxuICAgIGlmICh1dWlkVG9FeHBhbmRbdXVpZF0gPT09IGV4cGFuZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdXVpZFRvRXhwYW5kW3V1aWRdID0gZXhwYW5kO1xuICAgIHJlbmRlcigpO1xufVxuXG4vKipcbiAqIOaMh+WumuWNleS4quiKgueCueWxleW8gFxuICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwb2ludEV4cGFuZCh1dWlkOiBzdHJpbmcpIHtcbiAgICBsZXQgcG9pbnRVdWlkID0gdXVpZDtcbiAgICBsZXQgaXNWaXNpYmxlID0gZGlzcGxheUFycmF5LmluY2x1ZGVzKHBvaW50VXVpZCk7XG4gICAgd2hpbGUgKHBvaW50VXVpZCAmJiAhaXNWaXNpYmxlKSB7XG4gICAgICAgIHBvaW50VXVpZCA9IHV1aWRUb1BhcmVudFV1aWRbcG9pbnRVdWlkXTtcbiAgICAgICAgdXVpZFRvRXhwYW5kW3BvaW50VXVpZF0gPSB0cnVlO1xuICAgICAgICBpc1Zpc2libGUgPSBkaXNwbGF5QXJyYXkuaW5jbHVkZXMocG9pbnRVdWlkKTtcbiAgICB9XG5cbiAgICBhd2FpdCByZW5kZXJJbW1lZGlhdGVseSgpO1xufVxuXG4vKipcbiAqIOafpeivouS4gOS4qui1hOa6kOeahCBjaGlsZHJlbiDkuK3mmK/lkKblrZjlnKggaW52YWxpZCDnmoTotYTmupBcbiAqIEBwYXJhbSBhc3NldElkXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgY29uc3QgZ2V0Q2hpbGRyZW5JbnZhbGlkID0gKGFzc2V0SWQ6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IGFzc2V0ID0gdXVpZFRvQXNzZXRbYXNzZXRJZF07XG5cbiAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCEoJ2lzUGFyZW50JyBpbiBhc3NldCkgfHwgYXNzZXQuaXNQYXJlbnQgIT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIGFzc2V0LmludmFsaWQ7XG4gICAgfVxuXG4gICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlblthc3NldElkXTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShjaGlsZHJlbikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBjaGlsZHJlbi5zb21lKChjaGlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBnZXRDaGlsZHJlbkludmFsaWQoY2hpbGRJZCk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIOaehOW7uuagkeW9olxuICogQHBhcmFtIGFzc2V0cyDotYTmupDliJfooajljp/lp4vmlbDmja5cbiAqL1xuZnVuY3Rpb24gYnVpbGRUcmVlKGFzc2V0czogQXNzZXRJbmZvW10pIHtcbiAgICBjb25zdCBhc3NldHNUcmVlOiBhbnkgPSB7XG4gICAgICAgIGNoaWxkcmVuOiB7fSxcbiAgICAgICAgdXVpZDogcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCxcbiAgICB9O1xuXG4gICAgY29uc3Qgcm9vdExlbmd0aCA9IGFzc2V0c1RyZWUudXVpZC5sZW5ndGg7XG4gICAgZm9yIChjb25zdCBhc3NldCBvZiBhc3NldHMpIHtcbiAgICAgICAgaWYgKCFhc3NldC51cmwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5hbWVzID0gYXNzZXQudXJsLnN1YnN0cmluZyhyb290TGVuZ3RoKS5zcGxpdCgnLycpO1xuXG4gICAgICAgIC8vIOagueaNruaQnOe0oui3r+W+hO+8jOihpeWFqOi3r+W+hOS4iue8uuWkseeahOaJgOacieaVsOaNrlxuICAgICAgICBsZXQgcGFyZW50ID0gYXNzZXRzVHJlZTtcbiAgICAgICAgbGV0IGNoaWxkID0gYXNzZXRzVHJlZTtcblxuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgbmFtZXMpIHtcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjaGlsZC5jaGlsZHJlbltuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZC5jaGlsZHJlbltuYW1lXSA9IHsgY2hpbGRyZW46IHt9LCB1dWlkOiAnJyB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhcmVudCA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQuY2hpbGRyZW5bbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBidWlsZFRyZWVEYXRhKGFzc2V0LCBjaGlsZCwgcGFyZW50KTtcbiAgICB9XG59XG5cbi8qKlxuICog6YCS5b2S6LWE5rqQ77yM5L2/5LmL5LuO5bmz57qn6L2s5Li65qCR5b2iXG4gKiBAcGFyYW0gYXNzZXQg5Y6f5pWw5o2uXG4gKiBAcGFyYW0gY2hpbGQg5b2T5YmN6IqC54K5XG4gKiBAcGFyYW0gcGFyZW50IOeItuiKgueCuVxuICovXG5mdW5jdGlvbiBidWlsZFRyZWVEYXRhKGFzc2V0OiBBc3NldEluZm8sIGNoaWxkOiBhbnksIHBhcmVudDogYW55KSB7XG4gICAgaWYgKCFhc3NldC51dWlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjaGlsZC51dWlkID0gYXNzZXQudXVpZDtcbiAgICBpZiAoYXNzZXQuaXNEaXJlY3RvcnkgJiYgIXV1aWRUb0NoaWxkcmVuW2Fzc2V0LnV1aWRdKSB7XG4gICAgICAgIHV1aWRUb0NoaWxkcmVuW2Fzc2V0LnV1aWRdID0gW107XG4gICAgfVxuICAgIC8vIOiHqui6q1xuICAgIHV1aWRUb0Fzc2V0W2Fzc2V0LnV1aWRdID0gYXNzZXQ7XG4gICAgdXJsVG9VdWlkW2Fzc2V0LnVybF0gPSBhc3NldC51dWlkO1xuICAgIGlmIChhc3NldC5maWxlKSB7XG4gICAgICAgIGZpbGVUb1V1aWRbYXNzZXQuZmlsZV0gPSBhc3NldC51dWlkO1xuICAgIH1cblxuICAgIC8vIOeItue6p+WFs+ezu1xuICAgIGlmICghdXVpZFRvQ2hpbGRyZW5bcGFyZW50LnV1aWRdKSB7XG4gICAgICAgIHV1aWRUb0NoaWxkcmVuW3BhcmVudC51dWlkXSA9IFtdO1xuICAgIH1cbiAgICBpZiAoIXV1aWRUb0NoaWxkcmVuW3BhcmVudC51dWlkXS5pbmNsdWRlcyhhc3NldC51dWlkKSkge1xuICAgICAgICB1dWlkVG9DaGlsZHJlbltwYXJlbnQudXVpZF0ucHVzaChhc3NldC51dWlkKTtcbiAgICB9XG4gICAgdXVpZFRvUGFyZW50VXVpZFthc3NldC51dWlkXSA9IHBhcmVudC51dWlkO1xuXG4gICAgLy8g5aaC5p6c5pyJIHN1YkFzc2V0cyDliJnpgJLlvZLnu6fnu63mn6Xor6LlhoXpg6jnmoQgc3ViQXNzZXRzXG4gICAgZm9yIChjb25zdCBuYW1lIGluIGFzc2V0LnN1YkFzc2V0cykge1xuICAgICAgICBjaGlsZC5jaGlsZHJlbltuYW1lXSA9IHsgY2hpbGRyZW46IHt9IH07XG4gICAgICAgIGJ1aWxkVHJlZURhdGEoYXNzZXQuc3ViQXNzZXRzW25hbWVdLCBjaGlsZC5jaGlsZHJlbltuYW1lXSwgY2hpbGQpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDph43mlrDmuLLmn5PmiYDmnInmlbDmja5cbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICogQHBhcmFtIGRlcHRoIOagkeW9ouWxgue6p1xuICovXG5mdW5jdGlvbiByZW5kZXJEYXRhKHV1aWQ6IHN0cmluZywgZGVwdGg6IG51bWJlcikge1xuICAgIHV1aWRUb0RlcHRoW3V1aWRdID0gZGVwdGg7XG4gICAgdXVpZFRvSW5kZXhbdXVpZF0gPSB1dWlkVG9JbmRleC5sZW5ndGg7XG4gICAgdXVpZFRvSW5kZXgubGVuZ3RoKys7XG5cbiAgICBjb25zdCBjaGlsZHJlbiA9IHV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgIGlmICghY2hpbGRyZW4gfHwgIWNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxlbmd0aCA9IGNoaWxkcmVuLmxlbmd0aDtcblxuICAgIGlmICghdXVpZFRvQ2hpbGRyZW5Tb3J0ZWRbdXVpZF0pIHtcbiAgICAgICAgc29ydFRyZWUoY2hpbGRyZW4pO1xuICAgICAgICB1dWlkVG9DaGlsZHJlblNvcnRlZFt1dWlkXSA9IHRydWU7XG4gICAgfVxuXG4gICAgZGVwdGgrKztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVuZGVyRGF0YShjaGlsZHJlbltpXSwgZGVwdGgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDovpPlh7rmoLzlvI/ljJbmlbDmja7lubblhrvnu5PlroPvvIzkvb/lroPkuI3lnKggdnVlIOebkeWQrOS4reeUn+aViFxuICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gKi9cbmZ1bmN0aW9uIGRpc3BsYXlEYXRhKHV1aWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGFzc2V0ID0gdXVpZFRvQXNzZXRbdXVpZF0gYXMgSUFzc2V0SW5mbztcblxuICAgIGlmICghYXNzZXQgfHwgT2JqZWN0LmlzRnJvemVuKGFzc2V0KSkge1xuICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgfVxuXG4gICAgY29uc3QgZGVwdGggPSB1dWlkVG9EZXB0aFt1dWlkXTtcbiAgICBjb25zdCBpc0RCID0gZGVwdGggPT09IDA7XG5cbiAgICBjb25zdCBmaWxlRXh0ID0gZXh0bmFtZShhc3NldC5uYW1lKTtcblxuICAgIGFzc2V0LmlzREIgPSBpc0RCO1xuICAgIGFzc2V0LmlzRGlyZWN0b3J5ID0gaXNEQiA/IHRydWUgOiBhc3NldC5pc0RpcmVjdG9yeTtcbiAgICAvLyDmoJHlvaLnmoTniLbnuqfkuInop5LlvaLkvp3mja7mraTlrZfmrrXvvIzlpoLmnpzmiYDmnInlrZDotYTmupDmsqHmnInmmL7npLrnmoTor53vvIzlsLHorr7nva7kuLogZmFsc2VcbiAgICBhc3NldC5pc1BhcmVudCA9IHV1aWRUb0NoaWxkcmVuW3V1aWRdICYmIHV1aWRUb0NoaWxkcmVuW3V1aWRdLnNvbWUoKHN1YikgPT4gdXVpZFRvQXNzZXRbc3ViXT8udmlzaWJsZSk7XG4gICAgYXNzZXQuaXNTdWJBc3NldCA9IHV1aWQuaW5jbHVkZXMoJ0AnKSA/IHRydWUgOiBmYWxzZTtcblxuICAgIGFzc2V0LmZpbGVFeHQgPSBhc3NldC5pc0RpcmVjdG9yeSA/ICcnIDogZmlsZUV4dC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgIGFzc2V0LmZpbGVOYW1lID0gYXNzZXQuaXNEaXJlY3RvcnkgPyBhc3NldC5uYW1lIDogYXNzZXQubmFtZS5zdWJzdHIoMCwgYXNzZXQubmFtZS5sYXN0SW5kZXhPZihmaWxlRXh0KSk7XG5cbiAgICBhc3NldC5kZXB0aCA9IGRlcHRoO1xuXG4gICAgY29uc3QgeyBpY29uV2lkdGgsIGljb25XaWR0aE1pbnVzLCBub2RlTGVmdCB9ID0gcGFuZWxEYXRhLmNvbmZpZztcbiAgICBhc3NldC5sZWZ0ID0gKGFzc2V0LmlzUGFyZW50ID8gZGVwdGggOiBkZXB0aCArIDEpICogaWNvbldpZHRoICsgbm9kZUxlZnQ7XG4gICAgaWYgKCFhc3NldC5pc1BhcmVudCkge1xuICAgICAgICBhc3NldC5sZWZ0ICs9IGljb25XaWR0aE1pbnVzO1xuICAgIH1cblxuICAgIGFzc2V0LnJlZnJlc2hUaW1lID0gcmVmcmVzaFRpbWU7XG5cbiAgICBjb25zdCBhZGRpdGlvbmFsOiBJRHJhZ0FkZGl0aW9uYWxbXSA9IFtdO1xuICAgIGlmIChhc3NldC5yZWRpcmVjdCkge1xuICAgICAgICBwdXNoQWRkaXRpb25hbChhZGRpdGlvbmFsLCB7XG4gICAgICAgICAgICB0eXBlOiBhc3NldC5yZWRpcmVjdC50eXBlLFxuICAgICAgICAgICAgdmFsdWU6IGFzc2V0LnJlZGlyZWN0LnV1aWQsXG4gICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDkv67lpI0gdWktYXNzZXQg5ouW5YWl6K+G5Yir5rKh5pyJ6ICD6JmR57un5om/6ZO+55qE6Zeu6aKY77yM5q+U5aaCIGNjLlRleHR1cmVCYXNlIOimgeiDveaOpeaUtiBjYy5UZXh0dXJlMkQg55qE5Zu+54mH5ouW5YWlXG4gICAgICAgIGNvbnN0IHJlZGlyZWN0QXNzZXQgPSB1dWlkVG9Bc3NldFthc3NldC5yZWRpcmVjdC51dWlkXSBhcyBJQXNzZXRJbmZvO1xuICAgICAgICBpZiAocmVkaXJlY3RBc3NldCkge1xuICAgICAgICAgICAgaWYgKHJlZGlyZWN0QXNzZXQuZXh0ZW5kcyAmJiByZWRpcmVjdEFzc2V0LmV4dGVuZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJlZGlyZWN0QXNzZXQuZXh0ZW5kcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHB1c2hBZGRpdGlvbmFsKGFkZGl0aW9uYWwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0sXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcmVkaXJlY3RBc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGFzc2V0LmV4dGVuZHMgJiYgYXNzZXQuZXh0ZW5kcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFzc2V0LmV4dGVuZHMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcHVzaEFkZGl0aW9uYWwoYWRkaXRpb25hbCwge1xuICAgICAgICAgICAgICAgIHR5cGU6IGl0ZW0sXG4gICAgICAgICAgICAgICAgdmFsdWU6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyDlsIboh6rlt7HnmoTlrZDoioLngrnlop7liqDliLAgYWRkaXRpb25hbCDmlbDnu4Tph4xcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhc3NldC5zdWJBc3NldHMpIHtcbiAgICAgICAgY29uc3QgY2hpbGQgPSBhc3NldC5zdWJBc3NldHNba2V5XTtcbiAgICAgICAgaWYgKGFzc2V0LnJlZGlyZWN0ICYmIGFzc2V0LnJlZGlyZWN0LnV1aWQgPT09IGNoaWxkLnV1aWQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHB1c2hBZGRpdGlvbmFsKGFkZGl0aW9uYWwsIHtcbiAgICAgICAgICAgIHR5cGU6IGNoaWxkLnR5cGUsXG4gICAgICAgICAgICB2YWx1ZTogY2hpbGQudXVpZCxcbiAgICAgICAgICAgIG5hbWU6IGNoaWxkLm5hbWUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY2hpbGQuZXh0ZW5kcyAmJiBjaGlsZC5leHRlbmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNoaWxkLmV4dGVuZHMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHB1c2hBZGRpdGlvbmFsKGFkZGl0aW9uYWwsIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNoaWxkLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGNoaWxkLm5hbWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzc2V0LmFkZGl0aW9uYWwgPSBhZGRpdGlvbmFsO1xuXG4gICAgT2JqZWN0LmZyZWV6ZShhc3NldCk7XG5cbiAgICByZXR1cm4gYXNzZXQ7XG59XG5cbmZ1bmN0aW9uIHB1c2hBZGRpdGlvbmFsKGFkZGl0aW9uYWw6IElEcmFnQWRkaXRpb25hbFtdLCBkYXRhOiBJRHJhZ0FkZGl0aW9uYWwpe1xuICAgIGNvbnN0IGV4aXN0ID0gYWRkaXRpb25hbC5zb21lKGl0ZW0gPT4geyBcbiAgICAgICAgcmV0dXJuIGl0ZW0udHlwZSA9PT0gZGF0YS50eXBlICYmIGl0ZW0udmFsdWUgPT09IGRhdGEudmFsdWU7XG4gICAgfSk7XG4gICAgaWYgKCFleGlzdCl7XG4gICAgICAgIGFkZGl0aW9uYWwucHVzaChkYXRhKTtcbiAgICB9XG59XG5cbi8qKlxuICog5pCc57Si5pWw5o2uXG4gKiBAcGFyYW0gZGlzcGxheXMg6KaB5pi+56S655qE5pWw5o2u77yM5b6q546v5L2/55So77yM5Li65LqG5o+Q6auY6YCf5bqm6ZmN5L2O5YaF5a2YXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHNlYXJjaERhdGEoZGlzcGxheXM6IHN0cmluZ1tdKSB7XG4gICAgbGV0IHsgc2VhcmNoVmFsdWUgfSA9IHBhbmVsRGF0YS4kLnBhbmVsO1xuICAgIGNvbnN0IHsgc2VhcmNoVHlwZSwgc2VhcmNoQXNzZXRUeXBlcywgc2VhcmNoSW5Gb2xkZXIsIGV4dGVuZFNlYXJjaEZ1bmMgfSA9IHBhbmVsRGF0YS4kLnBhbmVsO1xuXG4gICAgbGV0IGRlY29tcHJlc3NVVUlEID0gc2VhcmNoVmFsdWU7XG4gICAgaWYgKChzZWFyY2hUeXBlID09PSAnbmFtZScgfHwgc2VhcmNoVHlwZSA9PT0gJ3V1aWQnKSAmJiBFZGl0b3IuVXRpbHMuVVVJRC5pc1VVSUQoc2VhcmNoVmFsdWUpKSB7XG4gICAgICAgIC8vIOWmguaenFxuICAgICAgICBkZWNvbXByZXNzVVVJRCA9IEVkaXRvci5VdGlscy5VVUlELmRlY29tcHJlc3NVVUlEKHNlYXJjaFZhbHVlKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcHJlc3NVdWlkID0gc2VhcmNoVmFsdWU7XG4gICAgaWYgKHNlYXJjaFR5cGUgPT09ICd1c2FnZXMnKSB7XG4gICAgICAgIGNvbnN0IHV1aWQgPSBFZGl0b3IuVXRpbHMuVVVJRC5kZWNvbXByZXNzVVVJRChzZWFyY2hWYWx1ZSk7XG4gICAgICAgIC8vIOiiq+S9v+eUqOeahOi1hOa6kOWmguaenOS4jeaYryBjYy5TY3JpcHQg57G75Z6L77yM6L+Y5piv55So5a6M5pW0IHV1aWQg6L+b6KGM5pCc57Si77yM5LiN6ZyA6KaB5Y6L57ypIHV1aWRcbiAgICAgICAgY29uc3QgYXNzZXQgPSBleHBvcnRzLnV1aWRUb0Fzc2V0W3V1aWRdO1xuICAgICAgICBpZiAoYXNzZXQgJiYgYXNzZXQudHlwZSAhPT0gJ2NjLlNjcmlwdCcpIHtcbiAgICAgICAgICAgIHNlYXJjaFZhbHVlID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWboOS4uuaJk+WNsCB1dWlkIOaXtuesrOS6jOS4quWPguaVsOWIpOaWreS6huiiq+S9v+eUqOeahOi1hOa6kOaYr+WQpuS4uuiEmuacrO+8jOaJgOS7pei/mei+uemcgOimgeS4gOiHtFxuICAgICAgICAgICAgLy8g55uu5YmN5Lmf5rKh5pyJ5LiA5Liq6LWE5rqQ5byV55So5Y+m5LiA5Liq6ISa5pys6LWE5rqQ55qE5oOF5Ya1XG4gICAgICAgICAgICBjb21wcmVzc1V1aWQgPSBFZGl0b3IuVXRpbHMuVVVJRC5jb21wcmVzc1VVSUQoc2VhcmNoVmFsdWUsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhbmVsRGF0YS4kLnBhbmVsLnJlZnJlc2hMb2NrID0gdHJ1ZTtcblxuICAgIGZvciAoY29uc3QgZGJSb290IG9mIHV1aWRUb0NoaWxkcmVuW3BhbmVsRGF0YS5jb25maWcucHJvdG9jb2xdKSB7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdXVpZFRvQ2hpbGRyZW5bZGJSb290XTtcbiAgICAgICAgaWYgKCFjaGlsZHJlbiB8fCAhY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICBhd2FpdCBtYXRjaChjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzb3J0VHJlZShkaXNwbGF5cywgdHJ1ZSk7XG5cbiAgICBwYW5lbERhdGEuJC5wYW5lbC5yZWZyZXNoTG9jayA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICog5Yy56YWN5pCc57Si6aG5XG4gICAgICogQHBhcmFtIGNoaWxkIOWtkOiKgueCuSB1dWlkXG4gICAgICovXG4gICAgYXN5bmMgZnVuY3Rpb24gbWF0Y2goY2hpbGQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBhc3NldCA9IHV1aWRUb0Fzc2V0W2NoaWxkXTtcbiAgICAgICAgaWYgKCFhc3NldCB8fCBhc3NldC52aXNpYmxlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgZGlzcGxheU5hbWUsIHV1aWQsIHVybCwgdHlwZSwgZmlsZSB9ID0gYXNzZXQ7XG4gICAgICAgIGxldCBwYXNzRmlsdGVyID0gdHJ1ZTtcblxuICAgICAgICAvLyDlnKjmlofku7blpLnlhoXmkJzntKJcbiAgICAgICAgaWYgKHNlYXJjaEluRm9sZGVyKSB7XG4gICAgICAgICAgICBpZiAodXJsID09PSBzZWFyY2hJbkZvbGRlci51cmwgfHwgIXVybC5zdGFydHNXaXRoKGAke3NlYXJjaEluRm9sZGVyLnVybH0vYCkpIHtcbiAgICAgICAgICAgICAgICBwYXNzRmlsdGVyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDpmZDlrprmkJzntKLnsbvlnotcbiAgICAgICAgaWYgKHNlYXJjaEFzc2V0VHlwZXMubGVuZ3RoICYmICFzZWFyY2hBc3NldFR5cGVzLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgICAgICBwYXNzRmlsdGVyID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VhcmNoVHlwZSA9PT0gJ2ZhaWxzJyAmJiBhc3NldC5pbXBvcnRlZCkge1xuICAgICAgICAgICAgcGFzc0ZpbHRlciA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhc3NGaWx0ZXIpIHtcbiAgICAgICAgICAgIGxldCBsZWdhbCA9IHRydWU7XG5cbiAgICAgICAgICAgIGlmIChzZWFyY2hWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGxlZ2FsID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyDlkI3np7DkuI3ljLrliIblpKflsI/lhplcbiAgICAgICAgICAgICAgICBpZiAoc2VhcmNoVHlwZSA9PT0gJ25hbWUnIHx8IHNlYXJjaFR5cGUgPT09ICdmYWlscycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG93ZXJTZWFyY2hWYWx1ZSA9IHNlYXJjaFZhbHVlLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsTmFtZSA9IGAke25hbWV9JHtkaXNwbGF5TmFtZX1gLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVJbmNsdWRlZCA9IHRvdGFsTmFtZS5pbmNsdWRlcyhsb3dlclNlYXJjaFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVJbmNsdWRlZCB8fCB1dWlkLmluY2x1ZGVzKGRlY29tcHJlc3NVVUlEKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVnYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWFyY2hUeXBlID09PSAndXVpZCcgJiYgdXVpZC5pbmNsdWRlcyhkZWNvbXByZXNzVVVJRCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVnYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VhcmNoVHlwZSA9PT0gJ3VybCcgJiYgdXJsLmluY2x1ZGVzKHNlYXJjaFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBsZWdhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWFyY2hUeXBlID09PSAndXNhZ2VzJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RzU3luYyhmaWxlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdCA9IHN0YXRTeW5jKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXQuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gcmVhZEZpbGVTeW5jKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmluY2x1ZGVzKHNlYXJjaFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWdhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWFyY2hWYWx1ZSAhPT0gY29tcHJlc3NVdWlkICYmIGRhdGEuaW5jbHVkZXMoY29tcHJlc3NVdWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWdhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXh0ZW5kU2VhcmNoRnVuY1tzZWFyY2hUeXBlXSkge1xuICAgICAgICAgICAgICAgIC8vIOWklumDqOaJqeWxleaQnOe0ouaWueazlVxuICAgICAgICAgICAgICAgIGxlZ2FsID0gYXdhaXQgZXh0ZW5kU2VhcmNoRnVuY1tzZWFyY2hUeXBlXShzZWFyY2hWYWx1ZSwgYXNzZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobGVnYWwpIHtcbiAgICAgICAgICAgICAgICB1dWlkVG9JbmRleFt1dWlkXSA9IHV1aWRUb0luZGV4Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICB1dWlkVG9JbmRleC5sZW5ndGgrKztcblxuICAgICAgICAgICAgICAgIGRpc3BsYXlzLnB1c2godXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgICAgICBpZiAoIWNoaWxkcmVuIHx8ICFjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsZW5ndGggPSBjaGlsZHJlbi5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGF3YWl0IG1hdGNoKGNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiDojrflj5blsZXlvIDlkI7nmoTmiYDmnInlkI7ku6PoioLngrlcbiAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICogQHBhcmFtIGRpc3BsYXlzIOimgeaYvuekuueahOaVsOaNru+8jOW+queOr+S9v+eUqO+8jOS4uuS6huaPkOmrmOmAn+W6pumZjeS9juWGheWtmFxuICovXG5mdW5jdGlvbiBnZXRBbGxFeHBhbmRzKHV1aWQ6IHN0cmluZywgZGlzcGxheXM6IHN0cmluZ1tdKSB7XG4gICAgY29uc3QgY2hpbGRyZW4gPSB1dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZFV1aWQgPSBjaGlsZHJlbltpXTtcblxuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dWlkVG9Bc3NldFtjaGlsZFV1aWRdIGFzIElBc3NldEluZm87XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQgfHwgYXNzZXQudmlzaWJsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGlzcGxheXMucHVzaChjaGlsZFV1aWQpO1xuXG4gICAgICAgICAgICBpZiAodXVpZFRvRXhwYW5kW2NoaWxkVXVpZF0pIHtcbiAgICAgICAgICAgICAgICBnZXRBbGxFeHBhbmRzKGNoaWxkVXVpZCwgZGlzcGxheXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyDkvJjljJbljp/mnKznmoQgbG9jYWxlQ29tcGFyZSDmlrnms5XvvIzmgKfog73mj5DljYfvvJoxMDAwIOepuuiKgueCuSAxMTAzbXMgLT4gMzFtc1xuY29uc3QgY29sbGF0b3IgPSBuZXcgSW50bC5Db2xsYXRvcignZW4nLCB7XG4gICAgbnVtZXJpYzogdHJ1ZSxcbiAgICBzZW5zaXRpdml0eTogJ2Jhc2UnLFxufSk7XG5cbi8qKlxuICog5o6S5bqPXG4gKiBAcGFyYW0gY2hpbGRyZW4g5LiA57uE6LWE5rqQIHV1aWRzXG4gKi9cbmZ1bmN0aW9uIHNvcnRUcmVlKGNoaWxkcmVuOiBzdHJpbmdbXSwgaXNTZWFyY2hpbmdNb2RlPzogYm9vbGVhbikge1xuICAgIGNoaWxkcmVuLnNvcnQoKGFVdWlkOiBzdHJpbmcsIGJVdWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgYSA9IHV1aWRUb0Fzc2V0W2FVdWlkXTtcbiAgICAgICAgY29uc3QgYiA9IHV1aWRUb0Fzc2V0W2JVdWlkXTtcblxuICAgICAgICAvLyDmlofku7blpLnkvJjlhYhcbiAgICAgICAgaWYgKGEuaXNEaXJlY3RvcnkgPT09IHRydWUgJiYgIWIuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgfSBlbHNlIGlmICghYS5pc0RpcmVjdG9yeSAmJiBiLmlzRGlyZWN0b3J5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5zb3J0VHlwZSA9PT0gJ3R5cGUnICYmIGEuaW1wb3J0ZXIgIT09IGIuaW1wb3J0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sbGF0b3IuY29tcGFyZShhLmltcG9ydGVyLCBiLmltcG9ydGVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5pCc57Si5qih5byP5LiL5qC55o2uIG5hbWUg5o6S5bqPXG4gICAgICAgICAgICAgICAgaWYgKGlzU2VhcmNoaW5nTW9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sbGF0b3IuY29tcGFyZShgJHthLmRpc3BsYXlOYW1lfSR7YS5uYW1lfWAsIGAke2IuZGlzcGxheU5hbWV9JHtiLm5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb2xsYXRvci5jb21wYXJlKGEucGF0aCwgYi5wYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufVxuIl19