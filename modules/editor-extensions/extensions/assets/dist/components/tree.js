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
exports.mounted = exports.data = exports.watch = exports.methods = exports.components = exports.template = exports.props = exports.name = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const panelData = __importStar(require("./panel-data"));
const treeData = __importStar(require("./tree-data"));
const utils = __importStar(require("./utils"));
let vm = null;
let requestAnimationId;
// 用于识别 drag 悬停，自动展开文件夹
let dragOverUuid;
let dragOverTimeId;
let selectedTimeId;
let refreshingTimeId;
exports.name = 'tree';
exports.props = {
    droppableTypesProp: {
        type: Array,
        default() {
            return [];
        },
    },
};
exports.template = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../static/template/tree.html'), 'utf8');
exports.components = {
    'tree-node': require('./tree-node'),
};
exports.methods = {
    /**
     * 翻译
     * @param key 不带面板名称的标记字符
     */
    t(key) {
        return panelData.$.panel.t(key);
    },
    /**
     * 外部数据更新后，更新内部数据
     */
    update() {
        vm.droppableTypes = [...vm.droppableTypesProp, ...panelData.config.assetTypes()];
        // 清空新建或重命名状态
        vm.addInfo.parentDir = '';
        vm.renameUrl = '';
    },
    /**
     * 清空树形
     */
    clear() {
        treeData.clear();
        vm.render();
    },
    /**
     * 刷新树形
     * @param type 是否重置数据
     * @param name ipc 动作的名称
     */
    refreshing(type, name, uuid) {
        if (uuid && vm.refreshing.ignores[uuid]) {
            delete vm.refreshing.ignores[uuid];
            return;
        }
        panelData.$.panel.refreshing = { type, name };
        window.clearTimeout(refreshingTimeId);
        refreshingTimeId = window.setTimeout(() => {
            // 提示消失
            panelData.$.panel.refreshing.type = '';
            vm.refreshing.ignores = {};
        }, 1000);
    },
    /**
     * 节点的折叠/展开切换
     * @param uuid 资源
     * @param expand  是否展开
     * @param loop  按住 Alt 键可进入子节点循环
     */
    toggle(uuid, expand, loop) {
        if (loop) {
            treeData.loopExpand(uuid, expand);
        }
        else {
            treeData.toggleExpand(uuid, expand);
        }
    },
    /**
     * 判断下个动作是收起还是展开 （当存在不同状态的文件夹时，视为收起。当状态相同，取反即可。）
     * @param parents
     * @returns boolean
     */
    nextToggleExpand(parents) {
        let result = false; // 默认为收起
        // 根据规则，那么只有当全部都为收起的时候，需要展开的操作
        const isAllClose = parents.every((parentID) => {
            const parent = treeData.uuidToAsset[parentID];
            if (!('isParent' in parent && parent.isParent)) {
                parentID = treeData.uuidToParentUuid[parentID];
            }
            return !treeData.uuidToExpand[parentID];
        });
        if (isAllClose) {
            result = true;
        }
        return result;
    },
    /**
     * 全部节点折叠或展开
     */
    allToggle() {
        let parents = treeData.uuidToChildren[panelData.config.protocol];
        const selectsLength = panelData.act.selects.length;
        if (selectsLength) {
            parents = panelData.act.selects;
        }
        const parentsLength = parents.length;
        if (!parentsLength) {
            return;
        }
        const expand = vm.nextToggleExpand(parents);
        for (let i = 0; i < parentsLength; i++) {
            let parentUuid = parents[i];
            const parent = treeData.uuidToAsset[parentUuid];
            if (!('isParent' in parent && parent.isParent)) {
                parentUuid = treeData.uuidToParentUuid[parentUuid];
            }
            treeData.loopExpand(parentUuid, expand);
        }
    },
    /**
     * 全选
     * @param uuid 全选该目标节点下的子节点
     */
    selectAll(uuid) {
        // 摸索模式下，全选为当前列表
        if (utils.isSearchingMode()) {
            Editor.Selection.clear('asset');
            Editor.Selection.select('asset', treeData.displayArray);
            return;
        }
        let parentUuid = uuid || vm.getFirstSelectSortByDisplay();
        if (!treeData.uuidToChildren[parentUuid]) {
            parentUuid = treeData.uuidToParentUuid[parentUuid];
        }
        // 获取已展开的子节点
        const childrenUuid = [];
        utils.getChildrenUuid(parentUuid, childrenUuid, true);
        const cloneSelects = panelData.act.selects.slice();
        const parentIn = cloneSelects.includes(parentUuid);
        let childrenAllIn = true;
        const childrenUuidLength = childrenUuid.length;
        for (let i = 0; i < childrenUuidLength; i++) {
            if (!panelData.act.selects.includes(childrenUuid[i])) {
                childrenAllIn = false;
            }
        }
        if (childrenAllIn) {
            if (!parentIn) {
                Editor.Selection.select('asset', parentUuid);
            }
            else {
                // 往上一层
                if (parentUuid !== panelData.config.protocol) {
                    vm.selectAll(treeData.uuidToParentUuid[parentUuid]);
                }
            }
        }
        else {
            Editor.Selection.clear('asset');
            if (parentIn) {
                childrenUuid.unshift(parentUuid);
                Editor.Selection.select('asset', childrenUuid);
            }
            else {
                Editor.Selection.select('asset', childrenUuid);
            }
        }
    },
    selectClear() {
        Editor.Selection.clear('asset');
    },
    /**
     * 添加选中项
     * @param uuids string | string[]
     */
    selected(uuids) {
        if (!Array.isArray(uuids)) {
            uuids = [uuids];
        }
        uuids.forEach((uuid) => {
            if (!panelData.act.selects.includes(uuid)) {
                panelData.act.selects.push(uuid);
                vm.intoViewBySelected = uuid;
                window.clearTimeout(selectedTimeId);
                selectedTimeId = window.setTimeout(() => {
                    utils.scrollIntoView(vm.intoViewBySelected);
                }, 50);
                // 检查 shift 多选的动作
                if (uuid === vm.checkShiftUpDownMerge.uuid) {
                    vm.shiftUpDownMergeSelected();
                }
            }
        });
        panelData.$.panel.allExpand = vm.isAllExpand();
    },
    /**
     * 取消选中项
     * @param uuid 资源
     */
    unselected(uuid) {
        const index = panelData.act.selects.indexOf(uuid);
        if (index !== -1) {
            panelData.act.selects.splice(index, 1);
            window.clearTimeout(selectedTimeId);
            selectedTimeId = window.setTimeout(() => {
                treeData.render();
            }, 50);
        }
        if (vm.intoViewBySelected === uuid) {
            vm.intoViewBySelected = '';
        }
    },
    /**
     * 恢复选中状态
     */
    resetSelected() {
        panelData.act.selects = [];
        const uuids = Editor.Selection.getSelected('asset');
        vm.selected(uuids);
        window.clearTimeout(selectedTimeId);
        utils.scrollIntoView(vm.intoViewBySelected, true);
    },
    /**
     * shift + click 多选
     * @param uuid 资源
     */
    shiftClick(uuid) {
        if (panelData.act.selects.length === 0) {
            vm.ipcSelect(uuid);
            return;
        }
        const selects = [];
        const { displayArray } = treeData;
        const firstIndex = displayArray.indexOf(panelData.act.selects[0]);
        const lastIndex = displayArray.indexOf(uuid);
        if (firstIndex !== -1 || lastIndex !== -1) {
            if (firstIndex <= lastIndex) {
                for (let i = firstIndex; i <= lastIndex; i++) {
                    selects.push(displayArray[i]);
                }
            }
            else {
                for (let i = firstIndex; i >= lastIndex; i--) {
                    selects.push(displayArray[i]);
                }
            }
        }
        vm.ipcSelect(selects);
    },
    /**
     * ctrl + click 选中或取消选中项
     * @param uuid 资源
     */
    ctrlClick(uuid) {
        if (panelData.act.selects.includes(uuid)) {
            Editor.Selection.unselect('asset', uuid);
        }
        else {
            Editor.Selection.select('asset', uuid);
        }
    },
    /**
     * 选中节点
     * @param uuids 资源
     */
    ipcSelect(uuids) {
        Editor.Selection.clear('asset');
        Editor.Selection.select('asset', uuids);
    },
    /**
     * 选中树形上的第一个节点
     */
    ipcSelectFirstChild() {
        Editor.Selection.clear('asset');
        const uuid = this.getFirstChild();
        if (uuid) {
            Editor.Selection.select('asset', uuid);
        }
    },
    /**
     * 空白处点击，取消选中
     */
    click() {
        if (panelData.$.panel.isOperating) {
            return;
        }
        Editor.Selection.clear('asset');
    },
    /**
     * 创建前，名称处理
     * @param addInfo 信息
     */
    async addTo(addInfo) {
        if (utils.isSearchingMode()) {
            panelData.$.panel.clearSearch();
            await new Promise((r) => setTimeout(r, 300));
        }
        if (!addInfo.uuid) {
            addInfo.uuid = vm.getFirstSelect();
        }
        // 自身或父级文件夹
        const parent = utils.closestWhichCanCreate(addInfo.uuid);
        // parent 不存在或处于其他状态，不适合创建
        if (!parent || treeData.uuidToState[parent.uuid]) {
            const msg = Editor.I18n.t('assets.operate.canNotAddTo', {
                uuid: addInfo.uuid,
            });
            console.warn(msg);
            return;
        }
        // 展开父级节点
        vm.toggle(parent.uuid, true);
        // 滚动到顶层视窗
        await utils.scrollIntoView(parent.uuid);
        const parentDir = parent.url;
        let fileName = addInfo.fileName || 'New File';
        let fileExt = `.${addInfo.type}`;
        const camelFormatReg = /@ccclass([^<]*)(<%CamelCaseClassName%>)/;
        const classNameFormatReg = /@ccclass\(['"]([^'"]*)['"]\)/;
        const commentsReg = /(\n[^\n]*\/\*[\s\S]*?\*\/)|(\n[^\n]*\/\/(?:[^\r\n]|\r(?!\n))*)/g; // 注释区域连同连续的空行
        switch (addInfo.type) {
            case 'directory':
                fileExt = '';
                break;
            case 'ts':
            case 'js': {
                if (!addInfo.content) {
                    addInfo.content = '';
                    const fileUrl = `db://internal/default_file_content/${addInfo.template || addInfo.type}`;
                    const fileUuid = await Editor.Message.request('asset-db', 'query-uuid', fileUrl);
                    if (fileUuid) {
                        const fileInfo = await Editor.Message.request('asset-db', 'query-asset-info', fileUuid);
                        if (!fileInfo || !(0, fs_1.existsSync)(fileInfo.file)) {
                            console.error(vm.t('readDefaultFileFail'), fileUrl);
                            return;
                        }
                        addInfo.content = (0, fs_1.readFileSync)(fileInfo.file, 'utf-8');
                    }
                }
                // 整理并识别模板数据
                addInfo.content = addInfo.content.replace(commentsReg, ($0) => {
                    if ($0.includes('COMMENTS_GENERATE_IGNORE')) {
                        return '';
                    }
                    return $0;
                });
                // 识别是否启用驼峰格式的类名
                utils.scriptName.requiredCamelCaseClassName = camelFormatReg.test(addInfo.content);
                const nameMatches = addInfo.content.match(classNameFormatReg);
                utils.scriptName.classNameStringFormat = nameMatches && nameMatches[1] ? nameMatches[1] : '';
                fileName = await utils.scriptName.getValidFileName(fileName);
                break;
            }
        }
        // 最后以这个 url 数据为准
        let url = `${parentDir}/${fileName}${fileExt}`;
        url = await Editor.Message.request('asset-db', 'generate-available-url', url);
        vm.addInfo = {
            url,
            type: addInfo.type,
            importer: addInfo.importer,
            template: addInfo.template,
            content: addInfo.content,
            fileExt,
            fileName: (0, path_1.basename)(url, fileExt),
            name: (0, path_1.basename)(url),
            parentDir,
            parentUuid: parent.uuid,
        };
    },
    /**
     * 名称填写后提交到这里
     * @param addInfo 信息
     */
    async addConfirm(addInfo) {
        // 数据错误时取消
        if (!addInfo || !addInfo.parentDir || !addInfo.parentUuid || !addInfo.fileName) {
            // 新增的输入框消失
            vm.addInfo.parentDir = '';
            return;
        }
        addInfo.name = addInfo.fileName + addInfo.fileExt;
        // 自身或父级文件夹
        const parent = utils.closestWhichCanCreate(addInfo.parentUuid);
        // 父级不可新建资源
        if (!parent) {
            return;
        }
        /**
         * 注意：慎重修改此默认值
         * content 类型可以为 null, string, buffer
         * 默认 null 是给文件夹使用的
         */
        let content = null;
        if (addInfo.type !== 'directory') {
            content = addInfo.content || '';
            if (!content) {
                const fileUrl = `db://internal/default_file_content/${addInfo.template || addInfo.type}`;
                const fileUuid = await Editor.Message.request('asset-db', 'query-uuid', fileUrl);
                if (fileUuid) {
                    const fileInfo = await Editor.Message.request('asset-db', 'query-asset-info', fileUuid);
                    if (!fileInfo || !(0, fs_1.existsSync)(fileInfo.file)) {
                        console.error(vm.t('readDefaultFileFail'));
                        return;
                    }
                    content = (0, fs_1.readFileSync)(fileInfo.file, 'utf-8');
                }
            }
            if (['ts', 'js'].includes(addInfo.type)) {
                const valid = await utils.scriptName.isValid(addInfo.fileName);
                if (valid.state) {
                    console.error(vm.t(valid.state));
                    return;
                }
                const useData = await Editor.User.getData();
                const replaceContents = {
                    Name: utils.scriptName.getValidClassName(addInfo.fileName),
                    UnderscoreCaseClassName: utils.scriptName.getValidClassName(addInfo.fileName),
                    CamelCaseClassName: utils.scriptName.getValidCamelCaseClassName(addInfo.fileName),
                    DateTime: new Date(),
                    Author: useData.nickname,
                    FileBasename: addInfo.name,
                    FileBasenameNoExtension: addInfo.fileName,
                    URL: `${addInfo.parentDir}/${addInfo.name}`,
                    EditorVersion: Editor.App.version,
                    ManualUrl: Editor.App.urls.manual,
                };
                Object.keys(replaceContents).forEach((key) => {
                    content = content.replace(new RegExp(`<%${key}%>`, 'g'), replaceContents[key]);
                });
            }
        }
        vm.addInfo.parentDir = '';
        treeData.uuidToState[parent.uuid] = 'add-loading';
        panelData.$.panel.isOperating = true;
        const url = `${addInfo.parentDir}/${addInfo.fileName}${addInfo.fileExt}`;
        const uuid = await vm.add(url, content);
        // 新建同名文件时点取消会返回 null
        if (!uuid) {
            treeData.uuidToState[parent.uuid] = '';
            treeData.unFreeze(parent.uuid);
            treeData.render();
        }
        setTimeout(() => {
            panelData.$.panel.isOperating = false;
        }, 200);
    },
    /**
     * 最后发起 ipc 创建资源
     * @param url 目标位置
     * @param content 填充内容
     * @param option 可选配置
     */
    async add(url, content, option) {
        const asset = (await Editor.Message.request('asset-db', 'create-asset', url, content, {
            overwrite: option?.overwrite,
        }));
        if (asset) {
            vm.ipcSelect(asset.uuid);
            setTimeout(() => {
                utils.scrollIntoView(asset.uuid);
            }, 300);
            return asset.uuid;
        }
        return null;
    },
    /**
     * 收到 ipc 消息 asset-db:asset-add
     * @param uuid 节点
     * @param info 数据
     */
    async added(uuid, info) {
        panelData.act.twinkleQueue.push({ uuid, animation: 'shrink' });
        treeData.added(uuid, info);
        vm.refreshing('added', info.name);
        const folderUuid = treeData.uuidToParentUuid[uuid];
        vm.refreshing.ignores[folderUuid] = true;
    },
    /**
     * 更新树形节点
     * @param uuid 资源
     * @param info 数据
     */
    async changed(uuid, info) {
        // 删除已缓存的缩略图
        utils.thumbnail.delete(uuid);
        panelData.act.twinkleQueue.push({ uuid, animation: 'light' });
        treeData.changed(uuid, info);
        vm.refreshing('changed', info.name, uuid);
        const folderUuid = treeData.uuidToParentUuid[uuid];
        vm.refreshing.ignores[folderUuid] = true;
        if (uuid === vm.intoViewByUser) {
            setTimeout(() => {
                const intoViewByUser = vm.intoViewByUser;
                vm.intoViewByUser = '';
                utils.scrollIntoView(intoViewByUser);
            }, 300);
        }
    },
    /**
     * ipc 发起删除资源
     * @param uuid 资源
     */
    async delete(uuid) {
        /**
         * 如果该资源没有被选中，则只是删除此单个
         * 如果该资源是被选中了，表明要删除所有选中项
         */
        let selects = [];
        const inSelects = panelData.act.selects.includes(uuid);
        if (uuid && !inSelects) {
            selects = [uuid];
        }
        else {
            selects = panelData.act.selects.slice();
        }
        const selectsLength = selects.length;
        // 有效的可删除的节点
        let validUuids = [];
        for (let i = 0; i < selectsLength; i++) {
            const uuid = selects[i];
            const asset = utils.getAsset(uuid);
            if (!asset || utils.canNotDelete(asset)) {
                continue;
            }
            // 确保 1/2： validUuids 里面任一节点都不是 uuid 的子节点
            validUuids = validUuids.filter((validUuid) => !utils.isAIncludeB(uuid, validUuid));
            // 确保 2/2： validUuids 里的任一节点都不是 uuid 的父节点
            if (!validUuids.some((validUuid) => utils.isAIncludeB(validUuid, uuid))) {
                validUuids.push(uuid);
            }
        }
        const validUuidsLength = validUuids.length;
        if (!validUuidsLength) {
            return;
        }
        // 优化删除时的内容提示
        const showIndex = 5;
        let filelist = '';
        for (let i = 0; i < validUuidsLength; i++) {
            const validUuid = validUuids[i];
            if (i > showIndex) {
                break;
            }
            const asset = utils.getAsset(validUuid);
            if (!asset) {
                continue;
            }
            if (i < showIndex) {
                filelist += `${asset.name}\n`;
            }
            else {
                filelist += '...';
            }
        }
        const usedList = await Editor.Message.request('asset-db', 'execute-script', {
            name: 'assets',
            method: 'queryDepends',
            args: [validUuids],
        });
        if (usedList && usedList.length > 0) {
            filelist += '\n' + Editor.I18n.t('assets.operate.maybeDependOther');
            for (let i = 0; i < 5; i++) {
                if (!usedList[i]) {
                    break;
                }
                filelist += `\n${usedList[i]}`;
            }
            if (usedList.length > 5) {
                filelist += '\n...';
            }
        }
        const msg = Editor.I18n.t('assets.operate.sureDelete', {
            length: String(validUuidsLength),
            filelist,
        });
        // 删除前询问
        const result = await Editor.Dialog.warn(msg, {
            buttons: ['Yes', 'Cancel'],
            default: 0,
            cancel: 1,
            title: Editor.I18n.t('assets.operate.dialogQuestion'),
        });
        if (result.response === 1) {
            return;
        }
        const tasks = [];
        for (let i = 0; i < validUuidsLength; i++) {
            const validUuid = validUuids[i];
            const asset = utils.getAsset(validUuid);
            if (!asset) {
                continue;
            }
            treeData.uuidToState[validUuid] = 'loading';
            treeData.unFreeze(validUuid);
            tasks.push(Editor.Message.request('asset-db', 'delete-asset', asset.url));
        }
        treeData.render();
        await Promise.all(tasks).then(() => {
            for (let i = 0; i < validUuidsLength; i++) {
                delete treeData.uuidToState[validUuids[i]];
            }
        });
        // 重置所有选中
        inSelects && Editor.Selection.clear('asset');
    },
    /**
     * 从树形删除资源节点
     * @param uuid 资源
     * @param info 数据
     */
    deleted(uuid, info) {
        // 删除已缓存的缩略图
        utils.thumbnail.delete(uuid);
        treeData.deleted(uuid, info);
        vm.refreshing('deleted', info.name);
        const folderUuid = treeData.uuidToParentUuid[uuid];
        vm.refreshing.ignores[folderUuid] = true;
    },
    /**
     * 键盘 上下左右
     * @param direction 方向
     */
    upDownLeftRight(direction) {
        const last = vm.getLastSelect();
        if (direction === 'right') {
            if (!vm.isExpand(last)) {
                vm.toggle(last, true);
                return;
            }
            const children = treeData.uuidToChildren[last];
            if (Array.isArray(children) && children.length) {
                vm.ipcSelect(children[0]);
            }
        }
        else if (direction === 'left') {
            if (vm.isExpand(last)) {
                vm.toggle(last, false);
                return;
            }
            const parent = treeData.uuidToParentUuid[last];
            if (parent !== panelData.config.protocol) {
                vm.ipcSelect(parent);
            }
        }
        else {
            const siblings = utils.getSibling(last);
            let current;
            switch (direction) {
                case 'up':
                    current = siblings[1];
                    break;
                case 'down':
                    current = siblings[2];
                    break;
            }
            if (current) {
                vm.ipcSelect(current.uuid);
            }
        }
    },
    /**
     * shift + 上下箭头，多选
     * @param direction 方向
     */
    async shiftUpDown(direction) {
        const length = panelData.act.selects.length;
        if (length === 0) {
            return;
        }
        const [last, lastPrev, lastNext] = utils.getSibling(panelData.act.selects[length - 1]);
        const hasLastPrev = panelData.act.selects.includes(lastPrev.uuid);
        const hasLastNext = panelData.act.selects.includes(lastNext.uuid);
        if (direction === 'up') {
            if (!hasLastPrev) {
                Editor.Selection.select('asset', lastPrev.uuid);
                vm.checkShiftUpDownMerge.uuid = lastPrev.uuid;
                vm.checkShiftUpDownMerge.direction = direction;
                return;
            }
            else {
                if (!hasLastNext) {
                    Editor.Selection.unselect('asset', last.uuid);
                }
                await utils.scrollIntoView(lastPrev.uuid);
            }
            panelData.act.selects.splice(panelData.act.selects.indexOf(lastPrev.uuid), 1);
            panelData.act.selects.push(lastPrev.uuid);
        }
        if (direction === 'down') {
            if (!hasLastNext) {
                Editor.Selection.select('asset', lastNext.uuid);
                vm.checkShiftUpDownMerge.uuid = lastNext.uuid;
                vm.checkShiftUpDownMerge.direction = direction;
                return;
            }
            else {
                if (!hasLastPrev) {
                    Editor.Selection.unselect('asset', last.uuid);
                }
                await utils.scrollIntoView(lastNext.uuid);
            }
            panelData.act.selects.splice(panelData.act.selects.indexOf(lastNext.uuid), 1);
            panelData.act.selects.push(lastNext.uuid);
        }
    },
    /**
     * 合并 shift 多选过程中前后的已选中项
     * 比如 ab cde 项中 a, cde 已选中, b 未选中
     * 当选中 b 时，合并选中项 cde ，并将末尾选中项的指针指向 e
     */
    shiftUpDownMergeSelected() {
        if (!vm.checkShiftUpDownMerge.uuid) {
            return;
        }
        let keepFindNext = true;
        let findUuid = vm.checkShiftUpDownMerge.uuid;
        vm.checkShiftUpDownMerge.uuid = ''; // 重置
        let maxLoopNumber = panelData.act.selects.length;
        while (keepFindNext) {
            const arr = utils.getSibling(findUuid);
            if (!arr || !arr[1] || !arr[2] || !maxLoopNumber) {
                return;
            }
            findUuid = vm.checkShiftUpDownMerge.direction === 'down' ? arr[2].uuid : arr[1].uuid;
            maxLoopNumber--;
            if (panelData.act.selects.includes(findUuid)) {
                panelData.act.selects.splice(panelData.act.selects.indexOf(findUuid), 1);
                panelData.act.selects.push(findUuid);
            }
            else {
                keepFindNext = false;
            }
        }
    },
    /**
     * 来自快捷键的 rename
     */
    async keyboardRename() {
        if (vm.renameUrl) {
            return;
        }
        const uuid = vm.getFirstSelect();
        const asset = utils.getAsset(uuid);
        if (asset && !utils.canNotRename(asset)) {
            await utils.scrollIntoView(uuid);
            vm.renameUrl = asset.url;
        }
    },
    /**
     * 节点重名命
     * 这是异步的，只做发送
     * @param uuid 资源
     * @param fileName 文件名
     */
    async rename(uuid, fileName = '') {
        const asset = utils.getAsset(uuid);
        if (!asset || treeData.uuidToState[uuid] === 'loading') {
            return false;
        }
        // 清空需要 rename 的节点
        vm.renameUrl = '';
        if (utils.canNotRename(asset) || fileName === '' || fileName === asset.fileName) {
            // name 存在且与之前的不一样才能重名命，否则还原状态
            treeData.uuidToState[uuid] = '';
            treeData.unFreeze(uuid);
            treeData.render();
            return false;
        }
        const parent = utils.getParent(uuid);
        if (!parent) {
            return false;
        }
        treeData.uuidToState[uuid] = 'loading';
        // 重名命资源
        const name = fileName + asset.fileExt;
        const target = `${parent.url}/${name}`;
        await Editor.Message.request('asset-db', 'move-asset', asset.url, target);
        treeData.uuidToState[uuid] = '';
        treeData.unFreeze(uuid);
        treeData.resort();
        return true;
    },
    sort() {
        treeData.resort();
    },
    clearSearchTimer() {
        window.clearTimeout(vm.searchTimer);
        vm.searchTimer = null;
    },
    search() {
        treeData.render();
        vm.clearSearchTimer();
        // 搜索有变动都先滚回顶部
        if (panelData.$.panel.searchValue) {
            vm.searchTimer = window.setTimeout(() => {
                panelData.$.viewBox.scrollTo(0, 0);
            }, 100);
        }
        else if (!panelData.$.panel.searchInFolder) {
            vm.searchTimer = window.setTimeout(() => {
                utils.scrollIntoView(vm.intoViewBySelected, true);
            }, 100);
        }
    },
    /**
     * 拖动中高亮框选当前所处的文件夹范围
     * @param uuid 资源
     */
    dragOver(uuid, dragOverAsset) {
        window.cancelAnimationFrame(requestAnimationId);
        requestAnimationId = requestAnimationFrame(() => {
            const asset = utils.getAsset(uuid);
            if (!asset) {
                return;
            }
            if (!asset.isDirectory) {
                if (!vm.isSearchingMode()) {
                    vm.dragOver(treeData.uuidToParentUuid[uuid], dragOverAsset || asset);
                }
                return;
            }
            // drag 悬停一段时间后自动展开文件夹
            const nowTime = Date.now();
            if (dragOverUuid !== uuid) {
                dragOverUuid = uuid;
                dragOverTimeId = nowTime;
            }
            else {
                if (nowTime - dragOverTimeId > 800) {
                    vm.toggle(uuid, true);
                }
            }
            const $viewBox = panelData.$.viewBox;
            // 微调 top
            const adjustScroll = vm.scrollTop % panelData.config.assetHeight;
            const adjustTop = $viewBox.getBoundingClientRect().top - vm.$el.getBoundingClientRect().top; // 滚动到底部了
            const index = treeData.displayArray.indexOf(uuid);
            const top = index * panelData.config.assetHeight + adjustScroll - adjustTop + 3;
            const expandChildren = [];
            let opacity = asset.readonly ? 0 : 1;
            if (!vm.isSearchingMode()) {
                utils.getChildrenUuid(uuid, expandChildren, true);
            }
            else {
                if (dragOverAsset) {
                    opacity = !dragOverAsset.isDirectory ? 0 : opacity;
                }
            }
            panelData.$.panel.dropBoxStyle = {
                left: $viewBox.scrollLeft + 'px',
                top: top + 'px',
                height: (expandChildren.length + 1) * panelData.config.assetHeight + 2 + 'px',
                opacity,
            };
        });
    },
    /**
     * 拖动中感知当前所处的文件夹，离开后取消高亮
     * @param uuid 资源
     */
    dragLeave(uuid) {
        let asset = utils.getAsset(uuid);
        if (asset && !asset.isDirectory) {
            asset = utils.getParent(uuid);
        }
        if (asset) {
            treeData.uuidToState[asset.uuid] = '';
        }
    },
    /**
     * tree 容器上的 drop
     * @param event 鼠标事件
     */
    async drop(event) {
        // 搜索模式下，不识别拖入 tree 容器
        if (utils.isSearchingMode()) {
            return;
        }
        const data = JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)) || {};
        // 如果没有父节点，例如搜索后没结果，则不响应
        if (!vm.assets[0]) {
            return;
        }
        const rootUuid = vm.assets[0].uuid;
        const localFiles = Array.from(event.dataTransfer.files);
        if (localFiles && localFiles.length > 0) {
            // 从外部拖文件进来
            data.type = 'osFile';
            data.files = localFiles;
        }
        if (data.value) {
            const parent = utils.getParent(data.value);
            // 如果从根节点移动，又落回根节点，则不需要移动
            if (parent && parent.uuid === rootUuid) {
                return;
            }
        }
        data.to = rootUuid; // 都归于根节点
        data.copy = event.ctrlKey;
        vm.ipcDrop(data);
    },
    /**
     * 进入 tree 容器
     */
    dragEnter() {
        // 搜索模式下，不识别为拖入 tree 容器
        if (utils.isSearchingMode()) {
            panelData.$.panel.dropBoxStyle = {};
            return;
        }
        window.cancelAnimationFrame(requestAnimationId);
        requestAnimationId = requestAnimationFrame(() => {
            vm.dragOver(treeData.displayArray[0]);
        });
    },
    /**
     * 资源拖动
     * @param dragInfo 信息
     */
    async ipcDrop(dragInfo) {
        panelData.$.panel.focusWindow(); // 拖进系统文件后窗口获得焦点，以触发 ipc 的收发
        if (utils.isSearchingMode()) {
            panelData.$.panel.clearSearch();
            await new Promise((r) => setTimeout(r, 300));
        }
        const toAsset = utils.getDirectory(dragInfo.to);
        if (!toAsset || utils.canNotCreate(toAsset)) {
            const msg = Editor.I18n.t('assets.operate.canNotDrop', { uuid: dragInfo.to });
            console.warn(msg);
            return;
        }
        // 从外部拖文件进来
        if (dragInfo.type === 'osFile') {
            if (!Array.isArray(dragInfo.files)) {
                return;
            }
            const filepaths = dragInfo.files.map((file) => file.path);
            treeData.uuidToState[toAsset.uuid] = 'loading';
            treeData.unFreeze(toAsset.uuid);
            treeData.render();
            // 找出会重复的文件集合
            const repeatFiles = await filepaths.reduce(async (res, file) => {
                const result = await res;
                const assetURL = toAsset.url + '/' + (0, path_1.basename)(file);
                const newAssetURL = await Editor.Message.request('asset-db', 'generate-available-url', assetURL);
                if (assetURL !== newAssetURL) {
                    result.push({
                        file,
                        name: (0, path_1.basename)(file),
                    });
                }
                return result;
            }, Promise.resolve([]));
            const option = { overwrite: false, rename: false }; // 导入选项
            let stop = false;
            if (repeatFiles.length > 0) {
                // 超出5个文件就用...代替了
                let detail = repeatFiles
                    .map((v) => v.name)
                    .slice(0, 5)
                    .join('\n');
                if (repeatFiles.length > 5) {
                    detail += '\n ...';
                }
                const result = await Editor.Dialog.warn(Editor.I18n.t('assets.operate.repeatTip'), {
                    title: Editor.I18n.t('assets.operate.dialogQuestion'),
                    detail: detail,
                    buttons: [
                        Editor.I18n.t('assets.operate.overwrite'),
                        Editor.I18n.t('assets.operate.rename'),
                        Editor.I18n.t('assets.operate.cancel'),
                    ],
                    default: 0,
                    cancel: 2,
                });
                if (result.response === 0) {
                    option.overwrite = true;
                }
                else if (result.response === 1) {
                    option.rename = true;
                }
                else {
                    stop = true;
                }
            }
            if (!stop && filepaths.length) {
                await Promise.all(filepaths.map((file) => {
                    return Editor.Message.request('asset-db', 'import-asset', file, toAsset.url + '/' + (0, path_1.basename)(file), repeatFiles.some((v) => v.file === file) ? option : {});
                }));
            }
            // 导入完成或者取消了导入，还原父级状态
            treeData.uuidToState[toAsset.uuid] = '';
            treeData.unFreeze(toAsset.uuid);
            treeData.render();
        }
        else if (dragInfo.type === 'cc.Node') {
            // 明确接受外部拖进来的节点 cc.Node
            for (const node of dragInfo.additional) {
                if (node.type !== 'cc.Node') {
                    continue;
                }
                const nodeUuid = node.value;
                const dump = await Editor.Message.request('scene', 'query-node', nodeUuid);
                const url = `${toAsset.url}/${dump.name.value || 'Node'}.prefab`;
                const uuid = await Editor.Message.request('scene', 'create-prefab', nodeUuid, url);
                if (uuid) {
                    vm.ipcSelect(uuid);
                    setTimeout(() => {
                        utils.scrollIntoView(uuid);
                    }, 300);
                }
            }
        }
        else if (panelData.config.extendDrop.types && panelData.config.extendDrop.types.includes(dragInfo.type)) {
            // 该类型的事件有外部注册的动作，转由外部注册事件接管
            const callbacks = Object.values(panelData.config.extendDrop.callbacks[dragInfo.type]);
            if (Array.isArray(callbacks)) {
                const asset = utils.getAsset(dragInfo.to);
                if (!asset) {
                    return;
                }
                callbacks.forEach((callback) => {
                    const info = {
                        uuid: asset.uuid,
                        type: asset.type,
                        isDirectory: asset.isDirectory,
                    };
                    callback(info, dragInfo.additional);
                });
            }
        }
        else {
            if (!dragInfo.additional || !Array.isArray(dragInfo.additional)) {
                return;
            }
            if (dragInfo.copy) {
                // 按住了 ctrl 键，拖动复制
                const uuids = dragInfo.additional.map((info) => info.value.split('@')[0]);
                vm.copy([...new Set(uuids)]);
                vm.paste(dragInfo.to);
                return;
            }
            await vm.move(dragInfo, toAsset);
        }
    },
    /**
     * 复制
     * @param uuid 资源
     */
    copy(uuid) {
        if (panelData.$.panel.isOperating) {
            return;
        }
        let copies = [];
        if (Array.isArray(uuid)) {
            copies = uuid;
        }
        else {
            // uuid 是 字符
            // 来自右击菜单的单个选中，右击节点不在已选项目里
            if (uuid && !panelData.act.selects.includes(uuid)) {
                copies = [uuid];
            }
            else {
                copies = panelData.act.selects.slice();
            }
        }
        // 过滤不可复制的节点
        const copiedUuids = copies.filter((uuid) => {
            const asset = utils.getAsset(uuid);
            return asset && !utils.canNotCopy(asset);
        });
        // 给复制的动作反馈成功
        copiedUuids.forEach((uuid) => {
            utils.twinkle.add(uuid, 'light');
        });
        // 将复制的 uuids 处理成剪切板的对象类型
        const copiedInfo = vm.uuidsToCopiedInfo(copiedUuids);
        // 将复制节点的 uuid 存放到统一的剪切板
        Editor.Clipboard.write('assets-copied-info', copiedInfo);
        vm.render();
    },
    /**
     * 粘贴
     * @param uuid 粘贴到此目标节点
     * @param copiedUuids 被复制的节点
     */
    async paste(uuid, copiedUuids) {
        if (panelData.$.panel.isOperating) {
            return;
        }
        if (!uuid) {
            uuid = vm.getFirstSelect();
        }
        let destNode = utils.closestWhichCanCreate(uuid); // 自身或父级文件夹
        if (!destNode) {
            // 没有可用的
            const msg = Editor.I18n.t('assets.operate.canNotPaste', { uuid });
            console.warn(msg);
            return;
        }
        // 优先处理剪切的情况
        const cutInfo = Editor.Clipboard.read('assets-cut-info');
        // 跨编辑器不可剪切粘贴，剪切时可能都过滤光了所以也需要判断 assetInfo.length
        if (cutInfo && cutInfo.assetInfo.length && Editor.Project.path === cutInfo.projectPath) {
            const cutUuids = cutInfo.assetInfo.map((item) => item.uuid);
            // 如果剪切到自身文件夹，终止
            if (destNode && cutUuids.includes(destNode.uuid)) {
                return;
            }
            const moveData = {
                additional: cutUuids.map((uuid) => {
                    return { value: uuid };
                }),
            };
            await vm.move(moveData, destNode);
            // 置空剪切板的复制和剪切资源
            Editor.Clipboard.clear();
            return;
        }
        // 判断不是其他操作传入的参数
        if (!copiedUuids) {
            const copiedInfo = Editor.Clipboard.read('assets-copied-info');
            let copiedFiles = [];
            if (copiedInfo) {
                // 从剪切板中获取 copiedUuids 和处理跨编辑器时的文件路径
                copiedUuids = copiedInfo.assetInfo.map((item) => item.uuid);
                copiedFiles = copiedInfo.assetInfo.map((item) => {
                    return {
                        srcPath: item.file,
                        tarPath: destNode.url + '/' + item.name,
                    };
                });
            }
            /**
             * TODO:
             * 跨文件系统，暂不支持，可以考虑如何复用 drop 动作
             * 目前只支持跨编辑器，使用 project.path 判断，paste 和 drop 独立实现
             * 剪切板中存储的是对象结构，后续可以储存 JSON 字符串
             */
            // 跨编辑器粘贴
            if (copiedFiles.length && Editor.Project.path !== copiedInfo.projectPath) {
                // 显示 loading 效果
                treeData.uuidToState[destNode.uuid] = 'loading';
                treeData.unFreeze(destNode.uuid);
                treeData.render();
                vm.toggle(destNode.uuid, true);
                for (const file of copiedFiles) {
                    await Editor.Message.request('asset-db', 'import-asset', file.srcPath, file.tarPath);
                }
                treeData.uuidToState[destNode.uuid] = '';
                return;
            }
        }
        // 如果复制到自身文件夹，需要往上移一层文件夹
        if (destNode && copiedUuids?.includes(destNode.uuid)) {
            destNode = utils.closestWhichCanCreate(treeData.uuidToParentUuid[destNode.uuid]);
            if (!destNode) {
                // 没有可用的
                const msg = Editor.I18n.t('assets.operate.canNotPaste', { uuid });
                console.warn(msg);
                return;
            }
        }
        const finallyCanPaste = []; // 最后可复制的项
        copiedUuids?.forEach((uuid) => {
            const asset = utils.getAsset(uuid);
            if (!asset) {
                return;
            }
            // 节点可复制
            const canCopy = !utils.canNotCopy(asset);
            if (!canCopy) {
                const warn = `${Editor.I18n.t('assets.operate.copyFail')}: ${asset.name}`;
                console.warn(warn);
            }
            // 不是此目标节点的父节点（不在它的上级文件夹里）
            const inside = utils.isAIncludeB(uuid, destNode.uuid);
            if (inside) {
                const warn = `${Editor.I18n.t('assets.operate.errorPasteParentToChild')}: ${asset.name}`;
                console.warn(warn);
            }
            if (canCopy && !inside) {
                finallyCanPaste.push(uuid);
            }
        });
        if (finallyCanPaste.length === 0) {
            return;
        }
        let index = 0;
        let asset;
        let newAsset;
        const newSelects = [];
        // 显示 loading 效果
        treeData.uuidToState[destNode.uuid] = 'loading';
        treeData.unFreeze(destNode.uuid);
        treeData.render();
        vm.toggle(destNode.uuid, true);
        do {
            asset = utils.getAsset(finallyCanPaste[index]);
            index++;
            newAsset = null;
            if (asset) {
                const name = (0, path_1.basename)(asset.url);
                let target = `${destNode.url}/${name}`;
                target = await Editor.Message.request('asset-db', 'generate-available-url', target);
                newAsset = (await Editor.Message.request('asset-db', 'copy-asset', asset.url, target));
                if (newAsset) {
                    vm.intoViewByUser = newAsset.uuid;
                    newSelects.push(newAsset.uuid);
                }
            }
        } while (newAsset);
        treeData.uuidToState[destNode.uuid] = '';
        // 选中新的项目
        vm.ipcSelect(newSelects);
    },
    /**
     * 剪切是预定的行为，只有再执行粘贴操作才会生效
     * @param uuid 资源
     */
    cut(uuid) {
        if (panelData.$.panel.isOperating) {
            return;
        }
        let cuts = [];
        if (Array.isArray(uuid)) {
            cuts = uuid;
        }
        else {
            // uuid 是 字符
            // 来自右击菜单的单个选中，右击节点不在已选项目里
            if (uuid && !panelData.act.selects.includes(uuid)) {
                cuts = [uuid];
            }
            else {
                cuts = panelData.act.selects.slice();
            }
        }
        // 过滤不可剪切的节点
        const cutUuids = cuts.filter((uuid) => {
            const asset = utils.getAsset(uuid);
            return asset && !utils.canNotCut(asset);
        });
        // 给复制的动作反馈成功
        cutUuids.forEach((uuid) => {
            utils.twinkle.add(uuid, 'light');
        });
        // 将剪切的 uuids 处理成剪切板的对象类型
        const cutInfo = vm.uuidsToCopiedInfo(cutUuids);
        // 将剪切节点的 uuid 存放到统一的剪切板
        Editor.Clipboard.write('assets-cut-info', cutInfo);
        vm.render();
    },
    /**
     * 将复制/剪切的 uuids 处理成剪切板的对象类型
     * @param {string[]} uuids
     * @return {*}  {ICopiedInfo}
     */
    uuidsToCopiedInfo(uuids) {
        const copiedInfo = {};
        copiedInfo.projectPath = Editor.Project.path;
        copiedInfo.assetInfo = [];
        uuids.forEach((uuid) => {
            const asset = utils.getAsset(uuid);
            const copiedAssetInfo = {
                uuid: asset ? asset.uuid : '',
                file: asset ? asset.file : '',
                name: asset ? asset.name : '',
            };
            copiedInfo.assetInfo.push(copiedAssetInfo);
        });
        return copiedInfo;
    },
    /**
     * 复制资源，平级
     * @param uuids 资源
     */
    async duplicate(uuids) {
        if (panelData.$.panel.isOperating) {
            return;
        }
        if (!uuids) {
            uuids = panelData.act.selects.slice().filter(Boolean);
        }
        const copiedUuids = uuids.filter((uuid) => {
            const asset = utils.getAsset(uuid);
            return asset && !utils.canNotDuplicate(asset);
        });
        if (copiedUuids.length === 0) {
            return;
        }
        try {
            for (const uuid of copiedUuids) {
                await vm.paste(treeData.uuidToParentUuid[uuid], [uuid]);
            }
        }
        catch (e) {
            console.error(e);
        }
    },
    /**
     * 移动 资源
     * @param dragInfo 信息
     * @param toAsset 移动目的地资源
     */
    async move(dragInfo, toAsset) {
        if (!dragInfo || !toAsset || !Array.isArray(dragInfo.additional)) {
            return;
        }
        // 展开目标文件夹
        vm.toggle(toAsset.uuid, true);
        const uuids = dragInfo.additional.map((info) => info.value.split('@')[0]);
        // 多资源移动，根据现有排序的顺序执行
        uuids.sort((a, b) => {
            const aIndex = treeData.uuidToIndex[a];
            const bIndex = treeData.uuidToIndex[b];
            return aIndex - bIndex;
        });
        const validUuids = [];
        const uuidsLength = uuids.length;
        for (let i = 0; i < uuidsLength; i++) {
            const uuid = uuids[i];
            if (validUuids.includes(uuid)) {
                continue;
            }
            const fromAsset = utils.getAsset(uuid);
            const fromParent = utils.getParent(uuid);
            if (!fromAsset || !fromParent) {
                continue;
            }
            if (toAsset.uuid === fromAsset.uuid) {
                continue;
            }
            if (utils.canNotCut(fromAsset)) {
                continue;
            }
            // toAsset 是 fromAsset 的子集，所以父不能移到子里面
            if (utils.isAIncludeB(fromAsset.uuid, dragInfo.to)) {
                continue;
            }
            // 资源移动仍在原来的目录内，不需要移动
            if (toAsset.uuid === fromParent.uuid) {
                continue;
            }
            validUuids.push(uuid);
        }
        const tasks = [];
        const validUuidsLength = validUuids.length;
        for (let i = 0; i < validUuidsLength; i++) {
            const uuid = validUuids[i];
            const fromAsset = utils.getAsset(uuid);
            const fromParent = utils.getParent(uuid);
            if (!fromAsset || !fromParent) {
                continue;
            }
            // 移动资源
            vm.intoViewByUser = fromAsset.uuid;
            treeData.uuidToState[uuid] = 'loading';
            treeData.unFreeze(uuid);
            treeData.render();
            const target = toAsset.url + '/' + (0, path_1.basename)(fromAsset.url);
            // 实例化虚拟资源
            if (fromAsset.instantiation) {
                tasks.push(Editor.Message.request('asset-db', 'init-asset', fromAsset.url, target));
                continue;
            }
            tasks.push(Editor.Message.request('asset-db', 'move-asset', fromAsset.url, target));
        }
        await Promise.all(tasks).finally(() => {
            for (let i = 0; i < validUuidsLength; i++) {
                const uuid = validUuids[i];
                treeData.uuidToState[uuid] = '';
                treeData.unFreeze(uuid);
            }
            treeData.render();
        });
        // 选中移动项
        vm.ipcSelect(validUuids);
    },
    /**
     * 重新导入资源
     * @param uuid 资源
     */
    async reimport(uuid) {
        let selects = [];
        // 来自右击菜单的单个选中
        if (!panelData.act.selects.includes(uuid)) {
            selects = [uuid];
        }
        else {
            selects = panelData.act.selects;
        }
        const selectsLength = selects.length;
        let validUuids = [];
        for (let i = 0; i < selectsLength; i++) {
            const uuid = selects[i];
            const asset = utils.getAsset(uuid);
            if (!asset || utils.canNotReimport(asset)) {
                continue;
            }
            if (!asset.isDirectory) {
                // 确保 1/2： validUuids 里面任一资源都不是 uuid 的虚拟子资源
                validUuids = validUuids.filter((validUuid) => !utils.isAIncludeB(uuid, validUuid));
                // 确保 2/2： validUuids 里的任一资源都不是 uuid 的父资源
                if (!validUuids.some((validUuid) => utils.isAIncludeB(validUuid, uuid))) {
                    if (!validUuids.includes(uuid)) {
                        validUuids.push(uuid);
                    }
                }
            }
            else {
                if (!validUuids.includes(uuid)) {
                    validUuids.push(uuid);
                }
                const children = treeData.uuidToChildren[uuid];
                if (Array.isArray(children)) {
                    for (const child of children) {
                        if (!validUuids.includes(child)) {
                            validUuids.push(child);
                        }
                    }
                }
            }
        }
        const validUuidsLength = validUuids.length;
        if (!validUuidsLength) {
            return;
        }
        // 增加重导中的 loading 界面效果
        for (const validUuid of validUuids) {
            treeData.uuidToState[validUuid] = 'loading';
            treeData.unFreeze(validUuid);
        }
        treeData.render();
        for (const validUuid of validUuids) {
            await Editor.Message.request('asset-db', 'reimport-asset', validUuid);
            treeData.uuidToState[uuid] = '';
            treeData.unFreeze(uuid);
            treeData.render();
        }
    },
    /**
     * 树形数据已改变
     * 如资源增删改，是较大的变动，需要重新计算各个配套数据
     * 增加 setTimeOut 是为了优化来自异步的多次触发
     */
    render() {
        // 容器的整体高度
        panelData.$.panel.treeHeight = treeData.displayArray.length * panelData.config.assetHeight;
        panelData.$.panel.allExpand = vm.isAllExpand();
        // 重新渲染出树形
        vm.filterAssets();
        while (panelData.act.twinkleQueue.length) {
            const readyTwinkle = panelData.act.twinkleQueue.shift();
            utils.twinkle.add(readyTwinkle.uuid, readyTwinkle.animation);
        }
    },
    /**
     * 重新渲染树形
     * vm.assets 为当前显示的那几个节点数据
     */
    filterAssets() {
        vm.assets = []; // 先清空，这种赋值机制才能刷新 vue，而 .length = 0 不行
        const top = vm.scrollTop % panelData.config.assetHeight;
        const min = vm.scrollTop - top; // 算出可视区域的 top 最小值
        const max = min + panelData.$.panel.viewHeight; // 最大值
        vm.$el.style.top = `-${top}px`;
        const start = Math.round(min / panelData.config.assetHeight);
        const end = Math.ceil(max / panelData.config.assetHeight) + 1;
        vm.assets = treeData.outputDisplay(start, end);
    },
    /**
     * 获取选中列表数组中第一个节点，没有选中项，返回在显示队列中的第一个节点
     */
    getFirstSelect() {
        const first = panelData.act.selects[0];
        if (first) {
            return first;
        }
        else {
            return treeData.displayArray[0];
        }
    },
    /**
     * 获取选中列表数组中最后一个节点，没有选中项，返回在显示队列中的最后一个节点
     */
    getLastSelect() {
        const selectsLength = panelData.act.selects.length;
        if (selectsLength) {
            return panelData.act.selects[selectsLength - 1];
        }
        else {
            const displayLength = treeData.displayArray.length;
            return treeData.displayArray[displayLength - 1];
        }
    },
    /**
     * 获取视觉上树形上下列表中，第一个选中节点，没有选中项，返回顶层根节点 'db://'
     */
    getFirstSelectSortByDisplay() {
        let uuid = panelData.config.protocol;
        const minIndex = treeData.displayArray.length;
        const length = panelData.act.selects.length;
        if (length) {
            for (let i = 0; i < length; i++) {
                const select = panelData.act.selects[i];
                const index = treeData.displayArray.indexOf(select);
                if (index < minIndex) {
                    uuid = select;
                }
            }
        }
        return uuid;
    },
    /**
     * 返回树形第一个节点
     * 第一个节点，不一定是根节点，例如在搜索的情况下
     */
    getFirstChild() {
        return treeData.displayArray[0];
    },
    isExpand(uuid) {
        return treeData.uuidToExpand[uuid];
    },
    isSelect(uuid) {
        return panelData.act.selects.indexOf(uuid) !== -1;
    },
    getTwinkle(uuid) {
        return panelData.act.twinkles[uuid] ?? '';
    },
    isAllExpand() {
        let allCollapse = true;
        let parents = treeData.uuidToChildren[panelData.config.protocol];
        const selectsLength = panelData.act.selects.length;
        if (selectsLength) {
            parents = panelData.act.selects;
        }
        if (!parents || !parents.length) {
            return allCollapse;
        }
        const parentsLength = parents.length;
        for (let i = 0; i < parentsLength; i++) {
            let parentUuid = parents[i];
            const parent = treeData.uuidToAsset[parentUuid];
            if (parent && 'isParent' in parent && !parent.isParent) {
                parentUuid = treeData.uuidToParentUuid[parentUuid];
            }
            if (treeData.uuidToExpand[parentUuid]) {
                allCollapse = false;
                break;
            }
        }
        return !allCollapse;
    },
    isSearchingMode() {
        return utils.isSearchingMode();
    },
    async dialogError(message) {
        await Editor.Dialog.error(Editor.I18n.t(`assets.operate.${message}`), {
            title: Editor.I18n.t('assets.operate.dialogError'),
        });
    },
};
exports.watch = {
    /**
     * scrollTop 变化，刷新树形
     */
    scrollTop() {
        vm.filterAssets();
    },
    /**
     * 当前选中项变动
     */
    activeAsset() {
        panelData.$.panel.activeAsset = vm.activeAsset;
    },
};
/**
 * vue data
 */
