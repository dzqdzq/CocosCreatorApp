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
        utils.scrollIntoView(parent.uuid);
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
            case 'js':
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
        await vm.add(url, content);
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
                utils.scrollIntoView(vm.intoViewByUser);
                vm.intoViewByUser = '';
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
        let msg = Editor.I18n.t('assets.operate.sureDelete');
        msg = msg.replace('${length}', validUuidsLength);
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
        msg = msg.replace('${filelist}', filelist);
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
                utils.scrollIntoView(lastPrev.uuid);
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
                utils.scrollIntoView(lastNext.uuid);
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
    keyboardRename() {
        if (vm.renameUrl) {
            return;
        }
        const uuid = vm.getFirstSelect();
        const asset = utils.getAsset(uuid);
        if (asset && !utils.canNotRename(asset)) {
            utils.scrollIntoView(uuid);
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
        const moveAsset = await Editor.Message.request('asset-db', 'move-asset', asset.url, target);
        if (!moveAsset) {
            vm.dialogError('renameFail');
        }
        treeData.uuidToState[uuid] = '';
        return true;
    },
    sort() {
        treeData.resort();
    },
    search() {
        vm.$nextTick(() => {
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
        });
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
            const results = await Promise.all(filepaths.map((file) => {
                return Editor.Message.request('asset-db', 'import-asset', file, toAsset.url + '/' + path_1.basename(file));
            }));
            // 导入完成，还原父级状态
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
                vm.copy(uuids);
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
        await Promise.all(tasks).then(() => {
            for (let i = 0; i < validUuidsLength; i++) {
                const uuid = validUuids[i];
                treeData.uuidToState[uuid] = '';
            }
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
        for (const validUuid of validUuids) {
            await Editor.Message.request('asset-db', 'reimport-asset', validUuid);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBY2IsK0JBQXNDO0FBQ3RDLDJCQUE4QztBQUM5Qyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUU1Qix1QkFBdUI7QUFDdkIsSUFBSSxZQUFpQixDQUFDO0FBQ3RCLElBQUksY0FBbUIsQ0FBQztBQUN4QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxnQkFBcUIsQ0FBQztBQUViLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUVkLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXBGLFFBQUEsVUFBVSxHQUFHO0lBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDO0NBQ3RDLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixFQUFFLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFFcEYsYUFBYTtRQUNiLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUMxQixFQUFFLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztJ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QztBQUVXLFFBQUEsS0FBSyxHQUFHO0lBQ2pCOztPQUVHO0lBQ0gsU0FBUztRQUNMLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBQ0Q7O09BRUc7SUFDSCxXQUFXO1FBQ1AsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUM7SUFDbkQsQ0FBQztDQUNKLENBQUM7QUFFRjs7R0FFRztBQUNILFNBQWdCLElBQUk7SUFDaEIsT0FBTztRQUNILE1BQU0sRUFBRSxFQUFFO1FBQ1YsU0FBUyxFQUFFLEVBQUU7UUFDYixPQUFPLEVBQUU7WUFDTCxzQkFBc0I7WUFDdEIsSUFBSSxFQUFFLEVBQUU7WUFDUixRQUFRLEVBQUUsRUFBRTtZQUNaLElBQUksRUFBRSxFQUFFO1lBQ1IsT0FBTyxFQUFFLEVBQUU7WUFDWCxRQUFRLEVBQUUsRUFBRTtZQUNaLFNBQVMsRUFBRSxFQUFFO1NBQ2hCO1FBQ0Qsa0JBQWtCLEVBQUUsRUFBRTtRQUN0QixjQUFjLEVBQUUsRUFBRTtRQUNsQixTQUFTLEVBQUUsQ0FBQztRQUNaLGNBQWMsRUFBRSxFQUFFO1FBQ2xCLHFCQUFxQixFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsc0JBQXNCO0tBQzdFLENBQUM7QUFDTixDQUFDO0FBbkJELG9CQW1CQztBQUVEOztHQUVHO0FBQ0ksS0FBSyxVQUFVLE9BQU87SUFDekIsYUFBYTtJQUNiLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFFVixxREFBcUQ7SUFDckQsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQy9CLENBQUM7QUFORCwwQkFNQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtcbiAgICBJQ3JlYXRlT3B0aW9uLFxuICAgIElBZGRJbmZvLFxuICAgIElBc3NldEluZm8sXG4gICAgRHJvcENhbGxiYWNrSW5mbyxcbiAgICBJRHJhZ0luZm8sXG4gICAgSURyYWdBZGRpdGlvbmFsLFxuICAgIEFzc2V0SW5mbyxcbiAgICBJQ29waWVkSW5mbyxcbiAgICBJQ29waWVkQXNzZXRJbmZvLFxufSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IGJhc2VuYW1lLCBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9wYW5lbC1kYXRhJztcbmltcG9ydCAqIGFzIHRyZWVEYXRhIGZyb20gJy4vdHJlZS1kYXRhJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5sZXQgdm06IGFueSA9IG51bGw7XG5sZXQgcmVxdWVzdEFuaW1hdGlvbklkOiBhbnk7XG5cbi8vIOeUqOS6juivhuWIqyBkcmFnIOaCrOWBnO+8jOiHquWKqOWxleW8gOaWh+S7tuWkuVxubGV0IGRyYWdPdmVyVXVpZDogYW55O1xubGV0IGRyYWdPdmVyVGltZUlkOiBhbnk7XG5sZXQgc2VsZWN0ZWRUaW1lSWQ6IGFueTtcbmxldCByZWZyZXNoaW5nVGltZUlkOiBhbnk7XG5cbmV4cG9ydCBjb25zdCBuYW1lID0gJ3RyZWUnO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvdGVtcGxhdGUvdHJlZS5odG1sJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge1xuICAgICd0cmVlLW5vZGUnOiByZXF1aXJlKCcuL3RyZWUtbm9kZScpLFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog57+76K+RXG4gICAgICogQHBhcmFtIGtleSDkuI3luKbpnaLmnb/lkI3np7DnmoTmoIforrDlrZfnrKZcbiAgICAgKi9cbiAgICB0KGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS4kLnBhbmVsLnQoa2V5KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWklumDqOaVsOaNruabtOaWsOWQju+8jOabtOaWsOWGhemDqOaVsOaNrlxuICAgICAqL1xuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdm0uZHJvcHBhYmxlVHlwZXMgPSB2bS4kcGFyZW50LmRyb3BwYWJsZVR5cGVzLmNvbmNhdChwYW5lbERhdGEuY29uZmlnLmFzc2V0VHlwZXMoKSk7XG5cbiAgICAgICAgLy8g5riF56m65paw5bu65oiW6YeN5ZG95ZCN54q25oCBXG4gICAgICAgIHZtLmFkZEluZm8ucGFyZW50RGlyID0gJyc7XG4gICAgICAgIHZtLnJlbmFtZVVybCA9ICcnO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5riF56m65qCR5b2iXG4gICAgICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRyZWVEYXRhLmNsZWFyKCk7XG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yi35paw5qCR5b2iXG4gICAgICogQHBhcmFtIHR5cGUg5piv5ZCm6YeN572u5pWw5o2uXG4gICAgICogQHBhcmFtIG5hbWUgaXBjIOWKqOS9nOeahOWQjeensFxuICAgICAqL1xuICAgIHJlZnJlc2hpbmcodHlwZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV1aWQgJiYgdm0ucmVmcmVzaGluZy5pZ25vcmVzW3V1aWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgdm0ucmVmcmVzaGluZy5pZ25vcmVzW3V1aWRdO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwucmVmcmVzaGluZyA9IHsgdHlwZSwgbmFtZSB9O1xuXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQocmVmcmVzaGluZ1RpbWVJZCk7XG4gICAgICAgIHJlZnJlc2hpbmdUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAvLyDmj5DnpLrmtojlpLFcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnJlZnJlc2hpbmcudHlwZSA9ICcnO1xuICAgICAgICAgICAgdm0ucmVmcmVzaGluZy5pZ25vcmVzID0ge307XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K555qE5oqY5Y+gL+WxleW8gOWIh+aNolxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBleHBhbmQgIOaYr+WQpuWxleW8gFxuICAgICAqIEBwYXJhbSBsb29wICDmjInkvY8gQWx0IOmUruWPr+i/m+WFpeWtkOiKgueCueW+queOr1xuICAgICAqL1xuICAgIHRvZ2dsZSh1dWlkOiBzdHJpbmcsIGV4cGFuZD86IGJvb2xlYW4sIGxvb3A/OiBib29sZWFuKSB7XG4gICAgICAgIGlmIChsb29wKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cmVlRGF0YS50b2dnbGVFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yik5pat5LiL5Liq5Yqo5L2c5piv5pS26LW36L+Y5piv5bGV5byAIO+8iOW9k+WtmOWcqOS4jeWQjOeKtuaAgeeahOaWh+S7tuWkueaXtu+8jOinhuS4uuaUtui1t+OAguW9k+eKtuaAgeebuOWQjO+8jOWPluWPjeWNs+WPr+OAgu+8iVxuICAgICAqIEBwYXJhbSBwYXJlbnRzXG4gICAgICogQHJldHVybnMgYm9vbGVhblxuICAgICAqL1xuICAgIG5leHRUb2dnbGVFeHBhbmQocGFyZW50czogYW55W10pOiBib29sZWFuIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZhbHNlOyAvLyDpu5jorqTkuLrmlLbotbdcbiAgICAgICAgLy8g5qC55o2u6KeE5YiZ77yM6YKj5LmI5Y+q5pyJ5b2T5YWo6YOo6YO95Li65pS26LW355qE5pe25YCZ77yM6ZyA6KaB5bGV5byA55qE5pON5L2cXG4gICAgICAgIGNvbnN0IGlzQWxsQ2xvc2UgPSBwYXJlbnRzLmV2ZXJ5KChwYXJlbnRJRCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvQXNzZXRbcGFyZW50SURdO1xuICAgICAgICAgICAgaWYgKCFwYXJlbnQuaXNQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRJRCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50SURdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICF0cmVlRGF0YS51dWlkVG9FeHBhbmRbcGFyZW50SURdO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlzQWxsQ2xvc2UpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmDqOiKgueCueaKmOWPoOaIluWxleW8gFxuICAgICAqL1xuICAgIGFsbFRvZ2dsZSgpIHtcbiAgICAgICAgbGV0IHBhcmVudHMgPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltwYW5lbERhdGEuY29uZmlnLnByb3RvY29sXTtcblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgaWYgKHNlbGVjdHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHBhcmVudHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnRzTGVuZ3RoID0gcGFyZW50cy5sZW5ndGg7XG4gICAgICAgIGlmICghcGFyZW50c0xlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhwYW5kID0gdm0ubmV4dFRvZ2dsZUV4cGFuZChwYXJlbnRzKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBwYXJlbnRVdWlkID0gcGFyZW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRyZWVEYXRhLnV1aWRUb0Fzc2V0W3BhcmVudFV1aWRdO1xuICAgICAgICAgICAgaWYgKCFwYXJlbnQuaXNQYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQocGFyZW50VXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YCJXG4gICAgICogQHBhcmFtIHV1aWQg5YWo6YCJ6K+l55uu5qCH6IqC54K55LiL55qE5a2Q6IqC54K5XG4gICAgICovXG4gICAgc2VsZWN0QWxsKHV1aWQ6IHN0cmluZykge1xuICAgICAgICAvLyDmkbjntKLmqKHlvI/kuIvvvIzlhajpgInkuLrlvZPliY3liJfooahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdHJlZURhdGEuZGlzcGxheUFycmF5KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnRVdWlkID0gdXVpZCB8fCB2bS5nZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcblxuICAgICAgICBpZiAoIXRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3BhcmVudFV1aWRdKSB7XG4gICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiOt+WPluW3suWxleW8gOeahOWtkOiKgueCuVxuICAgICAgICBjb25zdCBjaGlsZHJlblV1aWQ6IHN0cmluZ1tdID0gW107XG4gICAgICAgIHV0aWxzLmdldENoaWxkcmVuVXVpZChwYXJlbnRVdWlkLCBjaGlsZHJlblV1aWQsIHRydWUpO1xuXG4gICAgICAgIGNvbnN0IGNsb25lU2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICBjb25zdCBwYXJlbnRJbiA9IGNsb25lU2VsZWN0cy5pbmNsdWRlcyhwYXJlbnRVdWlkKTtcblxuICAgICAgICBsZXQgY2hpbGRyZW5BbGxJbiA9IHRydWU7XG4gICAgICAgIGNvbnN0IGNoaWxkcmVuVXVpZExlbmd0aCA9IGNoaWxkcmVuVXVpZC5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW5VdWlkTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGNoaWxkcmVuVXVpZFtpXSkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbkFsbEluID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hpbGRyZW5BbGxJbikge1xuICAgICAgICAgICAgaWYgKCFwYXJlbnRJbikge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDlvoDkuIrkuIDlsYJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50VXVpZCAhPT0gcGFuZWxEYXRhLmNvbmZpZy5wcm90b2NvbCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5zZWxlY3RBbGwodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnRJbikge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuVXVpZC51bnNoaWZ0KHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGNoaWxkcmVuVXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGNoaWxkcmVuVXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNlbGVjdENsZWFyKCkge1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdhc3NldCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5re75Yqg6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWRzIHN0cmluZyB8IHN0cmluZ1tdXG4gICAgICovXG4gICAgc2VsZWN0ZWQodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1dWlkcykpIHtcbiAgICAgICAgICAgIHV1aWRzID0gW3V1aWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKCFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaCh1dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlTZWxlY3RlZCA9IHV1aWQ7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFRpbWVJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVNlbGVjdGVkKTtcbiAgICAgICAgICAgICAgICB9LCA1MCk7XG5cbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6Ugc2hpZnQg5aSa6YCJ55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuYWxsRXhwYW5kID0gdm0uaXNBbGxFeHBhbmQoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqL1xuICAgIHVuc2VsZWN0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YodXVpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc2VsZWN0ZWRUaW1lSWQpO1xuICAgICAgICAgICAgc2VsZWN0ZWRUaW1lSWQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVNlbGVjdGVkID09PSB1dWlkKSB7XG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5U2VsZWN0ZWQgPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5oGi5aSN6YCJ5Lit54q25oCBXG4gICAgICovXG4gICAgcmVzZXRTZWxlY3RlZCgpIHtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzID0gW107XG4gICAgICAgIGNvbnN0IHV1aWRzID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnYXNzZXQnKTtcbiAgICAgICAgdm0uc2VsZWN0ZWQodXVpZHMpO1xuXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc2VsZWN0ZWRUaW1lSWQpO1xuICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh2bS5pbnRvVmlld0J5U2VsZWN0ZWQsIHRydWUpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogc2hpZnQgKyBjbGljayDlpJrpgIlcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBzaGlmdENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCB7IGRpc3BsYXlBcnJheSB9ID0gdHJlZURhdGE7XG5cbiAgICAgICAgY29uc3QgZmlyc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXSk7XG4gICAgICAgIGNvbnN0IGxhc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChmaXJzdEluZGV4ICE9PSAtMSB8fCBsYXN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RJbmRleCA8PSBsYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA8PSBsYXN0SW5kZXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBmaXJzdEluZGV4OyBpID49IGxhc3RJbmRleDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdHMucHVzaChkaXNwbGF5QXJyYXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmlwY1NlbGVjdChzZWxlY3RzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGN0cmwgKyBjbGljayDpgInkuK3miJblj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBjdHJsQ2xpY2sodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCB1dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWRzIOi1hOa6kFxuICAgICAqL1xuICAgIGlwY1NlbGVjdCh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5qCR5b2i5LiK55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgaXBjU2VsZWN0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICAgICAgY29uc3QgdXVpZCA9IHRoaXMuZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ2Fzc2V0JywgdXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOepuueZveWkhOeCueWHu++8jOWPlua2iOmAieS4rVxuICAgICAqL1xuICAgIGNsaWNrKCkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ2Fzc2V0Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliJvlu7rliY3vvIzlkI3np7DlpITnkIZcbiAgICAgKiBAcGFyYW0gYWRkSW5mbyDkv6Hmga9cbiAgICAgKi9cbiAgICBhc3luYyBhZGRUbyhhZGRJbmZvOiBJQWRkSW5mbykge1xuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG5cbiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDMwMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhZGRJbmZvLnV1aWQpIHtcbiAgICAgICAgICAgIGFkZEluZm8udXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDoh6rouqvmiJbniLbnuqfmlofku7blpLlcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuY2xvc2VzdFdoaWNoQ2FuQ3JlYXRlKGFkZEluZm8udXVpZCk7XG5cbiAgICAgICAgLy8gcGFyZW50IOS4jeWtmOWcqOaIluWkhOS6juWFtuS7lueKtuaAge+8jOS4jemAguWQiOWIm+W7ulxuICAgICAgICBpZiAoIXBhcmVudCB8fCB0cmVlRGF0YS51dWlkVG9TdGF0ZVtwYXJlbnQudXVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWxleW8gOeItue6p+iKgueCuVxuICAgICAgICB2bS50b2dnbGUocGFyZW50LnV1aWQsIHRydWUpO1xuXG4gICAgICAgIC8vIOa7muWKqOWIsOmhtuWxguinhueql1xuICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyhwYXJlbnQudXVpZCk7XG5cbiAgICAgICAgY29uc3QgcGFyZW50RGlyID0gcGFyZW50LnVybDtcbiAgICAgICAgbGV0IGZpbGVOYW1lID0gYWRkSW5mby5maWxlTmFtZSB8fCAnTmV3IEZpbGUnO1xuICAgICAgICBsZXQgZmlsZUV4dCA9IGAuJHthZGRJbmZvLnR5cGV9YDtcblxuICAgICAgICBjb25zdCBjYW1lbEZvcm1hdFJlZyA9IC9AY2NjbGFzcyhbXjxdKikoPCVDYW1lbENhc2VDbGFzc05hbWUlPikvO1xuICAgICAgICBjb25zdCBjbGFzc05hbWVGb3JtYXRSZWcgPSAvQGNjY2xhc3NcXChbJ1wiXShbXidcIl0qKVsnXCJdXFwpLztcbiAgICAgICAgY29uc3QgY29tbWVudHNSZWcgPSAvKFxcblteXFxuXSpcXC9cXCpbXFxzXFxTXSo/XFwqXFwvKXwoXFxuW15cXG5dKlxcL1xcLyg/OlteXFxyXFxuXXxcXHIoPyFcXG4pKSopL2c7IC8vIOazqOmHiuWMuuWfn+i/nuWQjOi/nue7reeahOepuuihjFxuXG4gICAgICAgIHN3aXRjaCAoYWRkSW5mby50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdkaXJlY3RvcnknOlxuICAgICAgICAgICAgICAgIGZpbGVFeHQgPSAnJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3RzJzpcbiAgICAgICAgICAgIGNhc2UgJ2pzJzpcbiAgICAgICAgICAgICAgICBpZiAoIWFkZEluZm8uY29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSAnJztcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXJsID0gYGRiOi8vaW50ZXJuYWwvZGVmYXVsdF9maWxlX2NvbnRlbnQvJHthZGRJbmZvLnRlbXBsYXRlIHx8IGFkZEluZm8udHlwZX1gO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVJbmZvID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktYXNzZXQtaW5mbycsIGZpbGVVdWlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHZtLnQoJ3JlYWREZWZhdWx0RmlsZUZhaWwnKSwgZmlsZVVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmlbTnkIblubbor4bliKvmqKHmnb/mlbDmja5cbiAgICAgICAgICAgICAgICBhZGRJbmZvLmNvbnRlbnQgPSBhZGRJbmZvLmNvbnRlbnQucmVwbGFjZShjb21tZW50c1JlZywgKCQwOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQwLmluY2x1ZGVzKCdDT01NRU5UU19HRU5FUkFURV9JR05PUkUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICQwO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8g6K+G5Yir5piv5ZCm5ZCv55So6am85bOw5qC85byP55qE57G75ZCNXG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5yZXF1aXJlZENhbWVsQ2FzZUNsYXNzTmFtZSA9IGNhbWVsRm9ybWF0UmVnLnRlc3QoYWRkSW5mby5jb250ZW50KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVNYXRjaGVzID0gYWRkSW5mby5jb250ZW50Lm1hdGNoKGNsYXNzTmFtZUZvcm1hdFJlZyk7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2NyaXB0TmFtZS5jbGFzc05hbWVTdHJpbmdGb3JtYXQgPSBuYW1lTWF0Y2hlcyAmJiBuYW1lTWF0Y2hlc1sxXSA/IG5hbWVNYXRjaGVzWzFdIDogJyc7XG5cbiAgICAgICAgICAgICAgICBmaWxlTmFtZSA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuZ2V0VmFsaWRGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmnIDlkI7ku6Xov5nkuKogdXJsIOaVsOaNruS4uuWHhlxuICAgICAgICBsZXQgdXJsID0gYCR7cGFyZW50RGlyfS8ke2ZpbGVOYW1lfSR7ZmlsZUV4dH1gO1xuICAgICAgICB1cmwgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgdXJsKTtcblxuICAgICAgICB2bS5hZGRJbmZvID0ge1xuICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgdHlwZTogYWRkSW5mby50eXBlLFxuICAgICAgICAgICAgaW1wb3J0ZXI6IGFkZEluZm8uaW1wb3J0ZXIsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogYWRkSW5mby50ZW1wbGF0ZSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGFkZEluZm8uY29udGVudCxcbiAgICAgICAgICAgIGZpbGVFeHQsXG4gICAgICAgICAgICBmaWxlTmFtZTogYmFzZW5hbWUodXJsLCBmaWxlRXh0KSxcbiAgICAgICAgICAgIG5hbWU6IGJhc2VuYW1lKHVybCksXG4gICAgICAgICAgICBwYXJlbnREaXIsXG4gICAgICAgICAgICBwYXJlbnRVdWlkOiBwYXJlbnQudXVpZCxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQjeensOWhq+WGmeWQjuaPkOS6pOWIsOi/memHjFxuICAgICAqIEBwYXJhbSBhZGRJbmZvIOS/oeaBr1xuICAgICAqL1xuICAgIGFzeW5jIGFkZENvbmZpcm0oYWRkSW5mbz86IElBZGRJbmZvKSB7XG4gICAgICAgIC8vIOaVsOaNrumUmeivr+aXtuWPlua2iFxuICAgICAgICBpZiAoIWFkZEluZm8gfHwgIWFkZEluZm8ucGFyZW50RGlyIHx8ICFhZGRJbmZvLnBhcmVudFV1aWQgfHwgIWFkZEluZm8uZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vIOaWsOWinueahOi+k+WFpeahhua2iOWksVxuICAgICAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEluZm8ubmFtZSA9IGFkZEluZm8uZmlsZU5hbWUgKyBhZGRJbmZvLmZpbGVFeHQ7XG5cbiAgICAgICAgLy8g6Ieq6Lqr5oiW54i257qn5paH5Lu25aS5XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmNsb3Nlc3RXaGljaENhbkNyZWF0ZShhZGRJbmZvLnBhcmVudFV1aWQpO1xuICAgICAgICAvLyDniLbnuqfkuI3lj6/mlrDlu7rotYTmupBcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDms6jmhI/vvJrmhY7ph43kv67mlLnmraTpu5jorqTlgLxcbiAgICAgICAgICogY29udGVudCDnsbvlnovlj6/ku6XkuLogbnVsbCwgc3RyaW5nLCBidWZmZXJcbiAgICAgICAgICog6buY6K6kIG51bGwg5piv57uZ5paH5Lu25aS55L2/55So55qEXG4gICAgICAgICAqL1xuICAgICAgICBsZXQgY29udGVudDogYW55ID0gbnVsbDtcblxuICAgICAgICBpZiAoYWRkSW5mby50eXBlICE9PSAnZGlyZWN0b3J5Jykge1xuICAgICAgICAgICAgY29udGVudCA9IGFkZEluZm8uY29udGVudCB8fCAnJztcblxuICAgICAgICAgICAgaWYgKCFjb250ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGBkYjovL2ludGVybmFsL2RlZmF1bHRfZmlsZV9jb250ZW50LyR7YWRkSW5mby50ZW1wbGF0ZSB8fCBhZGRJbmZvLnR5cGV9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlVXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LXV1aWQnLCBmaWxlVXJsKTtcblxuICAgICAgICAgICAgICAgIGlmIChmaWxlVXVpZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlSW5mbyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ3F1ZXJ5LWFzc2V0LWluZm8nLCBmaWxlVXVpZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZUluZm8gfHwgIWV4aXN0c1N5bmMoZmlsZUluZm8uZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3Iodm0udCgncmVhZERlZmF1bHRGaWxlRmFpbCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZUluZm8uZmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoWyd0cycsICdqcyddLmluY2x1ZGVzKGFkZEluZm8udHlwZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZCA9IGF3YWl0IHV0aWxzLnNjcmlwdE5hbWUuaXNWYWxpZChhZGRJbmZvLmZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsaWQuc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih2bS50KHZhbGlkLnN0YXRlKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB1c2VEYXRhID0gYXdhaXQgRWRpdG9yLlVzZXIuZ2V0RGF0YSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VDb250ZW50czogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBVbmRlcnNjb3JlQ2FzZUNsYXNzTmFtZTogdXRpbHMuc2NyaXB0TmFtZS5nZXRWYWxpZENsYXNzTmFtZShhZGRJbmZvLmZpbGVOYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgQ2FtZWxDYXNlQ2xhc3NOYW1lOiB1dGlscy5zY3JpcHROYW1lLmdldFZhbGlkQ2FtZWxDYXNlQ2xhc3NOYW1lKGFkZEluZm8uZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBEYXRlVGltZTogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgQXV0aG9yOiB1c2VEYXRhLm5pY2tuYW1lLFxuICAgICAgICAgICAgICAgICAgICBGaWxlQmFzZW5hbWU6IGFkZEluZm8ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgRmlsZUJhc2VuYW1lTm9FeHRlbnNpb246IGFkZEluZm8uZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFVSTDogYCR7YWRkSW5mby5wYXJlbnREaXJ9LyR7YWRkSW5mby5uYW1lfWAsXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvclZlcnNpb246IEVkaXRvci5BcHAudmVyc2lvbixcbiAgICAgICAgICAgICAgICAgICAgTWFudWFsVXJsOiBFZGl0b3IuQXBwLnVybHMubWFudWFsLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMocmVwbGFjZUNvbnRlbnRzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShuZXcgUmVnRXhwKGA8JSR7a2V5fSU+YCwgJ2cnKSwgcmVwbGFjZUNvbnRlbnRzW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdm0uYWRkSW5mby5wYXJlbnREaXIgPSAnJztcbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbcGFyZW50LnV1aWRdID0gJ2FkZC1sb2FkaW5nJztcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IGAke2FkZEluZm8ucGFyZW50RGlyfS8ke2FkZEluZm8uZmlsZU5hbWV9JHthZGRJbmZvLmZpbGVFeHR9YDtcbiAgICAgICAgYXdhaXQgdm0uYWRkKHVybCwgY29udGVudCk7XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICB9LCAyMDApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pyA5ZCO5Y+R6LW3IGlwYyDliJvlu7rotYTmupBcbiAgICAgKiBAcGFyYW0gdXJsIOebruagh+S9jee9rlxuICAgICAqIEBwYXJhbSBjb250ZW50IOWhq+WFheWGheWuuVxuICAgICAqIEBwYXJhbSBvcHRpb24g5Y+v6YCJ6YWN572uXG4gICAgICovXG4gICAgYXN5bmMgYWRkKHVybDogc3RyaW5nLCBjb250ZW50OiBCdWZmZXIgfCBzdHJpbmcgfCBudWxsLCBvcHRpb24/OiBJQ3JlYXRlT3B0aW9uKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gKGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2NyZWF0ZS1hc3NldCcsIHVybCwgY29udGVudCwge1xuICAgICAgICAgICAgb3ZlcndyaXRlOiBvcHRpb24/Lm92ZXJ3cml0ZSxcbiAgICAgICAgfSkpIGFzIElBc3NldEluZm87XG5cbiAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICB2bS5pcGNTZWxlY3QoYXNzZXQudXVpZCk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KGFzc2V0LnV1aWQpO1xuICAgICAgICAgICAgfSwgMzAwKTtcblxuICAgICAgICAgICAgcmV0dXJuIGFzc2V0LnV1aWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaUtuWIsCBpcGMg5raI5oGvIGFzc2V0LWRiOmFzc2V0LWFkZFxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqIEBwYXJhbSBpbmZvIOaVsOaNrlxuICAgICAqL1xuICAgIGFzeW5jIGFkZGVkKHV1aWQ6IHN0cmluZywgaW5mbzogQXNzZXRJbmZvKSB7XG4gICAgICAgIHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlLnB1c2goeyB1dWlkLCBhbmltYXRpb246ICdzaHJpbmsnIH0pO1xuICAgICAgICB0cmVlRGF0YS5hZGRlZCh1dWlkLCBpbmZvKTtcbiAgICAgICAgdm0ucmVmcmVzaGluZygnYWRkZWQnLCBpbmZvLm5hbWUpO1xuXG4gICAgICAgIGNvbnN0IGZvbGRlclV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdO1xuICAgICAgICB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbZm9sZGVyVXVpZF0gPSB0cnVlO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pu05paw5qCR5b2i6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICogQHBhcmFtIGluZm8g5pWw5o2uXG4gICAgICovXG4gICAgYXN5bmMgY2hhbmdlZCh1dWlkOiBzdHJpbmcsIGluZm86IEFzc2V0SW5mbykge1xuICAgICAgICAvLyDliKDpmaTlt7LnvJPlrZjnmoTnvKnnlaXlm75cbiAgICAgICAgdXRpbHMudGh1bWJuYWlsLmRlbGV0ZSh1dWlkKTtcblxuICAgICAgICBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5wdXNoKHsgdXVpZCwgYW5pbWF0aW9uOiAnbGlnaHQnIH0pO1xuXG4gICAgICAgIHRyZWVEYXRhLmNoYW5nZWQodXVpZCwgaW5mbyk7XG4gICAgICAgIHZtLnJlZnJlc2hpbmcoJ2NoYW5nZWQnLCBpbmZvLm5hbWUsIHV1aWQpO1xuXG4gICAgICAgIGNvbnN0IGZvbGRlclV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdO1xuICAgICAgICB2bS5yZWZyZXNoaW5nLmlnbm9yZXNbZm9sZGVyVXVpZF0gPSB0cnVlO1xuXG4gICAgICAgIGlmICh1dWlkID09PSB2bS5pbnRvVmlld0J5VXNlcikge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVVzZXIpO1xuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBpcGMg5Y+R6LW35Yig6Zmk6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgZGVsZXRlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICAvKipcbiAgICAgICAgICog5aaC5p6c6K+l6LWE5rqQ5rKh5pyJ6KKr6YCJ5Lit77yM5YiZ5Y+q5piv5Yig6Zmk5q2k5Y2V5LiqXG4gICAgICAgICAqIOWmguaenOivpei1hOa6kOaYr+iiq+mAieS4reS6hu+8jOihqOaYjuimgeWIoOmZpOaJgOaciemAieS4remhuVxuICAgICAgICAgKi9cbiAgICAgICAgbGV0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGluU2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKTtcbiAgICAgICAgaWYgKHV1aWQgJiYgIWluU2VsZWN0cykge1xuICAgICAgICAgICAgc2VsZWN0cyA9IFt1dWlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBzZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICAvLyDmnInmlYjnmoTlj6/liKDpmaTnmoToioLngrlcbiAgICAgICAgbGV0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBzZWxlY3RzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCB1dGlscy5jYW5Ob3REZWxldGUoYXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOehruS/nSAxLzLvvJogdmFsaWRVdWlkcyDph4zpnaLku7vkuIDoioLngrnpg73kuI3mmK8gdXVpZCDnmoTlrZDoioLngrlcbiAgICAgICAgICAgIHZhbGlkVXVpZHMgPSB2YWxpZFV1aWRzLmZpbHRlcigodmFsaWRVdWlkKSA9PiAhdXRpbHMuaXNBSW5jbHVkZUIodXVpZCwgdmFsaWRVdWlkKSk7XG5cbiAgICAgICAgICAgIC8vIOehruS/nSAyLzLvvJogdmFsaWRVdWlkcyDph4znmoTku7vkuIDoioLngrnpg73kuI3mmK8gdXVpZCDnmoTniLboioLngrlcbiAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5zb21lKCh2YWxpZFV1aWQpID0+IHV0aWxzLmlzQUluY2x1ZGVCKHZhbGlkVXVpZCwgdXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXZhbGlkVXVpZHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS8mOWMluWIoOmZpOaXtueahOWGheWuueaPkOekulxuICAgICAgICBsZXQgbXNnID0gRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuc3VyZURlbGV0ZScpO1xuICAgICAgICBtc2cgPSBtc2cucmVwbGFjZSgnJHtsZW5ndGh9JywgdmFsaWRVdWlkc0xlbmd0aCk7XG4gICAgICAgIGNvbnN0IHNob3dJbmRleCA9IDU7XG4gICAgICAgIGxldCBmaWxlbGlzdCA9ICcnO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWRVdWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB2YWxpZFV1aWQgPSB2YWxpZFV1aWRzW2ldO1xuICAgICAgICAgICAgaWYgKGkgPiBzaG93SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh2YWxpZFV1aWQpO1xuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaSA8IHNob3dJbmRleCkge1xuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICs9IGAke2Fzc2V0Lm5hbWV9XFxuYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgKz0gJy4uLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBtc2cgPSBtc2cucmVwbGFjZSgnJHtmaWxlbGlzdH0nLCBmaWxlbGlzdCk7XG5cbiAgICAgICAgLy8g5Yig6Zmk5YmN6K+i6ZeuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5EaWFsb2cud2Fybihtc2csIHtcbiAgICAgICAgICAgIGJ1dHRvbnM6IFsnWWVzJywgJ0NhbmNlbCddLFxuICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgICAgIGNhbmNlbDogMSxcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdhc3NldHMub3BlcmF0ZS5kaWFsb2dRdWVzdGlvbicpLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzdWx0LnJlc3BvbnNlID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXNrczogQXJyYXk8UHJvbWlzZTxBc3NldEluZm8gfCBudWxsPj4gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZCA9IHZhbGlkVXVpZHNbaV07XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHZhbGlkVXVpZCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3ZhbGlkVXVpZF0gPSAnbG9hZGluZyc7XG4gICAgICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZSh2YWxpZFV1aWQpO1xuXG4gICAgICAgICAgICB0YXNrcy5wdXNoKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2Fzc2V0LWRiJywgJ2RlbGV0ZS1hc3NldCcsIGFzc2V0LnVybCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdHJlZURhdGEudXVpZFRvU3RhdGVbdmFsaWRVdWlkc1tpXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOmHjee9ruaJgOaciemAieS4rVxuICAgICAgICBpblNlbGVjdHMgJiYgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignYXNzZXQnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOS7juagkeW9ouWIoOmZpOi1hOa6kOiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOi1hOa6kFxuICAgICAqIEBwYXJhbSBpbmZvIOaVsOaNrlxuICAgICAqL1xuICAgIGRlbGV0ZWQodXVpZDogc3RyaW5nLCBpbmZvOiBBc3NldEluZm8pIHtcbiAgICAgICAgLy8g5Yig6Zmk5bey57yT5a2Y55qE57yp55Wl5Zu+XG4gICAgICAgIHV0aWxzLnRodW1ibmFpbC5kZWxldGUodXVpZCk7XG5cbiAgICAgICAgdHJlZURhdGEuZGVsZXRlZCh1dWlkLCBpbmZvKTtcbiAgICAgICAgdm0ucmVmcmVzaGluZygnZGVsZXRlZCcsIGluZm8ubmFtZSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDplK7nm5gg5LiK5LiL5bem5Y+zXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICB1cERvd25MZWZ0UmlnaHQoZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHZtLmdldExhc3RTZWxlY3QoKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBpZiAoIXZtLmlzRXhwYW5kKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGxhc3QsIHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltsYXN0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBpZiAodm0uaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtsYXN0XTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgIT09IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2wpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QocGFyZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNpYmxpbmdzID0gdXRpbHMuZ2V0U2libGluZyhsYXN0KTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50O1xuICAgICAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd1cCc6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZG93bic6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1syXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGN1cnJlbnQudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsg5LiK5LiL566t5aS077yM5aSa6YCJXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICBhc3luYyBzaGlmdFVwRG93bihkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBsZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IFtsYXN0LCBsYXN0UHJldiwgbGFzdE5leHRdID0gdXRpbHMuZ2V0U2libGluZyhwYW5lbERhdGEuYWN0LnNlbGVjdHNbbGVuZ3RoIC0gMV0pO1xuICAgICAgICBjb25zdCBoYXNMYXN0UHJldiA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgY29uc3QgaGFzTGFzdE5leHQgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMobGFzdE5leHQudXVpZCk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3VwJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0UHJldikge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdhc3NldCcsIGxhc3RQcmV2LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0UHJldi51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnYXNzZXQnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdFByZXYudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdFByZXYudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnYXNzZXQnLCBsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gbGFzdE5leHQudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ2Fzc2V0JywgbGFzdC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcobGFzdE5leHQudXVpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdE5leHQudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdE5leHQudXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQiOW5tiBzaGlmdCDlpJrpgInov4fnqIvkuK3liY3lkI7nmoTlt7LpgInkuK3poblcbiAgICAgKiDmr5TlpoIgYWIgY2RlIOmhueS4rSBhLCBjZGUg5bey6YCJ5LitLCBiIOacqumAieS4rVxuICAgICAqIOW9k+mAieS4rSBiIOaXtu+8jOWQiOW5tumAieS4remhuSBjZGUg77yM5bm25bCG5pyr5bC+6YCJ5Lit6aG555qE5oyH6ZKI5oyH5ZCRIGVcbiAgICAgKi9cbiAgICBzaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKSB7XG4gICAgICAgIGlmICghdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBrZWVwRmluZE5leHQgPSB0cnVlO1xuICAgICAgICBsZXQgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZDtcblxuICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9ICcnOyAvLyDph43nva5cblxuICAgICAgICBsZXQgbWF4TG9vcE51bWJlciA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChrZWVwRmluZE5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IHV0aWxzLmdldFNpYmxpbmcoZmluZFV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFyciB8fCAhYXJyWzFdIHx8ICFhcnJbMl0gfHwgIW1heExvb3BOdW1iZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbmRVdWlkID0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gYXJyWzJdLnV1aWQgOiBhcnJbMV0udXVpZDtcbiAgICAgICAgICAgIG1heExvb3BOdW1iZXItLTtcblxuICAgICAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhmaW5kVXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGZpbmRVdWlkKSwgMSk7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2goZmluZFV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrZWVwRmluZE5leHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5p2l6Ieq5b+r5o236ZSu55qEIHJlbmFtZVxuICAgICAqL1xuICAgIGtleWJvYXJkUmVuYW1lKCkge1xuICAgICAgICBpZiAodm0ucmVuYW1lVXJsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1dWlkID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcblxuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoYXNzZXQgJiYgIXV0aWxzLmNhbk5vdFJlbmFtZShhc3NldCkpIHtcbiAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHV1aWQpO1xuICAgICAgICAgICAgdm0ucmVuYW1lVXJsID0gYXNzZXQudXJsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnph43lkI3lkb1cbiAgICAgKiDov5nmmK/lvILmraXnmoTvvIzlj6rlgZrlj5HpgIFcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKiBAcGFyYW0gZmlsZU5hbWUg5paH5Lu25ZCNXG4gICAgICovXG4gICAgYXN5bmMgcmVuYW1lKHV1aWQ6IHN0cmluZywgZmlsZU5hbWUgPSAnJykge1xuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICBpZiAoIWFzc2V0IHx8IHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOa4heepuumcgOimgSByZW5hbWUg55qE6IqC54K5XG4gICAgICAgIHZtLnJlbmFtZVVybCA9ICcnO1xuXG4gICAgICAgIGlmICh1dGlscy5jYW5Ob3RSZW5hbWUoYXNzZXQpIHx8IGZpbGVOYW1lID09PSAnJyB8fCBmaWxlTmFtZSA9PT0gYXNzZXQuZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIC8vIG5hbWUg5a2Y5Zyo5LiU5LiO5LmL5YmN55qE5LiN5LiA5qC35omN6IO96YeN5ZCN5ZG977yM5ZCm5YiZ6L+Y5Y6f54q25oCBXG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG5cbiAgICAgICAgLy8g6YeN5ZCN5ZG96LWE5rqQXG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWxlTmFtZSArIGFzc2V0LmZpbGVFeHQ7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGAke3BhcmVudC51cmx9LyR7bmFtZX1gO1xuICAgICAgICBjb25zdCBtb3ZlQXNzZXQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdtb3ZlLWFzc2V0JywgYXNzZXQudXJsLCB0YXJnZXQpO1xuXG4gICAgICAgIGlmICghbW92ZUFzc2V0KSB7XG4gICAgICAgICAgICB2bS5kaWFsb2dFcnJvcigncmVuYW1lRmFpbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIHNvcnQoKSB7XG4gICAgICAgIHRyZWVEYXRhLnJlc29ydCgpO1xuICAgIH0sXG4gICAgc2VhcmNoKCkge1xuICAgICAgICB2bS4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgICAgIC8vIOaQnOe0ouacieWPmOWKqOmDveWFiOa7muWbnumhtumDqFxuICAgICAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g55SoIHNldFRpbWVvdXQg5LiL5LiA5bin6YeN5paw5a6a5L2NXG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaEluRm9sZGVyICYmICFwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh2bS5pbnRvVmlld0J5U2VsZWN0ZWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ouW5Yqo5Lit6auY5Lqu5qGG6YCJ5b2T5YmN5omA5aSE55qE5paH5Lu25aS56IyD5Zu0XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgZHJhZ092ZXIodXVpZDogc3RyaW5nLCBkcmFnT3ZlckFzc2V0PzogSUFzc2V0SW5mbyB8IG51bGwpIHtcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWFzc2V0LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2bS5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgICAgICAgICB2bS5kcmFnT3Zlcih0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdLCBkcmFnT3ZlckFzc2V0IHx8IGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBkcmFnIOaCrOWBnOS4gOauteaXtumXtOWQjuiHquWKqOWxleW8gOaWh+S7tuWkuVxuICAgICAgICAgICAgY29uc3Qgbm93VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBpZiAoZHJhZ092ZXJVdWlkICE9PSB1dWlkKSB7XG4gICAgICAgICAgICAgICAgZHJhZ092ZXJVdWlkID0gdXVpZDtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclRpbWVJZCA9IG5vd1RpbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub3dUaW1lIC0gZHJhZ092ZXJUaW1lSWQgPiA4MDApIHtcbiAgICAgICAgICAgICAgICAgICAgdm0udG9nZ2xlKHV1aWQsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgJHZpZXdCb3ggPSBwYW5lbERhdGEuJC52aWV3Qm94O1xuXG4gICAgICAgICAgICAvLyDlvq7osIMgdG9wXG4gICAgICAgICAgICBjb25zdCBhZGp1c3RTY3JvbGwgPSB2bS5zY3JvbGxUb3AgJSBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgYWRqdXN0VG9wID0gJHZpZXdCb3guZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gdm0uJGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDsgLy8g5rua5Yqo5Yiw5bqV6YOo5LqGXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgdG9wID0gaW5kZXggKiBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0ICsgYWRqdXN0U2Nyb2xsIC0gYWRqdXN0VG9wICsgMztcblxuICAgICAgICAgICAgY29uc3QgZXhwYW5kQ2hpbGRyZW46IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBsZXQgb3BhY2l0eSA9IGFzc2V0LnJlYWRvbmx5ID8gMCA6IDE7XG5cbiAgICAgICAgICAgIGlmICghdm0uaXNTZWFyY2hpbmdNb2RlKCkpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5nZXRDaGlsZHJlblV1aWQodXVpZCwgZXhwYW5kQ2hpbGRyZW4sIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZHJhZ092ZXJBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICBvcGFjaXR5ID0gIWRyYWdPdmVyQXNzZXQuaXNEaXJlY3RvcnkgPyAwIDogb3BhY2l0eTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmRyb3BCb3hTdHlsZSA9IHtcbiAgICAgICAgICAgICAgICBsZWZ0OiAkdmlld0JveC5zY3JvbGxMZWZ0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICB0b3A6IHRvcCArICdweCcsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAoZXhwYW5kQ2hpbGRyZW4ubGVuZ3RoICsgMSkgKiBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0ICsgMiArICdweCcsXG4gICAgICAgICAgICAgICAgb3BhY2l0eSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ouW5Yqo5Lit5oSf55+l5b2T5YmN5omA5aSE55qE5paH5Lu25aS577yM56a75byA5ZCO5Y+W5raI6auY5LquXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgZHJhZ0xlYXZlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBsZXQgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICBpZiAoYXNzZXQgJiYgIWFzc2V0LmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICBhc3NldCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbYXNzZXQudXVpZF0gPSAnJztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogdHJlZSDlrrnlmajkuIrnmoQgZHJvcFxuICAgICAqIEBwYXJhbSBldmVudCDpvKDmoIfkuovku7ZcbiAgICAgKi9cbiAgICBhc3luYyBkcm9wKGV2ZW50OiBEcmFnRXZlbnQpIHtcbiAgICAgICAgLy8g5pCc57Si5qih5byP5LiL77yM5LiN6K+G5Yir5ouW5YWlIHRyZWUg5a655ZmoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZ01vZGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoRWRpdG9yLlVJLkRyYWdBcmVhLmN1cnJlbnREcmFnSW5mbykpIHx8IHt9O1xuXG4gICAgICAgIC8vIOWmguaenOayoeacieeItuiKgueCue+8jOS+i+WmguaQnOe0ouWQjuayoee7k+aenO+8jOWImeS4jeWTjeW6lFxuICAgICAgICBpZiAoIXZtLmFzc2V0c1swXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgcm9vdFV1aWQgPSB2bS5hc3NldHNbMF0udXVpZDtcbiAgICAgICAgY29uc3QgbG9jYWxGaWxlcyA9IEFycmF5LmZyb20oZXZlbnQuZGF0YVRyYW5zZmVyIS5maWxlcyk7XG4gICAgICAgIGlmIChsb2NhbEZpbGVzICYmIGxvY2FsRmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8g5LuO5aSW6YOo5ouW5paH5Lu26L+b5p2lXG4gICAgICAgICAgICBkYXRhLnR5cGUgPSAnb3NGaWxlJztcbiAgICAgICAgICAgIGRhdGEuZmlsZXMgPSBsb2NhbEZpbGVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEudmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHV0aWxzLmdldFBhcmVudChkYXRhLnZhbHVlKTtcbiAgICAgICAgICAgIC8vIOWmguaenOS7juagueiKgueCueenu+WKqO+8jOWPiOiQveWbnuagueiKgueCue+8jOWImeS4jemcgOimgeenu+WKqFxuICAgICAgICAgICAgaWYgKHBhcmVudCAmJiBwYXJlbnQudXVpZCA9PT0gcm9vdFV1aWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnRvID0gcm9vdFV1aWQ7IC8vIOmDveW9kuS6juagueiKgueCuVxuICAgICAgICBkYXRhLmNvcHkgPSBldmVudC5jdHJsS2V5O1xuICAgICAgICB2bS5pcGNEcm9wKGRhdGEpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+b5YWlIHRyZWUg5a655ZmoXG4gICAgICovXG4gICAgZHJhZ0VudGVyKCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvkuLrmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5kcm9wQm94U3R5bGUgPSB7fTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uSWQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgdm0uZHJhZ092ZXIodHJlZURhdGEuZGlzcGxheUFycmF5WzBdKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDotYTmupDmi5bliqhcbiAgICAgKiBAcGFyYW0gZHJhZ0luZm8g5L+h5oGvXG4gICAgICovXG4gICAgYXN5bmMgaXBjRHJvcChkcmFnSW5mbzogSURyYWdJbmZvKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmZvY3VzV2luZG93KCk7IC8vIOaLlui/m+ezu+e7n+aWh+S7tuWQjueql+WPo+iOt+W+l+eEpueCue+8jOS7peinpuWPkSBpcGMg55qE5pS25Y+RXG5cbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMzAwKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0b0Fzc2V0ID0gdXRpbHMuZ2V0RGlyZWN0b3J5KGRyYWdJbmZvLnRvKTtcblxuICAgICAgICBpZiAoIXRvQXNzZXQgfHwgdXRpbHMuY2FuTm90Q3JlYXRlKHRvQXNzZXQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDku47lpJbpg6jmi5bmlofku7bov5vmnaVcbiAgICAgICAgaWYgKGRyYWdJbmZvLnR5cGUgPT09ICdvc0ZpbGUnKSB7XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZHJhZ0luZm8uZmlsZXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmaWxlcGF0aHMgPSBkcmFnSW5mby5maWxlcy5tYXAoKGZpbGU6IGFueSkgPT4gZmlsZS5wYXRoKTtcblxuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdG9Bc3NldC51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHRvQXNzZXQudXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICAgICAgICAgIGZpbGVwYXRocy5tYXAoKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnaW1wb3J0LWFzc2V0JywgZmlsZSwgdG9Bc3NldC51cmwgKyAnLycgKyBiYXNlbmFtZShmaWxlKSk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyDlr7zlhaXlrozmiJDvvIzov5jljp/niLbnuqfnirbmgIFcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3RvQXNzZXQudXVpZF0gPSAnJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHRvQXNzZXQudXVpZCk7XG4gICAgICAgICAgICB0cmVlRGF0YS5yZW5kZXIoKTtcbiAgICAgICAgfSBlbHNlIGlmIChkcmFnSW5mby50eXBlID09PSAnY2MuTm9kZScpIHtcbiAgICAgICAgICAgIC8vIOaYjuehruaOpeWPl+WklumDqOaLlui/m+adpeeahOiKgueCuSBjYy5Ob2RlXG4gICAgICAgICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZHJhZ0luZm8uYWRkaXRpb25hbCkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnR5cGUgIT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBub2RlVXVpZCA9IG5vZGUudmFsdWU7XG4gICAgICAgICAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3F1ZXJ5LW5vZGUnLCBub2RlVXVpZCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gYCR7dG9Bc3NldC51cmx9LyR7ZHVtcC5uYW1lLnZhbHVlIHx8ICdOb2RlJ30ucHJlZmFiYDtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLXByZWZhYicsIG5vZGVVdWlkLCB1cmwpO1xuICAgICAgICAgICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdCh1dWlkKTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9LCAzMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMgJiYgcGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzLmluY2x1ZGVzKGRyYWdJbmZvLnR5cGUpKSB7XG4gICAgICAgICAgICAvLyDor6XnsbvlnovnmoTkuovku7bmnInlpJbpg6jms6jlhoznmoTliqjkvZzvvIzovaznlLHlpJbpg6jms6jlhozkuovku7bmjqXnrqFcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IE9iamVjdC52YWx1ZXMocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLmNhbGxiYWNrc1tkcmFnSW5mby50eXBlXSkgYXMgRnVuY3Rpb25bXTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNhbGxiYWNrcykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KGRyYWdJbmZvLnRvKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzLmZvckVhY2goKGNhbGxiYWNrOiBGdW5jdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBEcm9wQ2FsbGJhY2tJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGFzc2V0LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RpcmVjdG9yeTogYXNzZXQuaXNEaXJlY3RvcnksXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGluZm8sIGRyYWdJbmZvLmFkZGl0aW9uYWwpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkcmFnSW5mby5hZGRpdGlvbmFsIHx8ICFBcnJheS5pc0FycmF5KGRyYWdJbmZvLmFkZGl0aW9uYWwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZHJhZ0luZm8uY29weSkge1xuICAgICAgICAgICAgICAgIC8vIOaMieS9j+S6hiBjdHJsIOmUru+8jOaLluWKqOWkjeWItlxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWRzID0gZHJhZ0luZm8uYWRkaXRpb25hbC5tYXAoKGluZm86IElEcmFnQWRkaXRpb25hbCkgPT4gaW5mby52YWx1ZS5zcGxpdCgnQCcpWzBdKTtcbiAgICAgICAgICAgICAgICB2bS5jb3B5KHV1aWRzKTtcbiAgICAgICAgICAgICAgICB2bS5wYXN0ZShkcmFnSW5mby50byk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB2bS5tb3ZlKGRyYWdJbmZvLCB0b0Fzc2V0KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi2XG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgY29weSh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb3BpZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGNvcGllcyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1dWlkIOaYryDlrZfnrKZcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/lpI3liLbnmoToioLngrlcbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSBjb3BpZXMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdENvcHkoYXNzZXQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY29waWVkVXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bCG5aSN5Yi255qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAgICBjb25zdCBjb3BpZWRJbmZvOiBJQ29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGNvcGllZFV1aWRzKTtcbiAgICAgICAgLy8g5bCG5aSN5Yi26IqC54K555qEIHV1aWQg5a2Y5pS+5Yiw57uf5LiA55qE5Ymq5YiH5p2/XG4gICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ2Fzc2V0cy1jb3BpZWQtaW5mbycsIGNvcGllZEluZm8pO1xuXG4gICAgICAgIHZtLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog57KY6LS0XG4gICAgICogQHBhcmFtIHV1aWQg57KY6LS05Yiw5q2k55uu5qCH6IqC54K5XG4gICAgICogQHBhcmFtIGNvcGllZFV1aWRzIOiiq+WkjeWItueahOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIHBhc3RlKHV1aWQ6IHN0cmluZywgY29waWVkVXVpZHM/OiBzdHJpbmdbXSkge1xuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgdXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGVzdE5vZGUgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUodXVpZCk7IC8vIOiHqui6q+aIlueItue6p+aWh+S7tuWkuVxuXG4gICAgICAgIC8vIOS8mOWFiOWkhOeQhuWJquWIh+eahOaDheWGtVxuICAgICAgICBjb25zdCBjdXRJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdhc3NldHMtY3V0LWluZm8nKTtcbiAgICAgICAgLy8g6Leo57yW6L6R5Zmo5LiN5Y+v5Ymq5YiH57KY6LS077yM5Ymq5YiH5pe25Y+v6IO96YO96L+H5ruk5YWJ5LqG5omA5Lul5Lmf6ZyA6KaB5Yik5patIGFzc2V0SW5mby5sZW5ndGhcbiAgICAgICAgaWYgKGN1dEluZm8gJiYgY3V0SW5mby5hc3NldEluZm8ubGVuZ3RoICYmIEVkaXRvci5Qcm9qZWN0LnBhdGggPT09IGN1dEluZm8ucHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1dFV1aWRzID0gY3V0SW5mby5hc3NldEluZm8ubWFwKChpdGVtOiBJQ29waWVkQXNzZXRJbmZvKSA9PiBpdGVtLnV1aWQpO1xuICAgICAgICAgICAgLy8g5aaC5p6c5Ymq5YiH5Yiw6Ieq6Lqr5paH5Lu25aS577yM57uI5q2iXG4gICAgICAgICAgICBpZiAoZGVzdE5vZGUgJiYgY3V0VXVpZHMuaW5jbHVkZXMoZGVzdE5vZGUudXVpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1vdmVEYXRhID0ge1xuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWw6IGN1dFV1aWRzLm1hcCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiB1dWlkIH07XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBhd2FpdCB2bS5tb3ZlKG1vdmVEYXRhLCBkZXN0Tm9kZSk7XG5cbiAgICAgICAgICAgIC8vIOe9ruepuuWJquWIh+adv+eahOWkjeWItuWSjOWJquWIh+i1hOa6kFxuICAgICAgICAgICAgRWRpdG9yLkNsaXBib2FyZC5jbGVhcigpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDliKTmlq3kuI3mmK/lhbbku5bmk43kvZzkvKDlhaXnmoTlj4LmlbBcbiAgICAgICAgaWYgKCFjb3BpZWRVdWlkcykge1xuICAgICAgICAgICAgY29uc3QgY29waWVkSW5mbyA9IEVkaXRvci5DbGlwYm9hcmQucmVhZCgnYXNzZXRzLWNvcGllZC1pbmZvJyk7XG4gICAgICAgICAgICBsZXQgY29waWVkRmlsZXMgPSBbXTtcbiAgICAgICAgICAgIGlmIChjb3BpZWRJbmZvKSB7XG4gICAgICAgICAgICAgICAgLy8g5LuO5Ymq5YiH5p2/5Lit6I635Y+WIGNvcGllZFV1aWRzIOWSjOWkhOeQhui3qOe8lui+keWZqOaXtueahOaWh+S7tui3r+W+hFxuICAgICAgICAgICAgICAgIGNvcGllZFV1aWRzID0gY29waWVkSW5mby5hc3NldEluZm8ubWFwKChpdGVtOiBJQ29waWVkQXNzZXRJbmZvKSA9PiBpdGVtLnV1aWQpO1xuICAgICAgICAgICAgICAgIGNvcGllZEZpbGVzID0gY29waWVkSW5mby5hc3NldEluZm8ubWFwKChpdGVtOiBJQ29waWVkQXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoOiBpdGVtLmZpbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJQYXRoOiBkZXN0Tm9kZS51cmwgKyAnLycgKyBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogVE9ETzpcbiAgICAgICAgICAgICAqIOi3qOaWh+S7tuezu+e7n++8jOaaguS4jeaUr+aMge+8jOWPr+S7peiAg+iZkeWmguS9leWkjeeUqCBkcm9wIOWKqOS9nFxuICAgICAgICAgICAgICog55uu5YmN5Y+q5pSv5oyB6Leo57yW6L6R5Zmo77yM5L2/55SoIHByb2plY3QucGF0aCDliKTmlq3vvIxwYXN0ZSDlkowgZHJvcCDni6znq4vlrp7njrBcbiAgICAgICAgICAgICAqIOWJquWIh+adv+S4reWtmOWCqOeahOaYr+Wvueixoee7k+aehO+8jOWQjue7reWPr+S7peWCqOWtmCBKU09OIOWtl+espuS4slxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvLyDot6jnvJbovpHlmajnspjotLRcbiAgICAgICAgICAgIGlmIChjb3BpZWRGaWxlcy5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCAhPT0gY29waWVkSW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgICAgIC8vIOaYvuekuiBsb2FkaW5nIOaViOaenFxuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKGRlc3ROb2RlLnV1aWQpO1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShkZXN0Tm9kZS51dWlkLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBjb3BpZWRGaWxlcykge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbXBvcnQtYXNzZXQnLCBmaWxlLnNyY1BhdGgsIGZpbGUudGFyUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJyc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzlpI3liLbliLDoh6rouqvmlofku7blpLnvvIzpnIDopoHlvoDkuIrnp7vkuIDlsYLmlofku7blpLlcbiAgICAgICAgaWYgKGRlc3ROb2RlICYmIGNvcGllZFV1aWRzPy5pbmNsdWRlcyhkZXN0Tm9kZS51dWlkKSkge1xuICAgICAgICAgICAgZGVzdE5vZGUgPSB1dGlscy5jbG9zZXN0V2hpY2hDYW5DcmVhdGUodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtkZXN0Tm9kZS51dWlkXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgICAgLy8g5rKh5pyJ5Y+v55So55qEXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaW5hbGx5Q2FuUGFzdGU6IHN0cmluZ1tdID0gW107IC8vIOacgOWQjuWPr+WkjeWItueahOmhuVxuICAgICAgICBjb3BpZWRVdWlkcz8uZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDoioLngrnlj6/lpI3liLZcbiAgICAgICAgICAgIGNvbnN0IGNhbkNvcHkgPSAhdXRpbHMuY2FuTm90Q29weShhc3NldCk7XG4gICAgICAgICAgICBpZiAoIWNhbkNvcHkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YXJuID0gYCR7RWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuY29weUZhaWwnKX06ICR7YXNzZXQubmFtZX1gO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybih3YXJuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5LiN5piv5q2k55uu5qCH6IqC54K555qE54i26IqC54K577yI5LiN5Zyo5a6D55qE5LiK57qn5paH5Lu25aS56YeM77yJXG4gICAgICAgICAgICBjb25zdCBpbnNpZGUgPSB1dGlscy5pc0FJbmNsdWRlQih1dWlkLCBkZXN0Tm9kZS51dWlkKTtcbiAgICAgICAgICAgIGlmIChpbnNpZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YXJuID0gYCR7RWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZXJyb3JQYXN0ZVBhcmVudFRvQ2hpbGQnKX06ICR7YXNzZXQubmFtZX1gO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybih3YXJuKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhbkNvcHkgJiYgIWluc2lkZSkge1xuICAgICAgICAgICAgICAgIGZpbmFsbHlDYW5QYXN0ZS5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbmFsbHlDYW5QYXN0ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGxldCBhc3NldDtcbiAgICAgICAgbGV0IG5ld0Fzc2V0OiBJQXNzZXRJbmZvIHwgbnVsbDtcbiAgICAgICAgY29uc3QgbmV3U2VsZWN0czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgLy8g5pi+56S6IGxvYWRpbmcg5pWI5p6cXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW2Rlc3ROb2RlLnV1aWRdID0gJ2xvYWRpbmcnO1xuICAgICAgICB0cmVlRGF0YS51bkZyZWV6ZShkZXN0Tm9kZS51dWlkKTtcbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgdm0udG9nZ2xlKGRlc3ROb2RlLnV1aWQsIHRydWUpO1xuXG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQoZmluYWxseUNhblBhc3RlW2luZGV4XSk7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgbmV3QXNzZXQgPSBudWxsO1xuXG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gYmFzZW5hbWUoYXNzZXQudXJsKTtcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0ID0gYCR7ZGVzdE5vZGUudXJsfS8ke25hbWV9YDtcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdnZW5lcmF0ZS1hdmFpbGFibGUtdXJsJywgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICBuZXdBc3NldCA9IChhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdjb3B5LWFzc2V0JywgYXNzZXQudXJsLCB0YXJnZXQpKSBhcyBJQXNzZXRJbmZvIHwgbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChuZXdBc3NldCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IG5ld0Fzc2V0LnV1aWQ7XG4gICAgICAgICAgICAgICAgICAgIG5ld1NlbGVjdHMucHVzaChuZXdBc3NldC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gd2hpbGUgKG5ld0Fzc2V0KTtcblxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVtkZXN0Tm9kZS51dWlkXSA9ICcnO1xuXG4gICAgICAgIC8vIOmAieS4reaWsOeahOmhueebrlxuICAgICAgICB2bS5pcGNTZWxlY3QobmV3U2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliarliIfmmK/pooTlrprnmoTooYzkuLrvvIzlj6rmnInlho3miafooYznspjotLTmk43kvZzmiY3kvJrnlJ/mlYhcbiAgICAgKiBAcGFyYW0gdXVpZCDotYTmupBcbiAgICAgKi9cbiAgICBjdXQodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3V0cyA9IFtdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgY3V0cyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1dWlkIOaYryDlrZfnrKZcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi/h+a7pOS4jeWPr+WJquWIh+eahOiKgueCuVxuICAgICAgICBjb25zdCBjdXRVdWlkcyA9IGN1dHMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdEN1dChhc3NldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOe7meWkjeWItueahOWKqOS9nOWPjemmiOaIkOWKn1xuICAgICAgICBjdXRVdWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHV1aWQsICdsaWdodCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDlsIbliarliIfnmoQgdXVpZHMg5aSE55CG5oiQ5Ymq5YiH5p2/55qE5a+56LGh57G75Z6LXG4gICAgICAgIGNvbnN0IGN1dEluZm86IElDb3BpZWRJbmZvID0gdm0udXVpZHNUb0NvcGllZEluZm8oY3V0VXVpZHMpO1xuICAgICAgICAvLyDlsIbliarliIfoioLngrnnmoQgdXVpZCDlrZjmlL7liLDnu5/kuIDnmoTliarliIfmnb9cbiAgICAgICAgRWRpdG9yLkNsaXBib2FyZC53cml0ZSgnYXNzZXRzLWN1dC1pbmZvJywgY3V0SW5mbyk7XG5cbiAgICAgICAgdm0ucmVuZGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlsIblpI3liLYv5Ymq5YiH55qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IHV1aWRzXG4gICAgICogQHJldHVybiB7Kn0gIHtJQ29waWVkSW5mb31cbiAgICAgKi9cbiAgICB1dWlkc1RvQ29waWVkSW5mbyh1dWlkczogc3RyaW5nW10pOiBJQ29waWVkSW5mbyB7XG4gICAgICAgIGNvbnN0IGNvcGllZEluZm8gPSA8SUNvcGllZEluZm8+e307XG4gICAgICAgIGNvcGllZEluZm8ucHJvamVjdFBhdGggPSBFZGl0b3IuUHJvamVjdC5wYXRoO1xuICAgICAgICBjb3BpZWRJbmZvLmFzc2V0SW5mbyA9IFtdO1xuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0OiBJQXNzZXRJbmZvIHwgbnVsbCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgY29waWVkQXNzZXRJbmZvOiBJQ29waWVkQXNzZXRJbmZvID0ge1xuICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0ID8gYXNzZXQudXVpZCA6ICcnLFxuICAgICAgICAgICAgICAgIGZpbGU6IGFzc2V0ID8gYXNzZXQuZmlsZSA6ICcnLFxuICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0ID8gYXNzZXQubmFtZSA6ICcnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvcGllZEluZm8uYXNzZXRJbmZvLnB1c2goY29waWVkQXNzZXRJbmZvKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjb3BpZWRJbmZvO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi26LWE5rqQ77yM5bmz57qnXG4gICAgICogQHBhcmFtIHV1aWRzIOi1hOa6kFxuICAgICAqL1xuICAgIGFzeW5jIGR1cGxpY2F0ZSh1dWlkczogc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV1aWRzKSB7XG4gICAgICAgICAgICB1dWlkcyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gdXVpZHMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQgJiYgIXV0aWxzLmNhbk5vdER1cGxpY2F0ZShhc3NldCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjb3BpZWRVdWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm9yIChjb25zdCB1dWlkIG9mIGNvcGllZFV1aWRzKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdm0ucGFzdGUodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXSwgW3V1aWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog56e75YqoIOi1hOa6kFxuICAgICAqIEBwYXJhbSBkcmFnSW5mbyDkv6Hmga9cbiAgICAgKiBAcGFyYW0gdG9Bc3NldCDnp7vliqjnm67nmoTlnLDotYTmupBcbiAgICAgKi9cbiAgICBhc3luYyBtb3ZlKGRyYWdJbmZvOiBJRHJhZ0luZm8sIHRvQXNzZXQ6IElBc3NldEluZm8pIHtcbiAgICAgICAgaWYgKCFkcmFnSW5mbyB8fCAhdG9Bc3NldCB8fCAhQXJyYXkuaXNBcnJheShkcmFnSW5mby5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bGV5byA55uu5qCH5paH5Lu25aS5XG4gICAgICAgIHZtLnRvZ2dsZSh0b0Fzc2V0LnV1aWQsIHRydWUpO1xuXG4gICAgICAgIGNvbnN0IHV1aWRzID0gZHJhZ0luZm8uYWRkaXRpb25hbC5tYXAoKGluZm86IElEcmFnQWRkaXRpb25hbCkgPT4gaW5mby52YWx1ZS5zcGxpdCgnQCcpWzBdKTtcblxuICAgICAgICAvLyDlpJrotYTmupDnp7vliqjvvIzmoLnmja7njrDmnInmjpLluo/nmoTpobrluo/miafooYxcbiAgICAgICAgdXVpZHMuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFJbmRleCA9IHRyZWVEYXRhLnV1aWRUb0luZGV4W2FdO1xuICAgICAgICAgICAgY29uc3QgYkluZGV4ID0gdHJlZURhdGEudXVpZFRvSW5kZXhbYl07XG4gICAgICAgICAgICByZXR1cm4gYUluZGV4IC0gYkluZGV4O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCB1dWlkc0xlbmd0aCA9IHV1aWRzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1dWlkc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdXVpZHNbaV07XG5cbiAgICAgICAgICAgIGlmICh2YWxpZFV1aWRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZyb21Bc3NldCA9IHV0aWxzLmdldEFzc2V0KHV1aWQpO1xuICAgICAgICAgICAgY29uc3QgZnJvbVBhcmVudCA9IHV0aWxzLmdldFBhcmVudCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tQXNzZXQgfHwgIWZyb21QYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvQXNzZXQudXVpZCA9PT0gZnJvbUFzc2V0LnV1aWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHV0aWxzLmNhbk5vdEN1dChmcm9tQXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRvQXNzZXQg5pivIGZyb21Bc3NldCDnmoTlrZDpm4bvvIzmiYDku6XniLbkuI3og73np7vliLDlrZDph4zpnaJcbiAgICAgICAgICAgIGlmICh1dGlscy5pc0FJbmNsdWRlQihmcm9tQXNzZXQudXVpZCwgZHJhZ0luZm8udG8pKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOi1hOa6kOenu+WKqOS7jeWcqOWOn+adpeeahOebruW9leWGhe+8jOS4jemcgOimgeenu+WKqFxuICAgICAgICAgICAgaWYgKHRvQXNzZXQudXVpZCA9PT0gZnJvbVBhcmVudC51dWlkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhbGlkVXVpZHMucHVzaCh1dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhc2tzOiBBcnJheTxQcm9taXNlPEFzc2V0SW5mbyB8IG51bGw+PiA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHZhbGlkVXVpZHNMZW5ndGggPSB2YWxpZFV1aWRzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSB2YWxpZFV1aWRzW2ldO1xuICAgICAgICAgICAgY29uc3QgZnJvbUFzc2V0ID0gdXRpbHMuZ2V0QXNzZXQodXVpZCk7XG4gICAgICAgICAgICBjb25zdCBmcm9tUGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Bc3NldCB8fCAhZnJvbVBhcmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnp7vliqjotYTmupBcbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gZnJvbUFzc2V0LnV1aWQ7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgICAgIHRyZWVEYXRhLnVuRnJlZXplKHV1aWQpO1xuICAgICAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHRvQXNzZXQudXJsICsgJy8nICsgYmFzZW5hbWUoZnJvbUFzc2V0LnVybCk7XG5cbiAgICAgICAgICAgIC8vIOWunuS+i+WMluiZmuaLn+i1hOa6kFxuICAgICAgICAgICAgaWYgKGZyb21Bc3NldC5pbnN0YW50aWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGFza3MucHVzaChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdpbml0LWFzc2V0JywgZnJvbUFzc2V0LnVybCwgdGFyZ2V0KSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhc2tzLnB1c2goRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAnbW92ZS1hc3NldCcsIGZyb21Bc3NldC51cmwsIHRhcmdldCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZFV1aWRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gdmFsaWRVdWlkc1tpXTtcbiAgICAgICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDpgInkuK3np7vliqjpoblcbiAgICAgICAgdm0uaXBjU2VsZWN0KHZhbGlkVXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YeN5paw5a+85YWl6LWE5rqQXG4gICAgICogQHBhcmFtIHV1aWQg6LWE5rqQXG4gICAgICovXG4gICAgYXN5bmMgcmVpbXBvcnQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBzZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4rVxuICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgc2VsZWN0cyA9IFt1dWlkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgbGV0IHZhbGlkVXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBzZWxlY3RzW2ldO1xuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXRBc3NldCh1dWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCB1dGlscy5jYW5Ob3RSZWltcG9ydChhc3NldCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhc3NldC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIC8vIOehruS/nSAxLzLvvJogdmFsaWRVdWlkcyDph4zpnaLku7vkuIDotYTmupDpg73kuI3mmK8gdXVpZCDnmoTomZrmi5/lrZDotYTmupBcbiAgICAgICAgICAgICAgICB2YWxpZFV1aWRzID0gdmFsaWRVdWlkcy5maWx0ZXIoKHZhbGlkVXVpZCkgPT4gIXV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIHZhbGlkVXVpZCkpO1xuXG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIDIvMu+8miB2YWxpZFV1aWRzIOmHjOeahOS7u+S4gOi1hOa6kOmDveS4jeaYryB1dWlkIOeahOeItui1hOa6kFxuICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5zb21lKCh2YWxpZFV1aWQpID0+IHV0aWxzLmlzQUluY2x1ZGVCKHZhbGlkVXVpZCwgdXVpZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRVdWlkcy5wdXNoKHV1aWQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bdXVpZF07XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsaWRVdWlkcy5pbmNsdWRlcyhjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZFV1aWRzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkc0xlbmd0aCA9IHZhbGlkVXVpZHMubGVuZ3RoO1xuICAgICAgICBpZiAoIXZhbGlkVXVpZHNMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHZhbGlkVXVpZCBvZiB2YWxpZFV1aWRzKSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdyZWltcG9ydC1hc3NldCcsIHZhbGlkVXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOagkeW9ouaVsOaNruW3suaUueWPmFxuICAgICAqIOWmgui1hOa6kOWinuWIoOaUue+8jOaYr+i+g+Wkp+eahOWPmOWKqO+8jOmcgOimgemHjeaWsOiuoeeul+WQhOS4qumFjeWll+aVsOaNrlxuICAgICAqIOWinuWKoCBzZXRUaW1lT3V0IOaYr+S4uuS6huS8mOWMluadpeiHquW8guatpeeahOWkmuasoeinpuWPkVxuICAgICAqL1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgLy8g5a655Zmo55qE5pW05L2T6auY5bqmXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnRyZWVIZWlnaHQgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoICogcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodDtcblxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5hbGxFeHBhbmQgPSB2bS5pc0FsbEV4cGFuZCgpO1xuXG4gICAgICAgIC8vIOmHjeaWsOa4suafk+WHuuagkeW9olxuICAgICAgICB2bS5maWx0ZXJBc3NldHMoKTtcblxuICAgICAgICB3aGlsZSAocGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCByZWFkeVR3aW5rbGUgPSBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQocmVhZHlUd2lua2xlLnV1aWQsIHJlYWR5VHdpbmtsZS5hbmltYXRpb24pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDph43mlrDmuLLmn5PmoJHlvaJcbiAgICAgKiB2bS5hc3NldHMg5Li65b2T5YmN5pi+56S655qE6YKj5Yeg5Liq6IqC54K55pWw5o2uXG4gICAgICovXG4gICAgZmlsdGVyQXNzZXRzKCkge1xuICAgICAgICB2bS5hc3NldHMgPSBbXTsgLy8g5YWI5riF56m677yM6L+Z56eN6LWL5YC85py65Yi25omN6IO95Yi35pawIHZ1Ze+8jOiAjCAubGVuZ3RoID0gMCDkuI3ooYxcblxuICAgICAgICBjb25zdCB0b3AgPSB2bS5zY3JvbGxUb3AgJSBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0O1xuICAgICAgICBjb25zdCBtaW4gPSB2bS5zY3JvbGxUb3AgLSB0b3A7IC8vIOeul+WHuuWPr+inhuWMuuWfn+eahCB0b3Ag5pyA5bCP5YC8XG4gICAgICAgIGNvbnN0IG1heCA9IG1pbiArIHBhbmVsRGF0YS4kLnBhbmVsLnZpZXdIZWlnaHQ7IC8vIOacgOWkp+WAvFxuXG4gICAgICAgIHZtLiRlbC5zdHlsZS50b3AgPSBgLSR7dG9wfXB4YDtcblxuICAgICAgICBjb25zdCBzdGFydCA9IE1hdGgucm91bmQobWluIC8gcGFuZWxEYXRhLmNvbmZpZy5hc3NldEhlaWdodCk7XG4gICAgICAgIGNvbnN0IGVuZCA9IE1hdGguY2VpbChtYXggLyBwYW5lbERhdGEuY29uZmlnLmFzc2V0SGVpZ2h0KSArIDE7XG5cbiAgICAgICAgdm0uYXNzZXRzID0gdHJlZURhdGEub3V0cHV0RGlzcGxheShzdGFydCwgZW5kKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPlumAieS4reWIl+ihqOaVsOe7hOS4reesrOS4gOS4quiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnuWcqOaYvuekuumYn+WIl+S4reeahOesrOS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGdldEZpcnN0U2VsZWN0KCkge1xuICAgICAgICBjb25zdCBmaXJzdCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXTtcblxuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPlumAieS4reWIl+ihqOaVsOe7hOS4reacgOWQjuS4gOS4quiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnuWcqOaYvuekuumYn+WIl+S4reeahOacgOWQjuS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGdldExhc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC5zZWxlY3RzW3NlbGVjdHNMZW5ndGggLSAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlMZW5ndGggPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIHRyZWVEYXRhLmRpc3BsYXlBcnJheVtkaXNwbGF5TGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPluinhuinieS4iuagkeW9ouS4iuS4i+WIl+ihqOS4re+8jOesrOS4gOS4qumAieS4reiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnumhtuWxguagueiKgueCuSAnZGI6Ly8nXG4gICAgICovXG4gICAgZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCkge1xuICAgICAgICBsZXQgdXVpZCA9IHBhbmVsRGF0YS5jb25maWcucHJvdG9jb2w7XG5cbiAgICAgICAgY29uc3QgbWluSW5kZXggPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoO1xuXG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3QgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZihzZWxlY3QpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IG1pbkluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQgPSBzZWxlY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDov5Tlm57moJHlvaLnrKzkuIDkuKroioLngrlcbiAgICAgKiDnrKzkuIDkuKroioLngrnvvIzkuI3kuIDlrprmmK/moLnoioLngrnvvIzkvovlpoLlnKjmkJzntKLnmoTmg4XlhrXkuItcbiAgICAgKi9cbiAgICBnZXRGaXJzdENoaWxkKCkge1xuICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5WzBdO1xuICAgIH0sXG4gICAgaXNFeHBhbmQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0cmVlRGF0YS51dWlkVG9FeHBhbmRbdXVpZF07XG4gICAgfSxcbiAgICBpc1NlbGVjdCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpICE9PSAtMTtcbiAgICB9LFxuICAgIGlzVHdpbmtsZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS5hY3QudHdpbmtsZXNbdXVpZF07XG4gICAgfSxcbiAgICBpc0FsbEV4cGFuZCgpIHtcbiAgICAgICAgbGV0IGFsbENvbGxhcHNlID0gdHJ1ZTtcblxuICAgICAgICBsZXQgcGFyZW50cyA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3BhbmVsRGF0YS5jb25maWcucHJvdG9jb2xdO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICBpZiAoc2VsZWN0c0xlbmd0aCkge1xuICAgICAgICAgICAgcGFyZW50cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcGFyZW50cyB8fCAhcGFyZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGxDb2xsYXBzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudHNMZW5ndGggPSBwYXJlbnRzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnRzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBwYXJlbnRVdWlkID0gcGFyZW50c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRyZWVEYXRhLnV1aWRUb0Fzc2V0W3BhcmVudFV1aWRdO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAmJiAhcGFyZW50LmlzUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0cmVlRGF0YS51dWlkVG9FeHBhbmRbcGFyZW50VXVpZF0pIHtcbiAgICAgICAgICAgICAgICBhbGxDb2xsYXBzZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICFhbGxDb2xsYXBzZTtcbiAgICB9LFxuICAgIGlzU2VhcmNoaW5nTW9kZSgpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzU2VhcmNoaW5nTW9kZSgpO1xuICAgIH0sXG4gICAgYXN5bmMgZGlhbG9nRXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuZXJyb3IoRWRpdG9yLkkxOG4udChgYXNzZXRzLm9wZXJhdGUuJHttZXNzYWdlfWApLCB7XG4gICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnYXNzZXRzLm9wZXJhdGUuZGlhbG9nRXJyb3InKSxcbiAgICAgICAgfSk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCB3YXRjaCA9IHtcbiAgICAvKipcbiAgICAgKiBzY3JvbGxUb3Ag5Y+Y5YyW77yM5Yi35paw5qCR5b2iXG4gICAgICovXG4gICAgc2Nyb2xsVG9wKCkge1xuICAgICAgICB2bS5maWx0ZXJBc3NldHMoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOW9k+WJjemAieS4remhueWPmOWKqFxuICAgICAqL1xuICAgIGFjdGl2ZUFzc2V0KCkge1xuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5hY3RpdmVBc3NldCA9IHZtLmFjdGl2ZUFzc2V0O1xuICAgIH0sXG59O1xuXG4vKipcbiAqIHZ1ZSBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXRhKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGFzc2V0czogW10sIC8vIOW9k+WJjeagkeW9ouWcqOWPr+inhuWMuuWfn+eahOi1hOa6kOiKgueCuVxuICAgICAgICByZW5hbWVVcmw6ICcnLCAvLyDpnIDopoEgcmVuYW1lIOeahOiKgueCueeahCB1cmzvvIzlj6rmnInkuIDkuKpcbiAgICAgICAgYWRkSW5mbzoge1xuICAgICAgICAgICAgLy8g5re75Yqg5LiA5Liq5paw6LWE5rqQ5YmN55qE5pWw5o2u77yM6ZyA6KaB5LqL5YmN6YeN5ZG95ZCNXG4gICAgICAgICAgICB0eXBlOiAnJyxcbiAgICAgICAgICAgIGltcG9ydGVyOiAnJyxcbiAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgZmlsZUV4dDogJycsXG4gICAgICAgICAgICBmaWxlTmFtZTogJycsXG4gICAgICAgICAgICBwYXJlbnREaXI6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBpbnRvVmlld0J5U2VsZWN0ZWQ6ICcnLCAvLyDmlLbliLDpgInkuK0gaXBjIOmcgOimgeWumuS9jeaYvuekuueahOi1hOa6kFxuICAgICAgICBpbnRvVmlld0J5VXNlcjogJycsIC8vIOeUqOaIt+aTjeS9nOeahOaWsOWinuenu+WKqOi1hOa6kO+8jOe7meS6iOWumuS9jVxuICAgICAgICBzY3JvbGxUb3A6IDAsIC8vIOW9k+WJjeagkeW9oueahOa7muWKqOaVsOaNrlxuICAgICAgICBkcm9wcGFibGVUeXBlczogW10sXG4gICAgICAgIGNoZWNrU2hpZnRVcERvd25NZXJnZTogeyB1dWlkOiAnJywgZGlyZWN0aW9uOiAnJyB9LCAvLyBzaGlmdCArIOeureWktOWkmumAie+8jOWinuW8uuS6pOS6kuaViOaenFxuICAgIH07XG59XG5cbi8qKlxuICogdm0gPSB0aGlzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtb3VudGVkKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB2bSA9IHRoaXM7XG5cbiAgICAvLyDlr7nkuo7lrZDpm4bnmoTlj5jliqjvvIzmnIDlkI7kuIDkuKogaXBjIOa2iOaBr+WPkeeahOaYr+eItue6p+aWh+S7tuWkueeahOWPmOWKqO+8jOi/meS4jemcgOimgeaYvuekuuWHuuadpe+8jOaJgOS7peWBmuS6huiusOW9leWHhuWkh+W/veeVpVxuICAgIHZtLnJlZnJlc2hpbmcuaWdub3JlcyA9IHt9O1xufVxuIl19