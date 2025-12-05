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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZWIsK0JBQXNDO0FBQ3RDLDJCQUE4QztBQUM5Qyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUU1Qix1QkFBdUI7QUFDdkIsSUFBSSxZQUFpQixDQUFDO0FBQ3RCLElBQUksY0FBbUIsQ0FBQztBQUN4QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxnQkFBcUIsQ0FBQztBQUViLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUVkLFFBQUEsS0FBSyxHQUFHO0lBQ2pCLGtCQUFrQixFQUFFO1FBQ2hCLElBQUksRUFBRSxLQUFLO1FBQ1gsT0FBTztZQUNILE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQztLQUNKO0NBQ0osQ0FBQztBQUVXLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXBGLFFBQUEsVUFBVSxHQUFHO0lBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDO0NBQ3RDLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixFQUFFLENBQUMsY0FBYyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFVB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T3B0aW9uLFxuICAgIElBZGRJbmZvLFxuICAgIElBc3NldEluZm8sXG4gICAgRHJvcENhbGxiYWNrSW5mbyxcbiAgICBJRHJhZ0luZm8sXG4gICAgSURyYWdBZGRpdGlvbmFsLFxuICAgIEFzc2V0SW5mbyxcbiAgICBJQ29waWVkSW5mbyxcbiAgICBJQ29waWVkQXNzZXRJbmZvLFxuICAgIElSZXBlYXRGaWxlLFxufSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9wYW5lbC1kYXRhJztcbmltcG9ydCAqIGFzIHRyZWVEYXRhIGZyb20gJy4vdHJlZS1kYXRhJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5sZXQgdm06IGFueSA9IG51bGw7XG5sZXQgcmVxdWVzdEFuaW1hdGlvbklkOiBhbnk7XG5cbi8vIOeUqOS6juivhuWIqyBkcmFnIOaCrOWBnO+8jOiHquWKqOWxleW8gOaWh+S7tuWkuVxubGV0IGRyYWdPdmVyVXVpZDogYW55O1xubGV0IGRyYWdPdmVyVGltZUlkOiBhbnk7XG5sZXQgc2VsZWN0ZWRUaW1lSWQ6IGFueTtcbmxldCByZWZyZXNoaW5nVGltZUlkOiBhbnk7XG5cbmV4cG9ydCBjb25zdCBuYW1lID0gJ3RyZWUnO1xuXG5leHBvcnQgY29uc3QgcHJvcHMgPSB7XG4gICAgZHJvcHBhYmxlVHlwZXNQcm9wOiB7XG4gICAgICAgIHR5cGU6IEFycmF5LFxuICAgICAgICBkZWZhdWx0KCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvdGVtcGxhdGUvdHJlZS5odG1sJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge1xuICAgICd0cmVlLW5vZGUnOiByZXF1aXJlKCcuL3RyZWUtbm9kZScpLFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog57+76K+RXG4gICAgICogQHBhcmFtIGtleSDkuI3luKbpnaLmnb/lkI3np7DnmoTmoIforrDlrZfnrKZcbiAgICAgKi9cbiAgICB0KGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS4kLnBhbmVsLnQoa2V5KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWklumDqOaVsOaNruabtOaWsOWQju+8jOabtOaWsOWGhemDqOaVsOaNrlxuICAgICAqL1xuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdm0uZHJvcHBhYmxlVHlwZXMgPSBbLi4udm0uZHJvcHBhYmxlVHlwZXNQcm9wLCAuLi5wYW5lbERhdGEuY29uZmlnLmFzc2V0VHlwZXMoKV07XG5cbiAgICAgICAgLy8g5riF56m65paw5bu65oiW6YeN5ZG95ZCN54q25oCBXG4gICAgICAgIHZtLmFkZEluZm8ucGFyZW50RGlyID0gJyc7XG4gICAgICAgIHZtLnJlbmFtZVVybCA9ICcnO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5riF56m65qCR5b2iXG4gICAgICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRyZWVEYXRhLmNsZWFyKCk7XG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yi35paw5qCR5b2iXG4gICAgICogQHBhcmFtIHR5cGUg5piv5ZCm6YeN572u5pWw5o2uXG4gICAgICogQHBhcmFtIG5hbWUgaXBjIOWKqOS9nOeahOWQjeensFxuICAgICAqL1xuICAgIHJlZnJlc2hpbmcodHlwZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV1aWQgJiYgdm0ucmVmcmVzaGluZy5pZ25vcmVzW3V1aWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgdm0ucmVmcmVzaGluZy5pZ25vcmVzW3V1aWRdO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwucmVmcmVzaGluZyA9IHsgdHlwZSwgbmFtZSB9O1xuXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQocmVmcmVzaGluZ1RpbWVJZCk7XG4gICAgICAgIHJlZnJlc2hpbmdUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAvLyDmj5DnpLrmtojlpLFcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnJlZnJlc2hpbmcudHlwZSA9ICcnO1xuICAgICAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzID0ge307XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K555qE5oqY5Y+gL+WxleW8gOWIh+aNolxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBleHBhbmQgIOaYr+WQpuWxleW8gFxuICAgICAqIEBwYXJhbSBsb29wICDmjInkvY8gQWx0IOmUruWPr+i/m+WFpeWtkOiKgueCueW+queOr1xuICAgICAqL1xuICAgIHRvZ2dsZSh1dWlkOiBzdHJpbmcsIGV4cGFuZD86IGJvb2xlYW4sIGxvb3A/OiBib29sZWFuKSB7XG4gICAgICAgIGlmIChsb29wKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cmVlRGF0YS50b2dnbGVFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yik5pat5LiL5Liq5Yqo5L2c5piv5pS26LW36L+Y5piv5bGV5byAIO+8iOW9k+WtmOWcqOS4jeWQjOeKtuaAgeeahOaWh+S7tuWkueaXtu+8jOinhuS4uuaUtui1t+OAguW9k+eKtuaAgeebuOWQjO+8jOWPluWPjeWNs+WPr+OAgu+8iVxuICAgICAqIEBwYXJhbSBwYXJlbnRzXG4gICAgICogQHJldHVybnMgYm9vbGVhblxuICAgICAqL1xuICAgIG5leHRUb2dnbGVFeHBhbmQocGFyZW50czogYW55W10pOiBib29sZWFuIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlOyAvLyDpu5jorqTkuLrmlLbotbdcbiAgICAgICAgLy8g5qC55o2u6KeE5YiZ77yM6YKj5LmI5Y+q5pyJ5b2T5YWo6YOo6YO95Li65pS26LW355qE5pe25YCZ77yM6ZyA6KaB5bGV5byA55qE5pON5L2cXG4gICAgICAgIGNvbnN0IGlzQWxsQ2xvc2UgPSBwYXJlbnRzLmV2ZXJ5KChwYXJlbnRJRCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50SURdO1xuICAgICAgICAgICAgaWYgKCEoJ2lzUGFyZW50JyBpbiBwYXJlbnQgJiYgcGFyZW50LmlzUGFyZW50KSkge1xuICAgICAgICAgICAgICAgIHBhcmVudElEID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRJRF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gIXRyZWVEYXRhLnV1aWRUb0V4cGFuZFtwYXJlbnRJRF07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNBbGxDbG9zZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YOo6IqC54K55oqY5Y+g5oiW5bGV5byAXG4gICAgICovXG4gICAgYWxsVG9nZ2xlKCkge1xuICAgICAgICBsZXQgcGFyZW50cyA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3BhbmVsRGF0YS5jb25maWcucHJvdG9jb2xdO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICBpZiAoc2VsZWN0c0xlbmd0aCkge1xuICAgICAgICAgICAgcGFyZW50cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudHNMZW5ndGggPSBwYXJlbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKCFwYXJlbnRzTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBleHBhbmQgPSB2bS5uZXh0VG9nZ2xlRXhwYW5kKHBhcmVudHMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHBhcmVudFV1aWQgPSBwYXJlbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICBpZiAoISgnaXNQYXJlbnQnIGluIHBhcmVudCAmJiBwYXJlbnQuaXNQYXJlbnQpKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHBhcmVudFV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmAiVxuICAgICAqIEBwYXJhbSB1dWlkIOWFqOmAieivpeebruagh+iKgueCueS4i+eahOWtkOiKgueCuVxuICAgICAqL1xuICAgIHNlbGVjdEFsbCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgLy8g5pG457Si5qih5byP5LiL77yM5YWo6YCJ5Li65b2T5YmN5YiX6KGoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHRyZWVEYXRhLmRpc3BsYXlBcnJheSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHV1aWQgfHwgdm0uZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCk7XG5cbiAgICAgICAgaWYgKCF0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltwYXJlbnRVdWlkXSkge1xuICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDojrflj5blt7LlsZXlvIDnmoTlrZDoioLngrlcbiAgICAgICAgY29uc3QgY2hpbGRyZW5VdWlkOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICB1dGlscy5nZXRDaGlsZHJlblV1aWQocGFyZW50VXVpZCwgY2hpbGRyZW5VdWlkLCB0cnVlKTtcblxuICAgICAgICBjb25zdCBjbG9uZVNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgY29uc3QgcGFyZW50SW4gPSBjbG9uZVNlbGVjdHMuaW5jbHVkZXMocGFyZW50VXVpZCk7XG5cbiAgICAgICAgbGV0IGNoaWxkcmVuQWxsSW4gPSB0cnVlO1xuICAgICAgICBjb25zdCBjaGlsZHJlblV1aWRMZW5ndGggPSBjaGlsZHJlblV1aWQubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuVXVpZExlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhjaGlsZHJlblV1aWRbaV0pKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW5BbGxJbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoaWxkcmVuQWxsSW4pIHtcbiAgICAgICAgICAgIGlmICghcGFyZW50SW4pIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5b6A5LiK5LiA5bGCXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudFV1aWQgIT09IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uc2VsZWN0QWxsKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgICAgICBpZiAocGFyZW50SW4pIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlblV1aWQudW5zaGlmdChwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBjaGlsZHJlblV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBjaGlsZHJlblV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZWxlY3RDbGVhcigpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkcyBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAqL1xuICAgIHNlbGVjdGVkKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2godXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5U2VsZWN0ZWQgPSB1dWlkO1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChzZWxlY3RlZFRpbWVJZCk7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlTZWxlY3RlZCk7XG4gICAgICAgICAgICAgICAgfSwgNTApO1xuXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+lIHNoaWZ0IOWkmumAieeahOWKqOS9nFxuICAgICAgICAgICAgICAgIGlmICh1dWlkID09PSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5zaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFsbEV4cGFuZCA9IHZtLmlzQWxsRXhwYW5kKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICB1bnNlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBpbmRleCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgICAgIHNlbGVjdGVkVGltZUlkID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZtLmludG9WaWV3QnlTZWxlY3RlZCA9PT0gdXVpZCkge1xuICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVNlbGVjdGVkID0gJyc7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaBouWkjemAieS4reeKtuaAgVxuICAgICAqL1xuICAgIHJlc2V0U2VsZWN0ZWQoKSB7XG4gICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cyA9IFtdO1xuICAgICAgICBjb25zdCB1dWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ2Fzc2V0Jyk7XG4gICAgICAgIHZtLnNlbGVjdGVkKHV1aWRzKTtcblxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVNlbGVjdGVkLCB0cnVlKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsgY2xpY2sg5aSa6YCJXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgc2hpZnRDbGljayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBkaXNwbGF5QXJyYXkgfSA9IHRyZWVEYXRhO1xuXG4gICAgICAgIGNvbnN0IGZpcnN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZihwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF0pO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoZmlyc3RJbmRleCAhPT0gLTEgfHwgbGFzdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGZpcnN0SW5kZXggPD0gbGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZpcnN0SW5kZXg7IGkgPD0gbGFzdEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0cy5wdXNoKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA+PSBsYXN0SW5kZXg7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2bS5pcGNTZWxlY3Qoc2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBjdHJsICsgY2xpY2sg6YCJ5Lit5oiW5Y+W5raI6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY3RybENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdhc3NldCcsIHV1aWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkcyDotYTmupBcbiAgICAgKi9cbiAgICBpcGNTZWxlY3QodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHV1aWRzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reagkeW9ouS4iueahOesrOS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGlwY1NlbGVjdEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgICAgIGNvbnN0IHV1aWQgPSB0aGlzLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnqbrnmb3lpITngrnlh7vvvIzlj5bmtojpgInkuK1cbiAgICAgKi9cbiAgICBjbGljaygpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yib5bu65YmN77yM5ZCN56ew5aSE55CGXG4gICAgICogQHBhcmFtIGFkZEluZm8g5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgYWRkVG8oYWRkSW5mbzogSUFkZEluZm8pIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuXG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAzMDApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYWRkSW5mby51dWlkKSB7XG4gICAgICAgICAgICBhZGRJbmZvLnV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6Ieq6Lqr5oiW54i257qn5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZShhZGRJbmZvLnV1aWQpO1xuXG4gICAgICAgIC8vIHBhcmVudCDkuI3lrZjlnKjmiJblpITkuo7lhbbku5bnirbmgIHvvIzkuI3pgILlkIjliJvlu7pcbiAgICAgICAgaWYgKCFwYXJlbnQgfHwgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdKSB7XG4gICAgICAgICAgICBjb25zdCBtc2cgPSBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5jYW5Ob3RBZGRUbycsIHtcbiAgICAgICAgICAgICAgICB1dWlkOiBhZGRJbmZvLnV1aWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybihtc2cpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bGV5byA54i257qn6IqC54K5XG4gICAgICAgIHZtLnRvZ2dsZShwYXJlbnQudXVpZCwgdHJ1ZSk7XG5cbiAgICAgICAgLy8g5rua5Yqo5Yiw6aG25bGC6KeG56qXXG4gICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHBhcmVudC51dWlkKTtcblxuICAgICAgICBjb25zdCBwYXJlbnREaXIgPSBwYXJlbnQudXJsO1xuICAgICAgICBsZXQgZmlsZU5hbWUgPSBhZGRJbmZvLmZpbGVOYW1lIHx8ICdOZXcgRmlsZSc7XG4gICAgICAgIGxldCBmaWxlRXh0ID0gYC4ke2FkZEluZm8udHlwZX1gO1xuXG4gICAgICAgIGNvbnN0IGNhbWVsRm9ybWF0UmVnID0gL0BjY2NsYXNzKFtePF0qKSg8JUNhbWVsQ2FzZUNsYXNzTmFtZSU+KS87XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZUZvcm1hdFJlZyA9IC9AY2NjbGFzc1xcKFsnXCJdKFteJ1wiXSopWydcIl1cXCkvO1xuICAgICAgICBjb25zdCBjb21tZW50c1JlZyA9IC8oXFxuW15cXG5dKlxcL1xcKltcXHNcXFNdKj9cXCpcXC8pfChcXG5bXlxcbl0qXFwvXFwvKD86W15cXHJcXG5dfFxccig/IVxcbikpKikvZzsgLy8g5rOo6YeK5Yy65Z+f6L+e5ZCM6L+e57ut55qE56m66KGMXG5cbiAgICAgICAgc3dpdGNoIChhZGRJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2RpcmVjdG9yeSc6XG4gICAgICAgICAgICAgICAgZmlsZUV4dCA9ICcnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndHMnOlxuICAgICAgICAgICAgY2FzZSAnanMnOiB7XG4gICAgICAgICAgICAgICAgaWYgKCFhZGRJbmZvLmNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkSW5mby5jb250ZW50ID0gJyc7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7YWRkSW5mby50ZW1wbGF0ZSB8fCBhZGRJbmZvLnR5cGV9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgZmlsZVVybCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVVdWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBmaWxlVXVpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGVJbmZvIHx8ICFleGlzdHNTeW5jKGZpbGVJbmZvLmZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih2bS50KCdyZWFkRGVmYXVsdEZpbGVGYWlsJyksIGZpbGVVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkSW5mby5jb250ZW50ID0gcmVhZEZpbGVTeW5jKGZpbGVJbmZvLmZpbGUsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5pW055CG5bm26K+G5Yir5qih5p2/5pWw5o2uXG4gICAgICAgICAgICAgICAgYWRkSW5mby5jb250ZW50ID0gYWRkSW5mby5jb250ZW50LnJlcGxhY2UoY29tbWVudHNSZWcsICgkMDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkMC5pbmNsdWRlcygnQ09NTUVOVFNfR0VORVJBVEVfSUdOT1JFJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkMDtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIOivhuWIq+aYr+WQpuWQr+eUqOmpvOWzsOagvOW8j+eahOexu+WQjVxuICAgICAgICAgICAgICAgIHV0aWxzLnNjcmlwdE5hbWUucmVxdWlyZWRDYW1lbENhc2VDbGFzc05hbWUgPSBjYW1lbEZvcm1hdFJlZy50ZXN0KGFkZEluZm8uY29udGVudCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lTWF0Y2hlcyA9IGFkZEluZm8uY29udGVudC5tYXRjaChjbGFzc05hbWVGb3JtYXRSZWcpO1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcmlwdE5hbWUuY2xhc3NOYW1lU3RyaW5nRm9ybWF0ID0gbmFtZU1hdGNoZXMgJiYgbmFtZU1hdGNoZXNbMV0gPyBuYW1lTWF0Y2hlc1sxXSA6ICcnO1xuXG4gICAgICAgICAgICAgICAgZmlsZU5hbWUgPSBhd2FpdCB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkRmlsZU5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pyA5ZCO5Lul6L+Z5LiqIHVybCDmlbDmja7kuLrlh4ZcbiAgICAgICAgbGV0IHVybCA9IGAke3BhcmVudERpcn0vJHtmaWxlTmFtZX0ke2ZpbGVFeHR9YDtcbiAgICAgICAgdXJsID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLXVybCcsIHVybCk7XG5cbiAgICAgICAgdm0uYWRkSW5mbyA9IHtcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgICAgIHR5cGU6IGFkZEluZm8udHlwZSxcbiAgICAgICAgICAgIGltcG9ydGVyOiBhZGRJbmZvLmltcG9ydGVyLFxuICAgICAgICAgICAgdGVtcGxhdGU6IGFkZEluZm8udGVtcGxhdGUsXG4gICAgICAgICAgICBjb250ZW50OiBhZGRJbmZvLmNvbnRlbnQsXG4gICAgICAgICAgICBmaWxlRXh0LFxuICAgICAgICAgICAgZmlsZU5hbWU6IGJhc2VuYW1lKHVybCwgZmlsZUV4dCksXG4gICAgICAgICAgICBuYW1lOiBiYXNlbmFtZSh1cmwpLFxuICAgICAgICAgICAgcGFyZW50RGlyLFxuICAgICAgICAgICAgcGFyZW50VXVpZDogcGFyZW50LnV1aWQsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkI3np7DloavlhpnlkI7mj5DkuqTliLDov5nph4xcbiAgICAgKiBAcGFyYW0gYWRkSW5mbyDkv6Hmga9cbiAgICAgKi9cbiAgICBhc3luYyBhZGRDb25maXJtKGFkZEluZm8/OiBJQWRkSW5mbykge1xuICAgICAgICAvLyDmlbDmja7plJnor6/ml7blj5bmtohcbiAgICAgICAgaWYgKCFhZGRJbmZvIHx8ICFhZGRJbmZvLnBhcmVudERpciB8fCAhYWRkSW5mby5wYXJlbnRVdWlkIHx8ICFhZGRJbmZvLmZpbGVOYW1lKSB7XG4gICAgICAgICAgICAvLyDmlrDlop7nmoTovpPlhaXmoYbmtojlpLFcbiAgICAgICAgICAgIHZtLmFkZEluZm8ucGFyZW50RGlyID0gJyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhZGRJbmZvLm5hbWUgPSBhZGRJbmZvLmZpbGVOYW1lICsgYWRkSW5mby5maWxlRXh0O1xuXG4gICAgICAgIC8vIOiHqui6q+aIlueItue6p+aWh+S7tuWkuVxuICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUoYWRkSW5mby5wYXJlbnRVdWlkKTtcbiAgICAgICAgLy8g54i257qn5LiN5Y+v5paw5bu66LWE5rqQXG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5rOo5oSP77ya5oWO6YeN5L+u5pS55q2k6buY6K6k5YC8XG4gICAgICAgICAqIGNvbnRlbnQg57G75Z6L5Y+v5Lul5Li6IG51bGwsIHN0cmluZywgYnVmZmVyXG4gICAgICAgICAqIOm7mOiupCBudWxsIOaYr+e7meaWh+S7tuWkueS9v+eUqOeahFxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IGNvbnRlbnQ6IGFueSA9IG51bGw7XG5cbiAgICAgICAgaWYgKGFkZEluZm8udHlwZSAhPT0gJ2RpcmVjdG9yeScpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBhZGRJbmZvLmNvbnRlbnQgfHwgJyc7XG5cbiAgICAgICAgICAgIGlmICghY29udGVudCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVVcmwgPSBgZGI6Ly9pbnRlcm5hbC9kZWZhdWx0X2ZpbGVfY29udGVudC8ke2FkZEluZm8udGVtcGxhdGUgfHwgYWRkSW5mby50eXBlfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS11dWlkJywgZmlsZVVybCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZmlsZVV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZUluZm8gPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgZmlsZVV1aWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpbGVJbmZvIHx8ICFleGlzdHNTeW5jKGZpbGVJbmZvLmZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHZtLnQoJ3JlYWREZWZhdWx0RmlsZUZhaWwnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGZpbGVJbmZvLmZpbGUsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFsndHMnLCAnanMnXS5pbmNsdWRlcyhhZGRJbmZvLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWQgPSBhd2FpdCB1dGlscy5zY3JpcHROYW1lLmlzVmFsaWQoYWRkSW5mby5maWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkLnN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3Iodm0udCh2YWxpZC5zdGF0ZSkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdXNlRGF0YSA9IGF3YWl0IEVkaXRvci5Vc2VyLmdldERhdGEoKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlQ29udGVudHM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgVW5kZXJzY29yZUNhc2VDbGFzc05hbWU6IHV0aWxzLnNjcmlwdE5hbWUuZ2V0VmFsaWRDbGFzc05hbWUoYWRkSW5mby5maWxlTmFtZSksXG4gICAgICAgICAgICAgICAgICAgIENhbWVsQ2FzZUNsYXNzTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENhbWVsQ2FzZUNsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgRGF0ZVRpbWU6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgICAgIEF1dGhvcjogdXNlRGF0YS5uaWNrbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgRmlsZUJhc2VuYW1lOiBhZGRJbmZvLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIEZpbGVCYXNlbmFtZU5vRXh0ZW5zaW9uOiBhZGRJbmZvLmZpbGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICBVUkw6IGAke2FkZEluZm8ucGFyZW50RGlyfS8ke2FkZEluZm8ubmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICBFZGl0b3JWZXJzaW9uOiBFZGl0b3IuQXBwLnZlcnNpb24sXG4gICAgICAgICAgICAgICAgICAgIE1hbnVhbFVybDogRWRpdG9yLkFwcC51cmxzLm1hbnVhbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHJlcGxhY2VDb250ZW50cykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UobmV3IFJlZ0V4cChgPCUke2tleX0lPmAsICdnJyksIHJlcGxhY2VDb250ZW50c1trZXldKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmFkZEluZm8ucGFyZW50RGlyID0gJyc7XG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3BhcmVudC51dWlkXSA9ICdhZGQtbG9hZGluZyc7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcblxuICAgICAgICBjb25zdCB1cmwgPSBgJHthZGRJbmZvLnBhcmVudERpcn0vJHthZGRJbmZvLmZpbGVOYW1lfSR7YWRkSW5mby5maWxlRXh0fWA7XG4gICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCB2bS5hZGQodXJsLCBjb250ZW50KTtcblxuICAgICAgICAvLyDmlrDlu7rlkIzlkI3mlofku7bml7bngrnlj5bmtojkvJrov5Tlm54gbnVsbFxuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3BhcmVudC51dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUocGFyZW50LnV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnIDlkI7lj5HotbcgaXBjIOWIm+W7uui1hOa6kFxuICAgICAqIEBwYXJhbSB1cmwg55uu5qCH5L2N572uXG4gICAgICogQHBhcmFtIGNvbnRlbnQg5aGr5YWF5YaF5a65XG4gICAgICogQHBhcmFtIG9wdGlvbiDlj6/pgInphY3nva5cbiAgICAgKi9cbiAgICBhc3luYyBhZGQodXJsOiBzdHJpbmcsIGNvbnRlbnQ6IEJ1ZmZlciB8IHN0cmluZyB8IG51bGwsIG9wdGlvbj86IElDcmVhdGVPcHRpb24pIHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSAoYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnY3JlYXRlLWFzc2V0JywgdXJsLCBjb250ZW50LCB7XG4gICAgICAgICAgICBvdmVyd3JpdGU6IG9wdGlvbj8ub3ZlcndyaXRlLFxuICAgICAgICB9KSkgYXMgSUFzc2V0SW5mbztcblxuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdChhc3NldC51dWlkKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcoYXNzZXQudXVpZCk7XG4gICAgICAgICAgICB9LCAzMDApO1xuXG4gICAgICAgICAgICByZXR1cm4gYXNzZXQudXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pS25YiwIGlwYyDmtojmga8gYXNzZXQtZGI6YXNzZXQtYWRkXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIGluZm8g5pWw5o2uXG4gICAgICovXG4gICAgYXN5bmMgYWRkZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWUucHVzaCh7IHV1aWQsIGFuaW1hdGlvbjogJ3NocmluaycgfSk7XG4gICAgICAgIHRyZWVEYXRhLmFkZGVkKHV1aWQsIGluZm8pO1xuICAgICAgICB2bS5yZWZyZXNoaW5nKCdhZGRlZCcsIGluZm8ubmFtZSk7XG5cbiAgICAgICAgY29uc3QgZm9sZGVyVXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG4gICAgICAgIHZtLnJlZnJlc2hpbmcuaWdub3Jlc1tmb2xkZXJVdWlkXSA9IHRydWU7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmm7TmlrDmoJHlvaLoioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gaW5mbyDmlbDmja5cbiAgICAgKi9cbiAgICBhc3luYyBjaGFuZ2VkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIC8vIOWIoOmZpOW3sue8k+WtmOeahOe8qeeVpeWbvlxuICAgICAgICB1dGlscy50aHVtYm5haWwuZGVsZXRlKHV1aWQpO1xuXG4gICAgICAgIHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLnB1c2goeyB1dWlkLCBhbmltYXRpb246ICdsaWdodCcgfSk7XG5cbiAgICAgICAgdHJlZURhdGEuY2hhbmdlZCh1dWlkLCBpbmZvKTtcbiAgICAgICAgdm0ucmVmcmVzaGluZygnY2hhbmdlZCcsIGluZm8ubmFtZSwgdXVpZCk7XG5cbiAgICAgICAgY29uc3QgZm9sZGVyVXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF07XG4gICAgICAgIHZtLnJlZnJlc2hpbmcuaWdub3Jlc1tmb2xkZXJVdWlkXSA9IHRydWU7XG5cbiAgICAgICAgaWYgKHV1aWQgPT09IHZtLmludG9WaWV3QnlVc2VyKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnRvVmlld0J5VXNlciA9IHZtLmludG9WaWV3QnlVc2VyO1xuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcoaW50b1ZpZXdCeVVzZXIpO1xuICAgICAgICAgICAgfSwgMzAwKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogaXBjIOWPkei1t+WIoOmZpOi1hOa6kFxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWmguaenOivpei1hOa6kOayoeacieiiq+mAieS4re+8jOWImeWPquaYr+WIoOmZpOatpOWNleS4qlxuICAgICAgICAgKiDlpoLmnpzor6XotYTmupDmmK/ooqvpgInkuK3kuobvvIzooajmmI7opoHliKDpmaTmiYDmnInpgInkuK3poblcbiAgICAgICAgICovXG4gICAgICAgIGxldCBzZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCBpblNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCk7XG4gICAgICAgIGlmICh1dWlkICYmICFpblNlbGVjdHMpIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBbdXVpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxlY3RzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgLy8g5pyJ5pWI55qE5Y+v5Yig6Zmk55qE6IqC54K5XG4gICAgICAgIGxldCB2YWxpZFV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gc2VsZWN0c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQgfHwgdXRpbHMuY2FuTm90RGVsZXRlKGFzc2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnoa7kv50gMS8y77yaIHZhbGlkVXVpZHMg6YeM6Z2i5Lu75LiA6IqC54K56YO95LiN5pivIHV1aWQg55qE5a2Q6IqC54K5XG4gICAgICAgICAgICB2YWxpZFV1aWRzID0gdmFsaWRVdWlkcy5maWx0ZXIoKHZhbGlkVXVpZCkgPT4gIXV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIHZhbGlkVXVpZCkpO1xuXG4gICAgICAgICAgICAvLyDnoa7kv50gMi8y77yaIHZhbGlkVXVpZHMg6YeM55qE5Lu75LiA6IqC54K56YO95LiN5pivIHV1aWQg55qE54i26IqC54K5XG4gICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuc29tZSgodmFsaWRVdWlkKSA9PiB1dGlscy5pc0FJbmNsdWRlQih2YWxpZFV1aWQsIHV1aWQpKSkge1xuICAgICAgICAgICAgICAgIHZhbGlkVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbGlkVXVpZHNMZW5ndGggPSB2YWxpZFV1aWRzLmxlbmd0aDtcbiAgICAgICAgaWYgKCF2YWxpZFV1aWRzTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjljJbliKDpmaTml7bnmoTlhoXlrrnmj5DnpLpcbiAgICAgICAgY29uc3Qgc2hvd0luZGV4ID0gNTtcbiAgICAgICAgbGV0IGZpbGVsaXN0ID0gJyc7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICBpZiAoaSA+IHNob3dJbmRleCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHZhbGlkVXVpZCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpIDwgc2hvd0luZGV4KSB7XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gYCR7YXNzZXQubmFtZX1cXG5gO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCArPSAnLi4uJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZWRMaXN0ID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnZXhlY3V0ZS1zY3JpcHQnLCB7XG4gICAgICAgICAgICBuYW1lOiAnYXNzZXRzJyxcbiAgICAgICAgICAgIG1ldGhvZDogJ3F1ZXJ5RGVwZW5kcycsXG4gICAgICAgICAgICBhcmdzOiBbdmFsaWRVdWlkc10sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh1c2VkTGlzdCAmJiB1c2VkTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmaWxlbGlzdCArPSAnXFxuJyArIEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLm1heWJlRGVwZW5kT3RoZXInKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1c2VkTGlzdFtpXSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gYFxcbiR7dXNlZExpc3RbaV19YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VkTGlzdC5sZW5ndGggPiA1KSB7XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gJ1xcbi4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtc2cgPSBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5zdXJlRGVsZXRlJywge1xuICAgICAgICAgICAgbGVuZ3RoOiBTdHJpbmcodmFsaWRVdWlkc0xlbmd0aCksXG4gICAgICAgICAgICBmaWxlbGlzdCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5Yig6Zmk5YmN6K+i6ZeuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybihtc2csIHtcbiAgICAgICAgICAgIGJ1dHRvbnM6IFsnWWVzJywgJ0NhbmNlbCddLFxuICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXNrczogQXJyYXk8UHJvbWlzZTxBc3NldEluZm8gfCBudWxsPj4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHZhbGlkVXVpZCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3ZhbGlkVXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh2YWxpZFV1aWQpO1xuXG4gICAgICAgICAgICB0YXNrcy5wdXNoKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2RlbGV0ZS1hc3NldCcsIGFzc2V0LnVybCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdHJlZURhdGEudXVpZFRvU3RhdGVbdmFsaWRVdWlkc1tpXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOmHjee9ruaJgOaciemAieS4rVxuICAgICAgICBpblNlbGVjdHMgJiYgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOS7juagkeW9ouWIoOmZpOi1hOa6kOiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOaVsOaNrlxuICAgICAqL1xuICAgIGRlbGV0ZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgLy8g5Yig6Zmk5bey57yT5a2Y55qE57yp55Wl5Zu+XG4gICAgICAgIHV0aWxzLnRodW1ibmFpbC5kZWxldGUodXVpZCk7XG5cbiAgICAgICAgdHJlZURhdGEuZGVsZXRlZCh1dWlkLCBpbmZvKTtcbiAgICAgICAgdm0ucmVmcmVzaGluZygnZGVsZXRlZCcsIGluZm8ubmFtZSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDplK7nm5gg5LiK5LiL5bem5Y+zXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICB1cERvd25MZWZ0UmlnaHQoZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHZtLmdldExhc3RTZWxlY3QoKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBpZiAoIXZtLmlzRXhwYW5kKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGxhc3QsIHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltsYXN0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBpZiAodm0uaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtsYXN0XTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgIT09IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QocGFyZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNpYmxpbmdzID0gdXRpbHMuZ2V0U2libGluZyhsYXN0KTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50O1xuICAgICAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd1cCc6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZG93bic6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1syXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGN1cnJlbnQudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsg5LiK5LiL566t5aS077yM5aSa6YCJXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICBhc3luYyBzaGlmdFVwRG93bihkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBsZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IFtsYXN0LCBsYXN0UHJldiwgbGFzdE5leHRdID0gdXRpbHMuZ2V0U2libGluZyhwYW5lbERhdGEuYWN0LnNlbGVjdHNbbGVuZ3RoIC0gMV0pO1xuICAgICAgICBjb25zdCBoYXNMYXN0UHJldiA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgY29uc3QgaGFzTGFzdE5leHQgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMobGFzdE5leHQudXVpZCk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3VwJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0UHJldikge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGxhc3RQcmV2LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0UHJldi51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYXNzZXQnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdFByZXYudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdFByZXYudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gbGFzdE5leHQudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2Fzc2V0JywgbGFzdC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcobGFzdE5leHQudXVpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdE5leHQudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdE5leHQudXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQiOW5tiBzaGlmdCDlpJrpgInov4fnqIvkuK3liY3lkI7nmoTlt7LpgInkuK3poblcbiAgICAgKiDmr5TlpoIgYWIgY2RlIOmhueS4rSBhLCBjZGUg5bey6YCJ5LitLCBiIOacqumAieS4rVxuICAgICAqIOW9k+mAieS4rSBiIOaXtu+8jOWQiOW5tumAieS4remhuSBjZGUg77yM5bm25bCG5pyr5bC+6YCJ5Lit6aG555qE5oyH6ZKI5oyH5ZCRIGVcbiAgICAgKi9cbiAgICBzaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKSB7XG4gICAgICAgIGlmICghdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBrZWVwRmluZE5leHQgPSB0cnVlO1xuICAgICAgICBsZXQgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZDtcblxuICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9ICcnOyAvLyDph43nva5cblxuICAgICAgICBsZXQgbWF4TG9vcE51bWJlciA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChrZWVwRmluZE5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IHV0aWxzLmdldFNpYmxpbmcoZmluZFV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFyciB8fCAhYXJyWzFdIHx8ICFhcnJbMl0gfHwgIW1heExvb3BOdW1iZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbmRVdWlkID0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gYXJyWzJdLnV1aWQgOiBhcnJbMV0udXVpZDtcbiAgICAgICAgICAgIG1heExvb3BOdW1iZXItLTtcblxuICAgICAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhmaW5kVXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGZpbmRVdWlkKSwgMSk7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2goZmluZFV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrZWVwRmluZE5leHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5p2l6Ieq5b+r5o236ZSu55qEIHJlbmFtZVxuICAgICAqL1xuICAgIGFzeW5jIGtleWJvYXJkUmVuYW1lKCkge1xuICAgICAgICBpZiAodm0ucmVuYW1lVXJsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1dWlkID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcblxuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoYXNzZXQgJiYgIXV0aWxzLmNhbk5vdFJlbmFtZShhc3NldCkpIHtcbiAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHV1aWQpO1xuICAgICAgICAgICAgdm0ucmVuYW1lVXJsID0gYXNzZXQudXJsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnph43lkI3lkb1cbiAgICAgKiDov5nmmK/lvILmraXnmoTvvIzlj6rlgZrlj5HpgIFcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gZmlsZU5hbWUg5paH5Lu25ZCNXG4gICAgICovXG4gICAgYXN5bmMgcmVuYW1lKHV1aWQ6IHN0cmluZywgZmlsZU5hbWUgPSAnJykge1xuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0IHx8IHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOa4heepuumcgOimgSByZW5hbWUg55qE6IqC54K5XG4gICAgICAgIHZtLnJlbmFtZVVybCA9ICcnO1xuXG4gICAgICAgIGlmICh1dGlscy5jYW5Ob3RSZW5hbWUoYXNzZXQpIHx8IGZpbGVOYW1lID09PSAnJyB8fCBmaWxlTmFtZSA9PT0gYXNzZXQuZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vIG5hbWUg5a2Y5Zyo5LiU5LiO5LmL5YmN55qE5LiN5LiA5qC35omN6IO96YeN5ZCN5ZG977yM5ZCm5YiZ6L+Y5Y6f54q25oCBXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJ2xvYWRpbmcnO1xuXG4gICAgICAgIC8vIOmHjeWQjeWRvei1hOa6kFxuICAgICAgICBjb25zdCBuYW1lID0gZmlsZU5hbWUgKyBhc3NldC5maWxlRXh0O1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBgJHtwYXJlbnQudXJsfS8ke25hbWV9YDtcbiAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnbW92ZS1hc3NldCcsIGFzc2V0LnVybCwgdGFyZ2V0KTtcblxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICBzb3J0KCkge1xuICAgICAgICB0cmVlRGF0YS5yZXNvcnQoKTtcbiAgICB9LFxuICAgIHNlYXJjaCgpIHtcbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgLy8g5pCc57Si5pyJ5Y+Y5Yqo6YO95YWI5rua5Zue6aG26YOoXG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hWYWx1ZSkge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveC5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnlKggc2V0VGltZW91dCDkuIvkuIDluKfph43mlrDlrprkvY1cbiAgICAgICAgaWYgKCFwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hJbkZvbGRlciAmJiAhcGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVmFsdWUpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlTZWxlY3RlZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3pq5jkuq7moYbpgInlvZPliY3miYDlpITnmoTmlofku7blpLnojIPlm7RcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBkcmFnT3Zlcih1dWlkOiBzdHJpbmcsIGRyYWdPdmVyQXNzZXQ/OiBJQXNzZXRJbmZvIHwgbnVsbCkge1xuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbklkKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghYXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZtLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmRyYWdPdmVyKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0sIGRyYWdPdmVyQXNzZXQgfHwgYXNzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRyYWcg5oKs5YGc5LiA5q615pe26Ze05ZCO6Ieq5Yqo5bGV5byA5paH5Lu25aS5XG4gICAgICAgICAgICBjb25zdCBub3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChkcmFnT3ZlclV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclV1aWQgPSB1dWlkO1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVGltZUlkID0gbm93VGltZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vd1RpbWUgLSBkcmFnT3ZlclRpbWVJZCA+IDgwMCkge1xuICAgICAgICAgICAgICAgICAgICB2bS50b2dnbGUodXVpZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCAkdmlld0JveCA9IHBhbmVsRGF0YS4kLnZpZXdCb3g7XG5cbiAgICAgICAgICAgIC8vIOW+ruiwgyB0b3BcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdFNjcm9sbCA9IHZtLnNjcm9sbFRvcCAlIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBhZGp1c3RUb3AgPSAkdmlld0JveC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgLSB2bS4kZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wOyAvLyDmu5rliqjliLDlupXpg6jkuoZcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdHJlZURhdGEuZGlzcGxheUFycmF5LmluZGV4T2YodXVpZCk7XG4gICAgICAgICAgICBjb25zdCB0b3AgPSBpbmRleCAqIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQgKyBhZGp1c3RTY3JvbGwgLSBhZGp1c3RUb3AgKyAzO1xuXG4gICAgICAgICAgICBjb25zdCBleHBhbmRDaGlsZHJlbjogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIGxldCBvcGFjaXR5ID0gYXNzZXQucmVhZG9ubHkgPyAwIDogMTtcblxuICAgICAgICAgICAgaWYgKCF2bS5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmdldENoaWxkcmVuVXVpZCh1dWlkLCBleHBhbmRDaGlsZHJlbiwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChkcmFnT3ZlckFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHkgPSAhZHJhZ092ZXJBc3NldC5pc0RpcmVjdG9yeSA/IDAgOiBvcGFjaXR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveFN0eWxlID0ge1xuICAgICAgICAgICAgICAgIGxlZnQ6ICR2aWV3Qm94LnNjcm9sbExlZnQgKyAncHgnLFxuICAgICAgICAgICAgICAgIHRvcDogdG9wICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IChleHBhbmRDaGlsZHJlbi5sZW5ndGggKyAxKSAqIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQgKyAyICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBvcGFjaXR5LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3mhJ/nn6XlvZPliY3miYDlpITnmoTmlofku7blpLnvvIznprvlvIDlkI7lj5bmtojpq5jkuq5cbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBkcmFnTGVhdmUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgIGlmIChhc3NldCAmJiAhYXNzZXQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgIGFzc2V0ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVthc3NldC51dWlkXSA9ICcnO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiB0cmVlIOWuueWZqOS4iueahCBkcm9wXG4gICAgICogQHBhcmFtIGV2ZW50IOm8oOagh+S6i+S7tlxuICAgICAqL1xuICAgIGFzeW5jIGRyb3AoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShFZGl0b3IuVUkuRHJhZ0FyZWEuY3VycmVudERyYWdJbmZvKSkgfHwge307XG5cbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ54i26IqC54K577yM5L6L5aaC5pCc57Si5ZCO5rKh57uT5p6c77yM5YiZ5LiN5ZON5bqUXG4gICAgICAgIGlmICghdm0uYXNzZXRzWzBdKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb290VXVpZCA9IHZtLmFzc2V0c1swXS51dWlkO1xuICAgICAgICBjb25zdCBsb2NhbEZpbGVzID0gQXJyYXkuZnJvbShldmVudC5kYXRhVHJhbnNmZXIhLmZpbGVzKTtcbiAgICAgICAgaWYgKGxvY2FsRmlsZXMgJiYgbG9jYWxGaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyDku47lpJbpg6jmi5bmlofku7bov5vmnaVcbiAgICAgICAgICAgIGRhdGEudHlwZSA9ICdvc0ZpbGUnO1xuICAgICAgICAgICAgZGF0YS5maWxlcyA9IGxvY2FsRmlsZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS52YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KGRhdGEudmFsdWUpO1xuICAgICAgICAgICAgLy8g5aaC5p6c5LuO5qC56IqC54K556e75Yqo77yM5Y+I6JC95Zue5qC56IqC54K577yM5YiZ5LiN6ZyA6KaB56e75YqoXG4gICAgICAgICAgICBpZiAocGFyZW50ICYmIHBhcmVudC51dWlkID09PSByb290VXVpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGEudG8gPSByb290VXVpZDsgLy8g6YO95b2S5LqO5qC56IqC54K5XG4gICAgICAgIGRhdGEuY29weSA9IGV2ZW50LmN0cmxLZXk7XG4gICAgICAgIHZtLmlwY0Ryb3AoZGF0YSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDov5vlhaUgdHJlZSDlrrnlmahcbiAgICAgKi9cbiAgICBkcmFnRW50ZXIoKSB7XG4gICAgICAgIC8vIOaQnOe0ouaooeW8j+S4i++8jOS4jeivhuWIq+S4uuaLluWFpSB0cmVlIOWuueWZqFxuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmRyb3BCb3hTdHlsZSA9IHt9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICB2bS5kcmFnT3Zlcih0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi1hOa6kOaLluWKqFxuICAgICAqIEBwYXJhbSBkcmFnSW5mbyDkv6Hmga9cbiAgICAgKi9cbiAgICBhc3luYyBpcGNEcm9wKGRyYWdJbmZvOiBJRHJhZ0luZm8pIHtcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZm9jdXNXaW5kb3coKTsgLy8g5ouW6L+b57O757uf5paH5Lu25ZCO56qX5Y+j6I635b6X54Sm54K577yM5Lul6Kem5Y+RIGlwYyDnmoTmlLblj5FcblxuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAzMDApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvQXNzZXQgPSB1dGlscy5nZXREaXJlY3RvcnkoZHJhZ0luZm8udG8pO1xuXG4gICAgICAgIGlmICghdG9Bc3NldCB8fCB1dGlscy5jYW5Ob3RDcmVhdGUodG9Bc3NldCkpIHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmNhbk5vdERyb3AnLCB7IHV1aWQ6IGRyYWdJbmZvLnRvIH0pO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDku47lpJbpg6jmi5bmlofku7bov5vmnaVcbiAgICAgICAgaWYgKGRyYWdJbmZvLnR5cGUgPT09ICdvc0ZpbGUnKSB7XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uZmlsZXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmaWxlcGF0aHMgPSBkcmFnSW5mby5maWxlcy5tYXAoKGZpbGU6IGFueSkgPT4gZmlsZS5wYXRoKTtcblxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdG9Bc3NldC51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHRvQXNzZXQudXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICAgICAgLy8g5om+5Ye65Lya6YeN5aSN55qE5paH5Lu26ZuG5ZCIXG4gICAgICAgICAgICBjb25zdCByZXBlYXRGaWxlczogSVJlcGVhdEZpbGVbXSA9IGF3YWl0IGZpbGVwYXRocy5yZWR1Y2UoYXN5bmMgKHJlcywgZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcztcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldFVSTCA9IHRvQXNzZXQudXJsICsgJy8nICsgYmFzZW5hbWUoZmlsZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3QXNzZXRVUkwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgYXNzZXRVUkwpO1xuICAgICAgICAgICAgICAgIGlmIChhc3NldFVSTCAhPT0gbmV3QXNzZXRVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGJhc2VuYW1lKGZpbGUpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0sIFByb21pc2UucmVzb2x2ZShbXSkpO1xuXG4gICAgICAgICAgICBjb25zdCBvcHRpb24gPSB7IG92ZXJ3cml0ZTogZmFsc2UsIHJlbmFtZTogZmFsc2UgfTsgLy8g5a+85YWl6YCJ6aG5XG4gICAgICAgICAgICBsZXQgc3RvcCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKHJlcGVhdEZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyDotoXlh7o15Liq5paH5Lu25bCx55SoLi4u5Luj5pu/5LqGXG4gICAgICAgICAgICAgICAgbGV0IGRldGFpbCA9IHJlcGVhdEZpbGVzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKHY6IElSZXBlYXRGaWxlKSA9PiB2Lm5hbWUpXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCA1KVxuICAgICAgICAgICAgICAgICAgICAuam9pbignXFxuJyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGVhdEZpbGVzLmxlbmd0aCA+IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsICs9ICdcXG4gLi4uJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLnJlcGVhdFRpcCcpLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGRldGFpbCwgLy8g5o+Q56S656OB55uY6Lev5b6EXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLm92ZXJ3cml0ZScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUucmVuYW1lJyksXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5jYW5jZWwnKSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiAyLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb24ub3ZlcndyaXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5yZXNwb25zZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb24ucmVuYW1lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghc3RvcCAmJiBmaWxlcGF0aHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgICAgICAgICAgICAgIGZpbGVwYXRocy5tYXAoKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Fzc2V0LWRiJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW1wb3J0LWFzc2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvQXNzZXQudXJsICsgJy8nICsgYmFzZW5hbWUoZmlsZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0RmlsZXMuc29tZSgodjogSVJlcGVhdEZpbGUpID0+IHYuZmlsZSA9PT0gZmlsZSkgPyBvcHRpb24gOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWvvOWFpeWujOaIkOaIluiAheWPlua2iOS6huWvvOWFpe+8jOi/mOWOn+eItue6p+eKtuaAgVxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdG9Bc3NldC51dWlkXSA9ICcnO1xuICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUodG9Bc3NldC51dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICB9IGVsc2UgaWYgKGRyYWdJbmZvLnR5cGUgPT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgLy8g5piO56Gu5o6l5Y+X5aSW6YOo5ouW6L+b5p2l55qE6IqC54K5IGNjLk5vZGVcbiAgICAgICAgICAgIGZvciAoY29uc3Qgbm9kZSBvZiBkcmFnSW5mby5hZGRpdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSAhPT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVVdWlkID0gbm9kZS52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAncXVlcnktbm9kZScsIG5vZGVVdWlkKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cmwgPSBgJHt0b0Fzc2V0LnVybH0vJHtkdW1wLm5hbWUudmFsdWUgfHwgJ05vZGUnfS5wcmVmYWJgO1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtcHJlZmFiJywgbm9kZVV1aWQsIHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcyAmJiBwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMuaW5jbHVkZXMoZHJhZ0luZm8udHlwZSkpIHtcbiAgICAgICAgICAgIC8vIOivpeexu+Wei+eahOS6i+S7tuacieWklumDqOazqOWGjOeahOWKqOS9nO+8jOi9rOeUseWklumDqOazqOWGjOS6i+S7tuaOpeeuoVxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gT2JqZWN0LnZhbHVlcyhwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AuY2FsbGJhY2tzW2RyYWdJbmZvLnR5cGVdKSBhcyBGdW5jdGlvbltdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2FsbGJhY2tzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQoZHJhZ0luZm8udG8pO1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2s6IEZ1bmN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm86IERyb3BDYWxsYmFja0luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRGlyZWN0b3J5OiBhc3NldC5pc0RpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soaW5mbywgZHJhZ0luZm8uYWRkaXRpb25hbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIWRyYWdJbmZvLmFkZGl0aW9uYWwgfHwgIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uYWRkaXRpb25hbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkcmFnSW5mby5jb3B5KSB7XG4gICAgICAgICAgICAgICAgLy8g5oyJ5L2P5LqGIGN0cmwg6ZSu77yM5ouW5Yqo5aSN5Yi2XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZHMgPSBkcmFnSW5mby5hZGRpdGlvbmFsLm1hcCgoaW5mbzogSURyYWdBZGRpdGlvbmFsKSA9PiBpbmZvLnZhbHVlLnNwbGl0KCdAJylbMF0pO1xuICAgICAgICAgICAgICAgIHZtLmNvcHkoWy4uLm5ldyBTZXQodXVpZHMpXSk7XG4gICAgICAgICAgICAgICAgdm0ucGFzdGUoZHJhZ0luZm8udG8pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShkcmFnSW5mbywgdG9Bc3NldCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItlxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIGNvcHkodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29waWVzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBjb3BpZXMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdXVpZCDmmK8g5a2X56ymXG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjb3BpZXMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5LiN5Y+v5aSN5Yi255qE6IqC54K5XG4gICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gY29waWVzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0ICYmICF1dGlscy5jYW5Ob3RDb3B5KGFzc2V0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGNvcGllZFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWwhuWkjeWItueahCB1dWlkcyDlpITnkIbmiJDliarliIfmnb/nmoTlr7nosaHnsbvlnotcbiAgICAgICAgY29uc3QgY29waWVkSW5mbzogSUNvcGllZEluZm8gPSB2bS51dWlkc1RvQ29waWVkSW5mbyhjb3BpZWRVdWlkcyk7XG4gICAgICAgIC8vIOWwhuWkjeWItuiKgueCueeahCB1dWlkIOWtmOaUvuWIsOe7n+S4gOeahOWJquWIh+adv1xuICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLndyaXRlKCdhc3NldHMtY29waWVkLWluZm8nLCBjb3BpZWRJbmZvKTtcblxuICAgICAgICB2bS5yZW5kZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOeymOi0tFxuICAgICAqIEBwYXJhbSB1dWlkIOeymOi0tOWIsOatpOebruagh+iKgueCuVxuICAgICAqIEBwYXJhbSBjb3BpZWRVdWlkcyDooqvlpI3liLbnmoToioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBwYXN0ZSh1dWlkOiBzdHJpbmcsIGNvcGllZFV1aWRzPzogc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRlc3ROb2RlID0gdXRpbHMuY2xvc2VzdFdoaWNoQ2FuQ3JlYXRlKHV1aWQpOyAvLyDoh6rouqvmiJbniLbnuqfmlofku7blpLlcbiAgICAgICAgaWYgKCFkZXN0Tm9kZSkge1xuICAgICAgICAgICAgLy8g5rKh5pyJ5Y+v55So55qEXG4gICAgICAgICAgICBjb25zdCBtc2cgPSBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5jYW5Ob3RQYXN0ZScsIHsgdXVpZCB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybihtc2cpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LyY5YWI5aSE55CG5Ymq5YiH55qE5oOF5Ya1XG4gICAgICAgIGNvbnN0IGN1dEluZm8gPSBFZGl0b3IuQ2xpcGJvYXJkLnJlYWQoJ2Fzc2V0cy1jdXQtaW5mbycpO1xuICAgICAgICAvLyDot6jnvJbovpHlmajkuI3lj6/liarliIfnspjotLTvvIzliarliIfml7blj6/og73pg73ov4fmu6TlhYnkuobmiYDku6XkuZ/pnIDopoHliKTmlq0gYXNzZXRJbmZvLmxlbmd0aFxuICAgICAgICBpZiAoY3V0SW5mbyAmJiBjdXRJbmZvLmFzc2V0SW5mby5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCA9PT0gY3V0SW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRJbmZvLmFzc2V0SW5mby5tYXAoKGl0ZW06IElDb3BpZWRBc3NldEluZm8pID0+IGl0ZW0udXVpZCk7XG4gICAgICAgICAgICAvLyDlpoLmnpzliarliIfliLDoh6rouqvmlofku7blpLnvvIznu4jmraJcbiAgICAgICAgICAgIGlmIChkZXN0Tm9kZSAmJiBjdXRVdWlkcy5pbmNsdWRlcyhkZXN0Tm9kZS51dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbW92ZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbDogY3V0VXVpZHMubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHV1aWQgfTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IHZtLm1vdmUobW92ZURhdGEsIGRlc3ROb2RlKTtcblxuICAgICAgICAgICAgLy8g572u56m65Ymq5YiH5p2/55qE5aSN5Yi25ZKM5Ymq5YiH6LWE5rqQXG4gICAgICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWIpOaWreS4jeaYr+WFtuS7luaTjeS9nOS8oOWFpeeahOWPguaVsFxuICAgICAgICBpZiAoIWNvcGllZFV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb3BpZWRJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdhc3NldHMtY29waWVkLWluZm8nKTtcbiAgICAgICAgICAgIGxldCBjb3BpZWRGaWxlcyA9IFtdO1xuICAgICAgICAgICAgaWYgKGNvcGllZEluZm8pIHtcbiAgICAgICAgICAgICAgICAvLyDku47liarliIfmnb/kuK3ojrflj5YgY29waWVkVXVpZHMg5ZKM5aSE55CG6Leo57yW6L6R5Zmo5pe255qE5paH5Lu26Lev5b6EXG4gICAgICAgICAgICAgICAgY29waWVkVXVpZHMgPSBjb3BpZWRJbmZvLmFzc2V0SW5mby5tYXAoKGl0ZW06IElDb3BpZWRBc3NldEluZm8pID0+IGl0ZW0udXVpZCk7XG4gICAgICAgICAgICAgICAgY29waWVkRmlsZXMgPSBjb3BpZWRJbmZvLmFzc2V0SW5mby5tYXAoKGl0ZW06IElDb3BpZWRBc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyY1BhdGg6IGl0ZW0uZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhclBhdGg6IGRlc3ROb2RlLnVybCArICcvJyArIGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUT0RPOlxuICAgICAgICAgICAgICog6Leo5paH5Lu257O757uf77yM5pqC5LiN5pSv5oyB77yM5Y+v5Lul6ICD6JmR5aaC5L2V5aSN55SoIGRyb3Ag5Yqo5L2cXG4gICAgICAgICAgICAgKiDnm67liY3lj6rmlK/mjIHot6jnvJbovpHlmajvvIzkvb/nlKggcHJvamVjdC5wYXRoIOWIpOaWre+8jHBhc3RlIOWSjCBkcm9wIOeLrOeri+WunueOsFxuICAgICAgICAgICAgICog5Ymq5YiH5p2/5Lit5a2Y5YKo55qE5piv5a+56LGh57uT5p6E77yM5ZCO57ut5Y+v5Lul5YKo5a2YIEpTT04g5a2X56ym5LiyXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8vIOi3qOe8lui+keWZqOeymOi0tFxuICAgICAgICAgICAgaWYgKGNvcGllZEZpbGVzLmxlbmd0aCAmJiBFZGl0b3IuUHJvamVjdC5wYXRoICE9PSBjb3BpZWRJbmZvLnByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICAgICAgLy8g5pi+56S6IGxvYWRpbmcg5pWI5p6cXG4gICAgICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbZGVzdE5vZGUudXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudW5GcmVlemUoZGVzdE5vZGUudXVpZCk7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGRlc3ROb2RlLnV1aWQsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGNvcGllZEZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2ltcG9ydC1hc3NldCcsIGZpbGUuc3JjUGF0aCwgZmlsZS50YXJQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbZGVzdE5vZGUudXVpZF0gPSAnJztcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWmguaenOWkjeWItuWIsOiHqui6q+aWh+S7tuWkue+8jOmcgOimgeW+gOS4iuenu+S4gOWxguaWh+S7tuWkuVxuICAgICAgICBpZiAoZGVzdE5vZGUgJiYgY29waWVkVXVpZHM/LmluY2x1ZGVzKGRlc3ROb2RlLnV1aWQpKSB7XG4gICAgICAgICAgICBkZXN0Tm9kZSA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZSh0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2Rlc3ROb2RlLnV1aWRdKTtcbiAgICAgICAgICAgIGlmICghZGVzdE5vZGUpIHtcbiAgICAgICAgICAgICAgICAvLyDmsqHmnInlj6/nlKjnmoRcbiAgICAgICAgICAgICAgICBjb25zdCBtc2cgPSBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5jYW5Ob3RQYXN0ZScsIHsgdXVpZCB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4obXNnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaW5hbGx5Q2FuUGFzdGU6IHN0cmluZ1tdID0gW107IC8vIOacgOWQjuWPr+WkjeWItueahOmhuVxuICAgICAgICBjb3BpZWRVdWlkcz8uZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDoioLngrnlj6/lpI3liLZcbiAgICAgICAgICAgIGNvbnN0IGNhbkNvcHkgPSAhdXRpbHMuY2FuTm90Q29weShhc3NldCk7XG4gICAgICAgICAgICBpZiAoIWNhbkNvcHkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YXJuID0gYCR7RWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuY29weUZhaWwnKX06ICR7YXNzZXQubmFtZX1gO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybih3YXJuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5LiN5piv5q2k55uu5qCH6IqC54K555qE54i26IqC54K577yI5LiN5Zyo5a6D55qE5LiK57qn5paH5Lu25aS56YeM77yJXG4gICAgICAgICAgICBjb25zdCBpbnNpZGUgPSB1dGlscy5pc0FJbmNsdWRlQih1dWlkLCBkZXN0Tm9kZS51dWlkKTtcbiAgICAgICAgICAgIGlmIChpbnNpZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YXJuID0gYCR7RWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZXJyb3JQYXN0ZVBhcmVudFRvQ2hpbGQnKX06ICR7YXNzZXQubmFtZX1gO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybih3YXJuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhbkNvcHkgJiYgIWluc2lkZSkge1xuICAgICAgICAgICAgICAgIGZpbmFsbHlDYW5QYXN0ZS5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbmFsbHlDYW5QYXN0ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGxldCBhc3NldDtcbiAgICAgICAgbGV0IG5ld0Fzc2V0OiBJQXNzZXRJbmZvIHwgbnVsbDtcbiAgICAgICAgY29uc3QgbmV3U2VsZWN0czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgLy8g5pi+56S6IGxvYWRpbmcg5pWI5p6cXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZShkZXN0Tm9kZS51dWlkKTtcbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgdm0udG9nZ2xlKGRlc3ROb2RlLnV1aWQsIHRydWUpO1xuXG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQoZmluYWxseUNhblBhc3RlW2luZGV4XSk7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgbmV3QXNzZXQgPSBudWxsO1xuXG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gYmFzZW5hbWUoYXNzZXQudXJsKTtcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gYCR7ZGVzdE5vZGUudXJsfS8ke25hbWV9YDtcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICBuZXdBc3NldCA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjb3B5LWFzc2V0JywgYXNzZXQudXJsLCB0YXJnZXQpKSBhcyBJQXNzZXRJbmZvIHwgbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChuZXdBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IG5ld0Fzc2V0LnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgIG5ld1NlbGVjdHMucHVzaChuZXdBc3NldC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gd2hpbGUgKG5ld0Fzc2V0KTtcblxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICcnO1xuXG4gICAgICAgIC8vIOmAieS4reaWsOeahOmhueebrlxuICAgICAgICB2bS5pcGNTZWxlY3QobmV3U2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliarliIfmmK/pooTlrprnmoTooYzkuLrvvIzlj6rmnInlho3miafooYznspjotLTmk43kvZzmiY3kvJrnlJ/mlYhcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBjdXQodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3V0cyA9IFtdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgY3V0cyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1dWlkIOaYryDlrZfnrKZcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi/h+a7pOS4jeWPr+WJquWIh+eahOiKgueCuVxuICAgICAgICBjb25zdCBjdXRVdWlkcyA9IGN1dHMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdEN1dChhc3NldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOe7meWkjeWItueahOWKqOS9nOWPjemmiOaIkOWKn1xuICAgICAgICBjdXRVdWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHV1aWQsICdsaWdodCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDlsIbliarliIfnmoQgdXVpZHMg5aSE55CG5oiQ5Ymq5YiH5p2/55qE5a+56LGh57G75Z6LXG4gICAgICAgIGNvbnN0IGN1dEluZm86IElDb3BpZWRJbmZvID0gdm0udXVpZHNUb0NvcGllZEluZm8oY3V0VXVpZHMpO1xuICAgICAgICAvLyDlsIbliarliIfoioLngrnnmoQgdXVpZCDlrZjmlL7liLDnu5/kuIDnmoTliarliIfmnb9cbiAgICAgICAgRWRpdG9yLkNsaXBib2FyZC53cml0ZSgnYXNzZXRzLWN1dC1pbmZvJywgY3V0SW5mbyk7XG5cbiAgICAgICAgdm0ucmVuZGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlsIblpI3liLYv5Ymq5YiH55qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IHV1aWRzXG4gICAgICogQHJldHVybiB7Kn0gIHtJQ29waWVkSW5mb31cbiAgICAgKi9cbiAgICB1dWlkc1RvQ29waWVkSW5mbyh1dWlkczogc3RyaW5nW10pOiBJQ29waWVkSW5mbyB7XG4gICAgICAgIGNvbnN0IGNvcGllZEluZm8gPSA8SUNvcGllZEluZm8+e307XG4gICAgICAgIGNvcGllZEluZm8ucHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xuICAgICAgICBjb3BpZWRJbmZvLmFzc2V0SW5mbyA9IFtdO1xuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0OiBJQXNzZXRJbmZvIHwgbnVsbCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgY29waWVkQXNzZXRJbmZvOiBJQ29waWVkQXNzZXRJbmZvID0ge1xuICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0ID8gYXNzZXQudXVpZCA6ICcnLFxuICAgICAgICAgICAgICAgIGZpbGU6IGFzc2V0ID8gYXNzZXQuZmlsZSA6ICcnLFxuICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0ID8gYXNzZXQubmFtZSA6ICcnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvcGllZEluZm8uYXNzZXRJbmZvLnB1c2goY29waWVkQXNzZXRJbmZvKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjb3BpZWRJbmZvO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi26LWE5rqQ77yM5bmz57qnXG4gICAgICogQHBhcmFtIHV1aWRzIOi1hOa6kFxuICAgICAqL1xuICAgIGFzeW5jIGR1cGxpY2F0ZSh1dWlkczogc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV1aWRzKSB7XG4gICAgICAgICAgICB1dWlkcyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gdXVpZHMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdER1cGxpY2F0ZShhc3NldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjb3BpZWRVdWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIGNvcGllZFV1aWRzKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdm0ucGFzdGUodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXSwgW3V1aWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog56e75YqoIOi1hOa6kFxuICAgICAqIEBwYXJhbSBkcmFnSW5mbyDkv6Hmga9cbiAgICAgKiBAcGFyYW0gdG9Bc3NldCDnp7vliqjnm67nmoTlnLDotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBtb3ZlKGRyYWdJbmZvOiBJRHJhZ0luZm8sIHRvQXNzZXQ6IElBc3NldEluZm8pIHtcbiAgICAgICAgaWYgKCFkcmFnSW5mbyB8fCAhdG9Bc3NldCB8fCAhQXJyYXkuaXNBcnJheShkcmFnSW5mby5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bGV5byA55uu5qCH5paH5Lu25aS5XG4gICAgICAgIHZtLnRvZ2dsZSh0b0Fzc2V0LnV1aWQsIHRydWUpO1xuXG4gICAgICAgIGNvbnN0IHV1aWRzID0gZHJhZ0luZm8uYWRkaXRpb25hbC5tYXAoKGluZm86IElEcmFnQWRkaXRpb25hbCkgPT4gaW5mby52YWx1ZS5zcGxpdCgnQCcpWzBdKTtcblxuICAgICAgICAvLyDlpJrotYTmupDnp7vliqjvvIzmoLnmja7njrDmnInmjpLluo/nmoTpobrluo/miafooYxcbiAgICAgICAgdXVpZHMuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFJbmRleCA9IHRyZWVEYXRhLnV1aWRUb0luZGV4W2FdO1xuICAgICAgICAgICAgY29uc3QgYkluZGV4ID0gdHJlZURhdGEudXVpZFRvSW5kZXhbYl07XG4gICAgICAgICAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCB1dWlkc0xlbmd0aCA9IHV1aWRzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1dWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdXVpZHNbaV07XG5cbiAgICAgICAgICAgIGlmICh2YWxpZFV1aWRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZyb21Bc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgZnJvbVBhcmVudCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tQXNzZXQgfHwgIWZyb21QYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvQXNzZXQudXVpZCA9PT0gZnJvbUFzc2V0LnV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHV0aWxzLmNhbk5vdEN1dChmcm9tQXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRvQXNzZXQg5pivIGZyb21Bc3NldCDnmoTlrZDpm4bvvIzmiYDku6XniLbkuI3og73np7vliLDlrZDph4zpnaJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc0FJbmNsdWRlQihmcm9tQXNzZXQudXVpZCwgZHJhZ0luZm8udG8pKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOi1hOa6kOenu+WKqOS7jeWcqOWOn+adpeeahOebruW9leWGhe+8jOS4jemcgOimgeenu+WKqFxuICAgICAgICAgICAgaWYgKHRvQXNzZXQudXVpZCA9PT0gZnJvbVBhcmVudC51dWlkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhbGlkVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhc2tzOiBBcnJheTxQcm9taXNlPEFzc2V0SW5mbyB8IG51bGw+PiA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHZhbGlkVXVpZHNMZW5ndGggPSB2YWxpZFV1aWRzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSB2YWxpZFV1aWRzW2ldO1xuICAgICAgICAgICAgY29uc3QgZnJvbUFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICBjb25zdCBmcm9tUGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Bc3NldCB8fCAhZnJvbVBhcmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnp7vliqjotYTmupBcbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gZnJvbUFzc2V0LnV1aWQ7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHRvQXNzZXQudXJsICsgJy8nICsgYmFzZW5hbWUoZnJvbUFzc2V0LnVybCk7XG5cbiAgICAgICAgICAgIC8vIOWunuS+i+WMluiZmuaLn+i1hOa6kFxuICAgICAgICAgICAgaWYgKGZyb21Bc3NldC5pbnN0YW50aWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGFza3MucHVzaChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbml0LWFzc2V0JywgZnJvbUFzc2V0LnVybCwgdGFyZ2V0KSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhc2tzLnB1c2goRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnbW92ZS1hc3NldCcsIGZyb21Bc3NldC51cmwsIHRhcmdldCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOmAieS4reenu+WKqOmhuVxuICAgICAgICB2bS5pcGNTZWxlY3QodmFsaWRVdWlkcyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDph43mlrDlr7zlhaXotYTmupBcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyByZWltcG9ydCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgLy8g5p2l6Ieq5Y+z5Ye76I+c5Y2V55qE5Y2V5Liq6YCJ5LitXG4gICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICBzZWxlY3RzID0gW3V1aWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBzZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICBsZXQgdmFsaWRVdWlkczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IHNlbGVjdHNbaV07XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0IHx8IHV0aWxzLmNhbk5vdFJlaW1wb3J0KGFzc2V0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWFzc2V0LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIDEvMu+8miB2YWxpZFV1aWRzIOmHjOmdouS7u+S4gOi1hOa6kOmDveS4jeaYryB1dWlkIOeahOiZmuaLn+WtkOi1hOa6kFxuICAgICAgICAgICAgICAgIHZhbGlkVXVpZHMgPSB2YWxpZFV1aWRzLmZpbHRlcigodmFsaWRVdWlkKSA9PiAhdXRpbHMuaXNBSW5jbHVkZUIodXVpZCwgdmFsaWRVdWlkKSk7XG5cbiAgICAgICAgICAgICAgICAvLyDnoa7kv50gMi8y77yaIHZhbGlkVXVpZHMg6YeM55qE5Lu75LiA6LWE5rqQ6YO95LiN5pivIHV1aWQg55qE54i26LWE5rqQXG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZFV1aWRzLnNvbWUoKHZhbGlkVXVpZCkgPT4gdXRpbHMuaXNBSW5jbHVkZUIodmFsaWRVdWlkLCB1dWlkKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWxpZFV1aWRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2godXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlblt1dWlkXTtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWxpZFV1aWRzLmluY2x1ZGVzKGNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkVXVpZHMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzTGVuZ3RoID0gdmFsaWRVdWlkcy5sZW5ndGg7XG4gICAgICAgIGlmICghdmFsaWRVdWlkc0xlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aKe5Yqg6YeN5a+85Lit55qEIGxvYWRpbmcg55WM6Z2i5pWI5p6cXG4gICAgICAgIGZvciAoY29uc3QgdmFsaWRVdWlkIG9mIHZhbGlkVXVpZHMpIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3ZhbGlkVXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh2YWxpZFV1aWQpO1xuICAgICAgICB9XG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuXG4gICAgICAgIGZvciAoY29uc3QgdmFsaWRVdWlkIG9mIHZhbGlkVXVpZHMpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3JlaW1wb3J0LWFzc2V0JywgdmFsaWRVdWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh1dWlkKTtcbiAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmoJHlvaLmlbDmja7lt7LmlLnlj5hcbiAgICAgKiDlpoLotYTmupDlop7liKDmlLnvvIzmmK/ovoPlpKfnmoTlj5jliqjvvIzpnIDopoHph43mlrDorqHnrpflkITkuKrphY3lpZfmlbDmja5cbiAgICAgKiDlop7liqAgc2V0VGltZU91dCDmmK/kuLrkuobkvJjljJbmnaXoh6rlvILmraXnmoTlpJrmrKHop6blj5FcbiAgICAgKi9cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIC8vIOWuueWZqOeahOaVtOS9k+mrmOW6plxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC50cmVlSGVpZ2h0ID0gdHJlZURhdGEuZGlzcGxheUFycmF5Lmxlbmd0aCAqIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQ7XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuYWxsRXhwYW5kID0gdm0uaXNBbGxFeHBhbmQoKTtcblxuICAgICAgICAvLyDph43mlrDmuLLmn5Plh7rmoJHlvaJcbiAgICAgICAgdm0uZmlsdGVyQXNzZXRzKCk7XG5cbiAgICAgICAgd2hpbGUgKHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcmVhZHlUd2lua2xlID0gcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHJlYWR5VHdpbmtsZS51dWlkLCByZWFkeVR3aW5rbGUuYW5pbWF0aW9uKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YeN5paw5riy5p+T5qCR5b2iXG4gICAgICogdm0uYXNzZXRzIOS4uuW9k+WJjeaYvuekuueahOmCo+WHoOS4quiKgueCueaVsOaNrlxuICAgICAqL1xuICAgIGZpbHRlckFzc2V0cygpIHtcbiAgICAgICAgdm0uYXNzZXRzID0gW107IC8vIOWFiOa4heepuu+8jOi/meenjei1i+WAvOacuuWItuaJjeiDveWIt+aWsCB2dWXvvIzogIwgLmxlbmd0aCA9IDAg5LiN6KGMXG5cbiAgICAgICAgY29uc3QgdG9wID0gdm0uc2Nyb2xsVG9wICUgcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodDtcbiAgICAgICAgY29uc3QgbWluID0gdm0uc2Nyb2xsVG9wIC0gdG9wOyAvLyDnrpflh7rlj6/op4bljLrln5/nmoQgdG9wIOacgOWwj+WAvFxuICAgICAgICBjb25zdCBtYXggPSBtaW4gKyBwYW5lbERhdGEuJC5wYW5lbC52aWV3SGVpZ2h0OyAvLyDmnIDlpKflgLxcblxuICAgICAgICB2bS4kZWwuc3R5bGUudG9wID0gYC0ke3RvcH1weGA7XG5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSBNYXRoLnJvdW5kKG1pbiAvIHBhbmVsRGF0YS5jb25maWcuYXNzZXRIZWlnaHQpO1xuICAgICAgICBjb25zdCBlbmQgPSBNYXRoLmNlaWwobWF4IC8gcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodCkgKyAxO1xuXG4gICAgICAgIHZtLmFzc2V0cyA9IHRyZWVEYXRhLm91dHB1dERpc3BsYXkoc3RhcnQsIGVuZCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bpgInkuK3liJfooajmlbDnu4TkuK3nrKzkuIDkuKroioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57lnKjmmL7npLrpmJ/liJfkuK3nmoTnrKzkuIDkuKroioLngrlcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdCgpIHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF07XG5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5WzBdO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bpgInkuK3liJfooajmlbDnu4TkuK3mnIDlkI7kuIDkuKroioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57lnKjmmL7npLrpmJ/liJfkuK3nmoTmnIDlkI7kuIDkuKroioLngrlcbiAgICAgKi9cbiAgICBnZXRMYXN0U2VsZWN0KCkge1xuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICBpZiAoc2VsZWN0c0xlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tzZWxlY3RzTGVuZ3RoIC0gMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkaXNwbGF5TGVuZ3RoID0gdHJlZURhdGEuZGlzcGxheUFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbZGlzcGxheUxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bop4bop4nkuIrmoJHlvaLkuIrkuIvliJfooajkuK3vvIznrKzkuIDkuKrpgInkuK3oioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57pobblsYLmoLnoioLngrkgJ2RiOi8vJ1xuICAgICAqL1xuICAgIGdldEZpcnN0U2VsZWN0U29ydEJ5RGlzcGxheSgpIHtcbiAgICAgICAgbGV0IHV1aWQgPSBwYW5lbERhdGEuY29uZmlnLnByb3RvY29sO1xuXG4gICAgICAgIGNvbnN0IG1pbkluZGV4ID0gdHJlZURhdGEuZGlzcGxheUFycmF5Lmxlbmd0aDtcblxuICAgICAgICBjb25zdCBsZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICBpZiAobGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdHJlZURhdGEuZGlzcGxheUFycmF5LmluZGV4T2Yoc2VsZWN0KTtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCBtaW5JbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB1dWlkID0gc2VsZWN0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1dWlkO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+U5Zue5qCR5b2i56ys5LiA5Liq6IqC54K5XG4gICAgICog56ys5LiA5Liq6IqC54K577yM5LiN5LiA5a6a5piv5qC56IqC54K577yM5L6L5aaC5Zyo5pCc57Si55qE5oOF5Ya15LiLXG4gICAgICovXG4gICAgZ2V0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgcmV0dXJuIHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXTtcbiAgICB9LFxuICAgIGlzRXhwYW5kKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdHJlZURhdGEudXVpZFRvRXhwYW5kW3V1aWRdO1xuICAgIH0sXG4gICAgaXNTZWxlY3QodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZih1dWlkKSAhPT0gLTE7XG4gICAgfSxcbiAgICBnZXRUd2lua2xlKHV1aWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBwYW5lbERhdGEuYWN0LnR3aW5rbGVzW3V1aWRdID8/ICcnO1xuICAgIH0sXG4gICAgaXNBbGxFeHBhbmQoKSB7XG4gICAgICAgIGxldCBhbGxDb2xsYXBzZSA9IHRydWU7XG5cbiAgICAgICAgbGV0IHBhcmVudHMgPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltwYW5lbERhdGEuY29uZmlnLnByb3RvY29sXTtcblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgaWYgKHNlbGVjdHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHBhcmVudHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXBhcmVudHMgfHwgIXBhcmVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxsQ29sbGFwc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnRzTGVuZ3RoID0gcGFyZW50cy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHBhcmVudHNbaV07XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9Bc3NldFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgJiYgJ2lzUGFyZW50JyBpbiBwYXJlbnQgJiYgIXBhcmVudC5pc1BhcmVudCkge1xuICAgICAgICAgICAgICAgIHBhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3BhcmVudFV1aWRdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHJlZURhdGEudXVpZFRvRXhwYW5kW3BhcmVudFV1aWRdKSB7XG4gICAgICAgICAgICAgICAgYWxsQ29sbGFwc2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhYWxsQ29sbGFwc2U7XG4gICAgfSxcbiAgICBpc1NlYXJjaGluZ01vZGUoKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc1NlYXJjaGluZ01vZGUoKTtcbiAgICB9LFxuICAgIGFzeW5jIGRpYWxvZ0Vycm9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLmVycm9yKEVkaXRvci5JMThuLnQoYGFzc2V0cy5vcGVyYXRlLiR7bWVzc2FnZX1gKSwge1xuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2Fzc2V0cy5vcGVyYXRlLmRpYWxvZ0Vycm9yJyksXG4gICAgICAgIH0pO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3Qgd2F0Y2ggPSB7XG4gICAgLyoqXG4gICAgICogc2Nyb2xsVG9wIOWPmOWMlu+8jOWIt+aWsOagkeW9olxuICAgICAqL1xuICAgIHNjcm9sbFRvcCgpIHtcbiAgICAgICAgdm0uZmlsdGVyQXNzZXRzKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlvZPliY3pgInkuK3pobnlj5jliqhcbiAgICAgKi9cbiAgICBhY3RpdmVBc3NldCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuYWN0aXZlQXNzZXQgPSB2bS5hY3RpdmVBc3NldDtcbiAgICB9LFxufTtcblxuLyoqXG4gKiB2dWUgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGF0YSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBhc3NldHM6IFtdLCAvLyDlvZPliY3moJHlvaLlnKjlj6/op4bljLrln5/nmoTotYTmupDoioLngrlcbiAgICAgICAgcmVuYW1lVXJsOiAnJywgLy8g6ZyA6KaBIHJlbmFtZSDnmoToioLngrnnmoQgdXJs77yM5Y+q5pyJ5LiA5LiqXG4gICAgICAgIGFkZEluZm86IHtcbiAgICAgICAgICAgIC8vIOa3u+WKoOS4gOS4quaWsOi1hOa6kOWJjeeahOaVsOaNru+8jOmcgOimgeS6i+WJjemHjeWRveWQjVxuICAgICAgICAgICAgdHlwZTogJycsXG4gICAgICAgICAgICBpbXBvcnRlcjogJycsXG4gICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgIGZpbGVFeHQ6ICcnLFxuICAgICAgICAgICAgZmlsZU5hbWU6ICcnLFxuICAgICAgICAgICAgcGFyZW50RGlyOiAnJyxcbiAgICAgICAgfSxcbiAgICAgICAgaW50b1ZpZXdCeVNlbGVjdGVkOiAnJywgLy8g5pS25Yiw6YCJ5LitIGlwYyDpnIDopoHlrprkvY3mmL7npLrnmoTotYTmupBcbiAgICAgICAgaW50b1ZpZXdCeVVzZXI6ICcnLCAvLyDnlKjmiLfmk43kvZznmoTmlrDlop7np7vliqjotYTmupDvvIznu5nkuojlrprkvY1cbiAgICAgICAgc2Nyb2xsVG9wOiAwLCAvLyDlvZPliY3moJHlvaLnmoTmu5rliqjmlbDmja5cbiAgICAgICAgZHJvcHBhYmxlVHlwZXM6IFtdLFxuICAgICAgICBjaGVja1NoaWZ0VXBEb3duTWVyZ2U6IHsgdXVpZDogJycsIGRpcmVjdGlvbjogJycgfSwgLy8gc2hpZnQgKyDnrq3lpLTlpJrpgInvvIzlop7lvLrkuqTkupLmlYjmnpxcbiAgICB9O1xufVxuXG4vKipcbiAqIHZtID0gdGhpc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW91bnRlZCgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgdm0gPSB0aGlzO1xuXG4gICAgLy8g5a+55LqO5a2Q6ZuG55qE5Y+Y5Yqo77yM5pyA5ZCO5LiA5LiqIGlwYyDmtojmga/lj5HnmoTmmK/niLbnuqfmlofku7blpLnnmoTlj5jliqjvvIzov5nkuI3pnIDopoHmmL7npLrlh7rmnaXvvIzmiYDku6XlgZrkuoborrDlvZXlh4blpIflv73nlaVcbiAgICB2bS5yZWZyZXNoaW5nLmlnbm9yZXMgPSB7fTtcbn1cbiJdfQ==