function data() {
    return {
        assets: [],
        renameUrl: '',
        addInfo: {
            // 添加一个新资源前的数据，需要事前重命名
            type: '',
            importer: '',
            name: '',
            fileExt: '',
            fileName: '',
            parentDir: '',
        },
        intoViewBySelected: '',
        intoViewByUser: '',
        scrollTop: 0,
        droppableTypes: [],
        checkShiftUpDownMerge: { uuid: '', direction: '' },
        searchTimer: undefined,
    };
}
exports.data = data;
/**
 * vm = this
 */
async function mounted() {
    // @ts-ignore
    vm = this;
    // 对于子集的变动，最后一个 ipc 消息发的是父级文件夹的变动，这不需要显示出来，所以做了记录准备忽略
    vm.refreshing.ignores = {};
}
exports.mounted = mounted;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWViLCtCQUFzQztBQUN0QywyQkFBOEM7QUFDOUMsd0RBQTBDO0FBQzFDLHNEQUF3QztBQUN4QywrQ0FBaUM7QUFFakMsSUFBSSxFQUFFLEdBQVEsSUFBSSxDQUFDO0FBQ25CLElBQUksa0JBQXVCLENBQUM7QUFFNUIsdUJBQXVCO0FBQ3ZCLElBQUksWUFBaUIsQ0FBQztBQUN0QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxjQUFtQixDQUFDO0FBQ3hCLElBQUksZ0JBQXFCLENBQUM7QUFFYixRQUFBLElBQUksR0FBRyxNQUFNLENBQUM7QUFFZCxRQUFBLEtBQUssR0FBRztJQUNqQixrQkFBa0IsRUFBRTtRQUNoQixJQUFJLEVBQUUsS0FBSztRQUNYLE9BQU87WUFDSCxPQUFPLEVBQUUsQ0FBQztRQUNkLENBQUM7S0FDSjtDQUNKLENBQUM7QUFFVyxRQUFBLFFBQVEsR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFcEYsUUFBQSxVQUFVLEdBQUc7SUFDdEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUM7Q0FDdEMsQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUFHO0lBQ25COzs7T0FHRztJQUNILENBQUMsQ0FBQyxHQUFXO1FBQ1QsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUNEOztPQUVHO0lBQ0gsTUFBTTtRQUNGLEVBQUUsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLFNBQVMsQ0FB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RUFBRSxDQUFDO1FBQ1osY0FBYyxFQUFFLEVBQUU7UUFDbEIscUJBQXFCLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7UUFDbEQsV0FBVyxFQUFFLFNBQVM7S0FDekIsQ0FBQztBQUNOLENBQUM7QUFwQkQsb0JBb0JDO0FBRUQ7O0dBRUc7QUFDSSxLQUFLLFVBQVUsT0FBTztJQUN6QixhQUFhO0lBQ2IsRUFBRSxHQUFHLElBQUksQ0FBQztJQUVWLHFEQUFxRDtJQUNyRCxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQU5ELDBCQU1DIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1xuICAgIElDcmVhdGVPcHRpb24sXG4gICAgSUFkZEluZm8sXG4gICAgSUFzc2V0SW5mbyxcbiAgICBEcm9wQ2FsbGJhY2tJbmZvLFxuICAgIElEcmFnSW5mbyxcbiAgICBJRHJhZ0FkZGl0aW9uYWwsXG4gICAgQXNzZXRJbmZvLFxuICAgIElDb3BpZWRJbmZvLFxuICAgIElDb3BpZWRBc3NldEluZm8sXG4gICAgSVJlcGVhdEZpbGUsXG59IGZyb20gJy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHsgYmFzZW5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhbmVsRGF0YSBmcm9tICcuL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi90cmVlLWRhdGEnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbmxldCB2bTogYW55ID0gbnVsbDtcbmxldCByZXF1ZXN0QW5pbWF0aW9uSWQ6IGFueTtcblxuLy8g55So5LqO6K+G5YirIGRyYWcg5oKs5YGc77yM6Ieq5Yqo5bGV5byA5paH5Lu25aS5XG5sZXQgZHJhZ092ZXJVdWlkOiBhbnk7XG5sZXQgZHJhZ092ZXJUaW1lSWQ6IGFueTtcbmxldCBzZWxlY3RlZFRpbWVJZDogYW55O1xubGV0IHJlZnJlc2hpbmdUaW1lSWQ6IGFueTtcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAndHJlZSc7XG5cbmV4cG9ydCBjb25zdCBwcm9wcyA9IHtcbiAgICBkcm9wcGFibGVUeXBlc1Byb3A6IHtcbiAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgIGRlZmF1bHQoKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS90cmVlLmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgJ3RyZWUtbm9kZSc6IHJlcXVpcmUoJy4vdHJlZS1ub2RlJyksXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDnv7vor5FcbiAgICAgKiBAcGFyYW0ga2V5IOS4jeW4pumdouadv+WQjeensOeahOagh+iusOWtl+esplxuICAgICAqL1xuICAgIHQoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLiQucGFuZWwudChrZXkpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSW6YOo5pWw5o2u5pu05paw5ZCO77yM5pu05paw5YaF6YOo5pWw5o2uXG4gICAgICovXG4gICAgdXBkYXRlKCkge1xuICAgICAgICB2bS5kcm9wcGFibGVUeXBlcyA9IFsuLi52bS5kcm9wcGFibGVUeXBlc1Byb3AsIC4uLnBhbmVsRGF0YS5jb25maWcuYXNzZXRUeXBlcygpXTtcblxuICAgICAgICAvLyDmuIXnqbrmlrDlu7rmiJbph43lkb3lkI3nirbmgIFcbiAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgdm0ucmVuYW1lVXJsID0gJyc7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmuIXnqbrmoJHlvaJcbiAgICAgKi9cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdHJlZURhdGEuY2xlYXIoKTtcbiAgICAgICAgdm0ucmVuZGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliLfmlrDmoJHlvaJcbiAgICAgKiBAcGFyYW0gdHlwZSDmmK/lkKbph43nva7mlbDmja5cbiAgICAgKiBAcGFyYW0gbmFtZSBpcGMg5Yqo5L2c55qE5ZCN56ewXG4gICAgICovXG4gICAgcmVmcmVzaGluZyh0eXBlOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdXVpZD86IHN0cmluZykge1xuICAgICAgICBpZiAodXVpZCAmJiB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbdXVpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbdXVpZF07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5yZWZyZXNoaW5nID0geyB0eXBlLCBuYW1lIH07XG5cbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChyZWZyZXNoaW5nVGltZUlkKTtcbiAgICAgICAgcmVmcmVzaGluZ1RpbWVJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIC8vIOaPkOekuua2iOWksVxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwucmVmcmVzaGluZy50eXBlID0gJyc7XG4gICAgICAgICAgICB2bS5yZWZyZXNoaW5nLmlnbm9yZXMgPSB7fTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnnmoTmipjlj6Av5bGV5byA5YiH5o2iXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGV4cGFuZCAg5piv5ZCm5bGV5byAXG4gICAgICogQHBhcmFtIGxvb3AgIOaMieS9jyBBbHQg6ZSu5Y+v6L+b5YWl5a2Q6IqC54K55b6q546vXG4gICAgICovXG4gICAgdG9nZ2xlKHV1aWQ6IHN0cmluZywgZXhwYW5kPzogYm9vbGVhbiwgbG9vcD86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKGxvb3ApIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnRvZ2dsZUV4cGFuZCh1dWlkLCBleHBhbmQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliKTmlq3kuIvkuKrliqjkvZzmmK/mlLbotbfov5jmmK/lsZXlvIAg77yI5b2T5a2Y5Zyo5LiN5ZCM54q25oCB55qE5paH5Lu25aS55pe277yM6KeG5Li65pS26LW344CC5b2T54q25oCB55u45ZCM77yM5Y+W5Y+N5Y2z5Y+v44CC77yJXG4gICAgICogQHBhcmFtIHBhcmVudHNcbiAgICAgKiBAcmV0dXJucyBib29sZWFuXG4gICAgICovXG4gICAgbmV4dFRvZ2dsZUV4cGFuZChwYXJlbnRzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7IC8vIOm7mOiupOS4uuaUtui1t1xuICAgICAgICAvLyDmoLnmja7op4TliJnvvIzpgqPkuYjlj6rmnInlvZPlhajpg6jpg73kuLrmlLbotbfnmoTml7blgJnvvIzpnIDopoHlsZXlvIDnmoTmk43kvZxcbiAgICAgICAgY29uc3QgaXNBbGxDbG9zZSA9IHBhcmVudHMuZXZlcnkoKHBhcmVudElEKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9Bc3NldFtwYXJlbnRJRF07XG4gICAgICAgICAgICBpZiAoISgnaXNQYXJlbnQnIGluIHBhcmVudCAmJiBwYXJlbnQuaXNQYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50SUQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3BhcmVudElEXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhdHJlZURhdGEudXVpZFRvRXhwYW5kW3BhcmVudElEXTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpc0FsbENsb3NlKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlhajpg6joioLngrnmipjlj6DmiJblsZXlvIBcbiAgICAgKi9cbiAgICBhbGxUb2dnbGUoKSB7XG4gICAgICAgIGxldCBwYXJlbnRzID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF07XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50c0xlbmd0aCA9IHBhcmVudHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXBhcmVudHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4cGFuZCA9IHZtLm5leHRUb2dnbGVFeHBhbmQocGFyZW50cyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHBhcmVudHNbaV07XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9Bc3NldFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIGlmICghKCdpc1BhcmVudCcgaW4gcGFyZW50ICYmIHBhcmVudC5pc1BhcmVudCkpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQocGFyZW50VXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YCJXG4gICAgICogQHBhcmFtIHV1aWQg5YWo6YCJ6K+l55uu5qCH6IqC54K55LiL55qE5a2Q6IqC54K5XG4gICAgICovXG4gICAgc2VsZWN0QWxsKHV1aWQ6IHN0cmluZykge1xuICAgICAgICAvLyDmkbjntKLmqKHlvI/kuIvvvIzlhajpgInkuLrlvZPliY3liJfooahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdHJlZURhdGEuZGlzcGxheUFycmF5KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnRVdWlkID0gdXVpZCB8fCB2bS5nZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcblxuICAgICAgICBpZiAoIXRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdKSB7XG4gICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiOt+WPluW3suWxleW8gOeahOWtkOiKgueCuVxuICAgICAgICBjb25zdCBjaGlsZHJlblV1aWQ6IHN0cmluZ1tdID0gW107XG4gICAgICAgIHV0aWxzLmdldENoaWxkcmVuVXVpZChwYXJlbnRVdWlkLCBjaGlsZHJlblV1aWQsIHRydWUpO1xuXG4gICAgICAgIGNvbnN0IGNsb25lU2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICBjb25zdCBwYXJlbnRJbiA9IGNsb25lU2VsZWN0cy5pbmNsdWRlcyhwYXJlbnRVdWlkKTtcblxuICAgICAgICBsZXQgY2hpbGRyZW5BbGxJbiA9IHRydWU7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuVXVpZExlbmd0aCA9IGNoaWxkcmVuVXVpZC5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW5VdWlkTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGNoaWxkcmVuVXVpZFtpXSkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbkFsbEluID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hpbGRyZW5BbGxJbikge1xuICAgICAgICAgICAgaWYgKCFwYXJlbnRJbikge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDlvoDkuIrkuIDlsYJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50VXVpZCAhPT0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5zZWxlY3RBbGwodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnRJbikge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuVXVpZC51bnNoaWZ0KHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGNoaWxkcmVuVXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGNoaWxkcmVuVXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNlbGVjdENsZWFyKCkge1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5re75Yqg6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWRzIHN0cmluZyB8IHN0cmluZ1tdXG4gICAgICovXG4gICAgc2VsZWN0ZWQodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1dWlkcykpIHtcbiAgICAgICAgICAgIHV1aWRzID0gW3V1aWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKCFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaCh1dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlTZWxlY3RlZCA9IHV1aWQ7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFRpbWVJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICB9LCA1MCk7XG5cbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6Ugc2hpZnQg5aSa6YCJ55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuYWxsRXhwYW5kID0gdm0uaXNBbGxFeHBhbmQoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIHVuc2VsZWN0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YodXVpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc2VsZWN0ZWRUaW1lSWQpO1xuICAgICAgICAgICAgc2VsZWN0ZWRUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVNlbGVjdGVkID09PSB1dWlkKSB7XG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5U2VsZWN0ZWQgPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5oGi5aSN6YCJ5Lit54q25oCBXG4gICAgICovXG4gICAgcmVzZXRTZWxlY3RlZCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzID0gW107XG4gICAgICAgIGNvbnN0IHV1aWRzID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYXNzZXQnKTtcbiAgICAgICAgdm0uc2VsZWN0ZWQodXVpZHMpO1xuXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc2VsZWN0ZWRUaW1lSWQpO1xuICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh2bS5pbnRvVmlld0J5U2VsZWN0ZWQsIHRydWUpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogc2hpZnQgKyBjbGljayDlpJrpgIlcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBzaGlmdENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCB7IGRpc3BsYXlBcnJheSB9ID0gdHJlZURhdGE7XG5cbiAgICAgICAgY29uc3QgZmlyc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXSk7XG4gICAgICAgIGNvbnN0IGxhc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChmaXJzdEluZGV4ICE9PSAtMSB8fCBsYXN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RJbmRleCA8PSBsYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA8PSBsYXN0SW5kZXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBmaXJzdEluZGV4OyBpID49IGxhc3RJbmRleDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdHMucHVzaChkaXNwbGF5QXJyYXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmlwY1NlbGVjdChzZWxlY3RzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGN0cmwgKyBjbGljayDpgInkuK3miJblj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBjdHJsQ2xpY2sodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCB1dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWRzIOi1hOa6kFxuICAgICAqL1xuICAgIGlwY1NlbGVjdCh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5qCR5b2i5LiK55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgaXBjU2VsZWN0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgY29uc3QgdXVpZCA9IHRoaXMuZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOepuueZveWkhOeCueWHu++8jOWPlua2iOmAieS4rVxuICAgICAqL1xuICAgIGNsaWNrKCkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliJvlu7rliY3vvIzlkI3np7DlpITnkIZcbiAgICAgKiBAcGFyYW0gYWRkSW5mbyDkv6Hmga9cbiAgICAgKi9cbiAgICBhc3luYyBhZGRUbyhhZGRJbmZvOiBJQWRkSW5mbykge1xuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhZGRJbmZvLnV1aWQpIHtcbiAgICAgICAgICAgIGFkZEluZm8udXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDoh6rouqvmiJbniLbnuqfmlofku7blpLlcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuY2xvc2VzdFdoaWNoQ2FuQ3JlYXRlKGFkZEluZm8udXVpZCk7XG5cbiAgICAgICAgLy8gcGFyZW50IOS4jeWtmOWcqOaIluWkhOS6juWFtuS7lueKtuaAge+8jOS4jemAguWQiOWIm+W7ulxuICAgICAgICBpZiAoIXBhcmVudCB8fCB0cmVlRGF0YS51dWlkVG9TdGF0ZVtwYXJlbnQudXVpZF0pIHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbk5vdEFkZFRvJywge1xuICAgICAgICAgICAgICAgIHV1aWQ6IGFkZEluZm8udXVpZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsZXlvIDniLbnuqfoioLngrlcbiAgICAgICAgdm0udG9nZ2xlKHBhcmVudC51dWlkLCB0cnVlKTtcblxuICAgICAgICAvLyDmu5rliqjliLDpobblsYLop4bnqpdcbiAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcocGFyZW50LnV1aWQpO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudERpciA9IHBhcmVudC51cmw7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGFkZEluZm8uZmlsZU5hbWUgfHwgJ05ldyBGaWxlJztcbiAgICAgICAgbGV0IGZpbGVFeHQgPSBgLiR7YWRkSW5mby50eXBlfWA7XG5cbiAgICAgICAgY29uc3QgY2FtZWxGb3JtYXRSZWcgPSAvQGNjY2xhc3MoW148XSopKDwlQ2FtZWxDYXNlQ2xhc3NOYW1lJT4pLztcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lRm9ybWF0UmVnID0gL0BjY2NsYXNzXFwoWydcIl0oW14nXCJdKilbJ1wiXVxcKS87XG4gICAgICAgIGNvbnN0IGNvbW1lbnRzUmVnID0gLyhcXG5bXlxcbl0qXFwvXFwqW1xcc1xcU10qP1xcKlxcLyl8KFxcblteXFxuXSpcXC9cXC8oPzpbXlxcclxcbl18XFxyKD8hXFxuKSkqKS9nOyAvLyDms6jph4rljLrln5/ov57lkIzov57nu63nmoTnqbrooYxcblxuICAgICAgICBzd2l0Y2ggKGFkZEluZm8udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnZGlyZWN0b3J5JzpcbiAgICAgICAgICAgICAgICBmaWxlRXh0ID0gJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0cyc6XG4gICAgICAgICAgICBjYXNlICdqcyc6IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFkZEluZm8uY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSAnJztcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXJsID0gYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHthZGRJbmZvLnRlbXBsYXRlIHx8IGFkZEluZm8udHlwZX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGZpbGVVdWlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHZtLnQoJ3JlYWREZWZhdWx0RmlsZUZhaWwnKSwgZmlsZVVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmlbTnkIblubbor4bliKvmqKHmnb/mlbDmja5cbiAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSBhZGRJbmZvLmNvbnRlbnQucmVwbGFjZShjb21tZW50c1JlZywgKCQwOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQwLmluY2x1ZGVzKCdDT01NRU5UU19HRU5FUkFURV9JR05PUkUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQwO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8g6K+G5Yir5piv5ZCm5ZCv55So6am85bOw5qC85byP55qE57G75ZCNXG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5yZXF1aXJlZENhbWVsQ2FzZUNsYXNzTmFtZSA9IGNhbWVsRm9ybWF0UmVnLnRlc3QoYWRkSW5mby5jb250ZW50KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVNYXRjaGVzID0gYWRkSW5mby5jb250ZW50Lm1hdGNoKGNsYXNzTmFtZUZvcm1hdFJlZyk7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5jbGFzc05hbWVTdHJpbmdGb3JtYXQgPSBuYW1lTWF0Y2hlcyAmJiBuYW1lTWF0Y2hlc1sxXSA/IG5hbWVNYXRjaGVzWzFdIDogJyc7XG5cbiAgICAgICAgICAgICAgICBmaWxlTmFtZSA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuZ2V0VmFsaWRGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmnIDlkI7ku6Xov5nkuKogdXJsIOaVsOaNruS4uuWHhlxuICAgICAgICBsZXQgdXJsID0gYCR7cGFyZW50RGlyfS8ke2ZpbGVOYW1lfSR7ZmlsZUV4dH1gO1xuICAgICAgICB1cmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgdXJsKTtcblxuICAgICAgICB2bS5hZGRJbmZvID0ge1xuICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgdHlwZTogYWRkSW5mby50eXBlLFxuICAgICAgICAgICAgaW1wb3J0ZXI6IGFkZEluZm8uaW1wb3J0ZXIsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYWRkSW5mby50ZW1wbGF0ZSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGFkZEluZm8uY29udGVudCxcbiAgICAgICAgICAgIGZpbGVFeHQsXG4gICAgICAgICAgICBmaWxlTmFtZTogYmFzZW5hbWUodXJsLCBmaWxlRXh0KSxcbiAgICAgICAgICAgIG5hbWU6IGJhc2VuYW1lKHVybCksXG4gICAgICAgICAgICBwYXJlbnREaXIsXG4gICAgICAgICAgICBwYXJlbnRVdWlkOiBwYXJlbnQudXVpZCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQjeensOWhq+WGmeWQjuaPkOS6pOWIsOi/memHjFxuICAgICAqIEBwYXJhbSBhZGRJbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGFkZENvbmZpcm0oYWRkSW5mbz86IElBZGRJbmZvKSB7XG4gICAgICAgIC8vIOaVsOaNrumUmeivr+aXtuWPlua2iFxuICAgICAgICBpZiAoIWFkZEluZm8gfHwgIWFkZEluZm8ucGFyZW50RGlyIHx8ICFhZGRJbmZvLnBhcmVudFV1aWQgfHwgIWFkZEluZm8uZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vIOaWsOWinueahOi+k+WFpeahhua2iOWksVxuICAgICAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEluZm8ubmFtZSA9IGFkZEluZm8uZmlsZU5hbWUgKyBhZGRJbmZvLmZpbGVFeHQ7XG5cbiAgICAgICAgLy8g6Ieq6Lqr5oiW54i257qn5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZShhZGRJbmZvLnBhcmVudFV1aWQpO1xuICAgICAgICAvLyDniLbnuqfkuI3lj6/mlrDlu7rotYTmupBcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDms6jmhI/vvJrmhY7ph43kv67mlLnmraTpu5jorqTlgLxcbiAgICAgICAgICogY29udGVudCDnsbvlnovlj6/ku6XkuLogbnVsbCwgc3RyaW5nLCBidWZmZXJcbiAgICAgICAgICog6buY6K6kIG51bGwg5piv57uZ5paH5Lu25aS55L2/55So55qEXG4gICAgICAgICAqL1xuICAgICAgICBsZXQgY29udGVudDogYW55ID0gbnVsbDtcblxuICAgICAgICBpZiAoYWRkSW5mby50eXBlICE9PSAnZGlyZWN0b3J5Jykge1xuICAgICAgICAgICAgY29udGVudCA9IGFkZEluZm8uY29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7YWRkSW5mby50ZW1wbGF0ZSB8fCBhZGRJbmZvLnR5cGV9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgIGlmIChmaWxlVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBmaWxlVXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3Iodm0udCgncmVhZERlZmF1bHRGaWxlRmFpbCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoWyd0cycsICdqcyddLmluY2x1ZGVzKGFkZEluZm8udHlwZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZCA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuaXNWYWxpZChhZGRJbmZvLmZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsaWQuc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih2bS50KHZhbGlkLnN0YXRlKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB1c2VEYXRhID0gYXdhaXQgRWRpdG9yLlVzZXIuZ2V0RGF0YSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VDb250ZW50czogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBVbmRlcnNjb3JlQ2FzZUNsYXNzTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgQ2FtZWxDYXNlQ2xhc3NOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2FtZWxDYXNlQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBEYXRlVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yOiB1c2VEYXRhLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgICAgICBGaWxlQmFzZW5hbWU6IGFkZEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgRmlsZUJhc2VuYW1lTm9FeHRlbnNpb246IGFkZEluZm8uZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFVSTDogYCR7YWRkSW5mby5wYXJlbnREaXJ9LyR7YWRkSW5mby5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvclZlcnNpb246IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgTWFudWFsVXJsOiBFZGl0b3IuQXBwLnVybHMubWFudWFsLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMocmVwbGFjZUNvbnRlbnRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShuZXcgUmVnRXhwKGA8JSR7a2V5fSU+YCwgJ2cnKSwgcmVwbGFjZUNvbnRlbnRzW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdID0gJ2FkZC1sb2FkaW5nJztcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IGAke2FkZEluZm8ucGFyZW50RGlyfS8ke2FkZEluZm8uZmlsZU5hbWV9JHthZGRJbmZvLmZpbGVFeHR9YDtcbiAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IHZtLmFkZCh1cmwsIGNvbnRlbnQpO1xuXG4gICAgICAgIC8vIOaWsOW7uuWQjOWQjeaWh+S7tuaXtueCueWPlua2iOS8mui/lOWbniBudWxsXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZShwYXJlbnQudXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSwgMjAwKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOacgOWQjuWPkei1tyBpcGMg5Yib5bu66LWE5rqQXG4gICAgICogQHBhcmFtIHVybCDnm67moIfkvY3nva5cbiAgICAgKiBAcGFyYW0gY29udGVudCDloavlhYXlhoXlrrlcbiAgICAgKiBAcGFyYW0gb3B0aW9uIOWPr+mAiemFjee9rlxuICAgICAqL1xuICAgIGFzeW5jIGFkZCh1cmw6IHN0cmluZywgY29udGVudDogQnVmZmVyIHwgc3RyaW5nIHwgbnVsbCwgb3B0aW9uPzogSUNyZWF0ZU9wdGlvbikge1xuICAgICAgICBjb25zdCBhc3NldCA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCB1cmwsIGNvbnRlbnQsIHtcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogb3B0aW9uPy5vdmVyd3JpdGUsXG4gICAgICAgIH0pKSBhcyBJQXNzZXRJbmZvO1xuXG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGFzc2V0LnV1aWQpO1xuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyhhc3NldC51dWlkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG5cbiAgICAgICAgICAgIHJldHVybiBhc3NldC51dWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmlLbliLAgaXBjIOa2iOaBryBhc3NldC1kYjphc3NldC1hZGRcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKiBAcGFyYW0gaW5mbyDmlbDmja5cbiAgICAgKi9cbiAgICBhc3luYyBhZGRlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5wdXNoKHsgdXVpZCwgYW5pbWF0aW9uOiAnc2hyaW5rJyB9KTtcbiAgICAgICAgdHJlZURhdGEuYWRkZWQodXVpZCwgaW5mbyk7XG4gICAgICAgIHZtLnJlZnJlc2hpbmcoJ2FkZGVkJywgaW5mby5uYW1lKTtcblxuICAgICAgICBjb25zdCBmb2xkZXJVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzW2ZvbGRlclV1aWRdID0gdHJ1ZTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOabtOaWsOagkeW9ouiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIGNoYW5nZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgLy8g5Yig6Zmk5bey57yT5a2Y55qE57yp55Wl5Zu+XG4gICAgICAgIHV0aWxzLnRodW1ibmFpbC5kZWxldGUodXVpZCk7XG5cbiAgICAgICAgcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWUucHVzaCh7IHV1aWQsIGFuaW1hdGlvbjogJ2xpZ2h0JyB9KTtcblxuICAgICAgICB0cmVlRGF0YS5jaGFuZ2VkKHV1aWQsIGluZm8pO1xuICAgICAgICB2bS5yZWZyZXNoaW5nKCdjaGFuZ2VkJywgaW5mby5uYW1lLCB1dWlkKTtcblxuICAgICAgICBjb25zdCBmb2xkZXJVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzW2ZvbGRlclV1aWRdID0gdHJ1ZTtcblxuICAgICAgICBpZiAodXVpZCA9PT0gdm0uaW50b1ZpZXdCeVVzZXIpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGludG9WaWV3QnlVc2VyID0gdm0uaW50b1ZpZXdCeVVzZXI7XG4gICAgICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSAnJztcbiAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyhpbnRvVmlld0J5VXNlcik7XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBpcGMg5Y+R6LW35Yig6Zmk6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgZGVsZXRlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICAvKipcbiAgICAgICAgICog5aaC5p6c6K+l6LWE5rqQ5rKh5pyJ6KKr6YCJ5Lit77yM5YiZ5Y+q5piv5Yig6Zmk5q2k5Y2V5LiqXG4gICAgICAgICAqIOWmguaenOivpei1hOa6kOaYr+iiq+mAieS4reS6hu+8jOihqOaYjuimgeWIoOmZpOaJgOaciemAieS4remhuVxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGluU2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKTtcbiAgICAgICAgaWYgKHV1aWQgJiYgIWluU2VsZWN0cykge1xuICAgICAgICAgICAgc2VsZWN0cyA9IFt1dWlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBzZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICAvLyDmnInmlYjnmoTlj6/liKDpmaTnmoToioLngrlcbiAgICAgICAgbGV0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBzZWxlY3RzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCB1dGlscy5jYW5Ob3REZWxldGUoYXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOehruS/nSAxLzLvvJogdmFsaWRVdWlkcyDph4zpnaLku7vkuIDoioLngrnpg73kuI3mmK8gdXVpZCDnmoTlrZDoioLngrlcbiAgICAgICAgICAgIHZhbGlkVXVpZHMgPSB2YWxpZFV1aWRzLmZpbHRlcigodmFsaWRVdWlkKSA9PiAhdXRpbHMuaXNBSW5jbHVkZUIodXVpZCwgdmFsaWRVdWlkKSk7XG5cbiAgICAgICAgICAgIC8vIOehruS/nSAyLzLvvJogdmFsaWRVdWlkcyDph4znmoTku7vkuIDoioLngrnpg73kuI3mmK8gdXVpZCDnmoTniLboioLngrlcbiAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5zb21lKCh2YWxpZFV1aWQpID0+IHV0aWxzLmlzQUluY2x1ZGVCKHZhbGlkVXVpZCwgdXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXZhbGlkVXVpZHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS8mOWMluWIoOmZpOaXtueahOWGheWuueaPkOekulxuICAgICAgICBjb25zdCBzaG93SW5kZXggPSA1O1xuICAgICAgICBsZXQgZmlsZWxpc3QgPSAnJztcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgIGlmIChpID4gc2hvd0luZGV4KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodmFsaWRVdWlkKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGkgPCBzaG93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSBgJHthc3NldC5uYW1lfVxcbmA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICs9ICcuLi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXNlZExpc3QgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdleGVjdXRlLXNjcmlwdCcsIHtcbiAgICAgICAgICAgIG5hbWU6ICdhc3NldHMnLFxuICAgICAgICAgICAgbWV0aG9kOiAncXVlcnlEZXBlbmRzJyxcbiAgICAgICAgICAgIGFyZ3M6IFt2YWxpZFV1aWRzXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHVzZWRMaXN0ICYmIHVzZWRMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZpbGVsaXN0ICs9ICdcXG4nICsgRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUubWF5YmVEZXBlbmRPdGhlcicpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIXVzZWRMaXN0W2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSBgXFxuJHt1c2VkTGlzdFtpXX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZWRMaXN0Lmxlbmd0aCA+IDUpIHtcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSAnXFxuLi4uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLnN1cmVEZWxldGUnLCB7XG4gICAgICAgICAgICBsZW5ndGg6IFN0cmluZyh2YWxpZFV1aWRzTGVuZ3RoKSxcbiAgICAgICAgICAgIGZpbGVsaXN0LFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDliKDpmaTliY3or6Lpl65cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKG1zZywge1xuICAgICAgICAgICAgYnV0dG9uczogWydZZXMnLCAnQ2FuY2VsJ10sXG4gICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgY2FuY2VsOiAxLFxuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ1F1ZXN0aW9uJyksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXN1bHQucmVzcG9uc2UgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhc2tzOiBBcnJheTxQcm9taXNlPEFzc2V0SW5mbyB8IG51bGw+PiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodmFsaWRVdWlkKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdmFsaWRVdWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHZhbGlkVXVpZCk7XG5cbiAgICAgICAgICAgIHRhc2tzLnB1c2goRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZGVsZXRlLWFzc2V0JywgYXNzZXQudXJsKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YXNrcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0cmVlRGF0YS51dWlkVG9TdGF0ZVt2YWxpZFV1aWRzW2ldXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g6YeN572u5omA5pyJ6YCJ5LitXG4gICAgICAgIGluU2VsZWN0cyAmJiBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5LuO5qCR5b2i5Yig6Zmk6LWE5rqQ6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGluZm8g5pWw5o2uXG4gICAgICovXG4gICAgZGVsZXRlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAvLyDliKDpmaTlt7LnvJPlrZjnmoTnvKnnlaXlm75cbiAgICAgICAgdXRpbHMudGh1bWJuYWlsLmRlbGV0ZSh1dWlkKTtcblxuICAgICAgICB0cmVlRGF0YS5kZWxldGVkKHV1aWQsIGluZm8pO1xuICAgICAgICB2bS5yZWZyZXNoaW5nKCdkZWxldGVkJywgaW5mby5uYW1lKTtcblxuICAgICAgICBjb25zdCBmb2xkZXJVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzW2ZvbGRlclV1aWRdID0gdHJ1ZTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmUruebmCDkuIrkuIvlt6blj7NcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIHVwRG93bkxlZnRSaWdodChkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBsYXN0ID0gdm0uZ2V0TGFzdFNlbGVjdCgpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGlmICghdm0uaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW2xhc3RdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChjaGlsZHJlblswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGlmICh2bS5pc0V4cGFuZChsYXN0KSkge1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShsYXN0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2xhc3RdO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChwYXJlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc2libGluZ3MgPSB1dGlscy5nZXRTaWJsaW5nKGxhc3QpO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnQ7XG4gICAgICAgICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3VwJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdkb3duJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzJdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY3VycmVudC51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogc2hpZnQgKyDkuIrkuIvnrq3lpLTvvIzlpJrpgIlcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIGFzeW5jIHNoaWZ0VXBEb3duKGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgW2xhc3QsIGxhc3RQcmV2LCBsYXN0TmV4dF0gPSB1dGlscy5nZXRTaWJsaW5nKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tsZW5ndGggLSAxXSk7XG4gICAgICAgIGNvbnN0IGhhc0xhc3RQcmV2ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICBjb25zdCBoYXNMYXN0TmV4dCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndXAnKSB7XG4gICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgbGFzdFByZXYudXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9IGxhc3RQcmV2LnV1aWQ7XG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNMYXN0TmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhc3NldCcsIGxhc3QudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihsYXN0UHJldi51dWlkKSwgMSk7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChsYXN0UHJldi51dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdkb3duJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0TmV4dCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGxhc3ROZXh0LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0TmV4dC51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdFByZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYXNzZXQnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0TmV4dC51dWlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihsYXN0TmV4dC51dWlkKSwgMSk7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChsYXN0TmV4dC51dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ZCI5bm2IHNoaWZ0IOWkmumAiei/h+eoi+S4reWJjeWQjueahOW3sumAieS4remhuVxuICAgICAqIOavlOWmgiBhYiBjZGUg6aG55LitIGEsIGNkZSDlt7LpgInkuK0sIGIg5pyq6YCJ5LitXG4gICAgICog5b2T6YCJ5LitIGIg5pe277yM5ZCI5bm26YCJ5Lit6aG5IGNkZSDvvIzlubblsIbmnKvlsL7pgInkuK3pobnnmoTmjIfpkojmjIflkJEgZVxuICAgICAqL1xuICAgIHNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpIHtcbiAgICAgICAgaWYgKCF2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGtlZXBGaW5kTmV4dCA9IHRydWU7XG4gICAgICAgIGxldCBmaW5kVXVpZCA9IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkO1xuXG4gICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gJyc7IC8vIOmHjee9rlxuXG4gICAgICAgIGxldCBtYXhMb29wTnVtYmVyID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGtlZXBGaW5kTmV4dCkge1xuICAgICAgICAgICAgY29uc3QgYXJyID0gdXRpbHMuZ2V0U2libGluZyhmaW5kVXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXJyIHx8ICFhcnJbMV0gfHwgIWFyclsyXSB8fCAhbWF4TG9vcE51bWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID09PSAnZG93bicgPyBhcnJbMl0udXVpZCA6IGFyclsxXS51dWlkO1xuICAgICAgICAgICAgbWF4TG9vcE51bWJlci0tO1xuXG4gICAgICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGZpbmRVdWlkKSkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YoZmluZFV1aWQpLCAxKTtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChmaW5kVXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGtlZXBGaW5kTmV4dCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rlv6vmjbfplK7nmoQgcmVuYW1lXG4gICAgICovXG4gICAgYXN5bmMga2V5Ym9hcmRSZW5hbWUoKSB7XG4gICAgICAgIGlmICh2bS5yZW5hbWVVcmwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIGlmIChhc3NldCAmJiAhdXRpbHMuY2FuTm90UmVuYW1lKGFzc2V0KSkge1xuICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgICAgICB2bS5yZW5hbWVVcmwgPSBhc3NldC51cmw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCuemHjeWQjeWRvVxuICAgICAqIOi/meaYr+W8guatpeeahO+8jOWPquWBmuWPkemAgVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBmaWxlTmFtZSDmlofku7blkI1cbiAgICAgKi9cbiAgICBhc3luYyByZW5hbWUodXVpZDogc3RyaW5nLCBmaWxlTmFtZSA9ICcnKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIGlmICghYXNzZXQgfHwgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5riF56m66ZyA6KaBIHJlbmFtZSDnmoToioLngrlcbiAgICAgICAgdm0ucmVuYW1lVXJsID0gJyc7XG5cbiAgICAgICAgaWYgKHV0aWxzLmNhbk5vdFJlbmFtZShhc3NldCkgfHwgZmlsZU5hbWUgPT09ICcnIHx8IGZpbGVOYW1lID09PSBhc3NldC5maWxlTmFtZSkge1xuICAgICAgICAgICAgLy8gbmFtZSDlrZjlnKjkuJTkuI7kuYvliY3nmoTkuI3kuIDmoLfmiY3og73ph43lkI3lkb3vvIzlkKbliJnov5jljp/nirbmgIFcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG5cbiAgICAgICAgLy8g6YeN5ZCN5ZG96LWE5rqQXG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWxlTmFtZSArIGFzc2V0LmZpbGVFeHQ7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGAke3BhcmVudC51cmx9LyR7bmFtZX1gO1xuICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdtb3ZlLWFzc2V0JywgYXNzZXQudXJsLCB0YXJnZXQpO1xuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHV1aWQpO1xuICAgICAgICB0cmVlRGF0YS5yZXNvcnQoKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIHNvcnQoKSB7XG4gICAgICAgIHRyZWVEYXRhLnJlc29ydCgpO1xuICAgIH0sXG4gICAgY2xlYXJTZWFyY2hUaW1lcigpIHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh2bS5zZWFyY2hUaW1lcik7XG4gICAgICAgIHZtLnNlYXJjaFRpbWVyID0gbnVsbDtcbiAgICB9LCAgXG4gICAgc2VhcmNoKCkge1xuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgdm0uY2xlYXJTZWFyY2hUaW1lcigpO1xuICAgICAgICAvLyDmkJzntKLmnInlj5jliqjpg73lhYjmu5rlm57pobbpg6hcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICB2bS5zZWFyY2hUaW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC52aWV3Qm94LnNjcm9sbFRvKDAsIDApO1xuICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfSBlbHNlIGlmICghcGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoSW5Gb2xkZXIpIHtcbiAgICAgICAgICAgIHZtLnNlYXJjaFRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlTZWxlY3RlZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3pq5jkuq7moYbpgInlvZPliY3miYDlpITnmoTmlofku7blpLnojIPlm7RcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBkcmFnT3Zlcih1dWlkOiBzdHJpbmcsIGRyYWdPdmVyQXNzZXQ/OiBJQXNzZXRJbmZvIHwgbnVsbCkge1xuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbklkKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZtLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmRyYWdPdmVyKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0sIGRyYWdPdmVyQXNzZXQgfHwgYXNzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRyYWcg5oKs5YGc5LiA5q615pe26Ze05ZCO6Ieq5Yqo5bGV5byA5paH5Lu25aS5XG4gICAgICAgICAgICBjb25zdCBub3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChkcmFnT3ZlclV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclV1aWQgPSB1dWlkO1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVGltZUlkID0gbm93VGltZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vd1RpbWUgLSBkcmFnT3ZlclRpbWVJZCA+IDgwMCkge1xuICAgICAgICAgICAgICAgICAgICB2bS50b2dnbGUodXVpZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCAkdmlld0JveCA9IHBhbmVsRGF0YS4kLnZpZXdCb3g7XG5cbiAgICAgICAgICAgIC8vIOW+ruiwgyB0b3BcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdFNjcm9sbCA9IHZtLnNjcm9sbFRvcCAlIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBhZGp1c3RUb3AgPSAkdmlld0JveC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSB2bS4kZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wOyAvLyDmu5rliqjliLDlupXpg6jkuoZcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdHJlZURhdGEuZGlzcGxheUFycmF5LmluZGV4T2YodXVpZCk7XG4gICAgICAgICAgICBjb25zdCB0b3AgPSBpbmRleCAqIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQgKyBhZGp1c3RTY3JvbGwgLSBhZGp1c3RUb3AgKyAzO1xuXG4gICAgICAgICAgICBjb25zdCBleHBhbmRDaGlsZHJlbjogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIGxldCBvcGFjaXR5ID0gYXNzZXQucmVhZG9ubHkgPyAwIDogMTtcblxuICAgICAgICAgICAgaWYgKCF2bS5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmdldENoaWxkcmVuVXVpZCh1dWlkLCBleHBhbmRDaGlsZHJlbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChkcmFnT3ZlckFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHkgPSAhZHJhZ092ZXJBc3NldC5pc0RpcmVjdG9yeSA/IDAgOiBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveFN0eWxlID0ge1xuICAgICAgICAgICAgICAgIGxlZnQ6ICR2aWV3Qm94LnNjcm9sbExlZnQgKyAncHgnLFxuICAgICAgICAgICAgICAgIHRvcDogdG9wICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IChleHBhbmRDaGlsZHJlbi5sZW5ndGggKyAxKSAqIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQgKyAyICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBvcGFjaXR5LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3mhJ/nn6XlvZPliY3miYDlpITnmoTmlofku7blpLnvvIznprvlvIDlkI7lj5bmtojpq5jkuq5cbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBkcmFnTGVhdmUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgIGlmIChhc3NldCAmJiAhYXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIGFzc2V0ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVthc3NldC51dWlkXSA9ICcnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiB0cmVlIOWuueWZqOS4iueahCBkcm9wXG4gICAgICogQHBhcmFtIGV2ZW50IOm8oOagh+S6i+S7tlxuICAgICAqL1xuICAgIGFzeW5jIGRyb3AoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShFZGl0b3IuVUkuX19wcm90ZWN0ZWRfXy5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICAvLyDlpoLmnpzmsqHmnInniLboioLngrnvvIzkvovlpoLmkJzntKLlkI7msqHnu5PmnpzvvIzliJnkuI3lk43lupRcbiAgICAgICAgaWYgKCF2bS5hc3NldHNbMF0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb3RVdWlkID0gdm0uYXNzZXRzWzBdLnV1aWQ7XG4gICAgICAgIGNvbnN0IGxvY2FsRmlsZXMgPSBBcnJheS5mcm9tKGV2ZW50LmRhdGFUcmFuc2ZlciEuZmlsZXMpO1xuICAgICAgICBpZiAobG9jYWxGaWxlcyAmJiBsb2NhbEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIOS7juWklumDqOaLluaWh+S7tui/m+adpVxuICAgICAgICAgICAgZGF0YS50eXBlID0gJ29zRmlsZSc7XG4gICAgICAgICAgICBkYXRhLmZpbGVzID0gbG9jYWxGaWxlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQoZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAvLyDlpoLmnpzku47moLnoioLngrnnp7vliqjvvIzlj4jokL3lm57moLnoioLngrnvvIzliJnkuI3pnIDopoHnp7vliqhcbiAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LnV1aWQgPT09IHJvb3RVdWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS50byA9IHJvb3RVdWlkOyAvLyDpg73lvZLkuo7moLnoioLngrlcbiAgICAgICAgZGF0YS5jb3B5ID0gZXZlbnQuY3RybEtleTtcbiAgICAgICAgdm0uaXBjRHJvcChkYXRhKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/m+WFpSB0cmVlIOWuueWZqFxuICAgICAqL1xuICAgIGRyYWdFbnRlcigpIHtcbiAgICAgICAgLy8g5pCc57Si5qih5byP5LiL77yM5LiN6K+G5Yir5Li65ouW5YWlIHRyZWUg5a655ZmoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveFN0eWxlID0ge307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbklkKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIHZtLmRyYWdPdmVyKHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6LWE5rqQ5ouW5YqoXG4gICAgICogQHBhcmFtIGRyYWdJbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGlwY0Ryb3AoZHJhZ0luZm86IElEcmFnSW5mbykge1xuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5mb2N1c1dpbmRvdygpOyAvLyDmi5bov5vns7vnu5/mlofku7blkI7nqpflj6PojrflvpfnhKbngrnvvIzku6Xop6blj5EgaXBjIOeahOaUtuWPkVxuXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuY2xlYXJTZWFyY2goKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG9Bc3NldCA9IHV0aWxzLmdldERpcmVjdG9yeShkcmFnSW5mby50byk7XG5cbiAgICAgICAgaWYgKCF0b0Fzc2V0IHx8IHV0aWxzLmNhbk5vdENyZWF0ZSh0b0Fzc2V0KSkge1xuICAgICAgICAgICAgY29uc3QgbXNnID0gRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuY2FuTm90RHJvcCcsIHsgdXVpZDogZHJhZ0luZm8udG8gfSk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS7juWklumDqOaLluaWh+S7tui/m+adpVxuICAgICAgICBpZiAoZHJhZ0luZm8udHlwZSA9PT0gJ29zRmlsZScpIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkcmFnSW5mby5maWxlcykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbGVwYXRocyA9IGRyYWdJbmZvLmZpbGVzLm1hcCgoZmlsZTogYW55KSA9PiBmaWxlLnBhdGgpO1xuXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt0b0Fzc2V0LnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodG9Bc3NldC51dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgICAgICAvLyDmib7lh7rkvJrph43lpI3nmoTmlofku7bpm4blkIhcbiAgICAgICAgICAgIGNvbnN0IHJlcGVhdEZpbGVzOiBJUmVwZWF0RmlsZVtdID0gYXdhaXQgZmlsZXBhdGhzLnJlZHVjZShhc3luYyAocmVzLCBmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0VVJMID0gdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmaWxlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdBc3NldFVSTCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2dlbmVyYXRlLWF2YWlsYWJsZS11cmwnLCBhc3NldFVSTCk7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0VVJMICE9PSBuZXdBc3NldFVSTCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYmFzZW5hbWUoZmlsZSksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKFtdKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHsgb3ZlcndyaXRlOiBmYWxzZSwgcmVuYW1lOiBmYWxzZSB9OyAvLyDlr7zlhaXpgInpoblcbiAgICAgICAgICAgIGxldCBzdG9wID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAocmVwZWF0RmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIOi2heWHujXkuKrmlofku7blsLHnlKguLi7ku6Pmm7/kuoZcbiAgICAgICAgICAgICAgICBsZXQgZGV0YWlsID0gcmVwZWF0RmlsZXNcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgodjogSVJlcGVhdEZpbGUpID0+IHYubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIDUpXG4gICAgICAgICAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwZWF0RmlsZXMubGVuZ3RoID4gNSkge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWwgKz0gJ1xcbiAuLi4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUucmVwZWF0VGlwJyksIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ1F1ZXN0aW9uJyksXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogZGV0YWlsLCAvLyDmj5DnpLrno4Hnm5jot6/lvoRcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUub3ZlcndyaXRlJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5yZW5hbWUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbmNlbCcpLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDIsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5vdmVyd3JpdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5yZW5hbWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFzdG9wICYmIGZpbGVwYXRocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgICAgICAgICAgZmlsZXBhdGhzLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXNzZXQtZGInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpbXBvcnQtYXNzZXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmaWxlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBlYXRGaWxlcy5zb21lKCh2OiBJUmVwZWF0RmlsZSkgPT4gdi5maWxlID09PSBmaWxlKSA/IG9wdGlvbiA6IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5a+85YWl5a6M5oiQ5oiW6ICF5Y+W5raI5LqG5a+85YWl77yM6L+Y5Y6f54i257qn54q25oCBXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt0b0Fzc2V0LnV1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh0b0Fzc2V0LnV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZHJhZ0luZm8udHlwZSA9PT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgICAgICAvLyDmmI7noa7mjqXlj5flpJbpg6jmi5bov5vmnaXnmoToioLngrkgY2MuTm9kZVxuICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGRyYWdJbmZvLmFkZGl0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlICE9PSAnY2MuTm9kZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBub2RlLnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGAke3RvQXNzZXQudXJsfS8ke2R1bXAubmFtZS52YWx1ZSB8fCAnTm9kZSd9LnByZWZhYmA7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1wcmVmYWInLCBub2RlVXVpZCwgdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QodXVpZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzICYmIHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcy5pbmNsdWRlcyhkcmFnSW5mby50eXBlKSkge1xuICAgICAgICAgICAgLy8g6K+l57G75Z6L55qE5LqL5Lu25pyJ5aSW6YOo5rOo5YaM55qE5Yqo5L2c77yM6L2s55Sx5aSW6YOo5rOo5YaM5LqL5Lu25o6l566hXG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBPYmplY3QudmFsdWVzKHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC5jYWxsYmFja3NbZHJhZ0luZm8udHlwZV0pIGFzIEZ1bmN0aW9uW107XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjYWxsYmFja3MpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldChkcmFnSW5mby50byk7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjazogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbzogRHJvcENhbGxiYWNrSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEaXJlY3Rvcnk6IGFzc2V0LmlzRGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhpbmZvLCBkcmFnSW5mby5hZGRpdGlvbmFsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZHJhZ0luZm8uYWRkaXRpb25hbCB8fCAhQXJyYXkuaXNBcnJheShkcmFnSW5mby5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRyYWdJbmZvLmNvcHkpIHtcbiAgICAgICAgICAgICAgICAvLyDmjInkvY/kuoYgY3RybCDplK7vvIzmi5bliqjlpI3liLZcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkcyA9IGRyYWdJbmZvLmFkZGl0aW9uYWwubWFwKChpbmZvOiBJRHJhZ0FkZGl0aW9uYWwpID0+IGluZm8udmFsdWUuc3BsaXQoJ0AnKVswXSk7XG4gICAgICAgICAgICAgICAgdm0uY29weShbLi4ubmV3IFNldCh1dWlkcyldKTtcbiAgICAgICAgICAgICAgICB2bS5wYXN0ZShkcmFnSW5mby50byk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB2bS5tb3ZlKGRyYWdJbmZvLCB0b0Fzc2V0KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi2XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY29weSh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb3BpZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGNvcGllcyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1dWlkIOaYryDlrZfnrKZcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/lpI3liLbnmoToioLngrlcbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSBjb3BpZXMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdENvcHkoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY29waWVkVXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bCG5aSN5Yi255qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAgICBjb25zdCBjb3BpZWRJbmZvOiBJQ29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGNvcGllZFV1aWRzKTtcbiAgICAgICAgLy8g5bCG5aSN5Yi26IqC54K555qEIHV1aWQg5a2Y5pS+5Yiw57uf5LiA55qE5Ymq5YiH5p2/XG4gICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ2Fzc2V0cy1jb3BpZWQtaW5mbycsIGNvcGllZEluZm8pO1xuXG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog57KY6LS0XG4gICAgICogQHBhcmFtIHV1aWQg57KY6LS05Yiw5q2k55uu5qCH6IqC54K5XG4gICAgICogQHBhcmFtIGNvcGllZFV1aWRzIOiiq+WkjeWItueahOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIHBhc3RlKHV1aWQ6IHN0cmluZywgY29waWVkVXVpZHM/OiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgdXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGVzdE5vZGUgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUodXVpZCk7IC8vIOiHqui6q+aIlueItue6p+aWh+S7tuWkuVxuICAgICAgICBpZiAoIWRlc3ROb2RlKSB7XG4gICAgICAgICAgICAvLyDmsqHmnInlj6/nlKjnmoRcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbk5vdFBhc3RlJywgeyB1dWlkIH0pO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjlhYjlpITnkIbliarliIfnmoTmg4XlhrVcbiAgICAgICAgY29uc3QgY3V0SW5mbyA9IEVkaXRvci5DbGlwYm9hcmQucmVhZCgnYXNzZXRzLWN1dC1pbmZvJykgYXMgYW55O1xuICAgICAgICAvLyDot6jnvJbovpHlmajkuI3lj6/liarliIfnspjotLTvvIzliarliIfml7blj6/og73pg73ov4fmu6TlhYnkuobmiYDku6XkuZ/pnIDopoHliKTmlq0gYXNzZXRJbmZvLmxlbmd0aFxuICAgICAgICBpZiAoY3V0SW5mbyAmJiBjdXRJbmZvLmFzc2V0SW5mby5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCA9PT0gY3V0SW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRJbmZvLmFzc2V0SW5mby5tYXAoKGl0ZW06IElDb3BpZWRBc3NldEluZm8pID0+IGl0ZW0udXVpZCk7XG4gICAgICAgICAgICAvLyDlpoLmnpzliarliIfliLDoh6rouqvmlofku7blpLnvvIznu4jmraJcbiAgICAgICAgICAgIGlmIChkZXN0Tm9kZSAmJiBjdXRVdWlkcy5pbmNsdWRlcyhkZXN0Tm9kZS51dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbW92ZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbDogY3V0VXVpZHMubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHV1aWQgfTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IHZtLm1vdmUobW92ZURhdGEsIGRlc3ROb2RlKTtcblxuICAgICAgICAgICAgLy8g572u56m65Ymq5YiH5p2/55qE5aSN5Yi25ZKM5Ymq5YiH6LWE5rqQXG4gICAgICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWIpOaWreS4jeaYr+WFtuS7luaTjeS9nOS8oOWFpeeahOWPguaVsFxuICAgICAgICBpZiAoIWNvcGllZFV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb3BpZWRJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdhc3NldHMtY29waWVkLWluZm8nKSBhcyBhbnk7XG4gICAgICAgICAgICBsZXQgY29waWVkRmlsZXMgPSBbXTtcbiAgICAgICAgICAgIGlmIChjb3BpZWRJbmZvKSB7XG4gICAgICAgICAgICAgICAgLy8g5LuO5Ymq5YiH5p2/5Lit6I635Y+WIGNvcGllZFV1aWRzIOWSjOWkhOeQhui3qOe8lui+keWZqOaXtueahOaWh+S7tui3r+W+hFxuICAgICAgICAgICAgICAgIGNvcGllZFV1aWRzID0gY29waWVkSW5mby5hc3NldEluZm8ubWFwKChpdGVtOiBJQ29waWVkQXNzZXRJbmZvKSA9PiBpdGVtLnV1aWQpO1xuICAgICAgICAgICAgICAgIGNvcGllZEZpbGVzID0gY29waWVkSW5mby5hc3NldEluZm8ubWFwKChpdGVtOiBJQ29waWVkQXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoOiBpdGVtLmZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJQYXRoOiBkZXN0Tm9kZS51cmwgKyAnLycgKyBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVE9ETzpcbiAgICAgICAgICAgICAqIOi3qOaWh+S7tuezu+e7n++8jOaaguS4jeaUr+aMge+8jOWPr+S7peiAg+iZkeWmguS9leWkjeeUqCBkcm9wIOWKqOS9nFxuICAgICAgICAgICAgICog55uu5YmN5Y+q5pSv5oyB6Leo57yW6L6R5Zmo77yM5L2/55SoIHByb2plY3QucGF0aCDliKTmlq3vvIxwYXN0ZSDlkowgZHJvcCDni6znq4vlrp7njrBcbiAgICAgICAgICAgICAqIOWJquWIh+adv+S4reWtmOWCqOeahOaYr+Wvueixoee7k+aehO+8jOWQjue7reWPr+S7peWCqOWtmCBKU09OIOWtl+espuS4slxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvLyDot6jnvJbovpHlmajnspjotLRcbiAgICAgICAgICAgIGlmIChjb3BpZWRGaWxlcy5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCAhPT0gY29waWVkSW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgICAgIC8vIOaYvuekuiBsb2FkaW5nIOaViOaenFxuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKGRlc3ROb2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShkZXN0Tm9kZS51dWlkLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBjb3BpZWRGaWxlcykge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbXBvcnQtYXNzZXQnLCBmaWxlLnNyY1BhdGgsIGZpbGUudGFyUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJyc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzlpI3liLbliLDoh6rouqvmlofku7blpLnvvIzpnIDopoHlvoDkuIrnp7vkuIDlsYLmlofku7blpLlcbiAgICAgICAgaWYgKGRlc3ROb2RlICYmIGNvcGllZFV1aWRzPy5pbmNsdWRlcyhkZXN0Tm9kZS51dWlkKSkge1xuICAgICAgICAgICAgZGVzdE5vZGUgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtkZXN0Tm9kZS51dWlkXSk7XG4gICAgICAgICAgICBpZiAoIWRlc3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJ5Y+v55So55qEXG4gICAgICAgICAgICAgICAgY29uc3QgbXNnID0gRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuY2FuTm90UGFzdGUnLCB7IHV1aWQgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmluYWxseUNhblBhc3RlOiBzdHJpbmdbXSA9IFtdOyAvLyDmnIDlkI7lj6/lpI3liLbnmoTpoblcbiAgICAgICAgY29waWVkVXVpZHM/LmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6IqC54K55Y+v5aSN5Yi2XG4gICAgICAgICAgICBjb25zdCBjYW5Db3B5ID0gIXV0aWxzLmNhbk5vdENvcHkoYXNzZXQpO1xuICAgICAgICAgICAgaWYgKCFjYW5Db3B5KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FybiA9IGAke0VkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNvcHlGYWlsJyl9OiAke2Fzc2V0Lm5hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4od2Fybik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS4jeaYr+atpOebruagh+iKgueCueeahOeItuiKgueCue+8iOS4jeWcqOWug+eahOS4iue6p+aWh+S7tuWkuemHjO+8iVxuICAgICAgICAgICAgY29uc3QgaW5zaWRlID0gdXRpbHMuaXNBSW5jbHVkZUIodXVpZCwgZGVzdE5vZGUudXVpZCk7XG4gICAgICAgICAgICBpZiAoaW5zaWRlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FybiA9IGAke0VkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmVycm9yUGFzdGVQYXJlbnRUb0NoaWxkJyl9OiAke2Fzc2V0Lm5hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4od2Fybik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYW5Db3B5ICYmICFpbnNpZGUpIHtcbiAgICAgICAgICAgICAgICBmaW5hbGx5Q2FuUGFzdGUucHVzaCh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmaW5hbGx5Q2FuUGFzdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBsZXQgYXNzZXQ7XG4gICAgICAgIGxldCBuZXdBc3NldDogSUFzc2V0SW5mbyB8IG51bGw7XG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIC8vIOaYvuekuiBsb2FkaW5nIOaViOaenFxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgdHJlZURhdGEudW5GcmVlemUoZGVzdE5vZGUudXVpZCk7XG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgIHZtLnRvZ2dsZShkZXN0Tm9kZS51dWlkLCB0cnVlKTtcblxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBhc3NldCA9IHV0aWxzLmdldEFzc2V0KGZpbmFsbHlDYW5QYXN0ZVtpbmRleF0pO1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIG5ld0Fzc2V0ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGJhc2VuYW1lKGFzc2V0LnVybCk7XG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9IGAke2Rlc3ROb2RlLnVybH0vJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLXVybCcsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgbmV3QXNzZXQgPSAoYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY29weS1hc3NldCcsIGFzc2V0LnVybCwgdGFyZ2V0KSkgYXMgSUFzc2V0SW5mbyB8IG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZiAobmV3QXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSBuZXdBc3NldC51dWlkO1xuICAgICAgICAgICAgICAgICAgICBuZXdTZWxlY3RzLnB1c2gobmV3QXNzZXQudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlIChuZXdBc3NldCk7XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbZGVzdE5vZGUudXVpZF0gPSAnJztcblxuICAgICAgICAvLyDpgInkuK3mlrDnmoTpobnnm65cbiAgICAgICAgdm0uaXBjU2VsZWN0KG5ld1NlbGVjdHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Ymq5YiH5piv6aKE5a6a55qE6KGM5Li677yM5Y+q5pyJ5YaN5omn6KGM57KY6LS05pON5L2c5omN5Lya55Sf5pWIXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY3V0KHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGN1dHMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGN1dHMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXVpZCDmmK8g5a2X56ymXG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gW3V1aWRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/liarliIfnmoToioLngrlcbiAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3RDdXQoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY3V0VXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bCG5Ymq5YiH55qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAgICBjb25zdCBjdXRJbmZvOiBJQ29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGN1dFV1aWRzKTtcbiAgICAgICAgLy8g5bCG5Ymq5YiH6IqC54K555qEIHV1aWQg5a2Y5pS+5Yiw57uf5LiA55qE5Ymq5YiH5p2/XG4gICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ2Fzc2V0cy1jdXQtaW5mbycsIGN1dEluZm8pO1xuXG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5bCG5aSN5Yi2L+WJquWIh+eahCB1dWlkcyDlpITnkIbmiJDliarliIfmnb/nmoTlr7nosaHnsbvlnotcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB1dWlkc1xuICAgICAqIEByZXR1cm4geyp9ICB7SUNvcGllZEluZm99XG4gICAgICovXG4gICAgdXVpZHNUb0NvcGllZEluZm8odXVpZHM6IHN0cmluZ1tdKTogSUNvcGllZEluZm8ge1xuICAgICAgICBjb25zdCBjb3BpZWRJbmZvID0gPElDb3BpZWRJbmZvPnt9O1xuICAgICAgICBjb3BpZWRJbmZvLnByb2plY3RQYXRoID0gRWRpdG9yLlByb2plY3QucGF0aDtcbiAgICAgICAgY29waWVkSW5mby5hc3NldEluZm8gPSBbXTtcbiAgICAgICAgdXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldDogSUFzc2V0SW5mbyB8IG51bGwgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZEFzc2V0SW5mbzogSUNvcGllZEFzc2V0SW5mbyA9IHtcbiAgICAgICAgICAgICAgICB1dWlkOiBhc3NldCA/IGFzc2V0LnV1aWQgOiAnJyxcbiAgICAgICAgICAgICAgICBmaWxlOiBhc3NldCA/IGFzc2V0LmZpbGUgOiAnJyxcbiAgICAgICAgICAgICAgICBuYW1lOiBhc3NldCA/IGFzc2V0Lm5hbWUgOiAnJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3BpZWRJbmZvLmFzc2V0SW5mby5wdXNoKGNvcGllZEFzc2V0SW5mbyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY29waWVkSW5mbztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItui1hOa6kO+8jOW5s+e6p1xuICAgICAqIEBwYXJhbSB1dWlkcyDotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBkdXBsaWNhdGUodXVpZHM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dWlkcykge1xuICAgICAgICAgICAgdXVpZHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb3BpZWRVdWlkcyA9IHV1aWRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3REdXBsaWNhdGUoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY29waWVkVXVpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBjb3BpZWRVdWlkcykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHZtLnBhc3RlKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0sIFt1dWlkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOenu+WKqCDotYTmupBcbiAgICAgKiBAcGFyYW0gZHJhZ0luZm8g5L+h5oGvXG4gICAgICogQHBhcmFtIHRvQXNzZXQg56e75Yqo55uu55qE5Zyw6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgbW92ZShkcmFnSW5mbzogSURyYWdJbmZvLCB0b0Fzc2V0OiBJQXNzZXRJbmZvKSB7XG4gICAgICAgIGlmICghZHJhZ0luZm8gfHwgIXRvQXNzZXQgfHwgIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uYWRkaXRpb25hbCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWxleW8gOebruagh+aWh+S7tuWkuVxuICAgICAgICB2bS50b2dnbGUodG9Bc3NldC51dWlkLCB0cnVlKTtcblxuICAgICAgICBjb25zdCB1dWlkcyA9IGRyYWdJbmZvLmFkZGl0aW9uYWwubWFwKChpbmZvOiBJRHJhZ0FkZGl0aW9uYWwpID0+IGluZm8udmFsdWUuc3BsaXQoJ0AnKVswXSk7XG5cbiAgICAgICAgLy8g5aSa6LWE5rqQ56e75Yqo77yM5qC55o2u546w5pyJ5o6S5bqP55qE6aG65bqP5omn6KGMXG4gICAgICAgIHV1aWRzLnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhSW5kZXggPSB0cmVlRGF0YS51dWlkVG9JbmRleFthXTtcbiAgICAgICAgICAgIGNvbnN0IGJJbmRleCA9IHRyZWVEYXRhLnV1aWRUb0luZGV4W2JdO1xuICAgICAgICAgICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgdXVpZHNMZW5ndGggPSB1dWlkcy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHV1aWRzW2ldO1xuXG4gICAgICAgICAgICBpZiAodmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmcm9tQXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghZnJvbUFzc2V0IHx8ICFmcm9tUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b0Fzc2V0LnV1aWQgPT09IGZyb21Bc3NldC51dWlkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5jYW5Ob3RDdXQoZnJvbUFzc2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0b0Fzc2V0IOaYryBmcm9tQXNzZXQg55qE5a2Q6ZuG77yM5omA5Lul54i25LiN6IO956e75Yiw5a2Q6YeM6Z2iXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNBSW5jbHVkZUIoZnJvbUFzc2V0LnV1aWQsIGRyYWdJbmZvLnRvKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDotYTmupDnp7vliqjku43lnKjljp/mnaXnmoTnm67lvZXlhoXvvIzkuI3pnIDopoHnp7vliqhcbiAgICAgICAgICAgIGlmICh0b0Fzc2V0LnV1aWQgPT09IGZyb21QYXJlbnQudXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXNrczogQXJyYXk8UHJvbWlzZTxBc3NldEluZm8gfCBudWxsPj4gPSBbXTtcblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzTGVuZ3RoID0gdmFsaWRVdWlkcy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Bc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgZnJvbVBhcmVudCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tQXNzZXQgfHwgIWZyb21QYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g56e75Yqo6LWE5rqQXG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IGZyb21Bc3NldC51dWlkO1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB0b0Fzc2V0LnVybCArICcvJyArIGJhc2VuYW1lKGZyb21Bc3NldC51cmwpO1xuXG4gICAgICAgICAgICAvLyDlrp7kvovljJbomZrmi5/otYTmupBcbiAgICAgICAgICAgIGlmIChmcm9tQXNzZXQuaW5zdGFudGlhdGlvbikge1xuICAgICAgICAgICAgICAgIHRhc2tzLnB1c2goRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnaW5pdC1hc3NldCcsIGZyb21Bc3NldC51cmwsIHRhcmdldCkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXNrcy5wdXNoKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ21vdmUtYXNzZXQnLCBmcm9tQXNzZXQudXJsLCB0YXJnZXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDpgInkuK3np7vliqjpoblcbiAgICAgICAgdm0uaXBjU2VsZWN0KHZhbGlkVXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YeN5paw5a+85YWl6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgcmVpbXBvcnQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBzZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4rVxuICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgc2VsZWN0cyA9IFt1dWlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgbGV0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBzZWxlY3RzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCB1dGlscy5jYW5Ob3RSZWltcG9ydChhc3NldCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIC8vIOehruS/nSAxLzLvvJogdmFsaWRVdWlkcyDph4zpnaLku7vkuIDotYTmupDpg73kuI3mmK8gdXVpZCDnmoTomZrmi5/lrZDotYTmupBcbiAgICAgICAgICAgICAgICB2YWxpZFV1aWRzID0gdmFsaWRVdWlkcy5maWx0ZXIoKHZhbGlkVXVpZCkgPT4gIXV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIHZhbGlkVXVpZCkpO1xuXG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIDIvMu+8miB2YWxpZFV1aWRzIOmHjOeahOS7u+S4gOi1hOa6kOmDveS4jeaYryB1dWlkIOeahOeItui1hOa6kFxuICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5zb21lKCh2YWxpZFV1aWQpID0+IHV0aWxzLmlzQUluY2x1ZGVCKHZhbGlkVXVpZCwgdXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyhjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXZhbGlkVXVpZHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWinuWKoOmHjeWvvOS4reeahCBsb2FkaW5nIOeVjOmdouaViOaenFxuICAgICAgICBmb3IgKGNvbnN0IHZhbGlkVXVpZCBvZiB2YWxpZFV1aWRzKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt2YWxpZFV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodmFsaWRVdWlkKTtcbiAgICAgICAgfVxuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHZhbGlkVXVpZCBvZiB2YWxpZFV1aWRzKSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWltcG9ydC1hc3NldCcsIHZhbGlkVXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5qCR5b2i5pWw5o2u5bey5pS55Y+YXG4gICAgICog5aaC6LWE5rqQ5aKe5Yig5pS577yM5piv6L6D5aSn55qE5Y+Y5Yqo77yM6ZyA6KaB6YeN5paw6K6h566X5ZCE5Liq6YWN5aWX5pWw5o2uXG4gICAgICog5aKe5YqgIHNldFRpbWVPdXQg5piv5Li65LqG5LyY5YyW5p2l6Ieq5byC5q2l55qE5aSa5qyh6Kem5Y+RXG4gICAgICovXG4gICAgcmVuZGVyKCkge1xuICAgICAgICAvLyDlrrnlmajnmoTmlbTkvZPpq5jluqZcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwudHJlZUhlaWdodCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGggKiBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0O1xuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFsbEV4cGFuZCA9IHZtLmlzQWxsRXhwYW5kKCk7XG5cbiAgICAgICAgLy8g6YeN5paw5riy5p+T5Ye65qCR5b2iXG4gICAgICAgIHZtLmZpbHRlckFzc2V0cygpO1xuXG4gICAgICAgIHdoaWxlIChwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWR5VHdpbmtsZSA9IHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZChyZWFkeVR3aW5rbGUudXVpZCwgcmVhZHlUd2lua2xlLmFuaW1hdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmHjeaWsOa4suafk+agkeW9olxuICAgICAqIHZtLmFzc2V0cyDkuLrlvZPliY3mmL7npLrnmoTpgqPlh6DkuKroioLngrnmlbDmja5cbiAgICAgKi9cbiAgICBmaWx0ZXJBc3NldHMoKSB7XG4gICAgICAgIHZtLmFzc2V0cyA9IFtdOyAvLyDlhYjmuIXnqbrvvIzov5nnp43otYvlgLzmnLrliLbmiY3og73liLfmlrAgdnVl77yM6ICMIC5sZW5ndGggPSAwIOS4jeihjFxuXG4gICAgICAgIGNvbnN0IHRvcCA9IHZtLnNjcm9sbFRvcCAlIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IG1pbiA9IHZtLnNjcm9sbFRvcCAtIHRvcDsgLy8g566X5Ye65Y+v6KeG5Yy65Z+f55qEIHRvcCDmnIDlsI/lgLxcbiAgICAgICAgY29uc3QgbWF4ID0gbWluICsgcGFuZWxEYXRhLiQucGFuZWwudmlld0hlaWdodDsgLy8g5pyA5aSn5YC8XG5cbiAgICAgICAgdm0uJGVsLnN0eWxlLnRvcCA9IGAtJHt0b3B9cHhgO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5yb3VuZChtaW4gLyBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgZW5kID0gTWF0aC5jZWlsKG1heCAvIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQpICsgMTtcblxuICAgICAgICB2bS5hc3NldHMgPSB0cmVlRGF0YS5vdXRwdXREaXNwbGF5KHN0YXJ0LCBlbmQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6YCJ5Lit5YiX6KGo5pWw57uE5Lit56ys5LiA5Liq6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue5Zyo5pi+56S66Zif5YiX5Lit55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgZ2V0Rmlyc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzWzBdO1xuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6YCJ5Lit5YiX6KGo5pWw57uE5Lit5pyA5ZCO5LiA5Liq6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue5Zyo5pi+56S66Zif5YiX5Lit55qE5pyA5ZCO5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgZ2V0TGFzdFNlbGVjdCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKHNlbGVjdHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBwYW5lbERhdGEuYWN0LnNlbGVjdHNbc2VsZWN0c0xlbmd0aCAtIDFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGlzcGxheUxlbmd0aCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5W2Rpc3BsYXlMZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6KeG6KeJ5LiK5qCR5b2i5LiK5LiL5YiX6KGo5Lit77yM56ys5LiA5Liq6YCJ5Lit6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue6aG25bGC5qC56IqC54K5ICdkYjovLydcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKSB7XG4gICAgICAgIGxldCB1dWlkID0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbDtcblxuICAgICAgICBjb25zdCBtaW5JbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGg7XG5cbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHNlbGVjdCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgbWluSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZCA9IHNlbGVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXVpZDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/lOWbnuagkeW9ouesrOS4gOS4quiKgueCuVxuICAgICAqIOesrOS4gOS4quiKgueCue+8jOS4jeS4gOWumuaYr+agueiKgueCue+8jOS+i+WmguWcqOaQnOe0oueahOaDheWGteS4i1xuICAgICAqL1xuICAgIGdldEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF07XG4gICAgfSxcbiAgICBpc0V4cGFuZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRyZWVEYXRhLnV1aWRUb0V4cGFuZFt1dWlkXTtcbiAgICB9LFxuICAgIGlzU2VsZWN0KHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YodXVpZCkgIT09IC0xO1xuICAgIH0sXG4gICAgZ2V0VHdpbmtsZSh1dWlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC50d2lua2xlc1t1dWlkXSA/PyAnJztcbiAgICB9LFxuICAgIGlzQWxsRXhwYW5kKCkge1xuICAgICAgICBsZXQgYWxsQ29sbGFwc2UgPSB0cnVlO1xuXG4gICAgICAgIGxldCBwYXJlbnRzID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF07XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwYXJlbnRzIHx8ICFwYXJlbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbENvbGxhcHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50c0xlbmd0aCA9IHBhcmVudHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHBhcmVudFV1aWQgPSBwYXJlbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICBpZiAocGFyZW50ICYmICdpc1BhcmVudCcgaW4gcGFyZW50ICYmICFwYXJlbnQuaXNQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyZWVEYXRhLnV1aWRUb0V4cGFuZFtwYXJlbnRVdWlkXSkge1xuICAgICAgICAgICAgICAgIGFsbENvbGxhcHNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gIWFsbENvbGxhcHNlO1xuICAgIH0sXG4gICAgaXNTZWFyY2hpbmdNb2RlKCkge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNTZWFyY2hpbmdNb2RlKCk7XG4gICAgfSxcbiAgICBhc3luYyBkaWFsb2dFcnJvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcihFZGl0b3IuSTE4bi50KGBhc3NldHMub3BlcmF0ZS4ke21lc3NhZ2V9YCksIHtcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dFcnJvcicpLFxuICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IHdhdGNoID0ge1xuICAgIC8qKlxuICAgICAqIHNjcm9sbFRvcCDlj5jljJbvvIzliLfmlrDmoJHlvaJcbiAgICAgKi9cbiAgICBzY3JvbGxUb3AoKSB7XG4gICAgICAgIHZtLmZpbHRlckFzc2V0cygpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5b2T5YmN6YCJ5Lit6aG55Y+Y5YqoXG4gICAgICovXG4gICAgYWN0aXZlQXNzZXQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFjdGl2ZUFzc2V0ID0gdm0uYWN0aXZlQXNzZXQ7XG4gICAgfSxcbn07XG5cbi8qKlxuICogdnVlIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXNzZXRzOiBbXSwgLy8g5b2T5YmN5qCR5b2i5Zyo5Y+v6KeG5Yy65Z+f55qE6LWE5rqQ6IqC54K5XG4gICAgICAgIHJlbmFtZVVybDogJycsIC8vIOmcgOimgSByZW5hbWUg55qE6IqC54K555qEIHVybO+8jOWPquacieS4gOS4qlxuICAgICAgICBhZGRJbmZvOiB7XG4gICAgICAgICAgICAvLyDmt7vliqDkuIDkuKrmlrDotYTmupDliY3nmoTmlbDmja7vvIzpnIDopoHkuovliY3ph43lkb3lkI1cbiAgICAgICAgICAgIHR5cGU6ICcnLFxuICAgICAgICAgICAgaW1wb3J0ZXI6ICcnLFxuICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICBmaWxlRXh0OiAnJyxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAnJyxcbiAgICAgICAgICAgIHBhcmVudERpcjogJycsXG4gICAgICAgIH0sXG4gICAgICAgIGludG9WaWV3QnlTZWxlY3RlZDogJycsIC8vIOaUtuWIsOmAieS4rSBpcGMg6ZyA6KaB5a6a5L2N5pi+56S655qE6LWE5rqQXG4gICAgICAgIGludG9WaWV3QnlVc2VyOiAnJywgLy8g55So5oi35pON5L2c55qE5paw5aKe56e75Yqo6LWE5rqQ77yM57uZ5LqI5a6a5L2NXG4gICAgICAgIHNjcm9sbFRvcDogMCwgLy8g5b2T5YmN5qCR5b2i55qE5rua5Yqo5pWw5o2uXG4gICAgICAgIGRyb3BwYWJsZVR5cGVzOiBbXSxcbiAgICAgICAgY2hlY2tTaGlmdFVwRG93bk1lcmdlOiB7IHV1aWQ6ICcnLCBkaXJlY3Rpb246ICcnIH0sIC8vIHNoaWZ0ICsg566t5aS05aSa6YCJ77yM5aKe5by65Lqk5LqS5pWI5p6cXG4gICAgICAgIHNlYXJjaFRpbWVyOiB1bmRlZmluZWQsXG4gICAgfTtcbn1cblxuLyoqXG4gKiB2bSA9IHRoaXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vdW50ZWQoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHZtID0gdGhpcztcblxuICAgIC8vIOWvueS6juWtkOmbhueahOWPmOWKqO+8jOacgOWQjuS4gOS4qiBpcGMg5raI5oGv5Y+R55qE5piv54i257qn5paH5Lu25aS555qE5Y+Y5Yqo77yM6L+Z5LiN6ZyA6KaB5pi+56S65Ye65p2l77yM5omA5Lul5YGa5LqG6K6w5b2V5YeG5aSH5b+955WlXG4gICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzID0ge307XG59XG4iXX0=