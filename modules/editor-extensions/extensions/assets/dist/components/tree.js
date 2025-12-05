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
exports.mounted = exports.data = exports.watch = exports.methods = exports.components = exports.template = exports.name = void 0;
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
        vm.droppableTypes = vm.$parent.droppableTypes.concat(panelData.config.assetTypes());
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
            if (!parent.isParent) {
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
            if (!parent.isParent) {
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
                let detail = repeatFiles.map((v) => v.name).slice(0, 5).join('\n');
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
        }
        if (!parent) {
            // 没有可用的
            return;
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
    isTwinkle(uuid) {
        return panelData.act.twinkles[uuid];
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
            if (parent && !parent.isParent) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZWIsK0JBQXNDO0FBQ3RDLDJCQUE4QztBQUM5Qyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUU1Qix1QkFBdUI7QUFDdkIsSUFBSSxZQUFpQixDQUFDO0FBQ3RCLElBQUksY0FBbUIsQ0FBQztBQUN4QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxnQkFBcUIsQ0FBQztBQUViLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUVkLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXBGLFFBQUEsVUFBVSxHQUFHO0lBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDO0NBQ3RDLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixFQUFFLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFFcEYsYUFBYTtRQUNiLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUMxQixFQUFFLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztJ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QztBQUMvQixDQUFDO0FBTkQsMEJBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7XG4gICAgSUNyZWF0ZU9wdGlvbixcbiAgICBJQWRkSW5mbyxcbiAgICBJQXNzZXRJbmZvLFxuICAgIERyb3BDYWxsYmFja0luZm8sXG4gICAgSURyYWdJbmZvLFxuICAgIElEcmFnQWRkaXRpb25hbCxcbiAgICBBc3NldEluZm8sXG4gICAgSUNvcGllZEluZm8sXG4gICAgSUNvcGllZEFzc2V0SW5mbyxcbiAgICBJUmVwZWF0RmlsZSxcbn0gZnJvbSAnLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgeyBiYXNlbmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGFuZWxEYXRhIGZyb20gJy4vcGFuZWwtZGF0YSc7XG5pbXBvcnQgKiBhcyB0cmVlRGF0YSBmcm9tICcuL3RyZWUtZGF0YSc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL3V0aWxzJztcblxubGV0IHZtOiBhbnkgPSBudWxsO1xubGV0IHJlcXVlc3RBbmltYXRpb25JZDogYW55O1xuXG4vLyDnlKjkuo7or4bliKsgZHJhZyDmgqzlgZzvvIzoh6rliqjlsZXlvIDmlofku7blpLlcbmxldCBkcmFnT3ZlclV1aWQ6IGFueTtcbmxldCBkcmFnT3ZlclRpbWVJZDogYW55O1xubGV0IHNlbGVjdGVkVGltZUlkOiBhbnk7XG5sZXQgcmVmcmVzaGluZ1RpbWVJZDogYW55O1xuXG5leHBvcnQgY29uc3QgbmFtZSA9ICd0cmVlJztcblxuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0gcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vc3RhdGljL3RlbXBsYXRlL3RyZWUuaHRtbCcpLCAndXRmOCcpO1xuXG5leHBvcnQgY29uc3QgY29tcG9uZW50cyA9IHtcbiAgICAndHJlZS1ub2RlJzogcmVxdWlyZSgnLi90cmVlLW5vZGUnKSxcbn07XG5cbmV4cG9ydCBjb25zdCBtZXRob2RzID0ge1xuICAgIC8qKlxuICAgICAqIOe/u+ivkVxuICAgICAqIEBwYXJhbSBrZXkg5LiN5bim6Z2i5p2/5ZCN56ew55qE5qCH6K6w5a2X56ymXG4gICAgICovXG4gICAgdChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBwYW5lbERhdGEuJC5wYW5lbC50KGtleSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlpJbpg6jmlbDmja7mm7TmlrDlkI7vvIzmm7TmlrDlhoXpg6jmlbDmja5cbiAgICAgKi9cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHZtLmRyb3BwYWJsZVR5cGVzID0gdm0uJHBhcmVudC5kcm9wcGFibGVUeXBlcy5jb25jYXQocGFuZWxEYXRhLmNvbmZpZy5hc3NldFR5cGVzKCkpO1xuXG4gICAgICAgIC8vIOa4heepuuaWsOW7uuaIlumHjeWRveWQjeeKtuaAgVxuICAgICAgICB2bS5hZGRJbmZvLnBhcmVudERpciA9ICcnO1xuICAgICAgICB2bS5yZW5hbWVVcmwgPSAnJztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa4heepuuagkeW9olxuICAgICAqL1xuICAgIGNsZWFyKCkge1xuICAgICAgICB0cmVlRGF0YS5jbGVhcigpO1xuICAgICAgICB2bS5yZW5kZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIt+aWsOagkeW9olxuICAgICAqIEBwYXJhbSB0eXBlIOaYr+WQpumHjee9ruaVsOaNrlxuICAgICAqIEBwYXJhbSBuYW1lIGlwYyDliqjkvZznmoTlkI3np7BcbiAgICAgKi9cbiAgICByZWZyZXNoaW5nKHR5cGU6IHN0cmluZywgbmFtZTogc3RyaW5nLCB1dWlkPzogc3RyaW5nKSB7XG4gICAgICAgIGlmICh1dWlkICYmIHZtLnJlZnJlc2hpbmcuaWdub3Jlc1t1dWlkXSkge1xuICAgICAgICAgICAgZGVsZXRlIHZtLnJlZnJlc2hpbmcuaWdub3Jlc1t1dWlkXTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnJlZnJlc2hpbmcgPSB7IHR5cGUsIG5hbWUgfTtcblxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHJlZnJlc2hpbmdUaW1lSWQpO1xuICAgICAgICByZWZyZXNoaW5nVGltZUlkID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgLy8g5o+Q56S65raI5aSxXG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5yZWZyZXNoaW5nLnR5cGUgPSAnJztcbiAgICAgICAgICAgIHZtLnJlZnJlc2hpbmcuaWdub3JlcyA9IHt9O1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCueeahOaKmOWPoC/lsZXlvIDliIfmjaJcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gZXhwYW5kICDmmK/lkKblsZXlvIBcbiAgICAgKiBAcGFyYW0gbG9vcCAg5oyJ5L2PIEFsdCDplK7lj6/ov5vlhaXlrZDoioLngrnlvqrnjq9cbiAgICAgKi9cbiAgICB0b2dnbGUodXVpZDogc3RyaW5nLCBleHBhbmQ/OiBib29sZWFuLCBsb29wPzogYm9vbGVhbikge1xuICAgICAgICBpZiAobG9vcCkge1xuICAgICAgICAgICAgdHJlZURhdGEubG9vcEV4cGFuZCh1dWlkLCBleHBhbmQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJlZURhdGEudG9nZ2xlRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIpOaWreS4i+S4quWKqOS9nOaYr+aUtui1t+i/mOaYr+WxleW8gCDvvIjlvZPlrZjlnKjkuI3lkIznirbmgIHnmoTmlofku7blpLnml7bvvIzop4bkuLrmlLbotbfjgILlvZPnirbmgIHnm7jlkIzvvIzlj5blj43ljbPlj6/jgILvvIlcbiAgICAgKiBAcGFyYW0gcGFyZW50c1xuICAgICAqIEByZXR1cm5zIGJvb2xlYW5cbiAgICAgKi9cbiAgICBuZXh0VG9nZ2xlRXhwYW5kKHBhcmVudHM6IGFueVtdKTogYm9vbGVhbiB7XG4gICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTsgLy8g6buY6K6k5Li65pS26LW3XG4gICAgICAgIC8vIOagueaNruinhOWIme+8jOmCo+S5iOWPquacieW9k+WFqOmDqOmDveS4uuaUtui1t+eahOaXtuWAme+8jOmcgOimgeWxleW8gOeahOaTjeS9nFxuICAgICAgICBjb25zdCBpc0FsbENsb3NlID0gcGFyZW50cy5ldmVyeSgocGFyZW50SUQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRyZWVEYXRhLnV1aWRUb0Fzc2V0W3BhcmVudElEXTtcbiAgICAgICAgICAgIGlmICghcGFyZW50LmlzUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50SUQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3BhcmVudElEXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAhdHJlZURhdGEudXVpZFRvRXhwYW5kW3BhcmVudElEXTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpc0FsbENsb3NlKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlhajpg6joioLngrnmipjlj6DmiJblsZXlvIBcbiAgICAgKi9cbiAgICBhbGxUb2dnbGUoKSB7XG4gICAgICAgIGxldCBwYXJlbnRzID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF07XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50c0xlbmd0aCA9IHBhcmVudHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXBhcmVudHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4cGFuZCA9IHZtLm5leHRUb2dnbGVFeHBhbmQocGFyZW50cyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHBhcmVudHNbaV07XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9Bc3NldFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIGlmICghcGFyZW50LmlzUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHBhcmVudFV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmAiVxuICAgICAqIEBwYXJhbSB1dWlkIOWFqOmAieivpeebruagh+iKgueCueS4i+eahOWtkOiKgueCuVxuICAgICAqL1xuICAgIHNlbGVjdEFsbCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgLy8g5pG457Si5qih5byP5LiL77yM5YWo6YCJ5Li65b2T5YmN5YiX6KGoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHRyZWVEYXRhLmRpc3BsYXlBcnJheSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHV1aWQgfHwgdm0uZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCk7XG5cbiAgICAgICAgaWYgKCF0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltwYXJlbnRVdWlkXSkge1xuICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDojrflj5blt7LlsZXlvIDnmoTlrZDoioLngrlcbiAgICAgICAgY29uc3QgY2hpbGRyZW5VdWlkOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICB1dGlscy5nZXRDaGlsZHJlblV1aWQocGFyZW50VXVpZCwgY2hpbGRyZW5VdWlkLCB0cnVlKTtcblxuICAgICAgICBjb25zdCBjbG9uZVNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgY29uc3QgcGFyZW50SW4gPSBjbG9uZVNlbGVjdHMuaW5jbHVkZXMocGFyZW50VXVpZCk7XG5cbiAgICAgICAgbGV0IGNoaWxkcmVuQWxsSW4gPSB0cnVlO1xuICAgICAgICBjb25zdCBjaGlsZHJlblV1aWRMZW5ndGggPSBjaGlsZHJlblV1aWQubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVXVpZExlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhjaGlsZHJlblV1aWRbaV0pKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW5BbGxJbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoaWxkcmVuQWxsSW4pIHtcbiAgICAgICAgICAgIGlmICghcGFyZW50SW4pIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5b6A5LiK5LiA5bGCXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudFV1aWQgIT09IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uc2VsZWN0QWxsKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgICAgICBpZiAocGFyZW50SW4pIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlblV1aWQudW5zaGlmdChwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBjaGlsZHJlblV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBjaGlsZHJlblV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZWxlY3RDbGVhcigpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkcyBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAqL1xuICAgIHNlbGVjdGVkKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2godXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5U2VsZWN0ZWQgPSB1dWlkO1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChzZWxlY3RlZFRpbWVJZCk7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlTZWxlY3RlZCk7XG4gICAgICAgICAgICAgICAgfSwgNTApO1xuXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+lIHNoaWZ0IOWkmumAieeahOWKqOS9nFxuICAgICAgICAgICAgICAgIGlmICh1dWlkID09PSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5zaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFsbEV4cGFuZCA9IHZtLmlzQWxsRXhwYW5kKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICB1bnNlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBpbmRleCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgICAgIHNlbGVjdGVkVGltZUlkID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZtLmludG9WaWV3QnlTZWxlY3RlZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVNlbGVjdGVkID0gJyc7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaBouWkjemAieS4reeKtuaAgVxuICAgICAqL1xuICAgIHJlc2V0U2VsZWN0ZWQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cyA9IFtdO1xuICAgICAgICBjb25zdCB1dWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ2Fzc2V0Jyk7XG4gICAgICAgIHZtLnNlbGVjdGVkKHV1aWRzKTtcblxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVNlbGVjdGVkLCB0cnVlKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsgY2xpY2sg5aSa6YCJXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgc2hpZnRDbGljayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBkaXNwbGF5QXJyYXkgfSA9IHRyZWVEYXRhO1xuXG4gICAgICAgIGNvbnN0IGZpcnN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZihwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF0pO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoZmlyc3RJbmRleCAhPT0gLTEgfHwgbGFzdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGZpcnN0SW5kZXggPD0gbGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZpcnN0SW5kZXg7IGkgPD0gbGFzdEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0cy5wdXNoKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA+PSBsYXN0SW5kZXg7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2bS5pcGNTZWxlY3Qoc2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBjdHJsICsgY2xpY2sg6YCJ5Lit5oiW5Y+W5raI6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY3RybENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhc3NldCcsIHV1aWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkcyDotYTmupBcbiAgICAgKi9cbiAgICBpcGNTZWxlY3QodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHV1aWRzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reagkeW9ouS4iueahOesrOS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGlwY1NlbGVjdEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgIGNvbnN0IHV1aWQgPSB0aGlzLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnqbrnmb3lpITngrnlh7vvvIzlj5bmtojpgInkuK1cbiAgICAgKi9cbiAgICBjbGljaygpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yib5bu65YmN77yM5ZCN56ew5aSE55CGXG4gICAgICogQHBhcmFtIGFkZEluZm8g5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgYWRkVG8oYWRkSW5mbzogSUFkZEluZm8pIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAzMDApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYWRkSW5mby51dWlkKSB7XG4gICAgICAgICAgICBhZGRJbmZvLnV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6Ieq6Lqr5oiW54i257qn5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZShhZGRJbmZvLnV1aWQpO1xuXG4gICAgICAgIC8vIHBhcmVudCDkuI3lrZjlnKjmiJblpITkuo7lhbbku5bnirbmgIHvvIzkuI3pgILlkIjliJvlu7pcbiAgICAgICAgaWYgKCFwYXJlbnQgfHwgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsZXlvIDniLbnuqfoioLngrlcbiAgICAgICAgdm0udG9nZ2xlKHBhcmVudC51dWlkLCB0cnVlKTtcblxuICAgICAgICAvLyDmu5rliqjliLDpobblsYLop4bnqpdcbiAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcocGFyZW50LnV1aWQpO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudERpciA9IHBhcmVudC51cmw7XG4gICAgICAgIGxldCBmaWxlTmFtZSA9IGFkZEluZm8uZmlsZU5hbWUgfHwgJ05ldyBGaWxlJztcbiAgICAgICAgbGV0IGZpbGVFeHQgPSBgLiR7YWRkSW5mby50eXBlfWA7XG5cbiAgICAgICAgY29uc3QgY2FtZWxGb3JtYXRSZWcgPSAvQGNjY2xhc3MoW148XSopKDwlQ2FtZWxDYXNlQ2xhc3NOYW1lJT4pLztcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lRm9ybWF0UmVnID0gL0BjY2NsYXNzXFwoWydcIl0oW14nXCJdKilbJ1wiXVxcKS87XG4gICAgICAgIGNvbnN0IGNvbW1lbnRzUmVnID0gLyhcXG5bXlxcbl0qXFwvXFwqW1xcc1xcU10qP1xcKlxcLyl8KFxcblteXFxuXSpcXC9cXC8oPzpbXlxcclxcbl18XFxyKD8hXFxuKSkqKS9nOyAvLyDms6jph4rljLrln5/ov57lkIzov57nu63nmoTnqbrooYxcblxuICAgICAgICBzd2l0Y2ggKGFkZEluZm8udHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnZGlyZWN0b3J5JzpcbiAgICAgICAgICAgICAgICBmaWxlRXh0ID0gJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0cyc6XG4gICAgICAgICAgICBjYXNlICdqcyc6IHtcbiAgICAgICAgICAgICAgICBpZiAoIWFkZEluZm8uY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSAnJztcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXJsID0gYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHthZGRJbmZvLnRlbXBsYXRlIHx8IGFkZEluZm8udHlwZX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGZpbGVVdWlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHZtLnQoJ3JlYWREZWZhdWx0RmlsZUZhaWwnKSwgZmlsZVVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmlbTnkIblubbor4bliKvmqKHmnb/mlbDmja5cbiAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSBhZGRJbmZvLmNvbnRlbnQucmVwbGFjZShjb21tZW50c1JlZywgKCQwOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQwLmluY2x1ZGVzKCdDT01NRU5UU19HRU5FUkFURV9JR05PUkUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQwO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8g6K+G5Yir5piv5ZCm5ZCv55So6am85bOw5qC85byP55qE57G75ZCNXG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5yZXF1aXJlZENhbWVsQ2FzZUNsYXNzTmFtZSA9IGNhbWVsRm9ybWF0UmVnLnRlc3QoYWRkSW5mby5jb250ZW50KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVNYXRjaGVzID0gYWRkSW5mby5jb250ZW50Lm1hdGNoKGNsYXNzTmFtZUZvcm1hdFJlZyk7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5jbGFzc05hbWVTdHJpbmdGb3JtYXQgPSBuYW1lTWF0Y2hlcyAmJiBuYW1lTWF0Y2hlc1sxXSA/IG5hbWVNYXRjaGVzWzFdIDogJyc7XG5cbiAgICAgICAgICAgICAgICBmaWxlTmFtZSA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuZ2V0VmFsaWRGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmnIDlkI7ku6Xov5nkuKogdXJsIOaVsOaNruS4uuWHhlxuICAgICAgICBsZXQgdXJsID0gYCR7cGFyZW50RGlyfS8ke2ZpbGVOYW1lfSR7ZmlsZUV4dH1gO1xuICAgICAgICB1cmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgdXJsKTtcblxuICAgICAgICB2bS5hZGRJbmZvID0ge1xuICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgdHlwZTogYWRkSW5mby50eXBlLFxuICAgICAgICAgICAgaW1wb3J0ZXI6IGFkZEluZm8uaW1wb3J0ZXIsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYWRkSW5mby50ZW1wbGF0ZSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGFkZEluZm8uY29udGVudCxcbiAgICAgICAgICAgIGZpbGVFeHQsXG4gICAgICAgICAgICBmaWxlTmFtZTogYmFzZW5hbWUodXJsLCBmaWxlRXh0KSxcbiAgICAgICAgICAgIG5hbWU6IGJhc2VuYW1lKHVybCksXG4gICAgICAgICAgICBwYXJlbnREaXIsXG4gICAgICAgICAgICBwYXJlbnRVdWlkOiBwYXJlbnQudXVpZCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQjeensOWhq+WGmeWQjuaPkOS6pOWIsOi/memHjFxuICAgICAqIEBwYXJhbSBhZGRJbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGFkZENvbmZpcm0oYWRkSW5mbz86IElBZGRJbmZvKSB7XG4gICAgICAgIC8vIOaVsOaNrumUmeivr+aXtuWPlua2iFxuICAgICAgICBpZiAoIWFkZEluZm8gfHwgIWFkZEluZm8ucGFyZW50RGlyIHx8ICFhZGRJbmZvLnBhcmVudFV1aWQgfHwgIWFkZEluZm8uZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vIOaWsOWinueahOi+k+WFpeahhua2iOWksVxuICAgICAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEluZm8ubmFtZSA9IGFkZEluZm8uZmlsZU5hbWUgKyBhZGRJbmZvLmZpbGVFeHQ7XG5cbiAgICAgICAgLy8g6Ieq6Lqr5oiW54i257qn5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZShhZGRJbmZvLnBhcmVudFV1aWQpO1xuICAgICAgICAvLyDniLbnuqfkuI3lj6/mlrDlu7rotYTmupBcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDms6jmhI/vvJrmhY7ph43kv67mlLnmraTpu5jorqTlgLxcbiAgICAgICAgICogY29udGVudCDnsbvlnovlj6/ku6XkuLogbnVsbCwgc3RyaW5nLCBidWZmZXJcbiAgICAgICAgICog6buY6K6kIG51bGwg5piv57uZ5paH5Lu25aS55L2/55So55qEXG4gICAgICAgICAqL1xuICAgICAgICBsZXQgY29udGVudDogYW55ID0gbnVsbDtcblxuICAgICAgICBpZiAoYWRkSW5mby50eXBlICE9PSAnZGlyZWN0b3J5Jykge1xuICAgICAgICAgICAgY29udGVudCA9IGFkZEluZm8uY29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7YWRkSW5mby50ZW1wbGF0ZSB8fCBhZGRJbmZvLnR5cGV9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgIGlmIChmaWxlVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBmaWxlVXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3Iodm0udCgncmVhZERlZmF1bHRGaWxlRmFpbCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoWyd0cycsICdqcyddLmluY2x1ZGVzKGFkZEluZm8udHlwZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZCA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuaXNWYWxpZChhZGRJbmZvLmZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsaWQuc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih2bS50KHZhbGlkLnN0YXRlKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB1c2VEYXRhID0gYXdhaXQgRWRpdG9yLlVzZXIuZ2V0RGF0YSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VDb250ZW50czogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBVbmRlcnNjb3JlQ2FzZUNsYXNzTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgQ2FtZWxDYXNlQ2xhc3NOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2FtZWxDYXNlQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBEYXRlVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yOiB1c2VEYXRhLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgICAgICBGaWxlQmFzZW5hbWU6IGFkZEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgRmlsZUJhc2VuYW1lTm9FeHRlbnNpb246IGFkZEluZm8uZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFVSTDogYCR7YWRkSW5mby5wYXJlbnREaXJ9LyR7YWRkSW5mby5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvclZlcnNpb246IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgTWFudWFsVXJsOiBFZGl0b3IuQXBwLnVybHMubWFudWFsLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMocmVwbGFjZUNvbnRlbnRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShuZXcgUmVnRXhwKGA8JSR7a2V5fSU+YCwgJ2cnKSwgcmVwbGFjZUNvbnRlbnRzW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdID0gJ2FkZC1sb2FkaW5nJztcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IGAke2FkZEluZm8ucGFyZW50RGlyfS8ke2FkZEluZm8uZmlsZU5hbWV9JHthZGRJbmZvLmZpbGVFeHR9YDtcbiAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IHZtLmFkZCh1cmwsIGNvbnRlbnQpO1xuXG4gICAgICAgIC8vIOaWsOW7uuWQjOWQjeaWh+S7tuaXtueCueWPlua2iOS8mui/lOWbniBudWxsXG4gICAgICAgIGlmICghdXVpZCl7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtwYXJlbnQudXVpZF0gPSAnJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHBhcmVudC51dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICB9LCAyMDApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pyA5ZCO5Y+R6LW3IGlwYyDliJvlu7rotYTmupBcbiAgICAgKiBAcGFyYW0gdXJsIOebruagh+S9jee9rlxuICAgICAqIEBwYXJhbSBjb250ZW50IOWhq+WFheWGheWuuVxuICAgICAqIEBwYXJhbSBvcHRpb24g5Y+v6YCJ6YWN572uXG4gICAgICovXG4gICAgYXN5bmMgYWRkKHVybDogc3RyaW5nLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcgfCBudWxsLCBvcHRpb24/OiBJQ3JlYXRlT3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gKGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldCcsIHVybCwgY29udGVudCwge1xuICAgICAgICAgICAgb3ZlcndyaXRlOiBvcHRpb24/Lm92ZXJ3cml0ZSxcbiAgICAgICAgfSkpIGFzIElBc3NldEluZm87XG5cbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICB2bS5pcGNTZWxlY3QoYXNzZXQudXVpZCk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KGFzc2V0LnV1aWQpO1xuICAgICAgICAgICAgfSwgMzAwKTtcblxuICAgICAgICAgICAgcmV0dXJuIGFzc2V0LnV1aWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaUtuWIsCBpcGMg5raI5oGvIGFzc2V0LWRiOmFzc2V0LWFkZFxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqIEBwYXJhbSBpbmZvIOaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIGFkZGVkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLnB1c2goeyB1dWlkLCBhbmltYXRpb246ICdzaHJpbmsnIH0pO1xuICAgICAgICB0cmVlRGF0YS5hZGRlZCh1dWlkLCBpbmZvKTtcbiAgICAgICAgdm0ucmVmcmVzaGluZygnYWRkZWQnLCBpbmZvLm5hbWUpO1xuXG4gICAgICAgIGNvbnN0IGZvbGRlclV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdO1xuICAgICAgICB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbZm9sZGVyVXVpZF0gPSB0cnVlO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pu05paw5qCR5b2i6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGluZm8g5pWw5o2uXG4gICAgICovXG4gICAgYXN5bmMgY2hhbmdlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAvLyDliKDpmaTlt7LnvJPlrZjnmoTnvKnnlaXlm75cbiAgICAgICAgdXRpbHMudGh1bWJuYWlsLmRlbGV0ZSh1dWlkKTtcblxuICAgICAgICBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5wdXNoKHsgdXVpZCwgYW5pbWF0aW9uOiAnbGlnaHQnIH0pO1xuXG4gICAgICAgIHRyZWVEYXRhLmNoYW5nZWQodXVpZCwgaW5mbyk7XG4gICAgICAgIHZtLnJlZnJlc2hpbmcoJ2NoYW5nZWQnLCBpbmZvLm5hbWUsIHV1aWQpO1xuXG4gICAgICAgIGNvbnN0IGZvbGRlclV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdO1xuICAgICAgICB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbZm9sZGVyVXVpZF0gPSB0cnVlO1xuXG4gICAgICAgIGlmICh1dWlkID09PSB2bS5pbnRvVmlld0J5VXNlcikge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW50b1ZpZXdCeVVzZXIgPSB2bS5pbnRvVmlld0J5VXNlcjtcbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9ICcnO1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KGludG9WaWV3QnlVc2VyKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGlwYyDlj5HotbfliKDpmaTotYTmupBcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBkZWxldGUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiDlpoLmnpzor6XotYTmupDmsqHmnInooqvpgInkuK3vvIzliJnlj6rmmK/liKDpmaTmraTljZXkuKpcbiAgICAgICAgICog5aaC5p6c6K+l6LWE5rqQ5piv6KKr6YCJ5Lit5LqG77yM6KGo5piO6KaB5Yig6Zmk5omA5pyJ6YCJ5Lit6aG5XG4gICAgICAgICAqL1xuICAgICAgICBsZXQgc2VsZWN0czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgaW5TZWxlY3RzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpO1xuICAgICAgICBpZiAodXVpZCAmJiAhaW5TZWxlY3RzKSB7XG4gICAgICAgICAgICBzZWxlY3RzID0gW3V1aWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIC8vIOacieaViOeahOWPr+WIoOmZpOeahOiKgueCuVxuICAgICAgICBsZXQgdmFsaWRVdWlkczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHNlbGVjdHNbaV07XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0IHx8IHV0aWxzLmNhbk5vdERlbGV0ZShhc3NldCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g56Gu5L+dIDEvMu+8miB2YWxpZFV1aWRzIOmHjOmdouS7u+S4gOiKgueCuemDveS4jeaYryB1dWlkIOeahOWtkOiKgueCuVxuICAgICAgICAgICAgdmFsaWRVdWlkcyA9IHZhbGlkVXVpZHMuZmlsdGVyKCh2YWxpZFV1aWQpID0+ICF1dGlscy5pc0FJbmNsdWRlQih1dWlkLCB2YWxpZFV1aWQpKTtcblxuICAgICAgICAgICAgLy8g56Gu5L+dIDIvMu+8miB2YWxpZFV1aWRzIOmHjOeahOS7u+S4gOiKgueCuemDveS4jeaYryB1dWlkIOeahOeItuiKgueCuVxuICAgICAgICAgICAgaWYgKCF2YWxpZFV1aWRzLnNvbWUoKHZhbGlkVXVpZCkgPT4gdXRpbHMuaXNBSW5jbHVkZUIodmFsaWRVdWlkLCB1dWlkKSkpIHtcbiAgICAgICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzTGVuZ3RoID0gdmFsaWRVdWlkcy5sZW5ndGg7XG4gICAgICAgIGlmICghdmFsaWRVdWlkc0xlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LyY5YyW5Yig6Zmk5pe255qE5YaF5a655o+Q56S6XG4gICAgICAgIGNvbnN0IHNob3dJbmRleCA9IDU7XG4gICAgICAgIGxldCBmaWxlbGlzdCA9ICcnO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB2YWxpZFV1aWQgPSB2YWxpZFV1aWRzW2ldO1xuICAgICAgICAgICAgaWYgKGkgPiBzaG93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh2YWxpZFV1aWQpO1xuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaSA8IHNob3dJbmRleCkge1xuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICs9IGAke2Fzc2V0Lm5hbWV9XFxuYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gJy4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2VkTGlzdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2V4ZWN1dGUtc2NyaXB0Jywge1xuICAgICAgICAgICAgbmFtZTogJ2Fzc2V0cycsXG4gICAgICAgICAgICBtZXRob2Q6ICdxdWVyeURlcGVuZHMnLFxuICAgICAgICAgICAgYXJnczogW3ZhbGlkVXVpZHNdLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodXNlZExpc3QgJiYgdXNlZExpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZmlsZWxpc3QgKz0gJ1xcbicgKyBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5tYXliZURlcGVuZE90aGVyJyk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDU7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghdXNlZExpc3RbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICs9IGBcXG4ke3VzZWRMaXN0W2ldfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXNlZExpc3QubGVuZ3RoID4gNSkge1xuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICs9ICdcXG4uLi4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbXNnID0gRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuc3VyZURlbGV0ZScsIHtcbiAgICAgICAgICAgIGxlbmd0aDogU3RyaW5nKHZhbGlkVXVpZHNMZW5ndGgpLFxuICAgICAgICAgICAgZmlsZWxpc3QsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWIoOmZpOWJjeivoumXrlxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLndhcm4obXNnLCB7XG4gICAgICAgICAgICBidXR0b25zOiBbJ1llcycsICdDYW5jZWwnXSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgICAgICBjYW5jZWw6IDEsXG4gICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZGlhbG9nUXVlc3Rpb24nKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFza3M6IEFycmF5PFByb21pc2U8QXNzZXRJbmZvIHwgbnVsbD4+ID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB2YWxpZFV1aWQgPSB2YWxpZFV1aWRzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh2YWxpZFV1aWQpO1xuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt2YWxpZFV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodmFsaWRVdWlkKTtcblxuICAgICAgICAgICAgdGFza3MucHVzaChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdkZWxldGUtYXNzZXQnLCBhc3NldC51cmwpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3ZhbGlkVXVpZHNbaV1dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDph43nva7miYDmnInpgInkuK1cbiAgICAgICAgaW5TZWxlY3RzICYmIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDku47moJHlvaLliKDpmaTotYTmupDoioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gaW5mbyDmlbDmja5cbiAgICAgKi9cbiAgICBkZWxldGVkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIC8vIOWIoOmZpOW3sue8k+WtmOeahOe8qeeVpeWbvlxuICAgICAgICB1dGlscy50aHVtYm5haWwuZGVsZXRlKHV1aWQpO1xuXG4gICAgICAgIHRyZWVEYXRhLmRlbGV0ZWQodXVpZCwgaW5mbyk7XG4gICAgICAgIHZtLnJlZnJlc2hpbmcoJ2RlbGV0ZWQnLCBpbmZvLm5hbWUpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6ZSu55uYIOS4iuS4i+W3puWPs1xuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24g5pa55ZCRXG4gICAgICovXG4gICAgdXBEb3duTGVmdFJpZ2h0KGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGxhc3QgPSB2bS5nZXRMYXN0U2VsZWN0KCk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgaWYgKCF2bS5pc0V4cGFuZChsYXN0KSkge1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShsYXN0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bbGFzdF07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbikgJiYgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgaWYgKHZtLmlzRXhwYW5kKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGxhc3QsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbbGFzdF07XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBwYW5lbERhdGEuY29uZmlnLnByb3RvY29sKSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHBhcmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzaWJsaW5ncyA9IHV0aWxzLmdldFNpYmxpbmcobGFzdCk7XG4gICAgICAgICAgICBsZXQgY3VycmVudDtcbiAgICAgICAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndXAnOlxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gc2libGluZ3NbMV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2Rvd24nOlxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gc2libGluZ3NbMl07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChjdXJyZW50LnV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBzaGlmdCArIOS4iuS4i+eureWktO+8jOWkmumAiVxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24g5pa55ZCRXG4gICAgICovXG4gICAgYXN5bmMgc2hpZnRVcERvd24oZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBbbGFzdCwgbGFzdFByZXYsIGxhc3ROZXh0XSA9IHV0aWxzLmdldFNpYmxpbmcocGFuZWxEYXRhLmFjdC5zZWxlY3RzW2xlbmd0aCAtIDFdKTtcbiAgICAgICAgY29uc3QgaGFzTGFzdFByZXYgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMobGFzdFByZXYudXVpZCk7XG4gICAgICAgIGNvbnN0IGhhc0xhc3ROZXh0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGxhc3ROZXh0LnV1aWQpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd1cCcpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdFByZXYpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBsYXN0UHJldi51dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gbGFzdFByZXYudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0xhc3ROZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2Fzc2V0JywgbGFzdC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcobGFzdFByZXYudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGxhc3RQcmV2LnV1aWQpLCAxKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2Rvd24nKSB7XG4gICAgICAgICAgICBpZiAoIWhhc0xhc3ROZXh0KSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgbGFzdE5leHQudXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9IGxhc3ROZXh0LnV1aWQ7XG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNMYXN0UHJldikge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhc3NldCcsIGxhc3QudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGxhc3ROZXh0LnV1aWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGxhc3ROZXh0LnV1aWQpLCAxKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGxhc3ROZXh0LnV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkIjlubYgc2hpZnQg5aSa6YCJ6L+H56iL5Lit5YmN5ZCO55qE5bey6YCJ5Lit6aG5XG4gICAgICog5q+U5aaCIGFiIGNkZSDpobnkuK0gYSwgY2RlIOW3sumAieS4rSwgYiDmnKrpgInkuK1cbiAgICAgKiDlvZPpgInkuK0gYiDml7bvvIzlkIjlubbpgInkuK3pobkgY2RlIO+8jOW5tuWwhuacq+WwvumAieS4remhueeahOaMh+mSiOaMh+WQkSBlXG4gICAgICovXG4gICAgc2hpZnRVcERvd25NZXJnZVNlbGVjdGVkKCkge1xuICAgICAgICBpZiAoIXZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQga2VlcEZpbmROZXh0ID0gdHJ1ZTtcbiAgICAgICAgbGV0IGZpbmRVdWlkID0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQ7XG5cbiAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSAnJzsgLy8g6YeN572uXG5cbiAgICAgICAgbGV0IG1heExvb3BOdW1iZXIgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoa2VlcEZpbmROZXh0KSB7XG4gICAgICAgICAgICBjb25zdCBhcnIgPSB1dGlscy5nZXRTaWJsaW5nKGZpbmRVdWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhcnIgfHwgIWFyclsxXSB8fCAhYXJyWzJdIHx8ICFtYXhMb29wTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaW5kVXVpZCA9IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPT09ICdkb3duJyA/IGFyclsyXS51dWlkIDogYXJyWzFdLnV1aWQ7XG4gICAgICAgICAgICBtYXhMb29wTnVtYmVyLS07XG5cbiAgICAgICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMoZmluZFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihmaW5kVXVpZCksIDEpO1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGZpbmRVdWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAga2VlcEZpbmROZXh0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOadpeiHquW/q+aNt+mUrueahCByZW5hbWVcbiAgICAgKi9cbiAgICBhc3luYyBrZXlib2FyZFJlbmFtZSgpIHtcbiAgICAgICAgaWYgKHZtLnJlbmFtZVVybCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG5cbiAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgaWYgKGFzc2V0ICYmICF1dGlscy5jYW5Ob3RSZW5hbWUoYXNzZXQpKSB7XG4gICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyh1dWlkKTtcbiAgICAgICAgICAgIHZtLnJlbmFtZVVybCA9IGFzc2V0LnVybDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K56YeN5ZCN5ZG9XG4gICAgICog6L+Z5piv5byC5q2l55qE77yM5Y+q5YGa5Y+R6YCBXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGZpbGVOYW1lIOaWh+S7tuWQjVxuICAgICAqL1xuICAgIGFzeW5jIHJlbmFtZSh1dWlkOiBzdHJpbmcsIGZpbGVOYW1lID0gJycpIHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgaWYgKCFhc3NldCB8fCB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmuIXnqbrpnIDopoEgcmVuYW1lIOeahOiKgueCuVxuICAgICAgICB2bS5yZW5hbWVVcmwgPSAnJztcblxuICAgICAgICBpZiAodXRpbHMuY2FuTm90UmVuYW1lKGFzc2V0KSB8fCBmaWxlTmFtZSA9PT0gJycgfHwgZmlsZU5hbWUgPT09IGFzc2V0LmZpbGVOYW1lKSB7XG4gICAgICAgICAgICAvLyBuYW1lIOWtmOWcqOS4lOS4juS5i+WJjeeahOS4jeS4gOagt+aJjeiDvemHjeWQjeWRve+8jOWQpuWImei/mOWOn+eKtuaAgVxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICdsb2FkaW5nJztcblxuICAgICAgICAvLyDph43lkI3lkb3otYTmupBcbiAgICAgICAgY29uc3QgbmFtZSA9IGZpbGVOYW1lICsgYXNzZXQuZmlsZUV4dDtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gYCR7cGFyZW50LnVybH0vJHtuYW1lfWA7XG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ21vdmUtYXNzZXQnLCBhc3NldC51cmwsIHRhcmdldCk7XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gICAgc29ydCgpIHtcbiAgICAgICAgdHJlZURhdGEucmVzb3J0KCk7XG4gICAgfSxcbiAgICBzZWFyY2goKSB7XG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgIC8vIOaQnOe0ouacieWPmOWKqOmDveWFiOa7muWbnumhtumDqFxuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVmFsdWUpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g55SoIHNldFRpbWVvdXQg5LiL5LiA5bin6YeN5paw5a6a5L2NXG4gICAgICAgIGlmICghcGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoSW5Gb2xkZXIgJiYgIXBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh2bS5pbnRvVmlld0J5U2VsZWN0ZWQsIHRydWUpO1xuICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ouW5Yqo5Lit6auY5Lqu5qGG6YCJ5b2T5YmN5omA5aSE55qE5paH5Lu25aS56IyD5Zu0XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgZHJhZ092ZXIodXVpZDogc3RyaW5nLCBkcmFnT3ZlckFzc2V0PzogSUFzc2V0SW5mbyB8IG51bGwpIHtcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWFzc2V0LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2bS5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgICAgICAgICB2bS5kcmFnT3Zlcih0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdLCBkcmFnT3ZlckFzc2V0IHx8IGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBkcmFnIOaCrOWBnOS4gOauteaXtumXtOWQjuiHquWKqOWxleW8gOaWh+S7tuWkuVxuICAgICAgICAgICAgY29uc3Qgbm93VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBpZiAoZHJhZ092ZXJVdWlkICE9PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgZHJhZ092ZXJVdWlkID0gdXVpZDtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclRpbWVJZCA9IG5vd1RpbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub3dUaW1lIC0gZHJhZ092ZXJUaW1lSWQgPiA4MDApIHtcbiAgICAgICAgICAgICAgICAgICAgdm0udG9nZ2xlKHV1aWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgJHZpZXdCb3ggPSBwYW5lbERhdGEuJC52aWV3Qm94O1xuXG4gICAgICAgICAgICAvLyDlvq7osIMgdG9wXG4gICAgICAgICAgICBjb25zdCBhZGp1c3RTY3JvbGwgPSB2bS5zY3JvbGxUb3AgJSBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgYWRqdXN0VG9wID0gJHZpZXdCb3guZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gdm0uJGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDsgLy8g5rua5Yqo5Yiw5bqV6YOo5LqGXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgdG9wID0gaW5kZXggKiBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0ICsgYWRqdXN0U2Nyb2xsIC0gYWRqdXN0VG9wICsgMztcblxuICAgICAgICAgICAgY29uc3QgZXhwYW5kQ2hpbGRyZW46IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBsZXQgb3BhY2l0eSA9IGFzc2V0LnJlYWRvbmx5ID8gMCA6IDE7XG5cbiAgICAgICAgICAgIGlmICghdm0uaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5nZXRDaGlsZHJlblV1aWQodXVpZCwgZXhwYW5kQ2hpbGRyZW4sIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZHJhZ092ZXJBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5ID0gIWRyYWdPdmVyQXNzZXQuaXNEaXJlY3RvcnkgPyAwIDogb3BhY2l0eTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmRyb3BCb3hTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICBsZWZ0OiAkdmlld0JveC5zY3JvbGxMZWZ0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICB0b3A6IHRvcCArICdweCcsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAoZXhwYW5kQ2hpbGRyZW4ubGVuZ3RoICsgMSkgKiBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0ICsgMiArICdweCcsXG4gICAgICAgICAgICAgICAgb3BhY2l0eSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ouW5Yqo5Lit5oSf55+l5b2T5YmN5omA5aSE55qE5paH5Lu25aS577yM56a75byA5ZCO5Y+W5raI6auY5LquXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgZHJhZ0xlYXZlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBsZXQgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICBpZiAoYXNzZXQgJiYgIWFzc2V0LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICBhc3NldCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbYXNzZXQudXVpZF0gPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogdHJlZSDlrrnlmajkuIrnmoQgZHJvcFxuICAgICAqIEBwYXJhbSBldmVudCDpvKDmoIfkuovku7ZcbiAgICAgKi9cbiAgICBhc3luYyBkcm9wKGV2ZW50OiBEcmFnRXZlbnQpIHtcbiAgICAgICAgLy8g5pCc57Si5qih5byP5LiL77yM5LiN6K+G5Yir5ouW5YWlIHRyZWUg5a655ZmoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoRWRpdG9yLlVJLkRyYWdBcmVhLmN1cnJlbnREcmFnSW5mbykpIHx8IHt9O1xuXG4gICAgICAgIC8vIOWmguaenOayoeacieeItuiKgueCue+8jOS+i+WmguaQnOe0ouWQjuayoee7k+aenO+8jOWImeS4jeWTjeW6lFxuICAgICAgICBpZiAoIXZtLmFzc2V0c1swXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcm9vdFV1aWQgPSB2bS5hc3NldHNbMF0udXVpZDtcbiAgICAgICAgY29uc3QgbG9jYWxGaWxlcyA9IEFycmF5LmZyb20oZXZlbnQuZGF0YVRyYW5zZmVyIS5maWxlcyk7XG4gICAgICAgIGlmIChsb2NhbEZpbGVzICYmIGxvY2FsRmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8g5LuO5aSW6YOo5ouW5paH5Lu26L+b5p2lXG4gICAgICAgICAgICBkYXRhLnR5cGUgPSAnb3NGaWxlJztcbiAgICAgICAgICAgIGRhdGEuZmlsZXMgPSBsb2NhbEZpbGVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEudmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmdldFBhcmVudChkYXRhLnZhbHVlKTtcbiAgICAgICAgICAgIC8vIOWmguaenOS7juagueiKgueCueenu+WKqO+8jOWPiOiQveWbnuagueiKgueCue+8jOWImeS4jemcgOimgeenu+WKqFxuICAgICAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQudXVpZCA9PT0gcm9vdFV1aWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnRvID0gcm9vdFV1aWQ7IC8vIOmDveW9kuS6juagueiKgueCuVxuICAgICAgICBkYXRhLmNvcHkgPSBldmVudC5jdHJsS2V5O1xuICAgICAgICB2bS5pcGNEcm9wKGRhdGEpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+b5YWlIHRyZWUg5a655ZmoXG4gICAgICovXG4gICAgZHJhZ0VudGVyKCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvkuLrmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5kcm9wQm94U3R5bGUgPSB7fTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uSWQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgdm0uZHJhZ092ZXIodHJlZURhdGEuZGlzcGxheUFycmF5WzBdKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDotYTmupDmi5bliqhcbiAgICAgKiBAcGFyYW0gZHJhZ0luZm8g5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgaXBjRHJvcChkcmFnSW5mbzogSURyYWdJbmZvKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmZvY3VzV2luZG93KCk7IC8vIOaLlui/m+ezu+e7n+aWh+S7tuWQjueql+WPo+iOt+W+l+eEpueCue+8jOS7peinpuWPkSBpcGMg55qE5pS25Y+RXG5cbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMzAwKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0b0Fzc2V0ID0gdXRpbHMuZ2V0RGlyZWN0b3J5KGRyYWdJbmZvLnRvKTtcblxuICAgICAgICBpZiAoIXRvQXNzZXQgfHwgdXRpbHMuY2FuTm90Q3JlYXRlKHRvQXNzZXQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDku47lpJbpg6jmi5bmlofku7bov5vmnaVcbiAgICAgICAgaWYgKGRyYWdJbmZvLnR5cGUgPT09ICdvc0ZpbGUnKSB7XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uZmlsZXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmaWxlcGF0aHMgPSBkcmFnSW5mby5maWxlcy5tYXAoKGZpbGU6IGFueSkgPT4gZmlsZS5wYXRoKTtcblxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdG9Bc3NldC51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHRvQXNzZXQudXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICAgICAgLy8g5om+5Ye65Lya6YeN5aSN55qE5paH5Lu26ZuG5ZCIXG4gICAgICAgICAgICBjb25zdCByZXBlYXRGaWxlczogSVJlcGVhdEZpbGVbXSA9IGF3YWl0IGZpbGVwYXRocy5yZWR1Y2UoYXN5bmMgKHJlcywgZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcztcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldFVSTCA9IHRvQXNzZXQudXJsICsgJy8nICsgYmFzZW5hbWUoZmlsZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3QXNzZXRVUkwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgYXNzZXRVUkwpO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldFVSTCAhPT0gbmV3QXNzZXRVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGJhc2VuYW1lKGZpbGUpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0sIFByb21pc2UucmVzb2x2ZShbXSkpO1xuXG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSB7IG92ZXJ3cml0ZTogZmFsc2UsIHJlbmFtZTogZmFsc2UgfTsgLy8g5a+85YWl6YCJ6aG5XG4gICAgICAgICAgICBsZXQgc3RvcCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHJlcGVhdEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyDotoXlh7o15Liq5paH5Lu25bCx55SoLi4u5Luj5pu/5LqGXG4gICAgICAgICAgICAgICAgbGV0IGRldGFpbCA9IHJlcGVhdEZpbGVzLm1hcCgodjogSVJlcGVhdEZpbGUpID0+IHYubmFtZSkuc2xpY2UoMCwgNSkuam9pbignXFxuJyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGVhdEZpbGVzLmxlbmd0aCA+IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsICs9ICdcXG4gLi4uJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLnJlcGVhdFRpcCcpLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGRldGFpbCwgLy8g5o+Q56S656OB55uY6Lev5b6EXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLm92ZXJ3cml0ZScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUucmVuYW1lJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5jYW5jZWwnKSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiAyLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb24ub3ZlcndyaXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb24ucmVuYW1lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghc3RvcCAmJiBmaWxlcGF0aHMubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgICAgICAgICAgZmlsZXBhdGhzLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnaW1wb3J0LWFzc2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvQXNzZXQudXJsICsgJy8nICsgYmFzZW5hbWUoZmlsZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0RmlsZXMuc29tZSgodjogSVJlcGVhdEZpbGUpID0+IHYuZmlsZSA9PT0gZmlsZSkgPyBvcHRpb24gOiB7fSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWvvOWFpeWujOaIkOaIluiAheWPlua2iOS6huWvvOWFpe+8jOi/mOWOn+eItue6p+eKtuaAgVxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdG9Bc3NldC51dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodG9Bc3NldC51dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICB9IGVsc2UgaWYgKGRyYWdJbmZvLnR5cGUgPT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgLy8g5piO56Gu5o6l5Y+X5aSW6YOo5ouW6L+b5p2l55qE6IqC54K5IGNjLk5vZGVcbiAgICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBkcmFnSW5mby5hZGRpdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSAhPT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVVdWlkID0gbm9kZS52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBgJHt0b0Fzc2V0LnVybH0vJHtkdW1wLm5hbWUudmFsdWUgfHwgJ05vZGUnfS5wcmVmYWJgO1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtcHJlZmFiJywgbm9kZVV1aWQsIHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcyAmJiBwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMuaW5jbHVkZXMoZHJhZ0luZm8udHlwZSkpIHtcbiAgICAgICAgICAgIC8vIOivpeexu+Wei+eahOS6i+S7tuacieWklumDqOazqOWGjOeahOWKqOS9nO+8jOi9rOeUseWklumDqOazqOWGjOS6i+S7tuaOpeeuoVxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gT2JqZWN0LnZhbHVlcyhwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AuY2FsbGJhY2tzW2RyYWdJbmZvLnR5cGVdKSBhcyBGdW5jdGlvbltdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2FsbGJhY2tzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQoZHJhZ0luZm8udG8pO1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2s6IEZ1bmN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm86IERyb3BDYWxsYmFja0luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRGlyZWN0b3J5OiBhc3NldC5pc0RpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soaW5mbywgZHJhZ0luZm8uYWRkaXRpb25hbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRyYWdJbmZvLmFkZGl0aW9uYWwgfHwgIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uYWRkaXRpb25hbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkcmFnSW5mby5jb3B5KSB7XG4gICAgICAgICAgICAgICAgLy8g5oyJ5L2P5LqGIGN0cmwg6ZSu77yM5ouW5Yqo5aSN5Yi2XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZHMgPSBkcmFnSW5mby5hZGRpdGlvbmFsLm1hcCgoaW5mbzogSURyYWdBZGRpdGlvbmFsKSA9PiBpbmZvLnZhbHVlLnNwbGl0KCdAJylbMF0pO1xuICAgICAgICAgICAgICAgIHZtLmNvcHkoWy4uLm5ldyBTZXQodXVpZHMpXSk7XG4gICAgICAgICAgICAgICAgdm0ucGFzdGUoZHJhZ0luZm8udG8pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShkcmFnSW5mbywgdG9Bc3NldCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItlxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGNvcHkodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29waWVzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBjb3BpZXMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXVpZCDmmK8g5a2X56ymXG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjb3BpZXMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5LiN5Y+v5aSN5Yi255qE6IqC54K5XG4gICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gY29waWVzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3RDb3B5KGFzc2V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGNvcGllZFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWwhuWkjeWItueahCB1dWlkcyDlpITnkIbmiJDliarliIfmnb/nmoTlr7nosaHnsbvlnotcbiAgICAgICAgY29uc3QgY29waWVkSW5mbzogSUNvcGllZEluZm8gPSB2bS51dWlkc1RvQ29waWVkSW5mbyhjb3BpZWRVdWlkcyk7XG4gICAgICAgIC8vIOWwhuWkjeWItuiKgueCueeahCB1dWlkIOWtmOaUvuWIsOe7n+S4gOeahOWJquWIh+adv1xuICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLndyaXRlKCdhc3NldHMtY29waWVkLWluZm8nLCBjb3BpZWRJbmZvKTtcblxuICAgICAgICB2bS5yZW5kZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOeymOi0tFxuICAgICAqIEBwYXJhbSB1dWlkIOeymOi0tOWIsOatpOebruagh+iKgueCuVxuICAgICAqIEBwYXJhbSBjb3BpZWRVdWlkcyDooqvlpI3liLbnmoToioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBwYXN0ZSh1dWlkOiBzdHJpbmcsIGNvcGllZFV1aWRzPzogc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRlc3ROb2RlID0gdXRpbHMuY2xvc2VzdFdoaWNoQ2FuQ3JlYXRlKHV1aWQpOyAvLyDoh6rouqvmiJbniLbnuqfmlofku7blpLlcblxuICAgICAgICAvLyDkvJjlhYjlpITnkIbliarliIfnmoTmg4XlhrVcbiAgICAgICAgY29uc3QgY3V0SW5mbyA9IEVkaXRvci5DbGlwYm9hcmQucmVhZCgnYXNzZXRzLWN1dC1pbmZvJyk7XG4gICAgICAgIC8vIOi3qOe8lui+keWZqOS4jeWPr+WJquWIh+eymOi0tO+8jOWJquWIh+aXtuWPr+iDvemDvei/h+a7pOWFieS6huaJgOS7peS5n+mcgOimgeWIpOaWrSBhc3NldEluZm8ubGVuZ3RoXG4gICAgICAgIGlmIChjdXRJbmZvICYmIGN1dEluZm8uYXNzZXRJbmZvLmxlbmd0aCAmJiBFZGl0b3IuUHJvamVjdC5wYXRoID09PSBjdXRJbmZvLnByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBjdXRVdWlkcyA9IGN1dEluZm8uYXNzZXRJbmZvLm1hcCgoaXRlbTogSUNvcGllZEFzc2V0SW5mbykgPT4gaXRlbS51dWlkKTtcbiAgICAgICAgICAgIC8vIOWmguaenOWJquWIh+WIsOiHqui6q+aWh+S7tuWkue+8jOe7iOatolxuICAgICAgICAgICAgaWYgKGRlc3ROb2RlICYmIGN1dFV1aWRzLmluY2x1ZGVzKGRlc3ROb2RlLnV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtb3ZlRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBhZGRpdGlvbmFsOiBjdXRVdWlkcy5tYXAoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdXVpZCB9O1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShtb3ZlRGF0YSwgZGVzdE5vZGUpO1xuXG4gICAgICAgICAgICAvLyDnva7nqbrliarliIfmnb/nmoTlpI3liLblkozliarliIfotYTmupBcbiAgICAgICAgICAgIEVkaXRvci5DbGlwYm9hcmQuY2xlYXIoKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yik5pat5LiN5piv5YW25LuW5pON5L2c5Lyg5YWl55qE5Y+C5pWwXG4gICAgICAgIGlmICghY29waWVkVXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZEluZm8gPSBFZGl0b3IuQ2xpcGJvYXJkLnJlYWQoJ2Fzc2V0cy1jb3BpZWQtaW5mbycpO1xuICAgICAgICAgICAgbGV0IGNvcGllZEZpbGVzID0gW107XG4gICAgICAgICAgICBpZiAoY29waWVkSW5mbykge1xuICAgICAgICAgICAgICAgIC8vIOS7juWJquWIh+adv+S4reiOt+WPliBjb3BpZWRVdWlkcyDlkozlpITnkIbot6jnvJbovpHlmajml7bnmoTmlofku7bot6/lvoRcbiAgICAgICAgICAgICAgICBjb3BpZWRVdWlkcyA9IGNvcGllZEluZm8uYXNzZXRJbmZvLm1hcCgoaXRlbTogSUNvcGllZEFzc2V0SW5mbykgPT4gaXRlbS51dWlkKTtcbiAgICAgICAgICAgICAgICBjb3BpZWRGaWxlcyA9IGNvcGllZEluZm8uYXNzZXRJbmZvLm1hcCgoaXRlbTogSUNvcGllZEFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjUGF0aDogaXRlbS5maWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyUGF0aDogZGVzdE5vZGUudXJsICsgJy8nICsgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRPRE86XG4gICAgICAgICAgICAgKiDot6jmlofku7bns7vnu5/vvIzmmoLkuI3mlK/mjIHvvIzlj6/ku6XogIPomZHlpoLkvZXlpI3nlKggZHJvcCDliqjkvZxcbiAgICAgICAgICAgICAqIOebruWJjeWPquaUr+aMgei3qOe8lui+keWZqO+8jOS9v+eUqCBwcm9qZWN0LnBhdGgg5Yik5pat77yMcGFzdGUg5ZKMIGRyb3Ag54us56uL5a6e546wXG4gICAgICAgICAgICAgKiDliarliIfmnb/kuK3lrZjlgqjnmoTmmK/lr7nosaHnu5PmnoTvvIzlkI7nu63lj6/ku6XlgqjlrZggSlNPTiDlrZfnrKbkuLJcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgLy8g6Leo57yW6L6R5Zmo57KY6LS0XG4gICAgICAgICAgICBpZiAoY29waWVkRmlsZXMubGVuZ3RoICYmIEVkaXRvci5Qcm9qZWN0LnBhdGggIT09IGNvcGllZEluZm8ucHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgICAgICAvLyDmmL7npLogbG9hZGluZyDmlYjmnpxcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZShkZXN0Tm9kZS51dWlkKTtcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUoZGVzdE5vZGUudXVpZCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY29waWVkRmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnaW1wb3J0LWFzc2V0JywgZmlsZS5zcmNQYXRoLCBmaWxlLnRhclBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICcnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aaC5p6c5aSN5Yi25Yiw6Ieq6Lqr5paH5Lu25aS577yM6ZyA6KaB5b6A5LiK56e75LiA5bGC5paH5Lu25aS5XG4gICAgICAgIGlmIChkZXN0Tm9kZSAmJiBjb3BpZWRVdWlkcz8uaW5jbHVkZXMoZGVzdE5vZGUudXVpZCkpIHtcbiAgICAgICAgICAgIGRlc3ROb2RlID0gdXRpbHMuY2xvc2VzdFdoaWNoQ2FuQ3JlYXRlKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbZGVzdE5vZGUudXVpZF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIC8vIOayoeacieWPr+eUqOeahFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmluYWxseUNhblBhc3RlOiBzdHJpbmdbXSA9IFtdOyAvLyDmnIDlkI7lj6/lpI3liLbnmoTpoblcbiAgICAgICAgY29waWVkVXVpZHM/LmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6IqC54K55Y+v5aSN5Yi2XG4gICAgICAgICAgICBjb25zdCBjYW5Db3B5ID0gIXV0aWxzLmNhbk5vdENvcHkoYXNzZXQpO1xuICAgICAgICAgICAgaWYgKCFjYW5Db3B5KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FybiA9IGAke0VkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNvcHlGYWlsJyl9OiAke2Fzc2V0Lm5hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4od2Fybik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS4jeaYr+atpOebruagh+iKgueCueeahOeItuiKgueCue+8iOS4jeWcqOWug+eahOS4iue6p+aWh+S7tuWkuemHjO+8iVxuICAgICAgICAgICAgY29uc3QgaW5zaWRlID0gdXRpbHMuaXNBSW5jbHVkZUIodXVpZCwgZGVzdE5vZGUudXVpZCk7XG4gICAgICAgICAgICBpZiAoaW5zaWRlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FybiA9IGAke0VkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmVycm9yUGFzdGVQYXJlbnRUb0NoaWxkJyl9OiAke2Fzc2V0Lm5hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4od2Fybik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYW5Db3B5ICYmICFpbnNpZGUpIHtcbiAgICAgICAgICAgICAgICBmaW5hbGx5Q2FuUGFzdGUucHVzaCh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChmaW5hbGx5Q2FuUGFzdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBsZXQgYXNzZXQ7XG4gICAgICAgIGxldCBuZXdBc3NldDogSUFzc2V0SW5mbyB8IG51bGw7XG4gICAgICAgIGNvbnN0IG5ld1NlbGVjdHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIC8vIOaYvuekuiBsb2FkaW5nIOaViOaenFxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgdHJlZURhdGEudW5GcmVlemUoZGVzdE5vZGUudXVpZCk7XG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgIHZtLnRvZ2dsZShkZXN0Tm9kZS51dWlkLCB0cnVlKTtcblxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBhc3NldCA9IHV0aWxzLmdldEFzc2V0KGZpbmFsbHlDYW5QYXN0ZVtpbmRleF0pO1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIG5ld0Fzc2V0ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGJhc2VuYW1lKGFzc2V0LnVybCk7XG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldCA9IGAke2Rlc3ROb2RlLnVybH0vJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLXVybCcsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgbmV3QXNzZXQgPSAoYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY29weS1hc3NldCcsIGFzc2V0LnVybCwgdGFyZ2V0KSkgYXMgSUFzc2V0SW5mbyB8IG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZiAobmV3QXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSBuZXdBc3NldC51dWlkO1xuICAgICAgICAgICAgICAgICAgICBuZXdTZWxlY3RzLnB1c2gobmV3QXNzZXQudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlIChuZXdBc3NldCk7XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbZGVzdE5vZGUudXVpZF0gPSAnJztcblxuICAgICAgICAvLyDpgInkuK3mlrDnmoTpobnnm65cbiAgICAgICAgdm0uaXBjU2VsZWN0KG5ld1NlbGVjdHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Ymq5YiH5piv6aKE5a6a55qE6KGM5Li677yM5Y+q5pyJ5YaN5omn6KGM57KY6LS05pON5L2c5omN5Lya55Sf5pWIXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY3V0KHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGN1dHMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGN1dHMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXVpZCDmmK8g5a2X56ymXG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gW3V1aWRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/liarliIfnmoToioLngrlcbiAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3RDdXQoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY3V0VXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bCG5Ymq5YiH55qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAgICBjb25zdCBjdXRJbmZvOiBJQ29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGN1dFV1aWRzKTtcbiAgICAgICAgLy8g5bCG5Ymq5YiH6IqC54K555qEIHV1aWQg5a2Y5pS+5Yiw57uf5LiA55qE5Ymq5YiH5p2/XG4gICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ2Fzc2V0cy1jdXQtaW5mbycsIGN1dEluZm8pO1xuXG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5bCG5aSN5Yi2L+WJquWIh+eahCB1dWlkcyDlpITnkIbmiJDliarliIfmnb/nmoTlr7nosaHnsbvlnotcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB1dWlkc1xuICAgICAqIEByZXR1cm4geyp9ICB7SUNvcGllZEluZm99XG4gICAgICovXG4gICAgdXVpZHNUb0NvcGllZEluZm8odXVpZHM6IHN0cmluZ1tdKTogSUNvcGllZEluZm8ge1xuICAgICAgICBjb25zdCBjb3BpZWRJbmZvID0gPElDb3BpZWRJbmZvPnt9O1xuICAgICAgICBjb3BpZWRJbmZvLnByb2plY3RQYXRoID0gRWRpdG9yLlByb2plY3QucGF0aDtcbiAgICAgICAgY29waWVkSW5mby5hc3NldEluZm8gPSBbXTtcbiAgICAgICAgdXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldDogSUFzc2V0SW5mbyB8IG51bGwgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZEFzc2V0SW5mbzogSUNvcGllZEFzc2V0SW5mbyA9IHtcbiAgICAgICAgICAgICAgICB1dWlkOiBhc3NldCA/IGFzc2V0LnV1aWQgOiAnJyxcbiAgICAgICAgICAgICAgICBmaWxlOiBhc3NldCA/IGFzc2V0LmZpbGUgOiAnJyxcbiAgICAgICAgICAgICAgICBuYW1lOiBhc3NldCA/IGFzc2V0Lm5hbWUgOiAnJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb3BpZWRJbmZvLmFzc2V0SW5mby5wdXNoKGNvcGllZEFzc2V0SW5mbyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY29waWVkSW5mbztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItui1hOa6kO+8jOW5s+e6p1xuICAgICAqIEBwYXJhbSB1dWlkcyDotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBkdXBsaWNhdGUodXVpZHM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dWlkcykge1xuICAgICAgICAgICAgdXVpZHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb3BpZWRVdWlkcyA9IHV1aWRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3REdXBsaWNhdGUoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY29waWVkVXVpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdXVpZCBvZiBjb3BpZWRVdWlkcykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHZtLnBhc3RlKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0sIFt1dWlkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOenu+WKqCDotYTmupBcbiAgICAgKiBAcGFyYW0gZHJhZ0luZm8g5L+h5oGvXG4gICAgICogQHBhcmFtIHRvQXNzZXQg56e75Yqo55uu55qE5Zyw6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgbW92ZShkcmFnSW5mbzogSURyYWdJbmZvLCB0b0Fzc2V0OiBJQXNzZXRJbmZvKSB7XG4gICAgICAgIGlmICghZHJhZ0luZm8gfHwgIXRvQXNzZXQgfHwgIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uYWRkaXRpb25hbCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWxleW8gOebruagh+aWh+S7tuWkuVxuICAgICAgICB2bS50b2dnbGUodG9Bc3NldC51dWlkLCB0cnVlKTtcblxuICAgICAgICBjb25zdCB1dWlkcyA9IGRyYWdJbmZvLmFkZGl0aW9uYWwubWFwKChpbmZvOiBJRHJhZ0FkZGl0aW9uYWwpID0+IGluZm8udmFsdWUuc3BsaXQoJ0AnKVswXSk7XG5cbiAgICAgICAgLy8g5aSa6LWE5rqQ56e75Yqo77yM5qC55o2u546w5pyJ5o6S5bqP55qE6aG65bqP5omn6KGMXG4gICAgICAgIHV1aWRzLnNvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhSW5kZXggPSB0cmVlRGF0YS51dWlkVG9JbmRleFthXTtcbiAgICAgICAgICAgIGNvbnN0IGJJbmRleCA9IHRyZWVEYXRhLnV1aWRUb0luZGV4W2JdO1xuICAgICAgICAgICAgcmV0dXJuIGFJbmRleCAtIGJJbmRleDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgdXVpZHNMZW5ndGggPSB1dWlkcy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXVpZHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHV1aWRzW2ldO1xuXG4gICAgICAgICAgICBpZiAodmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmcm9tQXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghZnJvbUFzc2V0IHx8ICFmcm9tUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b0Fzc2V0LnV1aWQgPT09IGZyb21Bc3NldC51dWlkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5jYW5Ob3RDdXQoZnJvbUFzc2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0b0Fzc2V0IOaYryBmcm9tQXNzZXQg55qE5a2Q6ZuG77yM5omA5Lul54i25LiN6IO956e75Yiw5a2Q6YeM6Z2iXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNBSW5jbHVkZUIoZnJvbUFzc2V0LnV1aWQsIGRyYWdJbmZvLnRvKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDotYTmupDnp7vliqjku43lnKjljp/mnaXnmoTnm67lvZXlhoXvvIzkuI3pnIDopoHnp7vliqhcbiAgICAgICAgICAgIGlmICh0b0Fzc2V0LnV1aWQgPT09IGZyb21QYXJlbnQudXVpZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXNrczogQXJyYXk8UHJvbWlzZTxBc3NldEluZm8gfCBudWxsPj4gPSBbXTtcblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzTGVuZ3RoID0gdmFsaWRVdWlkcy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Bc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgZnJvbVBhcmVudCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tQXNzZXQgfHwgIWZyb21QYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g56e75Yqo6LWE5rqQXG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IGZyb21Bc3NldC51dWlkO1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSB0b0Fzc2V0LnVybCArICcvJyArIGJhc2VuYW1lKGZyb21Bc3NldC51cmwpO1xuXG4gICAgICAgICAgICAvLyDlrp7kvovljJbomZrmi5/otYTmupBcbiAgICAgICAgICAgIGlmIChmcm9tQXNzZXQuaW5zdGFudGlhdGlvbikge1xuICAgICAgICAgICAgICAgIHRhc2tzLnB1c2goRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnaW5pdC1hc3NldCcsIGZyb21Bc3NldC51cmwsIHRhcmdldCkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXNrcy5wdXNoKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ21vdmUtYXNzZXQnLCBmcm9tQXNzZXQudXJsLCB0YXJnZXQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDpgInkuK3np7vliqjpoblcbiAgICAgICAgdm0uaXBjU2VsZWN0KHZhbGlkVXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YeN5paw5a+85YWl6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgcmVpbXBvcnQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBzZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4rVxuICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgc2VsZWN0cyA9IFt1dWlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgbGV0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBzZWxlY3RzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCB1dGlscy5jYW5Ob3RSZWltcG9ydChhc3NldCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIC8vIOehruS/nSAxLzLvvJogdmFsaWRVdWlkcyDph4zpnaLku7vkuIDotYTmupDpg73kuI3mmK8gdXVpZCDnmoTomZrmi5/lrZDotYTmupBcbiAgICAgICAgICAgICAgICB2YWxpZFV1aWRzID0gdmFsaWRVdWlkcy5maWx0ZXIoKHZhbGlkVXVpZCkgPT4gIXV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIHZhbGlkVXVpZCkpO1xuXG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIDIvMu+8miB2YWxpZFV1aWRzIOmHjOeahOS7u+S4gOi1hOa6kOmDveS4jeaYryB1dWlkIOeahOeItui1hOa6kFxuICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5zb21lKCh2YWxpZFV1aWQpID0+IHV0aWxzLmlzQUluY2x1ZGVCKHZhbGlkVXVpZCwgdXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyhjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXZhbGlkVXVpZHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWinuWKoOmHjeWvvOS4reeahCBsb2FkaW5nIOeVjOmdouaViOaenFxuICAgICAgICBmb3IgKGNvbnN0IHZhbGlkVXVpZCBvZiB2YWxpZFV1aWRzKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt2YWxpZFV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodmFsaWRVdWlkKTtcbiAgICAgICAgfVxuICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHZhbGlkVXVpZCBvZiB2YWxpZFV1aWRzKSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWltcG9ydC1hc3NldCcsIHZhbGlkVXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5qCR5b2i5pWw5o2u5bey5pS55Y+YXG4gICAgICog5aaC6LWE5rqQ5aKe5Yig5pS577yM5piv6L6D5aSn55qE5Y+Y5Yqo77yM6ZyA6KaB6YeN5paw6K6h566X5ZCE5Liq6YWN5aWX5pWw5o2uXG4gICAgICog5aKe5YqgIHNldFRpbWVPdXQg5piv5Li65LqG5LyY5YyW5p2l6Ieq5byC5q2l55qE5aSa5qyh6Kem5Y+RXG4gICAgICovXG4gICAgcmVuZGVyKCkge1xuICAgICAgICAvLyDlrrnlmajnmoTmlbTkvZPpq5jluqZcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwudHJlZUhlaWdodCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGggKiBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0O1xuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFsbEV4cGFuZCA9IHZtLmlzQWxsRXhwYW5kKCk7XG5cbiAgICAgICAgLy8g6YeN5paw5riy5p+T5Ye65qCR5b2iXG4gICAgICAgIHZtLmZpbHRlckFzc2V0cygpO1xuXG4gICAgICAgIHdoaWxlIChwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWR5VHdpbmtsZSA9IHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZChyZWFkeVR3aW5rbGUudXVpZCwgcmVhZHlUd2lua2xlLmFuaW1hdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmHjeaWsOa4suafk+agkeW9olxuICAgICAqIHZtLmFzc2V0cyDkuLrlvZPliY3mmL7npLrnmoTpgqPlh6DkuKroioLngrnmlbDmja5cbiAgICAgKi9cbiAgICBmaWx0ZXJBc3NldHMoKSB7XG4gICAgICAgIHZtLmFzc2V0cyA9IFtdOyAvLyDlhYjmuIXnqbrvvIzov5nnp43otYvlgLzmnLrliLbmiY3og73liLfmlrAgdnVl77yM6ICMIC5sZW5ndGggPSAwIOS4jeihjFxuXG4gICAgICAgIGNvbnN0IHRvcCA9IHZtLnNjcm9sbFRvcCAlIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQ7XG4gICAgICAgIGNvbnN0IG1pbiA9IHZtLnNjcm9sbFRvcCAtIHRvcDsgLy8g566X5Ye65Y+v6KeG5Yy65Z+f55qEIHRvcCDmnIDlsI/lgLxcbiAgICAgICAgY29uc3QgbWF4ID0gbWluICsgcGFuZWxEYXRhLiQucGFuZWwudmlld0hlaWdodDsgLy8g5pyA5aSn5YC8XG5cbiAgICAgICAgdm0uJGVsLnN0eWxlLnRvcCA9IGAtJHt0b3B9cHhgO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5yb3VuZChtaW4gLyBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0KTtcbiAgICAgICAgY29uc3QgZW5kID0gTWF0aC5jZWlsKG1heCAvIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQpICsgMTtcblxuICAgICAgICB2bS5hc3NldHMgPSB0cmVlRGF0YS5vdXRwdXREaXNwbGF5KHN0YXJ0LCBlbmQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6YCJ5Lit5YiX6KGo5pWw57uE5Lit56ys5LiA5Liq6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue5Zyo5pi+56S66Zif5YiX5Lit55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgZ2V0Rmlyc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzWzBdO1xuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6YCJ5Lit5YiX6KGo5pWw57uE5Lit5pyA5ZCO5LiA5Liq6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue5Zyo5pi+56S66Zif5YiX5Lit55qE5pyA5ZCO5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgZ2V0TGFzdFNlbGVjdCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKHNlbGVjdHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBwYW5lbERhdGEuYWN0LnNlbGVjdHNbc2VsZWN0c0xlbmd0aCAtIDFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGlzcGxheUxlbmd0aCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5W2Rpc3BsYXlMZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6KeG6KeJ5LiK5qCR5b2i5LiK5LiL5YiX6KGo5Lit77yM56ys5LiA5Liq6YCJ5Lit6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue6aG25bGC5qC56IqC54K5ICdkYjovLydcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKSB7XG4gICAgICAgIGxldCB1dWlkID0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbDtcblxuICAgICAgICBjb25zdCBtaW5JbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGg7XG5cbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHNlbGVjdCk7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgbWluSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZCA9IHNlbGVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXVpZDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/lOWbnuagkeW9ouesrOS4gOS4quiKgueCuVxuICAgICAqIOesrOS4gOS4quiKgueCue+8jOS4jeS4gOWumuaYr+agueiKgueCue+8jOS+i+WmguWcqOaQnOe0oueahOaDheWGteS4i1xuICAgICAqL1xuICAgIGdldEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF07XG4gICAgfSxcbiAgICBpc0V4cGFuZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRyZWVEYXRhLnV1aWRUb0V4cGFuZFt1dWlkXTtcbiAgICB9LFxuICAgIGlzU2VsZWN0KHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YodXVpZCkgIT09IC0xO1xuICAgIH0sXG4gICAgaXNUd2lua2xlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC50d2lua2xlc1t1dWlkXTtcbiAgICB9LFxuICAgIGlzQWxsRXhwYW5kKCkge1xuICAgICAgICBsZXQgYWxsQ29sbGFwc2UgPSB0cnVlO1xuXG4gICAgICAgIGxldCBwYXJlbnRzID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbF07XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJlbnRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwYXJlbnRzIHx8ICFwYXJlbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsbENvbGxhcHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50c0xlbmd0aCA9IHBhcmVudHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHBhcmVudFV1aWQgPSBwYXJlbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICBpZiAocGFyZW50ICYmICFwYXJlbnQuaXNQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRyZWVEYXRhLnV1aWRUb0V4cGFuZFtwYXJlbnRVdWlkXSkge1xuICAgICAgICAgICAgICAgIGFsbENvbGxhcHNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gIWFsbENvbGxhcHNlO1xuICAgIH0sXG4gICAgaXNTZWFyY2hpbmdNb2RlKCkge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNTZWFyY2hpbmdNb2RlKCk7XG4gICAgfSxcbiAgICBhc3luYyBkaWFsb2dFcnJvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcihFZGl0b3IuSTE4bi50KGBhc3NldHMub3BlcmF0ZS4ke21lc3NhZ2V9YCksIHtcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dFcnJvcicpLFxuICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IHdhdGNoID0ge1xuICAgIC8qKlxuICAgICAqIHNjcm9sbFRvcCDlj5jljJbvvIzliLfmlrDmoJHlvaJcbiAgICAgKi9cbiAgICBzY3JvbGxUb3AoKSB7XG4gICAgICAgIHZtLmZpbHRlckFzc2V0cygpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5b2T5YmN6YCJ5Lit6aG55Y+Y5YqoXG4gICAgICovXG4gICAgYWN0aXZlQXNzZXQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFjdGl2ZUFzc2V0ID0gdm0uYWN0aXZlQXNzZXQ7XG4gICAgfSxcbn07XG5cbi8qKlxuICogdnVlIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXNzZXRzOiBbXSwgLy8g5b2T5YmN5qCR5b2i5Zyo5Y+v6KeG5Yy65Z+f55qE6LWE5rqQ6IqC54K5XG4gICAgICAgIHJlbmFtZVVybDogJycsIC8vIOmcgOimgSByZW5hbWUg55qE6IqC54K555qEIHVybO+8jOWPquacieS4gOS4qlxuICAgICAgICBhZGRJbmZvOiB7XG4gICAgICAgICAgICAvLyDmt7vliqDkuIDkuKrmlrDotYTmupDliY3nmoTmlbDmja7vvIzpnIDopoHkuovliY3ph43lkb3lkI1cbiAgICAgICAgICAgIHR5cGU6ICcnLFxuICAgICAgICAgICAgaW1wb3J0ZXI6ICcnLFxuICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICBmaWxlRXh0OiAnJyxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAnJyxcbiAgICAgICAgICAgIHBhcmVudERpcjogJycsXG4gICAgICAgIH0sXG4gICAgICAgIGludG9WaWV3QnlTZWxlY3RlZDogJycsIC8vIOaUtuWIsOmAieS4rSBpcGMg6ZyA6KaB5a6a5L2N5pi+56S655qE6LWE5rqQXG4gICAgICAgIGludG9WaWV3QnlVc2VyOiAnJywgLy8g55So5oi35pON5L2c55qE5paw5aKe56e75Yqo6LWE5rqQ77yM57uZ5LqI5a6a5L2NXG4gICAgICAgIHNjcm9sbFRvcDogMCwgLy8g5b2T5YmN5qCR5b2i55qE5rua5Yqo5pWw5o2uXG4gICAgICAgIGRyb3BwYWJsZVR5cGVzOiBbXSxcbiAgICAgICAgY2hlY2tTaGlmdFVwRG93bk1lcmdlOiB7IHV1aWQ6ICcnLCBkaXJlY3Rpb246ICcnIH0sIC8vIHNoaWZ0ICsg566t5aS05aSa6YCJ77yM5aKe5by65Lqk5LqS5pWI5p6cXG4gICAgfTtcbn1cblxuLyoqXG4gKiB2bSA9IHRoaXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1vdW50ZWQoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHZtID0gdGhpcztcblxuICAgIC8vIOWvueS6juWtkOmbhueahOWPmOWKqO+8jOacgOWQjuS4gOS4qiBpcGMg5raI5oGv5Y+R55qE5piv54i257qn5paH5Lu25aS555qE5Y+Y5Yqo77yM6L+Z5LiN6ZyA6KaB5pi+56S65Ye65p2l77yM5omA5Lul5YGa5LqG6K6w5b2V5YeG5aSH5b+955WlXG4gICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzID0ge307XG59XG4iXX0=