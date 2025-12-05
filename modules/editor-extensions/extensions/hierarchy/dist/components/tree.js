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
exports.name = 'tree';
exports.template = fs_1.readFileSync(path_1.join(__dirname, '../../static/template/tree.html'), 'utf8');
exports.components = {
    'tree-node': require('./tree-node'),
};
exports.watch = {
    /**
     * scrollTop 变化，刷新树形
     * 当节点很多的情况下，requestAnimationFrame 可以避免卡顿
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
        json.sibling = utils.geLastExpandChildUuid(parent.uuid);
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
        vm.addNode.parent = '';
        vm.addNode.sibling = '';
        // 数据错误时取消
        if (!json || !json.parent) {
            return;
        }
        const parent = utils.getNode(json.parent);
        if (!parent) {
            return;
        }
        if (utils.canNotCreateNode(parent)) {
            // 父级不可创建节点
            return;
        }
        treeData.uuidToState[parent.uuid] = 'loading';
        vm.add(json);
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
            await Editor.Message.request('scene', 'create-node', json);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            panelData.$.panel.isOperating = false;
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
        // 保存历史记录
        Editor.Message.send('scene', 'snapshot');
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
            panelData.act.selects.forEach((select) => {
                const node = utils.getNode(select);
                if (!node) {
                    return;
                }
                // 删除允许删除
                if (!utils.canNotDeleteNode(node)) {
                    uuids.push(select);
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
     * @param value true or false
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
        Editor.Message.send('scene', 'snapshot');
        // 发送重名命数据
        const isSuccess = await Editor.Message.request('scene', 'set-property', {
            uuid: node.uuid,
            path: 'name',
            dump: {
                type: 'string',
                value: name,
            },
        });
        if (!isSuccess) {
            vm.dialogError('renameFail');
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
                    vm.toggle(node.uuid, true);
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
                    top = (treeData.displayArray.indexOf(utils.geLastExpandChildUuid(uuid)) + 1) * nodeHeight + padding;
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
        const data = JSON.parse(JSON.stringify(Editor.UI.DragArea.currentDragInfo)) || {};
        // cc.Scene 根节点
        data.to = vm.getFirstChild();
        data.insert = 'inside';
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
        // 保存历史记录
        Editor.Message.send('scene', 'snapshot');
        const uuids = [];
        const values = [];
        const { value, type, name } = json;
        let { additional } = json;
        vm.toggle(json.to, true);
        if (additional) {
            // 增加一处容错
            if (!Array.isArray(additional)) {
                additional = [additional];
            }
            additional.forEach((info) => {
                if (vm.droppableTypes.includes(info.type)) {
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
            const newUuids = [];
            for (const asset of values) {
                if (!panelData.config.creatableTypes.includes(asset.type)) {
                    continue;
                }
                // 将被注入数据的对象
                const toNode = utils.getNode(json.to);
                if (!toNode) {
                    return;
                }
                const assetUuid = asset.value;
                const toParentUuid = treeData.uuidToParentUuid[json.to];
                let parent = json.insert === 'inside' ? json.to : toParentUuid;
                // 拖到 prefab 根节点的顶部放置，需要转为放置在内部
                if (toNode.isPrefabRoot && json.insert !== 'inside') {
                    parent = json.to;
                    json.insert = 'inside';
                }
                const newUuid = await Editor.Message.request('scene', 'create-node', {
                    parent,
                    assetUuid,
                    name: asset.name,
                    type: asset.type,
                    unlinkPrefab: asset.unlinkPrefab,
                    canvasRequired: asset.canvasRequired,
                });
                newUuids.push(newUuid);
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
        // 将复制节点的 uuid 存放到统一的剪切板
        const copiedInfo = vm.uuidsToCopiedInfo(copiedUuids);
        Editor.Clipboard.write('hierarchy-copied-info', copiedInfo);
        // 给复制的动作反馈成功
        copiedUuids.forEach((uuid) => {
            utils.twinkle.add(uuid, 'light');
        });
    },
    /**
     * 粘贴
     * @param uuid 粘贴到这个节点里面
     * @param keepWorldTransform 是否保持世界坐标
     */
    async paste(uuid, keepWorldTransform = false) {
        if (utils.forbidOperate()) {
            return;
        }
        // 保存历史记录
        Editor.Message.send('scene', 'snapshot');
        if (!uuid) {
            uuid = this.getFirstSelect();
        }
        // 优先处理剪切的情况
        const cutInfo = Editor.Clipboard.read('hierarchy-cut-info');
        if (cutInfo && cutInfo.uuids.length && Editor.Project.path === cutInfo.projectPath) {
            const cutUuids = cutInfo.uuids;
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
        const copiedInfo = Editor.Clipboard.read('hierarchy-copied-info');
        if (!copiedInfo || !copiedInfo.uuids.length || copiedInfo.projectPath !== Editor.Project.path) {
            return;
        }
        const copiedUuids = copiedInfo.uuids;
        try {
            panelData.$.panel.isOperating = true;
            const validUuids = utils.filterChildren(copiedUuids);
            // 新的选中项切换为新节点
            await treeData.pasteNode(uuid, validUuids, keepWorldTransform);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            panelData.$.panel.isOperating = false;
        }
    },
    /**
     * 剪切
     * 剪切是预定的行为，只有再执行粘贴操作才会生效
     * @param uuid 节点
     */
    cut(uuid) {
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
        // 将剪切节点的 uuid 存放到统一的剪切板
        const cutInfo = vm.uuidsToCopiedInfo(cutUuids);
        Editor.Clipboard.write('hierarchy-cut-info', cutInfo);
    },
    /**
     * 将复制/剪切的 uuids 处理成剪切板的对象类型
     */
    uuidsToCopiedInfo(uuids) {
        return {
            projectPath: Editor.Project.path,
            uuids: uuids,
        };
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
        // 保存历史记录
        Editor.Message.send('scene', 'snapshot');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWIsK0JBQTRCO0FBQzVCLDJCQUFrQztBQUNsQyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUM1QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxZQUFZLEdBQVksS0FBSyxDQUFDO0FBRWxDLHNCQUFzQjtBQUN0QixJQUFJLFlBQWlCLENBQUM7QUFDdEIsSUFBSSxZQUFpQixDQUFDO0FBRVQsUUFBQSxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBRWQsUUFBQSxRQUFRLEdBQUcsaUJBQVksQ0FBQyxXQUFJLENBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFcEYsUUFBQSxVQUFVLEdBQUc7SUFDdEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUM7Q0FDdEMsQ0FBQztBQUVXLFFBQUEsS0FBSyxHQUFHO0lBQ2pCOzs7T0FHRztJQUNILFNBQVM7UUFDTCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztDQUNKLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztR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QUFXLENBQUMsSUFBWTtRQUNwQixPQUFPLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUNELFdBQVc7UUFDUCxPQUFPLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQ0QsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFlO1FBQzdCLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMscUJBQXFCLE9BQU8sRUFBRSxDQUFDLEVBQUU7WUFDckUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLCtCQUErQixDQUFDO1NBQ3hELENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSixDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFnQixJQUFJO0lBQ2hCLE9BQU87UUFDSCxLQUFLLEVBQUUsRUFBRTtRQUNULFVBQVUsRUFBRSxFQUFFO1FBQ2QsT0FBTyxFQUFFO1lBQ0wsc0JBQXNCO1lBQ3RCLElBQUksRUFBRSxFQUFFO1lBQ1IsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsRUFBRTtTQUNkO1FBQ0QsY0FBYyxFQUFFLEVBQUU7UUFDbEIsU0FBUyxFQUFFLENBQUM7UUFDWixjQUFjLEVBQUUsRUFBRTtRQUNsQixRQUFRLEVBQUUsRUFBRTtRQUNaLHFCQUFxQixFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsc0JBQXNCO0tBQzdFLENBQUM7QUFDTixDQUFDO0FBaEJELG9CQWdCQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsT0FBTztJQUNuQixhQUFhO0lBQ2IsRUFBRSxHQUFHLElBQUksQ0FBQztBQUNkLENBQUM7QUFIRCwwQkFHQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQWRkTm9kZSwgVHJlZU5vZGUsIERyYWdOb2RlSW5mbywgRHJhZ05vZGUsIERyb3BDYWxsYmFja0luZm8gfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhbmVsRGF0YSBmcm9tICcuL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi90cmVlLWRhdGEnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbmxldCB2bTogYW55ID0gbnVsbDtcbmxldCByZXF1ZXN0QW5pbWF0aW9uSWQ6IGFueTtcbmxldCBzZWxlY3RlZFRpbWVJZDogYW55O1xubGV0IGlzUmVmcmVzaGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG4vLyDnlKjkuo7or4bliKsgZHJhZyDmgqzlgZzvvIzoh6rliqjlsZXlvIDniLbnuqdcbmxldCBkcmFnT3ZlclV1aWQ6IGFueTtcbmxldCBkcmFnT3ZlclRpbWU6IGFueTtcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAndHJlZSc7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS90cmVlLmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgJ3RyZWUtbm9kZSc6IHJlcXVpcmUoJy4vdHJlZS1ub2RlJyksXG59O1xuXG5leHBvcnQgY29uc3Qgd2F0Y2ggPSB7XG4gICAgLyoqXG4gICAgICogc2Nyb2xsVG9wIOWPmOWMlu+8jOWIt+aWsOagkeW9olxuICAgICAqIOW9k+iKgueCueW+iOWkmueahOaDheWGteS4i++8jHJlcXVlc3RBbmltYXRpb25GcmFtZSDlj6/ku6Xpgb/lhY3ljaHpob9cbiAgICAgKi9cbiAgICBzY3JvbGxUb3AoKSB7XG4gICAgICAgIHZtLmZpbHRlcigpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDnv7vor5FcbiAgICAgKiBAcGFyYW0ga2V5IOS4jeW4pumdouadv+WQjeensOeahOagh+iusOWtl+esplxuICAgICAqL1xuICAgIHQoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLiQucGFuZWwudChrZXkpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSW6YOo5pWw5o2u5pu05paw5ZCO77yM5pu05paw5YaF6YOo5pWw5o2uXG4gICAgICovXG4gICAgdXBkYXRlKCkge1xuICAgICAgICBjb25zdCBkcm9wcGFibGVUeXBlcyA9IHZtLiRwYXJlbnQuZHJvcHBhYmxlVHlwZXMuY29uY2F0KHBhbmVsRGF0YS5jb25maWcuY3JlYXRhYmxlVHlwZXMpO1xuICAgICAgICB2bS5kcm9wcGFibGVUeXBlcyA9IGRyb3BwYWJsZVR5cGVzLmNvbmNhdChwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5riF56m65qCR5b2iXG4gICAgICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRyZWVEYXRhLmNsZWFyKCk7XG4gICAgICAgIHZtLnJlZnJlc2goKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIt+aWsOagkeW9olxuICAgICAqL1xuICAgIGFzeW5jIHJlZnJlc2goKSB7XG4gICAgICAgIGlmIChpc1JlZnJlc2hpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlzUmVmcmVzaGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8g5bu26L+fIDIwMCBtcyDliLfmlrDvvIzlu7bov5/mnJ/pl7Tlj6/ku6XlkIjlubblpJrmrKEgY2hhbmdlZCDkuqfnlJ/nmoTliLfmlrDmjIfku6TvvIznvJPop6PmgKfog73pl67pophcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMjAwKSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLnJlc2V0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlzUmVmcmVzaGluZyA9IGZhbHNlO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YOo6YCJ5LitXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgc2VsZWN0QWxsKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB0cmVlRGF0YS5kaXNwbGF5QXJyYXkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXVpZCA9IHV1aWQgfHwgdm0uZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCk7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0gfHwgdXVpZDsgLy8gcGFyZW50VXVpZCDkuLrnqbrmmK/moLnoioLngrnvvIzovazkuLroh6rouqsgdXVpZFxuICAgICAgICBjb25zdCBzaWJsaW5nVXVpZHMgPSB1dGlscy5nZXRDaGlsZHJlblV1aWRzKHBhcmVudFV1aWQpO1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgIGNvbnN0IGlzSW5jbHVkZWQgPSBjdXJyZW50U2VsZWN0cy5pbmNsdWRlcyh1dWlkKTtcblxuICAgICAgICBsZXQgc2libGluZ3NBbGxJbiA9IHRydWU7XG4gICAgICAgIHNpYmxpbmdVdWlkcy5mb3JFYWNoKChzaWJsaW5nVXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhzaWJsaW5nVXVpZCkpIHtcbiAgICAgICAgICAgICAgICBzaWJsaW5nc0FsbEluID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzaWJsaW5nc0FsbEluKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzSW5jbHVkZWQpIHtcbiAgICAgICAgICAgICAgICAvLyDliKDpmaTotoXov4fojIPlm7TnmoTlt7LpgInkuK3oioLngrlcbiAgICAgICAgICAgICAgICBjdXJyZW50U2VsZWN0cy5mb3JFYWNoKChzZWxlY3Q6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNpYmxpbmdVdWlkcy5pbmNsdWRlcyhzZWxlY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgc2VsZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBzaWJsaW5nVXVpZHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdub2RlJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzLmlzUGFyZW50KHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgc2libGluZ1V1aWRzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3V1aWRdLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VsZWN0Q2xlYXIoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkcyBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAqL1xuICAgIHNlbGVjdGVkKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2godXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IHV1aWQ7XG5cbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6Ugc2hpZnQg5aSa6YCJ55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICB1bnNlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVVzZXIgPT09IHV1aWQpIHtcbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmgaLlpI3pgInkuK3nirbmgIFcbiAgICAgKi9cbiAgICByZXNlbGVjdGVkKCkge1xuICAgICAgICBjb25zdCB1dWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ25vZGUnKS5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4gISF0cmVlRGF0YS51dWlkVG9Ob2RlW3V1aWRdKTtcbiAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2bS5zZWxlY3RlZCh1dWlkcyk7XG5cbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChzZWxlY3RlZFRpbWVJZCk7XG4gICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlVc2VyKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsgY2xpY2sg5aSa6YCJXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgc2hpZnRDbGljayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBkaXNwbGF5QXJyYXkgfSA9IHRyZWVEYXRhO1xuXG4gICAgICAgIGNvbnN0IGZpcnN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZihwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF0pO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoZmlyc3RJbmRleCAhPT0gLTEgfHwgbGFzdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGZpcnN0SW5kZXggPD0gbGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZpcnN0SW5kZXg7IGkgPD0gbGFzdEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0cy5wdXNoKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA+PSBsYXN0SW5kZXg7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2bS5pcGNTZWxlY3Qoc2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBjdHJsICsgY2xpY2sg6YCJ5Lit5oiW5Y+W5raI6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgY3RybENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgdXVpZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDph43mlrDpgInkuK3oioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBpcGNTZWxlY3QodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5qCR5b2i5LiK55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgaXBjU2VsZWN0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICBjb25zdCB1dWlkID0gdGhpcy5nZXRGaXJzdENoaWxkKCk7XG4gICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnqbrnmb3lpITngrnlh7vvvIzlj5bmtojpgInkuK1cbiAgICAgKi9cbiAgICBjbGljaygpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yib5bu66IqC54K55YmN5ZCN56ew5LqL5YmN5aSE55CGXG4gICAgICogQHBhcmFtIGpzb24gQWRkTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGFkZFRvKGpzb246IEFkZE5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb24ucGFyZW50KSB7XG4gICAgICAgICAgICBqc29uLnBhcmVudCA9IHRoaXMuZ2V0Rmlyc3RTZWxlY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudDogVHJlZU5vZGUgfCBudWxsID0gYXdhaXQgdXRpbHMuZ2V0UGFyZW50V2hlbkFkZE5vZGUoanNvbik7XG5cbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtLnRvZ2dsZShqc29uLnBhcmVudCwgdHJ1ZSk7XG4gICAgICAgIGpzb24ucGFyZW50ID0gcGFyZW50LnV1aWQ7XG5cbiAgICAgICAgLy8g6K6+572u5pi+56S65L2N572u55qE55uu5qCH6IqC54K5XG4gICAgICAgIGpzb24uc2libGluZyA9IHV0aWxzLmdlTGFzdEV4cGFuZENoaWxkVXVpZChwYXJlbnQudXVpZCk7XG4gICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGpzb24uc2libGluZyk7XG5cbiAgICAgICAganNvbi5uYW1lID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLW5hbWUnLCBqc29uLm5hbWUsIGpzb24ucGFyZW50KTtcbiAgICAgICAganNvbi5uYW1lSW5jcmVhc2UgPSBmYWxzZTtcblxuICAgICAgICB2bS5hZGROb2RlID0ganNvbjtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaWsOWinuiKgueCue+8jOS6i+WJjemHjeWRveWQjeWQjuaOpeaUtuaVsOaNrlxuICAgICAqIEBwYXJhbSBqc29uIEFkZE5vZGVcbiAgICAgKi9cbiAgICBhZGRDb25maXJtKGpzb24/OiBBZGROb2RlKSB7XG4gICAgICAgIC8vIOaWsOWinueahOi+k+WFpeahhua2iOWksVxuICAgICAgICB2bS5hZGROb2RlLnBhcmVudCA9ICcnO1xuICAgICAgICB2bS5hZGROb2RlLnNpYmxpbmcgPSAnJztcblxuICAgICAgICAvLyDmlbDmja7plJnor6/ml7blj5bmtohcbiAgICAgICAgaWYgKCFqc29uIHx8ICFqc29uLnBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuZ2V0Tm9kZShqc29uLnBhcmVudCk7XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbHMuY2FuTm90Q3JlYXRlTm9kZShwYXJlbnQpKSB7XG4gICAgICAgICAgICAvLyDniLbnuqfkuI3lj6/liJvlu7roioLngrlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3BhcmVudC51dWlkXSA9ICdsb2FkaW5nJztcbiAgICAgICAgdm0uYWRkKGpzb24pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogaXBjIOWPkei1t+WIm+W7uuiKgueCuVxuICAgICAqIEBwYXJhbSBqc29uIEFkZE5vZGVcbiAgICAgKi9cbiAgICBhc3luYyBhZGQoanNvbjogQWRkTm9kZSkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLW5vZGUnLCBqc29uKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K55bey5re75Yqg5Yiw5Zy65pmvXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgYWRkZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHZtLnJlZnJlc2goKTtcblxuICAgICAgICBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZXMucHVzaCh7IHV1aWQsIGFuaW1hdGlvbjogJ3NocmluaycgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmm7TmlrDmoJHlvaLoioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBjaGFuZ2VkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICB2bS5yZWZyZXNoKCk7XG5cbiAgICAgICAgLy8g5qC56IqC54K55aSq6aKR57mB5LqG77yM5LiN6KaB6Zeq54OBXG4gICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUgfHwgbm9kZS5pc1NjZW5lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIoOmZpFxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L+d5a2Y5Y6G5Y+y6K6w5b2VXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG5cbiAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgLy8g5aaC5p6c6K+l6IqC54K55rKh5pyJ6KKr6YCJ5Lit77yM5YiZ5Y+q5piv5Yig6Zmk5q2k5Y2V5LiqXG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWFgeiuuOWIoOmZpFxuICAgICAgICAgICAgaWYgKCF1dGlscy5jYW5Ob3REZWxldGVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZGVsZXRlTm9kZSh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWmguaenOivpeiKgueCueaYr+iiq+mAieS4reS6hu+8jOihqOaYjuimgeWIoOmZpOaJgOaciemAieS4remhuVxuICAgICAgICAgICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuZm9yRWFjaCgoc2VsZWN0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZShzZWxlY3QpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWIoOmZpOWFgeiuuOWIoOmZpFxuICAgICAgICAgICAgICAgIGlmICghdXRpbHMuY2FuTm90RGVsZXRlTm9kZShub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB1dWlkcy5wdXNoKHNlbGVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5kZWxldGVOb2RlKHV1aWRzKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5LuO5qCR5b2i5Yig6Zmk6IqC54K5XG4gICAgICovXG4gICAgZGVsZXRlZCgpIHtcbiAgICAgICAgdm0ucmVmcmVzaCgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K555qE5oqY5Y+g5YiH5o2iXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIHZhbHVlIHRydWUgb3IgZmFsc2VcbiAgICAgKiBAcGFyYW0gbG9vcCDmmK/lkKblkJHlrZDpm4blvqrnjq9cbiAgICAgKi9cbiAgICB0b2dnbGUodXVpZDogc3RyaW5nLCBleHBhbmQ6IGJvb2xlYW4sIGxvb3A/OiBib29sZWFuKSB7XG4gICAgICAgIGlmIChsb29wKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cmVlRGF0YS50b2dnbGVFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YOo6IqC54K55oqY5Y+g5oiW5bGV5byAXG4gICAgICovXG4gICAgYWxsVG9nZ2xlKCkge1xuICAgICAgICBpZiAoIXRyZWVEYXRhLm5vZGVUcmVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpc0V4cGFuZCA9IHV0aWxzLmlzQWxsRXhwYW5kKCk7XG4gICAgICAgIGNvbnN0IHBhcmVudHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0c0xlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIGlmIChzZWxlY3RzTGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnRVdWlkID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzW2ldO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF1dGlscy5pc1BhcmVudChwYXJlbnRVdWlkKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtwYXJlbnRVdWlkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRzLmluY2x1ZGVzKHBhcmVudFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmVlRGF0YS50b2dnbGVFeHBhbmQocGFyZW50VXVpZCwgIWlzRXhwYW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudHMucHVzaChwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnRzLnB1c2godHJlZURhdGEubm9kZVRyZWUudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQocGFyZW50c1tpXSwgIWlzRXhwYW5kKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5LiK5LiL5bem5Y+zIOaMiemUrlxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24g5pa55ZCRXG4gICAgICovXG4gICAgdXBEb3duTGVmdFJpZ2h0KGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGxhc3QgPSB2bS5nZXRMYXN0U2VsZWN0KCk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgaWYgKCF1dGlscy5pc0V4cGFuZChsYXN0KSkge1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShsYXN0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bbGFzdF07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZHJlbikgJiYgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGNoaWxkcmVuWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgaWYgKHV0aWxzLmlzRXhwYW5kKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGxhc3QsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbbGFzdF07XG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KHBhcmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBzaWJsaW5ncyA9IHV0aWxzLmdldFNpYmxpbmcobGFzdCk7XG4gICAgICAgICAgICBsZXQgY3VycmVudDtcbiAgICAgICAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndXAnOlxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gc2libGluZ3NbMV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2Rvd24nOlxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gc2libGluZ3NbMl07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChjdXJyZW50LnV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmjInkvY8gc2hpZnQg6ZSu77yM5ZCM5pe25LiK5LiL6YCJ5oupXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICBhc3luYyBzaGlmdFVwRG93bihkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBsZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IFtsYXN0LCBsYXN0UHJldiwgbGFzdE5leHRdID0gdXRpbHMuZ2V0U2libGluZyhwYW5lbERhdGEuYWN0LnNlbGVjdHNbbGVuZ3RoIC0gMV0pO1xuICAgICAgICBjb25zdCBoYXNMYXN0UHJldiA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgY29uc3QgaGFzTGFzdE5leHQgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMobGFzdE5leHQudXVpZCk7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3VwJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0UHJldikge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgbGFzdFByZXYudXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9IGxhc3RQcmV2LnV1aWQ7XG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNMYXN0TmV4dCkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgbGFzdC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcobGFzdFByZXYudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGxhc3RQcmV2LnV1aWQpLCAxKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2Rvd24nKSB7XG4gICAgICAgICAgICBpZiAoIWhhc0xhc3ROZXh0KSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gbGFzdE5leHQudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ25vZGUnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0TmV4dC51dWlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihsYXN0TmV4dC51dWlkKSwgMSk7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChsYXN0TmV4dC51dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ZCI5bm2IHNoaWZ0IOWkmumAiei/h+eoi+S4reWJjeWQjueahOW3sumAieS4remhuVxuICAgICAqIOavlOWmgiBhYiBjZGUg6aG55LitIGEsIGNkZSDlt7LpgInkuK0sIGIg5pyq6YCJ5LitXG4gICAgICog5b2T6YCJ5LitIGIg5pe277yM5ZCI5bm26YCJ5Lit6aG5IGNkZSDvvIzlubblsIbmnKvlsL7pgInkuK3pobnnmoTmjIfpkojmjIflkJEgZVxuICAgICAqL1xuICAgIHNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpIHtcbiAgICAgICAgaWYgKCF2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGtlZXBGaW5kTmV4dCA9IHRydWU7XG4gICAgICAgIGxldCBmaW5kVXVpZCA9IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkO1xuXG4gICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gJyc7IC8vIOmHjee9rlxuICAgICAgICBsZXQgbWF4TG9vcE51bWJlciA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChrZWVwRmluZE5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IHV0aWxzLmdldFNpYmxpbmcoZmluZFV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWFyciB8fCAhYXJyWzFdIHx8ICFhcnJbMl0gfHwgIW1heExvb3BOdW1iZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbmRVdWlkID0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9PT0gJ2Rvd24nID8gYXJyWzJdLnV1aWQgOiBhcnJbMV0udXVpZDtcbiAgICAgICAgICAgIG1heExvb3BOdW1iZXItLTtcblxuICAgICAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhmaW5kVXVpZCkpIHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGZpbmRVdWlkKSwgMSk7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2goZmluZFV1aWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrZWVwRmluZE5leHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5p2l6Ieq5b+r5o236ZSu55qEIHJlbmFtZVxuICAgICAqL1xuICAgIGFzeW5jIGtleWJvYXJkUmVuYW1lKCkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodm0ucmVuYW1lVXVpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXVpZCA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG5cbiAgICAgICAgY29uc3QgYXNzZXQgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICBpZiAoYXNzZXQgJiYgIXV0aWxzLmNhbk5vdFJlbmFtZShhc3NldCkpIHtcbiAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHV1aWQpO1xuICAgICAgICAgICAgdm0ucmVuYW1lVXVpZCA9IHV1aWQ7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCuemHjeWQjeWRvVxuICAgICAqIOi/meaYr+W8guatpeeahO+8jOWPquWBmuWPkemAgVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqIEBwYXJhbSBuYW1lIOS4jemHjeWRveWQjeaXtuS8oCBuYW1lID0gbnVsbFxuICAgICAqL1xuICAgIGFzeW5jIHJlbmFtZSh1dWlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZyB8IG51bGwpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5riF56m6IHJlbmFtZSDnmoToioLngrlcbiAgICAgICAgdm0ucmVuYW1lVXVpZCA9ICcnO1xuXG4gICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUgfHwgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOS4jemHjeWRveWQjeeahOaDheWGtTpcbiAgICAgICAgICogbmFtZSA9IG51bGxcbiAgICAgICAgICog6ZSB5a6aXG4gICAgICAgICAqIOWSjOWJjeWAvOS4gOagt1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgdXRpbHMuY2FuTm90UmVuYW1lKG5vZGUpIHx8IG5hbWUgPT09IG5vZGUubmFtZSkge1xuICAgICAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJ2xvYWRpbmcnO1xuXG4gICAgICAgIC8vIOS/neWtmOWOhuWPsuiusOW9lVxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgIC8vIOWPkemAgemHjeWQjeWRveaVsOaNrlxuICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdzZXQtcHJvcGVydHknLCB7XG4gICAgICAgICAgICB1dWlkOiBub2RlLnV1aWQsXG4gICAgICAgICAgICBwYXRoOiAnbmFtZScsXG4gICAgICAgICAgICBkdW1wOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG5hbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWlzU3VjY2Vzcykge1xuICAgICAgICAgICAgdm0uZGlhbG9nRXJyb3IoJ3JlbmFtZUZhaWwnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmiafooYzmkJzntKJcbiAgICAgKi9cbiAgICBhc3luYyBzZWFyY2goKSB7XG4gICAgICAgIC8vIOaQnOe0ouacieWPmOWKqOmDveWFiOa7muWbnumhtumDqFxuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVmFsdWUpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG8oMCwgMCk7XG5cbiAgICAgICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hUeXBlID09PSAnYXNzZXQnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZmluZE5vZGVzVXNlQXNzZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ouW5Yqo5Lit5oSf55+l5b2T5YmN5omA5aSE6IqC54K55L2N572uXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIHBvc2l0aW9uIOS9jee9ru+8mmJlZm9yZe+8jGluc2lkZe+8jGFmdGVyXG4gICAgICovXG4gICAgZHJhZ092ZXIodXVpZDogc3RyaW5nLCBwb3NpdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uSWQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHV1aWQgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgdXVpZCA9IHZtLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRyYWcg5oKs5YGc5LiA5q615pe26Ze05ZCO6Ieq5Yqo5bGV5byA6IqC54K5XG4gICAgICAgICAgICBjb25zdCBub3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChkcmFnT3ZlclV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclV1aWQgPSB1dWlkO1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVGltZSA9IG5vd1RpbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub3dUaW1lIC0gZHJhZ092ZXJUaW1lID4gODAwICYmICF0cmVlRGF0YS51dWlkVG9FeHBhbmRbbm9kZS51dWlkXSkge1xuICAgICAgICAgICAgICAgICAgICB2bS50b2dnbGUobm9kZS51dWlkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG9wICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IG5vZGVIZWlnaHQsIGljb25XaWR0aCwgcGFkZGluZyB9ID0gcGFuZWxEYXRhLmNvbmZpZztcbiAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50SGVpZ2h0LCBvZmZzZXRIZWlnaHQsIHNjcm9sbFRvcCwgc2Nyb2xsSGVpZ2h0IH0gPSBwYW5lbERhdGEuJC52aWV3Qm94O1xuXG4gICAgICAgICAgICBjb25zdCBpc0F0Qm90dG9tID0gc2Nyb2xsVG9wICYmIGNsaWVudEhlaWdodCArIHNjcm9sbFRvcCA9PT0gc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICAgICAgICBjb25zdCB2aWV3UmVjdCA9IHBhbmVsRGF0YS4kLnZpZXdCb3guZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBjb25zdCB0cmVlUmVjdCA9IHZtLiRlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdFRvcCA9IHZpZXdSZWN0LnRvcCAtIHRyZWVSZWN0LnRvcDtcblxuICAgICAgICAgICAgY29uc3QgYWRqdXN0U2Nyb2xsVG9wID0gdm0uc2Nyb2xsVG9wICUgbm9kZUhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbGJhckhlaWdodCA9IG9mZnNldEhlaWdodCAtIGNsaWVudEhlaWdodDtcblxuICAgICAgICAgICAgY29uc3QgZGVwdGhMZWZ0ID0gbm9kZS5kZXB0aCAqIGljb25XaWR0aDtcbiAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlUb3AgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKSAqIG5vZGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGxldCB0b3AgPSBkaXNwbGF5VG9wIC0gYWRqdXN0VG9wICsgYWRqdXN0U2Nyb2xsVG9wICsgcGFkZGluZztcbiAgICAgICAgICAgIGxldCBhZGp1c3RWZXJ0aWNhbEhlaWdodCA9IC0xMztcblxuICAgICAgICAgICAgaWYgKGlzQXRCb3R0b20pIHtcbiAgICAgICAgICAgICAgICBhZGp1c3RWZXJ0aWNhbEhlaWdodCAtPSAyO1xuICAgICAgICAgICAgICAgIHRvcCArPSBzY3JvbGxiYXJIZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBoZWlnaHQgPSBub2RlSGVpZ2h0O1xuICAgICAgICAgICAgbGV0IHpJbmRleCA9IDA7XG4gICAgICAgICAgICBjb25zdCBhZGp1c3RMZWZ0ID0gLTM7XG5cbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdm0uJGVsLm9mZnNldFdpZHRoIC0gZGVwdGhMZWZ0IC0gYWRqdXN0TGVmdDtcbiAgICAgICAgICAgIGNvbnN0IGxlZnQgPSBkZXB0aExlZnQgKyBhZGp1c3RMZWZ0O1xuICAgICAgICAgICAgY29uc3QgcGFyZW50VG9wID0gdHJlZURhdGEuZGlzcGxheUFycmF5LmluZGV4T2YodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXSkgKiBub2RlSGVpZ2h0O1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gMjtcbiAgICAgICAgICAgICAgICAgICAgekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gMjtcbiAgICAgICAgICAgICAgICAgICAgekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIHRvcCA9ICh0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih1dGlscy5nZUxhc3RFeHBhbmRDaGlsZFV1aWQodXVpZCkpICsgMSkgKiBub2RlSGVpZ2h0ICsgcGFkZGluZztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b3AgPSBNYXRoLm1pbihzY3JvbGxIZWlnaHQgLSBoZWlnaHQsIHRvcCk7XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpICYmIFsnYmVmb3JlJywgJ2FmdGVyJ10uaW5jbHVkZXMocG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5kcm9wQm94ID0ge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogdG9wICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICAgICAgdmVydGljYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0b3AgLSBwYXJlbnRUb3AgKyBhZGp1c3RWZXJ0aWNhbEhlaWdodCArICdweCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+b5YWlIHRyZWUg5a655ZmoXG4gICAgICovXG4gICAgZHJhZ0VudGVyKCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvkuLrmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmRyb3BCb3guc3R5bGUgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiAnLTJweCcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICB2bS5kcmFnT3ZlcignJywgJ2FmdGVyJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogZHJvcCDliLDpnaLmnb/nqbrnmb3ljLrln5/ph4xcbiAgICAgKiBAcGFyYW0gZXZlbnQg6byg5qCH5LqL5Lu2XG4gICAgICovXG4gICAgZHJvcChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAmJiAhZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnaG92aW5nJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEVkaXRvci5VSS5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICAvLyBjYy5TY2VuZSDmoLnoioLngrlcbiAgICAgICAgZGF0YS50byA9IHZtLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgZGF0YS5pbnNlcnQgPSAnaW5zaWRlJztcbiAgICAgICAgZGF0YS5jb3B5ID0gZXZlbnQuY3RybEtleTtcbiAgICAgICAgZGF0YS5rZWVwV29ybGRUcmFuc2Zvcm0gPSAhZXZlbnQuc2hpZnRLZXk7XG4gICAgICAgIHZtLmlwY0Ryb3AoZGF0YSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnmi5bliqhcbiAgICAgKiBAcGFyYW0ganNvbiBEcmFnTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGlwY0Ryb3AoanNvbjogRHJhZ05vZGUpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZm9jdXNXaW5kb3coKTtcblxuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuY2xlYXJTZWFyY2goKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS/neWtmOWOhuWPsuiusOW9lVxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgIGNvbnN0IHV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCB2YWx1ZXM6IGFueVtdID0gW107XG5cbiAgICAgICAgY29uc3QgeyB2YWx1ZSwgdHlwZSwgbmFtZSB9ID0ganNvbjtcbiAgICAgICAgbGV0IHsgYWRkaXRpb25hbCB9ID0ganNvbjtcblxuICAgICAgICB2bS50b2dnbGUoanNvbi50bywgdHJ1ZSk7XG4gICAgICAgIGlmIChhZGRpdGlvbmFsKSB7XG4gICAgICAgICAgICAvLyDlop7liqDkuIDlpITlrrnplJlcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWwgPSBbYWRkaXRpb25hbF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFkZGl0aW9uYWwuZm9yRWFjaCgoaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZtLmRyb3BwYWJsZVR5cGVzLmluY2x1ZGVzKGluZm8udHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZHMucHVzaChpbmZvLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXZtLmRyb3BwYWJsZVR5cGVzLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUgJiYgIXV1aWRzLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgICAgICAgdXVpZHMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB2YWx1ZXMucHVzaCh7IHR5cGUsIHZhbHVlLCBuYW1lIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsdWVzIOaciei/h+a7pOS6hiBhZGRpdGlvbmFsIOiKgueCuee7hOS7tuaVsOaNru+8jOmHjee9rue7mSBhZGRpdGlvbmFsXG4gICAgICAgIGpzb24uYWRkaXRpb25hbCA9IHZhbHVlcztcblxuICAgICAgICBpZiAoanNvbi50eXBlID09PSAnY2MuTm9kZScpIHtcbiAgICAgICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoanNvbi5jb3B5KSB7XG4gICAgICAgICAgICAgICAgLy8g5oyJ5L2P5LqGIGN0cmwg6ZSu77yM5ouW5Yqo5aSN5Yi2XG4gICAgICAgICAgICAgICAgYXdhaXQgdm0uY29weSh1dWlkcyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdm0ucGFzdGUoanNvbi50bywganNvbi5rZWVwV29ybGRUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm0ubW92ZShqc29uKTtcbiAgICAgICAgfSBlbHNlIGlmIChwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMgJiYgcGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzLmluY2x1ZGVzKGpzb24udHlwZSkpIHtcbiAgICAgICAgICAgIC8vIOivpeexu+Wei+eahOS6i+S7tuacieWklumDqOazqOWGjOeahOWKqOS9nO+8jOi9rOeUseWklumDqOazqOWGjOS6i+S7tuaOpeeuoVxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gT2JqZWN0LnZhbHVlcyhwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AuY2FsbGJhY2tzW2pzb24udHlwZV0pIGFzIEZ1bmN0aW9uW107XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzICYmIEFycmF5LmlzQXJyYXkoY2FsbGJhY2tzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvTm9kZSA9IHV0aWxzLmdldE5vZGUoanNvbi50byk7XG4gICAgICAgICAgICAgICAgaWYgKHRvTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b1BhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2pzb24udG9dO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b0luZGV4ID0gdHJlZURhdGEudXVpZFRvQ2hpbGRyZW5bdG9QYXJlbnRVdWlkXS5pbmRleE9mKGpzb24udG8pO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5mb3JFYWNoKChjYWxsYmFjazogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm86IERyb3BDYWxsYmFja0luZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZTogdG9Ob2RlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB0b1BhcmVudFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHRvSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGpzb24uaW5zZXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soaW5mbywganNvbi5hZGRpdGlvbmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbmV3VXVpZHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYXNzZXQgb2YgdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwYW5lbERhdGEuY29uZmlnLmNyZWF0YWJsZVR5cGVzLmluY2x1ZGVzKGFzc2V0LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWwhuiiq+azqOWFpeaVsOaNrueahOWvueixoVxuICAgICAgICAgICAgICAgIGNvbnN0IHRvTm9kZSA9IHV0aWxzLmdldE5vZGUoanNvbi50byk7XG4gICAgICAgICAgICAgICAgaWYgKCF0b05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0VXVpZCA9IGFzc2V0LnZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvUGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbanNvbi50b107XG5cbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50ID0ganNvbi5pbnNlcnQgPT09ICdpbnNpZGUnID8ganNvbi50byA6IHRvUGFyZW50VXVpZDtcblxuICAgICAgICAgICAgICAgIC8vIOaLluWIsCBwcmVmYWIg5qC56IqC54K555qE6aG26YOo5pS+572u77yM6ZyA6KaB6L2s5Li65pS+572u5Zyo5YaF6YOoXG4gICAgICAgICAgICAgICAgaWYgKHRvTm9kZS5pc1ByZWZhYlJvb3QgJiYganNvbi5pbnNlcnQgIT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IGpzb24udG87XG4gICAgICAgICAgICAgICAgICAgIGpzb24uaW5zZXJ0ID0gJ2luc2lkZSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1ub2RlJywge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQsXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiBhc3NldC51bmxpbmtQcmVmYWIsXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiBhc3NldC5jYW52YXNSZXF1aXJlZCxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIG5ld1V1aWRzLnB1c2gobmV3VXVpZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4iuatpeW3suaWsOWinuWujOavlVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0b0FyciA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3RvUGFyZW50VXVpZF07XG4gICAgICAgICAgICAgICAgY29uc3QgdG9JbmRleCA9IHRvQXJyLmluZGV4T2YoanNvbi50byk7XG5cbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdG9JbmRleCAtIHRvQXJyLmxlbmd0aDsgLy8g55uu5qCH57Si5byV5YeP5Y676Ieq6Lqr57Si5byVXG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA8IDAgJiYganNvbi5pbnNlcnQgPT09ICdhZnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCP5LqOMOeahOWBj+enu+m7mOiupOaYr+aOkuWcqOebruagh+WFg+e0oOS5i+WJje+8jOWmguaenOaYryBhZnRlciDopoEgKzFcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPiAwICYmIGpzb24uaW5zZXJ0ID09PSAnYmVmb3JlJykge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpKfkuo4w55qE5YGP56e76buY6K6k5piv5o6S5Zyo55uu5qCH5YWD57Sg5LmL5ZCO77yM5aaC5p6c5pivIGJlZm9yZSDopoEgLTFcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0IC09IDE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5Zyo54i257qn6YeM5bmz56e7XG4gICAgICAgICAgICAgICAgdHJlZURhdGEubW92ZU5vZGUodG9QYXJlbnRVdWlkLCB0b0Fyci5sZW5ndGgsIG9mZnNldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOmAieS4reaWsOeahOiKgueCuVxuICAgICAgICAgICAgdm0uaXBjU2VsZWN0KG5ld1V1aWRzKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSN5Yi2XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgYXN5bmMgY29weSh1dWlkOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY29waWVzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBjb3BpZXMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5p2l6Ieq5Y+z5Ye76I+c5Y2V55qE5Y2V5Liq6YCJ5Lit77yM5Y+z5Ye76IqC54K55LiN5Zyo5bey6YCJ6aG555uu6YeMXG4gICAgICAgICAgICBpZiAodXVpZCAmJiAhcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gW3V1aWRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb3BpZXMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbGlkVXVpZHMgPSBjb3BpZXMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUgJiYgIXV0aWxzLmNhbk5vdENvcHlOb2RlKG5vZGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjb3BpZWRVdWlkcyA9IHV0aWxzLmZpbHRlckNoaWxkcmVuKHZhbGlkVXVpZHMpO1xuXG4gICAgICAgIGF3YWl0IHRyZWVEYXRhLmNvcHlOb2RlKGNvcGllZFV1aWRzKTtcblxuICAgICAgICAvLyDlsIblpI3liLboioLngrnnmoQgdXVpZCDlrZjmlL7liLDnu5/kuIDnmoTliarliIfmnb9cbiAgICAgICAgY29uc3QgY29waWVkSW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGNvcGllZFV1aWRzKTtcbiAgICAgICAgRWRpdG9yLkNsaXBib2FyZC53cml0ZSgnaGllcmFyY2h5LWNvcGllZC1pbmZvJywgY29waWVkSW5mbyk7XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGNvcGllZFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog57KY6LS0XG4gICAgICogQHBhcmFtIHV1aWQg57KY6LS05Yiw6L+Z5Liq6IqC54K56YeM6Z2iXG4gICAgICogQHBhcmFtIGtlZXBXb3JsZFRyYW5zZm9ybSDmmK/lkKbkv53mjIHkuJbnlYzlnZDmoIdcbiAgICAgKi9cbiAgICBhc3luYyBwYXN0ZSh1dWlkOiBzdHJpbmcsIGtlZXBXb3JsZFRyYW5zZm9ybTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS/neWtmOWOhuWPsuiusOW9lVxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgIGlmICghdXVpZCkge1xuICAgICAgICAgICAgdXVpZCA9IHRoaXMuZ2V0Rmlyc3RTZWxlY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS8mOWFiOWkhOeQhuWJquWIh+eahOaDheWGtVxuICAgICAgICBjb25zdCBjdXRJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdoaWVyYXJjaHktY3V0LWluZm8nKTtcbiAgICAgICAgaWYgKGN1dEluZm8gJiYgY3V0SW5mby51dWlkcy5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCA9PT0gY3V0SW5mby5wcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgY29uc3QgY3V0VXVpZHMgPSBjdXRJbmZvLnV1aWRzO1xuICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkcyA9IHV0aWxzLmZpbHRlckNoaWxkcmVuKGN1dFV1aWRzKTtcbiAgICAgICAgICAgIGlmICh2YWxpZFV1aWRzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtb3ZlRGF0YTogRHJhZ05vZGUgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2NjLk5vZGUnLFxuICAgICAgICAgICAgICAgIHRvOiB1dWlkLFxuICAgICAgICAgICAgICAgIGluc2VydDogJ2luc2lkZScsXG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbDogdmFsaWRVdWlkcy5tYXAoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdXVpZCwgdHlwZTogJ2NjLk5vZGUnIH07XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAga2VlcFdvcmxkVHJhbnNmb3JtLFxuICAgICAgICAgICAgICAgIGNvcHk6IGZhbHNlLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShtb3ZlRGF0YSk7XG5cbiAgICAgICAgICAgIC8vIOa4heepuuWJquWIh+adv1xuICAgICAgICAgICAgRWRpdG9yLkNsaXBib2FyZC5jbGVhcigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+q5Y+v5Zyo6aG555uu5YaF5aSN5Yi257KY6LS0XG4gICAgICAgIGNvbnN0IGNvcGllZEluZm8gPSBFZGl0b3IuQ2xpcGJvYXJkLnJlYWQoJ2hpZXJhcmNoeS1jb3BpZWQtaW5mbycpO1xuICAgICAgICBpZiAoIWNvcGllZEluZm8gfHwgIWNvcGllZEluZm8udXVpZHMubGVuZ3RoIHx8IGNvcGllZEluZm8ucHJvamVjdFBhdGggIT09IEVkaXRvci5Qcm9qZWN0LnBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb3BpZWRVdWlkcyA9IGNvcGllZEluZm8udXVpZHM7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbihjb3BpZWRVdWlkcyk7XG4gICAgICAgICAgICAvLyDmlrDnmoTpgInkuK3pobnliIfmjaLkuLrmlrDoioLngrlcbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLnBhc3RlTm9kZSh1dWlkLCB2YWxpZFV1aWRzLCBrZWVwV29ybGRUcmFuc2Zvcm0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Ymq5YiHXG4gICAgICog5Ymq5YiH5piv6aKE5a6a55qE6KGM5Li677yM5Y+q5pyJ5YaN5omn6KGM57KY6LS05pON5L2c5omN5Lya55Sf5pWIXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgY3V0KHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdXRzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBjdXRzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1dHMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi/h+a7pOS4jeWPr+WJquWIh+eahOiKgueCuVxuICAgICAgICBjb25zdCBjdXRVdWlkcyA9IGN1dHMuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUgJiYgIXV0aWxzLmNhbk5vdEN1dE5vZGUobm9kZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjdXRVdWlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOe7meWkjeWItueahOWKqOS9nOWPjemmiOaIkOWKn1xuICAgICAgICBjdXRVdWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHV1aWQsICdsaWdodCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDlsIbliarliIfoioLngrnnmoQgdXVpZCDlrZjmlL7liLDnu5/kuIDnmoTliarliIfmnb9cbiAgICAgICAgY29uc3QgY3V0SW5mbyA9IHZtLnV1aWRzVG9Db3BpZWRJbmZvKGN1dFV1aWRzKTtcbiAgICAgICAgRWRpdG9yLkNsaXBib2FyZC53cml0ZSgnaGllcmFyY2h5LWN1dC1pbmZvJywgY3V0SW5mbyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlsIblpI3liLYv5Ymq5YiH55qEIHV1aWRzIOWkhOeQhuaIkOWJquWIh+adv+eahOWvueixoeexu+Wei1xuICAgICAqL1xuICAgIHV1aWRzVG9Db3BpZWRJbmZvKHV1aWRzOiBzdHJpbmdbXSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJvamVjdFBhdGg6IEVkaXRvci5Qcm9qZWN0LnBhdGgsXG4gICAgICAgICAgICB1dWlkczogdXVpZHMsXG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlhYvpmoZcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBkdXBsaWNhdGUodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGR1cGxpY2F0ZXMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5p2l6Ieq5Y+z5Ye76I+c5Y2V55qE5Y2V5Liq6YCJ5Lit77yM5Y+z5Ye76IqC54K55LiN5Zyo5bey6YCJ6aG555uu6YeMXG4gICAgICAgICAgICBpZiAodXVpZCAmJiAhcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgZHVwbGljYXRlcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZHVwbGljYXRlcyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5LiN5Y+v5aSN5Yi255qE6IqC54K5XG4gICAgICAgIGNvbnN0IHV1aWRzID0gdXRpbHMuZmlsdGVyQ2hpbGRyZW4oZHVwbGljYXRlcykuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUgJiYgIXV0aWxzLmNhbk5vdENvcHlOb2RlKG5vZGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L+d5a2Y5Y6G5Y+y6K6w5b2VXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOWPr+iDveaYr+aJuemHj+aTjeS9nO+8jOe7meWKoOS4qumUgVxuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZHVwbGljYXRlTm9kZSh1dWlkcyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnp7vliqhcbiAgICAgKiBAcGFyYW0ganNvbiBEcmFnTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIG1vdmUoanNvbjogRHJhZ05vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFqc29uIHx8ICFqc29uLnRvIHx8ICFBcnJheS5pc0FycmF5KGpzb24uYWRkaXRpb25hbCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHV1aWRzID0ganNvbi5hZGRpdGlvbmFsLm1hcCgoaW5mbzogRHJhZ05vZGVJbmZvKSA9PiBpbmZvLnZhbHVlKTtcblxuICAgICAgICAvLyDnp7vliqjnmoTlhYPntKDmnInph43lj6BcbiAgICAgICAgaWYgKHV1aWRzLmluY2x1ZGVzKGpzb24udG8pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlsIbooqvms6jlhaXmlbDmja7nmoTlr7nosaFcbiAgICAgICAgY29uc3QgdG9Ob2RlID0gdXRpbHMuZ2V0Tm9kZShqc29uLnRvKTtcbiAgICAgICAgY29uc3QgdG9QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQoanNvbi50byk7XG5cbiAgICAgICAgaWYgKCF0b05vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b05vZGUuaXNQcmVmYWJSb290ICYmIGpzb24uaW5zZXJ0ICE9PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgLy8g5LiN6IO956e75Yqo5Yiw5b2T5YmN57yW6L6R55qEIHByZWZhYiDmoLnoioLngrnnmoTliY3lkI5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b05vZGUuaXNTY2VuZSAmJiBqc29uLmluc2VydCAhPT0gJ2luc2lkZScpIHtcbiAgICAgICAgICAgIC8vIOaLluWKqOWIsOWcuuaZr+agueiKgueCueeahOWJjeWQjuS9jee9ru+8jOS5n+ebuOW9k+S6juaLlui/m+mHjOmdolxuICAgICAgICAgICAganNvbi5pbnNlcnQgPSAnaW5zaWRlJztcbiAgICAgICAgICAgIGF3YWl0IHZtLm1vdmUoanNvbik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyZW50Tm9kZSA9IHRvTm9kZTtcbiAgICAgICAgaWYgKHRvUGFyZW50ICYmIFsnYmVmb3JlJywgJ2FmdGVyJ10uaW5jbHVkZXMoanNvbi5pbnNlcnQpKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlID0gdG9QYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZVV1aWQgPSBwYXJlbnROb2RlLnV1aWQ7XG5cbiAgICAgICAgLy8g5aSa6IqC54K555qE56e75Yqo77yM5qC55o2u546w5pyJ5o6S5bqP55qE6aG65bqP5omn6KGMXG4gICAgICAgIGNvbnN0IGZyb21VdWlkczogc3RyaW5nW10gPSB1dWlkc1xuICAgICAgICAgICAgLm1hcCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gdG9Ob2RlIOiKgueCueaYryBmcm9tTm9kZSDnmoTlrZDpm4bvvIzniLbkuI3og73np7vliLDlrZDph4zpnaIsIOWPlua2iOenu+WKqFxuICAgICAgICAgICAgICAgIGlmICh1dGlscy5pc0FJbmNsdWRlQih1dWlkLCBqc29uLnRvKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmcm9tUGFyZW50ID0gdXRpbHMuZ2V0UGFyZW50KHV1aWQpO1xuICAgICAgICAgICAgICAgIGlmICghZnJvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChqc29uLmluc2VydCA9PT0gJ2luc2lkZScgJiYgcGFyZW50Tm9kZSA9PT0gZnJvbVBhcmVudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJlZURhdGEudXVpZFRvSW5kZXhbYV0gLSB0cmVlRGF0YS51dWlkVG9JbmRleFtiXTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOaXoOiKgueCueenu+WKqFxuICAgICAgICBpZiAoIWZyb21VdWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOW8gOWni+aJp+ihjFxuICAgICAgICBsZXQgYWRqdXN0SW5kZXggPSAwO1xuICAgICAgICBmb3IgKGNvbnN0IGZyb21VdWlkIG9mIGZyb21VdWlkcykge1xuICAgICAgICAgICAgY29uc3QgZnJvbU5vZGUgPSB1dGlscy5nZXROb2RlKGZyb21VdWlkKTtcblxuICAgICAgICAgICAgaWYgKCFmcm9tTm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IGZyb21VdWlkO1xuXG4gICAgICAgICAgICBjb25zdCBmcm9tUGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbZnJvbVV1aWRdO1xuXG4gICAgICAgICAgICBpZiAocGFyZW50Tm9kZVV1aWQgIT09IGZyb21QYXJlbnRVdWlkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuc2V0UGFyZW50KHBhcmVudE5vZGVVdWlkLCBbZnJvbVV1aWRdLCBqc29uLmtlZXBXb3JsZFRyYW5zZm9ybSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghWydiZWZvcmUnLCAnYWZ0ZXInXS5pbmNsdWRlcyhqc29uLmluc2VydCkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g546w5pyJIGFwaSDkuIvvvIzov5nkuIDmraXlvpfmn6Xor6Llrp7ml7bkvY3nva7vvIzmiY3lpb3lh4bnoa7np7vliqjliLDmlrDkvY3nva5cbiAgICAgICAgICAgIGNvbnN0IHBhcmVudE5vZGVJbmZvID0gYXdhaXQgdHJlZURhdGEuZ2V0RHVtcERhdGEocGFyZW50Tm9kZS51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IHRvTm9kZUluZGV4ID0gcGFyZW50Tm9kZUluZm8uY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZDogYW55KSA9PiBjaGlsZC52YWx1ZS51dWlkID09PSB0b05vZGUudXVpZCk7XG4gICAgICAgICAgICBjb25zdCBmcm9tTm9kZUluZGV4ID0gcGFyZW50Tm9kZUluZm8uY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZDogYW55KSA9PiBjaGlsZC52YWx1ZS51dWlkID09PSBmcm9tTm9kZS51dWlkKTtcblxuICAgICAgICAgICAgbGV0IG9mZnNldCA9IHRvTm9kZUluZGV4IC0gZnJvbU5vZGVJbmRleDtcblxuICAgICAgICAgICAgaWYgKGpzb24uaW5zZXJ0ID09PSAnYWZ0ZXInKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCP5LqOIDAg55qE5YGP56e76buY6K6k5piv5o6S5Zyo55uu5qCH5YWD57Sg5LmL5YmN77yM5aaC5p6c5pivIGFmdGVyIOimgSArMVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGFkanVzdEluZGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdiZWZvcmUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aSn5LqOIDAg55qE5YGP56e76buY6K6k5piv5o6S5Zyo55uu5qCH5YWD57Sg5LmL5ZCO77yM5aaC5p6c5pivIGJlZm9yZSDopoEgLTFcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0IC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5tb3ZlTm9kZShwYXJlbnROb2RlLnV1aWQsIGZyb21Ob2RlSW5kZXgsIG9mZnNldCk7XG5cbiAgICAgICAgICAgIGFkanVzdEluZGV4Kys7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOagkeW9ouaVsOaNruW3suaUueWPmFxuICAgICAqIOWmguiKgueCueWinuWIoOaUue+8jOaYr+i+g+Wkp+eahOWPmOWKqO+8jOmcgOimgemHjeaWsOiuoeeul+WQhOS4qumFjeWll+aVsOaNrlxuICAgICAqL1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgLy8g5a655Zmo55qE5pW05L2T6auY5bqmXG4gICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLnRyZWVIZWlnaHQgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkubGVuZ3RoICogcGFuZWxEYXRhLmNvbmZpZy5ub2RlSGVpZ2h0ICsgcGFuZWxEYXRhLmNvbmZpZy5wYWRkaW5nICogMjtcblxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5hbGxFeHBhbmQgPSB1dGlscy5pc0FsbEV4cGFuZCgpO1xuXG4gICAgICAgIHdoaWxlIChwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCByZWFkeVR3aW5rbGUgPSBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHV0aWxzLnR3aW5rbGUuYWRkKHJlYWR5VHdpbmtsZS51dWlkLCByZWFkeVR3aW5rbGUuYW5pbWF0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmHjeaWsOa4suafk+WHuuagkeW9olxuICAgICAgICB2bS5maWx0ZXIoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWcqOaVsOaNruS4jeWPmOeahOaDheWGteS4i++8jOagueaNrua7muWKqOS9jee9rua4suafk+agkeW9olxuICAgICAqL1xuICAgIGZpbHRlcigpIHtcbiAgICAgICAgLy8g6Z2i5p2/5ouW5ou95YiwIHRhYiDph4zkuI3kvJrnq4vljbPmmL7npLrvvIzpnIDopoHmiYvliqjliIfmjaIgdGFi77yM5Zyo5YiH5o2i5YmN6Z2i5p2/IGhlaWdodD0wXG4gICAgICAgIC8vIOinhOmBvyBoZWlnaHQ9MCDpnZ7mraPluLjmg4XlhrXkuIvlvoDkuIvmiafooYzplJnor6/orqHnrpfvvIzlnKjliIfmjaIgdGFiIOWQjuS8muaJp+ihjCBzaG93IOi/m+ihjOato+ehrueahOiuoeeul+a4suafk1xuICAgICAgICBpZiAoIXBhbmVsRGF0YS4kLnBhbmVsLnZpZXdIZWlnaHQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyDlhYjmuIXnqbrvvIzov5nnp43otYvlgLzmnLrliLbmiY3og73liLfmlrAgdnVl77yM6ICMIC5sZW5ndGggPSAwIOS4jeihjFxuICAgICAgICB2bS5ub2RlcyA9IFtdO1xuXG4gICAgICAgIGNvbnN0IG5vZGVIZWlnaHQgPSBwYW5lbERhdGEuY29uZmlnLm5vZGVIZWlnaHQ7XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IHZtLnNjcm9sbFRvcDtcblxuICAgICAgICBjb25zdCB0b3AgPSBzY3JvbGxUb3AgJSBub2RlSGVpZ2h0O1xuICAgICAgICAvLyDnrpflh7rlj6/op4bljLrln5/nmoQgdG9wIOacgOWwj+WAvFxuICAgICAgICBjb25zdCBtaW4gPSBzY3JvbGxUb3AgLSB0b3A7XG4gICAgICAgIC8vIOacgOWkp+WAvFxuICAgICAgICBjb25zdCBtYXggPSBtaW4gKyBwYW5lbERhdGEuJC5wYW5lbC52aWV3SGVpZ2h0O1xuXG4gICAgICAgIHZtLiRlbC5zdHlsZS50b3AgPSBgLSR7dG9wfXB4YDtcblxuICAgICAgICBjb25zdCBzdGFydCA9IE1hdGgucm91bmQobWluIC8gbm9kZUhlaWdodCk7XG4gICAgICAgIGNvbnN0IGVuZCA9IE1hdGguY2VpbChtYXggLyBub2RlSGVpZ2h0KSArIDE7XG5cbiAgICAgICAgdm0ubm9kZXMgPSB0cmVlRGF0YS5vdXRwdXREaXNwbGF5KHN0YXJ0LCBlbmQpO1xuXG4gICAgICAgIGNsZWFyVGltZW91dCh2bS5zY3JvbGxJbnRvVmlld1RpbWVJZCk7XG4gICAgICAgIHZtLnNjcm9sbEludG9WaWV3VGltZUlkID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVVzZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb25lID0gYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodm0uaW50b1ZpZXdCeVVzZXIpO1xuICAgICAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCA1MCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDov5Tlm57oioLngrkgdXVpZFxuICAgICAqL1xuICAgIGdldEZpcnN0U2VsZWN0KCkge1xuICAgICAgICBjb25zdCBmaXJzdCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1swXTtcblxuICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBmaXJzdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB2bS5nZXRGaXJzdENoaWxkKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPlumAieS4reWIl+ihqOaVsOe7hOS4reacgOWQjuS4gOS4quiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnuepulxuICAgICAqL1xuICAgIGdldExhc3RTZWxlY3QoKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tsZW5ndGggLSAxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB2bS5nZXRGaXJzdENoaWxkKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiOt+WPluinhuinieS4iuagkeW9ouS4iuS4i+WIl+ihqOS4re+8jOesrOS4gOS4qumAieS4reiKgueCue+8jOayoeaciemAieS4remhue+8jOi/lOWbnumhtuWxguagueiKgueCuVxuICAgICAqL1xuICAgIGdldEZpcnN0U2VsZWN0U29ydEJ5RGlzcGxheSgpIHtcbiAgICAgICAgbGV0IHV1aWQgPSAnJztcbiAgICAgICAgbGV0IGluZGV4ID0gSW5maW5pdHk7XG5cbiAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmZvckVhY2goKHNlbGVjdDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJlZURhdGEudXVpZFRvSW5kZXhbc2VsZWN0XSA8IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSB0cmVlRGF0YS51dWlkVG9JbmRleFtzZWxlY3RdO1xuICAgICAgICAgICAgICAgIHV1aWQgPSBzZWxlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB1dWlkIHx8IHRyZWVEYXRhLm5vZGVUcmVlPy51dWlkO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+U5Zue5qCR5b2i56ys5LiA5Liq6IqC54K5XG4gICAgICog56ys5LiA5Liq6IqC54K577yM5LiN5LiA5a6a5piv5qC56IqC54K577yM5L6L5aaC5Zyo5pCc57Si55qE5oOF5Ya15LiLXG4gICAgICovXG4gICAgZ2V0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS5ub2RlVHJlZT8udXVpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmVlRGF0YS5kaXNwbGF5QXJyYXlbMF07XG4gICAgfSxcbiAgICBpc0FjdGl2ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzQWN0aXZlKHV1aWQpO1xuICAgIH0sXG4gICAgaXNFeHBhbmQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc0V4cGFuZCh1dWlkKTtcbiAgICB9LFxuICAgIGlzUGFyZW50KHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNQYXJlbnQodXVpZCk7XG4gICAgfSxcbiAgICBpc1NlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNTZWxlY3RlZCh1dWlkKTtcbiAgICB9LFxuICAgIGlzQW5pbWF0aW5nKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNBbmltYXRpbmcodXVpZCB8fCBwYW5lbERhdGEuYWN0LmFuaW1hdGlvblV1aWQpO1xuICAgIH0sXG4gICAgaXNTZWFyY2hpbmcoKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc1NlYXJjaGluZygpO1xuICAgIH0sXG4gICAgYXN5bmMgZGlhbG9nRXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgIGF3YWl0IEVkaXRvci5EaWFsb2cuZXJyb3IoRWRpdG9yLkkxOG4udChgaGllcmFyY2h5Lm9wZXJhdGUuJHttZXNzYWdlfWApLCB7XG4gICAgICAgICAgICB0aXRsZTogRWRpdG9yLkkxOG4udCgnaGllcmFyY2h5Lm9wZXJhdGUuZGlhbG9nRXJyb3InKSxcbiAgICAgICAgfSk7XG4gICAgfSxcbn07XG5cbi8qKlxuICogdnVlIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbm9kZXM6IFtdLCAvLyDlvZPliY3moJHlvaLlnKjlj6/op4bljLrln5/nmoToioLngrnmlbDmja5cbiAgICAgICAgcmVuYW1lVXVpZDogJycsIC8vIOmcgOimgSByZW5hbWUg55qE6IqC54K555qEIHVybO+8jOWPquacieS4gOS4qlxuICAgICAgICBhZGROb2RlOiB7XG4gICAgICAgICAgICAvLyDmt7vliqDkuIDkuKrmlrDoioLngrnliY3nmoTmlbDmja7vvIzpnIDopoHkuovliY3ph43lkb3lkI1cbiAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgcGFyZW50OiAnJyxcbiAgICAgICAgICAgIHNpYmxpbmc6ICcnLFxuICAgICAgICB9LFxuICAgICAgICBpbnRvVmlld0J5VXNlcjogJycsIC8vIOeUqOaIt+aTjeS9nO+8mumAieS4re+8jOaWsOWinu+8jOenu+WKqO+8jOe7meS6iOWumuS9jVxuICAgICAgICBzY3JvbGxUb3A6IDAsIC8vIOW9k+WJjeagkeW9oueahOa7muWKqOaVsOaNrlxuICAgICAgICBkcm9wcGFibGVUeXBlczogW10sXG4gICAgICAgIHR3aW5rbGVzOiB7fSwgLy8g6ZyA6KaB6Zeq54OB55qEIHV1aWRcbiAgICAgICAgY2hlY2tTaGlmdFVwRG93bk1lcmdlOiB7IHV1aWQ6ICcnLCBkaXJlY3Rpb246ICcnIH0sIC8vIHNoaWZ0ICsg566t5aS05aSa6YCJ77yM5aKe5by65Lqk5LqS5pWI5p6cXG4gICAgfTtcbn1cblxuLyoqXG4gKiB2bSA9IHRoaXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdW50ZWQoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHZtID0gdGhpcztcbn1cbiJdfQ==