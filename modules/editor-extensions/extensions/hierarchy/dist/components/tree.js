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
exports.mounted = exports.data = exports.methods = exports.watch = exports.components = exports.template = exports.name = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const panelData = __importStar(require("./panel-data"));
const treeData = __importStar(require("./tree-data"));
const utils = __importStar(require("./utils"));
let vm = null;
let requestAnimationId;
let selectedTimeId;
let isRefreshing = false;
// 用于识别 drag 悬停，自动展开父级
let dragOverUuid;
let dragOverTime;
let lockMoveNode = false;
exports.name = 'tree';
exports.template = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../../static/template/tree.html'), 'utf8');
exports.components = {
    'tree-node': require('./tree-node'),
};
exports.watch = {
    /**
     * scrollTop 变化，刷新树形
     */
    scrollTop() {
        vm.filter();
    },
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
        const droppableTypes = vm.$parent.droppableTypes.concat(panelData.config.creatableTypes);
        vm.droppableTypes = droppableTypes.concat(panelData.config.extendDrop.types);
    },
    /**
     * 清空树形
     */
    clear() {
        treeData.clear();
        vm.refresh();
    },
    /**
     * 刷新树形
     */
    async refresh() {
        if (isRefreshing) {
            return;
        }
        isRefreshing = true;
        // 延迟 200 ms 刷新，延迟期间可以合并多次 changed 产生的刷新指令，缓解性能问题
        await new Promise((r) => setTimeout(r, 200));
        try {
            await treeData.reset();
        }
        catch (error) {
            console.error(error);
        }
        isRefreshing = false;
    },
    /**
     * 全部选中
     * @param uuid 节点
     */
    selectAll(uuid) {
        if (utils.isSearching()) {
            Editor.Selection.clear('node');
            Editor.Selection.select('node', treeData.displayArray);
            return;
        }
        uuid = uuid || vm.getFirstSelectSortByDisplay();
        const node = utils.getNode(uuid);
        if (!node) {
            return;
        }
        const parentUuid = treeData.uuidToParentUuid[uuid] || uuid; // parentUuid 为空是根节点，转为自身 uuid
        const siblingUuids = utils.getChildrenUuids(parentUuid);
        const currentSelects = panelData.act.selects.slice();
        const isIncluded = currentSelects.includes(uuid);
        let siblingsAllIn = true;
        siblingUuids.forEach((siblingUuid) => {
            if (!panelData.act.selects.includes(siblingUuid)) {
                siblingsAllIn = false;
            }
        });
        if (siblingsAllIn) {
            Editor.Selection.select('node', parentUuid);
            return;
        }
        else {
            if (isIncluded) {
                // 删除超过范围的已选中节点
                currentSelects.forEach((select) => {
                    if (!siblingUuids.includes(select)) {
                        Editor.Selection.unselect('node', select);
                    }
                });
                Editor.Selection.select('node', siblingUuids);
            }
            else {
                Editor.Selection.clear('node');
                if (!utils.isParent(uuid)) {
                    Editor.Selection.select('node', siblingUuids);
                }
                else {
                    const children = treeData.uuidToChildren[uuid].slice();
                    Editor.Selection.select('node', children);
                }
            }
        }
    },
    selectClear() {
        Editor.Selection.clear('node');
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
                vm.intoViewByUser = uuid;
                // 检查 shift 多选的动作
                if (uuid === vm.checkShiftUpDownMerge.uuid) {
                    vm.shiftUpDownMergeSelected();
                }
            }
        });
        vm.filter();
    },
    /**
     * 取消选中项
     * @param uuid 节点
     */
    unselected(uuid) {
        if (vm.intoViewByUser === uuid) {
            vm.intoViewByUser = '';
        }
        const index = panelData.act.selects.indexOf(uuid);
        if (index !== -1) {
            panelData.act.selects.splice(index, 1);
        }
        vm.filter();
    },
    /**
     * 恢复选中状态
     */
    reselected() {
        const uuids = Editor.Selection.getSelected('node').filter((uuid) => !!treeData.uuidToNode[uuid]);
        if (!uuids.length) {
            return;
        }
        vm.selected(uuids);
        window.clearTimeout(selectedTimeId);
        utils.scrollIntoView(vm.intoViewByUser);
    },
    /**
     * shift + click 多选
     * @param uuid 节点
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
     * @param uuid 节点
     */
    ctrlClick(uuid) {
        if (panelData.act.selects.includes(uuid)) {
            Editor.Selection.unselect('node', uuid);
        }
        else {
            Editor.Selection.select('node', uuid);
        }
    },
    /**
     * 重新选中节点
     * @param uuid 节点
     */
    ipcSelect(uuid) {
        if (Array.isArray(uuid)) {
            const oldSelected = new Set();
            const newSelected = new Set();
            // 需要先执行一次遍历，填充 set 供后面使用
            uuid.forEach((id) => newSelected.add(id));
            const needUnSelect = [];
            panelData.act.selects.forEach((id) => {
                oldSelected.add(id);
                // 如果新的列表没有该id，需要取消
                if (!newSelected.has(id)) {
                    needUnSelect.push(id);
                }
            });
            needUnSelect.length && Editor.Selection.unselect('node', needUnSelect);
            const needSelect = [];
            uuid.forEach((id) => {
                // 如果旧的列表没有该id，需要选中
                if (!oldSelected.has(id)) {
                    needSelect.push(id);
                }
            });
            if (needSelect.length) {
                // 如果有新增的选中 就选中新增的
                Editor.Selection.select('node', needSelect);
            }
            else if (uuid.length) {
                // 如果没有，则说明后来的选中是之前就有的，为了让其他面板监听到 select
                // 这边还是需要发送一次
                Editor.Selection.select('node', uuid);
            }
        }
        else {
            Editor.Selection.clear('node');
            Editor.Selection.select('node', uuid);
        }
    },
    /**
     * 选中树形上的第一个节点
     */
    ipcSelectFirstChild() {
        Editor.Selection.clear('node');
        const uuid = this.getFirstChild();
        if (uuid) {
            Editor.Selection.select('node', uuid);
        }
    },
    /**
     * 空白处点击，取消选中
     */
    click() {
        if (utils.forbidOperate()) {
            return;
        }
        Editor.Selection.clear('node');
    },
    /**
     * 创建节点前名称事前处理
     * @param json AddNode
     */
    async addTo(json) {
        if (utils.isSearching()) {
            panelData.$.panel.clearSearch();
        }
        if (!json.parent) {
            json.parent = this.getFirstSelect();
        }
        const parent = await utils.getParentWhenAddNode(json);
        if (!parent) {
            return;
        }
        vm.toggle(json.parent, true);
        json.parent = parent.uuid;
        // 设置显示位置的目标节点
        json.sibling = utils.getLastExpandChildUuid(parent.uuid);
        await utils.scrollIntoView(json.sibling);
        json.name = await Editor.Message.request(panelData.act.messageProtocol.scene, 'generate-available-name', json.name, json.parent);
        json.nameIncrease = false;
        vm.addNode = json;
    },
    /**
     * 新增节点，事前重命名后接收数据
     * @param json AddNode
     */
    addConfirm(json) {
        // 新增的输入框消失
        vm.addNode.sibling = '';
        // 数据错误时取消
        if (!json || !json.parent) {
            vm.addEnd();
            return;
        }
        const parent = utils.getNode(json.parent);
        if (!parent) {
            vm.addEnd();
            return;
        }
        if (utils.canNotCreateNode(parent)) {
            // 父级不可创建节点
            vm.addEnd();
            return;
        }
        vm.add(json);
    },
    addEnd() {
        // loading 效果消失
        vm.addNode.parent = '';
    },
    /**
     * ipc 发起创建节点
     * @param json AddNode
     */
    async add(json) {
        if (utils.forbidOperate()) {
            return;
        }
        try {
            panelData.$.panel.isOperating = true;
            // const undoID = await Editor.Message.request(panelData.act.messageProtocol.scene, 'begin-recording', json.parent);
            await Editor.Message.request(panelData.act.messageProtocol.scene, 'create-node', json);
            // await Editor.Message.request(panelData.act.messageProtocol.scene, 'end-recording', undoID);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            panelData.$.panel.isOperating = false;
            vm.addEnd();
        }
    },
    /**
     * 节点已添加到场景
     * @param uuid 节点
     */
    added(uuid) {
        vm.refresh();
        panelData.act.twinkleQueues.push({ uuid, animation: 'shrink' });
    },
    /**
     * 更新树形节点
     * @param uuid 节点
     */
    changed(uuid) {
        vm.refresh();
        // 根节点太频繁了，不要闪烁
        const node = utils.getNode(uuid);
        if (!node || node.isScene) {
            return;
        }
    },
    /**
     * 删除
     * @param uuid 节点
     */
    async delete(uuid) {
        if (utils.forbidOperate()) {
            return;
        }
        if (uuid && !panelData.act.selects.includes(uuid)) {
            // 如果该节点没有被选中，则只是删除此单个
            const node = utils.getNode(uuid);
            if (!node) {
                return;
            }
            // 允许删除
            if (!utils.canNotDeleteNode(node)) {
                await treeData.deleteNode(uuid);
            }
        }
        else {
            // 如果该节点是被选中了，表明要删除所有选中项
            const uuids = [];
            const parents = [];
            panelData.act.selects.forEach((select) => {
                const node = utils.getNode(select);
                if (!node) {
                    return;
                }
                // 删除允许删除
                if (!utils.canNotDeleteNode(node)) {
                    uuids.push(select);
                    parents.push(treeData.uuidToParentUuid[select]);
                }
            });
            if (!uuids.length) {
                return;
            }
            await treeData.deleteNode(uuids);
        }
    },
    /**
     * 从树形删除节点
     */
    deleted() {
        vm.refresh();
    },
    /**
     * 节点的折叠切换
     * @param uuid 节点
     * @param expand true or false
     * @param loop 是否向子集循环
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
     * 全部节点折叠或展开
     */
    allToggle() {
        if (!treeData.nodeTree) {
            return;
        }
        const isExpand = utils.isAllExpand();
        const parents = [];
        const selectsLength = panelData.act.selects.length;
        if (selectsLength) {
            for (let i = 0; i < selectsLength; i++) {
                let parentUuid = panelData.act.selects[i];
                if (!utils.isParent(parentUuid)) {
                    parentUuid = treeData.uuidToParentUuid[parentUuid];
                    if (!parents.includes(parentUuid)) {
                        treeData.toggleExpand(parentUuid, !isExpand);
                    }
                }
                else {
                    parents.push(parentUuid);
                }
            }
        }
        else {
            parents.push(treeData.nodeTree.uuid);
        }
        for (let i = 0; i < parents.length; i++) {
            treeData.loopExpand(parents[i], !isExpand);
        }
    },
    /**
     * 上下左右 按键
     * @param direction 方向
     */
    upDownLeftRight(direction) {
        const last = vm.getLastSelect();
        if (direction === 'right') {
            if (!utils.isExpand(last)) {
                vm.toggle(last, true);
                return;
            }
            const children = treeData.uuidToChildren[last];
            if (Array.isArray(children) && children.length) {
                vm.ipcSelect(children[0]);
            }
        }
        else if (direction === 'left') {
            if (utils.isExpand(last)) {
                vm.toggle(last, false);
                return;
            }
            const parent = treeData.uuidToParentUuid[last];
            if (parent) {
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
     * 按住 shift 键，同时上下选择
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
                Editor.Selection.select('node', lastPrev.uuid);
                vm.checkShiftUpDownMerge.uuid = lastPrev.uuid;
                vm.checkShiftUpDownMerge.direction = direction;
                return;
            }
            else {
                if (!hasLastNext) {
                    Editor.Selection.unselect('node', last.uuid);
                }
                await utils.scrollIntoView(lastPrev.uuid);
            }
            panelData.act.selects.splice(panelData.act.selects.indexOf(lastPrev.uuid), 1);
            panelData.act.selects.push(lastPrev.uuid);
        }
        if (direction === 'down') {
            if (!hasLastNext) {
                Editor.Selection.select('node', lastNext.uuid);
                vm.checkShiftUpDownMerge.uuid = lastNext.uuid;
                vm.checkShiftUpDownMerge.direction = direction;
                return;
            }
            else {
                if (!hasLastPrev) {
                    Editor.Selection.unselect('node', last.uuid);
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
     * 移动节点
     * @param command - 指定
     * up - 向上移动
     * down - 向下移动
     * top - 置顶（只在组内的最顶部）
     * bottom - 置底（只在组内的最底部）
     */
    async moveNode(command) {
        if (lockMoveNode)
            return;
        lockMoveNode = true;
        function getMoveNodeInfo(selectNodeUuid) {
            const parent = treeData.uuidToParentUuid[selectNodeUuid];
            const parentChildren = treeData.uuidToChildren[parent] || [];
            const index = parentChildren.findIndex((uuid) => uuid === selectNodeUuid) || 0;
            return { node: selectNodeUuid, parent: parent, parentChildren, index };
        }
        const sameGroup = {}; // 通过一个 parent 的节点
        const firstNode = getMoveNodeInfo(panelData.act.selects[0]);
        sameGroup[firstNode.parent] = [firstNode];
        for (let i = 1; i < panelData.act.selects.length; i++) {
            const info = getMoveNodeInfo(panelData.act.selects[i]);
            if (!sameGroup[info.parent]) {
                sameGroup[info.parent] = [];
            }
            if (firstNode.parent === info.parent) {
                if (!sameGroup[info.parent].find((item) => item.node === firstNode.node)) {
                    sameGroup[info.parent].push(firstNode);
                }
                if (!sameGroup[info.parent].find((item) => item.node === info.node)) {
                    sameGroup[info.parent].push(info);
                }
            }
            else {
                sameGroup[info.parent].push(info);
            }
        }
        let snapshot = false;
        for (const key in sameGroup) {
            const group = sameGroup[key];
            group.sort((a, b) => {
                // 从小到大排序
                if (a.index > b.index) {
                    return 1;
                }
                if (a.index < b.index) {
                    return -1;
                }
                return 0;
            });
            // 合并连续的 index 为一组
            const mergeIndexList = [];
            let currentGroup = [group[0]];
            for (let i = 1; i < group.length; i++) {
                if (group[i].index === group[i - 1].index + 1) { // 如果当前数字与前一个数字连续，则加入当前组中
                    currentGroup.push(group[i]);
                }
                else { // 否则将当前组加入结果数组中，并开启一个新的组
                    mergeIndexList.push(currentGroup);
                    currentGroup = [group[i]];
                }
            }
            mergeIndexList.push(currentGroup);
            if (command === 'down' || command === 'bottom') {
                mergeIndexList.sort((aGroup, bGroup) => {
                    // 从大到小排序
                    if (aGroup[0].index > bGroup[0].index) {
                        return -1;
                    }
                    if (aGroup[0].index < bGroup[0].index) {
                        return 1;
                    }
                    return 0;
                });
                for (const subGroup of mergeIndexList) {
                    // 如果是向下方向的话，需要重新排序把大的放到第一位
                    subGroup.sort((a, b) => {
                        // 从大到小排序
                        if (a.index > b.index) {
                            return -1;
                        }
                        if (a.index < b.index) {
                            return 1;
                        }
                        return 0;
                    });
                }
            }
            let lastCount = 0; // 上一个组的长度
            for (const subGroup of mergeIndexList) {
                let offset = 0;
                const firstNode = subGroup[0];
                const maxCount = firstNode.parentChildren.length - 1;
                switch (command) {
                    case 'up': //向上移
                        if (firstNode.index - 1 >= 0) {
                            offset = -1;
                        }
                        break;
                    case 'top': //置顶
                        if (firstNode.index - 1 >= 0) {
                            offset = (lastCount - firstNode.index);
                        }
                        break;
                    case 'down': //向下移
                        if (firstNode.index + 1 <= maxCount) {
                            offset = 1;
                        }
                        break;
                    case 'bottom': // 置底
                        if (firstNode.index + 1 <= maxCount) {
                            offset = (maxCount - (firstNode.index + lastCount));
                        }
                        break;
                    default:
                        offset = 0;
                        break;
                }
                lastCount = subGroup.length;
                if (offset !== 0) {
                    snapshot = true;
                    for (const moveNodeInfo of subGroup) {
                        await treeData.moveNode(moveNodeInfo.parent, moveNodeInfo.index, offset);
                    }
                }
            }
        }
        if (snapshot) {
            Editor.Message.send(panelData.act.messageProtocol.scene, 'snapshot');
            if (command === 'top') {
                vm.intoViewByUser = this.getFirstSelectSortByDisplay();
            }
            else if (command === 'bottom') {
                vm.intoViewByUser = this.getLastSelectSortByDisplay();
            }
        }
        setTimeout(() => {
            lockMoveNode = false;
        }, 50);
    },
    /**
     * 来自快捷键的 rename
     */
    async keyboardRename() {
        if (utils.forbidOperate()) {
            return;
        }
        if (vm.renameUuid) {
            return;
        }
        const uuid = vm.getFirstSelect();
        const asset = utils.getNode(uuid);
        if (asset && !utils.canNotRename(asset)) {
            await utils.scrollIntoView(uuid);
            vm.renameUuid = uuid;
        }
    },
    /**
     * 节点重名命
     * 这是异步的，只做发送
     * @param uuid 节点
     * @param name 不重命名时传 name = null
     */
    async rename(uuid, name) {
        if (utils.forbidOperate()) {
            return;
        }
        // 清空 rename 的节点
        vm.renameUuid = '';
        const node = utils.getNode(uuid);
        if (!node || treeData.uuidToState[uuid] === 'loading') {
            return;
        }
        /**
         * 不重命名的情况:
         * name = null
         * 锁定
         * 和前值一样
         */
        if (name === null || utils.canNotRename(node) || name === node.name) {
            treeData.uuidToState[uuid] = '';
            return;
        }
        treeData.uuidToState[uuid] = 'loading';
        // 保存历史记录
        const undoID = await Editor.Message.request(panelData.act.messageProtocol.scene, 'begin-recording', uuid, { auto: false });
        // 发送重名命数据
        const isSuccess = await Editor.Message.request(panelData.act.messageProtocol.scene, 'set-property', {
            uuid: uuid,
            path: 'name',
            dump: {
                type: 'string',
                value: name,
            },
        });
        if (!isSuccess) {
            await Editor.Message.request(panelData.act.messageProtocol.scene, 'cancel-recording', undoID);
            vm.dialogError('renameFail');
        }
        else {
            await Editor.Message.request(panelData.act.messageProtocol.scene, 'end-recording', undoID);
        }
        treeData.uuidToState[uuid] = '';
    },
    /**
     * 执行搜索
     */
    async search() {
        // 搜索有变动都先滚回顶部
        if (panelData.$.panel.searchValue) {
            panelData.$.viewBox.scrollTo(0, 0);
            if (panelData.$.panel.searchType === 'asset') {
                await treeData.findNodesUseAsset();
            }
        }
        else {
            vm.intoViewByUser = vm.getFirstSelect();
        }
        if (panelData.$.panel.searchType === 'missAsset') {
            panelData.$.viewBox.scrollTo(0, 0);
            await treeData.findNodesMissAsset();
        }
        treeData.render();
    },
    /**
     * 拖动中感知当前所处节点位置
     * @param uuid 节点
     * @param position 位置：before，inside，after
     */
    dragOver(uuid, position) {
        window.cancelAnimationFrame(requestAnimationId);
        requestAnimationId = requestAnimationFrame(() => {
            if (uuid === '') {
                uuid = vm.getFirstChild();
            }
            const node = utils.getNode(uuid);
            if (!node) {
                return;
            }
            // drag 悬停一段时间后自动展开节点
            const nowTime = Date.now();
            if (dragOverUuid !== uuid) {
                dragOverUuid = uuid;
                dragOverTime = nowTime;
            }
            else {
                if (nowTime - dragOverTime > 800 && !treeData.uuidToExpand[node.uuid]) {
                    if (position === 'inside') {
                        vm.toggle(node.uuid, true);
                    }
                    requestAnimationFrame(() => {
                        panelData.$.viewBox.scrollTop += 1;
                    });
                    return;
                }
            }
            const { nodeHeight, iconWidth, padding } = panelData.config;
            const { clientHeight, offsetHeight, scrollTop, scrollHeight } = panelData.$.viewBox;
            const isAtBottom = scrollTop && clientHeight + scrollTop === scrollHeight;
            const viewRect = panelData.$.viewBox.getBoundingClientRect();
            const treeRect = vm.$el.getBoundingClientRect();
            const adjustTop = viewRect.top - treeRect.top;
            const adjustScrollTop = vm.scrollTop % nodeHeight;
            const scrollbarHeight = offsetHeight - clientHeight;
            const depthLeft = node.depth * iconWidth;
            const displayTop = treeData.displayArray.indexOf(uuid) * nodeHeight;
            let top = displayTop - adjustTop + adjustScrollTop + padding;
            let adjustVerticalHeight = -13;
            if (isAtBottom) {
                adjustVerticalHeight -= 2;
                top += scrollbarHeight;
            }
            let height = nodeHeight;
            let zIndex = 0;
            const adjustLeft = -3;
            const width = vm.$el.offsetWidth - depthLeft - adjustLeft;
            const left = depthLeft + adjustLeft;
            const parentTop = treeData.displayArray.indexOf(treeData.uuidToParentUuid[uuid]) * nodeHeight;
            switch (position) {
                case 'before':
                    height = 2;
                    zIndex = 10;
                    break;
                case 'after':
                    height = 2;
                    zIndex = 10;
                    top = (treeData.displayArray.indexOf(utils.getLastExpandChildUuid(uuid)) + 1) * nodeHeight + padding;
                    break;
            }
            top = Math.min(scrollHeight - height, top);
            if (utils.isSearching() && ['before', 'after'].includes(position)) {
                return;
            }
            panelData.$.panel.dropBox = {
                style: {
                    top: top + 'px',
                    left: left + 'px',
                    height: height + 'px',
                    width: width + 'px',
                    zIndex,
                },
                position,
                vertical: {
                    height: top - parentTop + adjustVerticalHeight + 'px',
                },
            };
        });
    },
    /**
     * 进入 tree 容器
     */
    dragEnter() {
        // 搜索模式下，不识别为拖入 tree 容器
        if (utils.isSearching()) {
            panelData.$.panel.dropBox.style = {
                top: '-2px',
            };
            return;
        }
        window.cancelAnimationFrame(requestAnimationId);
        requestAnimationId = requestAnimationFrame(() => {
            vm.dragOver('', 'after');
        });
    },
    /**
     * drop 到面板空白区域里
     * @param event 鼠标事件
     */
    drop(event) {
        // @ts-ignore
        if (event.target && !event.target.hasAttribute('hoving')) {
            return;
        }
        const data = JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)) || {};
        // cc.Scene 根节点
        data.to = utils.getLastChildUuid(treeData.nodeTree?.uuid);
        data.insert = 'after';
        data.copy = event.ctrlKey;
        data.keepWorldTransform = !event.shiftKey;
        vm.ipcDrop(data);
    },
    /**
     * 节点拖动
     * @param json DragNode
     */
    async ipcDrop(json) {
        panelData.$.panel.focusWindow();
        if (utils.forbidOperate()) {
            return;
        }
        if (utils.isSearching()) {
            panelData.$.panel.clearSearch();
        }
        const uuids = [];
        const values = [];
        const { value, type, name, insert } = json;
        let { additional } = json;
        if (insert === 'inside') {
            vm.toggle(json.to, true);
        }
        if (additional) {
            // 增加一处容错
            if (!Array.isArray(additional)) {
                additional = [additional];
            }
            /**
             * 由于所有的子资源也在 event.values 数据里
             * 无法区分多选子资源的情况
             * 约定对识别到有 cc.Prefab 这种子资源，便对其父级下其他资源进行过滤，该实体父资源只取 cc.Prefab 子资源
             */
            // 需要过滤掉其他子资源的父资源 uuid
            const excludeSubAssets = {};
            const excludeOthers = ['cc.Prefab', 'cc.LabelAtlas'];
            additional.forEach((info) => {
                if (vm.droppableTypes.includes(info.type)) {
                    const [assetUuid, subAssetUuid] = info.value.split('@');
                    if (excludeOthers.includes(info.type)) {
                        excludeSubAssets[assetUuid] = true;
                    }
                    else if (excludeSubAssets[assetUuid]) {
                        return;
                    }
                    uuids.push(info.value);
                    values.push(info);
                }
            });
        }
        else if (!vm.droppableTypes.includes(type)) {
            return;
        }
        if (value && !uuids.includes(value)) {
            uuids.push(value);
            values.push({ type, value, name });
        }
        // values 有过滤了 additional 节点组件数据，重置给 additional
        json.additional = values;
        if (json.type === 'cc.Node') {
            if (!uuids.length) {
                return;
            }
            if (json.copy) {
                // 按住了 ctrl 键，拖动复制
                await vm.copy(uuids);
                await vm.paste(json.to, json.keepWorldTransform);
                return;
            }
            vm.move(json);
        }
        else if (panelData.config.extendDrop.types && panelData.config.extendDrop.types.includes(json.type)) {
            // 该类型的事件有外部注册的动作，转由外部注册事件接管
            const callbacks = Object.values(panelData.config.extendDrop.callbacks[json.type]);
            if (callbacks && Array.isArray(callbacks)) {
                const toNode = utils.getNode(json.to);
                if (toNode) {
                    const toParentUuid = treeData.uuidToParentUuid[json.to];
                    const toIndex = treeData.uuidToChildren[toParentUuid].indexOf(json.to);
                    callbacks.forEach((callback) => {
                        const info = {
                            node: toNode.uuid,
                            parent: toParentUuid,
                            index: toIndex,
                            position: json.insert,
                        };
                        callback(info, json.additional);
                    });
                }
            }
        }
        else {
            // 将被注入数据的对象
            const toNode = utils.getNode(json.to);
            if (!toNode) {
                return;
            }
            const toParentUuid = treeData.uuidToParentUuid[json.to] ?? toNode.uuid; // 当场景节点下无子节点 需要容错
            // 拖到 prefab 根节点的顶部放置，需要转为放置在内部
            if (toNode.isPrefabRoot && json.insert !== 'inside') {
                json.insert = 'inside';
            }
            // 当判断为插入某个节点时，需要判断当前节点是否在选中列表中，如果在
            // 我们决定插入的行为是批量插入所有选中的节点
            let parents = json.insert === 'inside' ? [json.to] : [toParentUuid];
            if (json.insert === 'inside' && panelData.act.selects.includes(json.to)) {
                parents = [...panelData.act.selects];
            }
            // recording
            const undoID = await Editor.Message.request(panelData.act.messageProtocol.scene, 'begin-recording', parents);
            const newUuids = [];
            for (const asset of values) {
                if (!panelData.config.creatableTypes.includes(asset.type)) {
                    continue;
                }
                const assetUuid = asset.value;
                for (const parent of parents) {
                    // 将被注入数据的对象
                    const toNode = utils.getNode(parent);
                    if (!toNode) {
                        continue;
                    }
                    vm.addNode.parent = parent;
                    const newUuid = await Editor.Message.request(panelData.act.messageProtocol.scene, 'create-node', {
                        parent,
                        assetUuid,
                        name: asset.name,
                        type: asset.type,
                        unlinkPrefab: asset.unlinkPrefab,
                        canvasRequired: asset.canvasRequired,
                    });
                    vm.addNode.parent = '';
                    newUuids.push(newUuid);
                }
                if (json.insert === 'inside') {
                    // 上步已新增完毕
                    continue;
                }
                const toArr = treeData.uuidToChildren[toParentUuid];
                const toIndex = toArr.indexOf(json.to);
                let offset = toIndex - toArr.length; // 目标索引减去自身索引
                if (offset < 0 && json.insert === 'after') {
                    // 小于0的偏移默认是排在目标元素之前，如果是 after 要 +1
                    offset += 1;
                }
                else if (offset > 0 && json.insert === 'before') {
                    // 大于0的偏移默认是排在目标元素之后，如果是 before 要 -1
                    offset -= 1;
                }
                // 在父级里平移
                treeData.moveNode(toParentUuid, toArr.length, offset);
            }
            if (newUuids.length) {
                await Editor.Message.request(panelData.act.messageProtocol.scene, 'end-recording', undoID);
            }
            else {
                await Editor.Message.request(panelData.act.messageProtocol.scene, 'cancel-recording', undoID);
            }
            // 选中新的节点
            vm.ipcSelect(newUuids);
        }
    },
    /**
     * 复制
     * @param uuid 节点
     */
    async copy(uuid) {
        if (utils.forbidOperate()) {
            return;
        }
        let copies = [];
        if (Array.isArray(uuid)) {
            copies = uuid;
        }
        else {
            // 来自右击菜单的单个选中，右击节点不在已选项目里
            if (uuid && !panelData.act.selects.includes(uuid)) {
                copies = [uuid];
            }
            else {
                copies = panelData.act.selects.slice();
            }
        }
        const validUuids = copies.filter((uuid) => {
            const node = utils.getNode(uuid);
            return node && !utils.canNotCopyNode(node);
        });
        const copiedUuids = utils.filterChildren(validUuids);
        await treeData.copyNode(copiedUuids);
        // 给复制的动作反馈成功
        copiedUuids.forEach((uuid) => {
            utils.twinkle.add(uuid, 'light');
        });
    },
    /**
     * 粘贴
     * @param uuid 目标节点， !pasteAsChild 时默认粘贴到目标节点同级
     * @param keepWorldTransform 是否保持世界坐标
     * @param pasteAsChild 是否粘贴为目标节点的子节点
     * @returns
     */
    async paste(uuid, keepWorldTransform = false, pasteAsChild) {
        if (utils.forbidOperate()) {
            return;
        }
        if (!uuid) {
            uuid = this.getFirstSelect();
        }
        // 优先处理剪切的情况
        const nodesInfo = Editor.Clipboard.read('nodes-info');
        if (nodesInfo && nodesInfo.type === 'cut' && nodesInfo.uuids.length && Editor.Project.path === nodesInfo.projectPath) {
            const cutUuids = nodesInfo.uuids;
            const validUuids = utils.filterChildren(cutUuids);
            if (validUuids.includes(uuid)) {
                return;
            }
            const moveData = {
                type: 'cc.Node',
                to: uuid,
                insert: 'inside',
                additional: validUuids.map((uuid) => {
                    return { value: uuid, type: 'cc.Node' };
                }),
                keepWorldTransform,
                copy: false,
            };
            await vm.move(moveData);
            // 清空剪切板
            Editor.Clipboard.clear();
            return;
        }
        // 只可在项目内复制粘贴
        if (nodesInfo && nodesInfo.type === 'copy' && nodesInfo.uuids.length && Editor.Project.path === nodesInfo.projectPath) {
            const copiedUuids = nodesInfo.uuids;
            try {
                panelData.$.panel.isOperating = true;
                const validUuids = utils.filterChildren(copiedUuids);
                // 新的选中项切换为新节点
                await treeData.pasteNode(uuid, validUuids, keepWorldTransform, pasteAsChild);
            }
            catch (e) {
                console.error(e);
            }
            finally {
                panelData.$.panel.isOperating = false;
            }
        }
    },
    /**
     * 剪切
     * 剪切是预定的行为，只有再执行粘贴操作才会生效
     * @param uuid 节点
     */
    async cut(uuid) {
        if (utils.forbidOperate()) {
            return;
        }
        let cuts = [];
        if (Array.isArray(uuid)) {
            cuts = uuid;
        }
        else {
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
            const node = utils.getNode(uuid);
            return node && !utils.canNotCutNode(node);
        });
        if (cutUuids.length === 0) {
            return;
        }
        // 给复制的动作反馈成功
        cutUuids.forEach((uuid) => {
            utils.twinkle.add(uuid, 'light');
        });
        // 通知 scene 同步执行 cut
        await treeData.cutNode(cutUuids);
    },
    /**
     * 克隆
     * @param uuid 节点
     */
    async duplicate(uuid) {
        if (utils.forbidOperate()) {
            return;
        }
        let duplicates = [];
        if (Array.isArray(uuid)) {
            duplicates = uuid;
        }
        else {
            // 来自右击菜单的单个选中，右击节点不在已选项目里
            if (uuid && !panelData.act.selects.includes(uuid)) {
                duplicates = [uuid];
            }
            else {
                duplicates = panelData.act.selects.slice();
            }
        }
        // 过滤不可复制的节点
        const uuids = utils.filterChildren(duplicates).filter((uuid) => {
            const node = utils.getNode(uuid);
            return node && !utils.canNotCopyNode(node);
        });
        if (!uuids.length) {
            return;
        }
        try {
            // 可能是批量操作，给加个锁
            panelData.$.panel.isOperating = true;
            await treeData.duplicateNode(uuids);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            panelData.$.panel.isOperating = false;
        }
    },
    /**
     * 移动
     * @param json DragNode
     */
    async move(json) {
        if (utils.forbidOperate()) {
            return;
        }
        if (!json || !json.to || !Array.isArray(json.additional)) {
            return;
        }
        const uuids = json.additional.map((info) => info.value);
        // 移动的元素有重叠
        if (uuids.includes(json.to)) {
            return;
        }
        // 将被注入数据的对象
        const toNode = utils.getNode(json.to);
        const toParent = utils.getParent(json.to);
        if (!toNode) {
            return;
        }
        if (toNode.isPrefabRoot && json.insert !== 'inside') {
            // 不能移动到当前编辑的 prefab 根节点的前后
            return;
        }
        if (toNode.isScene && json.insert !== 'inside') {
            // 拖动到场景根节点的前后位置，也相当于拖进里面
            json.insert = 'inside';
            await vm.move(json);
            return;
        }
        let parentNode = toNode;
        if (toParent && ['before', 'after'].includes(json.insert)) {
            parentNode = toParent;
        }
        const parentNodeUuid = parentNode.uuid;
        // 多节点的移动，根据现有排序的顺序执行
        const fromUuids = uuids
            .map((uuid) => {
            // toNode 节点是 fromNode 的子集，父不能移到子里面, 取消移动
            if (utils.isAIncludeB(uuid, json.to)) {
                return '';
            }
            const fromNode = utils.getNode(uuid);
            const fromParent = utils.getParent(uuid);
            if (!fromNode) {
                return '';
            }
            if (json.insert === 'inside' && parentNode === fromParent) {
                return '';
            }
            return uuid;
        })
            .filter(Boolean)
            .sort((a, b) => {
            return treeData.uuidToIndex[a] - treeData.uuidToIndex[b];
        });
        // 无节点移动
        if (!fromUuids.length) {
            return;
        }
        // 针对批量操作，需要先把待改动的节点都收集起来，然后再执行
        const changedParents = {};
        changedParents[parentNodeUuid] = true;
        for (const fromUuid of fromUuids) {
            const fromNode = utils.getNode(fromUuid);
            if (!fromNode) {
                continue;
            }
            const fromParentUuid = treeData.uuidToParentUuid[fromUuid];
            if (parentNodeUuid !== fromParentUuid) {
                changedParents[fromParentUuid] = true;
            }
        }
        const undoID = await Editor.Message.request(panelData.act.messageProtocol.scene, 'begin-recording', Object.keys(changedParents));
        // 开始执行
        let adjustIndex = 0;
        for (const fromUuid of fromUuids) {
            const fromNode = utils.getNode(fromUuid);
            if (!fromNode) {
                continue;
            }
            vm.intoViewByUser = fromUuid;
            const fromParentUuid = treeData.uuidToParentUuid[fromUuid];
            if (parentNodeUuid !== fromParentUuid) {
                await treeData.setParent(parentNodeUuid, [fromUuid], json.keepWorldTransform);
            }
            if (!['before', 'after'].includes(json.insert)) {
                continue;
            }
            // 现有 api 下，这一步得查询实时位置，才好准确移动到新位置
            const parentNodeInfo = await treeData.getDumpData(parentNode.uuid);
            const toNodeIndex = parentNodeInfo.children.findIndex((child) => child.value.uuid === toNode.uuid);
            const fromNodeIndex = parentNodeInfo.children.findIndex((child) => child.value.uuid === fromNode.uuid);
            let offset = toNodeIndex - fromNodeIndex;
            if (json.insert === 'after') {
                if (offset < 0) {
                    // 小于 0 的偏移默认是排在目标元素之前，如果是 after 要 +1
                    offset += 1;
                }
                offset += adjustIndex;
            }
            if (json.insert === 'before') {
                if (offset > 0) {
                    // 大于 0 的偏移默认是排在目标元素之后，如果是 before 要 -1
                    offset -= 1;
                }
            }
            await treeData.moveNode(parentNode.uuid, fromNodeIndex, offset);
            adjustIndex++;
        }
        await Editor.Message.request(panelData.act.messageProtocol.scene, 'end-recording', undoID);
    },
    /**
     * 树形数据已改变
     * 如节点增删改，是较大的变动，需要重新计算各个配套数据
     */
    render() {
        // 容器的整体高度
        panelData.$.panel.treeHeight = treeData.displayArray.length * panelData.config.nodeHeight + panelData.config.padding * 2;
        panelData.$.panel.allExpand = utils.isAllExpand();
        while (panelData.act.twinkleQueues.length) {
            const readyTwinkle = panelData.act.twinkleQueues.shift();
            utils.twinkle.add(readyTwinkle.uuid, readyTwinkle.animation);
        }
        // 重新渲染出树形
        vm.filter();
    },
    /**
     * 在数据不变的情况下，根据滚动位置渲染树形
     */
    filter() {
        // 面板拖拽到 tab 里不会立即显示，需要手动切换 tab，在切换前面板 height=0
        // 规避 height=0 非正常情况下往下执行错误计算，在切换 tab 后会执行 show 进行正确的计算渲染
        if (!panelData.$.panel.viewHeight) {
            return;
        }
        // 先清空，这种赋值机制才能刷新 vue，而 .length = 0 不行
        vm.nodes = [];
        const nodeHeight = panelData.config.nodeHeight;
        const scrollTop = vm.scrollTop;
        const top = scrollTop % nodeHeight;
        // 算出可视区域的 top 最小值
        const min = scrollTop - top;
        // 最大值
        const max = min + panelData.$.panel.viewHeight;
        vm.$el.style.top = `-${top}px`;
        const start = Math.round(min / nodeHeight);
        const end = Math.ceil(max / nodeHeight) + 1;
        vm.nodes = treeData.outputDisplay(start, end);
        clearTimeout(vm.scrollIntoViewTimeId);
        vm.scrollIntoViewTimeId = setTimeout(async () => {
            if (vm.intoViewByUser) {
                const done = await utils.scrollIntoView(vm.intoViewByUser);
                if (done) {
                    vm.intoViewByUser = '';
                }
            }
        }, 50);
    },
    /**
     * 返回节点 uuid
     */
    getFirstSelect() {
        const first = panelData.act.selects[0];
        if (first) {
            return first;
        }
        else {
            return vm.getFirstChild();
        }
    },
    /**
     * 获取选中列表数组中最后一个节点，没有选中项，返回空
     */
    getLastSelect() {
        const length = panelData.act.selects.length;
        if (length) {
            return panelData.act.selects[length - 1];
        }
        else {
            return vm.getFirstChild();
        }
    },
    /**
     * 获取视觉上树形上下列表中，第一个选中节点，没有选中项，返回顶层根节点
     */
    getFirstSelectSortByDisplay() {
        let uuid = '';
        let index = Infinity;
        panelData.act.selects.forEach((select) => {
            if (treeData.uuidToIndex[select] < index) {
                index = treeData.uuidToIndex[select];
                uuid = select;
            }
        });
        return uuid || treeData.nodeTree?.uuid;
    },
    /**
     * 获取视觉上树形上下列表中，第一个选中节点，没有选中项，返回顶层根节点
     */
    getLastSelectSortByDisplay() {
        let uuid = '';
        let index = 0;
        panelData.act.selects.forEach((select) => {
            if (treeData.uuidToIndex[select] > index) {
                index = treeData.uuidToIndex[select];
                uuid = select;
            }
        });
        return uuid || treeData.nodeTree?.uuid;
    },
    /**
     * 返回树形第一个节点
     * 第一个节点，不一定是根节点，例如在搜索的情况下
     */
    getFirstChild() {
        if (utils.isSearching()) {
            return treeData.nodeTree?.uuid;
        }
        return treeData.displayArray[0];
    },
    isActive(uuid) {
        return utils.isActive(uuid);
    },
    isExpand(uuid) {
        return utils.isExpand(uuid);
    },
    isParent(uuid) {
        return utils.isParent(uuid);
    },
    isSelected(uuid) {
        return utils.isSelected(uuid);
    },
    isAnimating(uuid) {
        return utils.isAnimating(uuid || panelData.act.animationUuid);
    },
    isSearching() {
        return utils.isSearching();
    },
    async dialogError(message) {
        await Editor.Dialog.error(Editor.I18n.t(`hierarchy.operate.${message}`), {
            title: Editor.I18n.t('hierarchy.operate.dialogError'),
        });
    },
};
/**
 * vue data
 */
