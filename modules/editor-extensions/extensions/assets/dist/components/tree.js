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
exports.template = fs_1.readFileSync(path_1.join(__dirname, '../../static/template/tree.html'), 'utf8');
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
                        if (!fileInfo || !fs_1.existsSync(fileInfo.file)) {
                            console.error(vm.t('readDefaultFileFail'), fileUrl);
                            return;
                        }
                        addInfo.content = fs_1.readFileSync(fileInfo.file, 'utf-8');
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
            fileName: path_1.basename(url, fileExt),
            name: path_1.basename(url),
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
                    if (!fileInfo || !fs_1.existsSync(fileInfo.file)) {
                        console.error(vm.t('readDefaultFileFail'));
                        return;
                    }
                    content = fs_1.readFileSync(fileInfo.file, 'utf-8');
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
        treeData.render();
        return true;
    },
    sort() {
        treeData.resort();
    },
    search() {
        treeData.render();
        // 搜索有变动都先滚回顶部
        if (panelData.$.panel.searchValue) {
            setTimeout(() => {
                panelData.$.viewBox.scrollTo(0, 0);
            }, 200);
        }
        // 用 setTimeout 下一帧重新定位
        if (!panelData.$.panel.searchInFolder && !panelData.$.panel.searchValue) {
            setTimeout(() => {
                utils.scrollIntoView(vm.intoViewBySelected, true);
            }, 200);
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
        const data = JSON.parse(JSON.stringify(Editor.UI.DragArea.currentDragInfo)) || {};
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
                const assetURL = toAsset.url + '/' + path_1.basename(file);
                const newAssetURL = await Editor.Message.request('asset-db', 'generate-available-url', assetURL);
                if (assetURL !== newAssetURL) {
                    result.push({
                        file,
                        name: path_1.basename(file),
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
                    return Editor.Message.request('asset-db', 'import-asset', file, toAsset.url + '/' + path_1.basename(file), repeatFiles.some((v) => v.file === file) ? option : {});
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
                const name = path_1.basename(asset.url);
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
            const target = toAsset.url + '/' + path_1.basename(fromAsset.url);
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
        checkShiftUpDownMerge: { uuid: '', direction: '' }, // shift + 箭头多选，增强交互效果
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZWIsK0JBQXNDO0FBQ3RDLDJCQUE4QztBQUM5Qyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUU1Qix1QkFBdUI7QUFDdkIsSUFBSSxZQUFpQixDQUFDO0FBQ3RCLElBQUksY0FBbUIsQ0FBQztBQUN4QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxnQkFBcUIsQ0FBQztBQUViLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUVkLFFBQUEsS0FBSyxHQUFHO0lBQ2pCLGtCQUFrQixFQUFFO1FBQ2hCLElBQUksRUFBRSxLQUFLO1FBQ1gsT0FBTztZQUNILE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVXLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXBGLFFBQUEsVUFBVSxHQUFHO0lBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDO0NBQ3RDLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixFQUFFLENBQUMsY0FBYyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFVB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QUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDL0IsQ0FBQztBQU5ELDBCQU1DIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1xuICAgIElDcmVhdGVPcHRpb24sXG4gICAgSUFkZEluZm8sXG4gICAgSUFzc2V0SW5mbyxcbiAgICBEcm9wQ2FsbGJhY2tJbmZvLFxuICAgIElEcmFnSW5mbyxcbiAgICBJRHJhZ0FkZGl0aW9uYWwsXG4gICAgQXNzZXRJbmZvLFxuICAgIElDb3BpZWRJbmZvLFxuICAgIElDb3BpZWRBc3NldEluZm8sXG4gICAgSVJlcGVhdEZpbGUsXG59IGZyb20gJy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHsgYmFzZW5hbWUsIGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhbmVsRGF0YSBmcm9tICcuL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi90cmVlLWRhdGEnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbmxldCB2bTogYW55ID0gbnVsbDtcbmxldCByZXF1ZXN0QW5pbWF0aW9uSWQ6IGFueTtcblxuLy8g55So5LqO6K+G5YirIGRyYWcg5oKs5YGc77yM6Ieq5Yqo5bGV5byA5paH5Lu25aS5XG5sZXQgZHJhZ092ZXJVdWlkOiBhbnk7XG5sZXQgZHJhZ092ZXJUaW1lSWQ6IGFueTtcbmxldCBzZWxlY3RlZFRpbWVJZDogYW55O1xubGV0IHJlZnJlc2hpbmdUaW1lSWQ6IGFueTtcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAndHJlZSc7XG5cbmV4cG9ydCBjb25zdCBwcm9wcyA9IHtcbiAgICBkcm9wcGFibGVUeXBlc1Byb3A6IHtcbiAgICAgICAgdHlwZTogQXJyYXksXG4gICAgICAgIGRlZmF1bHQoKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH0sXG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS90cmVlLmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgJ3RyZWUtbm9kZSc6IHJlcXVpcmUoJy4vdHJlZS1ub2RlJyksXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDnv7vor5FcbiAgICAgKiBAcGFyYW0ga2V5IOS4jeW4pumdouadv+WQjeensOeahOagh+iusOWtl+esplxuICAgICAqL1xuICAgIHQoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLiQucGFuZWwudChrZXkpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSW6YOo5pWw5o2u5pu05paw5ZCO77yM5pu05paw5YaF6YOo5pWw5o2uXG4gICAgICovXG4gICAgdXBkYXRlKCkge1xuICAgICAgICB2bS5kcm9wcGFibGVUeXBlcyA9IFsuLi52bS5kcm9wcGFibGVUeXBlc1Byb3AsIC4uLnBhbmVsRGF0YS5jb25maWcuYXNzZXRUeXBlcygpXTtcblxuICAgICAgICAvLyDmuIXnqbrmlrDlu7rmiJbph43lkb3lkI3nirbmgIFcbiAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgdm0ucmVuYW1lVXJsID0gJyc7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmuIXnqbrmoJHlvaJcbiAgICAgKi9cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdHJlZURhdGEuY2xlYXIoKTtcbiAgICAgICAgdm0ucmVuZGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliLfmlrDmoJHlvaJcbiAgICAgKiBAcGFyYW0gdHlwZSDmmK/lkKbph43nva7mlbDmja5cbiAgICAgKiBAcGFyYW0gbmFtZSBpcGMg5Yqo5L2c55qE5ZCN56ewXG4gICAgICovXG4gICAgcmVmcmVzaGluZyh0eXBlOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdXVpZD86IHN0cmluZykge1xuICAgICAgICBpZiAodXVpZCAmJiB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbdXVpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbdXVpZF07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5yZWZyZXNoaW5nID0geyB0eXBlLCBuYW1lIH07XG5cbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChyZWZyZXNoaW5nVGltZUlkKTtcbiAgICAgICAgcmVmcmVzaGluZ1RpbWVJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIC8vIOaPkOekuua2iOWksVxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwucmVmcmVzaGluZy50eXBlID0gJyc7XG4gICAgICAgICAgICB2bS5yZWZyZXNoaW5nLmlnbm9yZXMgPSB7fTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnnmoTmipjlj6Av5bGV5byA5YiH5o2iXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGV4cGFuZCAg5piv5ZCm5bGV5byAXG4gICAgICogQHBhcmFtIGxvb3AgIOaMieS9jyBBbHQg6ZSu5Y+v6L+b5YWl5a2Q6IqC54K55b6q546vXG4gICAgICovXG4gICAgdG9nZ2xlKHV1aWQ6IHN0cmluZywgZXhwYW5kPzogYm9vbGVhbiwgbG9vcD86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKGxvb3ApIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnRvZ2dsZUV4cGFuZCh1dWlkLCBleHBhbmQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliKTmlq3kuIvkuKrliqjkvZzmmK/mlLbotbfov5jmmK/lsZXlvIAg77yI5b2T5a2Y5Zyo5LiN5ZCM54q25oCB55qE5paH5Lu25aS55pe277yM6KeG5Li65pS26LW344CC5b2T54q25oCB55u45ZCM77yM5Y+W5Y+N5Y2z5Y+v44CC77yJXG4gICAgICogQHBhcmFtIHBhcmVudHNcbiAgICAgKiBAcmV0dXJucyBib29sZWFuXG4gICAgICovXG4gICAgbmV4dFRvZ2dsZUV4cGFuZChwYXJlbnRzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICAgICAgICBsZXQgcmVzdWx0ID0gZmFsc2U7IC8vIOm7mOiupOS4uuaUtui1t1xuICAgICAgICAvLyDmoLnmja7op4TliJnvvIzpgqPkuYjlj6rmnInlvZPlhajpg6jpg73kuLrmlLbotbfnmoTml7blgJnvvIzpnIDopoHlsZXlvIDnmoTmk43kvZxcbiAgICAgICAgY29uc3QgaXNBbGxDbG9zZSA9IHBhcmVudHMuZXZlcnkoKHBhcmVudElEKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9Bc3NldFtwYXJlbnRJRF07XG4gICAgICAgICAgICBpZiAoISgnaXNQYXJlbnQnIGluIHBhcmVudCAmJiBwYXJlbnQuaXNQYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50SUQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3BhcmVudElEXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhdHJlZURhdGEudXVpZFRvRXhwYW5kW3BhcmVudElEXTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpc0FsbENsb3NlKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlhajpg6joioLngrnmipjlj6DmiJblsZXlvIBcbiAgICAgKi9cbiAgICBhbGxUb2dnbGUoKSB7XG4gICAgICAgIGxldCBwYXJlbnRzID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF07XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50c0xlbmd0aCA9IHBhcmVudHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXBhcmVudHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4cGFuZCA9IHZtLm5leHRUb2dnbGVFeHBhbmQocGFyZW50cyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHBhcmVudHNbaV07XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9Bc3NldFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIGlmICghKCdpc1BhcmVudCcgaW4gcGFyZW50ICYmIHBhcmVudC5pc1BhcmVudCkpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQocGFyZW50VXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YCJXG4gICAgICogQHBhcmFtIHV1aWQg5YWo6YCJ6K+l55uu5qCH6IqC54K55LiL55qE5a2Q6IqC54K5XG4gICAgICovXG4gICAgc2VsZWN0QWxsKHV1aWQ6IHN0cmluZykge1xuICAgICAgICAvLyDmkbjntKLmqKHlvI/kuIvvvIzlhajpgInkuLrlvZPliY3liJfooahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdHJlZURhdGEuZGlzcGxheUFycmF5KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnRVdWlkID0gdXVpZCB8fCB2bS5nZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcblxuICAgICAgICBpZiAoIXRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdKSB7XG4gICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiOt+WPluW3suWxleW8gOeahOWtkOiKgueCuVxuICAgICAgICBjb25zdCBjaGlsZHJlblV1aWQ6IHN0cmluZ1tdID0gW107XG4gICAgICAgIHV0aWxzLmdldENoaWxkcmVuVXVpZChwYXJlbnRVdWlkLCBjaGlsZHJlblV1aWQsIHRydWUpO1xuXG4gICAgICAgIGNvbnN0IGNsb25lU2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICBjb25zdCBwYXJlbnRJbiA9IGNsb25lU2VsZWN0cy5pbmNsdWRlcyhwYXJlbnRVdWlkKTtcblxuICAgICAgICBsZXQgY2hpbGRyZW5BbGxJbiA9IHRydWU7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuVXVpZExlbmd0aCA9IGNoaWxkcmVuVXVpZC5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW5VdWlkTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGNoaWxkcmVuVXVpZFtpXSkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbkFsbEluID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hpbGRyZW5BbGxJbikge1xuICAgICAgICAgICAgaWYgKCFwYXJlbnRJbikge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDlvoDkuIrkuIDlsYJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50VXVpZCAhPT0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5zZWxlY3RBbGwodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnRJbikge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuVXVpZC51bnNoaWZ0KHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGNoaWxkcmVuVXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGNoaWxkcmVuVXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNlbGVjdENsZWFyKCkge1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5re75Yqg6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWRzIHN0cmluZyB8IHN0cmluZ1tdXG4gICAgICovXG4gICAgc2VsZWN0ZWQodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1dWlkcykpIHtcbiAgICAgICAgICAgIHV1aWRzID0gW3V1aWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKCFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaCh1dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlTZWxlY3RlZCA9IHV1aWQ7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFRpbWVJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICB9LCA1MCk7XG5cbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6Ugc2hpZnQg5aSa6YCJ55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuYWxsRXhwYW5kID0gdm0uaXNBbGxFeHBhbmQoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIHVuc2VsZWN0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YodXVpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc2VsZWN0ZWRUaW1lSWQpO1xuICAgICAgICAgICAgc2VsZWN0ZWRUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVNlbGVjdGVkID09PSB1dWlkKSB7XG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5U2VsZWN0ZWQgPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5oGi5aSN6YCJ5Lit54q25oCBXG4gICAgICovXG4gICAgcmVzZXRTZWxlY3RlZCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzID0gW107XG4gICAgICAgIGNvbnN0IHV1aWRzID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYXNzZXQnKTtcbiAgICAgICAgdm0uc2VsZWN0ZWQodXVpZHMpO1xuXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc2VsZWN0ZWRUaW1lSWQpO1xuICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh2bS5pbnRvVmlld0J5U2VsZWN0ZWQsIHRydWUpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogc2hpZnQgKyBjbGljayDlpJrpgIlcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBzaGlmdENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCB7IGRpc3BsYXlBcnJheSB9ID0gdHJlZURhdGE7XG5cbiAgICAgICAgY29uc3QgZmlyc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXSk7XG4gICAgICAgIGNvbnN0IGxhc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChmaXJzdEluZGV4ICE9PSAtMSB8fCBsYXN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RJbmRleCA8PSBsYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA8PSBsYXN0SW5kZXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBmaXJzdEluZGV4OyBpID49IGxhc3RJbmRleDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdHMucHVzaChkaXNwbGF5QXJyYXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmlwY1NlbGVjdChzZWxlY3RzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGN0cmwgKyBjbGljayDpgInkuK3miJblj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBjdHJsQ2xpY2sodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCB1dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWRzIOi1hOa6kFxuICAgICAqL1xuICAgIGlwY1NlbGVjdCh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5qCR5b2i5LiK55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgaXBjU2VsZWN0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgY29uc3QgdXVpZCA9IHRoaXMuZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOepuueZveWkhOeCueWHu++8jOWPlua2iOmAieS4rVxuICAgICAqL1xuICAgIGNsaWNrKCkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliJvlu7rliY3vvIzlkI3np7DlpITnkIZcbiAgICAgKiBAcGFyYW0gYWRkSW5mbyDkv6Hmga9cbiAgICAgKi9cbiAgICBhc3luYyBhZGRUbyhhZGRJbmZvOiBJQWRkSW5mbykge1xuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhZGRJbmZvLnV1aWQpIHtcbiAgICAgICAgICAgIGFkZEluZm8udXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDoh6rouqvmiJbniLbnuqfmlofku7blpLlcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuY2xvc2VzdFdoaWNoQ2FuQ3JlYXRlKGFkZEluZm8udXVpZCk7XG5cbiAgICAgICAgLy8gcGFyZW50IOS4jeWtmOWcqOaIluWkhOS6juWFtuS7lueKtuaAge+8jOS4jemAguWQiOWIm+W7ulxuICAgICAgICBpZiAoIXBhcmVudCB8fCB0cmVlRGF0YS51dWlkVG9TdGF0ZVtwYXJlbnQudXVpZF0pIHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbk5vdEFkZFRvJywge1xuICAgICAgICAgICAgICAgIHV1aWQ6IGFkZEluZm8udXVpZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsZXlvIDniLbnuqfoioLngrlcbiAgICAgICAgdm0udG9nZ2xlKHBhcmVudC51dWlkLCB0cnVlKTtcblxuICAgICAgICAvLyDmu5rliqjliLDpobblsYLop4bnqpdcbiAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcocGFyZW50LnV1aWQpO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudERpciA9IHBhcmVudC51cmw7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGFkZEluZm8uZmlsZU5hbWUgfHwgJ05ldyBGaWxlJztcbiAgICAgICAgbGV0IGZpbGVFeHQgPSBgLiR7YWRkSW5mby50eXBlfWA7XG5cbiAgICAgICAgY29uc3QgY2FtZWxGb3JtYXRSZWcgPSAvQGNjY2xhc3MoW148XSopKDwlQ2FtZWxDYXNlQ2xhc3NOYW1lJT4pLztcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lRm9ybWF0UmVnID0gL0BjY2NsYXNzXFwoWydcIl0oW14nXCJdKilbJ1wiXVxcKS87XG4gICAgICAgIGNvbnN0IGNvbW1lbnRzUmVnID0gLyhcXG5bXlxcbl0qXFwvXFwqW1xcc1xcU10qP1xcKlxcLyl8KFxcblteXFxuXSpcXC9cXC8oPzpbXlxcclxcbl18XFxyKD8hXFxuKSkqKS9nOyAvLyDms6jph4rljLrln5/ov57lkIzov57nu63nmoTnqbrooYxcblxuICAgICAgICBzd2l0Y2ggKGFkZEluZm8udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnZGlyZWN0b3J5JzpcbiAgICAgICAgICAgICAgICBmaWxlRXh0ID0gJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0cyc6XG4gICAgICAgICAgICBjYXNlICdqcyc6IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFkZEluZm8uY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSAnJztcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXJsID0gYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHthZGRJbmZvLnRlbXBsYXRlIHx8IGFkZEluZm8udHlwZX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGZpbGVVdWlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHZtLnQoJ3JlYWREZWZhdWx0RmlsZUZhaWwnKSwgZmlsZVVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmlbTnkIblubbor4bliKvmqKHmnb/mlbDmja5cbiAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSBhZGRJbmZvLmNvbnRlbnQucmVwbGFjZShjb21tZW50c1JlZywgKCQwOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQwLmluY2x1ZGVzKCdDT01NRU5UU19HRU5FUkFURV9JR05PUkUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQwO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8g6K+G5Yir5piv5ZCm5ZCv55So6am85bOw5qC85byP55qE57G75ZCNXG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5yZXF1aXJlZENhbWVsQ2FzZUNsYXNzTmFtZSA9IGNhbWVsRm9ybWF0UmVnLnRlc3QoYWRkSW5mby5jb250ZW50KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVNYXRjaGVzID0gYWRkSW5mby5jb250ZW50Lm1hdGNoKGNsYXNzTmFtZUZvcm1hdFJlZyk7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5jbGFzc05hbWVTdHJpbmdGb3JtYXQgPSBuYW1lTWF0Y2hlcyAmJiBuYW1lTWF0Y2hlc1sxXSA/IG5hbWVNYXRjaGVzWzFdIDogJyc7XG5cbiAgICAgICAgICAgICAgICBmaWxlTmFtZSA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuZ2V0VmFsaWRGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmnIDlkI7ku6Xov5nkuKogdXJsIOaVsOaNruS4uuWHhlxuICAgICAgICBsZXQgdXJsID0gYCR7cGFyZW50RGlyfS8ke2ZpbGVOYW1lfSR7ZmlsZUV4dH1gO1xuICAgICAgICB1cmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgdXJsKTtcblxuICAgICAgICB2bS5hZGRJbmZvID0ge1xuICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgdHlwZTogYWRkSW5mby50eXBlLFxuICAgICAgICAgICAgaW1wb3J0ZXI6IGFkZEluZm8uaW1wb3J0ZXIsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYWRkSW5mby50ZW1wbGF0ZSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGFkZEluZm8uY29udGVudCxcbiAgICAgICAgICAgIGZpbGVFeHQsXG4gICAgICAgICAgICBmaWxlTmFtZTogYmFzZW5hbWUodXJsLCBmaWxlRXh0KSxcbiAgICAgICAgICAgIG5hbWU6IGJhc2VuYW1lKHVybCksXG4gICAgICAgICAgICBwYXJlbnREaXIsXG4gICAgICAgICAgICBwYXJlbnRVdWlkOiBwYXJlbnQudXVpZCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQjeensOWhq+WGmeWQjuaPkOS6pOWIsOi/memHjFxuICAgICAqIEBwYXJhbSBhZGRJbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGFkZENvbmZpcm0oYWRkSW5mbz86IElBZGRJbmZvKSB7XG4gICAgICAgIC8vIOaVsOaNrumUmeivr+aXtuWPlua2iFxuICAgICAgICBpZiAoIWFkZEluZm8gfHwgIWFkZEluZm8ucGFyZW50RGlyIHx8ICFhZGRJbmZvLnBhcmVudFV1aWQgfHwgIWFkZEluZm8uZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vIOaWsOWinueahOi+k+WFpeahhua2iOWksVxuICAgICAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEluZm8ubmFtZSA9IGFkZEluZm8uZmlsZU5hbWUgKyBhZGRJbmZvLmZpbGVFeHQ7XG5cbiAgICAgICAgLy8g6Ieq6Lqr5oiW54i257qn5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZShhZGRJbmZvLnBhcmVudFV1aWQpO1xuICAgICAgICAvLyDniLbnuqfkuI3lj6/mlrDlu7rotYTmupBcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDms6jmhI/vvJrmhY7ph43kv67mlLnmraTpu5jorqTlgLxcbiAgICAgICAgICogY29udGVudCDnsbvlnovlj6/ku6XkuLogbnVsbCwgc3RyaW5nLCBidWZmZXJcbiAgICAgICAgICog6buY6K6kIG51bGwg5piv57uZ5paH5Lu25aS55L2/55So55qEXG4gICAgICAgICAqL1xuICAgICAgICBsZXQgY29udGVudDogYW55ID0gbnVsbDtcblxuICAgICAgICBpZiAoYWRkSW5mby50eXBlICE9PSAnZGlyZWN0b3J5Jykge1xuICAgICAgICAgICAgY29udGVudCA9IGFkZEluZm8uY29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7YWRkSW5mby50ZW1wbGF0ZSB8fCBhZGRJbmZvLnR5cGV9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgIGlmIChmaWxlVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBmaWxlVXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3Iodm0udCgncmVhZERlZmF1bHRGaWxlRmFpbCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoWyd0cycsICdqcyddLmluY2x1ZGVzKGFkZEluZm8udHlwZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZCA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuaXNWYWxpZChhZGRJbmZvLmZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsaWQuc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih2bS50KHZhbGlkLnN0YXRlKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB1c2VEYXRhID0gYXdhaXQgRWRpdG9yLlVzZXIuZ2V0RGF0YSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VDb250ZW50czogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBVbmRlcnNjb3JlQ2FzZUNsYXNzTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgQ2FtZWxDYXNlQ2xhc3NOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2FtZWxDYXNlQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBEYXRlVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yOiB1c2VEYXRhLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgICAgICBGaWxlQmFzZW5hbWU6IGFkZEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgRmlsZUJhc2VuYW1lTm9FeHRlbnNpb246IGFkZEluZm8uZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFVSTDogYCR7YWRkSW5mby5wYXJlbnREaXJ9LyR7YWRkSW5mby5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvclZlcnNpb246IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgTWFudWFsVXJsOiBFZGl0b3IuQXBwLnVybHMubWFudWFsLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMocmVwbGFjZUNvbnRlbnRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShuZXcgUmVnRXhwKGA8JSR7a2V5fSU+YCwgJ2cnKSwgcmVwbGFjZUNvbnRlbnRzW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdID0gJ2FkZC1sb2FkaW5nJztcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IGAke2FkZEluZm8ucGFyZW50RGlyfS8ke2FkZEluZm8uZmlsZU5hbWV9JHthZGRJbmZvLmZpbGVFeHR9YDtcbiAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IHZtLmFkZCh1cmwsIGNvbnRlbnQpO1xuXG4gICAgICAgIC8vIOaWsOW7uuWQjOWQjeaWh+S7tuaXtueCueWPlua2iOS8mui/lOWbniBudWxsXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZShwYXJlbnQudXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgfSwgMjAwKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOacgOWQjuWPkei1tyBpcGMg5Yib5bu66LWE5rqQXG4gICAgICogQHBhcmFtIHVybCDnm67moIfkvY3nva5cbiAgICAgKiBAcGFyYW0gY29udGVudCDloavlhYXlhoXlrrlcbiAgICAgKiBAcGFyYW0gb3B0aW9uIOWPr+mAiemFjee9rlxuICAgICAqL1xuICAgIGFzeW5jIGFkZCh1cmw6IHN0cmluZywgY29udGVudDogQnVmZmVyIHwgc3RyaW5nIHwgbnVsbCwgb3B0aW9uPzogSUNyZWF0ZU9wdGlvbikge1xuICAgICAgICBjb25zdCBhc3NldCA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjcmVhdGUtYXNzZXQnLCB1cmwsIGNvbnRlbnQsIHtcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogb3B0aW9uPy5vdmVyd3JpdGUsXG4gICAgICAgIH0pKSBhcyBJQXNzZXRJbmZvO1xuXG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGFzc2V0LnV1aWQpO1xuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyhhc3NldC51dWlkKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG5cbiAgICAgICAgICAgIHJldHVybiBhc3NldC51dWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmlLbliLAgaXBjIOa2iOaBryBhc3NldC1kYjphc3NldC1hZGRcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKiBAcGFyYW0gaW5mbyDmlbDmja5cbiAgICAgKi9cbiAgICBhc3luYyBhZGRlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5wdXNoKHsgdXVpZCwgYW5pbWF0aW9uOiAnc2hyaW5rJyB9KTtcbiAgICAgICAgdHJlZURhdGEuYWRkZWQodXVpZCwgaW5mbyk7XG4gICAgICAgIHZtLnJlZnJlc2hpbmcoJ2FkZGVkJywgaW5mby5uYW1lKTtcblxuICAgICAgICBjb25zdCBmb2xkZXJVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzW2ZvbGRlclV1aWRdID0gdHJ1ZTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOabtOaWsOagkeW9ouiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIGNoYW5nZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgLy8g5Yig6Zmk5bey57yT5a2Y55qE57yp55Wl5Zu+XG4gICAgICAgIHV0aWxzLnRodW1ibmFpbC5kZWxldGUodXVpZCk7XG5cbiAgICAgICAgcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWUucHVzaCh7IHV1aWQsIGFuaW1hdGlvbjogJ2xpZ2h0JyB9KTtcblxuICAgICAgICB0cmVlRGF0YS5jaGFuZ2VkKHV1aWQsIGluZm8pO1xuICAgICAgICB2bS5yZWZyZXNoaW5nKCdjaGFuZ2VkJywgaW5mby5uYW1lLCB1dWlkKTtcblxuICAgICAgICBjb25zdCBmb2xkZXJVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzW2ZvbGRlclV1aWRdID0gdHJ1ZTtcblxuICAgICAgICBpZiAodXVpZCA9PT0gdm0uaW50b1ZpZXdCeVVzZXIpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGludG9WaWV3QnlVc2VyID0gdm0uaW50b1ZpZXdCeVVzZXI7XG4gICAgICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSAnJztcbiAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyhpbnRvVmlld0J5VXNlcik7XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBpcGMg5Y+R6LW35Yig6Zmk6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgZGVsZXRlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICAvKipcbiAgICAgICAgICog5aaC5p6c6K+l6LWE5rqQ5rKh5pyJ6KKr6YCJ5Lit77yM5YiZ5Y+q5piv5Yig6Zmk5q2k5Y2V5LiqXG4gICAgICAgICAqIOWmguaenOivpei1hOa6kOaYr+iiq+mAieS4reS6hu+8jOihqOaYjuimgeWIoOmZpOaJgOaciemAieS4remhuVxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGluU2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKTtcbiAgICAgICAgaWYgKHV1aWQgJiYgIWluU2VsZWN0cykge1xuICAgICAgICAgICAgc2VsZWN0cyA9IFt1dWlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBzZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICAvLyDmnInmlYjnmoTlj6/liKDpmaTnmoToioLngrlcbiAgICAgICAgbGV0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBzZWxlY3RzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCB1dGlscy5jYW5Ob3REZWxldGUoYXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOehruS/nSAxLzLvvJogdmFsaWRVdWlkcyDph4zpnaLku7vkuIDoioLngrnpg73kuI3mmK8gdXVpZCDnmoTlrZDoioLngrlcbiAgICAgICAgICAgIHZhbGlkVXVpZHMgPSB2YWxpZFV1aWRzLmZpbHRlcigodmFsaWRVdWlkKSA9PiAhdXRpbHMuaXNBSW5jbHVkZUIodXVpZCwgdmFsaWRVdWlkKSk7XG5cbiAgICAgICAgICAgIC8vIOehruS/nSAyLzLvvJogdmFsaWRVdWlkcyDph4znmoTku7vkuIDoioLngrnpg73kuI3mmK8gdXVpZCDnmoTniLboioLngrlcbiAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5zb21lKCh2YWxpZFV1aWQpID0+IHV0aWxzLmlzQUluY2x1ZGVCKHZhbGlkVXVpZCwgdXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXZhbGlkVXVpZHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS8mOWMluWIoOmZpOaXtueahOWGheWuueaPkOekulxuICAgICAgICBjb25zdCBzaG93SW5kZXggPSA1O1xuICAgICAgICBsZXQgZmlsZWxpc3QgPSAnJztcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgIGlmIChpID4gc2hvd0luZGV4KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodmFsaWRVdWlkKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGkgPCBzaG93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSBgJHthc3NldC5uYW1lfVxcbmA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICs9ICcuLi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXNlZExpc3QgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdleGVjdXRlLXNjcmlwdCcsIHtcbiAgICAgICAgICAgIG5hbWU6ICdhc3NldHMnLFxuICAgICAgICAgICAgbWV0aG9kOiAncXVlcnlEZXBlbmRzJyxcbiAgICAgICAgICAgIGFyZ3M6IFt2YWxpZFV1aWRzXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHVzZWRMaXN0ICYmIHVzZWRMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZpbGVsaXN0ICs9ICdcXG4nICsgRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUubWF5YmVEZXBlbmRPdGhlcicpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIXVzZWRMaXN0W2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSBgXFxuJHt1c2VkTGlzdFtpXX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZWRMaXN0Lmxlbmd0aCA+IDUpIHtcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSAnXFxuLi4uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLnN1cmVEZWxldGUnLCB7XG4gICAgICAgICAgICBsZW5ndGg6IFN0cmluZyh2YWxpZFV1aWRzTGVuZ3RoKSxcbiAgICAgICAgICAgIGZpbGVsaXN0LFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDliKDpmaTliY3or6Lpl65cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKG1zZywge1xuICAgICAgICAgICAgYnV0dG9uczogWydZZXMnLCAnQ2FuY2VsJ10sXG4gICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgY2FuY2VsOiAxLFxuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ1F1ZXN0aW9uJyksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXN1bHQucmVzcG9uc2UgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhc2tzOiBBcnJheTxQcm9taXNlPEFzc2V0SW5mbyB8IG51bGw+PiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodmFsaWRVdWlkKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdmFsaWRVdWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHZhbGlkVXVpZCk7XG5cbiAgICAgICAgICAgIHRhc2tzLnB1c2goRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZGVsZXRlLWFzc2V0JywgYXNzZXQudXJsKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YXNrcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0cmVlRGF0YS51dWlkVG9TdGF0ZVt2YWxpZFV1aWRzW2ldXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g6YeN572u5omA5pyJ6YCJ5LitXG4gICAgICAgIGluU2VsZWN0cyAmJiBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5LuO5qCR5b2i5Yig6Zmk6LWE5rqQ6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGluZm8g5pWw5o2uXG4gICAgICovXG4gICAgZGVsZXRlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAvLyDliKDpmaTlt7LnvJPlrZjnmoTnvKnnlaXlm75cbiAgICAgICAgdXRpbHMudGh1bWJuYWlsLmRlbGV0ZSh1dWlkKTtcblxuICAgICAgICB0cmVlRGF0YS5kZWxldGVkKHV1aWQsIGluZm8pO1xuICAgICAgICB2bS5yZWZyZXNoaW5nKCdkZWxldGVkJywgaW5mby5uYW1lKTtcblxuICAgICAgICBjb25zdCBmb2xkZXJVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXTtcbiAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzW2ZvbGRlclV1aWRdID0gdHJ1ZTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmUruebmCDkuIrkuIvlt6blj7NcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIHVwRG93bkxlZnRSaWdodChkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBsYXN0ID0gdm0uZ2V0TGFzdFNlbGVjdCgpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGlmICghdm0uaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW2xhc3RdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChjaGlsZHJlblswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGlmICh2bS5pc0V4cGFuZChsYXN0KSkge1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShsYXN0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2xhc3RdO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChwYXJlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc2libGluZ3MgPSB1dGlscy5nZXRTaWJsaW5nKGxhc3QpO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnQ7XG4gICAgICAgICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3VwJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdkb3duJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzJdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY3VycmVudC51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogc2hpZnQgKyDkuIrkuIvnrq3lpLTvvIzlpJrpgIlcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIGFzeW5jIHNoaWZ0VXBEb3duKGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgW2xhc3QsIGxhc3RQcmV2LCBsYXN0TmV4dF0gPSB1dGlscy5nZXRTaWJsaW5nKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tsZW5ndGggLSAxXSk7XG4gICAgICAgIGNvbnN0IGhhc0xhc3RQcmV2ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICBjb25zdCBoYXNMYXN0TmV4dCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndXAnKSB7XG4gICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgbGFzdFByZXYudXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9IGxhc3RQcmV2LnV1aWQ7XG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNMYXN0TmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhc3NldCcsIGxhc3QudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihsYXN0UHJldi51dWlkKSwgMSk7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChsYXN0UHJldi51dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdkb3duJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0TmV4dCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGxhc3ROZXh0LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0TmV4dC51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdFByZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYXNzZXQnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0TmV4dC51dWlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihsYXN0TmV4dC51dWlkKSwgMSk7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChsYXN0TmV4dC51dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ZCI5bm2IHNoaWZ0IOWkmumAiei/h+eoi+S4reWJjeWQjueahOW3sumAieS4remhuVxuICAgICAqIOavlOWmgiBhYiBjZGUg6aG55LitIGEsIGNkZSDlt7LpgInkuK0sIGIg5pyq6YCJ5LitXG4gICAgICog5b2T6YCJ5LitIGIg5pe277yM5ZCI5bm26YCJ5Lit6aG5IGNkZSDvvIzlubblsIbmnKvlsL7pgInkuK3pobnnmoTmjIfpkojmjIflkJEgZVxuICAgICAqL1xuICAgIHNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpIHtcbiAgICAgICAgaWYgKCF2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGtlZXBGaW5kTmV4dCA9IHRydWU7XG4gICAgICAgIGxldCBmaW5kVXVpZCA9IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkO1xuXG4gICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gJyc7IC8vIOmHjee9rlxuXG4gICAgICAgIGxldCBtYXhMb29wTnVtYmVyID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGtlZXBGaW5kTmV4dCkge1xuICAgICAgICAgICAgY29uc3QgYXJyID0gdXRpbHMuZ2V0U2libGluZyhmaW5kVXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXJyIHx8ICFhcnJbMV0gfHwgIWFyclsyXSB8fCAhbWF4TG9vcE51bWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID09PSAnZG93bicgPyBhcnJbMl0udXVpZCA6IGFyclsxXS51dWlkO1xuICAgICAgICAgICAgbWF4TG9vcE51bWJlci0tO1xuXG4gICAgICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGZpbmRVdWlkKSkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YoZmluZFV1aWQpLCAxKTtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChmaW5kVXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGtlZXBGaW5kTmV4dCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rlv6vmjbfplK7nmoQgcmVuYW1lXG4gICAgICovXG4gICAgYXN5bmMga2V5Ym9hcmRSZW5hbWUoKSB7XG4gICAgICAgIGlmICh2bS5yZW5hbWVVcmwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIGlmIChhc3NldCAmJiAhdXRpbHMuY2FuTm90UmVuYW1lKGFzc2V0KSkge1xuICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgICAgICB2bS5yZW5hbWVVcmwgPSBhc3NldC51cmw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCuemHjeWQjeWRvVxuICAgICAqIOi/meaYr+W8guatpeeahO+8jOWPquWBmuWPkemAgVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBmaWxlTmFtZSDmlofku7blkI1cbiAgICAgKi9cbiAgICBhc3luYyByZW5hbWUodXVpZDogc3RyaW5nLCBmaWxlTmFtZSA9ICcnKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgIGlmICghYXNzZXQgfHwgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5riF56m66ZyA6KaBIHJlbmFtZSDnmoToioLngrlcbiAgICAgICAgdm0ucmVuYW1lVXJsID0gJyc7XG5cbiAgICAgICAgaWYgKHV0aWxzLmNhbk5vdFJlbmFtZShhc3NldCkgfHwgZmlsZU5hbWUgPT09ICcnIHx8IGZpbGVOYW1lID09PSBhc3NldC5maWxlTmFtZSkge1xuICAgICAgICAgICAgLy8gbmFtZSDlrZjlnKjkuJTkuI7kuYvliY3nmoTkuI3kuIDmoLfmiY3og73ph43lkI3lkb3vvIzlkKbliJnov5jljp/nirbmgIFcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG5cbiAgICAgICAgLy8g6YeN5ZCN5ZG96LWE5rqQXG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWxlTmFtZSArIGFzc2V0LmZpbGVFeHQ7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGAke3BhcmVudC51cmx9LyR7bmFtZX1gO1xuICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdtb3ZlLWFzc2V0JywgYXNzZXQudXJsLCB0YXJnZXQpO1xuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHV1aWQpO1xuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIHNvcnQoKSB7XG4gICAgICAgIHRyZWVEYXRhLnJlc29ydCgpO1xuICAgIH0sXG4gICAgc2VhcmNoKCkge1xuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICAvLyDmkJzntKLmnInlj5jliqjpg73lhYjmu5rlm57pobbpg6hcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC52aWV3Qm94LnNjcm9sbFRvKDAsIDApO1xuICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOeUqCBzZXRUaW1lb3V0IOS4i+S4gOW4p+mHjeaWsOWumuS9jVxuICAgICAgICBpZiAoIXBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaEluRm9sZGVyICYmICFwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hWYWx1ZSkge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVNlbGVjdGVkLCB0cnVlKTtcbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaLluWKqOS4remrmOS6ruahhumAieW9k+WJjeaJgOWkhOeahOaWh+S7tuWkueiMg+WbtFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGRyYWdPdmVyKHV1aWQ6IHN0cmluZywgZHJhZ092ZXJBc3NldD86IElBc3NldEluZm8gfCBudWxsKSB7XG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uSWQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGlmICghdm0uaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uZHJhZ092ZXIodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXSwgZHJhZ092ZXJBc3NldCB8fCBhc3NldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZHJhZyDmgqzlgZzkuIDmrrXml7bpl7TlkI7oh6rliqjlsZXlvIDmlofku7blpLlcbiAgICAgICAgICAgIGNvbnN0IG5vd1RpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgaWYgKGRyYWdPdmVyVXVpZCAhPT0gdXVpZCkge1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVXVpZCA9IHV1aWQ7XG4gICAgICAgICAgICAgICAgZHJhZ092ZXJUaW1lSWQgPSBub3dUaW1lO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobm93VGltZSAtIGRyYWdPdmVyVGltZUlkID4gODAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnRvZ2dsZSh1dWlkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0ICR2aWV3Qm94ID0gcGFuZWxEYXRhLiQudmlld0JveDtcblxuICAgICAgICAgICAgLy8g5b6u6LCDIHRvcFxuICAgICAgICAgICAgY29uc3QgYWRqdXN0U2Nyb2xsID0gdm0uc2Nyb2xsVG9wICUgcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdFRvcCA9ICR2aWV3Qm94LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAtIHZtLiRlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7IC8vIOa7muWKqOWIsOW6lemDqOS6hlxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IHRvcCA9IGluZGV4ICogcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodCArIGFkanVzdFNjcm9sbCAtIGFkanVzdFRvcCArIDM7XG5cbiAgICAgICAgICAgIGNvbnN0IGV4cGFuZENoaWxkcmVuOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgbGV0IG9wYWNpdHkgPSBhc3NldC5yZWFkb25seSA/IDAgOiAxO1xuXG4gICAgICAgICAgICBpZiAoIXZtLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuZ2V0Q2hpbGRyZW5VdWlkKHV1aWQsIGV4cGFuZENoaWxkcmVuLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGRyYWdPdmVyQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eSA9ICFkcmFnT3ZlckFzc2V0LmlzRGlyZWN0b3J5ID8gMCA6IG9wYWNpdHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5kcm9wQm94U3R5bGUgPSB7XG4gICAgICAgICAgICAgICAgbGVmdDogJHZpZXdCb3guc2Nyb2xsTGVmdCArICdweCcsXG4gICAgICAgICAgICAgICAgdG9wOiB0b3AgKyAncHgnLFxuICAgICAgICAgICAgICAgIGhlaWdodDogKGV4cGFuZENoaWxkcmVuLmxlbmd0aCArIDEpICogcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodCArIDIgKyAncHgnLFxuICAgICAgICAgICAgICAgIG9wYWNpdHksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaLluWKqOS4reaEn+efpeW9k+WJjeaJgOWkhOeahOaWh+S7tuWkue+8jOemu+W8gOWQjuWPlua2iOmrmOS6rlxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGRyYWdMZWF2ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgaWYgKGFzc2V0ICYmICFhc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgYXNzZXQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Fzc2V0LnV1aWRdID0gJyc7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHRyZWUg5a655Zmo5LiK55qEIGRyb3BcbiAgICAgKiBAcGFyYW0gZXZlbnQg6byg5qCH5LqL5Lu2XG4gICAgICovXG4gICAgYXN5bmMgZHJvcChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgICAgIC8vIOaQnOe0ouaooeW8j+S4i++8jOS4jeivhuWIq+aLluWFpSB0cmVlIOWuueWZqFxuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEVkaXRvci5VSS5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICAvLyDlpoLmnpzmsqHmnInniLboioLngrnvvIzkvovlpoLmkJzntKLlkI7msqHnu5PmnpzvvIzliJnkuI3lk43lupRcbiAgICAgICAgaWYgKCF2bS5hc3NldHNbMF0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb3RVdWlkID0gdm0uYXNzZXRzWzBdLnV1aWQ7XG4gICAgICAgIGNvbnN0IGxvY2FsRmlsZXMgPSBBcnJheS5mcm9tKGV2ZW50LmRhdGFUcmFuc2ZlciEuZmlsZXMpO1xuICAgICAgICBpZiAobG9jYWxGaWxlcyAmJiBsb2NhbEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIOS7juWklumDqOaLluaWh+S7tui/m+adpVxuICAgICAgICAgICAgZGF0YS50eXBlID0gJ29zRmlsZSc7XG4gICAgICAgICAgICBkYXRhLmZpbGVzID0gbG9jYWxGaWxlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQoZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAvLyDlpoLmnpzku47moLnoioLngrnnp7vliqjvvIzlj4jokL3lm57moLnoioLngrnvvIzliJnkuI3pnIDopoHnp7vliqhcbiAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LnV1aWQgPT09IHJvb3RVdWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS50byA9IHJvb3RVdWlkOyAvLyDpg73lvZLkuo7moLnoioLngrlcbiAgICAgICAgZGF0YS5jb3B5ID0gZXZlbnQuY3RybEtleTtcbiAgICAgICAgdm0uaXBjRHJvcChkYXRhKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/m+WFpSB0cmVlIOWuueWZqFxuICAgICAqL1xuICAgIGRyYWdFbnRlcigpIHtcbiAgICAgICAgLy8g5pCc57Si5qih5byP5LiL77yM5LiN6K+G5Yir5Li65ouW5YWlIHRyZWUg5a655ZmoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveFN0eWxlID0ge307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbklkKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIHZtLmRyYWdPdmVyKHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6LWE5rqQ5ouW5YqoXG4gICAgICogQHBhcmFtIGRyYWdJbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGlwY0Ryb3AoZHJhZ0luZm86IElEcmFnSW5mbykge1xuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5mb2N1c1dpbmRvdygpOyAvLyDmi5bov5vns7vnu5/mlofku7blkI7nqpflj6PojrflvpfnhKbngrnvvIzku6Xop6blj5EgaXBjIOeahOaUtuWPkVxuXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuY2xlYXJTZWFyY2goKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG9Bc3NldCA9IHV0aWxzLmdldERpcmVjdG9yeShkcmFnSW5mby50byk7XG5cbiAgICAgICAgaWYgKCF0b0Fzc2V0IHx8IHV0aWxzLmNhbk5vdENyZWF0ZSh0b0Fzc2V0KSkge1xuICAgICAgICAgICAgY29uc3QgbXNnID0gRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuY2FuTm90RHJvcCcsIHsgdXVpZDogZHJhZ0luZm8udG8gfSk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS7juWklumDqOaLluaWh+S7tui/m+adpVxuICAgICAgICBpZiAoZHJhZ0luZm8udHlwZSA9PT0gJ29zRmlsZScpIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkcmFnSW5mby5maWxlcykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbGVwYXRocyA9IGRyYWdJbmZvLmZpbGVzLm1hcCgoZmlsZTogYW55KSA9PiBmaWxlLnBhdGgpO1xuXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt0b0Fzc2V0LnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodG9Bc3NldC51dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgICAgICAvLyDmib7lh7rkvJrph43lpI3nmoTmlofku7bpm4blkIhcbiAgICAgICAgICAgIGNvbnN0IHJlcGVhdEZpbGVzOiBJUmVwZWF0RmlsZVtdID0gYXdhaXQgZmlsZXBhdGhzLnJlZHVjZShhc3luYyAocmVzLCBmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0VVJMID0gdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmaWxlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdBc3NldFVSTCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2dlbmVyYXRlLWF2YWlsYWJsZS11cmwnLCBhc3NldFVSTCk7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0VVJMICE9PSBuZXdBc3NldFVSTCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYmFzZW5hbWUoZmlsZSksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKFtdKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHsgb3ZlcndyaXRlOiBmYWxzZSwgcmVuYW1lOiBmYWxzZSB9OyAvLyDlr7zlhaXpgInpoblcbiAgICAgICAgICAgIGxldCBzdG9wID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAocmVwZWF0RmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIOi2heWHujXkuKrmlofku7blsLHnlKguLi7ku6Pmm7/kuoZcbiAgICAgICAgICAgICAgICBsZXQgZGV0YWlsID0gcmVwZWF0RmlsZXNcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgodjogSVJlcGVhdEZpbGUpID0+IHYubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIDUpXG4gICAgICAgICAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwZWF0RmlsZXMubGVuZ3RoID4gNSkge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWwgKz0gJ1xcbiAuLi4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUucmVwZWF0VGlwJyksIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ1F1ZXN0aW9uJyksXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogZGV0YWlsLCAvLyDmj5DnpLrno4Hnm5jot6/lvoRcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUub3ZlcndyaXRlJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5yZW5hbWUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbmNlbCcpLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDIsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5vdmVyd3JpdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5yZW5hbWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFzdG9wICYmIGZpbGVwYXRocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgICAgICAgICAgZmlsZXBhdGhzLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXNzZXQtZGInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpbXBvcnQtYXNzZXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmaWxlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBlYXRGaWxlcy5zb21lKCh2OiBJUmVwZWF0RmlsZSkgPT4gdi5maWxlID09PSBmaWxlKSA/IG9wdGlvbiA6IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5a+85YWl5a6M5oiQ5oiW6ICF5Y+W5raI5LqG5a+85YWl77yM6L+Y5Y6f54i257qn54q25oCBXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt0b0Fzc2V0LnV1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh0b0Fzc2V0LnV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZHJhZ0luZm8udHlwZSA9PT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgICAgICAvLyDmmI7noa7mjqXlj5flpJbpg6jmi5bov5vmnaXnmoToioLngrkgY2MuTm9kZVxuICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGRyYWdJbmZvLmFkZGl0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlICE9PSAnY2MuTm9kZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBub2RlLnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGAke3RvQXNzZXQudXJsfS8ke2R1bXAubmFtZS52YWx1ZSB8fCAnTm9kZSd9LnByZWZhYmA7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1wcmVmYWInLCBub2RlVXVpZCwgdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QodXVpZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzICYmIHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcy5pbmNsdWRlcyhkcmFnSW5mby50eXBlKSkge1xuICAgICAgICAgICAgLy8g6K+l57G75Z6L55qE5LqL5Lu25pyJ5aSW6YOo5rOo5YaM55qE5Yqo5L2c77yM6L2s55Sx5aSW6YOo5rOo5YaM5LqL5Lu25o6l566hXG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBPYmplY3QudmFsdWVzKHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC5jYWxsYmFja3NbZHJhZ0luZm8udHlwZV0pIGFzIEZ1bmN0aW9uW107XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjYWxsYmFja3MpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldChkcmFnSW5mby50byk7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjazogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbzogRHJvcENhbGxiYWNrSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEaXJlY3Rvcnk6IGFzc2V0LmlzRGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhpbmZvLCBkcmFnSW5mby5hZGRpdGlvbmFsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZHJhZ0luZm8uYWRkaXRpb25hbCB8fCAhQXJyYXkuaXNBcnJheShkcmFnSW5mby5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRyYWdJbmZvLmNvcHkpIHtcbiAgICAgICAgICAgICAgICAvLyDmjInkvY/kuoYgY3RybCDplK7vvIzmi5bliqjlpI3liLZcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkcyA9IGRyYWdJbmZvLmFkZGl0aW9uYWwubWFwKChpbmZvOiBJRHJhZ0FkZGl0aW9uYWwpID0+IGluZm8udmFsdWUuc3BsaXQoJ0AnKVswXSk7XG4gICAgICAgICAgICAgICAgdm0uY29weShbLi4ubmV3IFNldCh1dWlkcyldKTtcbiAgICAgICAgICAgICAgICB2bS5wYXN0ZShkcmFnSW5mby50byk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB2bS5tb3ZlKGRyYWdJbmZvLCB0b0Fzc2V0KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi2XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY29weSh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb3BpZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGNvcGllcyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1dWlkIOaYryDlrZfnrKZcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/lpI3liLbnmoToioLngrlcbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSBjb3BpZXMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdENvcHkoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY29waWVkVXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bCG5aSN5Yi255qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAgICBjb25zdCBjb3BpZWRJbmZvOiBJQ29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGNvcGllZFV1aWRzKTtcbiAgICAgICAgLy8g5bCG5aSN5Yi26IqC54K555qEIHV1aWQg5a2Y5pS+5Yiw57uf5LiA55qE5Ymq5YiH5p2/XG4gICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ2Fzc2V0cy1jb3BpZWQtaW5mbycsIGNvcGllZEluZm8pO1xuXG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog57KY6LS0XG4gICAgICogQHBhcmFtIHV1aWQg57KY6LS05Yiw5q2k55uu5qCH6IqC54K5XG4gICAgICogQHBhcmFtIGNvcGllZFV1aWRzIOiiq+WkjeWItueahOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIHBhc3RlKHV1aWQ6IHN0cmluZywgY29waWVkVXVpZHM/OiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgdXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGVzdE5vZGUgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUodXVpZCk7IC8vIOiHqui6q+aIlueItue6p+aWh+S7tuWkuVxuICAgICAgICBpZiAoIWRlc3ROb2RlKSB7XG4gICAgICAgICAgICAvLyDmsqHmnInlj6/nlKjnmoRcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbk5vdFBhc3RlJywgeyB1dWlkIH0pO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjlhYjlpITnkIbliarliIfnmoTmg4XlhrVcbiAgICAgICAgY29uc3QgY3V0SW5mbyA9IEVkaXRvci5DbGlwYm9hcmQucmVhZCgnYXNzZXRzLWN1dC1pbmZvJyk7XG4gICAgICAgIC8vIOi3qOe8lui+keWZqOS4jeWPr+WJquWIh+eymOi0tO+8jOWJquWIh+aXtuWPr+iDvemDvei/h+a7pOWFieS6huaJgOS7peS5n+mcgOimgeWIpOaWrSBhc3NldEluZm8ubGVuZ3RoXG4gICAgICAgIGlmIChjdXRJbmZvICYmIGN1dEluZm8uYXNzZXRJbmZvLmxlbmd0aCAmJiBFZGl0b3IuUHJvamVjdC5wYXRoID09PSBjdXRJbmZvLnByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBjdXRVdWlkcyA9IGN1dEluZm8uYXNzZXRJbmZvLm1hcCgoaXRlbTogSUNvcGllZEFzc2V0SW5mbykgPT4gaXRlbS51dWlkKTtcbiAgICAgICAgICAgIC8vIOWmguaenOWJquWIh+WIsOiHqui6q+aWh+S7tuWkue+8jOe7iOatolxuICAgICAgICAgICAgaWYgKGRlc3ROb2RlICYmIGN1dFV1aWRzLmluY2x1ZGVzKGRlc3ROb2RlLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtb3ZlRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBhZGRpdGlvbmFsOiBjdXRVdWlkcy5tYXAoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdXVpZCB9O1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShtb3ZlRGF0YSwgZGVzdE5vZGUpO1xuXG4gICAgICAgICAgICAvLyDnva7nqbrliarliIfmnb/nmoTlpI3liLblkozliarliIfotYTmupBcbiAgICAgICAgICAgIEVkaXRvci5DbGlwYm9hcmQuY2xlYXIoKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yik5pat5LiN5piv5YW25LuW5pON5L2c5Lyg5YWl55qE5Y+C5pWwXG4gICAgICAgIGlmICghY29waWVkVXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZEluZm8gPSBFZGl0b3IuQ2xpcGJvYXJkLnJlYWQoJ2Fzc2V0cy1jb3BpZWQtaW5mbycpO1xuICAgICAgICAgICAgbGV0IGNvcGllZEZpbGVzID0gW107XG4gICAgICAgICAgICBpZiAoY29waWVkSW5mbykge1xuICAgICAgICAgICAgICAgIC8vIOS7juWJquWIh+adv+S4reiOt+WPliBjb3BpZWRVdWlkcyDlkozlpITnkIbot6jnvJbovpHlmajml7bnmoTmlofku7bot6/lvoRcbiAgICAgICAgICAgICAgICBjb3BpZWRVdWlkcyA9IGNvcGllZEluZm8uYXNzZXRJbmZvLm1hcCgoaXRlbTogSUNvcGllZEFzc2V0SW5mbykgPT4gaXRlbS51dWlkKTtcbiAgICAgICAgICAgICAgICBjb3BpZWRGaWxlcyA9IGNvcGllZEluZm8uYXNzZXRJbmZvLm1hcCgoaXRlbTogSUNvcGllZEFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjUGF0aDogaXRlbS5maWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyUGF0aDogZGVzdE5vZGUudXJsICsgJy8nICsgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRPRE86XG4gICAgICAgICAgICAgKiDot6jmlofku7bns7vnu5/vvIzmmoLkuI3mlK/mjIHvvIzlj6/ku6XogIPomZHlpoLkvZXlpI3nlKggZHJvcCDliqjkvZxcbiAgICAgICAgICAgICAqIOebruWJjeWPquaUr+aMgei3qOe8lui+keWZqO+8jOS9v+eUqCBwcm9qZWN0LnBhdGgg5Yik5pat77yMcGFzdGUg5ZKMIGRyb3Ag54us56uL5a6e546wXG4gICAgICAgICAgICAgKiDliarliIfmnb/kuK3lrZjlgqjnmoTmmK/lr7nosaHnu5PmnoTvvIzlkI7nu63lj6/ku6XlgqjlrZggSlNPTiDlrZfnrKbkuLJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLy8g6Leo57yW6L6R5Zmo57KY6LS0XG4gICAgICAgICAgICBpZiAoY29waWVkRmlsZXMubGVuZ3RoICYmIEVkaXRvci5Qcm9qZWN0LnBhdGggIT09IGNvcGllZEluZm8ucHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgICAgICAvLyDmmL7npLogbG9hZGluZyDmlYjmnpxcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZShkZXN0Tm9kZS51dWlkKTtcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUoZGVzdE5vZGUudXVpZCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY29waWVkRmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnaW1wb3J0LWFzc2V0JywgZmlsZS5zcmNQYXRoLCBmaWxlLnRhclBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICcnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aaC5p6c5aSN5Yi25Yiw6Ieq6Lqr5paH5Lu25aS577yM6ZyA6KaB5b6A5LiK56e75LiA5bGC5paH5Lu25aS5XG4gICAgICAgIGlmIChkZXN0Tm9kZSAmJiBjb3BpZWRVdWlkcz8uaW5jbHVkZXMoZGVzdE5vZGUudXVpZCkpIHtcbiAgICAgICAgICAgIGRlc3ROb2RlID0gdXRpbHMuY2xvc2VzdFdoaWNoQ2FuQ3JlYXRlKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbZGVzdE5vZGUudXVpZF0pO1xuICAgICAgICAgICAgaWYgKCFkZXN0Tm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIOayoeacieWPr+eUqOeahFxuICAgICAgICAgICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbk5vdFBhc3RlJywgeyB1dWlkIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihtc2cpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpbmFsbHlDYW5QYXN0ZTogc3RyaW5nW10gPSBbXTsgLy8g5pyA5ZCO5Y+v5aSN5Yi255qE6aG5XG4gICAgICAgIGNvcGllZFV1aWRzPy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOiKgueCueWPr+WkjeWItlxuICAgICAgICAgICAgY29uc3QgY2FuQ29weSA9ICF1dGlscy5jYW5Ob3RDb3B5KGFzc2V0KTtcbiAgICAgICAgICAgIGlmICghY2FuQ29weSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhcm4gPSBgJHtFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5jb3B5RmFpbCcpfTogJHthc3NldC5uYW1lfWA7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKHdhcm4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDkuI3mmK/mraTnm67moIfoioLngrnnmoTniLboioLngrnvvIjkuI3lnKjlroPnmoTkuIrnuqfmlofku7blpLnph4zvvIlcbiAgICAgICAgICAgIGNvbnN0IGluc2lkZSA9IHV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIGRlc3ROb2RlLnV1aWQpO1xuICAgICAgICAgICAgaWYgKGluc2lkZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhcm4gPSBgJHtFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5lcnJvclBhc3RlUGFyZW50VG9DaGlsZCcpfTogJHthc3NldC5uYW1lfWA7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKHdhcm4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2FuQ29weSAmJiAhaW5zaWRlKSB7XG4gICAgICAgICAgICAgICAgZmluYWxseUNhblBhc3RlLnB1c2godXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZmluYWxseUNhblBhc3RlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgbGV0IGFzc2V0O1xuICAgICAgICBsZXQgbmV3QXNzZXQ6IElBc3NldEluZm8gfCBudWxsO1xuICAgICAgICBjb25zdCBuZXdTZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAvLyDmmL7npLogbG9hZGluZyDmlYjmnpxcbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbZGVzdE5vZGUudXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKGRlc3ROb2RlLnV1aWQpO1xuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICB2bS50b2dnbGUoZGVzdE5vZGUudXVpZCwgdHJ1ZSk7XG5cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgYXNzZXQgPSB1dGlscy5nZXRBc3NldChmaW5hbGx5Q2FuUGFzdGVbaW5kZXhdKTtcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICBuZXdBc3NldCA9IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBiYXNlbmFtZShhc3NldC51cmwpO1xuICAgICAgICAgICAgICAgIGxldCB0YXJnZXQgPSBgJHtkZXN0Tm9kZS51cmx9LyR7bmFtZX1gO1xuICAgICAgICAgICAgICAgIHRhcmdldCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2dlbmVyYXRlLWF2YWlsYWJsZS11cmwnLCB0YXJnZXQpO1xuICAgICAgICAgICAgICAgIG5ld0Fzc2V0ID0gKGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NvcHktYXNzZXQnLCBhc3NldC51cmwsIHRhcmdldCkpIGFzIElBc3NldEluZm8gfCBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKG5ld0Fzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gbmV3QXNzZXQudXVpZDtcbiAgICAgICAgICAgICAgICAgICAgbmV3U2VsZWN0cy5wdXNoKG5ld0Fzc2V0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSB3aGlsZSAobmV3QXNzZXQpO1xuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJyc7XG5cbiAgICAgICAgLy8g6YCJ5Lit5paw55qE6aG555uuXG4gICAgICAgIHZtLmlwY1NlbGVjdChuZXdTZWxlY3RzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWJquWIh+aYr+mihOWumueahOihjOS4uu+8jOWPquacieWGjeaJp+ihjOeymOi0tOaTjeS9nOaJjeS8mueUn+aViFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGN1dCh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdXRzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBjdXRzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHV1aWQg5pivIOWtl+esplxuICAgICAgICAgICAgLy8g5p2l6Ieq5Y+z5Ye76I+c5Y2V55qE5Y2V5Liq6YCJ5Lit77yM5Y+z5Ye76IqC54K55LiN5Zyo5bey6YCJ6aG555uu6YeMXG4gICAgICAgICAgICBpZiAodXVpZCAmJiAhcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgY3V0cyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3V0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5LiN5Y+v5Ymq5YiH55qE6IqC54K5XG4gICAgICAgIGNvbnN0IGN1dFV1aWRzID0gY3V0cy5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldCAmJiAhdXRpbHMuY2FuTm90Q3V0KGFzc2V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGN1dFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWwhuWJquWIh+eahCB1dWlkcyDlpITnkIbmiJDliarliIfmnb/nmoTlr7nosaHnsbvlnotcbiAgICAgICAgY29uc3QgY3V0SW5mbzogSUNvcGllZEluZm8gPSB2bS51dWlkc1RvQ29waWVkSW5mbyhjdXRVdWlkcyk7XG4gICAgICAgIC8vIOWwhuWJquWIh+iKgueCueeahCB1dWlkIOWtmOaUvuWIsOe7n+S4gOeahOWJquWIh+adv1xuICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLndyaXRlKCdhc3NldHMtY3V0LWluZm8nLCBjdXRJbmZvKTtcblxuICAgICAgICB2bS5yZW5kZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWwhuWkjeWIti/liarliIfnmoQgdXVpZHMg5aSE55CG5oiQ5Ymq5YiH5p2/55qE5a+56LGh57G75Z6LXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gdXVpZHNcbiAgICAgKiBAcmV0dXJuIHsqfSAge0lDb3BpZWRJbmZvfVxuICAgICAqL1xuICAgIHV1aWRzVG9Db3BpZWRJbmZvKHV1aWRzOiBzdHJpbmdbXSk6IElDb3BpZWRJbmZvIHtcbiAgICAgICAgY29uc3QgY29waWVkSW5mbyA9IDxJQ29waWVkSW5mbz57fTtcbiAgICAgICAgY29waWVkSW5mby5wcm9qZWN0UGF0aCA9IEVkaXRvci5Qcm9qZWN0LnBhdGg7XG4gICAgICAgIGNvcGllZEluZm8uYXNzZXRJbmZvID0gW107XG4gICAgICAgIHV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQ6IElBc3NldEluZm8gfCBudWxsID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICBjb25zdCBjb3BpZWRBc3NldEluZm86IElDb3BpZWRBc3NldEluZm8gPSB7XG4gICAgICAgICAgICAgICAgdXVpZDogYXNzZXQgPyBhc3NldC51dWlkIDogJycsXG4gICAgICAgICAgICAgICAgZmlsZTogYXNzZXQgPyBhc3NldC5maWxlIDogJycsXG4gICAgICAgICAgICAgICAgbmFtZTogYXNzZXQgPyBhc3NldC5uYW1lIDogJycsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29waWVkSW5mby5hc3NldEluZm8ucHVzaChjb3BpZWRBc3NldEluZm8pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNvcGllZEluZm87XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlpI3liLbotYTmupDvvIzlubPnuqdcbiAgICAgKiBAcGFyYW0gdXVpZHMg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgZHVwbGljYXRlKHV1aWRzOiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZHMpIHtcbiAgICAgICAgICAgIHV1aWRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCkuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSB1dWlkcy5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldCAmJiAhdXRpbHMuY2FuTm90RHVwbGljYXRlKGFzc2V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNvcGllZFV1aWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHV1aWQgb2YgY29waWVkVXVpZHMpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB2bS5wYXN0ZSh0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdLCBbdXVpZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnp7vliqgg6LWE5rqQXG4gICAgICogQHBhcmFtIGRyYWdJbmZvIOS/oeaBr1xuICAgICAqIEBwYXJhbSB0b0Fzc2V0IOenu+WKqOebrueahOWcsOi1hOa6kFxuICAgICAqL1xuICAgIGFzeW5jIG1vdmUoZHJhZ0luZm86IElEcmFnSW5mbywgdG9Bc3NldDogSUFzc2V0SW5mbykge1xuICAgICAgICBpZiAoIWRyYWdJbmZvIHx8ICF0b0Fzc2V0IHx8ICFBcnJheS5pc0FycmF5KGRyYWdJbmZvLmFkZGl0aW9uYWwpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsZXlvIDnm67moIfmlofku7blpLlcbiAgICAgICAgdm0udG9nZ2xlKHRvQXNzZXQudXVpZCwgdHJ1ZSk7XG5cbiAgICAgICAgY29uc3QgdXVpZHMgPSBkcmFnSW5mby5hZGRpdGlvbmFsLm1hcCgoaW5mbzogSURyYWdBZGRpdGlvbmFsKSA9PiBpbmZvLnZhbHVlLnNwbGl0KCdAJylbMF0pO1xuXG4gICAgICAgIC8vIOWkmui1hOa6kOenu+WKqO+8jOagueaNrueOsOacieaOkuW6j+eahOmhuuW6j+aJp+ihjFxuICAgICAgICB1dWlkcy5zb3J0KChhOiBzdHJpbmcsIGI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYUluZGV4ID0gdHJlZURhdGEudXVpZFRvSW5kZXhbYV07XG4gICAgICAgICAgICBjb25zdCBiSW5kZXggPSB0cmVlRGF0YS51dWlkVG9JbmRleFtiXTtcbiAgICAgICAgICAgIHJldHVybiBhSW5kZXggLSBiSW5kZXg7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IHV1aWRzTGVuZ3RoID0gdXVpZHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSB1dWlkc1tpXTtcblxuICAgICAgICAgICAgaWYgKHZhbGlkVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZnJvbUFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICBjb25zdCBmcm9tUGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Bc3NldCB8fCAhZnJvbVBhcmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodG9Bc3NldC51dWlkID09PSBmcm9tQXNzZXQudXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodXRpbHMuY2FuTm90Q3V0KGZyb21Bc3NldCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdG9Bc3NldCDmmK8gZnJvbUFzc2V0IOeahOWtkOmbhu+8jOaJgOS7peeItuS4jeiDveenu+WIsOWtkOmHjOmdolxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzQUluY2x1ZGVCKGZyb21Bc3NldC51dWlkLCBkcmFnSW5mby50bykpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6LWE5rqQ56e75Yqo5LuN5Zyo5Y6f5p2l55qE55uu5b2V5YaF77yM5LiN6ZyA6KaB56e75YqoXG4gICAgICAgICAgICBpZiAodG9Bc3NldC51dWlkID09PSBmcm9tUGFyZW50LnV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFza3M6IEFycmF5PFByb21pc2U8QXNzZXRJbmZvIHwgbnVsbD4+ID0gW107XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICBjb25zdCBmcm9tQXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghZnJvbUFzc2V0IHx8ICFmcm9tUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOenu+WKqOi1hOa6kFxuICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSBmcm9tQXNzZXQudXVpZDtcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmcm9tQXNzZXQudXJsKTtcblxuICAgICAgICAgICAgLy8g5a6e5L6L5YyW6Jma5ouf6LWE5rqQXG4gICAgICAgICAgICBpZiAoZnJvbUFzc2V0Lmluc3RhbnRpYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2luaXQtYXNzZXQnLCBmcm9tQXNzZXQudXJsLCB0YXJnZXQpKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFza3MucHVzaChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdtb3ZlLWFzc2V0JywgZnJvbUFzc2V0LnVybCwgdGFyZ2V0KSk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YXNrcykuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbGlkVXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSB2YWxpZFV1aWRzW2ldO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g6YCJ5Lit56e75Yqo6aG5XG4gICAgICAgIHZtLmlwY1NlbGVjdCh2YWxpZFV1aWRzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmHjeaWsOWvvOWFpei1hOa6kFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGFzeW5jIHJlaW1wb3J0KHV1aWQ6IHN0cmluZykge1xuICAgICAgICBsZXQgc2VsZWN0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK1cbiAgICAgICAgaWYgKCFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBbdXVpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxlY3RzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGxldCB2YWxpZFV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gc2VsZWN0c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQgfHwgdXRpbHMuY2FuTm90UmVpbXBvcnQoYXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICAvLyDnoa7kv50gMS8y77yaIHZhbGlkVXVpZHMg6YeM6Z2i5Lu75LiA6LWE5rqQ6YO95LiN5pivIHV1aWQg55qE6Jma5ouf5a2Q6LWE5rqQXG4gICAgICAgICAgICAgICAgdmFsaWRVdWlkcyA9IHZhbGlkVXVpZHMuZmlsdGVyKCh2YWxpZFV1aWQpID0+ICF1dGlscy5pc0FJbmNsdWRlQih1dWlkLCB2YWxpZFV1aWQpKTtcblxuICAgICAgICAgICAgICAgIC8vIOehruS/nSAyLzLvvJogdmFsaWRVdWlkcyDph4znmoTku7vkuIDotYTmupDpg73kuI3mmK8gdXVpZCDnmoTniLbotYTmupBcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuc29tZSgodmFsaWRVdWlkKSA9PiB1dGlscy5pc0FJbmNsdWRlQih2YWxpZFV1aWQsIHV1aWQpKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZFV1aWRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbGlkVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3V1aWRdO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuaW5jbHVkZXMoY2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbGlkVXVpZHNMZW5ndGggPSB2YWxpZFV1aWRzLmxlbmd0aDtcbiAgICAgICAgaWYgKCF2YWxpZFV1aWRzTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlop7liqDph43lr7zkuK3nmoQgbG9hZGluZyDnlYzpnaLmlYjmnpxcbiAgICAgICAgZm9yIChjb25zdCB2YWxpZFV1aWQgb2YgdmFsaWRVdWlkcykge1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdmFsaWRVdWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHZhbGlkVXVpZCk7XG4gICAgICAgIH1cbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCB2YWxpZFV1aWQgb2YgdmFsaWRVdWlkcykge1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncmVpbXBvcnQtYXNzZXQnLCB2YWxpZFV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOagkeW9ouaVsOaNruW3suaUueWPmFxuICAgICAqIOWmgui1hOa6kOWinuWIoOaUue+8jOaYr+i+g+Wkp+eahOWPmOWKqO+8jOmcgOimgemHjeaWsOiuoeeul+WQhOS4qumFjeWll+aVsOaNrlxuICAgICAqIOWinuWKoCBzZXRUaW1lT3V0IOaYr+S4uuS6huS8mOWMluadpeiHquW8guatpeeahOWkmuasoeinpuWPkVxuICAgICAqL1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgLy8g5a655Zmo55qE5pW05L2T6auY5bqmXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnRyZWVIZWlnaHQgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoICogcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodDtcblxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5hbGxFeHBhbmQgPSB2bS5pc0FsbEV4cGFuZCgpO1xuXG4gICAgICAgIC8vIOmHjeaWsOa4suafk+WHuuagkeW9olxuICAgICAgICB2bS5maWx0ZXJBc3NldHMoKTtcblxuICAgICAgICB3aGlsZSAocGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCByZWFkeVR3aW5rbGUgPSBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQocmVhZHlUd2lua2xlLnV1aWQsIHJlYWR5VHdpbmtsZS5hbmltYXRpb24pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDph43mlrDmuLLmn5PmoJHlvaJcbiAgICAgKiB2bS5hc3NldHMg5Li65b2T5YmN5pi+56S655qE6YKj5Yeg5Liq6IqC54K55pWw5o2uXG4gICAgICovXG4gICAgZmlsdGVyQXNzZXRzKCkge1xuICAgICAgICB2bS5hc3NldHMgPSBbXTsgLy8g5YWI5riF56m677yM6L+Z56eN6LWL5YC85py65Yi25omN6IO95Yi35pawIHZ1Ze+8jOiAjCAubGVuZ3RoID0gMCDkuI3ooYxcblxuICAgICAgICBjb25zdCB0b3AgPSB2bS5zY3JvbGxUb3AgJSBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0O1xuICAgICAgICBjb25zdCBtaW4gPSB2bS5zY3JvbGxUb3AgLSB0b3A7IC8vIOeul+WHuuWPr+inhuWMuuWfn+eahCB0b3Ag5pyA5bCP5YC8XG4gICAgICAgIGNvbnN0IG1heCA9IG1pbiArIHBhbmVsRGF0YS4kLnBhbmVsLnZpZXdIZWlnaHQ7IC8vIOacgOWkp+WAvFxuXG4gICAgICAgIHZtLiRlbC5zdHlsZS50b3AgPSBgLSR7dG9wfXB4YDtcblxuICAgICAgICBjb25zdCBzdGFydCA9IE1hdGgucm91bmQobWluIC8gcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGVuZCA9IE1hdGguY2VpbChtYXggLyBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0KSArIDE7XG5cbiAgICAgICAgdm0uYXNzZXRzID0gdHJlZURhdGEub3V0cHV0RGlzcGxheShzdGFydCwgZW5kKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPlumAieS4reWIl+ihqOaVsOe7hOS4reesrOS4gOS4quiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnuWcqOaYvuekuumYn+WIl+S4reeahOesrOS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGdldEZpcnN0U2VsZWN0KCkge1xuICAgICAgICBjb25zdCBmaXJzdCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXTtcblxuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPlumAieS4reWIl+ihqOaVsOe7hOS4reacgOWQjuS4gOS4quiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnuWcqOaYvuekuumYn+WIl+S4reeahOacgOWQjuS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGdldExhc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC5zZWxlY3RzW3NlbGVjdHNMZW5ndGggLSAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlMZW5ndGggPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIHRyZWVEYXRhLmRpc3BsYXlBcnJheVtkaXNwbGF5TGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPluinhuinieS4iuagkeW9ouS4iuS4i+WIl+ihqOS4re+8jOesrOS4gOS4qumAieS4reiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnumhtuWxguagueiKgueCuSAnZGI6Ly8nXG4gICAgICovXG4gICAgZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCkge1xuICAgICAgICBsZXQgdXVpZCA9IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2w7XG5cbiAgICAgICAgY29uc3QgbWluSW5kZXggPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoO1xuXG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3QgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZihzZWxlY3QpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IG1pbkluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQgPSBzZWxlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDov5Tlm57moJHlvaLnrKzkuIDkuKroioLngrlcbiAgICAgKiDnrKzkuIDkuKroioLngrnvvIzkuI3kuIDlrprmmK/moLnoioLngrnvvIzkvovlpoLlnKjmkJzntKLnmoTmg4XlhrXkuItcbiAgICAgKi9cbiAgICBnZXRGaXJzdENoaWxkKCkge1xuICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5WzBdO1xuICAgIH0sXG4gICAgaXNFeHBhbmQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0cmVlRGF0YS51dWlkVG9FeHBhbmRbdXVpZF07XG4gICAgfSxcbiAgICBpc1NlbGVjdCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpICE9PSAtMTtcbiAgICB9LFxuICAgIGdldFR3aW5rbGUodXVpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS5hY3QudHdpbmtsZXNbdXVpZF0gPz8gJyc7XG4gICAgfSxcbiAgICBpc0FsbEV4cGFuZCgpIHtcbiAgICAgICAgbGV0IGFsbENvbGxhcHNlID0gdHJ1ZTtcblxuICAgICAgICBsZXQgcGFyZW50cyA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3BhbmVsRGF0YS5jb25maWcucHJvdG9jb2xdO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICBpZiAoc2VsZWN0c0xlbmd0aCkge1xuICAgICAgICAgICAgcGFyZW50cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcGFyZW50cyB8fCAhcGFyZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGxDb2xsYXBzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudHNMZW5ndGggPSBwYXJlbnRzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBwYXJlbnRVdWlkID0gcGFyZW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRyZWVEYXRhLnV1aWRUb0Fzc2V0W3BhcmVudFV1aWRdO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAmJiAnaXNQYXJlbnQnIGluIHBhcmVudCAmJiAhcGFyZW50LmlzUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0cmVlRGF0YS51dWlkVG9FeHBhbmRbcGFyZW50VXVpZF0pIHtcbiAgICAgICAgICAgICAgICBhbGxDb2xsYXBzZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICFhbGxDb2xsYXBzZTtcbiAgICB9LFxuICAgIGlzU2VhcmNoaW5nTW9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpO1xuICAgIH0sXG4gICAgYXN5bmMgZGlhbG9nRXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuZXJyb3IoRWRpdG9yLkkxOG4udChgYXNzZXRzLm9wZXJhdGUuJHttZXNzYWdlfWApLCB7XG4gICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZGlhbG9nRXJyb3InKSxcbiAgICAgICAgfSk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCB3YXRjaCA9IHtcbiAgICAvKipcbiAgICAgKiBzY3JvbGxUb3Ag5Y+Y5YyW77yM5Yi35paw5qCR5b2iXG4gICAgICovXG4gICAgc2Nyb2xsVG9wKCkge1xuICAgICAgICB2bS5maWx0ZXJBc3NldHMoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOW9k+WJjemAieS4remhueWPmOWKqFxuICAgICAqL1xuICAgIGFjdGl2ZUFzc2V0KCkge1xuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5hY3RpdmVBc3NldCA9IHZtLmFjdGl2ZUFzc2V0O1xuICAgIH0sXG59O1xuXG4vKipcbiAqIHZ1ZSBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXRhKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGFzc2V0czogW10sIC8vIOW9k+WJjeagkeW9ouWcqOWPr+inhuWMuuWfn+eahOi1hOa6kOiKgueCuVxuICAgICAgICByZW5hbWVVcmw6ICcnLCAvLyDpnIDopoEgcmVuYW1lIOeahOiKgueCueeahCB1cmzvvIzlj6rmnInkuIDkuKpcbiAgICAgICAgYWRkSW5mbzoge1xuICAgICAgICAgICAgLy8g5re75Yqg5LiA5Liq5paw6LWE5rqQ5YmN55qE5pWw5o2u77yM6ZyA6KaB5LqL5YmN6YeN5ZG95ZCNXG4gICAgICAgICAgICB0eXBlOiAnJyxcbiAgICAgICAgICAgIGltcG9ydGVyOiAnJyxcbiAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgZmlsZUV4dDogJycsXG4gICAgICAgICAgICBmaWxlTmFtZTogJycsXG4gICAgICAgICAgICBwYXJlbnREaXI6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBpbnRvVmlld0J5U2VsZWN0ZWQ6ICcnLCAvLyDmlLbliLDpgInkuK0gaXBjIOmcgOimgeWumuS9jeaYvuekuueahOi1hOa6kFxuICAgICAgICBpbnRvVmlld0J5VXNlcjogJycsIC8vIOeUqOaIt+aTjeS9nOeahOaWsOWinuenu+WKqOi1hOa6kO+8jOe7meS6iOWumuS9jVxuICAgICAgICBzY3JvbGxUb3A6IDAsIC8vIOW9k+WJjeagkeW9oueahOa7muWKqOaVsOaNrlxuICAgICAgICBkcm9wcGFibGVUeXBlczogW10sXG4gICAgICAgIGNoZWNrU2hpZnRVcERvd25NZXJnZTogeyB1dWlkOiAnJywgZGlyZWN0aW9uOiAnJyB9LCAvLyBzaGlmdCArIOeureWktOWkmumAie+8jOWinuW8uuS6pOS6kuaViOaenFxuICAgIH07XG59XG5cbi8qKlxuICogdm0gPSB0aGlzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtb3VudGVkKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB2bSA9IHRoaXM7XG5cbiAgICAvLyDlr7nkuo7lrZDpm4bnmoTlj5jliqjvvIzmnIDlkI7kuIDkuKogaXBjIOa2iOaBr+WPkeeahOaYr+eItue6p+aWh+S7tuWkueeahOWPmOWKqO+8jOi/meS4jemcgOimgeaYvuekuuWHuuadpe+8jOaJgOS7peWBmuS6huiusOW9leWHhuWkh+W/veeVpVxuICAgIHZtLnJlZnJlc2hpbmcuaWdub3JlcyA9IHt9O1xufVxuIl19