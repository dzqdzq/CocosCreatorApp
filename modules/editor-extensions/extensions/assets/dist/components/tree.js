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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZWIsK0JBQXNDO0FBQ3RDLDJCQUE4QztBQUM5Qyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUU1Qix1QkFBdUI7QUFDdkIsSUFBSSxZQUFpQixDQUFDO0FBQ3RCLElBQUksY0FBbUIsQ0FBQztBQUN4QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxnQkFBcUIsQ0FBQztBQUViLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUVkLFFBQUEsS0FBSyxHQUFHO0lBQ2pCLGtCQUFrQixFQUFFO1FBQ2hCLElBQUksRUFBRSxLQUFLO1FBQ1gsT0FBTztZQUNILE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVXLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXBGLFFBQUEsVUFBVSxHQUFHO0lBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDO0NBQ3RDLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixFQUFFLENBQUMsY0FBYyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFVB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cUQ7SUFDckQsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQy9CLENBQUM7QUFORCwwQkFNQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtcbiAgICBJQ3JlYXRlT3B0aW9uLFxuICAgIElBZGRJbmZvLFxuICAgIElBc3NldEluZm8sXG4gICAgRHJvcENhbGxiYWNrSW5mbyxcbiAgICBJRHJhZ0luZm8sXG4gICAgSURyYWdBZGRpdGlvbmFsLFxuICAgIEFzc2V0SW5mbyxcbiAgICBJQ29waWVkSW5mbyxcbiAgICBJQ29waWVkQXNzZXRJbmZvLFxuICAgIElSZXBlYXRGaWxlLFxufSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9wYW5lbC1kYXRhJztcbmltcG9ydCAqIGFzIHRyZWVEYXRhIGZyb20gJy4vdHJlZS1kYXRhJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5sZXQgdm06IGFueSA9IG51bGw7XG5sZXQgcmVxdWVzdEFuaW1hdGlvbklkOiBhbnk7XG5cbi8vIOeUqOS6juivhuWIqyBkcmFnIOaCrOWBnO+8jOiHquWKqOWxleW8gOaWh+S7tuWkuVxubGV0IGRyYWdPdmVyVXVpZDogYW55O1xubGV0IGRyYWdPdmVyVGltZUlkOiBhbnk7XG5sZXQgc2VsZWN0ZWRUaW1lSWQ6IGFueTtcbmxldCByZWZyZXNoaW5nVGltZUlkOiBhbnk7XG5cbmV4cG9ydCBjb25zdCBuYW1lID0gJ3RyZWUnO1xuXG5leHBvcnQgY29uc3QgcHJvcHMgPSB7XG4gICAgZHJvcHBhYmxlVHlwZXNQcm9wOiB7XG4gICAgICAgIHR5cGU6IEFycmF5LFxuICAgICAgICBkZWZhdWx0KCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvdGVtcGxhdGUvdHJlZS5odG1sJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge1xuICAgICd0cmVlLW5vZGUnOiByZXF1aXJlKCcuL3RyZWUtbm9kZScpLFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog57+76K+RXG4gICAgICogQHBhcmFtIGtleSDkuI3luKbpnaLmnb/lkI3np7DnmoTmoIforrDlrZfnrKZcbiAgICAgKi9cbiAgICB0KGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS4kLnBhbmVsLnQoa2V5KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWklumDqOaVsOaNruabtOaWsOWQju+8jOabtOaWsOWGhemDqOaVsOaNrlxuICAgICAqL1xuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdm0uZHJvcHBhYmxlVHlwZXMgPSBbLi4udm0uZHJvcHBhYmxlVHlwZXNQcm9wLCAuLi5wYW5lbERhdGEuY29uZmlnLmFzc2V0VHlwZXMoKV07XG5cbiAgICAgICAgLy8g5riF56m65paw5bu65oiW6YeN5ZG95ZCN54q25oCBXG4gICAgICAgIHZtLmFkZEluZm8ucGFyZW50RGlyID0gJyc7XG4gICAgICAgIHZtLnJlbmFtZVVybCA9ICcnO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5riF56m65qCR5b2iXG4gICAgICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRyZWVEYXRhLmNsZWFyKCk7XG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yi35paw5qCR5b2iXG4gICAgICogQHBhcmFtIHR5cGUg5piv5ZCm6YeN572u5pWw5o2uXG4gICAgICogQHBhcmFtIG5hbWUgaXBjIOWKqOS9nOeahOWQjeensFxuICAgICAqL1xuICAgIHJlZnJlc2hpbmcodHlwZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV1aWQgJiYgdm0ucmVmcmVzaGluZy5pZ25vcmVzW3V1aWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgdm0ucmVmcmVzaGluZy5pZ25vcmVzW3V1aWRdO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwucmVmcmVzaGluZyA9IHsgdHlwZSwgbmFtZSB9O1xuXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQocmVmcmVzaGluZ1RpbWVJZCk7XG4gICAgICAgIHJlZnJlc2hpbmdUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAvLyDmj5DnpLrmtojlpLFcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnJlZnJlc2hpbmcudHlwZSA9ICcnO1xuICAgICAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzID0ge307XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K555qE5oqY5Y+gL+WxleW8gOWIh+aNolxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBleHBhbmQgIOaYr+WQpuWxleW8gFxuICAgICAqIEBwYXJhbSBsb29wICDmjInkvY8gQWx0IOmUruWPr+i/m+WFpeWtkOiKgueCueW+queOr1xuICAgICAqL1xuICAgIHRvZ2dsZSh1dWlkOiBzdHJpbmcsIGV4cGFuZD86IGJvb2xlYW4sIGxvb3A/OiBib29sZWFuKSB7XG4gICAgICAgIGlmIChsb29wKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cmVlRGF0YS50b2dnbGVFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yik5pat5LiL5Liq5Yqo5L2c5piv5pS26LW36L+Y5piv5bGV5byAIO+8iOW9k+WtmOWcqOS4jeWQjOeKtuaAgeeahOaWh+S7tuWkueaXtu+8jOinhuS4uuaUtui1t+OAguW9k+eKtuaAgeebuOWQjO+8jOWPluWPjeWNs+WPr+OAgu+8iVxuICAgICAqIEBwYXJhbSBwYXJlbnRzXG4gICAgICogQHJldHVybnMgYm9vbGVhblxuICAgICAqL1xuICAgIG5leHRUb2dnbGVFeHBhbmQocGFyZW50czogYW55W10pOiBib29sZWFuIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlOyAvLyDpu5jorqTkuLrmlLbotbdcbiAgICAgICAgLy8g5qC55o2u6KeE5YiZ77yM6YKj5LmI5Y+q5pyJ5b2T5YWo6YOo6YO95Li65pS26LW355qE5pe25YCZ77yM6ZyA6KaB5bGV5byA55qE5pON5L2cXG4gICAgICAgIGNvbnN0IGlzQWxsQ2xvc2UgPSBwYXJlbnRzLmV2ZXJ5KChwYXJlbnRJRCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50SURdO1xuICAgICAgICAgICAgaWYgKCEoJ2lzUGFyZW50JyBpbiBwYXJlbnQgJiYgcGFyZW50LmlzUGFyZW50KSkge1xuICAgICAgICAgICAgICAgIHBhcmVudElEID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRJRF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gIXRyZWVEYXRhLnV1aWRUb0V4cGFuZFtwYXJlbnRJRF07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNBbGxDbG9zZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YOo6IqC54K55oqY5Y+g5oiW5bGV5byAXG4gICAgICovXG4gICAgYWxsVG9nZ2xlKCkge1xuICAgICAgICBsZXQgcGFyZW50cyA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3BhbmVsRGF0YS5jb25maWcucHJvdG9jb2xdO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICBpZiAoc2VsZWN0c0xlbmd0aCkge1xuICAgICAgICAgICAgcGFyZW50cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudHNMZW5ndGggPSBwYXJlbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKCFwYXJlbnRzTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBleHBhbmQgPSB2bS5uZXh0VG9nZ2xlRXhwYW5kKHBhcmVudHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHBhcmVudFV1aWQgPSBwYXJlbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICBpZiAoISgnaXNQYXJlbnQnIGluIHBhcmVudCAmJiBwYXJlbnQuaXNQYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHBhcmVudFV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmAiVxuICAgICAqIEBwYXJhbSB1dWlkIOWFqOmAieivpeebruagh+iKgueCueS4i+eahOWtkOiKgueCuVxuICAgICAqL1xuICAgIHNlbGVjdEFsbCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgLy8g5pG457Si5qih5byP5LiL77yM5YWo6YCJ5Li65b2T5YmN5YiX6KGoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHRyZWVEYXRhLmRpc3BsYXlBcnJheSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHV1aWQgfHwgdm0uZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCk7XG5cbiAgICAgICAgaWYgKCF0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltwYXJlbnRVdWlkXSkge1xuICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDojrflj5blt7LlsZXlvIDnmoTlrZDoioLngrlcbiAgICAgICAgY29uc3QgY2hpbGRyZW5VdWlkOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICB1dGlscy5nZXRDaGlsZHJlblV1aWQocGFyZW50VXVpZCwgY2hpbGRyZW5VdWlkLCB0cnVlKTtcblxuICAgICAgICBjb25zdCBjbG9uZVNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgY29uc3QgcGFyZW50SW4gPSBjbG9uZVNlbGVjdHMuaW5jbHVkZXMocGFyZW50VXVpZCk7XG5cbiAgICAgICAgbGV0IGNoaWxkcmVuQWxsSW4gPSB0cnVlO1xuICAgICAgICBjb25zdCBjaGlsZHJlblV1aWRMZW5ndGggPSBjaGlsZHJlblV1aWQubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVXVpZExlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhjaGlsZHJlblV1aWRbaV0pKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW5BbGxJbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoaWxkcmVuQWxsSW4pIHtcbiAgICAgICAgICAgIGlmICghcGFyZW50SW4pIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5b6A5LiK5LiA5bGCXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudFV1aWQgIT09IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uc2VsZWN0QWxsKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgICAgICBpZiAocGFyZW50SW4pIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlblV1aWQudW5zaGlmdChwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBjaGlsZHJlblV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBjaGlsZHJlblV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZWxlY3RDbGVhcigpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkcyBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAqL1xuICAgIHNlbGVjdGVkKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2godXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5U2VsZWN0ZWQgPSB1dWlkO1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChzZWxlY3RlZFRpbWVJZCk7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlTZWxlY3RlZCk7XG4gICAgICAgICAgICAgICAgfSwgNTApO1xuXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+lIHNoaWZ0IOWkmumAieeahOWKqOS9nFxuICAgICAgICAgICAgICAgIGlmICh1dWlkID09PSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5zaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFsbEV4cGFuZCA9IHZtLmlzQWxsRXhwYW5kKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICB1bnNlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBpbmRleCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgICAgIHNlbGVjdGVkVGltZUlkID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZtLmludG9WaWV3QnlTZWxlY3RlZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVNlbGVjdGVkID0gJyc7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaBouWkjemAieS4reeKtuaAgVxuICAgICAqL1xuICAgIHJlc2V0U2VsZWN0ZWQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cyA9IFtdO1xuICAgICAgICBjb25zdCB1dWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ2Fzc2V0Jyk7XG4gICAgICAgIHZtLnNlbGVjdGVkKHV1aWRzKTtcblxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVNlbGVjdGVkLCB0cnVlKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsgY2xpY2sg5aSa6YCJXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgc2hpZnRDbGljayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBkaXNwbGF5QXJyYXkgfSA9IHRyZWVEYXRhO1xuXG4gICAgICAgIGNvbnN0IGZpcnN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZihwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF0pO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoZmlyc3RJbmRleCAhPT0gLTEgfHwgbGFzdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGZpcnN0SW5kZXggPD0gbGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZpcnN0SW5kZXg7IGkgPD0gbGFzdEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0cy5wdXNoKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA+PSBsYXN0SW5kZXg7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2bS5pcGNTZWxlY3Qoc2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBjdHJsICsgY2xpY2sg6YCJ5Lit5oiW5Y+W5raI6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY3RybENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhc3NldCcsIHV1aWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkcyDotYTmupBcbiAgICAgKi9cbiAgICBpcGNTZWxlY3QodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHV1aWRzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reagkeW9ouS4iueahOesrOS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGlwY1NlbGVjdEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgIGNvbnN0IHV1aWQgPSB0aGlzLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnqbrnmb3lpITngrnlh7vvvIzlj5bmtojpgInkuK1cbiAgICAgKi9cbiAgICBjbGljaygpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yib5bu65YmN77yM5ZCN56ew5aSE55CGXG4gICAgICogQHBhcmFtIGFkZEluZm8g5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgYWRkVG8oYWRkSW5mbzogSUFkZEluZm8pIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAzMDApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYWRkSW5mby51dWlkKSB7XG4gICAgICAgICAgICBhZGRJbmZvLnV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6Ieq6Lqr5oiW54i257qn5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZShhZGRJbmZvLnV1aWQpO1xuXG4gICAgICAgIC8vIHBhcmVudCDkuI3lrZjlnKjmiJblpITkuo7lhbbku5bnirbmgIHvvIzkuI3pgILlkIjliJvlu7pcbiAgICAgICAgaWYgKCFwYXJlbnQgfHwgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdKSB7XG4gICAgICAgICAgICBjb25zdCBtc2cgPSBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5jYW5Ob3RBZGRUbycsIHtcbiAgICAgICAgICAgICAgICB1dWlkOiBhZGRJbmZvLnV1aWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybihtc2cpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bGV5byA54i257qn6IqC54K5XG4gICAgICAgIHZtLnRvZ2dsZShwYXJlbnQudXVpZCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8g5rua5Yqo5Yiw6aG25bGC6KeG56qXXG4gICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHBhcmVudC51dWlkKTtcblxuICAgICAgICBjb25zdCBwYXJlbnREaXIgPSBwYXJlbnQudXJsO1xuICAgICAgICBsZXQgZmlsZU5hbWUgPSBhZGRJbmZvLmZpbGVOYW1lIHx8ICdOZXcgRmlsZSc7XG4gICAgICAgIGxldCBmaWxlRXh0ID0gYC4ke2FkZEluZm8udHlwZX1gO1xuXG4gICAgICAgIGNvbnN0IGNhbWVsRm9ybWF0UmVnID0gL0BjY2NsYXNzKFtePF0qKSg8JUNhbWVsQ2FzZUNsYXNzTmFtZSU+KS87XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZUZvcm1hdFJlZyA9IC9AY2NjbGFzc1xcKFsnXCJdKFteJ1wiXSopWydcIl1cXCkvO1xuICAgICAgICBjb25zdCBjb21tZW50c1JlZyA9IC8oXFxuW15cXG5dKlxcL1xcKltcXHNcXFNdKj9cXCpcXC8pfChcXG5bXlxcbl0qXFwvXFwvKD86W15cXHJcXG5dfFxccig/IVxcbikpKikvZzsgLy8g5rOo6YeK5Yy65Z+f6L+e5ZCM6L+e57ut55qE56m66KGMXG5cbiAgICAgICAgc3dpdGNoIChhZGRJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2RpcmVjdG9yeSc6XG4gICAgICAgICAgICAgICAgZmlsZUV4dCA9ICcnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndHMnOlxuICAgICAgICAgICAgY2FzZSAnanMnOiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhZGRJbmZvLmNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkSW5mby5jb250ZW50ID0gJyc7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7YWRkSW5mby50ZW1wbGF0ZSB8fCBhZGRJbmZvLnR5cGV9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgZmlsZVVybCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBmaWxlVXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGVJbmZvIHx8ICFleGlzdHNTeW5jKGZpbGVJbmZvLmZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih2bS50KCdyZWFkRGVmYXVsdEZpbGVGYWlsJyksIGZpbGVVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkSW5mby5jb250ZW50ID0gcmVhZEZpbGVTeW5jKGZpbGVJbmZvLmZpbGUsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5pW055CG5bm26K+G5Yir5qih5p2/5pWw5o2uXG4gICAgICAgICAgICAgICAgYWRkSW5mby5jb250ZW50ID0gYWRkSW5mby5jb250ZW50LnJlcGxhY2UoY29tbWVudHNSZWcsICgkMDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkMC5pbmNsdWRlcygnQ09NTUVOVFNfR0VORVJBVEVfSUdOT1JFJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkMDtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIOivhuWIq+aYr+WQpuWQr+eUqOmpvOWzsOagvOW8j+eahOexu+WQjVxuICAgICAgICAgICAgICAgIHV0aWxzLnNjcmlwdE5hbWUucmVxdWlyZWRDYW1lbENhc2VDbGFzc05hbWUgPSBjYW1lbEZvcm1hdFJlZy50ZXN0KGFkZEluZm8uY29udGVudCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lTWF0Y2hlcyA9IGFkZEluZm8uY29udGVudC5tYXRjaChjbGFzc05hbWVGb3JtYXRSZWcpO1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcmlwdE5hbWUuY2xhc3NOYW1lU3RyaW5nRm9ybWF0ID0gbmFtZU1hdGNoZXMgJiYgbmFtZU1hdGNoZXNbMV0gPyBuYW1lTWF0Y2hlc1sxXSA6ICcnO1xuXG4gICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBhd2FpdCB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkRmlsZU5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pyA5ZCO5Lul6L+Z5LiqIHVybCDmlbDmja7kuLrlh4ZcbiAgICAgICAgbGV0IHVybCA9IGAke3BhcmVudERpcn0vJHtmaWxlTmFtZX0ke2ZpbGVFeHR9YDtcbiAgICAgICAgdXJsID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLXVybCcsIHVybCk7XG5cbiAgICAgICAgdm0uYWRkSW5mbyA9IHtcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIHR5cGU6IGFkZEluZm8udHlwZSxcbiAgICAgICAgICAgIGltcG9ydGVyOiBhZGRJbmZvLmltcG9ydGVyLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGFkZEluZm8udGVtcGxhdGUsXG4gICAgICAgICAgICBjb250ZW50OiBhZGRJbmZvLmNvbnRlbnQsXG4gICAgICAgICAgICBmaWxlRXh0LFxuICAgICAgICAgICAgZmlsZU5hbWU6IGJhc2VuYW1lKHVybCwgZmlsZUV4dCksXG4gICAgICAgICAgICBuYW1lOiBiYXNlbmFtZSh1cmwpLFxuICAgICAgICAgICAgcGFyZW50RGlyLFxuICAgICAgICAgICAgcGFyZW50VXVpZDogcGFyZW50LnV1aWQsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkI3np7DloavlhpnlkI7mj5DkuqTliLDov5nph4xcbiAgICAgKiBAcGFyYW0gYWRkSW5mbyDkv6Hmga9cbiAgICAgKi9cbiAgICBhc3luYyBhZGRDb25maXJtKGFkZEluZm8/OiBJQWRkSW5mbykge1xuICAgICAgICAvLyDmlbDmja7plJnor6/ml7blj5bmtohcbiAgICAgICAgaWYgKCFhZGRJbmZvIHx8ICFhZGRJbmZvLnBhcmVudERpciB8fCAhYWRkSW5mby5wYXJlbnRVdWlkIHx8ICFhZGRJbmZvLmZpbGVOYW1lKSB7XG4gICAgICAgICAgICAvLyDmlrDlop7nmoTovpPlhaXmoYbmtojlpLFcbiAgICAgICAgICAgIHZtLmFkZEluZm8ucGFyZW50RGlyID0gJyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhZGRJbmZvLm5hbWUgPSBhZGRJbmZvLmZpbGVOYW1lICsgYWRkSW5mby5maWxlRXh0O1xuXG4gICAgICAgIC8vIOiHqui6q+aIlueItue6p+aWh+S7tuWkuVxuICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUoYWRkSW5mby5wYXJlbnRVdWlkKTtcbiAgICAgICAgLy8g54i257qn5LiN5Y+v5paw5bu66LWE5rqQXG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5rOo5oSP77ya5oWO6YeN5L+u5pS55q2k6buY6K6k5YC8XG4gICAgICAgICAqIGNvbnRlbnQg57G75Z6L5Y+v5Lul5Li6IG51bGwsIHN0cmluZywgYnVmZmVyXG4gICAgICAgICAqIOm7mOiupCBudWxsIOaYr+e7meaWh+S7tuWkueS9v+eUqOeahFxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IGNvbnRlbnQ6IGFueSA9IG51bGw7XG5cbiAgICAgICAgaWYgKGFkZEluZm8udHlwZSAhPT0gJ2RpcmVjdG9yeScpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBhZGRJbmZvLmNvbnRlbnQgfHwgJyc7XG5cbiAgICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVVcmwgPSBgZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC8ke2FkZEluZm8udGVtcGxhdGUgfHwgYWRkSW5mby50eXBlfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgZmlsZVVybCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZmlsZVV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgZmlsZVV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGVJbmZvIHx8ICFleGlzdHNTeW5jKGZpbGVJbmZvLmZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHZtLnQoJ3JlYWREZWZhdWx0RmlsZUZhaWwnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGZpbGVJbmZvLmZpbGUsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFsndHMnLCAnanMnXS5pbmNsdWRlcyhhZGRJbmZvLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWQgPSBhd2FpdCB1dGlscy5zY3JpcHROYW1lLmlzVmFsaWQoYWRkSW5mby5maWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkLnN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3Iodm0udCh2YWxpZC5zdGF0ZSkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdXNlRGF0YSA9IGF3YWl0IEVkaXRvci5Vc2VyLmdldERhdGEoKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlQ29udGVudHM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgVW5kZXJzY29yZUNhc2VDbGFzc05hbWU6IHV0aWxzLnNjcmlwdE5hbWUuZ2V0VmFsaWRDbGFzc05hbWUoYWRkSW5mby5maWxlTmFtZSksXG4gICAgICAgICAgICAgICAgICAgIENhbWVsQ2FzZUNsYXNzTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENhbWVsQ2FzZUNsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgRGF0ZVRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgICAgIEF1dGhvcjogdXNlRGF0YS5uaWNrbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgRmlsZUJhc2VuYW1lOiBhZGRJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIEZpbGVCYXNlbmFtZU5vRXh0ZW5zaW9uOiBhZGRJbmZvLmZpbGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICBVUkw6IGAke2FkZEluZm8ucGFyZW50RGlyfS8ke2FkZEluZm8ubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICBFZGl0b3JWZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIE1hbnVhbFVybDogRWRpdG9yLkFwcC51cmxzLm1hbnVhbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHJlcGxhY2VDb250ZW50cykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UobmV3IFJlZ0V4cChgPCUke2tleX0lPmAsICdnJyksIHJlcGxhY2VDb250ZW50c1trZXldKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmFkZEluZm8ucGFyZW50RGlyID0gJyc7XG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3BhcmVudC51dWlkXSA9ICdhZGQtbG9hZGluZyc7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcblxuICAgICAgICBjb25zdCB1cmwgPSBgJHthZGRJbmZvLnBhcmVudERpcn0vJHthZGRJbmZvLmZpbGVOYW1lfSR7YWRkSW5mby5maWxlRXh0fWA7XG4gICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCB2bS5hZGQodXJsLCBjb250ZW50KTtcblxuICAgICAgICAvLyDmlrDlu7rlkIzlkI3mlofku7bml7bngrnlj5bmtojkvJrov5Tlm54gbnVsbFxuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3BhcmVudC51dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUocGFyZW50LnV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnIDlkI7lj5HotbcgaXBjIOWIm+W7uui1hOa6kFxuICAgICAqIEBwYXJhbSB1cmwg55uu5qCH5L2N572uXG4gICAgICogQHBhcmFtIGNvbnRlbnQg5aGr5YWF5YaF5a65XG4gICAgICogQHBhcmFtIG9wdGlvbiDlj6/pgInphY3nva5cbiAgICAgKi9cbiAgICBhc3luYyBhZGQodXJsOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyB8IG51bGwsIG9wdGlvbj86IElDcmVhdGVPcHRpb24pIHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSAoYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgdXJsLCBjb250ZW50LCB7XG4gICAgICAgICAgICBvdmVyd3JpdGU6IG9wdGlvbj8ub3ZlcndyaXRlLFxuICAgICAgICB9KSkgYXMgSUFzc2V0SW5mbztcblxuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdChhc3NldC51dWlkKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcoYXNzZXQudXVpZCk7XG4gICAgICAgICAgICB9LCAzMDApO1xuXG4gICAgICAgICAgICByZXR1cm4gYXNzZXQudXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pS25YiwIGlwYyDmtojmga8gYXNzZXQtZGI6YXNzZXQtYWRkXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIGluZm8g5pWw5o2uXG4gICAgICovXG4gICAgYXN5bmMgYWRkZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWUucHVzaCh7IHV1aWQsIGFuaW1hdGlvbjogJ3NocmluaycgfSk7XG4gICAgICAgIHRyZWVEYXRhLmFkZGVkKHV1aWQsIGluZm8pO1xuICAgICAgICB2bS5yZWZyZXNoaW5nKCdhZGRlZCcsIGluZm8ubmFtZSk7XG5cbiAgICAgICAgY29uc3QgZm9sZGVyVXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG4gICAgICAgIHZtLnJlZnJlc2hpbmcuaWdub3Jlc1tmb2xkZXJVdWlkXSA9IHRydWU7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmm7TmlrDmoJHlvaLoioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gaW5mbyDmlbDmja5cbiAgICAgKi9cbiAgICBhc3luYyBjaGFuZ2VkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIC8vIOWIoOmZpOW3sue8k+WtmOeahOe8qeeVpeWbvlxuICAgICAgICB1dGlscy50aHVtYm5haWwuZGVsZXRlKHV1aWQpO1xuXG4gICAgICAgIHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLnB1c2goeyB1dWlkLCBhbmltYXRpb246ICdsaWdodCcgfSk7XG5cbiAgICAgICAgdHJlZURhdGEuY2hhbmdlZCh1dWlkLCBpbmZvKTtcbiAgICAgICAgdm0ucmVmcmVzaGluZygnY2hhbmdlZCcsIGluZm8ubmFtZSwgdXVpZCk7XG5cbiAgICAgICAgY29uc3QgZm9sZGVyVXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG4gICAgICAgIHZtLnJlZnJlc2hpbmcuaWdub3Jlc1tmb2xkZXJVdWlkXSA9IHRydWU7XG5cbiAgICAgICAgaWYgKHV1aWQgPT09IHZtLmludG9WaWV3QnlVc2VyKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnRvVmlld0J5VXNlciA9IHZtLmludG9WaWV3QnlVc2VyO1xuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcoaW50b1ZpZXdCeVVzZXIpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogaXBjIOWPkei1t+WIoOmZpOi1hOa6kFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWmguaenOivpei1hOa6kOayoeacieiiq+mAieS4re+8jOWImeWPquaYr+WIoOmZpOatpOWNleS4qlxuICAgICAgICAgKiDlpoLmnpzor6XotYTmupDmmK/ooqvpgInkuK3kuobvvIzooajmmI7opoHliKDpmaTmiYDmnInpgInkuK3poblcbiAgICAgICAgICovXG4gICAgICAgIGxldCBzZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBpblNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCk7XG4gICAgICAgIGlmICh1dWlkICYmICFpblNlbGVjdHMpIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBbdXVpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxlY3RzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgLy8g5pyJ5pWI55qE5Y+v5Yig6Zmk55qE6IqC54K5XG4gICAgICAgIGxldCB2YWxpZFV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gc2VsZWN0c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQgfHwgdXRpbHMuY2FuTm90RGVsZXRlKGFzc2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnoa7kv50gMS8y77yaIHZhbGlkVXVpZHMg6YeM6Z2i5Lu75LiA6IqC54K56YO95LiN5pivIHV1aWQg55qE5a2Q6IqC54K5XG4gICAgICAgICAgICB2YWxpZFV1aWRzID0gdmFsaWRVdWlkcy5maWx0ZXIoKHZhbGlkVXVpZCkgPT4gIXV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIHZhbGlkVXVpZCkpO1xuXG4gICAgICAgICAgICAvLyDnoa7kv50gMi8y77yaIHZhbGlkVXVpZHMg6YeM55qE5Lu75LiA6IqC54K56YO95LiN5pivIHV1aWQg55qE54i26IqC54K5XG4gICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuc29tZSgodmFsaWRVdWlkKSA9PiB1dGlscy5pc0FJbmNsdWRlQih2YWxpZFV1aWQsIHV1aWQpKSkge1xuICAgICAgICAgICAgICAgIHZhbGlkVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbGlkVXVpZHNMZW5ndGggPSB2YWxpZFV1aWRzLmxlbmd0aDtcbiAgICAgICAgaWYgKCF2YWxpZFV1aWRzTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjljJbliKDpmaTml7bnmoTlhoXlrrnmj5DnpLpcbiAgICAgICAgY29uc3Qgc2hvd0luZGV4ID0gNTtcbiAgICAgICAgbGV0IGZpbGVsaXN0ID0gJyc7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICBpZiAoaSA+IHNob3dJbmRleCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHZhbGlkVXVpZCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpIDwgc2hvd0luZGV4KSB7XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gYCR7YXNzZXQubmFtZX1cXG5gO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSAnLi4uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZWRMaXN0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZXhlY3V0ZS1zY3JpcHQnLCB7XG4gICAgICAgICAgICBuYW1lOiAnYXNzZXRzJyxcbiAgICAgICAgICAgIG1ldGhvZDogJ3F1ZXJ5RGVwZW5kcycsXG4gICAgICAgICAgICBhcmdzOiBbdmFsaWRVdWlkc10sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh1c2VkTGlzdCAmJiB1c2VkTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmaWxlbGlzdCArPSAnXFxuJyArIEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLm1heWJlRGVwZW5kT3RoZXInKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1c2VkTGlzdFtpXSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gYFxcbiR7dXNlZExpc3RbaV19YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VkTGlzdC5sZW5ndGggPiA1KSB7XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gJ1xcbi4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtc2cgPSBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5zdXJlRGVsZXRlJywge1xuICAgICAgICAgICAgbGVuZ3RoOiBTdHJpbmcodmFsaWRVdWlkc0xlbmd0aCksXG4gICAgICAgICAgICBmaWxlbGlzdCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5Yig6Zmk5YmN6K+i6ZeuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybihtc2csIHtcbiAgICAgICAgICAgIGJ1dHRvbnM6IFsnWWVzJywgJ0NhbmNlbCddLFxuICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXNrczogQXJyYXk8UHJvbWlzZTxBc3NldEluZm8gfCBudWxsPj4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHZhbGlkVXVpZCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3ZhbGlkVXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh2YWxpZFV1aWQpO1xuXG4gICAgICAgICAgICB0YXNrcy5wdXNoKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2RlbGV0ZS1hc3NldCcsIGFzc2V0LnVybCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdHJlZURhdGEudXVpZFRvU3RhdGVbdmFsaWRVdWlkc1tpXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOmHjee9ruaJgOaciemAieS4rVxuICAgICAgICBpblNlbGVjdHMgJiYgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOS7juagkeW9ouWIoOmZpOi1hOa6kOiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOaVsOaNrlxuICAgICAqL1xuICAgIGRlbGV0ZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgLy8g5Yig6Zmk5bey57yT5a2Y55qE57yp55Wl5Zu+XG4gICAgICAgIHV0aWxzLnRodW1ibmFpbC5kZWxldGUodXVpZCk7XG5cbiAgICAgICAgdHJlZURhdGEuZGVsZXRlZCh1dWlkLCBpbmZvKTtcbiAgICAgICAgdm0ucmVmcmVzaGluZygnZGVsZXRlZCcsIGluZm8ubmFtZSk7XG5cbiAgICAgICAgY29uc3QgZm9sZGVyVXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG4gICAgICAgIHZtLnJlZnJlc2hpbmcuaWdub3Jlc1tmb2xkZXJVdWlkXSA9IHRydWU7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDplK7nm5gg5LiK5LiL5bem5Y+zXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICB1cERvd25MZWZ0UmlnaHQoZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHZtLmdldExhc3RTZWxlY3QoKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBpZiAoIXZtLmlzRXhwYW5kKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGxhc3QsIHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltsYXN0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBpZiAodm0uaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtsYXN0XTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgIT09IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QocGFyZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNpYmxpbmdzID0gdXRpbHMuZ2V0U2libGluZyhsYXN0KTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50O1xuICAgICAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd1cCc6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZG93bic6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1syXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGN1cnJlbnQudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsg5LiK5LiL566t5aS077yM5aSa6YCJXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICBhc3luYyBzaGlmdFVwRG93bihkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBsZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IFtsYXN0LCBsYXN0UHJldiwgbGFzdE5leHRdID0gdXRpbHMuZ2V0U2libGluZyhwYW5lbERhdGEuYWN0LnNlbGVjdHNbbGVuZ3RoIC0gMV0pO1xuICAgICAgICBjb25zdCBoYXNMYXN0UHJldiA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgY29uc3QgaGFzTGFzdE5leHQgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMobGFzdE5leHQudXVpZCk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3VwJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0UHJldikge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGxhc3RQcmV2LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0UHJldi51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYXNzZXQnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdFByZXYudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdFByZXYudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gbGFzdE5leHQudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2Fzc2V0JywgbGFzdC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcobGFzdE5leHQudXVpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdE5leHQudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdE5leHQudXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQiOW5tiBzaGlmdCDlpJrpgInov4fnqIvkuK3liY3lkI7nmoTlt7LpgInkuK3poblcbiAgICAgKiDmr5TlpoIgYWIgY2RlIOmhueS4rSBhLCBjZGUg5bey6YCJ5LitLCBiIOacqumAieS4rVxuICAgICAqIOW9k+mAieS4rSBiIOaXtu+8jOWQiOW5tumAieS4remhuSBjZGUg77yM5bm25bCG5pyr5bC+6YCJ5Lit6aG555qE5oyH6ZKI5oyH5ZCRIGVcbiAgICAgKi9cbiAgICBzaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKSB7XG4gICAgICAgIGlmICghdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBrZWVwRmluZE5leHQgPSB0cnVlO1xuICAgICAgICBsZXQgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZDtcblxuICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9ICcnOyAvLyDph43nva5cblxuICAgICAgICBsZXQgbWF4TG9vcE51bWJlciA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChrZWVwRmluZE5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IHV0aWxzLmdldFNpYmxpbmcoZmluZFV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFyciB8fCAhYXJyWzFdIHx8ICFhcnJbMl0gfHwgIW1heExvb3BOdW1iZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbmRVdWlkID0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gYXJyWzJdLnV1aWQgOiBhcnJbMV0udXVpZDtcbiAgICAgICAgICAgIG1heExvb3BOdW1iZXItLTtcblxuICAgICAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhmaW5kVXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGZpbmRVdWlkKSwgMSk7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2goZmluZFV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrZWVwRmluZE5leHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5p2l6Ieq5b+r5o236ZSu55qEIHJlbmFtZVxuICAgICAqL1xuICAgIGFzeW5jIGtleWJvYXJkUmVuYW1lKCkge1xuICAgICAgICBpZiAodm0ucmVuYW1lVXJsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1dWlkID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcblxuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoYXNzZXQgJiYgIXV0aWxzLmNhbk5vdFJlbmFtZShhc3NldCkpIHtcbiAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHV1aWQpO1xuICAgICAgICAgICAgdm0ucmVuYW1lVXJsID0gYXNzZXQudXJsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnph43lkI3lkb1cbiAgICAgKiDov5nmmK/lvILmraXnmoTvvIzlj6rlgZrlj5HpgIFcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gZmlsZU5hbWUg5paH5Lu25ZCNXG4gICAgICovXG4gICAgYXN5bmMgcmVuYW1lKHV1aWQ6IHN0cmluZywgZmlsZU5hbWUgPSAnJykge1xuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0IHx8IHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOa4heepuumcgOimgSByZW5hbWUg55qE6IqC54K5XG4gICAgICAgIHZtLnJlbmFtZVVybCA9ICcnO1xuXG4gICAgICAgIGlmICh1dGlscy5jYW5Ob3RSZW5hbWUoYXNzZXQpIHx8IGZpbGVOYW1lID09PSAnJyB8fCBmaWxlTmFtZSA9PT0gYXNzZXQuZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vIG5hbWUg5a2Y5Zyo5LiU5LiO5LmL5YmN55qE5LiN5LiA5qC35omN6IO96YeN5ZCN5ZG977yM5ZCm5YiZ6L+Y5Y6f54q25oCBXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJ2xvYWRpbmcnO1xuXG4gICAgICAgIC8vIOmHjeWQjeWRvei1hOa6kFxuICAgICAgICBjb25zdCBuYW1lID0gZmlsZU5hbWUgKyBhc3NldC5maWxlRXh0O1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBgJHtwYXJlbnQudXJsfS8ke25hbWV9YDtcbiAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnbW92ZS1hc3NldCcsIGFzc2V0LnVybCwgdGFyZ2V0KTtcblxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICBzb3J0KCkge1xuICAgICAgICB0cmVlRGF0YS5yZXNvcnQoKTtcbiAgICB9LFxuICAgIHNlYXJjaCgpIHtcbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgLy8g5pCc57Si5pyJ5Y+Y5Yqo6YO95YWI5rua5Zue6aG26YOoXG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hWYWx1ZSkge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveC5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnlKggc2V0VGltZW91dCDkuIvkuIDluKfph43mlrDlrprkvY1cbiAgICAgICAgaWYgKCFwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hJbkZvbGRlciAmJiAhcGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVmFsdWUpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlTZWxlY3RlZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3pq5jkuq7moYbpgInlvZPliY3miYDlpITnmoTmlofku7blpLnojIPlm7RcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBkcmFnT3Zlcih1dWlkOiBzdHJpbmcsIGRyYWdPdmVyQXNzZXQ/OiBJQXNzZXRJbmZvIHwgbnVsbCkge1xuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbklkKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZtLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmRyYWdPdmVyKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0sIGRyYWdPdmVyQXNzZXQgfHwgYXNzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRyYWcg5oKs5YGc5LiA5q615pe26Ze05ZCO6Ieq5Yqo5bGV5byA5paH5Lu25aS5XG4gICAgICAgICAgICBjb25zdCBub3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChkcmFnT3ZlclV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclV1aWQgPSB1dWlkO1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVGltZUlkID0gbm93VGltZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vd1RpbWUgLSBkcmFnT3ZlclRpbWVJZCA+IDgwMCkge1xuICAgICAgICAgICAgICAgICAgICB2bS50b2dnbGUodXVpZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCAkdmlld0JveCA9IHBhbmVsRGF0YS4kLnZpZXdCb3g7XG5cbiAgICAgICAgICAgIC8vIOW+ruiwgyB0b3BcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdFNjcm9sbCA9IHZtLnNjcm9sbFRvcCAlIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBhZGp1c3RUb3AgPSAkdmlld0JveC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSB2bS4kZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wOyAvLyDmu5rliqjliLDlupXpg6jkuoZcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdHJlZURhdGEuZGlzcGxheUFycmF5LmluZGV4T2YodXVpZCk7XG4gICAgICAgICAgICBjb25zdCB0b3AgPSBpbmRleCAqIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQgKyBhZGp1c3RTY3JvbGwgLSBhZGp1c3RUb3AgKyAzO1xuXG4gICAgICAgICAgICBjb25zdCBleHBhbmRDaGlsZHJlbjogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIGxldCBvcGFjaXR5ID0gYXNzZXQucmVhZG9ubHkgPyAwIDogMTtcblxuICAgICAgICAgICAgaWYgKCF2bS5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmdldENoaWxkcmVuVXVpZCh1dWlkLCBleHBhbmRDaGlsZHJlbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChkcmFnT3ZlckFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHkgPSAhZHJhZ092ZXJBc3NldC5pc0RpcmVjdG9yeSA/IDAgOiBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveFN0eWxlID0ge1xuICAgICAgICAgICAgICAgIGxlZnQ6ICR2aWV3Qm94LnNjcm9sbExlZnQgKyAncHgnLFxuICAgICAgICAgICAgICAgIHRvcDogdG9wICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IChleHBhbmRDaGlsZHJlbi5sZW5ndGggKyAxKSAqIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQgKyAyICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBvcGFjaXR5LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3mhJ/nn6XlvZPliY3miYDlpITnmoTmlofku7blpLnvvIznprvlvIDlkI7lj5bmtojpq5jkuq5cbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBkcmFnTGVhdmUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgIGlmIChhc3NldCAmJiAhYXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIGFzc2V0ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVthc3NldC51dWlkXSA9ICcnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiB0cmVlIOWuueWZqOS4iueahCBkcm9wXG4gICAgICogQHBhcmFtIGV2ZW50IOm8oOagh+S6i+S7tlxuICAgICAqL1xuICAgIGFzeW5jIGRyb3AoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShFZGl0b3IuVUkuX19wcm90ZWN0ZWRfXy5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICAvLyDlpoLmnpzmsqHmnInniLboioLngrnvvIzkvovlpoLmkJzntKLlkI7msqHnu5PmnpzvvIzliJnkuI3lk43lupRcbiAgICAgICAgaWYgKCF2bS5hc3NldHNbMF0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb3RVdWlkID0gdm0uYXNzZXRzWzBdLnV1aWQ7XG4gICAgICAgIGNvbnN0IGxvY2FsRmlsZXMgPSBBcnJheS5mcm9tKGV2ZW50LmRhdGFUcmFuc2ZlciEuZmlsZXMpO1xuICAgICAgICBpZiAobG9jYWxGaWxlcyAmJiBsb2NhbEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIOS7juWklumDqOaLluaWh+S7tui/m+adpVxuICAgICAgICAgICAgZGF0YS50eXBlID0gJ29zRmlsZSc7XG4gICAgICAgICAgICBkYXRhLmZpbGVzID0gbG9jYWxGaWxlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQoZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAvLyDlpoLmnpzku47moLnoioLngrnnp7vliqjvvIzlj4jokL3lm57moLnoioLngrnvvIzliJnkuI3pnIDopoHnp7vliqhcbiAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LnV1aWQgPT09IHJvb3RVdWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS50byA9IHJvb3RVdWlkOyAvLyDpg73lvZLkuo7moLnoioLngrlcbiAgICAgICAgZGF0YS5jb3B5ID0gZXZlbnQuY3RybEtleTtcbiAgICAgICAgdm0uaXBjRHJvcChkYXRhKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/m+WFpSB0cmVlIOWuueWZqFxuICAgICAqL1xuICAgIGRyYWdFbnRlcigpIHtcbiAgICAgICAgLy8g5pCc57Si5qih5byP5LiL77yM5LiN6K+G5Yir5Li65ouW5YWlIHRyZWUg5a655ZmoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveFN0eWxlID0ge307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbklkKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIHZtLmRyYWdPdmVyKHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6LWE5rqQ5ouW5YqoXG4gICAgICogQHBhcmFtIGRyYWdJbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGlwY0Ryb3AoZHJhZ0luZm86IElEcmFnSW5mbykge1xuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5mb2N1c1dpbmRvdygpOyAvLyDmi5bov5vns7vnu5/mlofku7blkI7nqpflj6PojrflvpfnhKbngrnvvIzku6Xop6blj5EgaXBjIOeahOaUtuWPkVxuXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuY2xlYXJTZWFyY2goKTtcbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG9Bc3NldCA9IHV0aWxzLmdldERpcmVjdG9yeShkcmFnSW5mby50byk7XG5cbiAgICAgICAgaWYgKCF0b0Fzc2V0IHx8IHV0aWxzLmNhbk5vdENyZWF0ZSh0b0Fzc2V0KSkge1xuICAgICAgICAgICAgY29uc3QgbXNnID0gRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuY2FuTm90RHJvcCcsIHsgdXVpZDogZHJhZ0luZm8udG8gfSk7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS7juWklumDqOaLluaWh+S7tui/m+adpVxuICAgICAgICBpZiAoZHJhZ0luZm8udHlwZSA9PT0gJ29zRmlsZScpIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkcmFnSW5mby5maWxlcykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbGVwYXRocyA9IGRyYWdJbmZvLmZpbGVzLm1hcCgoZmlsZTogYW55KSA9PiBmaWxlLnBhdGgpO1xuXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt0b0Fzc2V0LnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodG9Bc3NldC51dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgICAgICAvLyDmib7lh7rkvJrph43lpI3nmoTmlofku7bpm4blkIhcbiAgICAgICAgICAgIGNvbnN0IHJlcGVhdEZpbGVzOiBJUmVwZWF0RmlsZVtdID0gYXdhaXQgZmlsZXBhdGhzLnJlZHVjZShhc3luYyAocmVzLCBmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0VVJMID0gdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmaWxlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdBc3NldFVSTCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2dlbmVyYXRlLWF2YWlsYWJsZS11cmwnLCBhc3NldFVSTCk7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0VVJMICE9PSBuZXdBc3NldFVSTCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYmFzZW5hbWUoZmlsZSksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKFtdKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHsgb3ZlcndyaXRlOiBmYWxzZSwgcmVuYW1lOiBmYWxzZSB9OyAvLyDlr7zlhaXpgInpoblcbiAgICAgICAgICAgIGxldCBzdG9wID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAocmVwZWF0RmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIOi2heWHujXkuKrmlofku7blsLHnlKguLi7ku6Pmm7/kuoZcbiAgICAgICAgICAgICAgICBsZXQgZGV0YWlsID0gcmVwZWF0RmlsZXNcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgodjogSVJlcGVhdEZpbGUpID0+IHYubmFtZSlcbiAgICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIDUpXG4gICAgICAgICAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwZWF0RmlsZXMubGVuZ3RoID4gNSkge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWwgKz0gJ1xcbiAuLi4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4oRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUucmVwZWF0VGlwJyksIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ1F1ZXN0aW9uJyksXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogZGV0YWlsLCAvLyDmj5DnpLrno4Hnm5jot6/lvoRcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUub3ZlcndyaXRlJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5yZW5hbWUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbmNlbCcpLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IDIsXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5vdmVyd3JpdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5yZW5hbWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3AgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFzdG9wICYmIGZpbGVwYXRocy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgICAgICAgICAgZmlsZXBhdGhzLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXNzZXQtZGInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpbXBvcnQtYXNzZXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmaWxlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBlYXRGaWxlcy5zb21lKCh2OiBJUmVwZWF0RmlsZSkgPT4gdi5maWxlID09PSBmaWxlKSA/IG9wdGlvbiA6IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5a+85YWl5a6M5oiQ5oiW6ICF5Y+W5raI5LqG5a+85YWl77yM6L+Y5Y6f54i257qn54q25oCBXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt0b0Fzc2V0LnV1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh0b0Fzc2V0LnV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZHJhZ0luZm8udHlwZSA9PT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgICAgICAvLyDmmI7noa7mjqXlj5flpJbpg6jmi5bov5vmnaXnmoToioLngrkgY2MuTm9kZVxuICAgICAgICAgICAgZm9yIChjb25zdCBub2RlIG9mIGRyYWdJbmZvLmFkZGl0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlICE9PSAnY2MuTm9kZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVV1aWQgPSBub2RlLnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdxdWVyeS1ub2RlJywgbm9kZVV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybCA9IGAke3RvQXNzZXQudXJsfS8ke2R1bXAubmFtZS52YWx1ZSB8fCAnTm9kZSd9LnByZWZhYmA7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1wcmVmYWInLCBub2RlVXVpZCwgdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QodXVpZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh1dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzICYmIHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcy5pbmNsdWRlcyhkcmFnSW5mby50eXBlKSkge1xuICAgICAgICAgICAgLy8g6K+l57G75Z6L55qE5LqL5Lu25pyJ5aSW6YOo5rOo5YaM55qE5Yqo5L2c77yM6L2s55Sx5aSW6YOo5rOo5YaM5LqL5Lu25o6l566hXG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBPYmplY3QudmFsdWVzKHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC5jYWxsYmFja3NbZHJhZ0luZm8udHlwZV0pIGFzIEZ1bmN0aW9uW107XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjYWxsYmFja3MpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldChkcmFnSW5mby50byk7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjazogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbzogRHJvcENhbGxiYWNrSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEaXJlY3Rvcnk6IGFzc2V0LmlzRGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhpbmZvLCBkcmFnSW5mby5hZGRpdGlvbmFsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghZHJhZ0luZm8uYWRkaXRpb25hbCB8fCAhQXJyYXkuaXNBcnJheShkcmFnSW5mby5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRyYWdJbmZvLmNvcHkpIHtcbiAgICAgICAgICAgICAgICAvLyDmjInkvY/kuoYgY3RybCDplK7vvIzmi5bliqjlpI3liLZcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkcyA9IGRyYWdJbmZvLmFkZGl0aW9uYWwubWFwKChpbmZvOiBJRHJhZ0FkZGl0aW9uYWwpID0+IGluZm8udmFsdWUuc3BsaXQoJ0AnKVswXSk7XG4gICAgICAgICAgICAgICAgdm0uY29weShbLi4ubmV3IFNldCh1dWlkcyldKTtcbiAgICAgICAgICAgICAgICB2bS5wYXN0ZShkcmFnSW5mby50byk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB2bS5tb3ZlKGRyYWdJbmZvLCB0b0Fzc2V0KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi2XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY29weSh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb3BpZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGNvcGllcyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1dWlkIOaYryDlrZfnrKZcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/lpI3liLbnmoToioLngrlcbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSBjb3BpZXMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdENvcHkoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY29waWVkVXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bCG5aSN5Yi255qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAgICBjb25zdCBjb3BpZWRJbmZvOiBJQ29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGNvcGllZFV1aWRzKTtcbiAgICAgICAgLy8g5bCG5aSN5Yi26IqC54K555qEIHV1aWQg5a2Y5pS+5Yiw57uf5LiA55qE5Ymq5YiH5p2/XG4gICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ2Fzc2V0cy1jb3BpZWQtaW5mbycsIGNvcGllZEluZm8pO1xuXG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog57KY6LS0XG4gICAgICogQHBhcmFtIHV1aWQg57KY6LS05Yiw5q2k55uu5qCH6IqC54K5XG4gICAgICogQHBhcmFtIGNvcGllZFV1aWRzIOiiq+WkjeWItueahOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIHBhc3RlKHV1aWQ6IHN0cmluZywgY29waWVkVXVpZHM/OiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgdXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGVzdE5vZGUgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUodXVpZCk7IC8vIOiHqui6q+aIlueItue6p+aWh+S7tuWkuVxuICAgICAgICBpZiAoIWRlc3ROb2RlKSB7XG4gICAgICAgICAgICAvLyDmsqHmnInlj6/nlKjnmoRcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbk5vdFBhc3RlJywgeyB1dWlkIH0pO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjlhYjlpITnkIbliarliIfnmoTmg4XlhrVcbiAgICAgICAgY29uc3QgY3V0SW5mbyA9IEVkaXRvci5DbGlwYm9hcmQucmVhZCgnYXNzZXRzLWN1dC1pbmZvJykgYXMgYW55O1xuICAgICAgICAvLyDot6jnvJbovpHlmajkuI3lj6/liarliIfnspjotLTvvIzliarliIfml7blj6/og73pg73ov4fmu6TlhYnkuobmiYDku6XkuZ/pnIDopoHliKTmlq0gYXNzZXRJbmZvLmxlbmd0aFxuICAgICAgICBpZiAoY3V0SW5mbyAmJiBjdXRJbmZvLmFzc2V0SW5mby5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCA9PT0gY3V0SW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRJbmZvLmFzc2V0SW5mby5tYXAoKGl0ZW06IElDb3BpZWRBc3NldEluZm8pID0+IGl0ZW0udXVpZCk7XG4gICAgICAgICAgICAvLyDlpoLmnpzliarliIfliLDoh6rouqvmlofku7blpLnvvIznu4jmraJcbiAgICAgICAgICAgIGlmIChkZXN0Tm9kZSAmJiBjdXRVdWlkcy5pbmNsdWRlcyhkZXN0Tm9kZS51dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbW92ZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbDogY3V0VXVpZHMubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHV1aWQgfTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IHZtLm1vdmUobW92ZURhdGEsIGRlc3ROb2RlKTtcblxuICAgICAgICAgICAgLy8g572u56m65Ymq5YiH5p2/55qE5aSN5Yi25ZKM5Ymq5YiH6LWE5rqQXG4gICAgICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWIpOaWreS4jeaYr+WFtuS7luaTjeS9nOS8oOWFpeeahOWPguaVsFxuICAgICAgICBpZiAoIWNvcGllZFV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb3BpZWRJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdhc3NldHMtY29waWVkLWluZm8nKSBhcyBhbnk7XG4gICAgICAgICAgICBsZXQgY29waWVkRmlsZXMgPSBbXTtcbiAgICAgICAgICAgIGlmIChjb3BpZWRJbmZvKSB7XG4gICAgICAgICAgICAgICAgLy8g5LuO5Ymq5YiH5p2/5Lit6I635Y+WIGNvcGllZFV1aWRzIOWSjOWkhOeQhui3qOe8lui+keWZqOaXtueahOaWh+S7tui3r+W+hFxuICAgICAgICAgICAgICAgIGNvcGllZFV1aWRzID0gY29waWVkSW5mby5hc3NldEluZm8ubWFwKChpdGVtOiBJQ29waWVkQXNzZXRJbmZvKSA9PiBpdGVtLnV1aWQpO1xuICAgICAgICAgICAgICAgIGNvcGllZEZpbGVzID0gY29waWVkSW5mby5hc3NldEluZm8ubWFwKChpdGVtOiBJQ29waWVkQXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoOiBpdGVtLmZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJQYXRoOiBkZXN0Tm9kZS51cmwgKyAnLycgKyBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVE9ETzpcbiAgICAgICAgICAgICAqIOi3qOaWh+S7tuezu+e7n++8jOaaguS4jeaUr+aMge+8jOWPr+S7peiAg+iZkeWmguS9leWkjeeUqCBkcm9wIOWKqOS9nFxuICAgICAgICAgICAgICog55uu5YmN5Y+q5pSv5oyB6Leo57yW6L6R5Zmo77yM5L2/55SoIHByb2plY3QucGF0aCDliKTmlq3vvIxwYXN0ZSDlkowgZHJvcCDni6znq4vlrp7njrBcbiAgICAgICAgICAgICAqIOWJquWIh+adv+S4reWtmOWCqOeahOaYr+Wvueixoee7k+aehO+8jOWQjue7reWPr+S7peWCqOWtmCBKU09OIOWtl+espuS4slxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvLyDot6jnvJbovpHlmajnspjotLRcbiAgICAgICAgICAgIGlmIChjb3BpZWRGaWxlcy5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCAhPT0gY29waWVkSW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgICAgIC8vIOaYvuekuiBsb2FkaW5nIOaViOaenFxuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKGRlc3ROb2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShkZXN0Tm9kZS51dWlkLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBjb3BpZWRGaWxlcykge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbXBvcnQtYXNzZXQnLCBmaWxlLnNyY1BhdGgsIGZpbGUudGFyUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJyc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzlpI3liLbliLDoh6rouqvmlofku7blpLnvvIzpnIDopoHlvoDkuIrnp7vkuIDlsYLmlofku7blpLlcbiAgICAgICAgaWYgKGRlc3ROb2RlICYmIGNvcGllZFV1aWRzPy5pbmNsdWRlcyhkZXN0Tm9kZS51dWlkKSkge1xuICAgICAgICAgICAgZGVzdE5vZGUgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtkZXN0Tm9kZS51dWlkXSk7XG4gICAgICAgICAgICBpZiAoIWRlc3ROb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJ5Y+v55So55qEXG4gICAgICAgICAgICAgICAgY29uc3QgbXNnID0gRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuY2FuTm90UGFzdGUnLCB7IHV1aWQgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmluYWxseUNhblBhc3RlOiBzdHJpbmdbXSA9IFtdOyAvLyDmnIDlkI7lj6/lpI3liLbnmoTpoblcbiAgICAgICAgY29waWVkVXVpZHM/LmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6IqC54K55Y+v5aSN5Yi2XG4gICAgICAgICAgICBjb25zdCBjYW5Db3B5ID0gIXV0aWxzLmNhbk5vdENvcHkoYXNzZXQpO1xuICAgICAgICAgICAgaWYgKCFjYW5Db3B5KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FybiA9IGAke0VkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNvcHlGYWlsJyl9OiAke2Fzc2V0Lm5hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4od2Fybik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS4jeaYr+atpOebruagh+iKgueCueeahOeItuiKgueCue+8iOS4jeWcqOWug+eahOS4iue6p+aWh+S7tuWkuemHjO+8iVxuICAgICAgICAgICAgY29uc3QgaW5zaWRlID0gdXRpbHMuaXNBSW5jbHVkZUIodXVpZCwgZGVzdE5vZGUudXVpZCk7XG4gICAgICAgICAgICBpZiAoaW5zaWRlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FybiA9IGAke0VkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmVycm9yUGFzdGVQYXJlbnRUb0NoaWxkJyl9OiAke2Fzc2V0Lm5hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4od2Fybik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYW5Db3B5ICYmICFpbnNpZGUpIHtcbiAgICAgICAgICAgICAgICBmaW5hbGx5Q2FuUGFzdGUucHVzaCh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmaW5hbGx5Q2FuUGFzdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBsZXQgYXNzZXQ7XG4gICAgICAgIGxldCBuZXdBc3NldDogSUFzc2V0SW5mbyB8IG51bGw7XG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIC8vIOaYvuekuiBsb2FkaW5nIOaViOaenFxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgdHJlZURhdGEudW5GcmVlemUoZGVzdE5vZGUudXVpZCk7XG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgIHZtLnRvZ2dsZShkZXN0Tm9kZS51dWlkLCB0cnVlKTtcblxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBhc3NldCA9IHV0aWxzLmdldEFzc2V0KGZpbmFsbHlDYW5QYXN0ZVtpbmRleF0pO1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIG5ld0Fzc2V0ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGJhc2VuYW1lKGFzc2V0LnVybCk7XG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9IGAke2Rlc3ROb2RlLnVybH0vJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLXVybCcsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgbmV3QXNzZXQgPSAoYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY29weS1hc3NldCcsIGFzc2V0LnVybCwgdGFyZ2V0KSkgYXMgSUFzc2V0SW5mbyB8IG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZiAobmV3QXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSBuZXdBc3NldC51dWlkO1xuICAgICAgICAgICAgICAgICAgICBuZXdTZWxlY3RzLnB1c2gobmV3QXNzZXQudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlIChuZXdBc3NldCk7XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbZGVzdE5vZGUudXVpZF0gPSAnJztcblxuICAgICAgICAvLyDpgInkuK3mlrDnmoTpobnnm65cbiAgICAgICAgdm0uaXBjU2VsZWN0KG5ld1NlbGVjdHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Ymq5YiH5piv6aKE5a6a55qE6KGM5Li677yM5Y+q5pyJ5YaN5omn6KGM57KY6LS05pON5L2c5omN5Lya55Sf5pWIXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY3V0KHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGN1dHMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGN1dHMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXVpZCDmmK8g5a2X56ymXG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gW3V1aWRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/liarliIfnmoToioLngrlcbiAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3RDdXQoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY3V0VXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bCG5Ymq5YiH55qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAgICBjb25zdCBjdXRJbmZvOiBJQ29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGN1dFV1aWRzKTtcbiAgICAgICAgLy8g5bCG5Ymq5YiH6IqC54K555qEIHV1aWQg5a2Y5pS+5Yiw57uf5LiA55qE5Ymq5YiH5p2/XG4gICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ2Fzc2V0cy1jdXQtaW5mbycsIGN1dEluZm8pO1xuXG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5bCG5aSN5Yi2L+WJquWIh+eahCB1dWlkcyDlpITnkIbmiJDliarliIfmnb/nmoTlr7nosaHnsbvlnotcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB1dWlkc1xuICAgICAqIEByZXR1cm4geyp9ICB7SUNvcGllZEluZm99XG4gICAgICovXG4gICAgdXVpZHNUb0NvcGllZEluZm8odXVpZHM6IHN0cmluZ1tdKTogSUNvcGllZEluZm8ge1xuICAgICAgICBjb25zdCBjb3BpZWRJbmZvID0gPElDb3BpZWRJbmZvPnt9O1xuICAgICAgICBjb3BpZWRJbmZvLnByb2plY3RQYXRoID0gRWRpdG9yLlByb2plY3QucGF0aDtcbiAgICAgICAgY29waWVkSW5mby5hc3NldEluZm8gPSBbXTtcbiAgICAgICAgdXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldDogSUFzc2V0SW5mbyB8IG51bGwgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZEFzc2V0SW5mbzogSUNvcGllZEFzc2V0SW5mbyA9IHtcbiAgICAgICAgICAgICAgICB1dWlkOiBhc3NldCA/IGFzc2V0LnV1aWQgOiAnJyxcbiAgICAgICAgICAgICAgICBmaWxlOiBhc3NldCA/IGFzc2V0LmZpbGUgOiAnJyxcbiAgICAgICAgICAgICAgICBuYW1lOiBhc3NldCA/IGFzc2V0Lm5hbWUgOiAnJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3BpZWRJbmZvLmFzc2V0SW5mby5wdXNoKGNvcGllZEFzc2V0SW5mbyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY29waWVkSW5mbztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItui1hOa6kO+8jOW5s+e6p1xuICAgICAqIEBwYXJhbSB1dWlkcyDotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBkdXBsaWNhdGUodXVpZHM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dWlkcykge1xuICAgICAgICAgICAgdXVpZHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb3BpZWRVdWlkcyA9IHV1aWRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3REdXBsaWNhdGUoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY29waWVkVXVpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBjb3BpZWRVdWlkcykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHZtLnBhc3RlKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0sIFt1dWlkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOenu+WKqCDotYTmupBcbiAgICAgKiBAcGFyYW0gZHJhZ0luZm8g5L+h5oGvXG4gICAgICogQHBhcmFtIHRvQXNzZXQg56e75Yqo55uu55qE5Zyw6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgbW92ZShkcmFnSW5mbzogSURyYWdJbmZvLCB0b0Fzc2V0OiBJQXNzZXRJbmZvKSB7XG4gICAgICAgIGlmICghZHJhZ0luZm8gfHwgIXRvQXNzZXQgfHwgIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uYWRkaXRpb25hbCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWxleW8gOebruagh+aWh+S7tuWkuVxuICAgICAgICB2bS50b2dnbGUodG9Bc3NldC51dWlkLCB0cnVlKTtcblxuICAgICAgICBjb25zdCB1dWlkcyA9IGRyYWdJbmZvLmFkZGl0aW9uYWwubWFwKChpbmZvOiBJRHJhZ0FkZGl0aW9uYWwpID0+IGluZm8udmFsdWUuc3BsaXQoJ0AnKVswXSk7XG5cbiAgICAgICAgLy8g5aSa6LWE5rqQ56e75Yqo77yM5qC55o2u546w5pyJ5o6S5bqP55qE6aG65bqP5omn6KGMXG4gICAgICAgIHV1aWRzLnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhSW5kZXggPSB0cmVlRGF0YS51dWlkVG9JbmRleFthXTtcbiAgICAgICAgICAgIGNvbnN0IGJJbmRleCA9IHRyZWVEYXRhLnV1aWRUb0luZGV4W2JdO1xuICAgICAgICAgICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgdXVpZHNMZW5ndGggPSB1dWlkcy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHV1aWRzW2ldO1xuXG4gICAgICAgICAgICBpZiAodmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmcm9tQXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghZnJvbUFzc2V0IHx8ICFmcm9tUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b0Fzc2V0LnV1aWQgPT09IGZyb21Bc3NldC51dWlkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5jYW5Ob3RDdXQoZnJvbUFzc2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0b0Fzc2V0IOaYryBmcm9tQXNzZXQg55qE5a2Q6ZuG77yM5omA5Lul54i25LiN6IO956e75Yiw5a2Q6YeM6Z2iXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNBSW5jbHVkZUIoZnJvbUFzc2V0LnV1aWQsIGRyYWdJbmZvLnRvKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDotYTmupDnp7vliqjku43lnKjljp/mnaXnmoTnm67lvZXlhoXvvIzkuI3pnIDopoHnp7vliqhcbiAgICAgICAgICAgIGlmICh0b0Fzc2V0LnV1aWQgPT09IGZyb21QYXJlbnQudXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXNrczogQXJyYXk8UHJvbWlzZTxBc3NldEluZm8gfCBudWxsPj4gPSBbXTtcblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzTGVuZ3RoID0gdmFsaWRVdWlkcy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Bc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgZnJvbVBhcmVudCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tQXNzZXQgfHwgIWZyb21QYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g56e75Yqo6LWE5rqQXG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IGZyb21Bc3NldC51dWlkO1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB0b0Fzc2V0LnVybCArICcvJyArIGJhc2VuYW1lKGZyb21Bc3NldC51cmwpO1xuXG4gICAgICAgICAgICAvLyDlrp7kvovljJbomZrmi5/otYTmupBcbiAgICAgICAgICAgIGlmIChmcm9tQXNzZXQuaW5zdGFudGlhdGlvbikge1xuICAgICAgICAgICAgICAgIHRhc2tzLnB1c2goRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnaW5pdC1hc3NldCcsIGZyb21Bc3NldC51cmwsIHRhcmdldCkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXNrcy5wdXNoKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ21vdmUtYXNzZXQnLCBmcm9tQXNzZXQudXJsLCB0YXJnZXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDpgInkuK3np7vliqjpoblcbiAgICAgICAgdm0uaXBjU2VsZWN0KHZhbGlkVXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YeN5paw5a+85YWl6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgcmVpbXBvcnQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBzZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4rVxuICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgc2VsZWN0cyA9IFt1dWlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgbGV0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBzZWxlY3RzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCB1dGlscy5jYW5Ob3RSZWltcG9ydChhc3NldCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIC8vIOehruS/nSAxLzLvvJogdmFsaWRVdWlkcyDph4zpnaLku7vkuIDotYTmupDpg73kuI3mmK8gdXVpZCDnmoTomZrmi5/lrZDotYTmupBcbiAgICAgICAgICAgICAgICB2YWxpZFV1aWRzID0gdmFsaWRVdWlkcy5maWx0ZXIoKHZhbGlkVXVpZCkgPT4gIXV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIHZhbGlkVXVpZCkpO1xuXG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIDIvMu+8miB2YWxpZFV1aWRzIOmHjOeahOS7u+S4gOi1hOa6kOmDveS4jeaYryB1dWlkIOeahOeItui1hOa6kFxuICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5zb21lKCh2YWxpZFV1aWQpID0+IHV0aWxzLmlzQUluY2x1ZGVCKHZhbGlkVXVpZCwgdXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyhjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXZhbGlkVXVpZHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWinuWKoOmHjeWvvOS4reeahCBsb2FkaW5nIOeVjOmdouaViOaenFxuICAgICAgICBmb3IgKGNvbnN0IHZhbGlkVXVpZCBvZiB2YWxpZFV1aWRzKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt2YWxpZFV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodmFsaWRVdWlkKTtcbiAgICAgICAgfVxuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHZhbGlkVXVpZCBvZiB2YWxpZFV1aWRzKSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWltcG9ydC1hc3NldCcsIHZhbGlkVXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5qCR5b2i5pWw5o2u5bey5pS55Y+YXG4gICAgICog5aaC6LWE5rqQ5aKe5Yig5pS577yM5piv6L6D5aSn55qE5Y+Y5Yqo77yM6ZyA6KaB6YeN5paw6K6h566X5ZCE5Liq6YWN5aWX5pWw5o2uXG4gICAgICog5aKe5YqgIHNldFRpbWVPdXQg5piv5Li65LqG5LyY5YyW5p2l6Ieq5byC5q2l55qE5aSa5qyh6Kem5Y+RXG4gICAgICovXG4gICAgcmVuZGVyKCkge1xuICAgICAgICAvLyDlrrnlmajnmoTmlbTkvZPpq5jluqZcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwudHJlZUhlaWdodCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGggKiBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0O1xuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFsbEV4cGFuZCA9IHZtLmlzQWxsRXhwYW5kKCk7XG5cbiAgICAgICAgLy8g6YeN5paw5riy5p+T5Ye65qCR5b2iXG4gICAgICAgIHZtLmZpbHRlckFzc2V0cygpO1xuXG4gICAgICAgIHdoaWxlIChwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWR5VHdpbmtsZSA9IHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZChyZWFkeVR3aW5rbGUudXVpZCwgcmVhZHlUd2lua2xlLmFuaW1hdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmHjeaWsOa4suafk+agkeW9olxuICAgICAqIHZtLmFzc2V0cyDkuLrlvZPliY3mmL7npLrnmoTpgqPlh6DkuKroioLngrnmlbDmja5cbiAgICAgKi9cbiAgICBmaWx0ZXJBc3NldHMoKSB7XG4gICAgICAgIHZtLmFzc2V0cyA9IFtdOyAvLyDlhYjmuIXnqbrvvIzov5nnp43otYvlgLzmnLrliLbmiY3og73liLfmlrAgdnVl77yM6ICMIC5sZW5ndGggPSAwIOS4jeihjFxuXG4gICAgICAgIGNvbnN0IHRvcCA9IHZtLnNjcm9sbFRvcCAlIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IG1pbiA9IHZtLnNjcm9sbFRvcCAtIHRvcDsgLy8g566X5Ye65Y+v6KeG5Yy65Z+f55qEIHRvcCDmnIDlsI/lgLxcbiAgICAgICAgY29uc3QgbWF4ID0gbWluICsgcGFuZWxEYXRhLiQucGFuZWwudmlld0hlaWdodDsgLy8g5pyA5aSn5YC8XG5cbiAgICAgICAgdm0uJGVsLnN0eWxlLnRvcCA9IGAtJHt0b3B9cHhgO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5yb3VuZChtaW4gLyBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgZW5kID0gTWF0aC5jZWlsKG1heCAvIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQpICsgMTtcblxuICAgICAgICB2bS5hc3NldHMgPSB0cmVlRGF0YS5vdXRwdXREaXNwbGF5KHN0YXJ0LCBlbmQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6YCJ5Lit5YiX6KGo5pWw57uE5Lit56ys5LiA5Liq6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue5Zyo5pi+56S66Zif5YiX5Lit55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgZ2V0Rmlyc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzWzBdO1xuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6YCJ5Lit5YiX6KGo5pWw57uE5Lit5pyA5ZCO5LiA5Liq6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue5Zyo5pi+56S66Zif5YiX5Lit55qE5pyA5ZCO5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgZ2V0TGFzdFNlbGVjdCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKHNlbGVjdHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBwYW5lbERhdGEuYWN0LnNlbGVjdHNbc2VsZWN0c0xlbmd0aCAtIDFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGlzcGxheUxlbmd0aCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5W2Rpc3BsYXlMZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6KeG6KeJ5LiK5qCR5b2i5LiK5LiL5YiX6KGo5Lit77yM56ys5LiA5Liq6YCJ5Lit6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue6aG25bGC5qC56IqC54K5ICdkYjovLydcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKSB7XG4gICAgICAgIGxldCB1dWlkID0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbDtcblxuICAgICAgICBjb25zdCBtaW5JbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGg7XG5cbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHNlbGVjdCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgbWluSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZCA9IHNlbGVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXVpZDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/lOWbnuagkeW9ouesrOS4gOS4quiKgueCuVxuICAgICAqIOesrOS4gOS4quiKgueCue+8jOS4jeS4gOWumuaYr+agueiKgueCue+8jOS+i+WmguWcqOaQnOe0oueahOaDheWGteS4i1xuICAgICAqL1xuICAgIGdldEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF07XG4gICAgfSxcbiAgICBpc0V4cGFuZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRyZWVEYXRhLnV1aWRUb0V4cGFuZFt1dWlkXTtcbiAgICB9LFxuICAgIGlzU2VsZWN0KHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YodXVpZCkgIT09IC0xO1xuICAgIH0sXG4gICAgZ2V0VHdpbmtsZSh1dWlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC50d2lua2xlc1t1dWlkXSA/PyAnJztcbiAgICB9LFxuICAgIGlzQWxsRXhwYW5kKCkge1xuICAgICAgICBsZXQgYWxsQ29sbGFwc2UgPSB0cnVlO1xuXG4gICAgICAgIGxldCBwYXJlbnRzID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF07XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwYXJlbnRzIHx8ICFwYXJlbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbENvbGxhcHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50c0xlbmd0aCA9IHBhcmVudHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHBhcmVudFV1aWQgPSBwYXJlbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICBpZiAocGFyZW50ICYmICdpc1BhcmVudCcgaW4gcGFyZW50ICYmICFwYXJlbnQuaXNQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyZWVEYXRhLnV1aWRUb0V4cGFuZFtwYXJlbnRVdWlkXSkge1xuICAgICAgICAgICAgICAgIGFsbENvbGxhcHNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gIWFsbENvbGxhcHNlO1xuICAgIH0sXG4gICAgaXNTZWFyY2hpbmdNb2RlKCkge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNTZWFyY2hpbmdNb2RlKCk7XG4gICAgfSxcbiAgICBhc3luYyBkaWFsb2dFcnJvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcihFZGl0b3IuSTE4bi50KGBhc3NldHMub3BlcmF0ZS4ke21lc3NhZ2V9YCksIHtcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dFcnJvcicpLFxuICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IHdhdGNoID0ge1xuICAgIC8qKlxuICAgICAqIHNjcm9sbFRvcCDlj5jljJbvvIzliLfmlrDmoJHlvaJcbiAgICAgKi9cbiAgICBzY3JvbGxUb3AoKSB7XG4gICAgICAgIHZtLmZpbHRlckFzc2V0cygpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5b2T5YmN6YCJ5Lit6aG55Y+Y5YqoXG4gICAgICovXG4gICAgYWN0aXZlQXNzZXQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFjdGl2ZUFzc2V0ID0gdm0uYWN0aXZlQXNzZXQ7XG4gICAgfSxcbn07XG5cbi8qKlxuICogdnVlIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXNzZXRzOiBbXSwgLy8g5b2T5YmN5qCR5b2i5Zyo5Y+v6KeG5Yy65Z+f55qE6LWE5rqQ6IqC54K5XG4gICAgICAgIHJlbmFtZVVybDogJycsIC8vIOmcgOimgSByZW5hbWUg55qE6IqC54K555qEIHVybO+8jOWPquacieS4gOS4qlxuICAgICAgICBhZGRJbmZvOiB7XG4gICAgICAgICAgICAvLyDmt7vliqDkuIDkuKrmlrDotYTmupDliY3nmoTmlbDmja7vvIzpnIDopoHkuovliY3ph43lkb3lkI1cbiAgICAgICAgICAgIHR5cGU6ICcnLFxuICAgICAgICAgICAgaW1wb3J0ZXI6ICcnLFxuICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICBmaWxlRXh0OiAnJyxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAnJyxcbiAgICAgICAgICAgIHBhcmVudERpcjogJycsXG4gICAgICAgIH0sXG4gICAgICAgIGludG9WaWV3QnlTZWxlY3RlZDogJycsIC8vIOaUtuWIsOmAieS4rSBpcGMg6ZyA6KaB5a6a5L2N5pi+56S655qE6LWE5rqQXG4gICAgICAgIGludG9WaWV3QnlVc2VyOiAnJywgLy8g55So5oi35pON5L2c55qE5paw5aKe56e75Yqo6LWE5rqQ77yM57uZ5LqI5a6a5L2NXG4gICAgICAgIHNjcm9sbFRvcDogMCwgLy8g5b2T5YmN5qCR5b2i55qE5rua5Yqo5pWw5o2uXG4gICAgICAgIGRyb3BwYWJsZVR5cGVzOiBbXSxcbiAgICAgICAgY2hlY2tTaGlmdFVwRG93bk1lcmdlOiB7IHV1aWQ6ICcnLCBkaXJlY3Rpb246ICcnIH0sIC8vIHNoaWZ0ICsg566t5aS05aSa6YCJ77yM5aKe5by65Lqk5LqS5pWI5p6cXG4gICAgfTtcbn1cblxuLyoqXG4gKiB2bSA9IHRoaXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vdW50ZWQoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHZtID0gdGhpcztcblxuICAgIC8vIOWvueS6juWtkOmbhueahOWPmOWKqO+8jOacgOWQjuS4gOS4qiBpcGMg5raI5oGv5Y+R55qE5piv54i257qn5paH5Lu25aS555qE5Y+Y5Yqo77yM6L+Z5LiN6ZyA6KaB5pi+56S65Ye65p2l77yM5omA5Lul5YGa5LqG6K6w5b2V5YeG5aSH5b+955WlXG4gICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzID0ge307XG59XG4iXX0=