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
exports.template = fs_1.readFileSync(path_1.join(__dirname, '../../static/template/tree.html'), 'utf8');
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
        Editor.Selection.clear('node');
        Editor.Selection.select('node', uuid);
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
        json.name = await Editor.Message.request('scene', 'generate-available-name', json.name, json.parent);
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
            // const undoID = await Editor.Message.request('scene', 'begin-recording', json.parent);
            await Editor.Message.request('scene', 'create-node', json);
            // await Editor.Message.request('scene', 'end-recording', undoID);
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
            Editor.Message.send('scene', 'snapshot');
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
        const undoID = await Editor.Message.request('scene', 'begin-recording', uuid, { auto: false });
        // 发送重名命数据
        const isSuccess = await Editor.Message.request('scene', 'set-property', {
            uuid: uuid,
            path: 'name',
            dump: {
                type: 'string',
                value: name,
            },
        });
        if (!isSuccess) {
            await Editor.Message.request('scene', 'cancel-recording', undoID);
            vm.dialogError('renameFail');
        }
        else {
            await Editor.Message.request('scene', 'end-recording', undoID);
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
            additional.forEach((info) => {
                if (vm.droppableTypes.includes(info.type)) {
                    const [assetUuid, subAssetUuid] = info.value.split('@');
                    if (info.type === 'cc.Prefab') {
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
            const undoID = await Editor.Message.request('scene', 'begin-recording', parents);
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
                    const newUuid = await Editor.Message.request('scene', 'create-node', {
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
                await Editor.Message.request('scene', 'end-recording', undoID);
            }
            else {
                await Editor.Message.request('scene', 'cancel-recording', undoID);
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
        const undoID = await Editor.Message.request('scene', 'begin-recording', Object.keys(changedParents));
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
        await Editor.Message.request('scene', 'end-recording', undoID);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBWWIsK0JBQTRCO0FBQzVCLDJCQUFrQztBQUNsQyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUM1QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRXpCLHNCQUFzQjtBQUN0QixJQUFJLFlBQWlCLENBQUM7QUFDdEIsSUFBSSxZQUFpQixDQUFDO0FBRXRCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztBQUVaLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUVkLFFBQUEsUUFBUSxHQUFHLGlCQUFZLENBQUMsV0FBSSxDQUFDLFNBQVMsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXBGLFFBQUEsVUFBVSxHQUFHO0lBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDO0NBQ3RDLENBQUM7QUFFVyxRQUFBLEtBQUssR0FBRztJQUNqQjs7T0FFRztJQUNILFNBQVM7UUFDTCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztDQUNKLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxD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LE1BQU0sRUFBRSxFQUFFO1lBQ1YsT0FBTyxFQUFFLEVBQUU7U0FDZDtRQUNELGNBQWMsRUFBRSxFQUFFO1FBQ2xCLFNBQVMsRUFBRSxDQUFDO1FBQ1osY0FBYyxFQUFFLEVBQUU7UUFDbEIsUUFBUSxFQUFFLEVBQUU7UUFDWixxQkFBcUIsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLHNCQUFzQjtLQUM3RSxDQUFDO0FBQ04sQ0FBQztBQWhCRCxvQkFnQkM7QUFFRDs7R0FFRztBQUNILFNBQWdCLE9BQU87SUFDbkIsYUFBYTtJQUNiLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBSEQsMEJBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7XG4gICAgQWRkTm9kZSxcbiAgICBUcmVlTm9kZSxcbiAgICBEcmFnTm9kZUluZm8sXG4gICAgRHJhZ05vZGUsXG4gICAgRHJvcENhbGxiYWNrSW5mbyxcbiAgICBJTW92ZU5vZGVJbmZvLFxuICAgIFRNb3ZlTm9kZUNvbW1hbmQsIElEaXJlY3Rpb24sXG59IGZyb20gJy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGFuZWxEYXRhIGZyb20gJy4vcGFuZWwtZGF0YSc7XG5pbXBvcnQgKiBhcyB0cmVlRGF0YSBmcm9tICcuL3RyZWUtZGF0YSc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL3V0aWxzJztcblxubGV0IHZtOiBhbnkgPSBudWxsO1xubGV0IHJlcXVlc3RBbmltYXRpb25JZDogYW55O1xubGV0IHNlbGVjdGVkVGltZUlkOiBhbnk7XG5sZXQgaXNSZWZyZXNoaW5nID0gZmFsc2U7XG5cbi8vIOeUqOS6juivhuWIqyBkcmFnIOaCrOWBnO+8jOiHquWKqOWxleW8gOeItue6p1xubGV0IGRyYWdPdmVyVXVpZDogYW55O1xubGV0IGRyYWdPdmVyVGltZTogYW55O1xuXG5sZXQgbG9ja01vdmVOb2RlID0gZmFsc2U7XG5cbmV4cG9ydCBjb25zdCBuYW1lID0gJ3RyZWUnO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvdGVtcGxhdGUvdHJlZS5odG1sJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge1xuICAgICd0cmVlLW5vZGUnOiByZXF1aXJlKCcuL3RyZWUtbm9kZScpLFxufTtcblxuZXhwb3J0IGNvbnN0IHdhdGNoID0ge1xuICAgIC8qKlxuICAgICAqIHNjcm9sbFRvcCDlj5jljJbvvIzliLfmlrDmoJHlvaJcbiAgICAgKi9cbiAgICBzY3JvbGxUb3AoKSB7XG4gICAgICAgIHZtLmZpbHRlcigpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDnv7vor5FcbiAgICAgKiBAcGFyYW0ga2V5IOS4jeW4pumdouadv+WQjeensOeahOagh+iusOWtl+esplxuICAgICAqL1xuICAgIHQoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLiQucGFuZWwudChrZXkpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSW6YOo5pWw5o2u5pu05paw5ZCO77yM5pu05paw5YaF6YOo5pWw5o2uXG4gICAgICovXG4gICAgdXBkYXRlKCkge1xuICAgICAgICBjb25zdCBkcm9wcGFibGVUeXBlcyA9IHZtLiRwYXJlbnQuZHJvcHBhYmxlVHlwZXMuY29uY2F0KHBhbmVsRGF0YS5jb25maWcuY3JlYXRhYmxlVHlwZXMpO1xuICAgICAgICB2bS5kcm9wcGFibGVUeXBlcyA9IGRyb3BwYWJsZVR5cGVzLmNvbmNhdChwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5riF56m65qCR5b2iXG4gICAgICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRyZWVEYXRhLmNsZWFyKCk7XG4gICAgICAgIHZtLnJlZnJlc2goKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIt+aWsOagkeW9olxuICAgICAqL1xuICAgIGFzeW5jIHJlZnJlc2goKSB7XG4gICAgICAgIGlmIChpc1JlZnJlc2hpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlzUmVmcmVzaGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8g5bu26L+fIDIwMCBtcyDliLfmlrDvvIzlu7bov5/mnJ/pl7Tlj6/ku6XlkIjlubblpJrmrKEgY2hhbmdlZCDkuqfnlJ/nmoTliLfmlrDmjIfku6TvvIznvJPop6PmgKfog73pl67pophcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMjAwKSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLnJlc2V0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlzUmVmcmVzaGluZyA9IGZhbHNlO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YOo6YCJ5LitXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgc2VsZWN0QWxsKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB0cmVlRGF0YS5kaXNwbGF5QXJyYXkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXVpZCA9IHV1aWQgfHwgdm0uZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCk7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0gfHwgdXVpZDsgLy8gcGFyZW50VXVpZCDkuLrnqbrmmK/moLnoioLngrnvvIzovazkuLroh6rouqsgdXVpZFxuICAgICAgICBjb25zdCBzaWJsaW5nVXVpZHMgPSB1dGlscy5nZXRDaGlsZHJlblV1aWRzKHBhcmVudFV1aWQpO1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgIGNvbnN0IGlzSW5jbHVkZWQgPSBjdXJyZW50U2VsZWN0cy5pbmNsdWRlcyh1dWlkKTtcblxuICAgICAgICBsZXQgc2libGluZ3NBbGxJbiA9IHRydWU7XG4gICAgICAgIHNpYmxpbmdVdWlkcy5mb3JFYWNoKChzaWJsaW5nVXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhzaWJsaW5nVXVpZCkpIHtcbiAgICAgICAgICAgICAgICBzaWJsaW5nc0FsbEluID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzaWJsaW5nc0FsbEluKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzSW5jbHVkZWQpIHtcbiAgICAgICAgICAgICAgICAvLyDliKDpmaTotoXov4fojIPlm7TnmoTlt7LpgInkuK3oioLngrlcbiAgICAgICAgICAgICAgICBjdXJyZW50U2VsZWN0cy5mb3JFYWNoKChzZWxlY3Q6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNpYmxpbmdVdWlkcy5pbmNsdWRlcyhzZWxlY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgc2VsZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBzaWJsaW5nVXVpZHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdub2RlJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzLmlzUGFyZW50KHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgc2libGluZ1V1aWRzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3V1aWRdLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VsZWN0Q2xlYXIoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkcyBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAqL1xuICAgIHNlbGVjdGVkKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2godXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IHV1aWQ7XG5cbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6Ugc2hpZnQg5aSa6YCJ55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICB1bnNlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVVzZXIgPT09IHV1aWQpIHtcbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmgaLlpI3pgInkuK3nirbmgIFcbiAgICAgKi9cbiAgICByZXNlbGVjdGVkKCkge1xuICAgICAgICBjb25zdCB1dWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ25vZGUnKS5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4gISF0cmVlRGF0YS51dWlkVG9Ob2RlW3V1aWRdKTtcbiAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2bS5zZWxlY3RlZCh1dWlkcyk7XG5cbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChzZWxlY3RlZFRpbWVJZCk7XG4gICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlVc2VyKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsgY2xpY2sg5aSa6YCJXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgc2hpZnRDbGljayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBkaXNwbGF5QXJyYXkgfSA9IHRyZWVEYXRhO1xuXG4gICAgICAgIGNvbnN0IGZpcnN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZihwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF0pO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoZmlyc3RJbmRleCAhPT0gLTEgfHwgbGFzdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGZpcnN0SW5kZXggPD0gbGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZpcnN0SW5kZXg7IGkgPD0gbGFzdEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0cy5wdXNoKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA+PSBsYXN0SW5kZXg7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2bS5pcGNTZWxlY3Qoc2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBjdHJsICsgY2xpY2sg6YCJ5Lit5oiW5Y+W5raI6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgY3RybENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgdXVpZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDph43mlrDpgInkuK3oioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBpcGNTZWxlY3QodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5qCR5b2i5LiK55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgaXBjU2VsZWN0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICBjb25zdCB1dWlkID0gdGhpcy5nZXRGaXJzdENoaWxkKCk7XG4gICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnqbrnmb3lpITngrnlh7vvvIzlj5bmtojpgInkuK1cbiAgICAgKi9cbiAgICBjbGljaygpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yib5bu66IqC54K55YmN5ZCN56ew5LqL5YmN5aSE55CGXG4gICAgICogQHBhcmFtIGpzb24gQWRkTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGFkZFRvKGpzb246IEFkZE5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb24ucGFyZW50KSB7XG4gICAgICAgICAgICBqc29uLnBhcmVudCA9IHRoaXMuZ2V0Rmlyc3RTZWxlY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudDogVHJlZU5vZGUgfCBudWxsID0gYXdhaXQgdXRpbHMuZ2V0UGFyZW50V2hlbkFkZE5vZGUoanNvbik7XG5cbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtLnRvZ2dsZShqc29uLnBhcmVudCwgdHJ1ZSk7XG4gICAgICAgIGpzb24ucGFyZW50ID0gcGFyZW50LnV1aWQ7XG5cbiAgICAgICAgLy8g6K6+572u5pi+56S65L2N572u55qE55uu5qCH6IqC54K5XG4gICAgICAgIGpzb24uc2libGluZyA9IHV0aWxzLmdldExhc3RFeHBhbmRDaGlsZFV1aWQocGFyZW50LnV1aWQpO1xuICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhqc29uLnNpYmxpbmcpO1xuXG4gICAgICAgIGpzb24ubmFtZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2dlbmVyYXRlLWF2YWlsYWJsZS1uYW1lJywganNvbi5uYW1lLCBqc29uLnBhcmVudCk7XG4gICAgICAgIGpzb24ubmFtZUluY3JlYXNlID0gZmFsc2U7XG5cbiAgICAgICAgdm0uYWRkTm9kZSA9IGpzb247XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmlrDlop7oioLngrnvvIzkuovliY3ph43lkb3lkI3lkI7mjqXmlLbmlbDmja5cbiAgICAgKiBAcGFyYW0ganNvbiBBZGROb2RlXG4gICAgICovXG4gICAgYWRkQ29uZmlybShqc29uPzogQWRkTm9kZSkge1xuICAgICAgICAvLyDmlrDlop7nmoTovpPlhaXmoYbmtojlpLFcbiAgICAgICAgdm0uYWRkTm9kZS5zaWJsaW5nID0gJyc7XG5cbiAgICAgICAgLy8g5pWw5o2u6ZSZ6K+v5pe25Y+W5raIXG4gICAgICAgIGlmICghanNvbiB8fCAhanNvbi5wYXJlbnQpIHtcbiAgICAgICAgICAgIHZtLmFkZEVuZCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuZ2V0Tm9kZShqc29uLnBhcmVudCk7XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICB2bS5hZGRFbmQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlscy5jYW5Ob3RDcmVhdGVOb2RlKHBhcmVudCkpIHtcbiAgICAgICAgICAgIC8vIOeItue6p+S4jeWPr+WIm+W7uuiKgueCuVxuICAgICAgICAgICAgdm0uYWRkRW5kKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bS5hZGQoanNvbik7XG4gICAgfSxcbiAgICBhZGRFbmQoKSB7XG4gICAgICAgIC8vIGxvYWRpbmcg5pWI5p6c5raI5aSxXG4gICAgICAgIHZtLmFkZE5vZGUucGFyZW50ID0gJyc7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBpcGMg5Y+R6LW35Yib5bu66IqC54K5XG4gICAgICogQHBhcmFtIGpzb24gQWRkTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGFkZChqc29uOiBBZGROb2RlKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICAvLyBjb25zdCB1bmRvSUQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdiZWdpbi1yZWNvcmRpbmcnLCBqc29uLnBhcmVudCk7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIGpzb24pO1xuICAgICAgICAgICAgLy8gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZW5kLXJlY29yZGluZycsIHVuZG9JRCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB2bS5hZGRFbmQoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K55bey5re75Yqg5Yiw5Zy65pmvXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgYWRkZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHZtLnJlZnJlc2goKTtcbiAgICAgICAgcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWVzLnB1c2goeyB1dWlkLCBhbmltYXRpb246ICdzaHJpbmsnIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pu05paw5qCR5b2i6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgY2hhbmdlZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdm0ucmVmcmVzaCgpO1xuXG4gICAgICAgIC8vIOagueiKgueCueWkqumikee5geS6hu+8jOS4jeimgemXqueDgVxuICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNTY2VuZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliKDpmaRcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBkZWxldGUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIC8vIOWmguaenOivpeiKgueCueayoeacieiiq+mAieS4re+8jOWImeWPquaYr+WIoOmZpOatpOWNleS4qlxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhYHorrjliKDpmaRcbiAgICAgICAgICAgIGlmICghdXRpbHMuY2FuTm90RGVsZXRlTm9kZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLmRlbGV0ZU5vZGUodXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzor6XoioLngrnmmK/ooqvpgInkuK3kuobvvIzooajmmI7opoHliKDpmaTmiYDmnInpgInkuK3poblcbiAgICAgICAgICAgIGNvbnN0IHV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcGFyZW50czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5mb3JFYWNoKChzZWxlY3Q6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHNlbGVjdCk7XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5Yig6Zmk5YWB6K645Yig6ZmkXG4gICAgICAgICAgICAgICAgaWYgKCF1dGlscy5jYW5Ob3REZWxldGVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWRzLnB1c2goc2VsZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50cy5wdXNoKHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbc2VsZWN0XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZGVsZXRlTm9kZSh1dWlkcyk7XG4gICAgICAgIH1cblxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5LuO5qCR5b2i5Yig6Zmk6IqC54K5XG4gICAgICovXG4gICAgZGVsZXRlZCgpIHtcbiAgICAgICAgdm0ucmVmcmVzaCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K555qE5oqY5Y+g5YiH5o2iXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIGV4cGFuZCB0cnVlIG9yIGZhbHNlXG4gICAgICogQHBhcmFtIGxvb3Ag5piv5ZCm5ZCR5a2Q6ZuG5b6q546vXG4gICAgICovXG4gICAgdG9nZ2xlKHV1aWQ6IHN0cmluZywgZXhwYW5kOiBib29sZWFuLCBsb29wPzogYm9vbGVhbikge1xuICAgICAgICBpZiAobG9vcCkge1xuICAgICAgICAgICAgdHJlZURhdGEubG9vcEV4cGFuZCh1dWlkLCBleHBhbmQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJlZURhdGEudG9nZ2xlRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmDqOiKgueCueaKmOWPoOaIluWxleW8gFxuICAgICAqL1xuICAgIGFsbFRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKCF0cmVlRGF0YS5ub2RlVHJlZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNFeHBhbmQgPSB1dGlscy5pc0FsbEV4cGFuZCgpO1xuICAgICAgICBjb25zdCBwYXJlbnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICBpZiAoc2VsZWN0c0xlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICghdXRpbHMuaXNQYXJlbnQocGFyZW50VXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50cy5pbmNsdWRlcyhwYXJlbnRVdWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJlZURhdGEudG9nZ2xlRXhwYW5kKHBhcmVudFV1aWQsICFpc0V4cGFuZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50VXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50cy5wdXNoKHRyZWVEYXRhLm5vZGVUcmVlLnV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHBhcmVudHNbaV0sICFpc0V4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOS4iuS4i+W3puWPsyDmjInplK5cbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIHVwRG93bkxlZnRSaWdodChkaXJlY3Rpb246IElEaXJlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHZtLmdldExhc3RTZWxlY3QoKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBpZiAoIXV0aWxzLmlzRXhwYW5kKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGxhc3QsIHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltsYXN0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBpZiAodXRpbHMuaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtsYXN0XTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QocGFyZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNpYmxpbmdzID0gdXRpbHMuZ2V0U2libGluZyhsYXN0KTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50O1xuICAgICAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd1cCc6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZG93bic6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1syXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGN1cnJlbnQudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaMieS9jyBzaGlmdCDplK7vvIzlkIzml7bkuIrkuIvpgInmi6lcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIGFzeW5jIHNoaWZ0VXBEb3duKGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgW2xhc3QsIGxhc3RQcmV2LCBsYXN0TmV4dF0gPSB1dGlscy5nZXRTaWJsaW5nKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tsZW5ndGggLSAxXSk7XG4gICAgICAgIGNvbnN0IGhhc0xhc3RQcmV2ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICBjb25zdCBoYXNMYXN0TmV4dCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndXAnKSB7XG4gICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBsYXN0UHJldi51dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gbGFzdFByZXYudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0xhc3ROZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ25vZGUnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdFByZXYudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdFByZXYudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIGxhc3ROZXh0LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0TmV4dC51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdFByZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIGxhc3QudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGxhc3ROZXh0LnV1aWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGxhc3ROZXh0LnV1aWQpLCAxKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGxhc3ROZXh0LnV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkIjlubYgc2hpZnQg5aSa6YCJ6L+H56iL5Lit5YmN5ZCO55qE5bey6YCJ5Lit6aG5XG4gICAgICog5q+U5aaCIGFiIGNkZSDpobnkuK0gYSwgY2RlIOW3sumAieS4rSwgYiDmnKrpgInkuK1cbiAgICAgKiDlvZPpgInkuK0gYiDml7bvvIzlkIjlubbpgInkuK3pobkgY2RlIO+8jOW5tuWwhuacq+WwvumAieS4remhueeahOaMh+mSiOaMh+WQkSBlXG4gICAgICovXG4gICAgc2hpZnRVcERvd25NZXJnZVNlbGVjdGVkKCkge1xuICAgICAgICBpZiAoIXZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQga2VlcEZpbmROZXh0ID0gdHJ1ZTtcbiAgICAgICAgbGV0IGZpbmRVdWlkID0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQ7XG5cbiAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSAnJzsgLy8g6YeN572uXG4gICAgICAgIGxldCBtYXhMb29wTnVtYmVyID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGtlZXBGaW5kTmV4dCkge1xuICAgICAgICAgICAgY29uc3QgYXJyID0gdXRpbHMuZ2V0U2libGluZyhmaW5kVXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXJyIHx8ICFhcnJbMV0gfHwgIWFyclsyXSB8fCAhbWF4TG9vcE51bWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID09PSAnZG93bicgPyBhcnJbMl0udXVpZCA6IGFyclsxXS51dWlkO1xuICAgICAgICAgICAgbWF4TG9vcE51bWJlci0tO1xuXG4gICAgICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGZpbmRVdWlkKSkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YoZmluZFV1aWQpLCAxKTtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChmaW5kVXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGtlZXBGaW5kTmV4dCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnp7vliqjoioLngrlcbiAgICAgKiBAcGFyYW0gY29tbWFuZCAtIOaMh+WumlxuICAgICAqIHVwIC0g5ZCR5LiK56e75YqoXG4gICAgICogZG93biAtIOWQkeS4i+enu+WKqFxuICAgICAqIHRvcCAtIOe9rumhtu+8iOWPquWcqOe7hOWGheeahOacgOmhtumDqO+8iVxuICAgICAqIGJvdHRvbSAtIOe9ruW6le+8iOWPquWcqOe7hOWGheeahOacgOW6lemDqO+8iVxuICAgICAqL1xuICAgIGFzeW5jIG1vdmVOb2RlKGNvbW1hbmQ6IFRNb3ZlTm9kZUNvbW1hbmQpIHtcbiAgICAgICAgaWYgKGxvY2tNb3ZlTm9kZSkgcmV0dXJuO1xuICAgICAgICBsb2NrTW92ZU5vZGUgPSB0cnVlO1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldE1vdmVOb2RlSW5mbyhzZWxlY3ROb2RlVXVpZDogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3NlbGVjdE5vZGVVdWlkXTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudENoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bcGFyZW50XSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gcGFyZW50Q2hpbGRyZW4uZmluZEluZGV4KCh1dWlkOiBhbnkpID0+IHV1aWQgPT09IHNlbGVjdE5vZGVVdWlkKSB8fCAwO1xuICAgICAgICAgICAgcmV0dXJuIHsgbm9kZTogc2VsZWN0Tm9kZVV1aWQsIHBhcmVudDogcGFyZW50LCBwYXJlbnRDaGlsZHJlbiwgaW5kZXggfSBhcyBJTW92ZU5vZGVJbmZvO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2FtZUdyb3VwOiBSZWNvcmQ8c3RyaW5nLCBJTW92ZU5vZGVJbmZvW10+ID0ge307Ly8g6YCa6L+H5LiA5LiqIHBhcmVudCDnmoToioLngrlcbiAgICAgICAgY29uc3QgZmlyc3ROb2RlOiBJTW92ZU5vZGVJbmZvID0gZ2V0TW92ZU5vZGVJbmZvKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXSk7XG4gICAgICAgIHNhbWVHcm91cFtmaXJzdE5vZGUucGFyZW50XSA9IFtmaXJzdE5vZGVdO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGdldE1vdmVOb2RlSW5mbyhwYW5lbERhdGEuYWN0LnNlbGVjdHNbaV0pO1xuICAgICAgICAgICAgaWYgKCFzYW1lR3JvdXBbaW5mby5wYXJlbnRdKSB7XG4gICAgICAgICAgICAgICAgc2FtZUdyb3VwW2luZm8ucGFyZW50XSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpcnN0Tm9kZS5wYXJlbnQgPT09IGluZm8ucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzYW1lR3JvdXBbaW5mby5wYXJlbnRdLmZpbmQoKGl0ZW0pID0+IGl0ZW0ubm9kZSA9PT0gZmlyc3ROb2RlLm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNhbWVHcm91cFtpbmZvLnBhcmVudF0ucHVzaChmaXJzdE5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXNhbWVHcm91cFtpbmZvLnBhcmVudF0uZmluZCgoaXRlbSkgPT4gaXRlbS5ub2RlID09PSBpbmZvLm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNhbWVHcm91cFtpbmZvLnBhcmVudF0ucHVzaChpbmZvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNhbWVHcm91cFtpbmZvLnBhcmVudF0ucHVzaChpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgc25hcHNob3QgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gc2FtZUdyb3VwKSB7XG4gICAgICAgICAgICBjb25zdCBncm91cDogSU1vdmVOb2RlSW5mb1tdID0gc2FtZUdyb3VwW2tleV07XG4gICAgICAgICAgICBncm91cC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8g5LuO5bCP5Yiw5aSn5o6S5bqPXG4gICAgICAgICAgICAgICAgaWYgKGEuaW5kZXggPiBiLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYS5pbmRleCA8IGIuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8g5ZCI5bm26L+e57ut55qEIGluZGV4IOS4uuS4gOe7hFxuICAgICAgICAgICAgY29uc3QgbWVyZ2VJbmRleExpc3QgPSBbXTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50R3JvdXAgPSBbZ3JvdXBbMF1dO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBncm91cC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChncm91cFtpXS5pbmRleCA9PT0gZ3JvdXBbaSAtIDFdLmluZGV4ICsgMSkgeyAvLyDlpoLmnpzlvZPliY3mlbDlrZfkuI7liY3kuIDkuKrmlbDlrZfov57nu63vvIzliJnliqDlhaXlvZPliY3nu4TkuK1cbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEdyb3VwLnB1c2goZ3JvdXBbaV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vIOWQpuWImeWwhuW9k+WJjee7hOWKoOWFpee7k+aenOaVsOe7hOS4re+8jOW5tuW8gOWQr+S4gOS4quaWsOeahOe7hFxuICAgICAgICAgICAgICAgICAgICBtZXJnZUluZGV4TGlzdC5wdXNoKGN1cnJlbnRHcm91cCk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRHcm91cCA9IFtncm91cFtpXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWVyZ2VJbmRleExpc3QucHVzaChjdXJyZW50R3JvdXApO1xuICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT09ICdkb3duJyB8fCBjb21tYW5kID09PSAnYm90dG9tJykge1xuICAgICAgICAgICAgICAgIG1lcmdlSW5kZXhMaXN0LnNvcnQoKGFHcm91cCwgYkdyb3VwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS7juWkp+WIsOWwj+aOkuW6j1xuICAgICAgICAgICAgICAgICAgICBpZiAoYUdyb3VwWzBdLmluZGV4ID4gYkdyb3VwWzBdLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFHcm91cFswXS5pbmRleCA8IGJHcm91cFswXS5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJHcm91cCBvZiBtZXJnZUluZGV4TGlzdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmmK/lkJHkuIvmlrnlkJHnmoTor53vvIzpnIDopoHph43mlrDmjpLluo/miorlpKfnmoTmlL7liLDnrKzkuIDkvY1cbiAgICAgICAgICAgICAgICAgICAgc3ViR3JvdXAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5LuO5aSn5Yiw5bCP5o6S5bqPXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5pbmRleCA+IGIuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5pbmRleCA8IGIuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbGFzdENvdW50ID0gMDsvLyDkuIrkuIDkuKrnu4TnmoTplb/luqZcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc3ViR3JvdXAgb2YgbWVyZ2VJbmRleExpc3QpIHtcbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXJzdE5vZGUgPSBzdWJHcm91cFswXTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXhDb3VudCA9IGZpcnN0Tm9kZS5wYXJlbnRDaGlsZHJlbi5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd1cCc6Ly/lkJHkuIrnp7tcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdE5vZGUuaW5kZXggLSAxID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd0b3AnOi8v572u6aG2XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3ROb2RlLmluZGV4IC0gMSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gKGxhc3RDb3VudCAtIGZpcnN0Tm9kZS5pbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZG93bic6Ly/lkJHkuIvnp7tcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXJzdE5vZGUuaW5kZXggKyAxIDw9IG1heENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdib3R0b20nOi8vIOe9ruW6lVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0Tm9kZS5pbmRleCArIDEgPD0gbWF4Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSAobWF4Q291bnQgLSAoZmlyc3ROb2RlLmluZGV4ICsgbGFzdENvdW50KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGFzdENvdW50ID0gc3ViR3JvdXAubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc25hcHNob3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG1vdmVOb2RlSW5mbyBvZiBzdWJHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEubW92ZU5vZGUobW92ZU5vZGVJbmZvLnBhcmVudCwgbW92ZU5vZGVJbmZvLmluZGV4LCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzbmFwc2hvdCkge1xuICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcbiAgICAgICAgICAgIGlmIChjb21tYW5kID09PSAndG9wJykge1xuICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gdGhpcy5nZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IHRoaXMuZ2V0TGFzdFNlbGVjdFNvcnRCeURpc3BsYXkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGxvY2tNb3ZlTm9kZSA9IGZhbHNlO1xuICAgICAgICB9LCA1MCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rlv6vmjbfplK7nmoQgcmVuYW1lXG4gICAgICovXG4gICAgYXN5bmMga2V5Ym9hcmRSZW5hbWUoKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2bS5yZW5hbWVVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1dWlkID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcblxuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgIGlmIChhc3NldCAmJiAhdXRpbHMuY2FuTm90UmVuYW1lKGFzc2V0KSkge1xuICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgICAgICB2bS5yZW5hbWVVdWlkID0gdXVpZDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K56YeN5ZCN5ZG9XG4gICAgICog6L+Z5piv5byC5q2l55qE77yM5Y+q5YGa5Y+R6YCBXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIG5hbWUg5LiN6YeN5ZG95ZCN5pe25LygIG5hbWUgPSBudWxsXG4gICAgICovXG4gICAgYXN5bmMgcmVuYW1lKHV1aWQ6IHN0cmluZywgbmFtZTogc3RyaW5nIHwgbnVsbCkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmuIXnqbogcmVuYW1lIOeahOiKgueCuVxuICAgICAgICB2bS5yZW5hbWVVdWlkID0gJyc7XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgIGlmICghbm9kZSB8fCB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5LiN6YeN5ZG95ZCN55qE5oOF5Ya1OlxuICAgICAgICAgKiBuYW1lID0gbnVsbFxuICAgICAgICAgKiDplIHlrppcbiAgICAgICAgICog5ZKM5YmN5YC85LiA5qC3XG4gICAgICAgICAqL1xuICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCB1dGlscy5jYW5Ob3RSZW5hbWUobm9kZSkgfHwgbmFtZSA9PT0gbm9kZS5uYW1lKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG5cbiAgICAgICAgLy8g5L+d5a2Y5Y6G5Y+y6K6w5b2VXG4gICAgICAgIGNvbnN0IHVuZG9JRCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2JlZ2luLXJlY29yZGluZycsIHV1aWQsIHsgYXV0bzogZmFsc2UgfSk7XG4gICAgICAgIC8vIOWPkemAgemHjeWQjeWRveaVsOaNrlxuICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgcGF0aDogJ25hbWUnLFxuICAgICAgICAgICAgZHVtcDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjYW5jZWwtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgICAgIHZtLmRpYWxvZ0Vycm9yKCdyZW5hbWVGYWlsJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdlbmQtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmiafooYzmkJzntKJcbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2goKSB7XG4gICAgICAgIC8vIOaQnOe0ouacieWPmOWKqOmDveWFiOa7muWbnumhtumDqFxuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVmFsdWUpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG8oMCwgMCk7XG5cbiAgICAgICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hUeXBlID09PSAnYXNzZXQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZmluZE5vZGVzVXNlQXNzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hUeXBlID09PSAnbWlzc0Fzc2V0Jykge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveC5zY3JvbGxUbygwLCAwKTtcbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLmZpbmROb2Rlc01pc3NBc3NldCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3mhJ/nn6XlvZPliY3miYDlpIToioLngrnkvY3nva5cbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKiBAcGFyYW0gcG9zaXRpb24g5L2N572u77yaYmVmb3Jl77yMaW5zaWRl77yMYWZ0ZXJcbiAgICAgKi9cbiAgICBkcmFnT3Zlcih1dWlkOiBzdHJpbmcsIHBvc2l0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodXVpZCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICB1dWlkID0gdm0uZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZHJhZyDmgqzlgZzkuIDmrrXml7bpl7TlkI7oh6rliqjlsZXlvIDoioLngrlcbiAgICAgICAgICAgIGNvbnN0IG5vd1RpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgaWYgKGRyYWdPdmVyVXVpZCAhPT0gdXVpZCkge1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVXVpZCA9IHV1aWQ7XG4gICAgICAgICAgICAgICAgZHJhZ092ZXJUaW1lID0gbm93VGltZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vd1RpbWUgLSBkcmFnT3ZlclRpbWUgPiA4MDAgJiYgIXRyZWVEYXRhLnV1aWRUb0V4cGFuZFtub2RlLnV1aWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gJ2luc2lkZScpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdm0udG9nZ2xlKG5vZGUudXVpZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveC5zY3JvbGxUb3AgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgbm9kZUhlaWdodCwgaWNvbldpZHRoLCBwYWRkaW5nIH0gPSBwYW5lbERhdGEuY29uZmlnO1xuICAgICAgICAgICAgY29uc3QgeyBjbGllbnRIZWlnaHQsIG9mZnNldEhlaWdodCwgc2Nyb2xsVG9wLCBzY3JvbGxIZWlnaHQgfSA9IHBhbmVsRGF0YS4kLnZpZXdCb3g7XG5cbiAgICAgICAgICAgIGNvbnN0IGlzQXRCb3R0b20gPSBzY3JvbGxUb3AgJiYgY2xpZW50SGVpZ2h0ICsgc2Nyb2xsVG9wID09PSBzY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgICAgIGNvbnN0IHZpZXdSZWN0ID0gcGFuZWxEYXRhLiQudmlld0JveC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGNvbnN0IHRyZWVSZWN0ID0gdm0uJGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgY29uc3QgYWRqdXN0VG9wID0gdmlld1JlY3QudG9wIC0gdHJlZVJlY3QudG9wO1xuXG4gICAgICAgICAgICBjb25zdCBhZGp1c3RTY3JvbGxUb3AgPSB2bS5zY3JvbGxUb3AgJSBub2RlSGVpZ2h0O1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsYmFySGVpZ2h0ID0gb2Zmc2V0SGVpZ2h0IC0gY2xpZW50SGVpZ2h0O1xuXG4gICAgICAgICAgICBjb25zdCBkZXB0aExlZnQgPSBub2RlLmRlcHRoICogaWNvbldpZHRoO1xuICAgICAgICAgICAgY29uc3QgZGlzcGxheVRvcCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpICogbm9kZUhlaWdodDtcblxuICAgICAgICAgICAgbGV0IHRvcCA9IGRpc3BsYXlUb3AgLSBhZGp1c3RUb3AgKyBhZGp1c3RTY3JvbGxUb3AgKyBwYWRkaW5nO1xuICAgICAgICAgICAgbGV0IGFkanVzdFZlcnRpY2FsSGVpZ2h0ID0gLTEzO1xuXG4gICAgICAgICAgICBpZiAoaXNBdEJvdHRvbSkge1xuICAgICAgICAgICAgICAgIGFkanVzdFZlcnRpY2FsSGVpZ2h0IC09IDI7XG4gICAgICAgICAgICAgICAgdG9wICs9IHNjcm9sbGJhckhlaWdodDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGhlaWdodCA9IG5vZGVIZWlnaHQ7XG4gICAgICAgICAgICBsZXQgekluZGV4ID0gMDtcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdExlZnQgPSAtMztcblxuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB2bS4kZWwub2Zmc2V0V2lkdGggLSBkZXB0aExlZnQgLSBhZGp1c3RMZWZ0O1xuICAgICAgICAgICAgY29uc3QgbGVmdCA9IGRlcHRoTGVmdCArIGFkanVzdExlZnQ7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRUb3AgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdKSAqIG5vZGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAyO1xuICAgICAgICAgICAgICAgICAgICB6SW5kZXggPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnYWZ0ZXInOlxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAyO1xuICAgICAgICAgICAgICAgICAgICB6SW5kZXggPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgdG9wID0gKHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHV0aWxzLmdldExhc3RFeHBhbmRDaGlsZFV1aWQodXVpZCkpICsgMSkgKiBub2RlSGVpZ2h0ICsgcGFkZGluZztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b3AgPSBNYXRoLm1pbihzY3JvbGxIZWlnaHQgLSBoZWlnaHQsIHRvcCk7XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpICYmIFsnYmVmb3JlJywgJ2FmdGVyJ10uaW5jbHVkZXMocG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5kcm9wQm94ID0ge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogdG9wICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICAgICAgdmVydGljYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0b3AgLSBwYXJlbnRUb3AgKyBhZGp1c3RWZXJ0aWNhbEhlaWdodCArICdweCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+b5YWlIHRyZWUg5a655ZmoXG4gICAgICovXG4gICAgZHJhZ0VudGVyKCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvkuLrmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmRyb3BCb3guc3R5bGUgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiAnLTJweCcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICB2bS5kcmFnT3ZlcignJywgJ2FmdGVyJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogZHJvcCDliLDpnaLmnb/nqbrnmb3ljLrln5/ph4xcbiAgICAgKiBAcGFyYW0gZXZlbnQg6byg5qCH5LqL5Lu2XG4gICAgICovXG4gICAgZHJvcChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAmJiAhZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnaG92aW5nJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEVkaXRvci5VSS5fX3Byb3RlY3RlZF9fLkRyYWdBcmVhLmN1cnJlbnREcmFnSW5mbykpIHx8IHt9O1xuXG4gICAgICAgIC8vIGNjLlNjZW5lIOagueiKgueCuVxuICAgICAgICBkYXRhLnRvID0gdXRpbHMuZ2V0TGFzdENoaWxkVXVpZCh0cmVlRGF0YS5ub2RlVHJlZT8udXVpZCk7XG4gICAgICAgIGRhdGEuaW5zZXJ0ID0gJ2FmdGVyJztcbiAgICAgICAgZGF0YS5jb3B5ID0gZXZlbnQuY3RybEtleTtcbiAgICAgICAgZGF0YS5rZWVwV29ybGRUcmFuc2Zvcm0gPSAhZXZlbnQuc2hpZnRLZXk7XG4gICAgICAgIHZtLmlwY0Ryb3AoZGF0YSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnmi5bliqhcbiAgICAgKiBAcGFyYW0ganNvbiBEcmFnTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGlwY0Ryb3AoanNvbjogRHJhZ05vZGUpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZm9jdXNXaW5kb3coKTtcblxuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuY2xlYXJTZWFyY2goKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCB2YWx1ZXM6IGFueVtdID0gW107XG5cbiAgICAgICAgY29uc3QgeyB2YWx1ZSwgdHlwZSwgbmFtZSwgaW5zZXJ0IH0gPSBqc29uO1xuICAgICAgICBsZXQgeyBhZGRpdGlvbmFsIH0gPSBqc29uO1xuXG4gICAgICAgIGlmIChpbnNlcnQgPT09ICdpbnNpZGUnKXtcbiAgICAgICAgICAgIHZtLnRvZ2dsZShqc29uLnRvLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGFkZGl0aW9uYWwpIHtcbiAgICAgICAgICAgIC8vIOWinuWKoOS4gOWkhOWuuemUmVxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFkZGl0aW9uYWwpKSB7XG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbCA9IFthZGRpdGlvbmFsXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnlLHkuo7miYDmnInnmoTlrZDotYTmupDkuZ/lnKggZXZlbnQudmFsdWVzIOaVsOaNrumHjFxuICAgICAgICAgICAgICog5peg5rOV5Yy65YiG5aSa6YCJ5a2Q6LWE5rqQ55qE5oOF5Ya1XG4gICAgICAgICAgICAgKiDnuqblrprlr7nor4bliKvliLDmnIkgY2MuUHJlZmFiIOi/meenjeWtkOi1hOa6kO+8jOS+v+WvueWFtueItue6p+S4i+WFtuS7lui1hOa6kOi/m+ihjOi/h+a7pO+8jOivpeWunuS9k+eItui1hOa6kOWPquWPliBjYy5QcmVmYWIg5a2Q6LWE5rqQXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8vIOmcgOimgei/h+a7pOaOieWFtuS7luWtkOi1hOa6kOeahOeItui1hOa6kCB1dWlkXG4gICAgICAgICAgICBjb25zdCBleGNsdWRlU3ViQXNzZXRzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgICAgICAgICAgYWRkaXRpb25hbC5mb3JFYWNoKChpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodm0uZHJvcHBhYmxlVHlwZXMuaW5jbHVkZXMoaW5mby50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbYXNzZXRVdWlkLCBzdWJBc3NldFV1aWRdID0gaW5mby52YWx1ZS5zcGxpdCgnQCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby50eXBlID09PSAnY2MuUHJlZmFiJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBleGNsdWRlU3ViQXNzZXRzW2Fzc2V0VXVpZF0gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4Y2x1ZGVTdWJBc3NldHNbYXNzZXRVdWlkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdXVpZHMucHVzaChpbmZvLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXZtLmRyb3BwYWJsZVR5cGVzLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUgJiYgIXV1aWRzLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgICAgICAgdXVpZHMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB2YWx1ZXMucHVzaCh7IHR5cGUsIHZhbHVlLCBuYW1lIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsdWVzIOaciei/h+a7pOS6hiBhZGRpdGlvbmFsIOiKgueCuee7hOS7tuaVsOaNru+8jOmHjee9rue7mSBhZGRpdGlvbmFsXG4gICAgICAgIGpzb24uYWRkaXRpb25hbCA9IHZhbHVlcztcblxuICAgICAgICBpZiAoanNvbi50eXBlID09PSAnY2MuTm9kZScpIHtcbiAgICAgICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoanNvbi5jb3B5KSB7XG4gICAgICAgICAgICAgICAgLy8g5oyJ5L2P5LqGIGN0cmwg6ZSu77yM5ouW5Yqo5aSN5Yi2XG4gICAgICAgICAgICAgICAgYXdhaXQgdm0uY29weSh1dWlkcyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdm0ucGFzdGUoanNvbi50bywganNvbi5rZWVwV29ybGRUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm0ubW92ZShqc29uKTtcbiAgICAgICAgfSBlbHNlIGlmIChwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMgJiYgcGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzLmluY2x1ZGVzKGpzb24udHlwZSkpIHtcbiAgICAgICAgICAgIC8vIOivpeexu+Wei+eahOS6i+S7tuacieWklumDqOazqOWGjOeahOWKqOS9nO+8jOi9rOeUseWklumDqOazqOWGjOS6i+S7tuaOpeeuoVxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gT2JqZWN0LnZhbHVlcyhwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AuY2FsbGJhY2tzW2pzb24udHlwZV0pIGFzIEZ1bmN0aW9uW107XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzICYmIEFycmF5LmlzQXJyYXkoY2FsbGJhY2tzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvTm9kZSA9IHV0aWxzLmdldE5vZGUoanNvbi50byk7XG4gICAgICAgICAgICAgICAgaWYgKHRvTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b1BhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2pzb24udG9dO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b0luZGV4ID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bdG9QYXJlbnRVdWlkXS5pbmRleE9mKGpzb24udG8pO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjazogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm86IERyb3BDYWxsYmFja0luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZTogdG9Ob2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB0b1BhcmVudFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHRvSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGpzb24uaW5zZXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soaW5mbywganNvbi5hZGRpdGlvbmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5bCG6KKr5rOo5YWl5pWw5o2u55qE5a+56LGhXG4gICAgICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKGpzb24udG8pO1xuICAgICAgICAgICAgaWYgKCF0b05vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRvUGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbanNvbi50b10gPz8gdG9Ob2RlLnV1aWQ7Ly8g5b2T5Zy65pmv6IqC54K55LiL5peg5a2Q6IqC54K5IOmcgOimgeWuuemUmVxuXG4gICAgICAgICAgICAvLyDmi5bliLAgcHJlZmFiIOagueiKgueCueeahOmhtumDqOaUvue9ru+8jOmcgOimgei9rOS4uuaUvue9ruWcqOWGhemDqFxuICAgICAgICAgICAgaWYgKHRvTm9kZS5pc1ByZWZhYlJvb3QgJiYganNvbi5pbnNlcnQgIT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAgICAganNvbi5pbnNlcnQgPSAnaW5zaWRlJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5b2T5Yik5pat5Li65o+S5YWl5p+Q5Liq6IqC54K55pe277yM6ZyA6KaB5Yik5pat5b2T5YmN6IqC54K55piv5ZCm5Zyo6YCJ5Lit5YiX6KGo5Lit77yM5aaC5p6c5ZyoXG4gICAgICAgICAgICAvLyDmiJHku6zlhrPlrprmj5LlhaXnmoTooYzkuLrmmK/mibnph4/mj5LlhaXmiYDmnInpgInkuK3nmoToioLngrlcbiAgICAgICAgICAgIGxldCBwYXJlbnRzID0ganNvbi5pbnNlcnQgPT09ICdpbnNpZGUnID8gW2pzb24udG9dIDogW3RvUGFyZW50VXVpZF07XG4gICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdpbnNpZGUnICYmIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhqc29uLnRvKSkge1xuICAgICAgICAgICAgICAgIHBhcmVudHMgPSBbLi4ucGFuZWxEYXRhLmFjdC5zZWxlY3RzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHJlY29yZGluZ1xuICAgICAgICAgICAgY29uc3QgdW5kb0lEID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnYmVnaW4tcmVjb3JkaW5nJywgcGFyZW50cyk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5ld1V1aWRzID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmNvbmZpZy5jcmVhdGFibGVUeXBlcy5pbmNsdWRlcyhhc3NldC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldFV1aWQgPSBhc3NldC52YWx1ZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhcmVudCBvZiBwYXJlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWwhuiiq+azqOWFpeaVsOaNrueahOWvueixoVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdG9Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZtLmFkZE5vZGUucGFyZW50ID0gcGFyZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1V1aWQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiBhc3NldC51bmxpbmtQcmVmYWIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjYW52YXNSZXF1aXJlZDogYXNzZXQuY2FudmFzUmVxdWlyZWQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZtLmFkZE5vZGUucGFyZW50ID0gJyc7XG5cbiAgICAgICAgICAgICAgICAgICAgbmV3VXVpZHMucHVzaChuZXdVdWlkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4iuatpeW3suaWsOWinuWujOavlVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0b0FyciA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3RvUGFyZW50VXVpZF07XG4gICAgICAgICAgICAgICAgY29uc3QgdG9JbmRleCA9IHRvQXJyLmluZGV4T2YoanNvbi50byk7XG5cbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdG9JbmRleCAtIHRvQXJyLmxlbmd0aDsgLy8g55uu5qCH57Si5byV5YeP5Y676Ieq6Lqr57Si5byVXG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA8IDAgJiYganNvbi5pbnNlcnQgPT09ICdhZnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCP5LqOMOeahOWBj+enu+m7mOiupOaYr+aOkuWcqOebruagh+WFg+e0oOS5i+WJje+8jOWmguaenOaYryBhZnRlciDopoEgKzFcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPiAwICYmIGpzb24uaW5zZXJ0ID09PSAnYmVmb3JlJykge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpKfkuo4w55qE5YGP56e76buY6K6k5piv5o6S5Zyo55uu5qCH5YWD57Sg5LmL5ZCO77yM5aaC5p6c5pivIGJlZm9yZSDopoEgLTFcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0IC09IDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5Zyo54i257qn6YeM5bmz56e7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEubW92ZU5vZGUodG9QYXJlbnRVdWlkLCB0b0Fyci5sZW5ndGgsIG9mZnNldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChuZXdVdWlkcy5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2VuZC1yZWNvcmRpbmcnLCB1bmRvSUQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjYW5jZWwtcmVjb3JkaW5nJywgdW5kb0lEKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6YCJ5Lit5paw55qE6IqC54K5XG4gICAgICAgICAgICB2bS5pcGNTZWxlY3QobmV3VXVpZHMpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlpI3liLZcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBjb3B5KHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb3BpZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGNvcGllcyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjb3BpZXMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmFsaWRVdWlkcyA9IGNvcGllcy5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZSAmJiAhdXRpbHMuY2FuTm90Q29weU5vZGUobm9kZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gdXRpbHMuZmlsdGVyQ2hpbGRyZW4odmFsaWRVdWlkcyk7XG5cbiAgICAgICAgYXdhaXQgdHJlZURhdGEuY29weU5vZGUoY29waWVkVXVpZHMpO1xuXG4gICAgICAgIC8vIOe7meWkjeWItueahOWKqOS9nOWPjemmiOaIkOWKn1xuICAgICAgICBjb3BpZWRVdWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHV1aWQsICdsaWdodCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog57KY6LS0XG4gICAgICogQHBhcmFtIHV1aWQg55uu5qCH6IqC54K577yMICFwYXN0ZUFzQ2hpbGQg5pe26buY6K6k57KY6LS05Yiw55uu5qCH6IqC54K55ZCM57qnXG4gICAgICogQHBhcmFtIGtlZXBXb3JsZFRyYW5zZm9ybSDmmK/lkKbkv53mjIHkuJbnlYzlnZDmoIdcbiAgICAgKiBAcGFyYW0gcGFzdGVBc0NoaWxkIOaYr+WQpueymOi0tOS4uuebruagh+iKgueCueeahOWtkOiKgueCuVxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHBhc3RlKHV1aWQ6IHN0cmluZywga2VlcFdvcmxkVHJhbnNmb3JtID0gZmFsc2UsIHBhc3RlQXNDaGlsZD86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dWlkKSB7XG4gICAgICAgICAgICB1dWlkID0gdGhpcy5nZXRGaXJzdFNlbGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LyY5YWI5aSE55CG5Ymq5YiH55qE5oOF5Ya1XG4gICAgICAgIGNvbnN0IG5vZGVzSW5mbyA9IEVkaXRvci5DbGlwYm9hcmQucmVhZCgnbm9kZXMtaW5mbycpIGFzIGFueTtcbiAgICAgICAgaWYgKG5vZGVzSW5mbyAmJiBub2Rlc0luZm8udHlwZSA9PT0gJ2N1dCcgJiYgbm9kZXNJbmZvLnV1aWRzLmxlbmd0aCAmJiBFZGl0b3IuUHJvamVjdC5wYXRoID09PSBub2Rlc0luZm8ucHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1dFV1aWRzID0gbm9kZXNJbmZvLnV1aWRzO1xuICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkcyA9IHV0aWxzLmZpbHRlckNoaWxkcmVuKGN1dFV1aWRzKTtcbiAgICAgICAgICAgIGlmICh2YWxpZFV1aWRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtb3ZlRGF0YTogRHJhZ05vZGUgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLk5vZGUnLFxuICAgICAgICAgICAgICAgIHRvOiB1dWlkLFxuICAgICAgICAgICAgICAgIGluc2VydDogJ2luc2lkZScsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbDogdmFsaWRVdWlkcy5tYXAoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdXVpZCwgdHlwZTogJ2NjLk5vZGUnIH07XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtLFxuICAgICAgICAgICAgICAgIGNvcHk6IGZhbHNlLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShtb3ZlRGF0YSk7XG5cbiAgICAgICAgICAgIC8vIOa4heepuuWJquWIh+adv1xuICAgICAgICAgICAgRWRpdG9yLkNsaXBib2FyZC5jbGVhcigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+q5Y+v5Zyo6aG555uu5YaF5aSN5Yi257KY6LS0XG4gICAgICAgIGlmIChub2Rlc0luZm8gJiYgbm9kZXNJbmZvLnR5cGUgPT09ICdjb3B5JyAmJiBub2Rlc0luZm8udXVpZHMubGVuZ3RoICYmIEVkaXRvci5Qcm9qZWN0LnBhdGggPT09IG5vZGVzSW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSBub2Rlc0luZm8udXVpZHM7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZFV1aWRzID0gdXRpbHMuZmlsdGVyQ2hpbGRyZW4oY29waWVkVXVpZHMpO1xuICAgICAgICAgICAgICAgIC8vIOaWsOeahOmAieS4remhueWIh+aNouS4uuaWsOiKgueCuVxuICAgICAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLnBhc3RlTm9kZSh1dWlkLCB2YWxpZFV1aWRzLCBrZWVwV29ybGRUcmFuc2Zvcm0sIHBhc3RlQXNDaGlsZCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWJquWIh1xuICAgICAqIOWJquWIh+aYr+mihOWumueahOihjOS4uu+8jOWPquacieWGjeaJp+ihjOeymOi0tOaTjeS9nOaJjeS8mueUn+aViFxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGN1dCh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3V0cyA9IFtdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgY3V0cyA9IHV1aWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmnaXoh6rlj7Plh7voj5zljZXnmoTljZXkuKrpgInkuK3vvIzlj7Plh7voioLngrnkuI3lnKjlt7LpgInpobnnm67ph4xcbiAgICAgICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gW3V1aWRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjdXRzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDov4fmu6TkuI3lj6/liarliIfnmoToioLngrlcbiAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlICYmICF1dGlscy5jYW5Ob3RDdXROb2RlKG5vZGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY3V0VXVpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnu5nlpI3liLbnmoTliqjkvZzlj43ppojmiJDlip9cbiAgICAgICAgY3V0VXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZCh1dWlkLCAnbGlnaHQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g6YCa55+lIHNjZW5lIOWQjOatpeaJp+ihjCBjdXRcbiAgICAgICAgYXdhaXQgdHJlZURhdGEuY3V0Tm9kZShjdXRVdWlkcyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlhYvpmoZcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBkdXBsaWNhdGUodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGR1cGxpY2F0ZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5p2l6Ieq5Y+z5Ye76I+c5Y2V55qE5Y2V5Liq6YCJ5Lit77yM5Y+z5Ye76IqC54K55LiN5Zyo5bey6YCJ6aG555uu6YeMXG4gICAgICAgICAgICBpZiAodXVpZCAmJiAhcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgZHVwbGljYXRlcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZHVwbGljYXRlcyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5LiN5Y+v5aSN5Yi255qE6IqC54K5XG4gICAgICAgIGNvbnN0IHV1aWRzID0gdXRpbHMuZmlsdGVyQ2hpbGRyZW4oZHVwbGljYXRlcykuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUgJiYgIXV0aWxzLmNhbk5vdENvcHlOb2RlKG5vZGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOWPr+iDveaYr+aJuemHj+aTjeS9nO+8jOe7meWKoOS4qumUgVxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZHVwbGljYXRlTm9kZSh1dWlkcyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnp7vliqhcbiAgICAgKiBAcGFyYW0ganNvbiBEcmFnTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIG1vdmUoanNvbjogRHJhZ05vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFqc29uIHx8ICFqc29uLnRvIHx8ICFBcnJheS5pc0FycmF5KGpzb24uYWRkaXRpb25hbCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHV1aWRzID0ganNvbi5hZGRpdGlvbmFsLm1hcCgoaW5mbzogRHJhZ05vZGVJbmZvKSA9PiBpbmZvLnZhbHVlKTtcblxuICAgICAgICAvLyDnp7vliqjnmoTlhYPntKDmnInph43lj6BcbiAgICAgICAgaWYgKHV1aWRzLmluY2x1ZGVzKGpzb24udG8pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsIbooqvms6jlhaXmlbDmja7nmoTlr7nosaFcbiAgICAgICAgY29uc3QgdG9Ob2RlID0gdXRpbHMuZ2V0Tm9kZShqc29uLnRvKTtcbiAgICAgICAgY29uc3QgdG9QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQoanNvbi50byk7XG5cbiAgICAgICAgaWYgKCF0b05vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b05vZGUuaXNQcmVmYWJSb290ICYmIGpzb24uaW5zZXJ0ICE9PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgLy8g5LiN6IO956e75Yqo5Yiw5b2T5YmN57yW6L6R55qEIHByZWZhYiDmoLnoioLngrnnmoTliY3lkI5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b05vZGUuaXNTY2VuZSAmJiBqc29uLmluc2VydCAhPT0gJ2luc2lkZScpIHtcbiAgICAgICAgICAgIC8vIOaLluWKqOWIsOWcuuaZr+agueiKgueCueeahOWJjeWQjuS9jee9ru+8jOS5n+ebuOW9k+S6juaLlui/m+mHjOmdolxuICAgICAgICAgICAganNvbi5pbnNlcnQgPSAnaW5zaWRlJztcbiAgICAgICAgICAgIGF3YWl0IHZtLm1vdmUoanNvbik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50Tm9kZSA9IHRvTm9kZTtcbiAgICAgICAgaWYgKHRvUGFyZW50ICYmIFsnYmVmb3JlJywgJ2FmdGVyJ10uaW5jbHVkZXMoanNvbi5pbnNlcnQpKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlID0gdG9QYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZVV1aWQgPSBwYXJlbnROb2RlLnV1aWQ7XG5cbiAgICAgICAgLy8g5aSa6IqC54K555qE56e75Yqo77yM5qC55o2u546w5pyJ5o6S5bqP55qE6aG65bqP5omn6KGMXG4gICAgICAgIGNvbnN0IGZyb21VdWlkczogc3RyaW5nW10gPSB1dWlkc1xuICAgICAgICAgICAgLm1hcCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gdG9Ob2RlIOiKgueCueaYryBmcm9tTm9kZSDnmoTlrZDpm4bvvIzniLbkuI3og73np7vliLDlrZDph4zpnaIsIOWPlua2iOenu+WKqFxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5pc0FJbmNsdWRlQih1dWlkLCBqc29uLnRvKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmcm9tUGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghZnJvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChqc29uLmluc2VydCA9PT0gJ2luc2lkZScgJiYgcGFyZW50Tm9kZSA9PT0gZnJvbVBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJlZURhdGEudXVpZFRvSW5kZXhbYV0gLSB0cmVlRGF0YS51dWlkVG9JbmRleFtiXTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOaXoOiKgueCueenu+WKqFxuICAgICAgICBpZiAoIWZyb21VdWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmSiOWvueaJuemHj+aTjeS9nO+8jOmcgOimgeWFiOaKiuW+heaUueWKqOeahOiKgueCuemDveaUtumbhui1t+adpe+8jOeEtuWQjuWGjeaJp+ihjFxuICAgICAgICBjb25zdCBjaGFuZ2VkUGFyZW50czogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcbiAgICAgICAgY2hhbmdlZFBhcmVudHNbcGFyZW50Tm9kZVV1aWRdID0gdHJ1ZTtcbiAgICAgICAgZm9yIChjb25zdCBmcm9tVXVpZCBvZiBmcm9tVXVpZHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlID0gdXRpbHMuZ2V0Tm9kZShmcm9tVXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghZnJvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZnJvbVBhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2Zyb21VdWlkXTtcblxuICAgICAgICAgICAgaWYgKHBhcmVudE5vZGVVdWlkICE9PSBmcm9tUGFyZW50VXVpZCkge1xuICAgICAgICAgICAgICAgIGNoYW5nZWRQYXJlbnRzW2Zyb21QYXJlbnRVdWlkXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1bmRvSUQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdiZWdpbi1yZWNvcmRpbmcnLCBPYmplY3Qua2V5cyhjaGFuZ2VkUGFyZW50cykpO1xuICAgICAgICBcbiAgICAgICAgLy8g5byA5aeL5omn6KGMXG4gICAgICAgIGxldCBhZGp1c3RJbmRleCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgZnJvbVV1aWQgb2YgZnJvbVV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBmcm9tTm9kZSA9IHV0aWxzLmdldE5vZGUoZnJvbVV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gZnJvbVV1aWQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtmcm9tVXVpZF07XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlVXVpZCAhPT0gZnJvbVBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5zZXRQYXJlbnQocGFyZW50Tm9kZVV1aWQsIFtmcm9tVXVpZF0sIGpzb24ua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFbJ2JlZm9yZScsICdhZnRlciddLmluY2x1ZGVzKGpzb24uaW5zZXJ0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnjrDmnIkgYXBpIOS4i++8jOi/meS4gOatpeW+l+afpeivouWunuaXtuS9jee9ru+8jOaJjeWlveWHhuehruenu+WKqOWIsOaWsOS9jee9rlxuICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZUluZm8gPSBhd2FpdCB0cmVlRGF0YS5nZXREdW1wRGF0YShwYXJlbnROb2RlLnV1aWQpO1xuICAgICAgICAgICAgY29uc3QgdG9Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IHRvTm9kZS51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IGZyb21Ob2RlLnV1aWQpO1xuXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdG9Ob2RlSW5kZXggLSBmcm9tTm9kZUluZGV4O1xuXG4gICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdhZnRlcicpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlsI/kuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvliY3vvIzlpoLmnpzmmK8gYWZ0ZXIg6KaBICsxXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gYWRqdXN0SW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChqc29uLmluc2VydCA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpKfkuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvlkI7vvIzlpoLmnpzmmK8gYmVmb3JlIOimgSAtMVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgLT0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLm1vdmVOb2RlKHBhcmVudE5vZGUudXVpZCwgZnJvbU5vZGVJbmRleCwgb2Zmc2V0KTtcblxuICAgICAgICAgICAgYWRqdXN0SW5kZXgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2VuZC1yZWNvcmRpbmcnLCB1bmRvSUQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5qCR5b2i5pWw5o2u5bey5pS55Y+YXG4gICAgICog5aaC6IqC54K55aKe5Yig5pS577yM5piv6L6D5aSn55qE5Y+Y5Yqo77yM6ZyA6KaB6YeN5paw6K6h566X5ZCE5Liq6YWN5aWX5pWw5o2uXG4gICAgICovXG4gICAgcmVuZGVyKCkge1xuICAgICAgICAvLyDlrrnlmajnmoTmlbTkvZPpq5jluqZcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwudHJlZUhlaWdodCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5sZW5ndGggKiBwYW5lbERhdGEuY29uZmlnLm5vZGVIZWlnaHQgKyBwYW5lbERhdGEuY29uZmlnLnBhZGRpbmcgKiAyO1xuXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmFsbEV4cGFuZCA9IHV0aWxzLmlzQWxsRXhwYW5kKCk7XG5cbiAgICAgICAgd2hpbGUgKHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWR5VHdpbmtsZSA9IHBhbmVsRGF0YS5hY3QudHdpbmtsZVF1ZXVlcy5zaGlmdCgpO1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQocmVhZHlUd2lua2xlLnV1aWQsIHJlYWR5VHdpbmtsZS5hbmltYXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YeN5paw5riy5p+T5Ye65qCR5b2iXG4gICAgICAgIHZtLmZpbHRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Zyo5pWw5o2u5LiN5Y+Y55qE5oOF5Ya15LiL77yM5qC55o2u5rua5Yqo5L2N572u5riy5p+T5qCR5b2iXG4gICAgICovXG4gICAgZmlsdGVyKCkge1xuICAgICAgICAvLyDpnaLmnb/mi5bmi73liLAgdGFiIOmHjOS4jeS8mueri+WNs+aYvuekuu+8jOmcgOimgeaJi+WKqOWIh+aNoiB0YWLvvIzlnKjliIfmjaLliY3pnaLmnb8gaGVpZ2h0PTBcbiAgICAgICAgLy8g6KeE6YG/IGhlaWdodD0wIOmdnuato+W4uOaDheWGteS4i+W+gOS4i+aJp+ihjOmUmeivr+iuoeeul++8jOWcqOWIh+aNoiB0YWIg5ZCO5Lya5omn6KGMIHNob3cg6L+b6KGM5q2j56Gu55qE6K6h566X5riy5p+TXG4gICAgICAgIGlmICghcGFuZWxEYXRhLiQucGFuZWwudmlld0hlaWdodCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIOWFiOa4heepuu+8jOi/meenjei1i+WAvOacuuWItuaJjeiDveWIt+aWsCB2dWXvvIzogIwgLmxlbmd0aCA9IDAg5LiN6KGMXG4gICAgICAgIHZtLm5vZGVzID0gW107XG5cbiAgICAgICAgY29uc3Qgbm9kZUhlaWdodCA9IHBhbmVsRGF0YS5jb25maWcubm9kZUhlaWdodDtcbiAgICAgICAgY29uc3Qgc2Nyb2xsVG9wID0gdm0uc2Nyb2xsVG9wO1xuXG4gICAgICAgIGNvbnN0IHRvcCA9IHNjcm9sbFRvcCAlIG5vZGVIZWlnaHQ7XG4gICAgICAgIC8vIOeul+WHuuWPr+inhuWMuuWfn+eahCB0b3Ag5pyA5bCP5YC8XG4gICAgICAgIGNvbnN0IG1pbiA9IHNjcm9sbFRvcCAtIHRvcDtcbiAgICAgICAgLy8g5pyA5aSn5YC8XG4gICAgICAgIGNvbnN0IG1heCA9IG1pbiArIHBhbmVsRGF0YS4kLnBhbmVsLnZpZXdIZWlnaHQ7XG5cbiAgICAgICAgdm0uJGVsLnN0eWxlLnRvcCA9IGAtJHt0b3B9cHhgO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5yb3VuZChtaW4gLyBub2RlSGVpZ2h0KTtcbiAgICAgICAgY29uc3QgZW5kID0gTWF0aC5jZWlsKG1heCAvIG5vZGVIZWlnaHQpICsgMTtcblxuICAgICAgICB2bS5ub2RlcyA9IHRyZWVEYXRhLm91dHB1dERpc3BsYXkoc3RhcnQsIGVuZCk7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KHZtLnNjcm9sbEludG9WaWV3VGltZUlkKTtcbiAgICAgICAgdm0uc2Nyb2xsSW50b1ZpZXdUaW1lSWQgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICh2bS5pbnRvVmlld0J5VXNlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRvbmUgPSBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyh2bS5pbnRvVmlld0J5VXNlcik7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDUwKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/lOWbnuiKgueCuSB1dWlkXG4gICAgICovXG4gICAgZ2V0Rmlyc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzWzBdO1xuXG4gICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHZtLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6YCJ5Lit5YiX6KGo5pWw57uE5Lit5pyA5ZCO5LiA5Liq6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue56m6XG4gICAgICovXG4gICAgZ2V0TGFzdFNlbGVjdCgpIHtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICBpZiAobGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFuZWxEYXRhLmFjdC5zZWxlY3RzW2xlbmd0aCAtIDFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHZtLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6I635Y+W6KeG6KeJ5LiK5qCR5b2i5LiK5LiL5YiX6KGo5Lit77yM56ys5LiA5Liq6YCJ5Lit6IqC54K577yM5rKh5pyJ6YCJ5Lit6aG577yM6L+U5Zue6aG25bGC5qC56IqC54K5XG4gICAgICovXG4gICAgZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCkge1xuICAgICAgICBsZXQgdXVpZCA9ICcnO1xuICAgICAgICBsZXQgaW5kZXggPSBJbmZpbml0eTtcblxuICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuZm9yRWFjaCgoc2VsZWN0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICh0cmVlRGF0YS51dWlkVG9JbmRleFtzZWxlY3RdIDwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IHRyZWVEYXRhLnV1aWRUb0luZGV4W3NlbGVjdF07XG4gICAgICAgICAgICAgICAgdXVpZCA9IHNlbGVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHV1aWQgfHwgdHJlZURhdGEubm9kZVRyZWU/LnV1aWQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bop4bop4nkuIrmoJHlvaLkuIrkuIvliJfooajkuK3vvIznrKzkuIDkuKrpgInkuK3oioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57pobblsYLmoLnoioLngrlcbiAgICAgKi9cbiAgICBnZXRMYXN0U2VsZWN0U29ydEJ5RGlzcGxheSgpIHtcbiAgICAgICAgbGV0IHV1aWQgPSAnJztcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcblxuICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuZm9yRWFjaCgoc2VsZWN0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICh0cmVlRGF0YS51dWlkVG9JbmRleFtzZWxlY3RdID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IHRyZWVEYXRhLnV1aWRUb0luZGV4W3NlbGVjdF07XG4gICAgICAgICAgICAgICAgdXVpZCA9IHNlbGVjdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHV1aWQgfHwgdHJlZURhdGEubm9kZVRyZWU/LnV1aWQ7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDov5Tlm57moJHlvaLnrKzkuIDkuKroioLngrlcbiAgICAgKiDnrKzkuIDkuKroioLngrnvvIzkuI3kuIDlrprmmK/moLnoioLngrnvvIzkvovlpoLlnKjmkJzntKLnmoTmg4XlhrXkuItcbiAgICAgKi9cbiAgICBnZXRGaXJzdENoaWxkKCkge1xuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRyZWVEYXRhLm5vZGVUcmVlPy51dWlkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRyZWVEYXRhLmRpc3BsYXlBcnJheVswXTtcbiAgICB9LFxuICAgIGlzQWN0aXZlKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNBY3RpdmUodXVpZCk7XG4gICAgfSxcbiAgICBpc0V4cGFuZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzRXhwYW5kKHV1aWQpO1xuICAgIH0sXG4gICAgaXNQYXJlbnQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc1BhcmVudCh1dWlkKTtcbiAgICB9LFxuICAgIGlzU2VsZWN0ZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc1NlbGVjdGVkKHV1aWQpO1xuICAgIH0sXG4gICAgaXNBbmltYXRpbmcodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc0FuaW1hdGluZyh1dWlkIHx8IHBhbmVsRGF0YS5hY3QuYW5pbWF0aW9uVXVpZCk7XG4gICAgfSxcbiAgICBpc1NlYXJjaGluZygpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzU2VhcmNoaW5nKCk7XG4gICAgfSxcbiAgICBhc3luYyBkaWFsb2dFcnJvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICAgICAgYXdhaXQgRWRpdG9yLkRpYWxvZy5lcnJvcihFZGl0b3IuSTE4bi50KGBoaWVyYXJjaHkub3BlcmF0ZS4ke21lc3NhZ2V9YCksIHtcbiAgICAgICAgICAgIHRpdGxlOiBFZGl0b3IuSTE4bi50KCdoaWVyYXJjaHkub3BlcmF0ZS5kaWFsb2dFcnJvcicpLFxuICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuLyoqXG4gKiB2dWUgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGF0YSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBub2RlczogW10sIC8vIOW9k+WJjeagkeW9ouWcqOWPr+inhuWMuuWfn+eahOiKgueCueaVsOaNrlxuICAgICAgICByZW5hbWVVdWlkOiAnJywgLy8g6ZyA6KaBIHJlbmFtZSDnmoToioLngrnnmoQgdXJs77yM5Y+q5pyJ5LiA5LiqXG4gICAgICAgIGFkZE5vZGU6IHtcbiAgICAgICAgICAgIC8vIOa3u+WKoOS4gOS4quaWsOiKgueCueWJjeeahOaVsOaNru+8jOmcgOimgeS6i+WJjemHjeWRveWQjVxuICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICBwYXJlbnQ6ICcnLFxuICAgICAgICAgICAgc2libGluZzogJycsXG4gICAgICAgIH0sXG4gICAgICAgIGludG9WaWV3QnlVc2VyOiAnJywgLy8g55So5oi35pON5L2c77ya6YCJ5Lit77yM5paw5aKe77yM56e75Yqo77yM57uZ5LqI5a6a5L2NXG4gICAgICAgIHNjcm9sbFRvcDogMCwgLy8g5b2T5YmN5qCR5b2i55qE5rua5Yqo5pWw5o2uXG4gICAgICAgIGRyb3BwYWJsZVR5cGVzOiBbXSxcbiAgICAgICAgdHdpbmtsZXM6IHt9LCAvLyDpnIDopoHpl6rng4HnmoQgdXVpZFxuICAgICAgICBjaGVja1NoaWZ0VXBEb3duTWVyZ2U6IHsgdXVpZDogJycsIGRpcmVjdGlvbjogJycgfSwgLy8gc2hpZnQgKyDnrq3lpLTlpJrpgInvvIzlop7lvLrkuqTkupLmlYjmnpxcbiAgICB9O1xufVxuXG4vKipcbiAqIHZtID0gdGhpc1xuICovXG5leHBvcnQgZnVuY3Rpb24gbW91bnRlZCgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgdm0gPSB0aGlzO1xufVxuIl19