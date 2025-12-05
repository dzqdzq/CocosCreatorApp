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
            await Editor.Message.request('scene', 'create-node', json);
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
        // scene 的 isDirty 判断使用了 undoArray.length, 操作后需要 snapshot
        Editor.Message.send('scene', 'snapshot');
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
        Editor.Message.send('scene', 'snapshot');
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
            /**
             * 由于所有的子资源也在 additional 数据里
             * 无法区分多选子资源的情况了
             * 故约定一个实体资源只取一个合法的数据
             */
            const expectedAssetUuids = [];
            additional.forEach((info) => {
                if (vm.droppableTypes.includes(info.type)) {
                    const [assetUuid, subAssetUuid] = info.value.split('@');
                    if (expectedAssetUuids.includes(assetUuid)) {
                        return;
                    }
                    expectedAssetUuids.push(assetUuid);
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
            Editor.Message.send('scene', 'snapshot');
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
        // 保存历史记录
        Editor.Message.send('scene', 'snapshot');
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
                Editor.Message.send('scene', 'snapshot');
            }
        }
        Editor.Message.send('scene', 'snapshot');
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
            Editor.Message.send('scene', 'snapshot');
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
        Editor.Message.send('scene', 'snapshot');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWIsK0JBQTRCO0FBQzVCLDJCQUFrQztBQUNsQyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUM1QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRXpCLHNCQUFzQjtBQUN0QixJQUFJLFlBQWlCLENBQUM7QUFDdEIsSUFBSSxZQUFpQixDQUFDO0FBRVQsUUFBQSxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBRWQsUUFBQSxRQUFRLEdBQUcsaUJBQVksQ0FBQyxXQUFJLENBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFcEYsUUFBQSxVQUFVLEdBQUc7SUFDdEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUM7Q0FDdEMsQ0FBQztBQUVXLFFBQUEsS0FBSyxHQUFHO0lBQ2pCOzs7T0FHRztJQUNILFNBQVM7UUFDTCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztDQUNKLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztR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LENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQztBQUVGOztHQUVHO0FBQ0gsU0FBZ0IsSUFBSTtJQUNoQixPQUFPO1FBQ0gsS0FBSyxFQUFFLEVBQUU7UUFDVCxVQUFVLEVBQUUsRUFBRTtRQUNkLE9BQU8sRUFBRTtZQUNMLHNCQUFzQjtZQUN0QixJQUFJLEVBQUUsRUFBRTtZQUNSLE1BQU0sRUFBRSxFQUFFO1lBQ1YsT0FBTyxFQUFFLEVBQUU7U0FDZDtRQUNELGNBQWMsRUFBRSxFQUFFO1FBQ2xCLFNBQVMsRUFBRSxDQUFDO1FBQ1osY0FBYyxFQUFFLEVBQUU7UUFDbEIsUUFBUSxFQUFFLEVBQUU7UUFDWixxQkFBcUIsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLHNCQUFzQjtLQUM3RSxDQUFDO0FBQ04sQ0FBQztBQWhCRCxvQkFnQkM7QUFFRDs7R0FFRztBQUNILFNBQWdCLE9BQU87SUFDbkIsYUFBYTtJQUNiLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBSEQsMEJBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEFkZE5vZGUsIFRyZWVOb2RlLCBEcmFnTm9kZUluZm8sIERyYWdOb2RlLCBEcm9wQ2FsbGJhY2tJbmZvIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYW5lbERhdGEgZnJvbSAnLi9wYW5lbC1kYXRhJztcbmltcG9ydCAqIGFzIHRyZWVEYXRhIGZyb20gJy4vdHJlZS1kYXRhJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5sZXQgdm06IGFueSA9IG51bGw7XG5sZXQgcmVxdWVzdEFuaW1hdGlvbklkOiBhbnk7XG5sZXQgc2VsZWN0ZWRUaW1lSWQ6IGFueTtcbmxldCBpc1JlZnJlc2hpbmcgPSBmYWxzZTtcblxuLy8g55So5LqO6K+G5YirIGRyYWcg5oKs5YGc77yM6Ieq5Yqo5bGV5byA54i257qnXG5sZXQgZHJhZ092ZXJVdWlkOiBhbnk7XG5sZXQgZHJhZ092ZXJUaW1lOiBhbnk7XG5cbmV4cG9ydCBjb25zdCBuYW1lID0gJ3RyZWUnO1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGUgPSByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9zdGF0aWMvdGVtcGxhdGUvdHJlZS5odG1sJyksICd1dGY4Jyk7XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge1xuICAgICd0cmVlLW5vZGUnOiByZXF1aXJlKCcuL3RyZWUtbm9kZScpLFxufTtcblxuZXhwb3J0IGNvbnN0IHdhdGNoID0ge1xuICAgIC8qKlxuICAgICAqIHNjcm9sbFRvcCDlj5jljJbvvIzliLfmlrDmoJHlvaJcbiAgICAgKiDlvZPoioLngrnlvojlpJrnmoTmg4XlhrXkuIvvvIxyZXF1ZXN0QW5pbWF0aW9uRnJhbWUg5Y+v5Lul6YG/5YWN5Y2h6aG/XG4gICAgICovXG4gICAgc2Nyb2xsVG9wKCkge1xuICAgICAgICB2bS5maWx0ZXIoKTtcbiAgICB9LFxufTtcblxuZXhwb3J0IGNvbnN0IG1ldGhvZHMgPSB7XG4gICAgLyoqXG4gICAgICog57+76K+RXG4gICAgICogQHBhcmFtIGtleSDkuI3luKbpnaLmnb/lkI3np7DnmoTmoIforrDlrZfnrKZcbiAgICAgKi9cbiAgICB0KGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHBhbmVsRGF0YS4kLnBhbmVsLnQoa2V5KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWklumDqOaVsOaNruabtOaWsOWQju+8jOabtOaWsOWGhemDqOaVsOaNrlxuICAgICAqL1xuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgY29uc3QgZHJvcHBhYmxlVHlwZXMgPSB2bS4kcGFyZW50LmRyb3BwYWJsZVR5cGVzLmNvbmNhdChwYW5lbERhdGEuY29uZmlnLmNyZWF0YWJsZVR5cGVzKTtcbiAgICAgICAgdm0uZHJvcHBhYmxlVHlwZXMgPSBkcm9wcGFibGVUeXBlcy5jb25jYXQocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa4heepuuagkeW9olxuICAgICAqL1xuICAgIGNsZWFyKCkge1xuICAgICAgICB0cmVlRGF0YS5jbGVhcigpO1xuICAgICAgICB2bS5yZWZyZXNoKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliLfmlrDmoJHlvaJcbiAgICAgKi9cbiAgICBhc3luYyByZWZyZXNoKCkge1xuICAgICAgICBpZiAoaXNSZWZyZXNoaW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpc1JlZnJlc2hpbmcgPSB0cnVlO1xuXG4gICAgICAgIC8vIOW7tui/nyAyMDAgbXMg5Yi35paw77yM5bu26L+f5pyf6Ze05Y+v5Lul5ZCI5bm25aSa5qyhIGNoYW5nZWQg5Lqn55Sf55qE5Yi35paw5oyH5Luk77yM57yT6Kej5oCn6IO96Zeu6aKYXG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDIwMCkpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5yZXNldCgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICBpc1JlZnJlc2hpbmcgPSBmYWxzZTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmDqOmAieS4rVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIHNlbGVjdEFsbCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgdHJlZURhdGEuZGlzcGxheUFycmF5KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHV1aWQgPSB1dWlkIHx8IHZtLmdldEZpcnN0U2VsZWN0U29ydEJ5RGlzcGxheSgpO1xuICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdIHx8IHV1aWQ7IC8vIHBhcmVudFV1aWQg5Li656m65piv5qC56IqC54K577yM6L2s5Li66Ieq6LqrIHV1aWRcbiAgICAgICAgY29uc3Qgc2libGluZ1V1aWRzID0gdXRpbHMuZ2V0Q2hpbGRyZW5VdWlkcyhwYXJlbnRVdWlkKTtcblxuICAgICAgICBjb25zdCBjdXJyZW50U2VsZWN0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICBjb25zdCBpc0luY2x1ZGVkID0gY3VycmVudFNlbGVjdHMuaW5jbHVkZXModXVpZCk7XG5cbiAgICAgICAgbGV0IHNpYmxpbmdzQWxsSW4gPSB0cnVlO1xuICAgICAgICBzaWJsaW5nVXVpZHMuZm9yRWFjaCgoc2libGluZ1V1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKCFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMoc2libGluZ1V1aWQpKSB7XG4gICAgICAgICAgICAgICAgc2libGluZ3NBbGxJbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoc2libGluZ3NBbGxJbikge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBwYXJlbnRVdWlkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpc0luY2x1ZGVkKSB7XG4gICAgICAgICAgICAgICAgLy8g5Yig6Zmk6LaF6L+H6IyD5Zu055qE5bey6YCJ5Lit6IqC54K5XG4gICAgICAgICAgICAgICAgY3VycmVudFNlbGVjdHMuZm9yRWFjaCgoc2VsZWN0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaWJsaW5nVXVpZHMuaW5jbHVkZXMoc2VsZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIHNlbGVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgc2libGluZ1V1aWRzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF1dGlscy5pc1BhcmVudCh1dWlkKSkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHNpYmxpbmdVdWlkcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlblt1dWlkXS5zbGljZSgpO1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIGNoaWxkcmVuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNlbGVjdENsZWFyKCkge1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdub2RlJyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmt7vliqDpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZHMgc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgKi9cbiAgICBzZWxlY3RlZCh1dWlkczogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHV1aWRzKSkge1xuICAgICAgICAgICAgdXVpZHMgPSBbdXVpZHNdO1xuICAgICAgICB9XG5cbiAgICAgICAgdXVpZHMuZm9yRWFjaCgodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKHV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSB1dWlkO1xuXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+lIHNoaWZ0IOWkmumAieeahOWKqOS9nFxuICAgICAgICAgICAgICAgIGlmICh1dWlkID09PSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCkge1xuICAgICAgICAgICAgICAgICAgICB2bS5zaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZtLmZpbHRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Y+W5raI6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgdW5zZWxlY3RlZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHZtLmludG9WaWV3QnlVc2VyID09PSB1dWlkKSB7XG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmZpbHRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5oGi5aSN6YCJ5Lit54q25oCBXG4gICAgICovXG4gICAgcmVzZWxlY3RlZCgpIHtcbiAgICAgICAgY29uc3QgdXVpZHMgPSBFZGl0b3IuU2VsZWN0aW9uLmdldFNlbGVjdGVkKCdub2RlJykuZmlsdGVyKCh1dWlkOiBzdHJpbmcpID0+ICEhdHJlZURhdGEudXVpZFRvTm9kZVt1dWlkXSk7XG4gICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdm0uc2VsZWN0ZWQodXVpZHMpO1xuXG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoc2VsZWN0ZWRUaW1lSWQpO1xuICAgICAgICB1dGlscy5zY3JvbGxJbnRvVmlldyh2bS5pbnRvVmlld0J5VXNlcik7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBzaGlmdCArIGNsaWNrIOWkmumAiVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIHNoaWZ0Q2xpY2sodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB2bS5pcGNTZWxlY3QodXVpZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHsgZGlzcGxheUFycmF5IH0gPSB0cmVlRGF0YTtcblxuICAgICAgICBjb25zdCBmaXJzdEluZGV4ID0gZGlzcGxheUFycmF5LmluZGV4T2YocGFuZWxEYXRhLmFjdC5zZWxlY3RzWzBdKTtcbiAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gZGlzcGxheUFycmF5LmluZGV4T2YodXVpZCk7XG5cbiAgICAgICAgaWYgKGZpcnN0SW5kZXggIT09IC0xIHx8IGxhc3RJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChmaXJzdEluZGV4IDw9IGxhc3RJbmRleCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBmaXJzdEluZGV4OyBpIDw9IGxhc3RJbmRleDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdHMucHVzaChkaXNwbGF5QXJyYXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZpcnN0SW5kZXg7IGkgPj0gbGFzdEluZGV4OyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0cy5wdXNoKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdm0uaXBjU2VsZWN0KHNlbGVjdHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogY3RybCArIGNsaWNrIOmAieS4reaIluWPlua2iOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGN0cmxDbGljayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB1dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YeN5paw6YCJ5Lit6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgaXBjU2VsZWN0KHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB1dWlkKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOmAieS4reagkeW9ouS4iueahOesrOS4gOS4quiKgueCuVxuICAgICAqL1xuICAgIGlwY1NlbGVjdEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICAgICAgY29uc3QgdXVpZCA9IHRoaXMuZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICBpZiAodXVpZCkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB1dWlkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog56m655m95aSE54K55Ye777yM5Y+W5raI6YCJ5LitXG4gICAgICovXG4gICAgY2xpY2soKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIm+W7uuiKgueCueWJjeWQjeensOS6i+WJjeWkhOeQhlxuICAgICAqIEBwYXJhbSBqc29uIEFkZE5vZGVcbiAgICAgKi9cbiAgICBhc3luYyBhZGRUbyhqc29uOiBBZGROb2RlKSB7XG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFqc29uLnBhcmVudCkge1xuICAgICAgICAgICAganNvbi5wYXJlbnQgPSB0aGlzLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnQ6IFRyZWVOb2RlIHwgbnVsbCA9IGF3YWl0IHV0aWxzLmdldFBhcmVudFdoZW5BZGROb2RlKGpzb24pO1xuXG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bS50b2dnbGUoanNvbi5wYXJlbnQsIHRydWUpO1xuICAgICAgICBqc29uLnBhcmVudCA9IHBhcmVudC51dWlkO1xuXG4gICAgICAgIC8vIOiuvue9ruaYvuekuuS9jee9rueahOebruagh+iKgueCuVxuICAgICAgICBqc29uLnNpYmxpbmcgPSB1dGlscy5nZUxhc3RFeHBhbmRDaGlsZFV1aWQocGFyZW50LnV1aWQpO1xuICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhqc29uLnNpYmxpbmcpO1xuXG4gICAgICAgIGpzb24ubmFtZSA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2dlbmVyYXRlLWF2YWlsYWJsZS1uYW1lJywganNvbi5uYW1lLCBqc29uLnBhcmVudCk7XG4gICAgICAgIGpzb24ubmFtZUluY3JlYXNlID0gZmFsc2U7XG5cbiAgICAgICAgdm0uYWRkTm9kZSA9IGpzb247XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmlrDlop7oioLngrnvvIzkuovliY3ph43lkb3lkI3lkI7mjqXmlLbmlbDmja5cbiAgICAgKiBAcGFyYW0ganNvbiBBZGROb2RlXG4gICAgICovXG4gICAgYWRkQ29uZmlybShqc29uPzogQWRkTm9kZSkge1xuICAgICAgICAvLyDmlrDlop7nmoTovpPlhaXmoYbmtojlpLFcbiAgICAgICAgdm0uYWRkTm9kZS5zaWJsaW5nID0gJyc7XG5cbiAgICAgICAgLy8g5pWw5o2u6ZSZ6K+v5pe25Y+W5raIXG4gICAgICAgIGlmICghanNvbiB8fCAhanNvbi5wYXJlbnQpIHtcbiAgICAgICAgICAgIHZtLmFkZEVuZCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdXRpbHMuZ2V0Tm9kZShqc29uLnBhcmVudCk7XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICB2bS5hZGRFbmQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlscy5jYW5Ob3RDcmVhdGVOb2RlKHBhcmVudCkpIHtcbiAgICAgICAgICAgIC8vIOeItue6p+S4jeWPr+WIm+W7uuiKgueCuVxuICAgICAgICAgICAgdm0uYWRkRW5kKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2bS5hZGQoanNvbik7XG4gICAgfSxcbiAgICBhZGRFbmQoKSB7XG4gICAgICAgIC8vIGxvYWRpbmcg5pWI5p6c5raI5aSxXG4gICAgICAgIHZtLmFkZE5vZGUucGFyZW50ID0gJyc7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBpcGMg5Y+R6LW35Yib5bu66IqC54K5XG4gICAgICogQHBhcmFtIGpzb24gQWRkTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGFkZChqc29uOiBBZGROb2RlKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdzY2VuZScsICdjcmVhdGUtbm9kZScsIGpzb24pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdm0uYWRkRW5kKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCueW3sua3u+WKoOWIsOWcuuaZr1xuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFkZGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICB2bS5yZWZyZXNoKCk7XG5cbiAgICAgICAgcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWVzLnB1c2goeyB1dWlkLCBhbmltYXRpb246ICdzaHJpbmsnIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5pu05paw5qCR5b2i6IqC54K5XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgY2hhbmdlZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgdm0ucmVmcmVzaCgpO1xuXG4gICAgICAgIC8vIOagueiKgueCueWkqumikee5geS6hu+8jOS4jeimgemXqueDgVxuICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgaWYgKCFub2RlIHx8IG5vZGUuaXNTY2VuZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliKDpmaRcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBkZWxldGUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS/neWtmOWOhuWPsuiusOW9lVxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgIGlmICh1dWlkICYmICFwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXModXVpZCkpIHtcbiAgICAgICAgICAgIC8vIOWmguaenOivpeiKgueCueayoeacieiiq+mAieS4re+8jOWImeWPquaYr+WIoOmZpOatpOWNleS4qlxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhYHorrjliKDpmaRcbiAgICAgICAgICAgIGlmICghdXRpbHMuY2FuTm90RGVsZXRlTm9kZShub2RlKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLmRlbGV0ZU5vZGUodXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDlpoLmnpzor6XoioLngrnmmK/ooqvpgInkuK3kuobvvIzooajmmI7opoHliKDpmaTmiYDmnInpgInkuK3poblcbiAgICAgICAgICAgIGNvbnN0IHV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmZvckVhY2goKHNlbGVjdDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUoc2VsZWN0KTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDliKDpmaTlhYHorrjliKDpmaRcbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzLmNhbk5vdERlbGV0ZU5vZGUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZHMucHVzaChzZWxlY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoIXV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZGVsZXRlTm9kZSh1dWlkcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzY2VuZSDnmoQgaXNEaXJ0eSDliKTmlq3kvb/nlKjkuoYgdW5kb0FycmF5Lmxlbmd0aCwg5pON5L2c5ZCO6ZyA6KaBIHNuYXBzaG90XG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDku47moJHlvaLliKDpmaToioLngrlcbiAgICAgKi9cbiAgICBkZWxldGVkKCkge1xuICAgICAgICB2bS5yZWZyZXNoKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnnmoTmipjlj6DliIfmjaJcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKiBAcGFyYW0gdmFsdWUgdHJ1ZSBvciBmYWxzZVxuICAgICAqIEBwYXJhbSBsb29wIOaYr+WQpuWQkeWtkOmbhuW+queOr1xuICAgICAqL1xuICAgIHRvZ2dsZSh1dWlkOiBzdHJpbmcsIGV4cGFuZDogYm9vbGVhbiwgbG9vcD86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKGxvb3ApIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLmxvb3BFeHBhbmQodXVpZCwgZXhwYW5kKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnRvZ2dsZUV4cGFuZCh1dWlkLCBleHBhbmQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlhajpg6joioLngrnmipjlj6DmiJblsZXlvIBcbiAgICAgKi9cbiAgICBhbGxUb2dnbGUoKSB7XG4gICAgICAgIGlmICghdHJlZURhdGEubm9kZVRyZWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzRXhwYW5kID0gdXRpbHMuaXNBbGxFeHBhbmQoKTtcbiAgICAgICAgY29uc3QgcGFyZW50czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCBzZWxlY3RzTGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgaWYgKHNlbGVjdHNMZW5ndGgpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudFV1aWQgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzLmlzUGFyZW50KHBhcmVudFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3BhcmVudFV1aWRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcmVudHMuaW5jbHVkZXMocGFyZW50VXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyZWVEYXRhLnRvZ2dsZUV4cGFuZChwYXJlbnRVdWlkLCAhaXNFeHBhbmQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50cy5wdXNoKHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudHMucHVzaCh0cmVlRGF0YS5ub2RlVHJlZS51dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJlZURhdGEubG9vcEV4cGFuZChwYXJlbnRzW2ldLCAhaXNFeHBhbmQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDkuIrkuIvlt6blj7Mg5oyJ6ZSuXG4gICAgICogQHBhcmFtIGRpcmVjdGlvbiDmlrnlkJFcbiAgICAgKi9cbiAgICB1cERvd25MZWZ0UmlnaHQoZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IHZtLmdldExhc3RTZWxlY3QoKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBpZiAoIXV0aWxzLmlzRXhwYW5kKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgdm0udG9nZ2xlKGxhc3QsIHRydWUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlbltsYXN0XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkcmVuKSAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY2hpbGRyZW5bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBpZiAodXRpbHMuaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtsYXN0XTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QocGFyZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNpYmxpbmdzID0gdXRpbHMuZ2V0U2libGluZyhsYXN0KTtcbiAgICAgICAgICAgIGxldCBjdXJyZW50O1xuICAgICAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd1cCc6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZG93bic6XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBzaWJsaW5nc1syXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdm0uaXBjU2VsZWN0KGN1cnJlbnQudXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaMieS9jyBzaGlmdCDplK7vvIzlkIzml7bkuIrkuIvpgInmi6lcbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIGFzeW5jIHNoaWZ0VXBEb3duKGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgW2xhc3QsIGxhc3RQcmV2LCBsYXN0TmV4dF0gPSB1dGlscy5nZXRTaWJsaW5nKHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tsZW5ndGggLSAxXSk7XG4gICAgICAgIGNvbnN0IGhhc0xhc3RQcmV2ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICBjb25zdCBoYXNMYXN0TmV4dCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhsYXN0TmV4dC51dWlkKTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndXAnKSB7XG4gICAgICAgICAgICBpZiAoIWhhc0xhc3RQcmV2KSB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBsYXN0UHJldi51dWlkKTtcblxuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkID0gbGFzdFByZXYudXVpZDtcbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0xhc3ROZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24udW5zZWxlY3QoJ25vZGUnLCBsYXN0LnV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyhsYXN0UHJldi51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdFByZXYudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdFByZXYudXVpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIGxhc3ROZXh0LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0TmV4dC51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdFByZXYpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIGxhc3QudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGxhc3ROZXh0LnV1aWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc3BsaWNlKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKGxhc3ROZXh0LnV1aWQpLCAxKTtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGxhc3ROZXh0LnV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlkIjlubYgc2hpZnQg5aSa6YCJ6L+H56iL5Lit5YmN5ZCO55qE5bey6YCJ5Lit6aG5XG4gICAgICog5q+U5aaCIGFiIGNkZSDpobnkuK0gYSwgY2RlIOW3sumAieS4rSwgYiDmnKrpgInkuK1cbiAgICAgKiDlvZPpgInkuK0gYiDml7bvvIzlkIjlubbpgInkuK3pobkgY2RlIO+8jOW5tuWwhuacq+WwvumAieS4remhueeahOaMh+mSiOaMh+WQkSBlXG4gICAgICovXG4gICAgc2hpZnRVcERvd25NZXJnZVNlbGVjdGVkKCkge1xuICAgICAgICBpZiAoIXZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQga2VlcEZpbmROZXh0ID0gdHJ1ZTtcbiAgICAgICAgbGV0IGZpbmRVdWlkID0gdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQ7XG5cbiAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSAnJzsgLy8g6YeN572uXG4gICAgICAgIGxldCBtYXhMb29wTnVtYmVyID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGtlZXBGaW5kTmV4dCkge1xuICAgICAgICAgICAgY29uc3QgYXJyID0gdXRpbHMuZ2V0U2libGluZyhmaW5kVXVpZCk7XG5cbiAgICAgICAgICAgIGlmICghYXJyIHx8ICFhcnJbMV0gfHwgIWFyclsyXSB8fCAhbWF4TG9vcE51bWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UuZGlyZWN0aW9uID09PSAnZG93bicgPyBhcnJbMl0udXVpZCA6IGFyclsxXS51dWlkO1xuICAgICAgICAgICAgbWF4TG9vcE51bWJlci0tO1xuXG4gICAgICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGZpbmRVdWlkKSkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YoZmluZFV1aWQpLCAxKTtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChmaW5kVXVpZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGtlZXBGaW5kTmV4dCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmnaXoh6rlv6vmjbfplK7nmoQgcmVuYW1lXG4gICAgICovXG4gICAgYXN5bmMga2V5Ym9hcmRSZW5hbWUoKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2bS5yZW5hbWVVdWlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1dWlkID0gdm0uZ2V0Rmlyc3RTZWxlY3QoKTtcblxuICAgICAgICBjb25zdCBhc3NldCA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgIGlmIChhc3NldCAmJiAhdXRpbHMuY2FuTm90UmVuYW1lKGFzc2V0KSkge1xuICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcodXVpZCk7XG4gICAgICAgICAgICB2bS5yZW5hbWVVdWlkID0gdXVpZDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K56YeN5ZCN5ZG9XG4gICAgICog6L+Z5piv5byC5q2l55qE77yM5Y+q5YGa5Y+R6YCBXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIG5hbWUg5LiN6YeN5ZG95ZCN5pe25LygIG5hbWUgPSBudWxsXG4gICAgICovXG4gICAgYXN5bmMgcmVuYW1lKHV1aWQ6IHN0cmluZywgbmFtZTogc3RyaW5nIHwgbnVsbCkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmuIXnqbogcmVuYW1lIOeahOiKgueCuVxuICAgICAgICB2bS5yZW5hbWVVdWlkID0gJyc7XG5cbiAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgIGlmICghbm9kZSB8fCB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICog5LiN6YeN5ZG95ZCN55qE5oOF5Ya1OlxuICAgICAgICAgKiBuYW1lID0gbnVsbFxuICAgICAgICAgKiDplIHlrppcbiAgICAgICAgICog5ZKM5YmN5YC85LiA5qC3XG4gICAgICAgICAqL1xuICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCB1dGlscy5jYW5Ob3RSZW5hbWUobm9kZSkgfHwgbmFtZSA9PT0gbm9kZS5uYW1lKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnbG9hZGluZyc7XG5cbiAgICAgICAgLy8g5L+d5a2Y5Y6G5Y+y6K6w5b2VXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG5cbiAgICAgICAgLy8g5Y+R6YCB6YeN5ZCN5ZG95pWw5o2uXG4gICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ3NldC1wcm9wZXJ0eScsIHtcbiAgICAgICAgICAgIHV1aWQ6IG5vZGUudXVpZCxcbiAgICAgICAgICAgIHBhdGg6ICduYW1lJyxcbiAgICAgICAgICAgIGR1bXA6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICB2bS5kaWFsb2dFcnJvcigncmVuYW1lRmFpbCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcbiAgICAgICAgdHJlZURhdGEudXVpZFRvU3RhdGVbdXVpZF0gPSAnJztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaJp+ihjOaQnOe0olxuICAgICAqL1xuICAgIGFzeW5jIHNlYXJjaCgpIHtcbiAgICAgICAgLy8g5pCc57Si5pyJ5Y+Y5Yqo6YO95YWI5rua5Zue6aG26YOoXG4gICAgICAgIGlmIChwYW5lbERhdGEuJC5wYW5lbC5zZWFyY2hWYWx1ZSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveC5zY3JvbGxUbygwLCAwKTtcblxuICAgICAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFR5cGUgPT09ICdhc3NldCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5maW5kTm9kZXNVc2VBc3NldCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdm0uaW50b1ZpZXdCeVVzZXIgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJlZURhdGEucmVuZGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmi5bliqjkuK3mhJ/nn6XlvZPliY3miYDlpIToioLngrnkvY3nva5cbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKiBAcGFyYW0gcG9zaXRpb24g5L2N572u77yaYmVmb3Jl77yMaW5zaWRl77yMYWZ0ZXJcbiAgICAgKi9cbiAgICBkcmFnT3Zlcih1dWlkOiBzdHJpbmcsIHBvc2l0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodXVpZCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICB1dWlkID0gdm0uZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZHJhZyDmgqzlgZzkuIDmrrXml7bpl7TlkI7oh6rliqjlsZXlvIDoioLngrlcbiAgICAgICAgICAgIGNvbnN0IG5vd1RpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgaWYgKGRyYWdPdmVyVXVpZCAhPT0gdXVpZCkge1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVXVpZCA9IHV1aWQ7XG4gICAgICAgICAgICAgICAgZHJhZ092ZXJUaW1lID0gbm93VGltZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vd1RpbWUgLSBkcmFnT3ZlclRpbWUgPiA4MDAgJiYgIXRyZWVEYXRhLnV1aWRUb0V4cGFuZFtub2RlLnV1aWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShub2RlLnV1aWQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFuZWxEYXRhLiQudmlld0JveC5zY3JvbGxUb3AgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgbm9kZUhlaWdodCwgaWNvbldpZHRoLCBwYWRkaW5nIH0gPSBwYW5lbERhdGEuY29uZmlnO1xuICAgICAgICAgICAgY29uc3QgeyBjbGllbnRIZWlnaHQsIG9mZnNldEhlaWdodCwgc2Nyb2xsVG9wLCBzY3JvbGxIZWlnaHQgfSA9IHBhbmVsRGF0YS4kLnZpZXdCb3g7XG5cbiAgICAgICAgICAgIGNvbnN0IGlzQXRCb3R0b20gPSBzY3JvbGxUb3AgJiYgY2xpZW50SGVpZ2h0ICsgc2Nyb2xsVG9wID09PSBzY3JvbGxIZWlnaHQ7XG5cbiAgICAgICAgICAgIGNvbnN0IHZpZXdSZWN0ID0gcGFuZWxEYXRhLiQudmlld0JveC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGNvbnN0IHRyZWVSZWN0ID0gdm0uJGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgY29uc3QgYWRqdXN0VG9wID0gdmlld1JlY3QudG9wIC0gdHJlZVJlY3QudG9wO1xuXG4gICAgICAgICAgICBjb25zdCBhZGp1c3RTY3JvbGxUb3AgPSB2bS5zY3JvbGxUb3AgJSBub2RlSGVpZ2h0O1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsYmFySGVpZ2h0ID0gb2Zmc2V0SGVpZ2h0IC0gY2xpZW50SGVpZ2h0O1xuXG4gICAgICAgICAgICBjb25zdCBkZXB0aExlZnQgPSBub2RlLmRlcHRoICogaWNvbldpZHRoO1xuICAgICAgICAgICAgY29uc3QgZGlzcGxheVRvcCA9IHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHV1aWQpICogbm9kZUhlaWdodDtcblxuICAgICAgICAgICAgbGV0IHRvcCA9IGRpc3BsYXlUb3AgLSBhZGp1c3RUb3AgKyBhZGp1c3RTY3JvbGxUb3AgKyBwYWRkaW5nO1xuICAgICAgICAgICAgbGV0IGFkanVzdFZlcnRpY2FsSGVpZ2h0ID0gLTEzO1xuXG4gICAgICAgICAgICBpZiAoaXNBdEJvdHRvbSkge1xuICAgICAgICAgICAgICAgIGFkanVzdFZlcnRpY2FsSGVpZ2h0IC09IDI7XG4gICAgICAgICAgICAgICAgdG9wICs9IHNjcm9sbGJhckhlaWdodDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGhlaWdodCA9IG5vZGVIZWlnaHQ7XG4gICAgICAgICAgICBsZXQgekluZGV4ID0gMDtcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdExlZnQgPSAtMztcblxuICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB2bS4kZWwub2Zmc2V0V2lkdGggLSBkZXB0aExlZnQgLSBhZGp1c3RMZWZ0O1xuICAgICAgICAgICAgY29uc3QgbGVmdCA9IGRlcHRoTGVmdCArIGFkanVzdExlZnQ7XG4gICAgICAgICAgICBjb25zdCBwYXJlbnRUb3AgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW3V1aWRdKSAqIG5vZGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAyO1xuICAgICAgICAgICAgICAgICAgICB6SW5kZXggPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnYWZ0ZXInOlxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAyO1xuICAgICAgICAgICAgICAgICAgICB6SW5kZXggPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgdG9wID0gKHRyZWVEYXRhLmRpc3BsYXlBcnJheS5pbmRleE9mKHV0aWxzLmdlTGFzdEV4cGFuZENoaWxkVXVpZCh1dWlkKSkgKyAxKSAqIG5vZGVIZWlnaHQgKyBwYWRkaW5nO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRvcCA9IE1hdGgubWluKHNjcm9sbEhlaWdodCAtIGhlaWdodCwgdG9wKTtcblxuICAgICAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkgJiYgWydiZWZvcmUnLCAnYWZ0ZXInXS5pbmNsdWRlcyhwb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmRyb3BCb3ggPSB7XG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICAgICAgdG9wOiB0b3AgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiBsZWZ0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICB6SW5kZXgsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbDoge1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRvcCAtIHBhcmVudFRvcCArIGFkanVzdFZlcnRpY2FsSGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDov5vlhaUgdHJlZSDlrrnlmahcbiAgICAgKi9cbiAgICBkcmFnRW50ZXIoKSB7XG4gICAgICAgIC8vIOaQnOe0ouaooeW8j+S4i++8jOS4jeivhuWIq+S4uuaLluWFpSB0cmVlIOWuueWZqFxuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZHJvcEJveC5zdHlsZSA9IHtcbiAgICAgICAgICAgICAgICB0b3A6ICctMnB4JyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdEFuaW1hdGlvbklkKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbklkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgIHZtLmRyYWdPdmVyKCcnLCAnYWZ0ZXInKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBkcm9wIOWIsOmdouadv+epuueZveWMuuWfn+mHjFxuICAgICAqIEBwYXJhbSBldmVudCDpvKDmoIfkuovku7ZcbiAgICAgKi9cbiAgICBkcm9wKGV2ZW50OiBEcmFnRXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ICYmICFldmVudC50YXJnZXQuaGFzQXR0cmlidXRlKCdob3ZpbmcnKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoRWRpdG9yLlVJLkRyYWdBcmVhLmN1cnJlbnREcmFnSW5mbykpIHx8IHt9O1xuXG4gICAgICAgIC8vIGNjLlNjZW5lIOagueiKgueCuVxuICAgICAgICBkYXRhLnRvID0gdm0uZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICBkYXRhLmluc2VydCA9ICdpbnNpZGUnO1xuICAgICAgICBkYXRhLmNvcHkgPSBldmVudC5jdHJsS2V5O1xuICAgICAgICBkYXRhLmtlZXBXb3JsZFRyYW5zZm9ybSA9ICFldmVudC5zaGlmdEtleTtcbiAgICAgICAgdm0uaXBjRHJvcChkYXRhKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCueaLluWKqFxuICAgICAqIEBwYXJhbSBqc29uIERyYWdOb2RlXG4gICAgICovXG4gICAgYXN5bmMgaXBjRHJvcChqc29uOiBEcmFnTm9kZSkge1xuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5mb2N1c1dpbmRvdygpO1xuXG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5jbGVhclNlYXJjaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L+d5a2Y5Y6G5Y+y6K6w5b2VXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG5cbiAgICAgICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IHZhbHVlczogYW55W10gPSBbXTtcblxuICAgICAgICBjb25zdCB7IHZhbHVlLCB0eXBlLCBuYW1lIH0gPSBqc29uO1xuICAgICAgICBsZXQgeyBhZGRpdGlvbmFsIH0gPSBqc29uO1xuXG4gICAgICAgIHZtLnRvZ2dsZShqc29uLnRvLCB0cnVlKTtcbiAgICAgICAgaWYgKGFkZGl0aW9uYWwpIHtcbiAgICAgICAgICAgIC8vIOWinuWKoOS4gOWkhOWuuemUmVxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFkZGl0aW9uYWwpKSB7XG4gICAgICAgICAgICAgICAgYWRkaXRpb25hbCA9IFthZGRpdGlvbmFsXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiDnlLHkuo7miYDmnInnmoTlrZDotYTmupDkuZ/lnKggYWRkaXRpb25hbCDmlbDmja7ph4xcbiAgICAgICAgICAgICAqIOaXoOazleWMuuWIhuWkmumAieWtkOi1hOa6kOeahOaDheWGteS6hlxuICAgICAgICAgICAgICog5pWF57qm5a6a5LiA5Liq5a6e5L2T6LWE5rqQ5Y+q5Y+W5LiA5Liq5ZCI5rOV55qE5pWw5o2uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkQXNzZXRVdWlkczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgYWRkaXRpb25hbC5mb3JFYWNoKChpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodm0uZHJvcHBhYmxlVHlwZXMuaW5jbHVkZXMoaW5mby50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbYXNzZXRVdWlkLCBzdWJBc3NldFV1aWRdID0gaW5mby52YWx1ZS5zcGxpdCgnQCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhwZWN0ZWRBc3NldFV1aWRzLmluY2x1ZGVzKGFzc2V0VXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZEFzc2V0VXVpZHMucHVzaChhc3NldFV1aWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHV1aWRzLnB1c2goaW5mby52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKGluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKCF2bS5kcm9wcGFibGVUeXBlcy5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlICYmICF1dWlkcy5pbmNsdWRlcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHV1aWRzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgdmFsdWVzLnB1c2goeyB0eXBlLCB2YWx1ZSwgbmFtZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbHVlcyDmnInov4fmu6TkuoYgYWRkaXRpb25hbCDoioLngrnnu4Tku7bmlbDmja7vvIzph43nva7nu5kgYWRkaXRpb25hbFxuICAgICAgICBqc29uLmFkZGl0aW9uYWwgPSB2YWx1ZXM7XG5cbiAgICAgICAgaWYgKGpzb24udHlwZSA9PT0gJ2NjLk5vZGUnKSB7XG4gICAgICAgICAgICBpZiAoIXV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGpzb24uY29weSkge1xuICAgICAgICAgICAgICAgIC8vIOaMieS9j+S6hiBjdHJsIOmUru+8jOaLluWKqOWkjeWItlxuICAgICAgICAgICAgICAgIGF3YWl0IHZtLmNvcHkodXVpZHMpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHZtLnBhc3RlKGpzb24udG8sIGpzb24ua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZtLm1vdmUoanNvbik7XG4gICAgICAgIH0gZWxzZSBpZiAocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLnR5cGVzICYmIHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcy5pbmNsdWRlcyhqc29uLnR5cGUpKSB7XG4gICAgICAgICAgICAvLyDor6XnsbvlnovnmoTkuovku7bmnInlpJbpg6jms6jlhoznmoTliqjkvZzvvIzovaznlLHlpJbpg6jms6jlhozkuovku7bmjqXnrqFcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IE9iamVjdC52YWx1ZXMocGFuZWxEYXRhLmNvbmZpZy5leHRlbmREcm9wLmNhbGxiYWNrc1tqc29uLnR5cGVdKSBhcyBGdW5jdGlvbltdO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrcyAmJiBBcnJheS5pc0FycmF5KGNhbGxiYWNrcykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKGpzb24udG8pO1xuICAgICAgICAgICAgICAgIGlmICh0b05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9QYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtqc29uLnRvXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9JbmRleCA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3RvUGFyZW50VXVpZF0uaW5kZXhPZihqc29uLnRvKTtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3MuZm9yRWFjaCgoY2FsbGJhY2s6IEZ1bmN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmZvOiBEcm9wQ2FsbGJhY2tJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGU6IHRvTm9kZS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogdG9QYXJlbnRVdWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB0b0luZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBqc29uLmluc2VydCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGluZm8sIGpzb24uYWRkaXRpb25hbCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1V1aWRzID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmNvbmZpZy5jcmVhdGFibGVUeXBlcy5pbmNsdWRlcyhhc3NldC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDlsIbooqvms6jlhaXmlbDmja7nmoTlr7nosaFcbiAgICAgICAgICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKGpzb24udG8pO1xuICAgICAgICAgICAgICAgIGlmICghdG9Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldFV1aWQgPSBhc3NldC52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCB0b1BhcmVudFV1aWQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2pzb24udG9dO1xuXG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudCA9IGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJyA/IGpzb24udG8gOiB0b1BhcmVudFV1aWQ7XG5cbiAgICAgICAgICAgICAgICAvLyDmi5bliLAgcHJlZmFiIOagueiKgueCueeahOmhtumDqOaUvue9ru+8jOmcgOimgei9rOS4uuaUvue9ruWcqOWGhemDqFxuICAgICAgICAgICAgICAgIGlmICh0b05vZGUuaXNQcmVmYWJSb290ICYmIGpzb24uaW5zZXJ0ICE9PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBqc29uLnRvO1xuICAgICAgICAgICAgICAgICAgICBqc29uLmluc2VydCA9ICdpbnNpZGUnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZtLmFkZE5vZGUucGFyZW50ID0gcGFyZW50O1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3VXVpZCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1ub2RlJywge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQsXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgdW5saW5rUHJlZmFiOiBhc3NldC51bmxpbmtQcmVmYWIsXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhc1JlcXVpcmVkOiBhc3NldC5jYW52YXNSZXF1aXJlZCxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHZtLmFkZE5vZGUucGFyZW50ID0gJyc7XG5cbiAgICAgICAgICAgICAgICBuZXdVdWlkcy5wdXNoKG5ld1V1aWQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgICAgICAgICAvLyDkuIrmraXlt7LmlrDlop7lrozmr5VcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdG9BcnIgPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlblt0b1BhcmVudFV1aWRdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvSW5kZXggPSB0b0Fyci5pbmRleE9mKGpzb24udG8pO1xuXG4gICAgICAgICAgICAgICAgbGV0IG9mZnNldCA9IHRvSW5kZXggLSB0b0Fyci5sZW5ndGg7IC8vIOebruagh+e0ouW8leWHj+WOu+iHqui6q+e0ouW8lVxuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPCAwICYmIGpzb24uaW5zZXJ0ID09PSAnYWZ0ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWwj+S6jjDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvliY3vvIzlpoLmnpzmmK8gYWZ0ZXIg6KaBICsxXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ID4gMCAmJiBqc29uLmluc2VydCA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aSn5LqOMOeahOWBj+enu+m7mOiupOaYr+aOkuWcqOebruagh+WFg+e0oOS5i+WQju+8jOWmguaenOaYryBiZWZvcmUg6KaBIC0xXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCAtPSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWcqOeItue6p+mHjOW5s+enu1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLm1vdmVOb2RlKHRvUGFyZW50VXVpZCwgdG9BcnIubGVuZ3RoLCBvZmZzZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgICAgICAvLyDpgInkuK3mlrDnmoToioLngrlcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdChuZXdVdWlkcyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItlxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGNvcHkodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvcGllcyA9IFtdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgY29waWVzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzID0gY29waWVzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlICYmICF1dGlscy5jYW5Ob3RDb3B5Tm9kZShub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbih2YWxpZFV1aWRzKTtcblxuICAgICAgICBhd2FpdCB0cmVlRGF0YS5jb3B5Tm9kZShjb3BpZWRVdWlkcyk7XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGNvcGllZFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDnspjotLRcbiAgICAgKiBAcGFyYW0gdXVpZCDnm67moIfoioLngrnvvIwgIXBhc3RlQXNDaGlsZCDml7bpu5jorqTnspjotLTliLDnm67moIfoioLngrnlkIznuqdcbiAgICAgKiBAcGFyYW0ga2VlcFdvcmxkVHJhbnNmb3JtIOaYr+WQpuS/neaMgeS4lueVjOWdkOagh1xuICAgICAqIEBwYXJhbSBwYXN0ZUFzQ2hpbGQg5piv5ZCm57KY6LS05Li655uu5qCH6IqC54K555qE5a2Q6IqC54K5XG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcGFzdGUodXVpZDogc3RyaW5nLCBrZWVwV29ybGRUcmFuc2Zvcm0gPSBmYWxzZSwgcGFzdGVBc0NoaWxkPzogYm9vbGVhbikge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkv53lrZjljoblj7LorrDlvZVcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcblxuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHV1aWQgPSB0aGlzLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjlhYjlpITnkIbliarliIfnmoTmg4XlhrVcbiAgICAgICAgY29uc3Qgbm9kZXNJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdub2Rlcy1pbmZvJyk7XG4gICAgICAgIGlmIChub2Rlc0luZm8gJiYgbm9kZXNJbmZvLnR5cGUgPT09ICdjdXQnICYmIG5vZGVzSW5mby51dWlkcy5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCA9PT0gbm9kZXNJbmZvLnByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBjdXRVdWlkcyA9IG5vZGVzSW5mby51dWlkcztcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbihjdXRVdWlkcyk7XG4gICAgICAgICAgICBpZiAodmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbW92ZURhdGE6IERyYWdOb2RlID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5Ob2RlJyxcbiAgICAgICAgICAgICAgICB0bzogdXVpZCxcbiAgICAgICAgICAgICAgICBpbnNlcnQ6ICdpbnNpZGUnLFxuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWw6IHZhbGlkVXVpZHMubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHV1aWQsIHR5cGU6ICdjYy5Ob2RlJyB9O1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybSxcbiAgICAgICAgICAgICAgICBjb3B5OiBmYWxzZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IHZtLm1vdmUobW92ZURhdGEpO1xuXG4gICAgICAgICAgICAvLyDmuIXnqbrliarliIfmnb9cbiAgICAgICAgICAgIEVkaXRvci5DbGlwYm9hcmQuY2xlYXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWPquWPr+WcqOmhueebruWGheWkjeWItueymOi0tFxuICAgICAgICBpZiAobm9kZXNJbmZvICYmIG5vZGVzSW5mby50eXBlID09PSAnY29weScgJiYgbm9kZXNJbmZvLnV1aWRzLmxlbmd0aCAmJiBFZGl0b3IuUHJvamVjdC5wYXRoID09PSBub2Rlc0luZm8ucHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gbm9kZXNJbmZvLnV1aWRzO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkcyA9IHV0aWxzLmZpbHRlckNoaWxkcmVuKGNvcGllZFV1aWRzKTtcbiAgICAgICAgICAgICAgICAvLyDmlrDnmoTpgInkuK3pobnliIfmjaLkuLrmlrDoioLngrlcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5wYXN0ZU5vZGUodXVpZCwgdmFsaWRVdWlkcywga2VlcFdvcmxkVHJhbnNmb3JtLCBwYXN0ZUFzQ2hpbGQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliarliIdcbiAgICAgKiDliarliIfmmK/pooTlrprnmoTooYzkuLrvvIzlj6rmnInlho3miafooYznspjotLTmk43kvZzmiY3kvJrnlJ/mlYhcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBjdXQodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGN1dHMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGN1dHMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5p2l6Ieq5Y+z5Ye76I+c5Y2V55qE5Y2V5Liq6YCJ5Lit77yM5Y+z5Ye76IqC54K55LiN5Zyo5bey6YCJ6aG555uu6YeMXG4gICAgICAgICAgICBpZiAodXVpZCAmJiAhcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgY3V0cyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3V0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5LiN5Y+v5Ymq5YiH55qE6IqC54K5XG4gICAgICAgIGNvbnN0IGN1dFV1aWRzID0gY3V0cy5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZSAmJiAhdXRpbHMuY2FuTm90Q3V0Tm9kZShub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGN1dFV1aWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGN1dFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOmAmuefpSBzY2VuZSDlkIzmraXmiafooYwgY3V0XG4gICAgICAgIGF3YWl0IHRyZWVEYXRhLmN1dE5vZGUoY3V0VXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWL6ZqGXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgYXN5bmMgZHVwbGljYXRlKHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkdXBsaWNhdGVzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBkdXBsaWNhdGVzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi/h+a7pOS4jeWPr+WkjeWItueahOiKgueCuVxuICAgICAgICBjb25zdCB1dWlkcyA9IHV0aWxzLmZpbHRlckNoaWxkcmVuKGR1cGxpY2F0ZXMpLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlICYmICF1dGlscy5jYW5Ob3RDb3B5Tm9kZShub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS/neWtmOWOhuWPsuiusOW9lVxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlj6/og73mmK/mibnph4/mk43kvZzvvIznu5nliqDkuKrplIFcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLmR1cGxpY2F0ZU5vZGUodXVpZHMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOenu+WKqFxuICAgICAqIEBwYXJhbSBqc29uIERyYWdOb2RlXG4gICAgICovXG4gICAgYXN5bmMgbW92ZShqc29uOiBEcmFnTm9kZSkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb24gfHwgIWpzb24udG8gfHwgIUFycmF5LmlzQXJyYXkoanNvbi5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXVpZHMgPSBqc29uLmFkZGl0aW9uYWwubWFwKChpbmZvOiBEcmFnTm9kZUluZm8pID0+IGluZm8udmFsdWUpO1xuXG4gICAgICAgIC8vIOenu+WKqOeahOWFg+e0oOaciemHjeWPoFxuICAgICAgICBpZiAodXVpZHMuaW5jbHVkZXMoanNvbi50bykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwhuiiq+azqOWFpeaVsOaNrueahOWvueixoVxuICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKGpzb24udG8pO1xuICAgICAgICBjb25zdCB0b1BhcmVudCA9IHV0aWxzLmdldFBhcmVudChqc29uLnRvKTtcblxuICAgICAgICBpZiAoIXRvTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvTm9kZS5pc1ByZWZhYlJvb3QgJiYganNvbi5pbnNlcnQgIT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAvLyDkuI3og73np7vliqjliLDlvZPliY3nvJbovpHnmoQgcHJlZmFiIOagueiKgueCueeahOWJjeWQjlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvTm9kZS5pc1NjZW5lICYmIGpzb24uaW5zZXJ0ICE9PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgLy8g5ouW5Yqo5Yiw5Zy65pmv5qC56IqC54K555qE5YmN5ZCO5L2N572u77yM5Lmf55u45b2T5LqO5ouW6L+b6YeM6Z2iXG4gICAgICAgICAgICBqc29uLmluc2VydCA9ICdpbnNpZGUnO1xuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShqc29uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnROb2RlID0gdG9Ob2RlO1xuICAgICAgICBpZiAodG9QYXJlbnQgJiYgWydiZWZvcmUnLCAnYWZ0ZXInXS5pbmNsdWRlcyhqc29uLmluc2VydCkpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUgPSB0b1BhcmVudDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJlbnROb2RlVXVpZCA9IHBhcmVudE5vZGUudXVpZDtcblxuICAgICAgICAvLyDlpJroioLngrnnmoTnp7vliqjvvIzmoLnmja7njrDmnInmjpLluo/nmoTpobrluo/miafooYxcbiAgICAgICAgY29uc3QgZnJvbVV1aWRzOiBzdHJpbmdbXSA9IHV1aWRzXG4gICAgICAgICAgICAubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB0b05vZGUg6IqC54K55pivIGZyb21Ob2RlIOeahOWtkOmbhu+8jOeItuS4jeiDveenu+WIsOWtkOmHjOmdoiwg5Y+W5raI56e75YqoXG4gICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIGpzb24udG8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgZnJvbU5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmcm9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJyAmJiBwYXJlbnROb2RlID09PSBmcm9tUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdXVpZDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS51dWlkVG9JbmRleFthXSAtIHRyZWVEYXRhLnV1aWRUb0luZGV4W2JdO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5peg6IqC54K556e75YqoXG4gICAgICAgIGlmICghZnJvbVV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5byA5aeL5omn6KGMXG4gICAgICAgIGxldCBhZGp1c3RJbmRleCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgZnJvbVV1aWQgb2YgZnJvbVV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBmcm9tTm9kZSA9IHV0aWxzLmdldE5vZGUoZnJvbVV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gZnJvbVV1aWQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtmcm9tVXVpZF07XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlVXVpZCAhPT0gZnJvbVBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5zZXRQYXJlbnQocGFyZW50Tm9kZVV1aWQsIFtmcm9tVXVpZF0sIGpzb24ua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFbJ2JlZm9yZScsICdhZnRlciddLmluY2x1ZGVzKGpzb24uaW5zZXJ0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnjrDmnIkgYXBpIOS4i++8jOi/meS4gOatpeW+l+afpeivouWunuaXtuS9jee9ru+8jOaJjeWlveWHhuehruenu+WKqOWIsOaWsOS9jee9rlxuICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZUluZm8gPSBhd2FpdCB0cmVlRGF0YS5nZXREdW1wRGF0YShwYXJlbnROb2RlLnV1aWQpO1xuICAgICAgICAgICAgY29uc3QgdG9Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IHRvTm9kZS51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IGZyb21Ob2RlLnV1aWQpO1xuXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdG9Ob2RlSW5kZXggLSBmcm9tTm9kZUluZGV4O1xuXG4gICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdhZnRlcicpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlsI/kuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvliY3vvIzlpoLmnpzmmK8gYWZ0ZXIg6KaBICsxXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gYWRqdXN0SW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChqc29uLmluc2VydCA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpKfkuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvlkI7vvIzlpoLmnpzmmK8gYmVmb3JlIOimgSAtMVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgLT0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLm1vdmVOb2RlKHBhcmVudE5vZGUudXVpZCwgZnJvbU5vZGVJbmRleCwgb2Zmc2V0KTtcblxuICAgICAgICAgICAgYWRqdXN0SW5kZXgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmoJHlvaLmlbDmja7lt7LmlLnlj5hcbiAgICAgKiDlpoLoioLngrnlop7liKDmlLnvvIzmmK/ovoPlpKfnmoTlj5jliqjvvIzpnIDopoHph43mlrDorqHnrpflkITkuKrphY3lpZfmlbDmja5cbiAgICAgKi9cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIC8vIOWuueWZqOeahOaVtOS9k+mrmOW6plxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC50cmVlSGVpZ2h0ID0gdHJlZURhdGEuZGlzcGxheUFycmF5Lmxlbmd0aCAqIHBhbmVsRGF0YS5jb25maWcubm9kZUhlaWdodCArIHBhbmVsRGF0YS5jb25maWcucGFkZGluZyAqIDI7XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuYWxsRXhwYW5kID0gdXRpbHMuaXNBbGxFeHBhbmQoKTtcblxuICAgICAgICB3aGlsZSAocGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcmVhZHlUd2lua2xlID0gcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWVzLnNoaWZ0KCk7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZChyZWFkeVR3aW5rbGUudXVpZCwgcmVhZHlUd2lua2xlLmFuaW1hdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDph43mlrDmuLLmn5Plh7rmoJHlvaJcbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlnKjmlbDmja7kuI3lj5jnmoTmg4XlhrXkuIvvvIzmoLnmja7mu5rliqjkvY3nva7muLLmn5PmoJHlvaJcbiAgICAgKi9cbiAgICBmaWx0ZXIoKSB7XG4gICAgICAgIC8vIOmdouadv+aLluaLveWIsCB0YWIg6YeM5LiN5Lya56uL5Y2z5pi+56S677yM6ZyA6KaB5omL5Yqo5YiH5o2iIHRhYu+8jOWcqOWIh+aNouWJjemdouadvyBoZWlnaHQ9MFxuICAgICAgICAvLyDop4Tpgb8gaGVpZ2h0PTAg6Z2e5q2j5bi45oOF5Ya15LiL5b6A5LiL5omn6KGM6ZSZ6K+v6K6h566X77yM5Zyo5YiH5o2iIHRhYiDlkI7kvJrmiafooYwgc2hvdyDov5vooYzmraPnoa7nmoTorqHnrpfmuLLmn5NcbiAgICAgICAgaWYgKCFwYW5lbERhdGEuJC5wYW5lbC52aWV3SGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5YWI5riF56m677yM6L+Z56eN6LWL5YC85py65Yi25omN6IO95Yi35pawIHZ1Ze+8jOiAjCAubGVuZ3RoID0gMCDkuI3ooYxcbiAgICAgICAgdm0ubm9kZXMgPSBbXTtcblxuICAgICAgICBjb25zdCBub2RlSGVpZ2h0ID0gcGFuZWxEYXRhLmNvbmZpZy5ub2RlSGVpZ2h0O1xuICAgICAgICBjb25zdCBzY3JvbGxUb3AgPSB2bS5zY3JvbGxUb3A7XG5cbiAgICAgICAgY29uc3QgdG9wID0gc2Nyb2xsVG9wICUgbm9kZUhlaWdodDtcbiAgICAgICAgLy8g566X5Ye65Y+v6KeG5Yy65Z+f55qEIHRvcCDmnIDlsI/lgLxcbiAgICAgICAgY29uc3QgbWluID0gc2Nyb2xsVG9wIC0gdG9wO1xuICAgICAgICAvLyDmnIDlpKflgLxcbiAgICAgICAgY29uc3QgbWF4ID0gbWluICsgcGFuZWxEYXRhLiQucGFuZWwudmlld0hlaWdodDtcblxuICAgICAgICB2bS4kZWwuc3R5bGUudG9wID0gYC0ke3RvcH1weGA7XG5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSBNYXRoLnJvdW5kKG1pbiAvIG5vZGVIZWlnaHQpO1xuICAgICAgICBjb25zdCBlbmQgPSBNYXRoLmNlaWwobWF4IC8gbm9kZUhlaWdodCkgKyAxO1xuXG4gICAgICAgIHZtLm5vZGVzID0gdHJlZURhdGEub3V0cHV0RGlzcGxheShzdGFydCwgZW5kKTtcblxuICAgICAgICBjbGVhclRpbWVvdXQodm0uc2Nyb2xsSW50b1ZpZXdUaW1lSWQpO1xuICAgICAgICB2bS5zY3JvbGxJbnRvVmlld1RpbWVJZCA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHZtLmludG9WaWV3QnlVc2VyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG9uZSA9IGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlVc2VyKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+U5Zue6IqC54K5IHV1aWRcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdCgpIHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF07XG5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdm0uZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bpgInkuK3liJfooajmlbDnu4TkuK3mnIDlkI7kuIDkuKroioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57nqbpcbiAgICAgKi9cbiAgICBnZXRMYXN0U2VsZWN0KCkge1xuICAgICAgICBjb25zdCBsZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBwYW5lbERhdGEuYWN0LnNlbGVjdHNbbGVuZ3RoIC0gMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdm0uZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bop4bop4nkuIrmoJHlvaLkuIrkuIvliJfooajkuK3vvIznrKzkuIDkuKrpgInkuK3oioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57pobblsYLmoLnoioLngrlcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKSB7XG4gICAgICAgIGxldCB1dWlkID0gJyc7XG4gICAgICAgIGxldCBpbmRleCA9IEluZmluaXR5O1xuXG4gICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5mb3JFYWNoKChzZWxlY3Q6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKHRyZWVEYXRhLnV1aWRUb0luZGV4W3NlbGVjdF0gPCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gdHJlZURhdGEudXVpZFRvSW5kZXhbc2VsZWN0XTtcbiAgICAgICAgICAgICAgICB1dWlkID0gc2VsZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdXVpZCB8fCB0cmVlRGF0YS5ub2RlVHJlZT8udXVpZDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/lOWbnuagkeW9ouesrOS4gOS4quiKgueCuVxuICAgICAqIOesrOS4gOS4quiKgueCue+8jOS4jeS4gOWumuaYr+agueiKgueCue+8jOS+i+WmguWcqOaQnOe0oueahOaDheWGteS4i1xuICAgICAqL1xuICAgIGdldEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZURhdGEubm9kZVRyZWU/LnV1aWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5WzBdO1xuICAgIH0sXG4gICAgaXNBY3RpdmUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc0FjdGl2ZSh1dWlkKTtcbiAgICB9LFxuICAgIGlzRXhwYW5kKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNFeHBhbmQodXVpZCk7XG4gICAgfSxcbiAgICBpc1BhcmVudCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzUGFyZW50KHV1aWQpO1xuICAgIH0sXG4gICAgaXNTZWxlY3RlZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzU2VsZWN0ZWQodXVpZCk7XG4gICAgfSxcbiAgICBpc0FuaW1hdGluZyh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzQW5pbWF0aW5nKHV1aWQgfHwgcGFuZWxEYXRhLmFjdC5hbmltYXRpb25VdWlkKTtcbiAgICB9LFxuICAgIGlzU2VhcmNoaW5nKCkge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNTZWFyY2hpbmcoKTtcbiAgICB9LFxuICAgIGFzeW5jIGRpYWxvZ0Vycm9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLmVycm9yKEVkaXRvci5JMThuLnQoYGhpZXJhcmNoeS5vcGVyYXRlLiR7bWVzc2FnZX1gKSwge1xuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5vcGVyYXRlLmRpYWxvZ0Vycm9yJyksXG4gICAgICAgIH0pO1xuICAgIH0sXG59O1xuXG4vKipcbiAqIHZ1ZSBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXRhKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5vZGVzOiBbXSwgLy8g5b2T5YmN5qCR5b2i5Zyo5Y+v6KeG5Yy65Z+f55qE6IqC54K55pWw5o2uXG4gICAgICAgIHJlbmFtZVV1aWQ6ICcnLCAvLyDpnIDopoEgcmVuYW1lIOeahOiKgueCueeahCB1cmzvvIzlj6rmnInkuIDkuKpcbiAgICAgICAgYWRkTm9kZToge1xuICAgICAgICAgICAgLy8g5re75Yqg5LiA5Liq5paw6IqC54K55YmN55qE5pWw5o2u77yM6ZyA6KaB5LqL5YmN6YeN5ZG95ZCNXG4gICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgIHBhcmVudDogJycsXG4gICAgICAgICAgICBzaWJsaW5nOiAnJyxcbiAgICAgICAgfSxcbiAgICAgICAgaW50b1ZpZXdCeVVzZXI6ICcnLCAvLyDnlKjmiLfmk43kvZzvvJrpgInkuK3vvIzmlrDlop7vvIznp7vliqjvvIznu5nkuojlrprkvY1cbiAgICAgICAgc2Nyb2xsVG9wOiAwLCAvLyDlvZPliY3moJHlvaLnmoTmu5rliqjmlbDmja5cbiAgICAgICAgZHJvcHBhYmxlVHlwZXM6IFtdLFxuICAgICAgICB0d2lua2xlczoge30sIC8vIOmcgOimgemXqueDgeeahCB1dWlkXG4gICAgICAgIGNoZWNrU2hpZnRVcERvd25NZXJnZTogeyB1dWlkOiAnJywgZGlyZWN0aW9uOiAnJyB9LCAvLyBzaGlmdCArIOeureWktOWkmumAie+8jOWinuW8uuS6pOS6kuaViOaenFxuICAgIH07XG59XG5cbi8qKlxuICogdm0gPSB0aGlzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtb3VudGVkKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB2bSA9IHRoaXM7XG59XG4iXX0=