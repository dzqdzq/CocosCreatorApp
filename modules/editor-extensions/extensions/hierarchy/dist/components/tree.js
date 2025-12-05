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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9jb21wb25lbnRzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSWIsK0JBQTRCO0FBQzVCLDJCQUFrQztBQUNsQyx3REFBMEM7QUFDMUMsc0RBQXdDO0FBQ3hDLCtDQUFpQztBQUVqQyxJQUFJLEVBQUUsR0FBUSxJQUFJLENBQUM7QUFDbkIsSUFBSSxrQkFBdUIsQ0FBQztBQUM1QixJQUFJLGNBQW1CLENBQUM7QUFDeEIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRXpCLHNCQUFzQjtBQUN0QixJQUFJLFlBQWlCLENBQUM7QUFDdEIsSUFBSSxZQUFpQixDQUFDO0FBRVQsUUFBQSxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBRWQsUUFBQSxRQUFRLEdBQUcsaUJBQVksQ0FBQyxXQUFJLENBQUMsU0FBUyxFQUFFLGlDQUFpQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFcEYsUUFBQSxVQUFVLEdBQUc7SUFDdEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUM7Q0FDdEMsQ0FBQztBQUVXLFFBQUEsS0FBSyxHQUFHO0lBQ2pCOzs7T0FHRztJQUNILFNBQVM7UUFDTCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztDQUNKLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBRztJQUNuQjs7O09BR0c7SUFDSCxDQUFDLENBQUMsR0FBVztRQUNULE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFDRDs7T0FFRztJQUNILE1BQU07UUFDRixNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN6RixFQUFFLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakYsQ0FBQztJQUNEOztPQUVHO0lBQ0gsS0FBSztRQUNELFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUNEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDVCxJQUFJLFlBQVksRUFBRTtZQUNkLE9BQU87U0FDVjtRQUVELFlBQVksR0FBRyxJQUFJLENBQUM7UUFFcEIsaURBQWlEO1FBQ2pELE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUU3QyxJQUFJO1lBQ0EsTUFBTSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDMUI7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDeEI7UUFFRCxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLENBQUM7SUFDRDs7O09BR0c7SUFDSCxTQUFTLENBQUMsSUFBWTtRQUNsQixJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUNyQixNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELE9BQU87U0FDVjtRQUVELElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLDJCQUEyQixFQUFFLENBQUM7UUFDaEQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqQyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTztTQUNWO1FBRUQsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLDhCQUE4QjtRQUMxRixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFeEQsTUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckQsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqRCxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDekIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQW1CLEVBQUUsRUFBRTtZQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUM5QyxhQUFhLEdBQUcsS0FBSyxDQUFDO2FBQ3pCO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLGFBQWEsRUFBRTtZQUNmLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM1QyxPQUFPO1NBQ1Y7YUFBTTtZQUNILElBQUksVUFBVSxFQUFFO2dCQUNaLGVBQWU7Z0JBQ2YsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQWMsRUFBRSxFQUFFO29CQUN0QyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDaEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO3FCQUM3QztnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFFSCxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDakQ7aUJBQU07Z0JBQ0gsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRS9CLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN2QixNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7aUJBQ2pEO3FCQUFNO29CQUNILE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3ZELE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztpQkFDN0M7YUFDSjtTQUNKO0lBQ0wsQ0FBQztJQUNELFdBQVc7UUFDUCxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsUUFBUSxDQUFDLEtBQXdCO1FBQzdCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3ZCLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ25CO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFO1lBQzNCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3ZDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFakMsRUFBRSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7Z0JBRXpCLGlCQUFpQjtnQkFDakIsSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRTtvQkFDeEMsRUFBRSxDQUFDLHdCQUF3QixFQUFFLENBQUM7aUJBQ2pDO2FBQ0o7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsVUFBVSxDQUFDLElBQVk7UUFDbkIsSUFBSSxFQUFFLENBQUMsY0FBYyxLQUFLLElBQUksRUFBRTtZQUM1QixFQUFFLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVsRCxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtZQUNkLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDMUM7UUFFRCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUNEOztPQUVHO0lBQ0gsVUFBVTtRQUNOLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNmLE9BQU87U0FDVjtRQUNELEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkIsTUFBTSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwQyxLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsVUFBVSxDQUFDLElBQVk7UUFDbkIsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3BDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkIsT0FBTztTQUNWO1FBRUQsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxRQUFRLENBQUM7UUFFbEMsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFN0MsSUFBSSxVQUFVLEtBQUssQ0FBQyxDQUFDLElBQUksU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ3ZDLElBQUksVUFBVSxJQUFJLFNBQVMsRUFBRTtnQkFDekIsS0FBSyxJQUFJLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDMUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDakM7YUFDSjtpQkFBTTtnQkFDSCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLElBQUksU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUMxQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNqQzthQUNKO1NBQ0o7UUFFRCxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDRDs7O09BR0c7SUFDSCxTQUFTLENBQUMsSUFBWTtRQUNsQixJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN0QyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDM0M7YUFBTTtZQUNILE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6QztJQUNMLENBQUM7SUFDRDs7O09BR0c7SUFDSCxTQUFTLENBQUMsSUFBdUI7UUFDN0IsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0IsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFDRDs7T0FFRztJQUNILG1CQUFtQjtRQUNmLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNsQyxJQUFJLElBQUksRUFBRTtZQUNOLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6QztJQUNMLENBQUM7SUFDRDs7T0FFRztJQUNILEtBQUs7UUFDRCxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRTtZQUN2QixPQUFPO1NBQ1Y7UUFFRCxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFhO1FBQ3JCLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3JCLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ25DO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztTQUN2QztRQUVELE1BQU0sTUFBTSxHQUFvQixNQUFNLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1QsT0FBTztTQUNWO1FBRUQsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztRQUUxQixjQUFjO1FBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hELE1BQU0sS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFekMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztRQUUxQixFQUFFLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztJQUN0QixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsVUFBVSxDQUFDLElBQWM7UUFDckIsV0FBVztRQUNYLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUV4QixVQUFVO1FBQ1YsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDdkIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osT0FBTztTQUNWO1FBRUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNULEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNaLE9BQU87U0FDVjtRQUVELElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2hDLFdBQVc7WUFDWCxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPO1NBQ1Y7UUFFRCxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFDRCxNQUFNO1FBQ0YsZUFBZTtRQUNmLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFhO1FBQ25CLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQ3ZCLE9BQU87U0FDVjtRQUVELElBQUk7WUFDQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3JDLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUM5RDtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN4QjtnQkFBUztZQUNOLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDdEMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLElBQVk7UUFDZCxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFYixTQUFTLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUNEOzs7T0FHRztJQUNILE9BQU8sQ0FBQyxJQUFZO1FBQ2hCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUViLGVBQWU7UUFDZixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUN2QixPQUFPO1NBQ1Y7SUFDTCxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFZO1FBQ3JCLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQ3ZCLE9BQU87U0FDVjtRQUVELFNBQVM7UUFDVCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFekMsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDL0Msc0JBQXNCO1lBQ3RCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDUCxPQUFPO2FBQ1Y7WUFDRCxPQUFPO1lBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0IsTUFBTSxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ25DO1NBQ0o7YUFBTTtZQUNILHdCQUF3QjtZQUN4QixNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7WUFDM0IsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBYyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxJQUFJLEVBQUU7b0JBQ1AsT0FBTztpQkFDVjtnQkFDRCxTQUFTO2dCQUNULElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ3RCO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtnQkFDZixPQUFPO2FBQ1Y7WUFFRCxNQUFNLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7UUFFRCx5REFBeUQ7UUFDekQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFDRDs7T0FFRztJQUNILE9BQU87UUFDSCxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUNEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLElBQVksRUFBRSxNQUFlLEVBQUUsSUFBYztRQUNoRCxJQUFJLElBQUksRUFBRTtZQUNOLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ3JDO2FBQU07WUFDSCxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN2QztJQUNMLENBQUM7SUFDRDs7T0FFRztJQUNILFNBQVM7UUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUNwQixPQUFPO1NBQ1Y7UUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDckMsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1FBRTdCLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNuRCxJQUFJLGFBQWEsRUFBRTtZQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BDLElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUUxQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDN0IsVUFBVSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUU7d0JBQy9CLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQ2hEO2lCQUNKO3FCQUFNO29CQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQzVCO2FBQ0o7U0FDSjthQUFNO1lBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hDO1FBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM5QztJQUNMLENBQUM7SUFDRDs7O09BR0c7SUFDSCxlQUFlLENBQUMsU0FBaUI7UUFDN0IsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRWhDLElBQUksU0FBUyxLQUFLLE9BQU8sRUFBRTtZQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkIsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLE9BQU87YUFDVjtZQUVELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQzVDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDN0I7U0FDSjthQUFNLElBQUksU0FBUyxLQUFLLE1BQU0sRUFBRTtZQUM3QixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3RCLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QixPQUFPO2FBQ1Y7WUFFRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsSUFBSSxNQUFNLEVBQUU7Z0JBQ1IsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN4QjtTQUNKO2FBQU07WUFDSCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLElBQUksT0FBTyxDQUFDO1lBQ1osUUFBUSxTQUFTLEVBQUU7Z0JBQ2YsS0FBSyxJQUFJO29CQUNMLE9BQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLE1BQU07Z0JBQ1YsS0FBSyxNQUFNO29CQUNQLE9BQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLE1BQU07YUFDYjtZQUVELElBQUksT0FBTyxFQUFFO2dCQUNULEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzlCO1NBQ0o7SUFDTCxDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxTQUFpQjtRQUMvQixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFNUMsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2QsT0FBTztTQUNWO1FBRUQsTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RixNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbEUsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFL0MsRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUM5QyxFQUFFLENBQUMscUJBQXFCLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztnQkFFL0MsT0FBTzthQUNWO2lCQUFNO2dCQUNILElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ2QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDaEQ7Z0JBQ0QsTUFBTSxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM3QztZQUNELFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlFLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0M7UUFFRCxJQUFJLFNBQVMsS0FBSyxNQUFNLEVBQUU7WUFDdEIsSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDZCxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUUvQyxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQzlDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2dCQUUvQyxPQUFPO2FBQ1Y7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLFdBQVcsRUFBRTtvQkFDZCxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNoRDtnQkFDRCxNQUFNLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzdDO1lBRUQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3QztJQUNMLENBQUM7SUFDRDs7OztPQUlHO0lBQ0gsd0JBQXdCO1FBQ3BCLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFO1lBQ2hDLE9BQU87U0FDVjtRQUVELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztRQUN4QixJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDO1FBRTdDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsS0FBSztRQUN6QyxJQUFJLGFBQWEsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDakQsT0FBTyxZQUFZLEVBQUU7WUFDakIsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV2QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUM5QyxPQUFPO2FBQ1Y7WUFFRCxRQUFRLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDckYsYUFBYSxFQUFFLENBQUM7WUFFaEIsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN4QztpQkFBTTtnQkFDSCxZQUFZLEdBQUcsS0FBSyxDQUFDO2FBQ3hCO1NBQ0o7SUFDTCxDQUFDO0lBQ0Q7O09BRUc7SUFDSCxLQUFLLENBQUMsY0FBYztRQUNoQixJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRTtZQUN2QixPQUFPO1NBQ1Y7UUFFRCxJQUFJLEVBQUUsQ0FBQyxVQUFVLEVBQUU7WUFDZixPQUFPO1NBQ1Y7UUFFRCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7UUFFakMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxJQUFJLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDckMsTUFBTSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLEVBQUUsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO0lBQ0wsQ0FBQztJQUNEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFZLEVBQUUsSUFBbUI7UUFDMUMsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLEVBQUU7WUFDdkIsT0FBTztTQUNWO1FBRUQsZ0JBQWdCO1FBQ2hCLEVBQUUsQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBRW5CLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsRUFBRTtZQUNuRCxPQUFPO1NBQ1Y7UUFFRDs7Ozs7V0FLRztRQUNILElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ2pFLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2hDLE9BQU87U0FDVjtRQUVELFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBRXZDLFNBQVM7UUFDVCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFekMsVUFBVTtRQUNWLE1BQU0sU0FBUyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRTtZQUNwRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsTUFBTTtZQUNaLElBQUksRUFBRTtnQkFDRixJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsSUFBSTthQUNkO1NBQ0osQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNaLEVBQUUsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDaEM7UUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDekMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUNEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE1BQU07UUFDUixjQUFjO1FBQ2QsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFDL0IsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVuQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUU7Z0JBQzFDLE1BQU0sUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUM7YUFDdEM7U0FDSjthQUFNO1lBQ0gsRUFBRSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDM0M7UUFFRCxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxXQUFXLEVBQUU7WUFDOUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1NBQ3ZDO1FBRUQsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFDRDs7OztPQUlHO0lBQ0gsUUFBUSxDQUFDLElBQVksRUFBRSxRQUFnQjtRQUNuQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNoRCxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUU7WUFDNUMsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFO2dCQUNiLElBQUksR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDN0I7WUFFRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1AsT0FBTzthQUNWO1lBRUQscUJBQXFCO1lBQ3JCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMzQixJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZCLFlBQVksR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLFlBQVksR0FBRyxPQUFPLENBQUM7YUFDMUI7aUJBQU07Z0JBQ0gsSUFBSSxPQUFPLEdBQUcsWUFBWSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNuRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzNCLHFCQUFxQixDQUFDLEdBQUcsRUFBRTt3QkFDdkIsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQztvQkFDdkMsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsT0FBTztpQkFDVjthQUNKO1lBRUQsTUFBTSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUM1RCxNQUFNLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFFcEYsTUFBTSxVQUFVLEdBQUcsU0FBUyxJQUFJLFlBQVksR0FBRyxTQUFTLEtBQUssWUFBWSxDQUFDO1lBRTFFLE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDN0QsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ2hELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQztZQUU5QyxNQUFNLGVBQWUsR0FBRyxFQUFFLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQztZQUNsRCxNQUFNLGVBQWUsR0FBRyxZQUFZLEdBQUcsWUFBWSxDQUFDO1lBRXBELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQ3pDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQztZQUVwRSxJQUFJLEdBQUcsR0FBRyxVQUFVLEdBQUcsU0FBUyxHQUFHLGVBQWUsR0FBRyxPQUFPLENBQUM7WUFDN0QsSUFBSSxvQkFBb0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUUvQixJQUFJLFVBQVUsRUFBRTtnQkFDWixvQkFBb0IsSUFBSSxDQUFDLENBQUM7Z0JBQzFCLEdBQUcsSUFBSSxlQUFlLENBQUM7YUFDMUI7WUFFRCxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUM7WUFDeEIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFdEIsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsU0FBUyxHQUFHLFVBQVUsQ0FBQztZQUMxRCxNQUFNLElBQUksR0FBRyxTQUFTLEdBQUcsVUFBVSxDQUFDO1lBQ3BDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQztZQUU5RixRQUFRLFFBQVEsRUFBRTtnQkFDZCxLQUFLLFFBQVE7b0JBQ1QsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDWCxNQUFNLEdBQUcsRUFBRSxDQUFDO29CQUNaLE1BQU07Z0JBQ1YsS0FBSyxPQUFPO29CQUNSLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQ1gsTUFBTSxHQUFHLEVBQUUsQ0FBQztvQkFDWixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFDO29CQUNwRyxNQUFNO2FBQ2I7WUFDRCxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRTNDLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDL0QsT0FBTzthQUNWO1lBRUQsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHO2dCQUN4QixLQUFLLEVBQUU7b0JBQ0gsR0FBRyxFQUFFLEdBQUcsR0FBRyxJQUFJO29CQUNmLElBQUksRUFBRSxJQUFJLEdBQUcsSUFBSTtvQkFDakIsTUFBTSxFQUFFLE1BQU0sR0FBRyxJQUFJO29CQUNyQixLQUFLLEVBQUUsS0FBSyxHQUFHLElBQUk7b0JBQ25CLE1BQU07aUJBQ1Q7Z0JBQ0QsUUFBUTtnQkFDUixRQUFRLEVBQUU7b0JBQ04sTUFBTSxFQUFFLEdBQUcsR0FBRyxTQUFTLEdBQUcsb0JBQW9CLEdBQUcsSUFBSTtpQkFDeEQ7YUFDSixDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0Q7O09BRUc7SUFDSCxTQUFTO1FBQ0wsdUJBQXVCO1FBQ3ZCLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3JCLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUc7Z0JBQzlCLEdBQUcsRUFBRSxNQUFNO2FBQ2QsQ0FBQztZQUNGLE9BQU87U0FDVjtRQUVELE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hELGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLEdBQUcsRUFBRTtZQUM1QyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRDs7O09BR0c7SUFDSCxJQUFJLENBQUMsS0FBZ0I7UUFDakIsYUFBYTtRQUNiLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3RELE9BQU87U0FDVjtRQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVsRixlQUFlO1FBQ2YsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQzFCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDMUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBQ0Q7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFjO1FBQ3hCLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRWhDLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQ3ZCLE9BQU87U0FDVjtRQUVELElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3JCLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ25DO1FBRUQsU0FBUztRQUNULE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUV6QyxNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7UUFDM0IsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFDO1FBRXpCLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztRQUNuQyxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBRTFCLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QixJQUFJLFVBQVUsRUFBRTtZQUNaLFNBQVM7WUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDNUIsVUFBVSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDN0I7WUFFRDs7OztlQUlHO1lBQ0gsTUFBTSxrQkFBa0IsR0FBYSxFQUFFLENBQUM7WUFFeEMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVMsRUFBRSxFQUFFO2dCQUM3QixJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkMsTUFBTSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDeEQsSUFBSSxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7d0JBQ3hDLE9BQU87cUJBQ1Y7b0JBQ0Qsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUVuQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDckI7WUFDTCxDQUFDLENBQUMsQ0FBQztTQUNOO2FBQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzFDLE9BQU87U0FDVjtRQUVELElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNqQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDdEM7UUFFRCwrQ0FBK0M7UUFDL0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7UUFFekIsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtnQkFDZixPQUFPO2FBQ1Y7WUFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1gsa0JBQWtCO2dCQUNsQixNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JCLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUNqRCxPQUFPO2FBQ1Y7WUFFRCxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pCO2FBQU0sSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDbkcsNEJBQTRCO1lBQzVCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBZSxDQUFDO1lBQ2hHLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3ZDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLE1BQU0sRUFBRTtvQkFDUixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN4RCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBRXZFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFrQixFQUFFLEVBQUU7d0JBQ3JDLE1BQU0sSUFBSSxHQUFxQjs0QkFDM0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJOzRCQUNqQixNQUFNLEVBQUUsWUFBWTs0QkFDcEIsS0FBSyxFQUFFLE9BQU87NEJBQ2QsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNO3lCQUN4QixDQUFDO3dCQUVGLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNwQyxDQUFDLENBQUMsQ0FBQztpQkFDTjthQUNKO1NBQ0o7YUFBTTtZQUNILE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNwQixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRTtnQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3ZELFNBQVM7aUJBQ1o7Z0JBRUQsWUFBWTtnQkFDWixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLE1BQU0sRUFBRTtvQkFDVCxPQUFPO2lCQUNWO2dCQUVELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7Z0JBQzlCLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRXhELCtCQUErQjtnQkFDL0IsSUFBSSxNQUFNLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO29CQUNqRCxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztpQkFDMUI7Z0JBRUQsbUNBQW1DO2dCQUNuQyx3QkFBd0I7Z0JBQ3hCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO29CQUNyRSxPQUFPLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ3hDO2dCQUVELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO29CQUMxQixZQUFZO29CQUNaLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQ1QsU0FBUztxQkFDWjtvQkFFRCxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7b0JBRTNCLE1BQU0sT0FBTyxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRTt3QkFDakUsTUFBTTt3QkFDTixTQUFTO3dCQUNULElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTt3QkFDaEIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO3dCQUNoQixZQUFZLEVBQUUsS0FBSyxDQUFDLFlBQVk7d0JBQ2hDLGNBQWMsRUFBRSxLQUFLLENBQUMsY0FBYztxQkFDdkMsQ0FBQyxDQUFDO29CQUVILEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztvQkFFdkIsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDMUI7Z0JBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRTtvQkFDMUIsVUFBVTtvQkFDVixTQUFTO2lCQUNaO2dCQUVELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUV2QyxJQUFJLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGFBQWE7Z0JBQ2xELElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLE9BQU8sRUFBRTtvQkFDdkMsbUNBQW1DO29CQUNuQyxNQUFNLElBQUksQ0FBQyxDQUFDO2lCQUNmO3FCQUFNLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRTtvQkFDL0Msb0NBQW9DO29CQUNwQyxNQUFNLElBQUksQ0FBQyxDQUFDO2lCQUNmO2dCQUVELFNBQVM7Z0JBQ1QsUUFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN6RDtZQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztZQUV6QyxTQUFTO1lBQ1QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUMxQjtJQUNMLENBQUM7SUFDRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQXVCO1FBQzlCLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQ3ZCLE9BQU87U0FDVjtRQUVELElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDckIsTUFBTSxHQUFHLElBQUksQ0FBQztTQUNqQjthQUFNO1lBQ0gsMEJBQTBCO1lBQzFCLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMvQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNuQjtpQkFBTTtnQkFDSCxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDMUM7U0FDSjtRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUM5QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFckQsTUFBTSxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXJDLGFBQWE7UUFDYixXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDakMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBWSxFQUFFLGtCQUFrQixHQUFHLEtBQUssRUFBRSxZQUFzQjtRQUN4RSxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRTtZQUN2QixPQUFPO1NBQ1Y7UUFFRCxTQUFTO1FBQ1QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXpDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQ2hDO1FBRUQsWUFBWTtRQUNaLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3RELElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssS0FBSyxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxXQUFXLEVBQUU7WUFDbEgsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUNqQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDM0IsT0FBTzthQUNWO1lBRUQsTUFBTSxRQUFRLEdBQWE7Z0JBQ3ZCLElBQUksRUFBRSxTQUFTO2dCQUNmLEVBQUUsRUFBRSxJQUFJO2dCQUNSLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixVQUFVLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFO29CQUN4QyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7Z0JBQzVDLENBQUMsQ0FBQztnQkFDRixrQkFBa0I7Z0JBQ2xCLElBQUksRUFBRSxLQUFLO2FBQ2QsQ0FBQztZQUVGLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV4QixRQUFRO1lBQ1IsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN6QixPQUFPO1NBQ1Y7UUFFRCxhQUFhO1FBQ2IsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLFdBQVcsRUFBRTtZQUNuSCxNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBQ3BDLElBQUk7Z0JBQ0EsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztnQkFDckMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDckQsY0FBYztnQkFDZCxNQUFNLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUNoRjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDcEI7b0JBQVM7Z0JBQ04sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztnQkFDdEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQzVDO1NBQ0o7UUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUNEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsR0FBRyxDQUFDLElBQXVCO1FBQzdCLElBQUksS0FBSyxDQUFDLGFBQWEsRUFBRSxFQUFFO1lBQ3ZCLE9BQU87U0FDVjtRQUVELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixJQUFJLEdBQUcsSUFBSSxDQUFDO1NBQ2Y7YUFBTTtZQUNILDBCQUEwQjtZQUMxQixJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0MsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakI7aUJBQU07Z0JBQ0gsSUFBSSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ3hDO1NBQ0o7UUFFRCxZQUFZO1FBQ1osTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFO1lBQzFDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN2QixPQUFPO1NBQ1Y7UUFFRCxhQUFhO1FBQ2IsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFO1lBQzlCLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixNQUFNLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUNEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBdUI7UUFDbkMsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLEVBQUU7WUFDdkIsT0FBTztTQUNWO1FBRUQsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ3JCO2FBQU07WUFDSCwwQkFBMEI7WUFDMUIsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQy9DLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNILFVBQVUsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUM5QztTQUNKO1FBRUQsWUFBWTtRQUNaLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDbkUsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNmLE9BQU87U0FDVjtRQUVELFNBQVM7UUFDVCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFekMsSUFBSTtZQUNBLGVBQWU7WUFDZixTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3JDLE1BQU0sUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN2QztRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjtnQkFBUztZQUNOLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDdEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzVDO0lBQ0wsQ0FBQztJQUNEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBYztRQUNyQixJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRTtZQUN2QixPQUFPO1NBQ1Y7UUFFRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3RELE9BQU87U0FDVjtRQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBa0IsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXRFLFdBQVc7UUFDWCxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQ3pCLE9BQU87U0FDVjtRQUVELFlBQVk7UUFDWixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUUxQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1QsT0FBTztTQUNWO1FBRUQsSUFBSSxNQUFNLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO1lBQ2pELDJCQUEyQjtZQUMzQixPQUFPO1NBQ1Y7UUFFRCxJQUFJLE1BQU0sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDNUMseUJBQXlCO1lBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDO1lBQ3ZCLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQixPQUFPO1NBQ1Y7UUFFRCxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUM7UUFDeEIsSUFBSSxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN2RCxVQUFVLEdBQUcsUUFBUSxDQUFDO1NBQ3pCO1FBQ0QsTUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztRQUV2QyxxQkFBcUI7UUFDckIsTUFBTSxTQUFTLEdBQWEsS0FBSzthQUM1QixHQUFHLENBQUMsQ0FBQyxJQUFZLEVBQUUsRUFBRTtZQUNsQix5Q0FBeUM7WUFDekMsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2xDLE9BQU8sRUFBRSxDQUFDO2FBQ2I7WUFDRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDWCxPQUFPLEVBQUUsQ0FBQzthQUNiO1lBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsSUFBSSxVQUFVLEtBQUssVUFBVSxFQUFFO2dCQUN2RCxPQUFPLEVBQUUsQ0FBQzthQUNiO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQyxDQUFDO2FBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBQzthQUNmLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNYLE9BQU8sUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUMsQ0FBQyxDQUFDO1FBRVAsUUFBUTtRQUNSLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO1lBQ25CLE9BQU87U0FDVjtRQUVELE9BQU87UUFDUCxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDcEIsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7WUFDOUIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV6QyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNYLFNBQVM7YUFDWjtZQUVELEVBQUUsQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO1lBRTdCLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUUzRCxJQUFJLGNBQWMsS0FBSyxjQUFjLEVBQUU7Z0JBQ25DLE1BQU0sUUFBUSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQzthQUNqRjtZQUVELElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUM1QyxTQUFTO2FBQ1o7WUFFRCxpQ0FBaUM7WUFDakMsTUFBTSxjQUFjLEdBQUcsTUFBTSxRQUFRLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRSxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFNUcsSUFBSSxNQUFNLEdBQUcsV0FBVyxHQUFHLGFBQWEsQ0FBQztZQUV6QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssT0FBTyxFQUFFO2dCQUN6QixJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ1oscUNBQXFDO29CQUNyQyxNQUFNLElBQUksQ0FBQyxDQUFDO2lCQUNmO2dCQUNELE1BQU0sSUFBSSxXQUFXLENBQUM7YUFDekI7WUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO2dCQUMxQixJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ1osc0NBQXNDO29CQUN0QyxNQUFNLElBQUksQ0FBQyxDQUFDO2lCQUNmO2FBQ0o7WUFFRCxNQUFNLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFaEUsV0FBVyxFQUFFLENBQUM7U0FDakI7UUFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUNEOzs7T0FHRztJQUNILE1BQU07UUFDRixVQUFVO1FBQ1YsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztRQUV6SCxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRWxELE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3ZDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3pELEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ2hFO1FBRUQsVUFBVTtRQUNWLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBQ0Q7O09BRUc7SUFDSCxNQUFNO1FBQ0YsK0NBQStDO1FBQy9DLHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQy9CLE9BQU87U0FDVjtRQUNELHNDQUFzQztRQUN0QyxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUVkLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQy9DLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUM7UUFFL0IsTUFBTSxHQUFHLEdBQUcsU0FBUyxHQUFHLFVBQVUsQ0FBQztRQUNuQyxrQkFBa0I7UUFDbEIsTUFBTSxHQUFHLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQztRQUM1QixNQUFNO1FBQ04sTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUUvQyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztRQUUvQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsQ0FBQztRQUMzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFNUMsRUFBRSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUU5QyxZQUFZLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDdEMsRUFBRSxDQUFDLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUM1QyxJQUFJLEVBQUUsQ0FBQyxjQUFjLEVBQUU7Z0JBQ25CLE1BQU0sSUFBSSxHQUFHLE1BQU0sS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzNELElBQUksSUFBSSxFQUFFO29CQUNOLEVBQUUsQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO2lCQUMxQjthQUNKO1FBQ0wsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUNEOztPQUVHO0lBQ0gsY0FBYztRQUNWLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZDLElBQUksS0FBSyxFQUFFO1lBQ1AsT0FBTyxLQUFLLENBQUM7U0FDaEI7YUFBTTtZQUNILE9BQU8sRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzdCO0lBQ0wsQ0FBQztJQUNEOztPQUVHO0lBQ0gsYUFBYTtRQUNULE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUU1QyxJQUFJLE1BQU0sRUFBRTtZQUNSLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzVDO2FBQU07WUFDSCxPQUFPLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM3QjtJQUNMLENBQUM7SUFDRDs7T0FFRztJQUNILDJCQUEyQjtRQUN2QixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUM7UUFFckIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBYyxFQUFFLEVBQUU7WUFDN0MsSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssRUFBRTtnQkFDdEMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JDLElBQUksR0FBRyxNQUFNLENBQUM7YUFDakI7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBSSxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDO0lBQzNDLENBQUM7SUFDRDs7O09BR0c7SUFDSCxhQUFhO1FBQ1QsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDckIsT0FBTyxRQUFRLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQztTQUNsQztRQUVELE9BQU8sUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBQ0QsUUFBUSxDQUFDLElBQVk7UUFDakIsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFDRCxRQUFRLENBQUMsSUFBWTtRQUNqQixPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUNELFFBQVEsQ0FBQyxJQUFZO1FBQ2pCLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBQ0QsVUFBVSxDQUFDLElBQVk7UUFDbkIsT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFDRCxXQUFXLENBQUMsSUFBWTtRQUNwQixPQUFPLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUNELFdBQVc7UUFDUCxPQUFPLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQ0QsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFlO1FBQzdCLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMscUJBQXFCLE9BQU8sRUFBRSxDQUFDLEVBQUU7WUFDckUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLCtCQUErQixDQUFDO1NBQ3hELENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSixDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFnQixJQUFJO0lBQ2hCLE9BQU87UUFDSCxLQUFLLEVBQUUsRUFBRTtRQUNULFVBQVUsRUFBRSxFQUFFO1FBQ2QsT0FBTyxFQUFFO1lBQ0wsc0JBQXNCO1lBQ3RCLElBQUksRUFBRSxFQUFFO1lBQ1IsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsRUFBRTtTQUNkO1FBQ0QsY0FBYyxFQUFFLEVBQUU7UUFDbEIsU0FBUyxFQUFFLENBQUM7UUFDWixjQUFjLEVBQUUsRUFBRTtRQUNsQixRQUFRLEVBQUUsRUFBRTtRQUNaLHFCQUFxQixFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsc0JBQXNCO0tBQzdFLENBQUM7QUFDTixDQUFDO0FBaEJELG9CQWdCQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsT0FBTztJQUNuQixhQUFhO0lBQ2IsRUFBRSxHQUFHLElBQUksQ0FBQztBQUNkLENBQUM7QUFIRCwwQkFHQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgQWRkTm9kZSwgVHJlZU5vZGUsIERyYWdOb2RlSW5mbywgRHJhZ05vZGUsIERyb3BDYWxsYmFja0luZm8gfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhbmVsRGF0YSBmcm9tICcuL3BhbmVsLWRhdGEnO1xuaW1wb3J0ICogYXMgdHJlZURhdGEgZnJvbSAnLi90cmVlLWRhdGEnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbmxldCB2bTogYW55ID0gbnVsbDtcbmxldCByZXF1ZXN0QW5pbWF0aW9uSWQ6IGFueTtcbmxldCBzZWxlY3RlZFRpbWVJZDogYW55O1xubGV0IGlzUmVmcmVzaGluZyA9IGZhbHNlO1xuXG4vLyDnlKjkuo7or4bliKsgZHJhZyDmgqzlgZzvvIzoh6rliqjlsZXlvIDniLbnuqdcbmxldCBkcmFnT3ZlclV1aWQ6IGFueTtcbmxldCBkcmFnT3ZlclRpbWU6IGFueTtcblxuZXhwb3J0IGNvbnN0IG5hbWUgPSAndHJlZSc7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS90cmVlLmh0bWwnKSwgJ3V0ZjgnKTtcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgJ3RyZWUtbm9kZSc6IHJlcXVpcmUoJy4vdHJlZS1ub2RlJyksXG59O1xuXG5leHBvcnQgY29uc3Qgd2F0Y2ggPSB7XG4gICAgLyoqXG4gICAgICogc2Nyb2xsVG9wIOWPmOWMlu+8jOWIt+aWsOagkeW9olxuICAgICAqIOW9k+iKgueCueW+iOWkmueahOaDheWGteS4i++8jHJlcXVlc3RBbmltYXRpb25GcmFtZSDlj6/ku6Xpgb/lhY3ljaHpob9cbiAgICAgKi9cbiAgICBzY3JvbGxUb3AoKSB7XG4gICAgICAgIHZtLmZpbHRlcigpO1xuICAgIH0sXG59O1xuXG5leHBvcnQgY29uc3QgbWV0aG9kcyA9IHtcbiAgICAvKipcbiAgICAgKiDnv7vor5FcbiAgICAgKiBAcGFyYW0ga2V5IOS4jeW4pumdouadv+WQjeensOeahOagh+iusOWtl+esplxuICAgICAqL1xuICAgIHQoa2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gcGFuZWxEYXRhLiQucGFuZWwudChrZXkpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5aSW6YOo5pWw5o2u5pu05paw5ZCO77yM5pu05paw5YaF6YOo5pWw5o2uXG4gICAgICovXG4gICAgdXBkYXRlKCkge1xuICAgICAgICBjb25zdCBkcm9wcGFibGVUeXBlcyA9IHZtLiRwYXJlbnQuZHJvcHBhYmxlVHlwZXMuY29uY2F0KHBhbmVsRGF0YS5jb25maWcuY3JlYXRhYmxlVHlwZXMpO1xuICAgICAgICB2bS5kcm9wcGFibGVUeXBlcyA9IGRyb3BwYWJsZVR5cGVzLmNvbmNhdChwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5riF56m65qCR5b2iXG4gICAgICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRyZWVEYXRhLmNsZWFyKCk7XG4gICAgICAgIHZtLnJlZnJlc2goKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIt+aWsOagkeW9olxuICAgICAqL1xuICAgIGFzeW5jIHJlZnJlc2goKSB7XG4gICAgICAgIGlmIChpc1JlZnJlc2hpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlzUmVmcmVzaGluZyA9IHRydWU7XG5cbiAgICAgICAgLy8g5bu26L+fIDIwMCBtcyDliLfmlrDvvIzlu7bov5/mnJ/pl7Tlj6/ku6XlkIjlubblpJrmrKEgY2hhbmdlZCDkuqfnlJ/nmoTliLfmlrDmjIfku6TvvIznvJPop6PmgKfog73pl67pophcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMjAwKSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLnJlc2V0KCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlzUmVmcmVzaGluZyA9IGZhbHNlO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWo6YOo6YCJ5LitXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgc2VsZWN0QWxsKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCB0cmVlRGF0YS5kaXNwbGF5QXJyYXkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdXVpZCA9IHV1aWQgfHwgdm0uZ2V0Rmlyc3RTZWxlY3RTb3J0QnlEaXNwbGF5KCk7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbdXVpZF0gfHwgdXVpZDsgLy8gcGFyZW50VXVpZCDkuLrnqbrmmK/moLnoioLngrnvvIzovazkuLroh6rouqsgdXVpZFxuICAgICAgICBjb25zdCBzaWJsaW5nVXVpZHMgPSB1dGlscy5nZXRDaGlsZHJlblV1aWRzKHBhcmVudFV1aWQpO1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgIGNvbnN0IGlzSW5jbHVkZWQgPSBjdXJyZW50U2VsZWN0cy5pbmNsdWRlcyh1dWlkKTtcblxuICAgICAgICBsZXQgc2libGluZ3NBbGxJbiA9IHRydWU7XG4gICAgICAgIHNpYmxpbmdVdWlkcy5mb3JFYWNoKChzaWJsaW5nVXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhzaWJsaW5nVXVpZCkpIHtcbiAgICAgICAgICAgICAgICBzaWJsaW5nc0FsbEluID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzaWJsaW5nc0FsbEluKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHBhcmVudFV1aWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGlzSW5jbHVkZWQpIHtcbiAgICAgICAgICAgICAgICAvLyDliKDpmaTotoXov4fojIPlm7TnmoTlt7LpgInkuK3oioLngrlcbiAgICAgICAgICAgICAgICBjdXJyZW50U2VsZWN0cy5mb3JFYWNoKChzZWxlY3Q6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNpYmxpbmdVdWlkcy5pbmNsdWRlcyhzZWxlY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgc2VsZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5zZWxlY3QoJ25vZGUnLCBzaWJsaW5nVXVpZHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLmNsZWFyKCdub2RlJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzLmlzUGFyZW50KHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgc2libGluZ1V1aWRzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW3V1aWRdLnNsaWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VsZWN0Q2xlYXIoKSB7XG4gICAgICAgIEVkaXRvci5TZWxlY3Rpb24uY2xlYXIoJ25vZGUnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOmAieS4remhuVxuICAgICAqIEBwYXJhbSB1dWlkcyBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAqL1xuICAgIHNlbGVjdGVkKHV1aWRzOiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXVpZHMpKSB7XG4gICAgICAgICAgICB1dWlkcyA9IFt1dWlkc107XG4gICAgICAgIH1cblxuICAgICAgICB1dWlkcy5mb3JFYWNoKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICghcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2godXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IHV1aWQ7XG5cbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6Ugc2hpZnQg5aSa6YCJ55qE5Yqo5L2cXG4gICAgICAgICAgICAgICAgaWYgKHV1aWQgPT09IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS51dWlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLnNoaWZ0VXBEb3duTWVyZ2VTZWxlY3RlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlj5bmtojpgInkuK3poblcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICB1bnNlbGVjdGVkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAodm0uaW50b1ZpZXdCeVVzZXIgPT09IHV1aWQpIHtcbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmRleE9mKHV1aWQpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmgaLlpI3pgInkuK3nirbmgIFcbiAgICAgKi9cbiAgICByZXNlbGVjdGVkKCkge1xuICAgICAgICBjb25zdCB1dWlkcyA9IEVkaXRvci5TZWxlY3Rpb24uZ2V0U2VsZWN0ZWQoJ25vZGUnKS5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4gISF0cmVlRGF0YS51dWlkVG9Ob2RlW3V1aWRdKTtcbiAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2bS5zZWxlY3RlZCh1dWlkcyk7XG5cbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChzZWxlY3RlZFRpbWVJZCk7XG4gICAgICAgIHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlVc2VyKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIHNoaWZ0ICsgY2xpY2sg5aSa6YCJXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgc2hpZnRDbGljayh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdCh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBkaXNwbGF5QXJyYXkgfSA9IHRyZWVEYXRhO1xuXG4gICAgICAgIGNvbnN0IGZpcnN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZihwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF0pO1xuICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBkaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKTtcblxuICAgICAgICBpZiAoZmlyc3RJbmRleCAhPT0gLTEgfHwgbGFzdEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKGZpcnN0SW5kZXggPD0gbGFzdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGZpcnN0SW5kZXg7IGkgPD0gbGFzdEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0cy5wdXNoKGRpc3BsYXlBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZmlyc3RJbmRleDsgaSA+PSBsYXN0SW5kZXg7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzLnB1c2goZGlzcGxheUFycmF5W2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2bS5pcGNTZWxlY3Qoc2VsZWN0cyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBjdHJsICsgY2xpY2sg6YCJ5Lit5oiW5Y+W5raI6YCJ5Lit6aG5XG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgY3RybENsaWNrKHV1aWQ6IHN0cmluZykge1xuICAgICAgICBpZiAocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgdXVpZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDph43mlrDpgInkuK3oioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBpcGNTZWxlY3QodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5qCR5b2i5LiK55qE56ys5LiA5Liq6IqC54K5XG4gICAgICovXG4gICAgaXBjU2VsZWN0Rmlyc3RDaGlsZCgpIHtcbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgICAgICBjb25zdCB1dWlkID0gdGhpcy5nZXRGaXJzdENoaWxkKCk7XG4gICAgICAgIGlmICh1dWlkKSB7XG4gICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIHV1aWQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDnqbrnmb3lpITngrnlh7vvvIzlj5bmtojpgInkuK1cbiAgICAgKi9cbiAgICBjbGljaygpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi5jbGVhcignbm9kZScpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5Yib5bu66IqC54K55YmN5ZCN56ew5LqL5YmN5aSE55CGXG4gICAgICogQHBhcmFtIGpzb24gQWRkTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGFkZFRvKGpzb246IEFkZE5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmNsZWFyU2VhcmNoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb24ucGFyZW50KSB7XG4gICAgICAgICAgICBqc29uLnBhcmVudCA9IHRoaXMuZ2V0Rmlyc3RTZWxlY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudDogVHJlZU5vZGUgfCBudWxsID0gYXdhaXQgdXRpbHMuZ2V0UGFyZW50V2hlbkFkZE5vZGUoanNvbik7XG5cbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtLnRvZ2dsZShqc29uLnBhcmVudCwgdHJ1ZSk7XG4gICAgICAgIGpzb24ucGFyZW50ID0gcGFyZW50LnV1aWQ7XG5cbiAgICAgICAgLy8g6K6+572u5pi+56S65L2N572u55qE55uu5qCH6IqC54K5XG4gICAgICAgIGpzb24uc2libGluZyA9IHV0aWxzLmdlTGFzdEV4cGFuZENoaWxkVXVpZChwYXJlbnQudXVpZCk7XG4gICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGpzb24uc2libGluZyk7XG5cbiAgICAgICAganNvbi5uYW1lID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnZ2VuZXJhdGUtYXZhaWxhYmxlLW5hbWUnLCBqc29uLm5hbWUsIGpzb24ucGFyZW50KTtcbiAgICAgICAganNvbi5uYW1lSW5jcmVhc2UgPSBmYWxzZTtcblxuICAgICAgICB2bS5hZGROb2RlID0ganNvbjtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOaWsOWinuiKgueCue+8jOS6i+WJjemHjeWRveWQjeWQjuaOpeaUtuaVsOaNrlxuICAgICAqIEBwYXJhbSBqc29uIEFkZE5vZGVcbiAgICAgKi9cbiAgICBhZGRDb25maXJtKGpzb24/OiBBZGROb2RlKSB7XG4gICAgICAgIC8vIOaWsOWinueahOi+k+WFpeahhua2iOWksVxuICAgICAgICB2bS5hZGROb2RlLnNpYmxpbmcgPSAnJztcblxuICAgICAgICAvLyDmlbDmja7plJnor6/ml7blj5bmtohcbiAgICAgICAgaWYgKCFqc29uIHx8ICFqc29uLnBhcmVudCkge1xuICAgICAgICAgICAgdm0uYWRkRW5kKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJlbnQgPSB1dGlscy5nZXROb2RlKGpzb24ucGFyZW50KTtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgIHZtLmFkZEVuZCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWxzLmNhbk5vdENyZWF0ZU5vZGUocGFyZW50KSkge1xuICAgICAgICAgICAgLy8g54i257qn5LiN5Y+v5Yib5bu66IqC54K5XG4gICAgICAgICAgICB2bS5hZGRFbmQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZtLmFkZChqc29uKTtcbiAgICB9LFxuICAgIGFkZEVuZCgpIHtcbiAgICAgICAgLy8gbG9hZGluZyDmlYjmnpzmtojlpLFcbiAgICAgICAgdm0uYWRkTm9kZS5wYXJlbnQgPSAnJztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIGlwYyDlj5HotbfliJvlu7roioLngrlcbiAgICAgKiBAcGFyYW0ganNvbiBBZGROb2RlXG4gICAgICovXG4gICAgYXN5bmMgYWRkKGpzb246IEFkZE5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ3NjZW5lJywgJ2NyZWF0ZS1ub2RlJywganNvbik7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICB2bS5hZGRFbmQoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog6IqC54K55bey5re75Yqg5Yiw5Zy65pmvXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgYWRkZWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHZtLnJlZnJlc2goKTtcblxuICAgICAgICBwYW5lbERhdGEuYWN0LnR3aW5rbGVRdWV1ZXMucHVzaCh7IHV1aWQsIGFuaW1hdGlvbjogJ3NocmluaycgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmm7TmlrDmoJHlvaLoioLngrlcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBjaGFuZ2VkKHV1aWQ6IHN0cmluZykge1xuICAgICAgICB2bS5yZWZyZXNoKCk7XG5cbiAgICAgICAgLy8g5qC56IqC54K55aSq6aKR57mB5LqG77yM5LiN6KaB6Zeq54OBXG4gICAgICAgIGNvbnN0IG5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICBpZiAoIW5vZGUgfHwgbm9kZS5pc1NjZW5lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWIoOmZpFxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZSh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5L+d5a2Y5Y6G5Y+y6K6w5b2VXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG5cbiAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgLy8g5aaC5p6c6K+l6IqC54K55rKh5pyJ6KKr6YCJ5Lit77yM5YiZ5Y+q5piv5Yig6Zmk5q2k5Y2V5LiqXG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWFgeiuuOWIoOmZpFxuICAgICAgICAgICAgaWYgKCF1dGlscy5jYW5Ob3REZWxldGVOb2RlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdHJlZURhdGEuZGVsZXRlTm9kZSh1dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWmguaenOivpeiKgueCueaYr+iiq+mAieS4reS6hu+8jOihqOaYjuimgeWIoOmZpOaJgOaciemAieS4remhuVxuICAgICAgICAgICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMuZm9yRWFjaCgoc2VsZWN0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZShzZWxlY3QpO1xuICAgICAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWIoOmZpOWFgeiuuOWIoOmZpFxuICAgICAgICAgICAgICAgIGlmICghdXRpbHMuY2FuTm90RGVsZXRlTm9kZShub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB1dWlkcy5wdXNoKHNlbGVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5kZWxldGVOb2RlKHV1aWRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNjZW5lIOeahCBpc0RpcnR5IOWIpOaWreS9v+eUqOS6hiB1bmRvQXJyYXkubGVuZ3RoLCDmk43kvZzlkI7pnIDopoEgc25hcHNob3RcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOS7juagkeW9ouWIoOmZpOiKgueCuVxuICAgICAqL1xuICAgIGRlbGV0ZWQoKSB7XG4gICAgICAgIHZtLnJlZnJlc2goKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOiKgueCueeahOaKmOWPoOWIh+aNolxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqIEBwYXJhbSB2YWx1ZSB0cnVlIG9yIGZhbHNlXG4gICAgICogQHBhcmFtIGxvb3Ag5piv5ZCm5ZCR5a2Q6ZuG5b6q546vXG4gICAgICovXG4gICAgdG9nZ2xlKHV1aWQ6IHN0cmluZywgZXhwYW5kOiBib29sZWFuLCBsb29wPzogYm9vbGVhbikge1xuICAgICAgICBpZiAobG9vcCkge1xuICAgICAgICAgICAgdHJlZURhdGEubG9vcEV4cGFuZCh1dWlkLCBleHBhbmQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJlZURhdGEudG9nZ2xlRXhwYW5kKHV1aWQsIGV4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWFqOmDqOiKgueCueaKmOWPoOaIluWxleW8gFxuICAgICAqL1xuICAgIGFsbFRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKCF0cmVlRGF0YS5ub2RlVHJlZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNFeHBhbmQgPSB1dGlscy5pc0FsbEV4cGFuZCgpO1xuICAgICAgICBjb25zdCBwYXJlbnRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdHNMZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICBpZiAoc2VsZWN0c0xlbmd0aCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50VXVpZCA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0c1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICghdXRpbHMuaXNQYXJlbnQocGFyZW50VXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbcGFyZW50VXVpZF07XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50cy5pbmNsdWRlcyhwYXJlbnRVdWlkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJlZURhdGEudG9nZ2xlRXhwYW5kKHBhcmVudFV1aWQsICFpc0V4cGFuZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50VXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50cy5wdXNoKHRyZWVEYXRhLm5vZGVUcmVlLnV1aWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cmVlRGF0YS5sb29wRXhwYW5kKHBhcmVudHNbaV0sICFpc0V4cGFuZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOS4iuS4i+W3puWPsyDmjInplK5cbiAgICAgKiBAcGFyYW0gZGlyZWN0aW9uIOaWueWQkVxuICAgICAqL1xuICAgIHVwRG93bkxlZnRSaWdodChkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBsYXN0ID0gdm0uZ2V0TGFzdFNlbGVjdCgpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGlmICghdXRpbHMuaXNFeHBhbmQobGFzdCkpIHtcbiAgICAgICAgICAgICAgICB2bS50b2dnbGUobGFzdCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRyZWVEYXRhLnV1aWRUb0NoaWxkcmVuW2xhc3RdO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGRyZW4pICYmIGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChjaGlsZHJlblswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIGlmICh1dGlscy5pc0V4cGFuZChsYXN0KSkge1xuICAgICAgICAgICAgICAgIHZtLnRvZ2dsZShsYXN0LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0cmVlRGF0YS51dWlkVG9QYXJlbnRVdWlkW2xhc3RdO1xuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHZtLmlwY1NlbGVjdChwYXJlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc2libGluZ3MgPSB1dGlscy5nZXRTaWJsaW5nKGxhc3QpO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnQ7XG4gICAgICAgICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3VwJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdkb3duJzpcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHNpYmxpbmdzWzJdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICB2bS5pcGNTZWxlY3QoY3VycmVudC51dWlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICog5oyJ5L2PIHNoaWZ0IOmUru+8jOWQjOaXtuS4iuS4i+mAieaLqVxuICAgICAqIEBwYXJhbSBkaXJlY3Rpb24g5pa55ZCRXG4gICAgICovXG4gICAgYXN5bmMgc2hpZnRVcERvd24oZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmxlbmd0aDtcblxuICAgICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBbbGFzdCwgbGFzdFByZXYsIGxhc3ROZXh0XSA9IHV0aWxzLmdldFNpYmxpbmcocGFuZWxEYXRhLmFjdC5zZWxlY3RzW2xlbmd0aCAtIDFdKTtcbiAgICAgICAgY29uc3QgaGFzTGFzdFByZXYgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMobGFzdFByZXYudXVpZCk7XG4gICAgICAgIGNvbnN0IGhhc0xhc3ROZXh0ID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKGxhc3ROZXh0LnV1aWQpO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd1cCcpIHtcbiAgICAgICAgICAgIGlmICghaGFzTGFzdFByZXYpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnNlbGVjdCgnbm9kZScsIGxhc3RQcmV2LnV1aWQpO1xuXG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQgPSBsYXN0UHJldi51dWlkO1xuICAgICAgICAgICAgICAgIHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghaGFzTGFzdE5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlNlbGVjdGlvbi51bnNlbGVjdCgnbm9kZScsIGxhc3QudXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KGxhc3RQcmV2LnV1aWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihsYXN0UHJldi51dWlkKSwgMSk7XG4gICAgICAgICAgICBwYW5lbERhdGEuYWN0LnNlbGVjdHMucHVzaChsYXN0UHJldi51dWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdkb3duJykge1xuICAgICAgICAgICAgaWYgKCFoYXNMYXN0TmV4dCkge1xuICAgICAgICAgICAgICAgIEVkaXRvci5TZWxlY3Rpb24uc2VsZWN0KCdub2RlJywgbGFzdE5leHQudXVpZCk7XG5cbiAgICAgICAgICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9IGxhc3ROZXh0LnV1aWQ7XG4gICAgICAgICAgICAgICAgdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNMYXN0UHJldikge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuU2VsZWN0aW9uLnVuc2VsZWN0KCdub2RlJywgbGFzdC51dWlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgdXRpbHMuc2Nyb2xsSW50b1ZpZXcobGFzdE5leHQudXVpZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zcGxpY2UocGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluZGV4T2YobGFzdE5leHQudXVpZCksIDEpO1xuICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnB1c2gobGFzdE5leHQudXVpZCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWQiOW5tiBzaGlmdCDlpJrpgInov4fnqIvkuK3liY3lkI7nmoTlt7LpgInkuK3poblcbiAgICAgKiDmr5TlpoIgYWIgY2RlIOmhueS4rSBhLCBjZGUg5bey6YCJ5LitLCBiIOacqumAieS4rVxuICAgICAqIOW9k+mAieS4rSBiIOaXtu+8jOWQiOW5tumAieS4remhuSBjZGUg77yM5bm25bCG5pyr5bC+6YCJ5Lit6aG555qE5oyH6ZKI5oyH5ZCRIGVcbiAgICAgKi9cbiAgICBzaGlmdFVwRG93bk1lcmdlU2VsZWN0ZWQoKSB7XG4gICAgICAgIGlmICghdm0uY2hlY2tTaGlmdFVwRG93bk1lcmdlLnV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBrZWVwRmluZE5leHQgPSB0cnVlO1xuICAgICAgICBsZXQgZmluZFV1aWQgPSB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZDtcblxuICAgICAgICB2bS5jaGVja1NoaWZ0VXBEb3duTWVyZ2UudXVpZCA9ICcnOyAvLyDph43nva5cbiAgICAgICAgbGV0IG1heExvb3BOdW1iZXIgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoa2VlcEZpbmROZXh0KSB7XG4gICAgICAgICAgICBjb25zdCBhcnIgPSB1dGlscy5nZXRTaWJsaW5nKGZpbmRVdWlkKTtcblxuICAgICAgICAgICAgaWYgKCFhcnIgfHwgIWFyclsxXSB8fCAhYXJyWzJdIHx8ICFtYXhMb29wTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaW5kVXVpZCA9IHZtLmNoZWNrU2hpZnRVcERvd25NZXJnZS5kaXJlY3Rpb24gPT09ICdkb3duJyA/IGFyclsyXS51dWlkIDogYXJyWzFdLnV1aWQ7XG4gICAgICAgICAgICBtYXhMb29wTnVtYmVyLS07XG5cbiAgICAgICAgICAgIGlmIChwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5jbHVkZXMoZmluZFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNwbGljZShwYW5lbERhdGEuYWN0LnNlbGVjdHMuaW5kZXhPZihmaW5kVXVpZCksIDEpO1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5wdXNoKGZpbmRVdWlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAga2VlcEZpbmROZXh0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOadpeiHquW/q+aNt+mUrueahCByZW5hbWVcbiAgICAgKi9cbiAgICBhc3luYyBrZXlib2FyZFJlbmFtZSgpIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZtLnJlbmFtZVV1aWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHV1aWQgPSB2bS5nZXRGaXJzdFNlbGVjdCgpO1xuXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgaWYgKGFzc2V0ICYmICF1dGlscy5jYW5Ob3RSZW5hbWUoYXNzZXQpKSB7XG4gICAgICAgICAgICBhd2FpdCB1dGlscy5zY3JvbGxJbnRvVmlldyh1dWlkKTtcbiAgICAgICAgICAgIHZtLnJlbmFtZVV1aWQgPSB1dWlkO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnph43lkI3lkb1cbiAgICAgKiDov5nmmK/lvILmraXnmoTvvIzlj6rlgZrlj5HpgIFcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKiBAcGFyYW0gbmFtZSDkuI3ph43lkb3lkI3ml7bkvKAgbmFtZSA9IG51bGxcbiAgICAgKi9cbiAgICBhc3luYyByZW5hbWUodXVpZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcgfCBudWxsKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOa4heepuiByZW5hbWUg55qE6IqC54K5XG4gICAgICAgIHZtLnJlbmFtZVV1aWQgPSAnJztcblxuICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgaWYgKCFub2RlIHx8IHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiDkuI3ph43lkb3lkI3nmoTmg4XlhrU6XG4gICAgICAgICAqIG5hbWUgPSBudWxsXG4gICAgICAgICAqIOmUgeWumlxuICAgICAgICAgKiDlkozliY3lgLzkuIDmoLdcbiAgICAgICAgICovXG4gICAgICAgIGlmIChuYW1lID09PSBudWxsIHx8IHV0aWxzLmNhbk5vdFJlbmFtZShub2RlKSB8fCBuYW1lID09PSBub2RlLm5hbWUpIHtcbiAgICAgICAgICAgIHRyZWVEYXRhLnV1aWRUb1N0YXRlW3V1aWRdID0gJyc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICdsb2FkaW5nJztcblxuICAgICAgICAvLyDkv53lrZjljoblj7LorrDlvZVcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcblxuICAgICAgICAvLyDlj5HpgIHph43lkI3lkb3mlbDmja5cbiAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnc2V0LXByb3BlcnR5Jywge1xuICAgICAgICAgICAgdXVpZDogbm9kZS51dWlkLFxuICAgICAgICAgICAgcGF0aDogJ25hbWUnLFxuICAgICAgICAgICAgZHVtcDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBuYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHZtLmRpYWxvZ0Vycm9yKCdyZW5hbWVGYWlsJyk7XG4gICAgICAgIH1cblxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuICAgICAgICB0cmVlRGF0YS51dWlkVG9TdGF0ZVt1dWlkXSA9ICcnO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5omn6KGM5pCc57SiXG4gICAgICovXG4gICAgYXN5bmMgc2VhcmNoKCkge1xuICAgICAgICAvLyDmkJzntKLmnInlj5jliqjpg73lhYjmu5rlm57pobbpg6hcbiAgICAgICAgaWYgKHBhbmVsRGF0YS4kLnBhbmVsLnNlYXJjaFZhbHVlKSB7XG4gICAgICAgICAgICBwYW5lbERhdGEuJC52aWV3Qm94LnNjcm9sbFRvKDAsIDApO1xuXG4gICAgICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVHlwZSA9PT0gJ2Fzc2V0Jykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLmZpbmROb2Rlc1VzZUFzc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9IHZtLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFuZWxEYXRhLiQucGFuZWwuc2VhcmNoVHlwZSA9PT0gJ21pc3NBc3NldCcpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5maW5kTm9kZXNNaXNzQXNzZXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyZWVEYXRhLnJlbmRlcigpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5ouW5Yqo5Lit5oSf55+l5b2T5YmN5omA5aSE6IqC54K55L2N572uXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICogQHBhcmFtIHBvc2l0aW9uIOS9jee9ru+8mmJlZm9yZe+8jGluc2lkZe+8jGFmdGVyXG4gICAgICovXG4gICAgZHJhZ092ZXIodXVpZDogc3RyaW5nLCBwb3NpdGlvbjogc3RyaW5nKSB7XG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0QW5pbWF0aW9uSWQpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uSWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHV1aWQgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgdXVpZCA9IHZtLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGRyYWcg5oKs5YGc5LiA5q615pe26Ze05ZCO6Ieq5Yqo5bGV5byA6IqC54K5XG4gICAgICAgICAgICBjb25zdCBub3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGlmIChkcmFnT3ZlclV1aWQgIT09IHV1aWQpIHtcbiAgICAgICAgICAgICAgICBkcmFnT3ZlclV1aWQgPSB1dWlkO1xuICAgICAgICAgICAgICAgIGRyYWdPdmVyVGltZSA9IG5vd1RpbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub3dUaW1lIC0gZHJhZ092ZXJUaW1lID4gODAwICYmICF0cmVlRGF0YS51dWlkVG9FeHBhbmRbbm9kZS51dWlkXSkge1xuICAgICAgICAgICAgICAgICAgICB2bS50b2dnbGUobm9kZS51dWlkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnZpZXdCb3guc2Nyb2xsVG9wICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IG5vZGVIZWlnaHQsIGljb25XaWR0aCwgcGFkZGluZyB9ID0gcGFuZWxEYXRhLmNvbmZpZztcbiAgICAgICAgICAgIGNvbnN0IHsgY2xpZW50SGVpZ2h0LCBvZmZzZXRIZWlnaHQsIHNjcm9sbFRvcCwgc2Nyb2xsSGVpZ2h0IH0gPSBwYW5lbERhdGEuJC52aWV3Qm94O1xuXG4gICAgICAgICAgICBjb25zdCBpc0F0Qm90dG9tID0gc2Nyb2xsVG9wICYmIGNsaWVudEhlaWdodCArIHNjcm9sbFRvcCA9PT0gc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICAgICAgICBjb25zdCB2aWV3UmVjdCA9IHBhbmVsRGF0YS4kLnZpZXdCb3guZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBjb25zdCB0cmVlUmVjdCA9IHZtLiRlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdFRvcCA9IHZpZXdSZWN0LnRvcCAtIHRyZWVSZWN0LnRvcDtcblxuICAgICAgICAgICAgY29uc3QgYWRqdXN0U2Nyb2xsVG9wID0gdm0uc2Nyb2xsVG9wICUgbm9kZUhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHNjcm9sbGJhckhlaWdodCA9IG9mZnNldEhlaWdodCAtIGNsaWVudEhlaWdodDtcblxuICAgICAgICAgICAgY29uc3QgZGVwdGhMZWZ0ID0gbm9kZS5kZXB0aCAqIGljb25XaWR0aDtcbiAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlUb3AgPSB0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih1dWlkKSAqIG5vZGVIZWlnaHQ7XG5cbiAgICAgICAgICAgIGxldCB0b3AgPSBkaXNwbGF5VG9wIC0gYWRqdXN0VG9wICsgYWRqdXN0U2Nyb2xsVG9wICsgcGFkZGluZztcbiAgICAgICAgICAgIGxldCBhZGp1c3RWZXJ0aWNhbEhlaWdodCA9IC0xMztcblxuICAgICAgICAgICAgaWYgKGlzQXRCb3R0b20pIHtcbiAgICAgICAgICAgICAgICBhZGp1c3RWZXJ0aWNhbEhlaWdodCAtPSAyO1xuICAgICAgICAgICAgICAgIHRvcCArPSBzY3JvbGxiYXJIZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBoZWlnaHQgPSBub2RlSGVpZ2h0O1xuICAgICAgICAgICAgbGV0IHpJbmRleCA9IDA7XG4gICAgICAgICAgICBjb25zdCBhZGp1c3RMZWZ0ID0gLTM7XG5cbiAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdm0uJGVsLm9mZnNldFdpZHRoIC0gZGVwdGhMZWZ0IC0gYWRqdXN0TGVmdDtcbiAgICAgICAgICAgIGNvbnN0IGxlZnQgPSBkZXB0aExlZnQgKyBhZGp1c3RMZWZ0O1xuICAgICAgICAgICAgY29uc3QgcGFyZW50VG9wID0gdHJlZURhdGEuZGlzcGxheUFycmF5LmluZGV4T2YodHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFt1dWlkXSkgKiBub2RlSGVpZ2h0O1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnYmVmb3JlJzpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gMjtcbiAgICAgICAgICAgICAgICAgICAgekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2FmdGVyJzpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gMjtcbiAgICAgICAgICAgICAgICAgICAgekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIHRvcCA9ICh0cmVlRGF0YS5kaXNwbGF5QXJyYXkuaW5kZXhPZih1dGlscy5nZUxhc3RFeHBhbmRDaGlsZFV1aWQodXVpZCkpICsgMSkgKiBub2RlSGVpZ2h0ICsgcGFkZGluZztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b3AgPSBNYXRoLm1pbihzY3JvbGxIZWlnaHQgLSBoZWlnaHQsIHRvcCk7XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpICYmIFsnYmVmb3JlJywgJ2FmdGVyJ10uaW5jbHVkZXMocG9zaXRpb24pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5kcm9wQm94ID0ge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogdG9wICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogbGVmdCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgekluZGV4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICAgICAgdmVydGljYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0b3AgLSBwYXJlbnRUb3AgKyBhZGp1c3RWZXJ0aWNhbEhlaWdodCArICdweCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+b5YWlIHRyZWUg5a655ZmoXG4gICAgICovXG4gICAgZHJhZ0VudGVyKCkge1xuICAgICAgICAvLyDmkJzntKLmqKHlvI/kuIvvvIzkuI3or4bliKvkuLrmi5blhaUgdHJlZSDlrrnlmahcbiAgICAgICAgaWYgKHV0aWxzLmlzU2VhcmNoaW5nKCkpIHtcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmRyb3BCb3guc3R5bGUgPSB7XG4gICAgICAgICAgICAgICAgdG9wOiAnLTJweCcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHJlcXVlc3RBbmltYXRpb25JZCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25JZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgICAgICB2bS5kcmFnT3ZlcignJywgJ2FmdGVyJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogZHJvcCDliLDpnaLmnb/nqbrnmb3ljLrln5/ph4xcbiAgICAgKiBAcGFyYW0gZXZlbnQg6byg5qCH5LqL5Lu2XG4gICAgICovXG4gICAgZHJvcChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAmJiAhZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnaG92aW5nJykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEVkaXRvci5VSS5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICAvLyBjYy5TY2VuZSDmoLnoioLngrlcbiAgICAgICAgZGF0YS50byA9IHZtLmdldEZpcnN0Q2hpbGQoKTtcbiAgICAgICAgZGF0YS5pbnNlcnQgPSAnaW5zaWRlJztcbiAgICAgICAgZGF0YS5jb3B5ID0gZXZlbnQuY3RybEtleTtcbiAgICAgICAgZGF0YS5rZWVwV29ybGRUcmFuc2Zvcm0gPSAhZXZlbnQuc2hpZnRLZXk7XG4gICAgICAgIHZtLmlwY0Ryb3AoZGF0YSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDoioLngrnmi5bliqhcbiAgICAgKiBAcGFyYW0ganNvbiBEcmFnTm9kZVxuICAgICAqL1xuICAgIGFzeW5jIGlwY0Ryb3AoanNvbjogRHJhZ05vZGUpIHtcbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuZm9jdXNXaW5kb3coKTtcblxuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXRpbHMuaXNTZWFyY2hpbmcoKSkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuY2xlYXJTZWFyY2goKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS/neWtmOWOhuWPsuiusOW9lVxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgIGNvbnN0IHV1aWRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCB2YWx1ZXM6IGFueVtdID0gW107XG5cbiAgICAgICAgY29uc3QgeyB2YWx1ZSwgdHlwZSwgbmFtZSB9ID0ganNvbjtcbiAgICAgICAgbGV0IHsgYWRkaXRpb25hbCB9ID0ganNvbjtcblxuICAgICAgICB2bS50b2dnbGUoanNvbi50bywgdHJ1ZSk7XG4gICAgICAgIGlmIChhZGRpdGlvbmFsKSB7XG4gICAgICAgICAgICAvLyDlop7liqDkuIDlpITlrrnplJlcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWwgPSBbYWRkaXRpb25hbF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICog55Sx5LqO5omA5pyJ55qE5a2Q6LWE5rqQ5Lmf5ZyoIGFkZGl0aW9uYWwg5pWw5o2u6YeMXG4gICAgICAgICAgICAgKiDml6Dms5XljLrliIblpJrpgInlrZDotYTmupDnmoTmg4XlhrXkuoZcbiAgICAgICAgICAgICAqIOaVhee6puWumuS4gOS4quWunuS9k+i1hOa6kOWPquWPluS4gOS4quWQiOazleeahOaVsOaNrlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25zdCBleHBlY3RlZEFzc2V0VXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgICAgIGFkZGl0aW9uYWwuZm9yRWFjaCgoaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHZtLmRyb3BwYWJsZVR5cGVzLmluY2x1ZGVzKGluZm8udHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW2Fzc2V0VXVpZCwgc3ViQXNzZXRVdWlkXSA9IGluZm8udmFsdWUuc3BsaXQoJ0AnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGVjdGVkQXNzZXRVdWlkcy5pbmNsdWRlcyhhc3NldFV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWRBc3NldFV1aWRzLnB1c2goYXNzZXRVdWlkKTtcblxuICAgICAgICAgICAgICAgICAgICB1dWlkcy5wdXNoKGluZm8udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaChpbmZvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICghdm0uZHJvcHBhYmxlVHlwZXMuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZSAmJiAhdXVpZHMuaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICAgICAgICB1dWlkcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHsgdHlwZSwgdmFsdWUsIG5hbWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWx1ZXMg5pyJ6L+H5ruk5LqGIGFkZGl0aW9uYWwg6IqC54K557uE5Lu25pWw5o2u77yM6YeN572u57uZIGFkZGl0aW9uYWxcbiAgICAgICAganNvbi5hZGRpdGlvbmFsID0gdmFsdWVzO1xuXG4gICAgICAgIGlmIChqc29uLnR5cGUgPT09ICdjYy5Ob2RlJykge1xuICAgICAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChqc29uLmNvcHkpIHtcbiAgICAgICAgICAgICAgICAvLyDmjInkvY/kuoYgY3RybCDplK7vvIzmi5bliqjlpI3liLZcbiAgICAgICAgICAgICAgICBhd2FpdCB2bS5jb3B5KHV1aWRzKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB2bS5wYXN0ZShqc29uLnRvLCBqc29uLmtlZXBXb3JsZFRyYW5zZm9ybSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2bS5tb3ZlKGpzb24pO1xuICAgICAgICB9IGVsc2UgaWYgKHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC50eXBlcyAmJiBwYW5lbERhdGEuY29uZmlnLmV4dGVuZERyb3AudHlwZXMuaW5jbHVkZXMoanNvbi50eXBlKSkge1xuICAgICAgICAgICAgLy8g6K+l57G75Z6L55qE5LqL5Lu25pyJ5aSW6YOo5rOo5YaM55qE5Yqo5L2c77yM6L2s55Sx5aSW6YOo5rOo5YaM5LqL5Lu25o6l566hXG4gICAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBPYmplY3QudmFsdWVzKHBhbmVsRGF0YS5jb25maWcuZXh0ZW5kRHJvcC5jYWxsYmFja3NbanNvbi50eXBlXSkgYXMgRnVuY3Rpb25bXTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFja3MgJiYgQXJyYXkuaXNBcnJheShjYWxsYmFja3MpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdG9Ob2RlID0gdXRpbHMuZ2V0Tm9kZShqc29uLnRvKTtcbiAgICAgICAgICAgICAgICBpZiAodG9Ob2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvUGFyZW50VXVpZCA9IHRyZWVEYXRhLnV1aWRUb1BhcmVudFV1aWRbanNvbi50b107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvSW5kZXggPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlblt0b1BhcmVudFV1aWRdLmluZGV4T2YoanNvbi50byk7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzLmZvckVhY2goKGNhbGxiYWNrOiBGdW5jdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5mbzogRHJvcENhbGxiYWNrSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlOiB0b05vZGUudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHRvUGFyZW50VXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogdG9JbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjoganNvbi5pbnNlcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhpbmZvLCBqc29uLmFkZGl0aW9uYWwpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBuZXdVdWlkcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCBhc3NldCBvZiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXBhbmVsRGF0YS5jb25maWcuY3JlYXRhYmxlVHlwZXMuaW5jbHVkZXMoYXNzZXQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5bCG6KKr5rOo5YWl5pWw5o2u55qE5a+56LGhXG4gICAgICAgICAgICAgICAgY29uc3QgdG9Ob2RlID0gdXRpbHMuZ2V0Tm9kZShqc29uLnRvKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRvTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYXNzZXRVdWlkID0gYXNzZXQudmFsdWU7XG4gICAgICAgICAgICAgICAgY29uc3QgdG9QYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtqc29uLnRvXTtcblxuICAgICAgICAgICAgICAgIC8vIOaLluWIsCBwcmVmYWIg5qC56IqC54K555qE6aG26YOo5pS+572u77yM6ZyA6KaB6L2s5Li65pS+572u5Zyo5YaF6YOoXG4gICAgICAgICAgICAgICAgaWYgKHRvTm9kZS5pc1ByZWZhYlJvb3QgJiYganNvbi5pbnNlcnQgIT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGpzb24uaW5zZXJ0ID0gJ2luc2lkZSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g5b2T5Yik5pat5Li65o+S5YWl5p+Q5Liq6IqC54K55pe277yM6ZyA6KaB5Yik5pat5b2T5YmN6IqC54K55piv5ZCm5Zyo6YCJ5Lit5YiX6KGo5Lit77yM5aaC5p6c5ZyoXG4gICAgICAgICAgICAgICAgLy8g5oiR5Lus5Yaz5a6a5o+S5YWl55qE6KGM5Li65piv5om56YeP5o+S5YWl5omA5pyJ6YCJ5Lit55qE6IqC54K5XG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudHMgPSBqc29uLmluc2VydCA9PT0gJ2luc2lkZScgPyBbanNvbi50b10gOiBbdG9QYXJlbnRVdWlkXTtcbiAgICAgICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdpbnNpZGUnICYmIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyhqc29uLnRvKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRzID0gWy4uLnBhbmVsRGF0YS5hY3Quc2VsZWN0c107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXJlbnQgb2YgcGFyZW50cykge1xuICAgICAgICAgICAgICAgICAgICAvLyDlsIbooqvms6jlhaXmlbDmja7nmoTlr7nosaFcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9Ob2RlID0gdXRpbHMuZ2V0Tm9kZShwYXJlbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRvTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2bS5hZGROb2RlLnBhcmVudCA9IHBhcmVudDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdVdWlkID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnc2NlbmUnLCAnY3JlYXRlLW5vZGUnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldFV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVubGlua1ByZWZhYjogYXNzZXQudW5saW5rUHJlZmFiLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FudmFzUmVxdWlyZWQ6IGFzc2V0LmNhbnZhc1JlcXVpcmVkLFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB2bS5hZGROb2RlLnBhcmVudCA9ICcnO1xuXG4gICAgICAgICAgICAgICAgICAgIG5ld1V1aWRzLnB1c2gobmV3VXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgICAgICAgICAvLyDkuIrmraXlt7LmlrDlop7lrozmr5VcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgdG9BcnIgPSB0cmVlRGF0YS51dWlkVG9DaGlsZHJlblt0b1BhcmVudFV1aWRdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvSW5kZXggPSB0b0Fyci5pbmRleE9mKGpzb24udG8pO1xuXG4gICAgICAgICAgICAgICAgbGV0IG9mZnNldCA9IHRvSW5kZXggLSB0b0Fyci5sZW5ndGg7IC8vIOebruagh+e0ouW8leWHj+WOu+iHqui6q+e0ouW8lVxuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPCAwICYmIGpzb24uaW5zZXJ0ID09PSAnYWZ0ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWwj+S6jjDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvliY3vvIzlpoLmnpzmmK8gYWZ0ZXIg6KaBICsxXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ID4gMCAmJiBqc29uLmluc2VydCA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aSn5LqOMOeahOWBj+enu+m7mOiupOaYr+aOkuWcqOebruagh+WFg+e0oOS5i+WQju+8jOWmguaenOaYryBiZWZvcmUg6KaBIC0xXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCAtPSAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWcqOeItue6p+mHjOW5s+enu1xuICAgICAgICAgICAgICAgIHRyZWVEYXRhLm1vdmVOb2RlKHRvUGFyZW50VXVpZCwgdG9BcnIubGVuZ3RoLCBvZmZzZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgICAgICAvLyDpgInkuK3mlrDnmoToioLngrlcbiAgICAgICAgICAgIHZtLmlwY1NlbGVjdChuZXdVdWlkcyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOWkjeWItlxuICAgICAqIEBwYXJhbSB1dWlkIOiKgueCuVxuICAgICAqL1xuICAgIGFzeW5jIGNvcHkodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNvcGllcyA9IFtdO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh1dWlkKSkge1xuICAgICAgICAgICAgY29waWVzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGNvcGllcyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29waWVzID0gcGFuZWxEYXRhLmFjdC5zZWxlY3RzLnNsaWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB2YWxpZFV1aWRzID0gY29waWVzLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlICYmICF1dGlscy5jYW5Ob3RDb3B5Tm9kZShub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY29waWVkVXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbih2YWxpZFV1aWRzKTtcblxuICAgICAgICBhd2FpdCB0cmVlRGF0YS5jb3B5Tm9kZShjb3BpZWRVdWlkcyk7XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGNvcGllZFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDnspjotLRcbiAgICAgKiBAcGFyYW0gdXVpZCDnm67moIfoioLngrnvvIwgIXBhc3RlQXNDaGlsZCDml7bpu5jorqTnspjotLTliLDnm67moIfoioLngrnlkIznuqdcbiAgICAgKiBAcGFyYW0ga2VlcFdvcmxkVHJhbnNmb3JtIOaYr+WQpuS/neaMgeS4lueVjOWdkOagh1xuICAgICAqIEBwYXJhbSBwYXN0ZUFzQ2hpbGQg5piv5ZCm57KY6LS05Li655uu5qCH6IqC54K555qE5a2Q6IqC54K5XG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcGFzdGUodXVpZDogc3RyaW5nLCBrZWVwV29ybGRUcmFuc2Zvcm0gPSBmYWxzZSwgcGFzdGVBc0NoaWxkPzogYm9vbGVhbikge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkv53lrZjljoblj7LorrDlvZVcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcblxuICAgICAgICBpZiAoIXV1aWQpIHtcbiAgICAgICAgICAgIHV1aWQgPSB0aGlzLmdldEZpcnN0U2VsZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDkvJjlhYjlpITnkIbliarliIfnmoTmg4XlhrVcbiAgICAgICAgY29uc3Qgbm9kZXNJbmZvID0gRWRpdG9yLkNsaXBib2FyZC5yZWFkKCdub2Rlcy1pbmZvJyk7XG4gICAgICAgIGlmIChub2Rlc0luZm8gJiYgbm9kZXNJbmZvLnR5cGUgPT09ICdjdXQnICYmIG5vZGVzSW5mby51dWlkcy5sZW5ndGggJiYgRWRpdG9yLlByb2plY3QucGF0aCA9PT0gbm9kZXNJbmZvLnByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICBjb25zdCBjdXRVdWlkcyA9IG5vZGVzSW5mby51dWlkcztcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkVXVpZHMgPSB1dGlscy5maWx0ZXJDaGlsZHJlbihjdXRVdWlkcyk7XG4gICAgICAgICAgICBpZiAodmFsaWRVdWlkcy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbW92ZURhdGE6IERyYWdOb2RlID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjYy5Ob2RlJyxcbiAgICAgICAgICAgICAgICB0bzogdXVpZCxcbiAgICAgICAgICAgICAgICBpbnNlcnQ6ICdpbnNpZGUnLFxuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWw6IHZhbGlkVXVpZHMubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHV1aWQsIHR5cGU6ICdjYy5Ob2RlJyB9O1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGtlZXBXb3JsZFRyYW5zZm9ybSxcbiAgICAgICAgICAgICAgICBjb3B5OiBmYWxzZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IHZtLm1vdmUobW92ZURhdGEpO1xuXG4gICAgICAgICAgICAvLyDmuIXnqbrliarliIfmnb9cbiAgICAgICAgICAgIEVkaXRvci5DbGlwYm9hcmQuY2xlYXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWPquWPr+WcqOmhueebruWGheWkjeWItueymOi0tFxuICAgICAgICBpZiAobm9kZXNJbmZvICYmIG5vZGVzSW5mby50eXBlID09PSAnY29weScgJiYgbm9kZXNJbmZvLnV1aWRzLmxlbmd0aCAmJiBFZGl0b3IuUHJvamVjdC5wYXRoID09PSBub2Rlc0luZm8ucHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvcGllZFV1aWRzID0gbm9kZXNJbmZvLnV1aWRzO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC5pc09wZXJhdGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRVdWlkcyA9IHV0aWxzLmZpbHRlckNoaWxkcmVuKGNvcGllZFV1aWRzKTtcbiAgICAgICAgICAgICAgICAvLyDmlrDnmoTpgInkuK3pobnliIfmjaLkuLrmlrDoioLngrlcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5wYXN0ZU5vZGUodXVpZCwgdmFsaWRVdWlkcywga2VlcFdvcmxkVHJhbnNmb3JtLCBwYXN0ZUFzQ2hpbGQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnc2NlbmUnLCAnc25hcHNob3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDliarliIdcbiAgICAgKiDliarliIfmmK/pooTlrprnmoTooYzkuLrvvIzlj6rmnInlho3miafooYznspjotLTmk43kvZzmiY3kvJrnlJ/mlYhcbiAgICAgKiBAcGFyYW0gdXVpZCDoioLngrlcbiAgICAgKi9cbiAgICBhc3luYyBjdXQodXVpZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcbiAgICAgICAgaWYgKHV0aWxzLmZvcmJpZE9wZXJhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGN1dHMgPSBbXTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodXVpZCkpIHtcbiAgICAgICAgICAgIGN1dHMgPSB1dWlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5p2l6Ieq5Y+z5Ye76I+c5Y2V55qE5Y2V5Liq6YCJ5Lit77yM5Y+z5Ye76IqC54K55LiN5Zyo5bey6YCJ6aG555uu6YeMXG4gICAgICAgICAgICBpZiAodXVpZCAmJiAhcGFuZWxEYXRhLmFjdC5zZWxlY3RzLmluY2x1ZGVzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgY3V0cyA9IFt1dWlkXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3V0cyA9IHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5zbGljZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L+H5ruk5LiN5Y+v5Ymq5YiH55qE6IqC54K5XG4gICAgICAgIGNvbnN0IGN1dFV1aWRzID0gY3V0cy5maWx0ZXIoKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHV0aWxzLmdldE5vZGUodXVpZCk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZSAmJiAhdXRpbHMuY2FuTm90Q3V0Tm9kZShub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGN1dFV1aWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g57uZ5aSN5Yi255qE5Yqo5L2c5Y+N6aaI5oiQ5YqfXG4gICAgICAgIGN1dFV1aWRzLmZvckVhY2goKHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdXRpbHMudHdpbmtsZS5hZGQodXVpZCwgJ2xpZ2h0Jyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOmAmuefpSBzY2VuZSDlkIzmraXmiafooYwgY3V0XG4gICAgICAgIGF3YWl0IHRyZWVEYXRhLmN1dE5vZGUoY3V0VXVpZHMpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog5YWL6ZqGXG4gICAgICogQHBhcmFtIHV1aWQg6IqC54K5XG4gICAgICovXG4gICAgYXN5bmMgZHVwbGljYXRlKHV1aWQ6IHN0cmluZyB8IHN0cmluZ1tdKSB7XG4gICAgICAgIGlmICh1dGlscy5mb3JiaWRPcGVyYXRlKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkdXBsaWNhdGVzID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHV1aWQpKSB7XG4gICAgICAgICAgICBkdXBsaWNhdGVzID0gdXVpZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOadpeiHquWPs+WHu+iPnOWNleeahOWNleS4qumAieS4re+8jOWPs+WHu+iKgueCueS4jeWcqOW3sumAiemhueebrumHjFxuICAgICAgICAgICAgaWYgKHV1aWQgJiYgIXBhbmVsRGF0YS5hY3Quc2VsZWN0cy5pbmNsdWRlcyh1dWlkKSkge1xuICAgICAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSBbdXVpZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMuc2xpY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi/h+a7pOS4jeWPr+WkjeWItueahOiKgueCuVxuICAgICAgICBjb25zdCB1dWlkcyA9IHV0aWxzLmZpbHRlckNoaWxkcmVuKGR1cGxpY2F0ZXMpLmZpbHRlcigodXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gdXRpbHMuZ2V0Tm9kZSh1dWlkKTtcbiAgICAgICAgICAgIHJldHVybiBub2RlICYmICF1dGlscy5jYW5Ob3RDb3B5Tm9kZShub2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS/neWtmOWOhuWPsuiusOW9lVxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdzY2VuZScsICdzbmFwc2hvdCcpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlj6/og73mmK/mibnph4/mk43kvZzvvIznu5nliqDkuKrplIFcbiAgICAgICAgICAgIHBhbmVsRGF0YS4kLnBhbmVsLmlzT3BlcmF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLmR1cGxpY2F0ZU5vZGUodXVpZHMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuaXNPcGVyYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOenu+WKqFxuICAgICAqIEBwYXJhbSBqc29uIERyYWdOb2RlXG4gICAgICovXG4gICAgYXN5bmMgbW92ZShqc29uOiBEcmFnTm9kZSkge1xuICAgICAgICBpZiAodXRpbHMuZm9yYmlkT3BlcmF0ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWpzb24gfHwgIWpzb24udG8gfHwgIUFycmF5LmlzQXJyYXkoanNvbi5hZGRpdGlvbmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXVpZHMgPSBqc29uLmFkZGl0aW9uYWwubWFwKChpbmZvOiBEcmFnTm9kZUluZm8pID0+IGluZm8udmFsdWUpO1xuXG4gICAgICAgIC8vIOenu+WKqOeahOWFg+e0oOaciemHjeWPoFxuICAgICAgICBpZiAodXVpZHMuaW5jbHVkZXMoanNvbi50bykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwhuiiq+azqOWFpeaVsOaNrueahOWvueixoVxuICAgICAgICBjb25zdCB0b05vZGUgPSB1dGlscy5nZXROb2RlKGpzb24udG8pO1xuICAgICAgICBjb25zdCB0b1BhcmVudCA9IHV0aWxzLmdldFBhcmVudChqc29uLnRvKTtcblxuICAgICAgICBpZiAoIXRvTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvTm9kZS5pc1ByZWZhYlJvb3QgJiYganNvbi5pbnNlcnQgIT09ICdpbnNpZGUnKSB7XG4gICAgICAgICAgICAvLyDkuI3og73np7vliqjliLDlvZPliY3nvJbovpHnmoQgcHJlZmFiIOagueiKgueCueeahOWJjeWQjlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvTm9kZS5pc1NjZW5lICYmIGpzb24uaW5zZXJ0ICE9PSAnaW5zaWRlJykge1xuICAgICAgICAgICAgLy8g5ouW5Yqo5Yiw5Zy65pmv5qC56IqC54K555qE5YmN5ZCO5L2N572u77yM5Lmf55u45b2T5LqO5ouW6L+b6YeM6Z2iXG4gICAgICAgICAgICBqc29uLmluc2VydCA9ICdpbnNpZGUnO1xuICAgICAgICAgICAgYXdhaXQgdm0ubW92ZShqc29uKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJlbnROb2RlID0gdG9Ob2RlO1xuICAgICAgICBpZiAodG9QYXJlbnQgJiYgWydiZWZvcmUnLCAnYWZ0ZXInXS5pbmNsdWRlcyhqc29uLmluc2VydCkpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUgPSB0b1BhcmVudDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJlbnROb2RlVXVpZCA9IHBhcmVudE5vZGUudXVpZDtcblxuICAgICAgICAvLyDlpJroioLngrnnmoTnp7vliqjvvIzmoLnmja7njrDmnInmjpLluo/nmoTpobrluo/miafooYxcbiAgICAgICAgY29uc3QgZnJvbVV1aWRzOiBzdHJpbmdbXSA9IHV1aWRzXG4gICAgICAgICAgICAubWFwKCh1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB0b05vZGUg6IqC54K55pivIGZyb21Ob2RlIOeahOWtkOmbhu+8jOeItuS4jeiDveenu+WIsOWtkOmHjOmdoiwg5Y+W5raI56e75YqoXG4gICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlzQUluY2x1ZGVCKHV1aWQsIGpzb24udG8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgZnJvbU5vZGUgPSB1dGlscy5nZXROb2RlKHV1aWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnQgPSB1dGlscy5nZXRQYXJlbnQodXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmcm9tTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGpzb24uaW5zZXJ0ID09PSAnaW5zaWRlJyAmJiBwYXJlbnROb2RlID09PSBmcm9tUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdXVpZDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cmVlRGF0YS51dWlkVG9JbmRleFthXSAtIHRyZWVEYXRhLnV1aWRUb0luZGV4W2JdO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5peg6IqC54K556e75YqoXG4gICAgICAgIGlmICghZnJvbVV1aWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5byA5aeL5omn6KGMXG4gICAgICAgIGxldCBhZGp1c3RJbmRleCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgZnJvbVV1aWQgb2YgZnJvbVV1aWRzKSB7XG4gICAgICAgICAgICBjb25zdCBmcm9tTm9kZSA9IHV0aWxzLmdldE5vZGUoZnJvbVV1aWQpO1xuXG4gICAgICAgICAgICBpZiAoIWZyb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZtLmludG9WaWV3QnlVc2VyID0gZnJvbVV1aWQ7XG5cbiAgICAgICAgICAgIGNvbnN0IGZyb21QYXJlbnRVdWlkID0gdHJlZURhdGEudXVpZFRvUGFyZW50VXVpZFtmcm9tVXVpZF07XG5cbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlVXVpZCAhPT0gZnJvbVBhcmVudFV1aWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0cmVlRGF0YS5zZXRQYXJlbnQocGFyZW50Tm9kZVV1aWQsIFtmcm9tVXVpZF0sIGpzb24ua2VlcFdvcmxkVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFbJ2JlZm9yZScsICdhZnRlciddLmluY2x1ZGVzKGpzb24uaW5zZXJ0KSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDnjrDmnIkgYXBpIOS4i++8jOi/meS4gOatpeW+l+afpeivouWunuaXtuS9jee9ru+8jOaJjeWlveWHhuehruenu+WKqOWIsOaWsOS9jee9rlxuICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZUluZm8gPSBhd2FpdCB0cmVlRGF0YS5nZXREdW1wRGF0YShwYXJlbnROb2RlLnV1aWQpO1xuICAgICAgICAgICAgY29uc3QgdG9Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IHRvTm9kZS51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZyb21Ob2RlSW5kZXggPSBwYXJlbnROb2RlSW5mby5jaGlsZHJlbi5maW5kSW5kZXgoKGNoaWxkOiBhbnkpID0+IGNoaWxkLnZhbHVlLnV1aWQgPT09IGZyb21Ob2RlLnV1aWQpO1xuXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gdG9Ob2RlSW5kZXggLSBmcm9tTm9kZUluZGV4O1xuXG4gICAgICAgICAgICBpZiAoanNvbi5pbnNlcnQgPT09ICdhZnRlcicpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlsI/kuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvliY3vvIzlpoLmnpzmmK8gYWZ0ZXIg6KaBICsxXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gYWRqdXN0SW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChqc29uLmluc2VydCA9PT0gJ2JlZm9yZScpIHtcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpKfkuo4gMCDnmoTlgY/np7vpu5jorqTmmK/mjpLlnKjnm67moIflhYPntKDkuYvlkI7vvIzlpoLmnpzmmK8gYmVmb3JlIOimgSAtMVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgLT0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF3YWl0IHRyZWVEYXRhLm1vdmVOb2RlKHBhcmVudE5vZGUudXVpZCwgZnJvbU5vZGVJbmRleCwgb2Zmc2V0KTtcblxuICAgICAgICAgICAgYWRqdXN0SW5kZXgrKztcbiAgICAgICAgfVxuXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ3NjZW5lJywgJ3NuYXBzaG90Jyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDmoJHlvaLmlbDmja7lt7LmlLnlj5hcbiAgICAgKiDlpoLoioLngrnlop7liKDmlLnvvIzmmK/ovoPlpKfnmoTlj5jliqjvvIzpnIDopoHph43mlrDorqHnrpflkITkuKrphY3lpZfmlbDmja5cbiAgICAgKi9cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIC8vIOWuueWZqOeahOaVtOS9k+mrmOW6plxuICAgICAgICBwYW5lbERhdGEuJC5wYW5lbC50cmVlSGVpZ2h0ID0gdHJlZURhdGEuZGlzcGxheUFycmF5Lmxlbmd0aCAqIHBhbmVsRGF0YS5jb25maWcubm9kZUhlaWdodCArIHBhbmVsRGF0YS5jb25maWcucGFkZGluZyAqIDI7XG5cbiAgICAgICAgcGFuZWxEYXRhLiQucGFuZWwuYWxsRXhwYW5kID0gdXRpbHMuaXNBbGxFeHBhbmQoKTtcblxuICAgICAgICB3aGlsZSAocGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcmVhZHlUd2lua2xlID0gcGFuZWxEYXRhLmFjdC50d2lua2xlUXVldWVzLnNoaWZ0KCk7XG4gICAgICAgICAgICB1dGlscy50d2lua2xlLmFkZChyZWFkeVR3aW5rbGUudXVpZCwgcmVhZHlUd2lua2xlLmFuaW1hdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDph43mlrDmuLLmn5Plh7rmoJHlvaJcbiAgICAgICAgdm0uZmlsdGVyKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDlnKjmlbDmja7kuI3lj5jnmoTmg4XlhrXkuIvvvIzmoLnmja7mu5rliqjkvY3nva7muLLmn5PmoJHlvaJcbiAgICAgKi9cbiAgICBmaWx0ZXIoKSB7XG4gICAgICAgIC8vIOmdouadv+aLluaLveWIsCB0YWIg6YeM5LiN5Lya56uL5Y2z5pi+56S677yM6ZyA6KaB5omL5Yqo5YiH5o2iIHRhYu+8jOWcqOWIh+aNouWJjemdouadvyBoZWlnaHQ9MFxuICAgICAgICAvLyDop4Tpgb8gaGVpZ2h0PTAg6Z2e5q2j5bi45oOF5Ya15LiL5b6A5LiL5omn6KGM6ZSZ6K+v6K6h566X77yM5Zyo5YiH5o2iIHRhYiDlkI7kvJrmiafooYwgc2hvdyDov5vooYzmraPnoa7nmoTorqHnrpfmuLLmn5NcbiAgICAgICAgaWYgKCFwYW5lbERhdGEuJC5wYW5lbC52aWV3SGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g5YWI5riF56m677yM6L+Z56eN6LWL5YC85py65Yi25omN6IO95Yi35pawIHZ1Ze+8jOiAjCAubGVuZ3RoID0gMCDkuI3ooYxcbiAgICAgICAgdm0ubm9kZXMgPSBbXTtcblxuICAgICAgICBjb25zdCBub2RlSGVpZ2h0ID0gcGFuZWxEYXRhLmNvbmZpZy5ub2RlSGVpZ2h0O1xuICAgICAgICBjb25zdCBzY3JvbGxUb3AgPSB2bS5zY3JvbGxUb3A7XG5cbiAgICAgICAgY29uc3QgdG9wID0gc2Nyb2xsVG9wICUgbm9kZUhlaWdodDtcbiAgICAgICAgLy8g566X5Ye65Y+v6KeG5Yy65Z+f55qEIHRvcCDmnIDlsI/lgLxcbiAgICAgICAgY29uc3QgbWluID0gc2Nyb2xsVG9wIC0gdG9wO1xuICAgICAgICAvLyDmnIDlpKflgLxcbiAgICAgICAgY29uc3QgbWF4ID0gbWluICsgcGFuZWxEYXRhLiQucGFuZWwudmlld0hlaWdodDtcblxuICAgICAgICB2bS4kZWwuc3R5bGUudG9wID0gYC0ke3RvcH1weGA7XG5cbiAgICAgICAgY29uc3Qgc3RhcnQgPSBNYXRoLnJvdW5kKG1pbiAvIG5vZGVIZWlnaHQpO1xuICAgICAgICBjb25zdCBlbmQgPSBNYXRoLmNlaWwobWF4IC8gbm9kZUhlaWdodCkgKyAxO1xuXG4gICAgICAgIHZtLm5vZGVzID0gdHJlZURhdGEub3V0cHV0RGlzcGxheShzdGFydCwgZW5kKTtcblxuICAgICAgICBjbGVhclRpbWVvdXQodm0uc2Nyb2xsSW50b1ZpZXdUaW1lSWQpO1xuICAgICAgICB2bS5zY3JvbGxJbnRvVmlld1RpbWVJZCA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHZtLmludG9WaWV3QnlVc2VyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG9uZSA9IGF3YWl0IHV0aWxzLnNjcm9sbEludG9WaWV3KHZtLmludG9WaWV3QnlVc2VyKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICB2bS5pbnRvVmlld0J5VXNlciA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgNTApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICog6L+U5Zue6IqC54K5IHV1aWRcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdCgpIHtcbiAgICAgICAgY29uc3QgZmlyc3QgPSBwYW5lbERhdGEuYWN0LnNlbGVjdHNbMF07XG5cbiAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdm0uZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bpgInkuK3liJfooajmlbDnu4TkuK3mnIDlkI7kuIDkuKroioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57nqbpcbiAgICAgKi9cbiAgICBnZXRMYXN0U2VsZWN0KCkge1xuICAgICAgICBjb25zdCBsZW5ndGggPSBwYW5lbERhdGEuYWN0LnNlbGVjdHMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBwYW5lbERhdGEuYWN0LnNlbGVjdHNbbGVuZ3RoIC0gMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdm0uZ2V0Rmlyc3RDaGlsZCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiDojrflj5bop4bop4nkuIrmoJHlvaLkuIrkuIvliJfooajkuK3vvIznrKzkuIDkuKrpgInkuK3oioLngrnvvIzmsqHmnInpgInkuK3pobnvvIzov5Tlm57pobblsYLmoLnoioLngrlcbiAgICAgKi9cbiAgICBnZXRGaXJzdFNlbGVjdFNvcnRCeURpc3BsYXkoKSB7XG4gICAgICAgIGxldCB1dWlkID0gJyc7XG4gICAgICAgIGxldCBpbmRleCA9IEluZmluaXR5O1xuXG4gICAgICAgIHBhbmVsRGF0YS5hY3Quc2VsZWN0cy5mb3JFYWNoKChzZWxlY3Q6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKHRyZWVEYXRhLnV1aWRUb0luZGV4W3NlbGVjdF0gPCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gdHJlZURhdGEudXVpZFRvSW5kZXhbc2VsZWN0XTtcbiAgICAgICAgICAgICAgICB1dWlkID0gc2VsZWN0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdXVpZCB8fCB0cmVlRGF0YS5ub2RlVHJlZT8udXVpZDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIOi/lOWbnuagkeW9ouesrOS4gOS4quiKgueCuVxuICAgICAqIOesrOS4gOS4quiKgueCue+8jOS4jeS4gOWumuaYr+agueiKgueCue+8jOS+i+WmguWcqOaQnOe0oueahOaDheWGteS4i1xuICAgICAqL1xuICAgIGdldEZpcnN0Q2hpbGQoKSB7XG4gICAgICAgIGlmICh1dGlscy5pc1NlYXJjaGluZygpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJlZURhdGEubm9kZVRyZWU/LnV1aWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJlZURhdGEuZGlzcGxheUFycmF5WzBdO1xuICAgIH0sXG4gICAgaXNBY3RpdmUodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB1dGlscy5pc0FjdGl2ZSh1dWlkKTtcbiAgICB9LFxuICAgIGlzRXhwYW5kKHV1aWQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNFeHBhbmQodXVpZCk7XG4gICAgfSxcbiAgICBpc1BhcmVudCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzUGFyZW50KHV1aWQpO1xuICAgIH0sXG4gICAgaXNTZWxlY3RlZCh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzU2VsZWN0ZWQodXVpZCk7XG4gICAgfSxcbiAgICBpc0FuaW1hdGluZyh1dWlkOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLmlzQW5pbWF0aW5nKHV1aWQgfHwgcGFuZWxEYXRhLmFjdC5hbmltYXRpb25VdWlkKTtcbiAgICB9LFxuICAgIGlzU2VhcmNoaW5nKCkge1xuICAgICAgICByZXR1cm4gdXRpbHMuaXNTZWFyY2hpbmcoKTtcbiAgICB9LFxuICAgIGFzeW5jIGRpYWxvZ0Vycm9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgICAgICBhd2FpdCBFZGl0b3IuRGlhbG9nLmVycm9yKEVkaXRvci5JMThuLnQoYGhpZXJhcmNoeS5vcGVyYXRlLiR7bWVzc2FnZX1gKSwge1xuICAgICAgICAgICAgdGl0bGU6IEVkaXRvci5JMThuLnQoJ2hpZXJhcmNoeS5vcGVyYXRlLmRpYWxvZ0Vycm9yJyksXG4gICAgICAgIH0pO1xuICAgIH0sXG59O1xuXG4vKipcbiAqIHZ1ZSBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXRhKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5vZGVzOiBbXSwgLy8g5b2T5YmN5qCR5b2i5Zyo5Y+v6KeG5Yy65Z+f55qE6IqC54K55pWw5o2uXG4gICAgICAgIHJlbmFtZVV1aWQ6ICcnLCAvLyDpnIDopoEgcmVuYW1lIOeahOiKgueCueeahCB1cmzvvIzlj6rmnInkuIDkuKpcbiAgICAgICAgYWRkTm9kZToge1xuICAgICAgICAgICAgLy8g5re75Yqg5LiA5Liq5paw6IqC54K55YmN55qE5pWw5o2u77yM6ZyA6KaB5LqL5YmN6YeN5ZG95ZCNXG4gICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgIHBhcmVudDogJycsXG4gICAgICAgICAgICBzaWJsaW5nOiAnJyxcbiAgICAgICAgfSxcbiAgICAgICAgaW50b1ZpZXdCeVVzZXI6ICcnLCAvLyDnlKjmiLfmk43kvZzvvJrpgInkuK3vvIzmlrDlop7vvIznp7vliqjvvIznu5nkuojlrprkvY1cbiAgICAgICAgc2Nyb2xsVG9wOiAwLCAvLyDlvZPliY3moJHlvaLnmoTmu5rliqjmlbDmja5cbiAgICAgICAgZHJvcHBhYmxlVHlwZXM6IFtdLFxuICAgICAgICB0d2lua2xlczoge30sIC8vIOmcgOimgemXqueDgeeahCB1dWlkXG4gICAgICAgIGNoZWNrU2hpZnRVcERvd25NZXJnZTogeyB1dWlkOiAnJywgZGlyZWN0aW9uOiAnJyB9LCAvLyBzaGlmdCArIOeureWktOWkmumAie+8jOWinuW8uuS6pOS6kuaViOaenFxuICAgIH07XG59XG5cbi8qKlxuICogdm0gPSB0aGlzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtb3VudGVkKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB2bSA9IHRoaXM7XG59XG4iXX0=