function data() {
    return {
        nodes: [],
        renameUuid: '',
        addNode: {
            // 添加一个新节点前的数据，需要事前重命名
            name: '',
            parent: '',
            sibling: '',
        },
        intoViewByUser: '',
        scrollTop: 0,
        droppableTypes: [],
        twinkles: {},
        checkShiftUpDownMerge: { uuid: '', direction: '' }, // shift + 箭头多选，增强交互效果
    };
}
exports.data = data;
/**
 * vm = this
 */
function mounted() {
    // @ts-ignore
    vm = this;
}
exports.mounted = mounted;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVliLCtCQUE0QjtBQUM1QiwyQkFBa0M7QUFDbEMsd0RBQTBDO0FBQzFDLHNEQUF3QztBQUN4QywrQ0FBaUM7QUFFakMsSUFBSSxFQUFFLEdBQVEsSUFBSSxDQUFDO0FBQ25CLElBQUksa0JBQXVCLENBQUM7QUFDNUIsSUFBSSxjQUFtQixDQUFDO0FBQ3hCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztBQUV6QixzQkFBc0I7QUFDdEIsSUFBSSxZQUFpQixDQUFDO0FBQ3RCLElBQUksWUFBaUIsQ0FBQztBQUV0QixJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7QUFFWixRQUFBLElBQUksR0FBRyxNQUFNLENBQUM7QUFFZCxRQUFBLFFBQVEsR0FBRyxJQUFBLGlCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFcEYsUUFBQSxVQUFVLEdBQUc7SUFDdEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUM7Q0FDdEMsQ0FBQztBQUVXLFFBQUEsS0FBSyxHQUFHO0lBQ2pCOztPQUVHO0lBQ0gsU0FBUztRQUNMLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNoQixDQUFDO0NBQ0osQ0FBQztBQUVXLFFBQUEsT0FBTyxHQUFHO0lBQ25COzs7T0FHRztJQUNILENBQUMsQ0FBQyxHQUFXO1FBQ1QsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUNEOztPQUVHO0lBQ0gsTUFBTTtRQUNGLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1B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LElBQUksQ0FBQztBQUNkLENBQUM7QUFIRCwwQkFHQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtcbiAgICBBZGROb2RlLFxuICAgIFRyZWVOb2RlLFxuICAgIERyYWdOb2RlSW5mbyxcbiAgICBEcmFnTm9kZSxcbiAgICBEcm9wQ2FsbGJhY2tJbmZvLFxuICAgIElNb3ZlTm9kZUluZm8sXG4gICAgVE1vdmVOb2RlQ29tbWFuZCwgSURpcmVjdGlvbixcbn0gZnJvbSAnLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9wYW5lbC1kYXRhJztcbmltcG9ydCAqIGFzIHRyZWVEYXRhIGZyb20gJy4vdHJlZS1kYXRhJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5sZXQgdm06IGFueSA9IG51bGw7XG5sZXQgcmVxdWVzdEFuaW1hdGlvbklkOiBhbnk7XG5sZXQgc2VsZWN0ZWRUaW1lSWQ6IGFueTtcbmxldCBpc1JlZnJlc2hpbmcgPSBmYWxzZTtcblxuLy8g55So5LqO6K+G5YirIGRyYWcg5oKs5YGc77yM6Ieq5Yqo5bGV5byA54i257qnXG5sZXQgZHJhZ092ZXJVdWlkOiBhbnk7XG5sZXQgZHJhZ092ZXJUaW1lOiBhbnk7XG5cbmxldCBsb2NrTW92ZU5vZGUgPSBmYWxzZTtcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAndHJlZSc7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS90cmVlLmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgJ3RyZWUtbm9kZSc6IHJlcXVpcmUoJy4vdHJlZS1ub2RlJyksXG59O1xuXG5leHBvcnQgY29uc3Qgd2F0Y2ggPSB7XG4gICAgLyoqXG4gICAgICogc2Nyb2xsVG9wIOWPmOWMlu+8jOWIt+aWsOagkeW9olxuICAgICAqL1xuICAgIHNjcm9sbFRvcCgpIHtcbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBtZXRob2RzID0ge1xuICAgIC8qKlxuICAgICAqIOe/u+ivkVxuICAgICAqIEBwYXJhbSBrZXkg5LiN5bim6Z2i5p2/5ZCN56ew55qE5qCH6K6w5a2X56ymXG4gICAgICovXG4gICAgdChrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBwYW5lbERhdGEuJC5wYW5lbC50KGtleSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlpJbpg6jmlbDmja7mm7TmlrDlkI7vvIzmm7TmlrDlhoXpg6jmlbDmja5cbiAgICAgKi9cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIGNvbnN0IGRyb3BwYWJsZVR5cGVzID0gdm0uJHBhcmVudC5kcm9wcGFibGVUeXBlcy5jb25jYXQocGFuZWxEYXRhLmNvbmZpZy5jcmVhdGFibGVUeXBlcyk7XG4gICAgICAgIHZtLmRyb3BwYWJsZVR5cGVzID0gZHJvcHBhYmxlVHlwZXMuY29uY2F0KHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmuIXnqbrmoJHlvaJcbiAgICAgKi9cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdHJlZURhdGEuY2xlYXIoKTtcbiAgICAgICAgdm0ucmVmcmVzaCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yi35paw5qCR5b2iXG4gICAgICovXG4gICAgYXN5bmMgcmVmcmVzaCgpIHtcbiAgICAgICAgaWYgKGlzUmVmcmVzaGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaXNSZWZyZXNoaW5nID0gdHJ1ZTtcblxuICAgICAgICAvLyDlu7bov58gMjAwIG1zIOWIt+aWsO+8jOW7tui/n+acn+mXtOWPr+S7peWQiOW5tuWkmuasoSBjaGFuZ2VkIOS6p+eUn+eahOWIt+aWsOaMh+S7pO+8jOe8k+ino+aAp+iDvemXrumimFxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gc2V0VGltZW91dChyLCAyMDApKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEucmVzZXQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaXNSZWZyZXNoaW5nID0gZmFsc2U7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlhajpg6jpgInkuK1cbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBzZWxlY3RBbGwodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdub2RlJyk7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHRyZWVEYXRhLmRpc3BsYXlBcnJheSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkID0gdXVpZCB8fCB2bS5nZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXSB8fCB1dWlkOyAvLyBwYXJlbnRVdWlkIOS4uuepuuaYr+agueiKgueCue+8jOi9rOS4uuiHqui6qyB1dWlkXG4gICAgICAgIGNvbnN0IHNpYmxpbmdVdWlkcyA9IHV0aWxzLmdldENoaWxkcmVuVXVpZHMocGFyZW50VXVpZCk7XG5cbiAgICAgICAgY29uc3QgY3VycmVudFNlbGVjdHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgY29uc3QgaXNJbmNsdWRlZCA9IGN1cnJlbnRTZWxlY3RzLmluY2x1ZGVzKHV1aWQpO1xuXG4gICAgICAgIGxldCBzaWJsaW5nc0FsbEluID0gdHJ1ZTtcbiAgICAgICAgc2libGluZ1V1aWRzLmZvckVhY2goKHNpYmxpbmdVdWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHNpYmxpbmdVdWlkKSkge1xuICAgICAgICAgICAgICAgIHNpYmxpbmdzQWxsSW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNpYmxpbmdzQWxsSW4pIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgcGFyZW50VXVpZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaXNJbmNsdWRlZCkge1xuICAgICAgICAgICAgICAgIC8vIOWIoOmZpOi2hei/h+iMg+WbtOeahOW3sumAieS4reiKgueCuVxuICAgICAgICAgICAgICAgIGN1cnJlbnRTZWxlY3RzLmZvckVhY2goKHNlbGVjdDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2libGluZ1V1aWRzLmluY2x1ZGVzKHNlbGVjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ25vZGUnLCBzZWxlY3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHNpYmxpbmdVdWlkcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcblxuICAgICAgICAgICAgICAgIGlmICghdXRpbHMuaXNQYXJlbnQodXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBzaWJsaW5nVXVpZHMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bdXVpZF0uc2xpY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBjaGlsZHJlbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzZWxlY3RDbGVhcigpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5re75Yqg6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWRzIHN0cmluZyB8IHN0cmluZ1tdXG4gICAgICovXG4gICAgc2VsZWN0ZWQodXVpZHM6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1dWlkcykpIHtcbiAgICAgICAgICAgIHV1aWRzID0gW3V1aWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKCFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaCh1dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gdXVpZDtcblxuICAgICAgICAgICAgICAgIC8vIOajgOafpSBzaGlmdCDlpJrpgInnmoTliqjkvZxcbiAgICAgICAgICAgICAgICBpZiAodXVpZCA9PT0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uc2hpZnRVcERvd25NZXJnZVNlbGVjdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2bS5maWx0ZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWPlua2iOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIHVuc2VsZWN0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh2bS5pbnRvVmlld0J5VXNlciA9PT0gdXVpZCkge1xuICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YodXVpZCk7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICB2bS5maWx0ZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaBouWkjemAieS4reeKtuaAgVxuICAgICAqL1xuICAgIHJlc2VsZWN0ZWQoKSB7XG4gICAgICAgIGNvbnN0IHV1aWRzID0gRWRpdG9yLlNlbGVjdGlvbi5nZXRTZWxlY3RlZCgnbm9kZScpLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiAhIXRyZWVEYXRhLnV1aWRUb05vZGVbdXVpZF0pO1xuICAgICAgICBpZiAoIXV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZtLnNlbGVjdGVkKHV1aWRzKTtcblxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHNlbGVjdGVkVGltZUlkKTtcbiAgICAgICAgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVVzZXIpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogc2hpZnQgKyBjbGljayDlpJrpgIlcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBzaGlmdENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCB7IGRpc3BsYXlBcnJheSB9ID0gdHJlZURhdGE7XG5cbiAgICAgICAgY29uc3QgZmlyc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXSk7XG4gICAgICAgIGNvbnN0IGxhc3RJbmRleCA9IGRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChmaXJzdEluZGV4ICE9PSAtMSB8fCBsYXN0SW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3RJbmRleCA8PSBsYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA8PSBsYXN0SW5kZXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBmaXJzdEluZGV4OyBpID49IGxhc3RJbmRleDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdHMucHVzaChkaXNwbGF5QXJyYXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmlwY1NlbGVjdChzZWxlY3RzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGN0cmwgKyBjbGljayDpgInkuK3miJblj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBjdHJsQ2xpY2sodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ25vZGUnLCB1dWlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgdXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmHjeaWsOmAieS4reiKgueCuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGlwY1NlbGVjdCh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuXG4gICAgICAgICAgICBjb25zdCBvbGRTZWxlY3RlZCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NlbGVjdGVkID0gbmV3IFNldCgpO1xuXG4gICAgICAgICAgICAvLyDpnIDopoHlhYjmiafooYzkuIDmrKHpgY3ljobvvIzloavlhYUgc2V0IOS+m+WQjumdouS9v+eUqFxuICAgICAgICAgICAgdXVpZC5mb3JFYWNoKChpZDogc3RyaW5nKSA9PiBuZXdTZWxlY3RlZC5hZGQoaWQpKTtcblxuICAgICAgICAgICAgY29uc3QgbmVlZFVuU2VsZWN0OiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmZvckVhY2goKGlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBvbGRTZWxlY3RlZC5hZGQoaWQpO1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOaWsOeahOWIl+ihqOayoeacieivpWlk77yM6ZyA6KaB5Y+W5raIXG4gICAgICAgICAgICAgICAgaWYgKCFuZXdTZWxlY3RlZC5oYXMoaWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRVblNlbGVjdC5wdXNoKGlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5lZWRVblNlbGVjdC5sZW5ndGggJiYgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIG5lZWRVblNlbGVjdCk7XG4gICAgICAgXG4gICAgICAgICAgICBjb25zdCBuZWVkU2VsZWN0OiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgdXVpZC5mb3JFYWNoKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAvLyDlpoLmnpzml6fnmoTliJfooajmsqHmnInor6VpZO+8jOmcgOimgemAieS4rVxuICAgICAgICAgICAgICAgIGlmICghb2xkU2VsZWN0ZWQuaGFzKGlkKSkge1xuICAgICAgICAgICAgICAgICAgICBuZWVkU2VsZWN0LnB1c2goaWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAobmVlZFNlbGVjdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnInmlrDlop7nmoTpgInkuK0g5bCx6YCJ5Lit5paw5aKe55qEXG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBuZWVkU2VsZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodXVpZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmsqHmnInvvIzliJnor7TmmI7lkI7mnaXnmoTpgInkuK3mmK/kuYvliY3lsLHmnInnmoTvvIzkuLrkuoborqnlhbbku5bpnaLmnb/nm5HlkKzliLAgc2VsZWN0XG4gICAgICAgICAgICAgICAgLy8g6L+Z6L656L+Y5piv6ZyA6KaB5Y+R6YCB5LiA5qyhXG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgdXVpZCk7XG4gICAgICAgIH1cbiAgICAgICBcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reagkeW9ouS4iueahOesrOS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGlwY1NlbGVjdEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICAgICAgY29uc3QgdXVpZCA9IHRoaXMuZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB1dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog56m655m95aSE54K55Ye777yM5Y+W5raI6YCJ5LitXG4gICAgICovXG4gICAgY2xpY2soKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIm+W7uuiKgueCueWJjeWQjeensOS6i+WJjeWkhOeQhlxuICAgICAqIEBwYXJhbSBqc29uIEFkZE5vZGVcbiAgICAgKi9cbiAgICBhc3luYyBhZGRUbyhqc29uOiBBZGROb2RlKSB7XG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFqc29uLnBhcmVudCkge1xuICAgICAgICAgICAganNvbi5wYXJlbnQgPSB0aGlzLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnQ6IFRyZWVOb2RlIHwgbnVsbCA9IGF3YWl0IHV0aWxzLmdldFBhcmVudFdoZW5BZGROb2RlKGpzb24pO1xuXG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bS50b2dnbGUoanNvbi5wYXJlbnQsIHRydWUpO1xuICAgICAgICBqc29uLnBhcmVudCA9IHBhcmVudC51dWlkO1xuXG4gICAgICAgIC8vIOiuvue9ruaYvuekuuS9jee9rueahOebruagh+iKgueCuVxuICAgICAgICBqc29uLnNpYmxpbmcgPSB1dGlscy5nZXRMYXN0RXhwYW5kQ2hpbGRVdWlkKHBhcmVudC51dWlkKTtcbiAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcoanNvbi5zaWJsaW5nKTtcblxuICAgICAgICBqc29uLm5hbWUgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KHBhbmVsRGF0YS5hY3QubWVzc2FnZVByb3RvY29sLnNjZW5lLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLW5hbWUnLCBqc29uLm5hbWUsIGpzb24ucGFyZW50KTtcbiAgICAgICAganNvbi5uYW1lSW5jcmVhc2UgPSBmYWxzZTtcblxuICAgICAgICB2bS5hZGROb2RlID0ganNvbjtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaWsOWinuiKgueCue+8jOS6i+WJjemHjeWRveWQjeWQjuaOpeaUtuaVsOaNrlxuICAgICAqIEBwYXJhbSBqc29uIEFkZE5vZGVcbiAgICAgKi9cbiAgICBhZGRDb25maXJtKGpzb24/OiBBZGROb2RlKSB7XG4gICAgICAgIC8vIOaWsOWinueahOi+k+WFpeahhua2iOWksVxuICAgICAgICB2bS5hZGROb2RlLnNpYmxpbmcgPSAnJztcblxuICAgICAgICAvLyDmlbDmja7plJnor6/ml7blj5bmtohcbiAgICAgICAgaWYgKCFqc29uIHx8ICFqc29uLnBhcmVudCkge1xuICAgICAgICAgICAgdm0uYWRkRW5kKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5nZXROb2RlKGpzb24ucGFyZW50KTtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHZtLmFkZEVuZCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmNhbk5vdENyZWF0ZU5vZGUocGFyZW50KSkge1xuICAgICAgICAgICAgLy8g54i257qn5LiN5Y+v5Yib5bu66IqC54K5XG4gICAgICAgICAgICB2bS5hZGRFbmQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmFkZChqc29uKTtcbiAgICB9LFxuICAgIGFkZEVuZCgpIHtcbiAgICAgICAgLy8gbG9hZGluZyDmlYjmnpzmtojlpLFcbiAgICAgICAgdm0uYWRkTm9kZS5wYXJlbnQgPSAnJztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGlwYyDlj5HotbfliJvlu7roioLngrlcbiAgICAgKiBAcGFyYW0ganNvbiBBZGROb2RlXG4gICAgICovXG4gICAgYXN5bmMgYWRkKGpzb246IEFkZE5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIGNvbnN0IHVuZG9JRCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdiZWdpbi1yZWNvcmRpbmcnLCBqc29uLnBhcmVudCk7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KHBhbmVsRGF0YS5hY3QubWVzc2FnZVByb3RvY29sLnNjZW5lLCAnY3JlYXRlLW5vZGUnLCBqc29uKTtcbiAgICAgICAgICAgIC8vIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdlbmQtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHZtLmFkZEVuZCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnlt7Lmt7vliqDliLDlnLrmma9cbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhZGRlZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdm0ucmVmcmVzaCgpO1xuICAgICAgICBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZXMucHVzaCh7IHV1aWQsIGFuaW1hdGlvbjogJ3NocmluaycgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmm7TmlrDmoJHlvaLoioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBjaGFuZ2VkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICB2bS5yZWZyZXNoKCk7XG5cbiAgICAgICAgLy8g5qC56IqC54K55aSq6aKR57mB5LqG77yM5LiN6KaB6Zeq54OBXG4gICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUgfHwgbm9kZS5pc1NjZW5lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIoOmZpFxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgLy8g5aaC5p6c6K+l6IqC54K55rKh5pyJ6KKr6YCJ5Lit77yM5YiZ5Y+q5piv5Yig6Zmk5q2k5Y2V5LiqXG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWFgeiuuOWIoOmZpFxuICAgICAgICAgICAgaWYgKCF1dGlscy5jYW5Ob3REZWxldGVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZGVsZXRlTm9kZSh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWmguaenOivpeiKgueCueaYr+iiq+mAieS4reS6hu+8jOihqOaYjuimgeWIoOmZpOaJgOaciemAieS4remhuVxuICAgICAgICAgICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmZvckVhY2goKHNlbGVjdDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUoc2VsZWN0KTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDliKDpmaTlhYHorrjliKDpmaRcbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzLmNhbk5vdERlbGV0ZU5vZGUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZHMucHVzaChzZWxlY3QpO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRzLnB1c2godHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtzZWxlY3RdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5kZWxldGVOb2RlKHV1aWRzKTtcbiAgICAgICAgfVxuXG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDku47moJHlvaLliKDpmaToioLngrlcbiAgICAgKi9cbiAgICBkZWxldGVkKCkge1xuICAgICAgICB2bS5yZWZyZXNoKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnnmoTmipjlj6DliIfmjaJcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKiBAcGFyYW0gZXhwYW5kIHRydWUgb3IgZmFsc2VcbiAgICAgKiBAcGFyYW0gbG9vcCDmmK/lkKblkJHlrZDpm4blvqrnjq9cbiAgICAgKi9cbiAgICB0b2dnbGUodXVpZDogc3RyaW5nLCBleHBhbmQ6IGJvb2xlYW4sIGxvb3A/OiBib29sZWFuKSB7XG4gICAgICAgIGlmIChsb29wKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cmVlRGF0YS50b2dnbGVFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YOo6IqC54K55oqY5Y+g5oiW5bGV5byAXG4gICAgICovXG4gICAgYWxsVG9nZ2xlKCkge1xuICAgICAgICBpZiAoIXRyZWVEYXRhLm5vZGVUcmVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpc0V4cGFuZCA9IHV0aWxzLmlzQWxsRXhwYW5kKCk7XG4gICAgICAgIGNvbnN0IHBhcmVudHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnRVdWlkID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF1dGlscy5pc1BhcmVudChwYXJlbnRVdWlkKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRzLmluY2x1ZGVzKHBhcmVudFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmVlRGF0YS50b2dnbGVFeHBhbmQocGFyZW50VXVpZCwgIWlzRXhwYW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudHMucHVzaChwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnRzLnB1c2godHJlZURhdGEubm9kZVRyZWUudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQocGFyZW50c1tpXSwgIWlzRXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5LiK5LiL5bem5Y+zIOaMiemUrlxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24g5pa55ZCRXG4gICAgICovXG4gICAgdXBEb3duTGVmdFJpZ2h0KGRpcmVjdGlvbjogSURpcmVjdGlvbikge1xuICAgICAgICBjb25zdCBsYXN0ID0gdm0uZ2V0TGFzdFNlbGVjdCgpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGlmICghdXRpbHMuaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW2xhc3RdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChjaGlsZHJlblswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGlmICh1dGlscy5pc0V4cGFuZChsYXN0KSkge1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShsYXN0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2xhc3RdO1xuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChwYXJlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc2libGluZ3MgPSB1dGlscy5nZXRTaWJsaW5nKGxhc3QpO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnQ7XG4gICAgICAgICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3VwJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdkb3duJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzJdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY3VycmVudC51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5oyJ5L2PIHNoaWZ0IOmUru+8jOWQjOaXtuS4iuS4i+mAieaLqVxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24g5pa55ZCRXG4gICAgICovXG4gICAgYXN5bmMgc2hpZnRVcERvd24oZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBbbGFzdCwgbGFzdFByZXYsIGxhc3ROZXh0XSA9IHV0aWxzLmdldFNpYmxpbmcocGFuZWxEYXRhLmFjdC5zZWxlY3RzW2xlbmd0aCAtIDFdKTtcbiAgICAgICAgY29uc3QgaGFzTGFzdFByZXYgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMobGFzdFByZXYudXVpZCk7XG4gICAgICAgIGNvbnN0IGhhc0xhc3ROZXh0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGxhc3ROZXh0LnV1aWQpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd1cCcpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdFByZXYpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIGxhc3RQcmV2LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0UHJldi51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIGxhc3QudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihsYXN0UHJldi51dWlkKSwgMSk7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChsYXN0UHJldi51dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdkb3duJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0TmV4dCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgbGFzdE5leHQudXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9IGxhc3ROZXh0LnV1aWQ7XG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNMYXN0UHJldikge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgbGFzdC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcobGFzdE5leHQudXVpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdE5leHQudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdE5leHQudXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQiOW5tiBzaGlmdCDlpJrpgInov4fnqIvkuK3liY3lkI7nmoTlt7LpgInkuK3poblcbiAgICAgKiDmr5TlpoIgYWIgY2RlIOmhueS4rSBhLCBjZGUg5bey6YCJ5LitLCBiIOacqumAieS4rVxuICAgICAqIOW9k+mAieS4rSBiIOaXtu+8jOWQiOW5tumAieS4remhuSBjZGUg77yM5bm25bCG5pyr5bC+6YCJ5Lit6aG555qE5oyH6ZKI5oyH5ZCRIGVcbiAgICAgKi9cbiAgICBzaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKSB7XG4gICAgICAgIGlmICghdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBrZWVwRmluZE5leHQgPSB0cnVlO1xuICAgICAgICBsZXQgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZDtcblxuICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9ICcnOyAvLyDph43nva5cbiAgICAgICAgbGV0IG1heExvb3BOdW1iZXIgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoa2VlcEZpbmROZXh0KSB7XG4gICAgICAgICAgICBjb25zdCBhcnIgPSB1dGlscy5nZXRTaWJsaW5nKGZpbmRVdWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhcnIgfHwgIWFyclsxXSB8fCAhYXJyWzJdIHx8ICFtYXhMb29wTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaW5kVXVpZCA9IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPT09ICdkb3duJyA/IGFyclsyXS51dWlkIDogYXJyWzFdLnV1aWQ7XG4gICAgICAgICAgICBtYXhMb29wTnVtYmVyLS07XG5cbiAgICAgICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMoZmluZFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihmaW5kVXVpZCksIDEpO1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGZpbmRVdWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAga2VlcEZpbmROZXh0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOenu+WKqOiKgueCuVxuICAgICAqIEBwYXJhbSBjb21tYW5kIC0g5oyH5a6aXG4gICAgICogdXAgLSDlkJHkuIrnp7vliqhcbiAgICAgKiBkb3duIC0g5ZCR5LiL56e75YqoXG4gICAgICogdG9wIC0g572u6aG277yI5Y+q5Zyo57uE5YaF55qE5pyA6aG26YOo77yJXG4gICAgICogYm90dG9tIC0g572u5bqV77yI5Y+q5Zyo57uE5YaF55qE5pyA5bqV6YOo77yJXG4gICAgICovXG4gICAgYXN5bmMgbW92ZU5vZGUoY29tbWFuZDogVE1vdmVOb2RlQ29tbWFuZCkge1xuICAgICAgICBpZiAobG9ja01vdmVOb2RlKSByZXR1cm47XG4gICAgICAgIGxvY2tNb3ZlTm9kZSA9IHRydWU7XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0TW92ZU5vZGVJbmZvKHNlbGVjdE5vZGVVdWlkOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbc2VsZWN0Tm9kZVV1aWRdO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50Q2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltwYXJlbnRdIHx8IFtdO1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwYXJlbnRDaGlsZHJlbi5maW5kSW5kZXgoKHV1aWQ6IGFueSkgPT4gdXVpZCA9PT0gc2VsZWN0Tm9kZVV1aWQpIHx8IDA7XG4gICAgICAgICAgICByZXR1cm4geyBub2RlOiBzZWxlY3ROb2RlVXVpZCwgcGFyZW50OiBwYXJlbnQsIHBhcmVudENoaWxkcmVuLCBpbmRleCB9IGFzIElNb3ZlTm9kZUluZm87XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzYW1lR3JvdXA6IFJlY29yZDxzdHJpbmcsIElNb3ZlTm9kZUluZm9bXT4gPSB7fTsvLyDpgJrov4fkuIDkuKogcGFyZW50IOeahOiKgueCuVxuICAgICAgICBjb25zdCBmaXJzdE5vZGU6IElNb3ZlTm9kZUluZm8gPSBnZXRNb3ZlTm9kZUluZm8ocGFuZWxEYXRhLmFjdC5zZWxlY3RzWzBdKTtcbiAgICAgICAgc2FtZUdyb3VwW2ZpcnN0Tm9kZS5wYXJlbnRdID0gW2ZpcnN0Tm9kZV07XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gZ2V0TW92ZU5vZGVJbmZvKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tpXSk7XG4gICAgICAgICAgICBpZiAoIXNhbWVHcm91cFtpbmZvLnBhcmVudF0pIHtcbiAgICAgICAgICAgICAgICBzYW1lR3JvdXBbaW5mby5wYXJlbnRdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlyc3ROb2RlLnBhcmVudCA9PT0gaW5mby5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNhbWVHcm91cFtpbmZvLnBhcmVudF0uZmluZCgoaXRlbSkgPT4gaXRlbS5ub2RlID09PSBmaXJzdE5vZGUubm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2FtZUdyb3VwW2luZm8ucGFyZW50XS5wdXNoKGZpcnN0Tm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghc2FtZUdyb3VwW2luZm8ucGFyZW50XS5maW5kKChpdGVtKSA9PiBpdGVtLm5vZGUgPT09IGluZm8ubm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2FtZUdyb3VwW2luZm8ucGFyZW50XS5wdXNoKGluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2FtZUdyb3VwW2luZm8ucGFyZW50XS5wdXNoKGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBzbmFwc2hvdCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBzYW1lR3JvdXApIHtcbiAgICAgICAgICAgIGNvbnN0IGdyb3VwOiBJTW92ZU5vZGVJbmZvW10gPSBzYW1lR3JvdXBba2V5XTtcbiAgICAgICAgICAgIGdyb3VwLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAvLyDku47lsI/liLDlpKfmjpLluo9cbiAgICAgICAgICAgICAgICBpZiAoYS5pbmRleCA+IGIuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhLmluZGV4IDwgYi5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyDlkIjlubbov57nu63nmoQgaW5kZXgg5Li65LiA57uEXG4gICAgICAgICAgICBjb25zdCBtZXJnZUluZGV4TGlzdCA9IFtdO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRHcm91cCA9IFtncm91cFswXV07XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGdyb3VwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwW2ldLmluZGV4ID09PSBncm91cFtpIC0gMV0uaW5kZXggKyAxKSB7IC8vIOWmguaenOW9k+WJjeaVsOWtl+S4juWJjeS4gOS4quaVsOWtl+i/nue7re+8jOWImeWKoOWFpeW9k+WJjee7hOS4rVxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50R3JvdXAucHVzaChncm91cFtpXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8g5ZCm5YiZ5bCG5b2T5YmN57uE5Yqg5YWl57uT5p6c5pWw57uE5Lit77yM5bm25byA5ZCv5LiA5Liq5paw55qE57uEXG4gICAgICAgICAgICAgICAgICAgIG1lcmdlSW5kZXhMaXN0LnB1c2goY3VycmVudEdyb3VwKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEdyb3VwID0gW2dyb3VwW2ldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXJnZUluZGV4TGlzdC5wdXNoKGN1cnJlbnRHcm91cCk7XG4gICAgICAgICAgICBpZiAoY29tbWFuZCA9PT0gJ2Rvd24nIHx8IGNvbW1hbmQgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICAgICAgbWVyZ2VJbmRleExpc3Quc29ydCgoYUdyb3VwLCBiR3JvdXApID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LuO5aSn5Yiw5bCP5o6S5bqPXG4gICAgICAgICAgICAgICAgICAgIGlmIChhR3JvdXBbMF0uaW5kZXggPiBiR3JvdXBbMF0uaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYUdyb3VwWzBdLmluZGV4IDwgYkdyb3VwWzBdLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHN1Ykdyb3VwIG9mIG1lcmdlSW5kZXhMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOaYr+WQkeS4i+aWueWQkeeahOivne+8jOmcgOimgemHjeaWsOaOkuW6j+aKiuWkp+eahOaUvuWIsOesrOS4gOS9jVxuICAgICAgICAgICAgICAgICAgICBzdWJHcm91cC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDku47lpKfliLDlsI/mjpLluo9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLmluZGV4ID4gYi5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhLmluZGV4IDwgYi5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBsYXN0Q291bnQgPSAwOy8vIOS4iuS4gOS4que7hOeahOmVv+W6plxuICAgICAgICAgICAgZm9yIChjb25zdCBzdWJHcm91cCBvZiBtZXJnZUluZGV4TGlzdCkge1xuICAgICAgICAgICAgICAgIGxldCBvZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0Tm9kZSA9IHN1Ykdyb3VwWzBdO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1heENvdW50ID0gZmlyc3ROb2RlLnBhcmVudENoaWxkcmVuLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VwJzovL+WQkeS4iuenu1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0Tm9kZS5pbmRleCAtIDEgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RvcCc6Ly/nva7pobZcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdE5vZGUuaW5kZXggLSAxID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAobGFzdENvdW50IC0gZmlyc3ROb2RlLmluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdkb3duJzovL+WQkeS4i+enu1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0Tm9kZS5pbmRleCArIDEgPD0gbWF4Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2JvdHRvbSc6Ly8g572u5bqVXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3ROb2RlLmluZGV4ICsgMSA8PSBtYXhDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IChtYXhDb3VudCAtIChmaXJzdE5vZGUuaW5kZXggKyBsYXN0Q291bnQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsYXN0Q291bnQgPSBzdWJHcm91cC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzbmFwc2hvdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgbW92ZU5vZGVJbmZvIG9mIHN1Ykdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5tb3ZlTm9kZShtb3ZlTm9kZUluZm8ucGFyZW50LCBtb3ZlTm9kZUluZm8uaW5kZXgsIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNuYXBzaG90KSB7XG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKHBhbmVsRGF0YS5hY3QubWVzc2FnZVByb3RvY29sLnNjZW5lLCAnc25hcHNob3QnKTtcbiAgICAgICAgICAgIGlmIChjb21tYW5kID09PSAndG9wJykge1xuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gdGhpcy5nZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IHRoaXMuZ2V0TGFzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGxvY2tNb3ZlTm9kZSA9IGZhbHNlO1xuICAgICAgICB9LCA1MCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rlv6vmjbfplK7nmoQgcmVuYW1lXG4gICAgICovXG4gICAgYXN5bmMga2V5Ym9hcmRSZW5hbWUoKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2bS5yZW5hbWVVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1dWlkID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcblxuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgIGlmIChhc3NldCAmJiAhdXRpbHMuY2FuTm90UmVuYW1lKGFzc2V0KSkge1xuICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgICAgICB2bS5yZW5hbWVVdWlkID0gdXVpZDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K56YeN5ZCN5ZG9XG4gICAgICog6L+Z5piv5byC5q2l55qE77yM5Y+q5YGa5Y+R6YCBXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIG5hbWUg5LiN6YeN5ZG95ZCN5pe25LygIG5hbWUgPSBudWxsXG4gICAgICovXG4gICAgYXN5bmMgcmVuYW1lKHV1aWQ6IHN0cmluZywgbmFtZTogc3RyaW5nIHwgbnVsbCkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmuIXnqbogcmVuYW1lIOeahOiKgueCuVxuICAgICAgICB2bS5yZW5hbWVVdWlkID0gJyc7XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgIGlmICghbm9kZSB8fCB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5LiN6YeN5ZG95ZCN55qE5oOF5Ya1OlxuICAgICAgICAgKiBuYW1lID0gbnVsbFxuICAgICAgICAgKiDplIHlrppcbiAgICAgICAgICog5ZKM5YmN5YC85LiA5qC3XG4gICAgICAgICAqL1xuICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCB1dGlscy5jYW5Ob3RSZW5hbWUobm9kZSkgfHwgbmFtZSA9PT0gbm9kZS5uYW1lKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG5cbiAgICAgICAgLy8g5L+d5a2Y5Y6G5Y+y6K6w5b2VXG4gICAgICAgIGNvbnN0IHVuZG9JRCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdiZWdpbi1yZWNvcmRpbmcnLCB1dWlkLCB7IGF1dG86IGZhbHNlIH0pO1xuICAgICAgICAvLyDlj5HpgIHph43lkI3lkb3mlbDmja5cbiAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChwYW5lbERhdGEuYWN0Lm1lc3NhZ2VQcm90b2NvbC5zY2VuZSwgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgIHV1aWQ6IHV1aWQsXG4gICAgICAgICAgICBwYXRoOiAnbmFtZScsXG4gICAgICAgICAgICBkdW1wOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5hbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdjYW5jZWwtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgICAgIHZtLmRpYWxvZ0Vycm9yKCdyZW5hbWVGYWlsJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KHBhbmVsRGF0YS5hY3QubWVzc2FnZVByb3RvY29sLnNjZW5lLCAnZW5kLXJlY29yZGluZycsIHVuZG9JRCk7XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5omn6KGM5pCc57SiXG4gICAgICovXG4gICAgYXN5bmMgc2VhcmNoKCkge1xuICAgICAgICAvLyDmkJzntKLmnInlj5jliqjpg73lhYjmu5rlm57pobbpg6hcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC52aWV3Qm94LnNjcm9sbFRvKDAsIDApO1xuXG4gICAgICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVHlwZSA9PT0gJ2Fzc2V0Jykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLmZpbmROb2Rlc1VzZUFzc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVHlwZSA9PT0gJ21pc3NBc3NldCcpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5maW5kTm9kZXNNaXNzQXNzZXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ouW5Yqo5Lit5oSf55+l5b2T5YmN5omA5aSE6IqC54K55L2N572uXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIHBvc2l0aW9uIOS9jee9ru+8mmJlZm9yZe+8jGluc2lkZe+8jGFmdGVyXG4gICAgICovXG4gICAgZHJhZ092ZXIodXVpZDogc3RyaW5nLCBwb3NpdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uSWQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHV1aWQgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgdXVpZCA9IHZtLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRyYWcg5oKs5YGc5LiA5q615pe26Ze05ZCO6Ieq5Yqo5bGV5byA6IqC54K5XG4gICAgICAgICAgICBjb25zdCBub3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChkcmFnT3ZlclV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclV1aWQgPSB1dWlkO1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVGltZSA9IG5vd1RpbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub3dUaW1lIC0gZHJhZ092ZXJUaW1lID4gODAwICYmICF0cmVlRGF0YS51dWlkVG9FeHBhbmRbbm9kZS51dWlkXSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT09ICdpbnNpZGUnKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShub2RlLnV1aWQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG9wICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IG5vZGVIZWlnaHQsIGljb25XaWR0aCwgcGFkZGluZyB9ID0gcGFuZWxEYXRhLmNvbmZpZztcbiAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50SGVpZ2h0LCBvZmZzZXRIZWlnaHQsIHNjcm9sbFRvcCwgc2Nyb2xsSGVpZ2h0IH0gPSBwYW5lbERhdGEuJC52aWV3Qm94O1xuXG4gICAgICAgICAgICBjb25zdCBpc0F0Qm90dG9tID0gc2Nyb2xsVG9wICYmIGNsaWVudEhlaWdodCArIHNjcm9sbFRvcCA9PT0gc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICAgICAgICBjb25zdCB2aWV3UmVjdCA9IHBhbmVsRGF0YS4kLnZpZXdCb3guZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBjb25zdCB0cmVlUmVjdCA9IHZtLiRlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdFRvcCA9IHZpZXdSZWN0LnRvcCAtIHRyZWVSZWN0LnRvcDtcblxuICAgICAgICAgICAgY29uc3QgYWRqdXN0U2Nyb2xsVG9wID0gdm0uc2Nyb2xsVG9wICUgbm9kZUhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbGJhckhlaWdodCA9IG9mZnNldEhlaWdodCAtIGNsaWVudEhlaWdodDtcblxuICAgICAgICAgICAgY29uc3QgZGVwdGhMZWZ0ID0gbm9kZS5kZXB0aCAqIGljb25XaWR0aDtcbiAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlUb3AgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKSAqIG5vZGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGxldCB0b3AgPSBkaXNwbGF5VG9wIC0gYWRqdXN0VG9wICsgYWRqdXN0U2Nyb2xsVG9wICsgcGFkZGluZztcbiAgICAgICAgICAgIGxldCBhZGp1c3RWZXJ0aWNhbEhlaWdodCA9IC0xMztcblxuICAgICAgICAgICAgaWYgKGlzQXRCb3R0b20pIHtcbiAgICAgICAgICAgICAgICBhZGp1c3RWZXJ0aWNhbEhlaWdodCAtPSAyO1xuICAgICAgICAgICAgICAgIHRvcCArPSBzY3JvbGxiYXJIZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBoZWlnaHQgPSBub2RlSGVpZ2h0O1xuICAgICAgICAgICAgbGV0IHpJbmRleCA9IDA7XG4gICAgICAgICAgICBjb25zdCBhZGp1c3RMZWZ0ID0gLTM7XG5cbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdm0uJGVsLm9mZnNldFdpZHRoIC0gZGVwdGhMZWZ0IC0gYWRqdXN0TGVmdDtcbiAgICAgICAgICAgIGNvbnN0IGxlZnQgPSBkZXB0aExlZnQgKyBhZGp1c3RMZWZ0O1xuICAgICAgICAgICAgY29uc3QgcGFyZW50VG9wID0gdHJlZURhdGEuZGlzcGxheUFycmF5LmluZGV4T2YodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXSkgKiBub2RlSGVpZ2h0O1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gMjtcbiAgICAgICAgICAgICAgICAgICAgekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gMjtcbiAgICAgICAgICAgICAgICAgICAgekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIHRvcCA9ICh0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih1dGlscy5nZXRMYXN0RXhwYW5kQ2hpbGRVdWlkKHV1aWQpKSArIDEpICogbm9kZUhlaWdodCArIHBhZGRpbmc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9wID0gTWF0aC5taW4oc2Nyb2xsSGVpZ2h0IC0gaGVpZ2h0LCB0b3ApO1xuXG4gICAgICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSAmJiBbJ2JlZm9yZScsICdhZnRlciddLmluY2x1ZGVzKHBvc2l0aW9uKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveCA9IHtcbiAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICB0b3A6IHRvcCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIGxlZnQ6IGxlZnQgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgICAgICAgIHZlcnRpY2FsOiB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogdG9wIC0gcGFyZW50VG9wICsgYWRqdXN0VmVydGljYWxIZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/m+WFpSB0cmVlIOWuueWZqFxuICAgICAqL1xuICAgIGRyYWdFbnRlcigpIHtcbiAgICAgICAgLy8g5pCc57Si5qih5byP5LiL77yM5LiN6K+G5Yir5Li65ouW5YWlIHRyZWUg5a655ZmoXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5kcm9wQm94LnN0eWxlID0ge1xuICAgICAgICAgICAgICAgIHRvcDogJy0ycHgnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uSWQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgdm0uZHJhZ092ZXIoJycsICdhZnRlcicpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGRyb3Ag5Yiw6Z2i5p2/56m655m95Yy65Z+f6YeMXG4gICAgICogQHBhcmFtIGV2ZW50IOm8oOagh+S6i+S7tlxuICAgICAqL1xuICAgIGRyb3AoZXZlbnQ6IERyYWdFdmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgJiYgIWV2ZW50LnRhcmdldC5oYXNBdHRyaWJ1dGUoJ2hvdmluZycpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShFZGl0b3IuVUkuX19wcm90ZWN0ZWRfXy5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICAvLyBjYy5TY2VuZSDmoLnoioLngrlcbiAgICAgICAgZGF0YS50byA9IHV0aWxzLmdldExhc3RDaGlsZFV1aWQodHJlZURhdGEubm9kZVRyZWU/LnV1aWQpO1xuICAgICAgICBkYXRhLmluc2VydCA9ICdhZnRlcic7XG4gICAgICAgIGRhdGEuY29weSA9IGV2ZW50LmN0cmxLZXk7XG4gICAgICAgIGRhdGEua2VlcFdvcmxkVHJhbnNmb3JtID0gIWV2ZW50LnNoaWZ0S2V5O1xuICAgICAgICB2bS5pcGNEcm9wKGRhdGEpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K55ouW5YqoXG4gICAgICogQHBhcmFtIGpzb24gRHJhZ05vZGVcbiAgICAgKi9cbiAgICBhc3luYyBpcGNEcm9wKGpzb246IERyYWdOb2RlKSB7XG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmZvY3VzV2luZG93KCk7XG5cbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1dWlkczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgdmFsdWVzOiBhbnlbXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHsgdmFsdWUsIHR5cGUsIG5hbWUsIGluc2VydCB9ID0ganNvbjtcbiAgICAgICAgbGV0IHsgYWRkaXRpb25hbCB9ID0ganNvbjtcblxuICAgICAgICBpZiAoaW5zZXJ0ID09PSAnaW5zaWRlJyl7XG4gICAgICAgICAgICB2bS50b2dnbGUoanNvbi50bywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChhZGRpdGlvbmFsKSB7XG4gICAgICAgICAgICAvLyDlop7liqDkuIDlpITlrrnplJlcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWwgPSBbYWRkaXRpb25hbF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog55Sx5LqO5omA5pyJ55qE5a2Q6LWE5rqQ5Lmf5ZyoIGV2ZW50LnZhbHVlcyDmlbDmja7ph4xcbiAgICAgICAgICAgICAqIOaXoOazleWMuuWIhuWkmumAieWtkOi1hOa6kOeahOaDheWGtVxuICAgICAgICAgICAgICog57qm5a6a5a+56K+G5Yir5Yiw5pyJIGNjLlByZWZhYiDov5nnp43lrZDotYTmupDvvIzkvr/lr7nlhbbniLbnuqfkuIvlhbbku5botYTmupDov5vooYzov4fmu6TvvIzor6Xlrp7kvZPniLbotYTmupDlj6rlj5YgY2MuUHJlZmFiIOWtkOi1hOa6kFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICAvLyDpnIDopoHov4fmu6Tmjonlhbbku5blrZDotYTmupDnmoTniLbotYTmupAgdXVpZFxuICAgICAgICAgICAgY29uc3QgZXhjbHVkZVN1YkFzc2V0czogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcbiAgICAgICAgICAgIGNvbnN0IGV4Y2x1ZGVPdGhlcnMgPSBbJ2NjLlByZWZhYicsICdjYy5MYWJlbEF0bGFzJ107XG4gICAgICAgICAgICBhZGRpdGlvbmFsLmZvckVhY2goKGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh2bS5kcm9wcGFibGVUeXBlcy5pbmNsdWRlcyhpbmZvLnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFthc3NldFV1aWQsIHN1YkFzc2V0VXVpZF0gPSBpbmZvLnZhbHVlLnNwbGl0KCdAJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleGNsdWRlT3RoZXJzLmluY2x1ZGVzKGluZm8udHlwZSkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhjbHVkZVN1YkFzc2V0c1thc3NldFV1aWRdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChleGNsdWRlU3ViQXNzZXRzW2Fzc2V0VXVpZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHV1aWRzLnB1c2goaW5mby52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKGluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKCF2bS5kcm9wcGFibGVUeXBlcy5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlICYmICF1dWlkcy5pbmNsdWRlcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHV1aWRzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgdmFsdWVzLnB1c2goeyB0eXBlLCB2YWx1ZSwgbmFtZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbHVlcyDmnInov4fmu6TkuoYgYWRkaXRpb25hbCDoioLngrnnu4Tku7bmlbDmja7vvIzph43nva7nu5kgYWRkaXRpb25hbFxuICAgICAgICBqc29uLmFkZGl0aW9uYWwgPSB2YWx1ZXM7XG5cbiAgICAgICAgaWYgKGpzb24udHlwZSA9PT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgICAgICBpZiAoIXV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGpzb24uY29weSkge1xuICAgICAgICAgICAgICAgIC8vIOaMieS9j+S6hiBjdHJsIOmUru+8jOaLluWKqOWkjeWItlxuICAgICAgICAgICAgICAgIGF3YWl0IHZtLmNvcHkodXVpZHMpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHZtLnBhc3RlKGpzb24udG8sIGpzb24ua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZtLm1vdmUoanNvbik7XG4gICAgICAgIH0gZWxzZSBpZiAocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzICYmIHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcy5pbmNsdWRlcyhqc29uLnR5cGUpKSB7XG4gICAgICAgICAgICAvLyDor6XnsbvlnovnmoTkuovku7bmnInlpJbpg6jms6jlhoznmoTliqjkvZzvvIzovaznlLHlpJbpg6jms6jlhozkuovku7bmjqXnrqFcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IE9iamVjdC52YWx1ZXMocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLmNhbGxiYWNrc1tqc29uLnR5cGVdKSBhcyBGdW5jdGlvbltdO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrcyAmJiBBcnJheS5pc0FycmF5KGNhbGxiYWNrcykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKGpzb24udG8pO1xuICAgICAgICAgICAgICAgIGlmICh0b05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9QYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtqc29uLnRvXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9JbmRleCA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3RvUGFyZW50VXVpZF0uaW5kZXhPZihqc29uLnRvKTtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2s6IEZ1bmN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBEcm9wQ2FsbGJhY2tJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IHRvTm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogdG9QYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB0b0luZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBqc29uLmluc2VydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGluZm8sIGpzb24uYWRkaXRpb25hbCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWwhuiiq+azqOWFpeaVsOaNrueahOWvueixoVxuICAgICAgICAgICAgY29uc3QgdG9Ob2RlID0gdXRpbHMuZ2V0Tm9kZShqc29uLnRvKTtcbiAgICAgICAgICAgIGlmICghdG9Ob2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0b1BhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2pzb24udG9dID8/IHRvTm9kZS51dWlkOy8vIOW9k+WcuuaZr+iKgueCueS4i+aXoOWtkOiKgueCuSDpnIDopoHlrrnplJlcblxuICAgICAgICAgICAgLy8g5ouW5YiwIHByZWZhYiDmoLnoioLngrnnmoTpobbpg6jmlL7nva7vvIzpnIDopoHovazkuLrmlL7nva7lnKjlhoXpg6hcbiAgICAgICAgICAgIGlmICh0b05vZGUuaXNQcmVmYWJSb290ICYmIGpzb24uaW5zZXJ0ICE9PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgICAgIGpzb24uaW5zZXJ0ID0gJ2luc2lkZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOW9k+WIpOaWreS4uuaPkuWFpeafkOS4quiKgueCueaXtu+8jOmcgOimgeWIpOaWreW9k+WJjeiKgueCueaYr+WQpuWcqOmAieS4reWIl+ihqOS4re+8jOWmguaenOWcqFxuICAgICAgICAgICAgLy8g5oiR5Lus5Yaz5a6a5o+S5YWl55qE6KGM5Li65piv5om56YeP5o+S5YWl5omA5pyJ6YCJ5Lit55qE6IqC54K5XG4gICAgICAgICAgICBsZXQgcGFyZW50cyA9IGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJyA/IFtqc29uLnRvXSA6IFt0b1BhcmVudFV1aWRdO1xuICAgICAgICAgICAgaWYgKGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJyAmJiBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMoanNvbi50bykpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRzID0gWy4uLnBhbmVsRGF0YS5hY3Quc2VsZWN0c107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyByZWNvcmRpbmdcbiAgICAgICAgICAgIGNvbnN0IHVuZG9JRCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdiZWdpbi1yZWNvcmRpbmcnLCBwYXJlbnRzKTtcblxuICAgICAgICAgICAgY29uc3QgbmV3VXVpZHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYXNzZXQgb2YgdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwYW5lbERhdGEuY29uZmlnLmNyZWF0YWJsZVR5cGVzLmluY2x1ZGVzKGFzc2V0LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0VXVpZCA9IGFzc2V0LnZhbHVlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGFyZW50IG9mIHBhcmVudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCG6KKr5rOo5YWl5pWw5o2u55qE5a+56LGhXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvTm9kZSA9IHV0aWxzLmdldE5vZGUocGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0b05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdm0uYWRkTm9kZS5wYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3VXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdjcmVhdGUtbm9kZScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiBhc3NldC51bmxpbmtQcmVmYWIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogYXNzZXQuY2FudmFzUmVxdWlyZWQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZtLmFkZE5vZGUucGFyZW50ID0gJyc7XG5cbiAgICAgICAgICAgICAgICAgICAgbmV3VXVpZHMucHVzaChuZXdVdWlkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4iuatpeW3suaWsOWinuWujOavlVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0b0FyciA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3RvUGFyZW50VXVpZF07XG4gICAgICAgICAgICAgICAgY29uc3QgdG9JbmRleCA9IHRvQXJyLmluZGV4T2YoanNvbi50byk7XG5cbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdG9JbmRleCAtIHRvQXJyLmxlbmd0aDsgLy8g55uu5qCH57Si5byV5YeP5Y676Ieq6Lqr57Si5byVXG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA8IDAgJiYganNvbi5pbnNlcnQgPT09ICdhZnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCP5LqOMOeahOWBj+enu+m7mOiupOaYr+aOkuWcqOebruagh+WFg+e0oOS5i+WJje+8jOWmguaenOaYryBhZnRlciDopoEgKzFcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPiAwICYmIGpzb24uaW5zZXJ0ID09PSAnYmVmb3JlJykge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpKfkuo4w55qE5YGP56e76buY6K6k5piv5o6S5Zyo55uu5qCH5YWD57Sg5LmL5ZCO77yM5aaC5p6c5pivIGJlZm9yZSDopoEgLTFcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0IC09IDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5Zyo54i257qn6YeM5bmz56e7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEubW92ZU5vZGUodG9QYXJlbnRVdWlkLCB0b0Fyci5sZW5ndGgsIG9mZnNldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChuZXdVdWlkcy5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdlbmQtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChwYW5lbERhdGEuYWN0Lm1lc3NhZ2VQcm90b2NvbC5zY2VuZSwgJ2NhbmNlbC1yZWNvcmRpbmcnLCB1bmRvSUQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDpgInkuK3mlrDnmoToioLngrlcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdChuZXdVdWlkcyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItlxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGNvcHkodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvcGllcyA9IFtdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgY29waWVzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzID0gY29waWVzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlICYmICF1dGlscy5jYW5Ob3RDb3B5Tm9kZShub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbih2YWxpZFV1aWRzKTtcblxuICAgICAgICBhd2FpdCB0cmVlRGF0YS5jb3B5Tm9kZShjb3BpZWRVdWlkcyk7XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGNvcGllZFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDnspjotLRcbiAgICAgKiBAcGFyYW0gdXVpZCDnm67moIfoioLngrnvvIwgIXBhc3RlQXNDaGlsZCDml7bpu5jorqTnspjotLTliLDnm67moIfoioLngrnlkIznuqdcbiAgICAgKiBAcGFyYW0ga2VlcFdvcmxkVHJhbnNmb3JtIOaYr+WQpuS/neaMgeS4lueVjOWdkOagh1xuICAgICAqIEBwYXJhbSBwYXN0ZUFzQ2hpbGQg5piv5ZCm57KY6LS05Li655uu5qCH6IqC54K555qE5a2Q6IqC54K5XG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcGFzdGUodXVpZDogc3RyaW5nLCBrZWVwV29ybGRUcmFuc2Zvcm0gPSBmYWxzZSwgcGFzdGVBc0NoaWxkPzogYm9vbGVhbikge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHV1aWQgPSB0aGlzLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjlhYjlpITnkIbliarliIfnmoTmg4XlhrVcbiAgICAgICAgY29uc3Qgbm9kZXNJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdub2Rlcy1pbmZvJykgYXMgYW55O1xuICAgICAgICBpZiAobm9kZXNJbmZvICYmIG5vZGVzSW5mby50eXBlID09PSAnY3V0JyAmJiBub2Rlc0luZm8udXVpZHMubGVuZ3RoICYmIEVkaXRvci5Qcm9qZWN0LnBhdGggPT09IG5vZGVzSW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBub2Rlc0luZm8udXVpZHM7XG4gICAgICAgICAgICBjb25zdCB2YWxpZFV1aWRzID0gdXRpbHMuZmlsdGVyQ2hpbGRyZW4oY3V0VXVpZHMpO1xuICAgICAgICAgICAgaWYgKHZhbGlkVXVpZHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1vdmVEYXRhOiBEcmFnTm9kZSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2MuTm9kZScsXG4gICAgICAgICAgICAgICAgdG86IHV1aWQsXG4gICAgICAgICAgICAgICAgaW5zZXJ0OiAnaW5zaWRlJyxcbiAgICAgICAgICAgICAgICBhZGRpdGlvbmFsOiB2YWxpZFV1aWRzLm1hcCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiB1dWlkLCB0eXBlOiAnY2MuTm9kZScgfTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBrZWVwV29ybGRUcmFuc2Zvcm0sXG4gICAgICAgICAgICAgICAgY29weTogZmFsc2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBhd2FpdCB2bS5tb3ZlKG1vdmVEYXRhKTtcblxuICAgICAgICAgICAgLy8g5riF56m65Ymq5YiH5p2/XG4gICAgICAgICAgICBFZGl0b3IuQ2xpcGJvYXJkLmNsZWFyKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlj6rlj6/lnKjpobnnm67lhoXlpI3liLbnspjotLRcbiAgICAgICAgaWYgKG5vZGVzSW5mbyAmJiBub2Rlc0luZm8udHlwZSA9PT0gJ2NvcHknICYmIG5vZGVzSW5mby51dWlkcy5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCA9PT0gbm9kZXNJbmZvLnByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBjb3BpZWRVdWlkcyA9IG5vZGVzSW5mby51dWlkcztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbihjb3BpZWRVdWlkcyk7XG4gICAgICAgICAgICAgICAgLy8g5paw55qE6YCJ5Lit6aG55YiH5o2i5Li65paw6IqC54K5XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEucGFzdGVOb2RlKHV1aWQsIHZhbGlkVXVpZHMsIGtlZXBXb3JsZFRyYW5zZm9ybSwgcGFzdGVBc0NoaWxkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Ymq5YiHXG4gICAgICog5Ymq5YiH5piv6aKE5a6a55qE6KGM5Li677yM5Y+q5pyJ5YaN5omn6KGM57KY6LS05pON5L2c5omN5Lya55Sf5pWIXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgYXN5bmMgY3V0KHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdXRzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBjdXRzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi/h+a7pOS4jeWPr+WJquWIh+eahOiKgueCuVxuICAgICAgICBjb25zdCBjdXRVdWlkcyA9IGN1dHMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUgJiYgIXV0aWxzLmNhbk5vdEN1dE5vZGUobm9kZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjdXRVdWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOe7meWkjeWItueahOWKqOS9nOWPjemmiOaIkOWKn1xuICAgICAgICBjdXRVdWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHV1aWQsICdsaWdodCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDpgJrnn6Ugc2NlbmUg5ZCM5q2l5omn6KGMIGN1dFxuICAgICAgICBhd2FpdCB0cmVlRGF0YS5jdXROb2RlKGN1dFV1aWRzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFi+mahlxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGR1cGxpY2F0ZSh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZHVwbGljYXRlcyA9IFtdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgZHVwbGljYXRlcyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBkdXBsaWNhdGVzID0gW3V1aWRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdXBsaWNhdGVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/lpI3liLbnmoToioLngrlcbiAgICAgICAgY29uc3QgdXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbihkdXBsaWNhdGVzKS5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZSAmJiAhdXRpbHMuY2FuTm90Q29weU5vZGUobm9kZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5Y+v6IO95piv5om56YeP5pON5L2c77yM57uZ5Yqg5Liq6ZSBXG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5kdXBsaWNhdGVOb2RlKHV1aWRzKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOenu+WKqFxuICAgICAqIEBwYXJhbSBqc29uIERyYWdOb2RlXG4gICAgICovXG4gICAgYXN5bmMgbW92ZShqc29uOiBEcmFnTm9kZSkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb24gfHwgIWpzb24udG8gfHwgIUFycmF5LmlzQXJyYXkoanNvbi5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXVpZHMgPSBqc29uLmFkZGl0aW9uYWwubWFwKChpbmZvOiBEcmFnTm9kZUluZm8pID0+IGluZm8udmFsdWUpO1xuXG4gICAgICAgIC8vIOenu+WKqOeahOWFg+e0oOaciemHjeWPoFxuICAgICAgICBpZiAodXVpZHMuaW5jbHVkZXMoanNvbi50bykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwhuiiq+azqOWFpeaVsOaNrueahOWvueixoVxuICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKGpzb24udG8pO1xuICAgICAgICBjb25zdCB0b1BhcmVudCA9IHV0aWxzLmdldFBhcmVudChqc29uLnRvKTtcblxuICAgICAgICBpZiAoIXRvTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvTm9kZS5pc1ByZWZhYlJvb3QgJiYganNvbi5pbnNlcnQgIT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAvLyDkuI3og73np7vliqjliLDlvZPliY3nvJbovpHnmoQgcHJlZmFiIOagueiKgueCueeahOWJjeWQjlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvTm9kZS5pc1NjZW5lICYmIGpzb24uaW5zZXJ0ICE9PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgLy8g5ouW5Yqo5Yiw5Zy65pmv5qC56IqC54K555qE5YmN5ZCO5L2N572u77yM5Lmf55u45b2T5LqO5ouW6L+b6YeM6Z2iXG4gICAgICAgICAgICBqc29uLmluc2VydCA9ICdpbnNpZGUnO1xuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShqc29uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnROb2RlID0gdG9Ob2RlO1xuICAgICAgICBpZiAodG9QYXJlbnQgJiYgWydiZWZvcmUnLCAnYWZ0ZXInXS5pbmNsdWRlcyhqc29uLmluc2VydCkpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUgPSB0b1BhcmVudDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJlbnROb2RlVXVpZCA9IHBhcmVudE5vZGUudXVpZDtcblxuICAgICAgICAvLyDlpJroioLngrnnmoTnp7vliqjvvIzmoLnmja7njrDmnInmjpLluo/nmoTpobrluo/miafooYxcbiAgICAgICAgY29uc3QgZnJvbVV1aWRzOiBzdHJpbmdbXSA9IHV1aWRzXG4gICAgICAgICAgICAubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB0b05vZGUg6IqC54K55pivIGZyb21Ob2RlIOeahOWtkOmbhu+8jOeItuS4jeiDveenu+WIsOWtkOmHjOmdoiwg5Y+W5raI56e75YqoXG4gICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIGpzb24udG8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgZnJvbU5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmcm9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJyAmJiBwYXJlbnROb2RlID09PSBmcm9tUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdXVpZDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS51dWlkVG9JbmRleFthXSAtIHRyZWVEYXRhLnV1aWRUb0luZGV4W2JdO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5peg6IqC54K556e75YqoXG4gICAgICAgIGlmICghZnJvbVV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6ZKI5a+55om56YeP5pON5L2c77yM6ZyA6KaB5YWI5oqK5b6F5pS55Yqo55qE6IqC54K56YO95pS26ZuG6LW35p2l77yM54S25ZCO5YaN5omn6KGMXG4gICAgICAgIGNvbnN0IGNoYW5nZWRQYXJlbnRzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgICAgICBjaGFuZ2VkUGFyZW50c1twYXJlbnROb2RlVXVpZF0gPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IGZyb21VdWlkIG9mIGZyb21VdWlkcykge1xuICAgICAgICAgICAgY29uc3QgZnJvbU5vZGUgPSB1dGlscy5nZXROb2RlKGZyb21VdWlkKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tTm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmcm9tUGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbZnJvbVV1aWRdO1xuXG4gICAgICAgICAgICBpZiAocGFyZW50Tm9kZVV1aWQgIT09IGZyb21QYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlZFBhcmVudHNbZnJvbVBhcmVudFV1aWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVuZG9JRCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdiZWdpbi1yZWNvcmRpbmcnLCBPYmplY3Qua2V5cyhjaGFuZ2VkUGFyZW50cykpO1xuICAgICAgICBcbiAgICAgICAgLy8g5byA5aeL5omn6KGMXG4gICAgICAgIGxldCBhZGp1c3RJbmRleCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgZnJvbVV1aWQgb2YgZnJvbVV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBmcm9tTm9kZSA9IHV0aWxzLmdldE5vZGUoZnJvbVV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gZnJvbVV1aWQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtmcm9tVXVpZF07XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlVXVpZCAhPT0gZnJvbVBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5zZXRQYXJlbnQocGFyZW50Tm9kZVV1aWQsIFtmcm9tVXVpZF0sIGpzb24ua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFbJ2JlZm9yZScsICdhZnRlciddLmluY2x1ZGVzKGpzb24uaW5zZXJ0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnjrDmnIkgYXBpIOS4i++8jOi/meS4gOatpeW+l+afpeivouWunuaXtuS9jee9ru+8jOaJjeWlveWHhuehruenu+WKqOWIsOaWsOS9jee9rlxuICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZUluZm8gPSBhd2FpdCB0cmVlRGF0YS5nZXREdW1wRGF0YShwYXJlbnROb2RlLnV1aWQpO1xuICAgICAgICAgICAgY29uc3QgdG9Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IHRvTm9kZS51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IGZyb21Ob2RlLnV1aWQpO1xuXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdG9Ob2RlSW5kZXggLSBmcm9tTm9kZUluZGV4O1xuXG4gICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdhZnRlcicpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlsI/kuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvliY3vvIzlpoLmnpzmmK8gYWZ0ZXIg6KaBICsxXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gYWRqdXN0SW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChqc29uLmluc2VydCA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpKfkuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvlkI7vvIzlpoLmnpzmmK8gYmVmb3JlIOimgSAtMVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgLT0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLm1vdmVOb2RlKHBhcmVudE5vZGUudXVpZCwgZnJvbU5vZGVJbmRleCwgb2Zmc2V0KTtcblxuICAgICAgICAgICAgYWRqdXN0SW5kZXgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QocGFuZWxEYXRhLmFjdC5tZXNzYWdlUHJvdG9jb2wuc2NlbmUsICdlbmQtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOagkeW9ouaVsOaNruW3suaUueWPmFxuICAgICAqIOWmguiKgueCueWinuWIoOaUue+8jOaYr+i+g+Wkp+eahOWPmOWKqO+8jOmcgOimgemHjeaWsOiuoeeul+WQhOS4qumFjeWll+aVsOaNrlxuICAgICAqL1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgLy8g5a655Zmo55qE5pW05L2T6auY5bqmXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnRyZWVIZWlnaHQgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoICogcGFuZWxEYXRhLmNvbmZpZy5ub2RlSGVpZ2h0ICsgcGFuZWxEYXRhLmNvbmZpZy5wYWRkaW5nICogMjtcblxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5hbGxFeHBhbmQgPSB1dGlscy5pc0FsbEV4cGFuZCgpO1xuXG4gICAgICAgIHdoaWxlIChwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCByZWFkeVR3aW5rbGUgPSBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHJlYWR5VHdpbmtsZS51dWlkLCByZWFkeVR3aW5rbGUuYW5pbWF0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmHjeaWsOa4suafk+WHuuagkeW9olxuICAgICAgICB2bS5maWx0ZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWcqOaVsOaNruS4jeWPmOeahOaDheWGteS4i++8jOagueaNrua7muWKqOS9jee9rua4suafk+agkeW9olxuICAgICAqL1xuICAgIGZpbHRlcigpIHtcbiAgICAgICAgLy8g6Z2i5p2/5ouW5ou95YiwIHRhYiDph4zkuI3kvJrnq4vljbPmmL7npLrvvIzpnIDopoHmiYvliqjliIfmjaIgdGFi77yM5Zyo5YiH5o2i5YmN6Z2i5p2/IGhlaWdodD0wXG4gICAgICAgIC8vIOinhOmBvyBoZWlnaHQ9MCDpnZ7mraPluLjmg4XlhrXkuIvlvoDkuIvmiafooYzplJnor6/orqHnrpfvvIzlnKjliIfmjaIgdGFiIOWQjuS8muaJp+ihjCBzaG93IOi/m+ihjOato+ehrueahOiuoeeul+a4suafk1xuICAgICAgICBpZiAoIXBhbmVsRGF0YS4kLnBhbmVsLnZpZXdIZWlnaHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDlhYjmuIXnqbrvvIzov5nnp43otYvlgLzmnLrliLbmiY3og73liLfmlrAgdnVl77yM6ICMIC5sZW5ndGggPSAwIOS4jeihjFxuICAgICAgICB2bS5ub2RlcyA9IFtdO1xuXG4gICAgICAgIGNvbnN0IG5vZGVIZWlnaHQgPSBwYW5lbERhdGEuY29uZmlnLm5vZGVIZWlnaHQ7XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IHZtLnNjcm9sbFRvcDtcblxuICAgICAgICBjb25zdCB0b3AgPSBzY3JvbGxUb3AgJSBub2RlSGVpZ2h0O1xuICAgICAgICAvLyDnrpflh7rlj6/op4bljLrln5/nmoQgdG9wIOacgOWwj+WAvFxuICAgICAgICBjb25zdCBtaW4gPSBzY3JvbGxUb3AgLSB0b3A7XG4gICAgICAgIC8vIOacgOWkp+WAvFxuICAgICAgICBjb25zdCBtYXggPSBtaW4gKyBwYW5lbERhdGEuJC5wYW5lbC52aWV3SGVpZ2h0O1xuXG4gICAgICAgIHZtLiRlbC5zdHlsZS50b3AgPSBgLSR7dG9wfXB4YDtcblxuICAgICAgICBjb25zdCBzdGFydCA9IE1hdGgucm91bmQobWluIC8gbm9kZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IGVuZCA9IE1hdGguY2VpbChtYXggLyBub2RlSGVpZ2h0KSArIDE7XG5cbiAgICAgICAgdm0ubm9kZXMgPSB0cmVlRGF0YS5vdXRwdXREaXNwbGF5KHN0YXJ0LCBlbmQpO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh2bS5zY3JvbGxJbnRvVmlld1RpbWVJZCk7XG4gICAgICAgIHZtLnNjcm9sbEludG9WaWV3VGltZUlkID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVVzZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb25lID0gYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVVzZXIpO1xuICAgICAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDov5Tlm57oioLngrkgdXVpZFxuICAgICAqL1xuICAgIGdldEZpcnN0U2VsZWN0KCkge1xuICAgICAgICBjb25zdCBmaXJzdCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXTtcblxuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB2bS5nZXRGaXJzdENoaWxkKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPlumAieS4reWIl+ihqOaVsOe7hOS4reacgOWQjuS4gOS4quiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnuepulxuICAgICAqL1xuICAgIGdldExhc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tsZW5ndGggLSAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB2bS5nZXRGaXJzdENoaWxkKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPluinhuinieS4iuagkeW9ouS4iuS4i+WIl+ihqOS4re+8jOesrOS4gOS4qumAieS4reiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnumhtuWxguagueiKgueCuVxuICAgICAqL1xuICAgIGdldEZpcnN0U2VsZWN0U29ydEJ5RGlzcGxheSgpIHtcbiAgICAgICAgbGV0IHV1aWQgPSAnJztcbiAgICAgICAgbGV0IGluZGV4ID0gSW5maW5pdHk7XG5cbiAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmZvckVhY2goKHNlbGVjdDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJlZURhdGEudXVpZFRvSW5kZXhbc2VsZWN0XSA8IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSB0cmVlRGF0YS51dWlkVG9JbmRleFtzZWxlY3RdO1xuICAgICAgICAgICAgICAgIHV1aWQgPSBzZWxlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB1dWlkIHx8IHRyZWVEYXRhLm5vZGVUcmVlPy51dWlkO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6KeG6KeJ5LiK5qCR5b2i5LiK5LiL5YiX6KGo5Lit77yM56ys5LiA5Liq6YCJ5Lit6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue6aG25bGC5qC56IqC54K5XG4gICAgICovXG4gICAgZ2V0TGFzdFNlbGVjdFNvcnRCeURpc3BsYXkoKSB7XG4gICAgICAgIGxldCB1dWlkID0gJyc7XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG5cbiAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmZvckVhY2goKHNlbGVjdDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJlZURhdGEudXVpZFRvSW5kZXhbc2VsZWN0XSA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSB0cmVlRGF0YS51dWlkVG9JbmRleFtzZWxlY3RdO1xuICAgICAgICAgICAgICAgIHV1aWQgPSBzZWxlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB1dWlkIHx8IHRyZWVEYXRhLm5vZGVUcmVlPy51dWlkO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+U5Zue5qCR5b2i56ys5LiA5Liq6IqC54K5XG4gICAgICog56ys5LiA5Liq6IqC54K577yM5LiN5LiA5a6a5piv5qC56IqC54K577yM5L6L5aaC5Zyo5pCc57Si55qE5oOF5Ya15LiLXG4gICAgICovXG4gICAgZ2V0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS5ub2RlVHJlZT8udXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF07XG4gICAgfSxcbiAgICBpc0FjdGl2ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzQWN0aXZlKHV1aWQpO1xuICAgIH0sXG4gICAgaXNFeHBhbmQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc0V4cGFuZCh1dWlkKTtcbiAgICB9LFxuICAgIGlzUGFyZW50KHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNQYXJlbnQodXVpZCk7XG4gICAgfSxcbiAgICBpc1NlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNTZWxlY3RlZCh1dWlkKTtcbiAgICB9LFxuICAgIGlzQW5pbWF0aW5nKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNBbmltYXRpbmcodXVpZCB8fCBwYW5lbERhdGEuYWN0LmFuaW1hdGlvblV1aWQpO1xuICAgIH0sXG4gICAgaXNTZWFyY2hpbmcoKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc1NlYXJjaGluZygpO1xuICAgIH0sXG4gICAgYXN5bmMgZGlhbG9nRXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuZXJyb3IoRWRpdG9yLkkxOG4udChgaGllcmFyY2h5Lm9wZXJhdGUuJHttZXNzYWdlfWApLCB7XG4gICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm9wZXJhdGUuZGlhbG9nRXJyb3InKSxcbiAgICAgICAgfSk7XG4gICAgfSxcbn07XG5cbi8qKlxuICogdnVlIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbm9kZXM6IFtdLCAvLyDlvZPliY3moJHlvaLlnKjlj6/op4bljLrln5/nmoToioLngrnmlbDmja5cbiAgICAgICAgcmVuYW1lVXVpZDogJycsIC8vIOmcgOimgSByZW5hbWUg55qE6IqC54K555qEIHVybO+8jOWPquacieS4gOS4qlxuICAgICAgICBhZGROb2RlOiB7XG4gICAgICAgICAgICAvLyDmt7vliqDkuIDkuKrmlrDoioLngrnliY3nmoTmlbDmja7vvIzpnIDopoHkuovliY3ph43lkb3lkI1cbiAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgcGFyZW50OiAnJyxcbiAgICAgICAgICAgIHNpYmxpbmc6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBpbnRvVmlld0J5VXNlcjogJycsIC8vIOeUqOaIt+aTjeS9nO+8mumAieS4re+8jOaWsOWinu+8jOenu+WKqO+8jOe7meS6iOWumuS9jVxuICAgICAgICBzY3JvbGxUb3A6IDAsIC8vIOW9k+WJjeagkeW9oueahOa7muWKqOaVsOaNrlxuICAgICAgICBkcm9wcGFibGVUeXBlczogW10sXG4gICAgICAgIHR3aW5rbGVzOiB7fSwgLy8g6ZyA6KaB6Zeq54OB55qEIHV1aWRcbiAgICAgICAgY2hlY2tTaGlmdFVwRG93bk1lcmdlOiB7IHV1aWQ6ICcnLCBkaXJlY3Rpb246ICcnIH0sIC8vIHNoaWZ0ICsg566t5aS05aSa6YCJ77yM5aKe5by65Lqk5LqS5pWI5p6cXG4gICAgfTtcbn1cblxuLyoqXG4gKiB2bSA9IHRoaXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdW50ZWQoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHZtID0gdGhpcztcbn1cbiJdfQ==