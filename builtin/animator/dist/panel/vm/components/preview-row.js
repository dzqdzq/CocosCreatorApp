'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.mounted = exports.methods = exports.components = exports.computed = exports.watch = exports.data = exports.props = exports.template = void 0;
const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
const grid_ctrl_1 = require("../../share/grid-ctrl");
const global_data_1 = require("../../share/global-data");
const utils_1 = require("../../utils");
const pop_menu_1 = require("../../share/pop-menu");
const { join } = require('path');
const { readFileSync } = require('fs-extra');
exports.template = readFileSync(join(__dirname, './../../../../static/template/components/preview-row.html'), 'utf-8');
// TODO 骨骼动画此类数据，可以在初始化时就禁用很多数据监听，减小数据初始化
let KeyFrames = [];
exports.props = [
    'keyFrames',
    'selectInfo',
    'param',
    'type',
    'index',
    'listIndex',
    'scroll',
    'lock',
    'offset',
    'updateFrame',
    'updatePosition',
    'updateSelect',
    'hidden',
];
function data() {
    return {
        keyData: [],
        refreshTask: null,
        refreshTaskNumber: 0,
        dbKeyClick: false,
        tips: '',
        selectKey: null,
        combine: false, // 是否合并关键帧
        // {
        //     width: 22,
        //     x: 22,
        // }
    };
}
exports.data = data;
exports.watch = {
    // todo 监听 keyFrames 的变化会触发多次更新
    async updateFrame() {
        const that = this;
        that.refreshTaskNumber++;
        // 不显示的时候不去更新和计算
        if (!that.display) {
            return;
        }
        cancelAnimationFrame(that.refreshTask);
        that.refreshTask = requestAnimationFrame(async () => {
            await that.refresh();
        });
    },
    updatePosition() {
        const that = this;
        that.refreshTaskNumber++;
        // 不显示的时候不去更新和计算
        if (!that.display) {
            return;
        }
        cancelAnimationFrame(that.refreshTask);
        that.refreshTask = requestAnimationFrame(async () => {
            await that.refresh();
        });
    },
    selectInfo(newValue, oldValue) {
        const that = this;
        that.$set(that, 'selectKey', that.calcSelectKey(newValue));
    },
    updateSelect() {
        const that = this;
        that.$set(that, 'selectKey', that.calcSelectKey(that.selectInfo));
    },
};
exports.computed = {
    // TODO 3.7 移除
    display() {
        const that = this;
        return true;
        // 只在隐藏过程中有数据更新才做刷新 ???
        // if (that.refreshTaskNumber > 0) {
        //     that.refresh('position');
        // }
    },
    previewStyle() {
        const that = this;
        return {
            transform: `translateY(${that.offsetHeight}px)`,
            'pointer-events': `${that.keyType === 'image' ? 'auto' : 'none'}`,
        };
    },
    previewClass() {
        const that = this;
        let color = '';
        if (that.index % 2 === 0) {
            color = 'dark';
        }
        else {
            color = 'light';
        }
        return ['content-item', 'preview-row', color, that.lock ? 'lock' : ''];
    },
    offsetHeight() {
        const that = this;
        return that.listIndex * animation_editor_1.animationEditor.LINE_HEIGHT - (that.scroll?.top ?? 0);
    },
    // 筛选出能在当前组件内显示的选中关键帧数据
    // selectKey() {
    //     const that: any = this;
    //     if (!that.selectInfo || !that.selectInfo.params) {
    //         return null;
    //     }
    //     const result: any = [];
    //     that.selectInfo.data.forEach((item: any, index: number) => {
    //         if (!that.selectInfo.params[index]) {
    //             return;
    //         }
    //         if (that.selectInfo.params[index].nodePath !== that.param[0]) {
    //             return;
    //         }
    //         if (that.param[1] && (that.param[1] !== item.prop)) {
    //             return null;
    //         }
    //         result.push(item);
    //     });
    //     return result;
    // },
    draggable() {
        const that = this;
        // @ts-ignore
        return this.keyType !== 'key' || that.type && that.type.extends && that.type.extends.includes('cc.Asset');
    },
    keyType() {
        const that = this;
        if (!that.type) {
            return 'key';
        }
        if (animation_editor_1.animationEditor.imageCCTypes.includes(that.type.value)) {
            return 'image';
        }
        return 'key';
    },
};
exports.components = {};
exports.methods = {
    t(key, type = 'preview_row.') {
        return Editor.I18n.t(`animator.${type}${key}`);
    },
    // TODO 3.3 拆分数据处理函数，方便测试
    calcSelectKey(selectInfo) {
        const that = this;
        if (!selectInfo || !selectInfo.keyFrames || !animation_ctrl_1.animationCtrl.clipsDump) {
            return null;
        }
        selectInfo = JSON.parse(JSON.stringify(selectInfo));
        const result = [];
        selectInfo.keyFrames.forEach((item, index) => {
            const keyItem = selectInfo.keyFrames[index];
            if (keyItem.nodePath !== that.param[0]) {
                return;
            }
            //去重
            if (result.some((resItem) => resItem.key === item.key)) {
                return;
            }
            if (that.keyType !== 'key') {
                // 带有特殊格式的关键帧需要处理选中数据
                const info = that.keyFrames.find((keyInfo) => keyInfo.frame === item.rawFrame);
                if (info) {
                    item.value = info.value;
                }
            }
            if (that.param[1]) {
                const prop = that.param[1];
                const partKeys = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.param[0]][keyItem.prop].partKeys;
                if (Array.isArray(partKeys) && partKeys.includes(prop)) {
                    // 分量属性轨道内存在当前关键帧
                    const data = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.param[0]][prop].keyFrames.find((keyFrame) => keyItem.frame === keyFrame.frame);
                    if (data && data.prop === prop) {
                        //去重
                        if (result.some((resItem) => resItem.key === data.key)) {
                            return;
                        }
                        result.push({
                            frame: data.frame,
                            rawFrame: data.frame,
                            prop: data.prop,
                            value: data.dump.value,
                            key: data.key,
                            x: item.x,
                            nodePath: that.param[0],
                        });
                    }
                    return;
                }
                // 分量父轨道
                const parentKey = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[that.param[0]][keyItem.prop].parentPropKey;
                if (typeof parentKey === 'string' && parentKey === prop) {
                    // 分量属性轨道
                    result.push(item);
                    return;
                }
                // 同属性轨道
                if (prop !== keyItem.prop) {
                    return null;
                }
                else {
                    result.push(item);
                }
            }
            else {
                result.push(item);
            }
        });
        return Object.freeze(result);
    },
    /**
     * 刷新组件
     */
    async refresh(type) {
        const that = this;
        that.refreshTaskNumber = 0;
        if (!that.keyFrames || that.hidden) {
            that.keyData = null;
            return;
        }
        if (that.keyFrames.length < 1) {
            that.keyData = null;
            return;
        }
        KeyFrames = that.keyFrames;
        const keysMap = {};
        KeyFrames.forEach((item, index) => {
            keysMap[item.frame] = that.formatKey(item, index);
        });
        const keyData = Object.values(keysMap);
        keyData.sort((a, b) => a.x - b.x);
        const renderKeys = [keyData[0]];
        const addKeys = (i) => {
            if (keyData[i + 1].x - renderKeys[renderKeys.length - 1].x > 5) {
                renderKeys.push(keyData[i + 1]);
            }
        };
        for (let i = 0; i < keyData.length - 1; i++) {
            addKeys(i);
        }
        if (renderKeys.length !== keyData.length) {
            that.combine = true;
        }
        else {
            that.combine = false;
        }
        that.keyData = Object.freeze(renderKeys.map((item) => item.i));
    },
    calcSelectClass(isImage) {
        const that = this;
        const result = ['active'];
        if (isImage && that.type) {
            result.push('image');
        }
        else {
            result.push('key');
        }
        return result;
    },
    queryKeyStyle(x) {
        const that = this;
        if (that.keyType === 'image') {
            return `transform: translateX(${x | 0}px);`;
        }
        return `transform: translateX(${(x - 3) | 0}px) rotate(45deg);`;
    },
    onDragLeave(event) {
        const that = this;
        that.tips = '';
        if (!that.draggable) {
            return;
        }
        animation_editor_1.animationEditor.updateMouseFrame();
    },
    onDragOver(event) {
        const that = this;
        if (!that.draggable) {
            return;
        }
        const uuids = [];
        const { additional, value } = JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)) || {};
        if (additional) {
            additional.forEach((info) => {
                if (info.type === that.type.value) {
                    uuids.push(info.value);
                }
            });
        }
        else if (value && !uuids.includes(value)) {
            uuids.push(value);
        }
        if (!uuids.length) {
            that.tips = `${that.t('asset_type_should_be')} ${that.type.value}`;
            return;
        }
        requestAnimationFrame(() => {
            animation_editor_1.animationEditor.updateMouseFrame({ x: event.x, y: event.y });
        });
        that.tips = that.t('asset_position_tips');
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    },
    async onDrop(event) {
        const that = this;
        that.tips = '';
        animation_editor_1.animationEditor.updateMouseFrame();
        const dragInfos = [];
        const uuids = [];
        const { additional, value, type } = JSON.parse(JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)) || {};
        if (additional) {
            additional.forEach((info) => {
                if (info.type === that.type.value) {
                    uuids.push(info.value);
                    dragInfos.push(info);
                }
            });
        }
        if (value && !uuids.includes(value)) {
            uuids.push(value);
            dragInfos.push({ type, value });
        }
        if (!uuids.length) {
            return;
        }
        let frame = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
        const offsetFrame = (await animation_editor_1.animationEditor.getConfig('spacingFrame')) || 1;
        dragInfos.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            }
            return -1;
        });
        const createKeyInfo = [];
        for (const item of dragInfos) {
            if (item.type === that.type.value) {
                if (item.value.indexOf('@') === -1) {
                    const asset = await Editor.Message.request('asset-db', 'query-asset-info', item.value);
                    if (!asset) {
                        console.warn(`Failed to create keyframe: Asset not found - ${item.value}`);
                        continue;
                    }
                    const name = Object.keys(asset.subAssets);
                    item.value = asset.subAssets[name[0]].uuid;
                }
                createKeyInfo.push({
                    frame,
                    value: {
                        newValue: { uuid: item.value },
                    },
                    nodePath: that.param[0],
                    prop: that.param[1],
                });
                frame = frame + offsetFrame;
            }
        }
        animation_ctrl_1.animationCtrl.createKeyBatch(createKeyInfo);
    },
    // 由于图片关键帧的属性轨道样式上需要设置为可以接收事件，选中辅助框会被覆盖，需要自行判断是否点击在辅助框范围内
    onRowMouseDown(event) {
        // 检查是否点击在 stick 范围内
        const that = this;
        if (!that.selectInfo || !animation_editor_1.animationEditor.stickInfo) {
            return;
        }
        // 鼠标右键菜单
        if (event.button === 2) {
            return;
        }
        if (animation_editor_1.animationEditor.stickInfo.left < event.offsetX && animation_editor_1.animationEditor.stickInfo.width + animation_editor_1.animationEditor.stickInfo.left > event.offsetX) {
            global_data_1.Flags.mouseDownName = 'stick';
            that.selectInfo.startX = event.x;
            that.selectInfo.offset = 0;
            that.selectInfo.offsetFrame = 0;
            // @ts-ignore
            global_data_1.Flags.startDragStickInfo = {
                type: 'center',
            };
            event.stopPropagation();
        }
    },
    // TODO 3.3 可以拆分逻辑，将处理工具话单独测试各种数据的输入输出
    async onMouseDown(event, index) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (event.button !== 0) {
            return;
        }
        const that = this; // @ts-ignore
        const currentKey = JSON.parse(JSON.stringify(that.keyFrames[index]));
        if (that.dbKeyClick) {
            if (that.draggable && currentKey.value) {
                // 资源类型，要定位 assets 位置
                Editor.Message.send('assets', 'twinkle', currentKey.value);
            }
            animation_editor_1.animationEditor.updateCurrentFrame(currentKey.frame);
        }
        else {
            that.dbKeyClick = true;
            setTimeout(() => {
                that.dbKeyClick = false;
            }, 300);
        }
        const param = {
            nodePath: that.param[0],
            prop: currentKey.prop,
            frame: currentKey.frame,
        };
        // 节点轨道数据，需要补充当前关键帧的轨道信息
        // if (!that.type) {
        //     param[1] = data.prop;
        // }
        // param[2] = data.frame;
        let dragInfo = that.selectInfo || {};
        // 当前点击的关键帧是否在选择范围之内
        const paramIndex = animation_editor_1.animationEditor.getPositionAtSelect(param);
        const hasCtrl = (0, utils_1.checkCtrlOrCommand)(event);
        // 处理 ctrl / command 多选关键帧的情况
        if (that.selectInfo && hasCtrl && paramIndex === -1) {
            dragInfo.keyFrames.push({
                ...param,
                ...currentKey,
                rawFrame: currentKey.frame,
                key: (0, utils_1.calcKeyFrameKey)(currentKey),
            });
        }
        else if (paramIndex !== -1 && hasCtrl) {
            // ctrl / command
            const removeParams = [];
            if (!that.type) {
                that.keyFrames.forEach((keyframe) => {
                    if (keyframe.frame !== currentKey.frame) {
                        return;
                    }
                    removeParams.push({
                        nodePath: that.param[0],
                        prop: keyframe.prop || that.param[1],
                        frame: keyframe.frame,
                    });
                });
            }
            else {
                removeParams.push(param);
            }
            animation_editor_1.animationEditor.removeSelectKey(removeParams);
            return;
        }
        else if (paramIndex === -1) {
            // 点击了非选中关键帧的位置时
            dragInfo = {
                startX: event.x,
                offset: 0,
                offsetFrame: 0,
                nodePath: param.nodePath,
                prop: param.prop,
                keyFrames: [{
                        ...param,
                        ...currentKey,
                        rawFrame: currentKey.frame,
                        key: (0, utils_1.calcKeyFrameKey)(currentKey),
                    }],
                location: 'node', // default value, will be overwritten below
            };
        }
        // 处理选中的关键帧为节点关键帧或者分量主轨道时，需要选中多个关键帧
        if (!that.type) {
            that.keyFrames.forEach((keyframe) => {
                if (keyframe.frame !== currentKey.frame || keyframe.prop === currentKey.prop) {
                    return;
                }
                dragInfo.keyFrames.push({
                    nodePath: that.param[0],
                    prop: keyframe.prop || that.param[1],
                    frame: keyframe.frame,
                    rawFrame: keyframe.frame,
                    x: keyframe.x,
                    key: (0, utils_1.calcKeyFrameKey)(keyframe),
                });
            });
        }
        else {
            // 确认是否为分量主轨道，展开后选中内容需要同步 TODO 3.3 移除这部分处理，在选中数据的二次整理时加入
            const partKeys = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[param.nodePath][param.prop].partKeys;
            partKeys && partKeys.forEach((prop) => {
                const partProp = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[param.nodePath][prop];
                if (partProp && partProp.keyFrames.find((item) => item.frame === param.frame && item.prop === currentKey.prop)) {
                    dragInfo.keyFrames.push({
                        nodePath: that.param[0],
                        prop: prop,
                        frame: currentKey.frame,
                        rawFrame: currentKey.frame,
                        x: currentKey.x,
                        key: (0, utils_1.calcKeyFrameKey)(currentKey),
                    });
                }
            });
        }
        dragInfo.startX = event.x;
        // 直接在选中关键帧上点击
        if (dragInfo.sortDump && paramIndex !== -1) {
            dragInfo.offset = 0;
            dragInfo.offsetFrame = 0;
        }
        dragInfo.location = that.param[1] ? 'prop' : 'node';
        animation_editor_1.animationEditor.startDragKey(dragInfo, hasCtrl);
    },
    onPopMenu(event) {
        const that = this;
        if (that.lock || event.button !== 2 || (global_data_1.Flags.mouseDownName === 'grid' && global_data_1.Flags.startDragGridInfo?.start !== event.x)) {
            return;
        }
        event.preventDefault();
        global_data_1.Flags.mouseDownName = '';
        global_data_1.Flags.startDragGridInfo = null;
        event.stopPropagation();
        // @ts-ignore
        const $target = event.target;
        const name = $target.getAttribute('name');
        // 节点轨道只能移除关键帧
        if (!that.type && name !== 'key') {
            return;
        }
        const index = Number($target.getAttribute('index'));
        const frame = index ? that.keyFrames[index].frame : grid_ctrl_1.gridCtrl.pageToFrame(event.x);
        const popMenus = typeof index === 'number' && name === 'key' ? that.getKeyMenu(index) : that.getPropContextMenu(frame);
        popMenus.push({
            label: `frame: ${frame}`,
            enabled: false,
        });
        Editor.Menu.popup({ menu: popMenus });
    },
    getKeyMenu(index) {
        const that = this;
        let isInSelect = false;
        const menuMap = (0, pop_menu_1.getPopMenuMap)(that.type ? pop_menu_1.onPropKeyMenus : pop_menu_1.onNodeKeyMenus, false);
        const currentKeyInfo = {
            frame: that.keyFrames[index].frame,
            prop: that.param[1] || that.keyFrames[index].prop,
            nodePath: that.param[0],
        };
        const params = {
            nodePath: that.param[0],
            prop: currentKeyInfo.prop,
        };
        const { frame } = that.keyFrames[index];
        let frames = [frame];
        // 判断是否在选中关键帧内
        if (that.selectInfo && Array.isArray(that.selectInfo.keyFrames)) {
            for (const item of that.selectInfo.keyFrames) {
                if (item.frame === frame) {
                    isInSelect = true;
                    break;
                }
            }
            if (isInSelect) {
                frames = that.selectInfo.keyFrames.map((item) => item.frame);
            }
        }
        // 关键帧去重后才能作为是否选择了多个不同位置关键帧的判断方式
        frames = Array.from(new Set(frames));
        if (!that.type && isInSelect && frames.length > 1) {
            // 排列关键帧
            menuMap.spacingKeys.enabled = true;
            menuMap.spacingKeys.click = () => {
                animation_editor_1.animationEditor.spacingSelectedKeys(animation_editor_1.animationEditor.spacingFrame);
            };
        }
        // 在节点轨道上，数据需要传递多份
        const nodeParams = [];
        if (!that.type) {
            that.keyFrames.forEach((item) => {
                if (frames.includes(item.frame)) {
                    nodeParams.push({
                        prop: item.prop,
                        nodePath: currentKeyInfo.nodePath,
                        frame: item.frame,
                    });
                }
            });
        }
        else {
            menuMap.copyKey.enabled = true;
            menuMap.copyKey.click = () => {
                animation_ctrl_1.animationCtrl.copyKey(isInSelect ? undefined : Object.assign(params, {
                    frame: frames[0],
                }));
            };
            if (animation_editor_1.animationEditor.checkPropTypeInCopyKeyInfo(that.type)) {
                menuMap.pasteKey.enabled = true;
                menuMap.pasteKey.click = () => {
                    animation_ctrl_1.animationCtrl.pasteKey({
                        target: frame,
                        prop: params.prop,
                        nodePath: params.nodePath,
                    });
                };
            }
            else {
                menuMap.pasteKey.enabled = false;
            }
        }
        const removeParams = nodeParams.length ? nodeParams : params;
        menuMap.removeKey.enabled = true;
        menuMap.removeKey.click = () => {
            animation_ctrl_1.animationCtrl.removeKey(isInSelect ? undefined : Object.assign(removeParams, {
                frame: frames[0],
            }));
        };
        return Object.values(menuMap);
    },
    getPropContextMenu(frame) {
        const that = this;
        const params = {
            nodePath: that.param[0],
            prop: that.param[1],
        };
        const menuMap = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onPropContextMenus, false);
        // 点击在非关键帧空白区域
        menuMap.createKey = {
            ...pop_menu_1.popMenuMap.createKey,
            enabled: true,
            click() {
                animation_ctrl_1.animationCtrl.createKey({
                    frame,
                    nodePath: that.param[0],
                    prop: that.param[1],
                });
            },
        };
        // 在属性轨道上，方可复制、粘贴关键帧
        if (animation_editor_1.animationEditor.checkPropTypeInCopyKeyInfo(that.type)) {
            menuMap.pasteKey.enabled = true;
            menuMap.pasteKey.click = () => {
                animation_ctrl_1.animationCtrl.pasteKey({
                    target: frame,
                    prop: params.prop,
                    nodePath: params.nodePath,
                });
            };
        }
        return Object.values(menuMap);
    },
};
async function mounted() {
    // @ts-ignore
    const that = this;
    that.formatKey = getFormatKeyFunc(that.keyType);
    await that.refresh();
    that.$set(that, 'selectKey', that.calcSelectKey(that.selectInfo));
}
exports.mounted = mounted;
function getLineInfo(x1, x2) {
    const min = Math.min(x1, x2);
    const max = Math.max(x1, x2);
    return {
        x: min | 0,
        w: max - min,
    };
}
function getFormatKeyFunc(type) {
    if (type === 'image') {
        return function formatKey(keyframe, index) {
            return {
                x: keyframe.x,
                i: index,
                value: keyframe.value,
            };
        };
    }
    else {
        return function formatKey(keyframe, index) {
            return {
                x: keyframe.x,
                i: index,
            };
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1yb3cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2UvcGFuZWwvdm0vY29tcG9uZW50cy9wcmV2aWV3LXJvdy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7OztBQWNiLCtEQUEyRDtBQUMzRCxtRUFBK0Q7QUFDL0QscURBQWlEO0FBQ2pELHlEQUFnRDtBQUNoRCx1Q0FBa0U7QUFDbEUsbURBQXNJO0FBRXRJLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakMsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVoQyxRQUFBLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSwyREFBMkQsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBRTVILHlDQUF5QztBQUN6QyxJQUFJLFNBQVMsR0FBZ0IsRUFBRSxDQUFDO0FBRW5CLFFBQUEsS0FBSyxHQUFHO0lBQ2pCLFdBQVc7SUFDWCxZQUFZO0lBQ1osT0FBTztJQUNQLE1BQU07SUFDTixPQUFPO0lBQ1AsV0FBVztJQUNYLFFBQVE7SUFDUixNQUFNO0lBQ04sUUFBUTtJQUNSLGFBQWE7SUFDYixnQkFBZ0I7SUFDaEIsY0FBYztJQUNkLFFBQVE7Q0FDWCxDQUFDO0FBRUYsU0FBZ0IsSUFBSTtJQUNoQixPQUFPO1FBQ0gsT0FBTyxFQUFFLEVBQUU7UUFDWCxXQUFXLEVBQUUsSUFBSTtRQUNqQixpQkFBaUIsRUFBRSxDQUFDO1FBQ3BCLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLElBQUksRUFBRSxFQUFFO1FBQ1IsU0FBUyxFQUFFLElBQUk7UUFDZixPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVU7UUFDMUIsSUFBSTtRQUNKLGlCQUFpQjtRQUNqQixhQUFhO1FBQ2IsSUFBSTtLQUNQLENBQUM7QUFDTixDQUFDO0FBZEQsb0JBY0M7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QyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFQRCwwQkFPQztBQUVELFNBQVMsV0FBVyxDQUFDLEVBQVUsRUFBRSxFQUFVO0lBQ3ZDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdCLE9BQU87UUFDSCxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7UUFDVixDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUc7S0FDZixDQUFDO0FBQ04sQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsSUFBcUI7SUFDM0MsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO1FBQ2xCLE9BQU8sU0FBUyxTQUFTLENBQUMsUUFBbUIsRUFBRSxLQUFhO1lBQ3hELE9BQU87Z0JBQ0gsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNiLENBQUMsRUFBRSxLQUFLO2dCQUNSLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSzthQUN4QixDQUFDO1FBQ04sQ0FBQyxDQUFDO0tBQ0w7U0FBTTtRQUNILE9BQU8sU0FBUyxTQUFTLENBQUMsUUFBbUIsRUFBRSxLQUFhO1lBQ3hELE9BQU87Z0JBQ0gsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNiLENBQUMsRUFBRSxLQUFLO2FBQ1gsQ0FBQztRQUNOLENBQUMsQ0FBQztLQUNMO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtcbiAgICBJU2VsZWN0UGFyYW0sXG4gICAgSUtleUZyYW1lLFxuICAgIElLZXlGcmFtZURhdGEsXG4gICAgSVByb3BQYXJhbXMsXG4gICAgSUFuaUN0cmxPcGVyYXRpb25OYW1lLFxuICAgIFZNVGhpc1RlbXBsYXRlLFxuICAgIElTZWxlY3RLZXksXG4gICAgSVN0YXJ0RHJhZ0tleSxcbiAgICBJUmF3S2V5RnJhbWUsXG59IGZyb20gJy4uLy4uLy4uLy4uL0B0eXBlcy9wcml2YXRlJztcblxuaW1wb3J0IHsgYW5pbWF0aW9uQ3RybCB9IGZyb20gJy4uLy4uL3NoYXJlL2FuaW1hdGlvbi1jdHJsJztcbmltcG9ydCB7IGFuaW1hdGlvbkVkaXRvciB9IGZyb20gJy4uLy4uL3NoYXJlL2FuaW1hdGlvbi1lZGl0b3InO1xuaW1wb3J0IHsgZ3JpZEN0cmwgfSBmcm9tICcuLi8uLi9zaGFyZS9ncmlkLWN0cmwnO1xuaW1wb3J0IHsgRmxhZ3MgfSBmcm9tICcuLi8uLi9zaGFyZS9nbG9iYWwtZGF0YSc7XG5pbXBvcnQgeyBjYWxjS2V5RnJhbWVLZXksIGNoZWNrQ3RybE9yQ29tbWFuZCB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IGdldFBvcE1lbnVNYXAsIG9uTm9kZUtleU1lbnVzLCBvblByb3BDb250ZXh0TWVudXMsIG9uUHJvcEtleU1lbnVzLCBQb3BNZW51SXRlbVR5cGUsIHBvcE1lbnVNYXAgfSBmcm9tICcuLi8uLi9zaGFyZS9wb3AtbWVudSc7XG5cbmNvbnN0IHsgam9pbiB9ID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgeyByZWFkRmlsZVN5bmMgfSA9IHJlcXVpcmUoJ2ZzLWV4dHJhJyk7XG5cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZSA9IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4vLi4vLi4vLi4vLi4vc3RhdGljL3RlbXBsYXRlL2NvbXBvbmVudHMvcHJldmlldy1yb3cuaHRtbCcpLCAndXRmLTgnKTtcblxuLy8gVE9ETyDpqqjpqrzliqjnlLvmraTnsbvmlbDmja7vvIzlj6/ku6XlnKjliJ3lp4vljJbml7blsLHnpoHnlKjlvojlpJrmlbDmja7nm5HlkKzvvIzlh4/lsI/mlbDmja7liJ3lp4vljJZcbmxldCBLZXlGcmFtZXM6IElLZXlGcmFtZVtdID0gW107XG5cbmV4cG9ydCBjb25zdCBwcm9wcyA9IFtcbiAgICAna2V5RnJhbWVzJyxcbiAgICAnc2VsZWN0SW5mbycsXG4gICAgJ3BhcmFtJyxcbiAgICAndHlwZScsXG4gICAgJ2luZGV4JyxcbiAgICAnbGlzdEluZGV4JyxcbiAgICAnc2Nyb2xsJyxcbiAgICAnbG9jaycsXG4gICAgJ29mZnNldCcsXG4gICAgJ3VwZGF0ZUZyYW1lJyxcbiAgICAndXBkYXRlUG9zaXRpb24nLFxuICAgICd1cGRhdGVTZWxlY3QnLFxuICAgICdoaWRkZW4nLFxuXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAga2V5RGF0YTogW10sXG4gICAgICAgIHJlZnJlc2hUYXNrOiBudWxsLFxuICAgICAgICByZWZyZXNoVGFza051bWJlcjogMCwgLy8g6K6w5b2V5pWw5o2u5pu05paw55qE5qyh5pWwXG4gICAgICAgIGRiS2V5Q2xpY2s6IGZhbHNlLFxuICAgICAgICB0aXBzOiAnJyxcbiAgICAgICAgc2VsZWN0S2V5OiBudWxsLFxuICAgICAgICBjb21iaW5lOiBmYWxzZSwgLy8g5piv5ZCm5ZCI5bm25YWz6ZSu5binXG4gICAgICAgIC8vIHtcbiAgICAgICAgLy8gICAgIHdpZHRoOiAyMixcbiAgICAgICAgLy8gICAgIHg6IDIyLFxuICAgICAgICAvLyB9XG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHdhdGNoID0ge1xuICAgIC8vIHRvZG8g55uR5ZCsIGtleUZyYW1lcyDnmoTlj5jljJbkvJrop6blj5HlpJrmrKHmm7TmlrBcbiAgICBhc3luYyB1cGRhdGVGcmFtZSgpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgdGhhdC5yZWZyZXNoVGFza051bWJlcisrO1xuICAgICAgICAvLyDkuI3mmL7npLrnmoTml7blgJnkuI3ljrvmm7TmlrDlkozorqHnrpdcbiAgICAgICAgaWYgKCF0aGF0LmRpc3BsYXkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGF0LnJlZnJlc2hUYXNrKTtcbiAgICAgICAgdGhhdC5yZWZyZXNoVGFzayA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGF0LnJlZnJlc2goKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICB0aGF0LnJlZnJlc2hUYXNrTnVtYmVyKys7XG4gICAgICAgIC8vIOS4jeaYvuekuueahOaXtuWAmeS4jeWOu+abtOaWsOWSjOiuoeeul1xuICAgICAgICBpZiAoIXRoYXQuZGlzcGxheSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoYXQucmVmcmVzaFRhc2spO1xuICAgICAgICB0aGF0LnJlZnJlc2hUYXNrID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoYXQucmVmcmVzaCgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2VsZWN0SW5mbyhuZXdWYWx1ZTogYW55LCBvbGRWYWx1ZTogYW55KSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIHRoYXQuJHNldCh0aGF0LCAnc2VsZWN0S2V5JywgdGhhdC5jYWxjU2VsZWN0S2V5KG5ld1ZhbHVlKSk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVNlbGVjdCgpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgdGhhdC4kc2V0KHRoYXQsICdzZWxlY3RLZXknLCB0aGF0LmNhbGNTZWxlY3RLZXkodGhhdC5zZWxlY3RJbmZvKSk7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBjb21wdXRlZCA9IHtcbiAgICAvLyBUT0RPIDMuNyDnp7vpmaRcbiAgICBkaXNwbGF5KCkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgLy8g5Y+q5Zyo6ZqQ6JeP6L+H56iL5Lit5pyJ5pWw5o2u5pu05paw5omN5YGa5Yi35pawID8/P1xuICAgICAgICAvLyBpZiAodGhhdC5yZWZyZXNoVGFza051bWJlciA+IDApIHtcbiAgICAgICAgLy8gICAgIHRoYXQucmVmcmVzaCgncG9zaXRpb24nKTtcbiAgICAgICAgLy8gfVxuICAgIH0sXG5cbiAgICBwcmV2aWV3U3R5bGUoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGVZKCR7dGhhdC5vZmZzZXRIZWlnaHR9cHgpYCxcbiAgICAgICAgICAgICdwb2ludGVyLWV2ZW50cyc6IGAke3RoYXQua2V5VHlwZSA9PT0gJ2ltYWdlJyA/ICdhdXRvJyA6ICdub25lJ31gLFxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBwcmV2aWV3Q2xhc3MoKSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIGxldCBjb2xvciA9ICcnO1xuICAgICAgICBpZiAodGhhdC5pbmRleCAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIGNvbG9yID0gJ2RhcmsnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29sb3IgPSAnbGlnaHQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbJ2NvbnRlbnQtaXRlbScsICdwcmV2aWV3LXJvdycsIGNvbG9yLCB0aGF0LmxvY2sgPyAnbG9jaycgOiAnJ107XG4gICAgfSxcblxuICAgIG9mZnNldEhlaWdodCgpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHRoYXQubGlzdEluZGV4ICogYW5pbWF0aW9uRWRpdG9yLkxJTkVfSEVJR0hUIC0gKHRoYXQuc2Nyb2xsPy50b3AgPz8gMCk7XG4gICAgfSxcblxuICAgIC8vIOetm+mAieWHuuiDveWcqOW9k+WJjee7hOS7tuWGheaYvuekuueahOmAieS4reWFs+mUruW4p+aVsOaNrlxuICAgIC8vIHNlbGVjdEtleSgpIHtcbiAgICAvLyAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAvLyAgICAgaWYgKCF0aGF0LnNlbGVjdEluZm8gfHwgIXRoYXQuc2VsZWN0SW5mby5wYXJhbXMpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiBudWxsO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGNvbnN0IHJlc3VsdDogYW55ID0gW107XG4gICAgLy8gICAgIHRoYXQuc2VsZWN0SW5mby5kYXRhLmZvckVhY2goKGl0ZW06IGFueSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgIC8vICAgICAgICAgaWYgKCF0aGF0LnNlbGVjdEluZm8ucGFyYW1zW2luZGV4XSkge1xuICAgIC8vICAgICAgICAgICAgIHJldHVybjtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGlmICh0aGF0LnNlbGVjdEluZm8ucGFyYW1zW2luZGV4XS5ub2RlUGF0aCAhPT0gdGhhdC5wYXJhbVswXSkge1xuICAgIC8vICAgICAgICAgICAgIHJldHVybjtcbiAgICAvLyAgICAgICAgIH1cblxuICAgIC8vICAgICAgICAgaWYgKHRoYXQucGFyYW1bMV0gJiYgKHRoYXQucGFyYW1bMV0gIT09IGl0ZW0ucHJvcCkpIHtcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAvLyB9LFxuXG4gICAgZHJhZ2dhYmxlKCk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiB0aGlzLmtleVR5cGUgIT09ICdrZXknIHx8IHRoYXQudHlwZSAmJiB0aGF0LnR5cGUuZXh0ZW5kcyAmJiB0aGF0LnR5cGUuZXh0ZW5kcy5pbmNsdWRlcygnY2MuQXNzZXQnKTtcbiAgICB9LFxuXG4gICAga2V5VHlwZSgpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgaWYgKCF0aGF0LnR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiAna2V5JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoYW5pbWF0aW9uRWRpdG9yLmltYWdlQ0NUeXBlcy5pbmNsdWRlcyh0aGF0LnR5cGUudmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2ltYWdlJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ2tleSc7XG4gICAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge307XG5cbmV4cG9ydCBjb25zdCBtZXRob2RzID0ge1xuICAgIHQoa2V5OiBzdHJpbmcsIHR5cGUgPSAncHJldmlld19yb3cuJykge1xuICAgICAgICByZXR1cm4gRWRpdG9yLkkxOG4udChgYW5pbWF0b3IuJHt0eXBlfSR7a2V5fWApO1xuICAgIH0sXG5cbiAgICAvLyBUT0RPIDMuMyDmi4bliIbmlbDmja7lpITnkIblh73mlbDvvIzmlrnkvr/mtYvor5VcbiAgICBjYWxjU2VsZWN0S2V5KHNlbGVjdEluZm86IElTZWxlY3RLZXkpOiByZWFkb25seSBJS2V5RnJhbWVEYXRhW10gfCBudWxsIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgaWYgKCFzZWxlY3RJbmZvIHx8ICFzZWxlY3RJbmZvLmtleUZyYW1lcyB8fCAhYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHNlbGVjdEluZm8gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHNlbGVjdEluZm8pKTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBJS2V5RnJhbWVEYXRhW10gPSBbXTtcbiAgICAgICAgc2VsZWN0SW5mby5rZXlGcmFtZXMuZm9yRWFjaCgoaXRlbTogSUtleUZyYW1lRGF0YSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5SXRlbSA9IHNlbGVjdEluZm8ua2V5RnJhbWVzW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChrZXlJdGVtLm5vZGVQYXRoICE9PSB0aGF0LnBhcmFtWzBdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy/ljrvph41cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc29tZSgocmVzSXRlbSkgPT4gcmVzSXRlbS5rZXkgPT09IGl0ZW0ua2V5KSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoYXQua2V5VHlwZSAhPT0gJ2tleScpIHtcbiAgICAgICAgICAgICAgICAvLyDluKbmnInnibnmrormoLzlvI/nmoTlhbPplK7luKfpnIDopoHlpITnkIbpgInkuK3mlbDmja5cbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0gdGhhdC5rZXlGcmFtZXMuZmluZCgoa2V5SW5mbzogSUtleUZyYW1lKSA9PiBrZXlJbmZvLmZyYW1lID09PSBpdGVtLnJhd0ZyYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5mbykge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnZhbHVlID0gaW5mby52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhhdC5wYXJhbVsxXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb3AgPSB0aGF0LnBhcmFtWzFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRLZXlzID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcFt0aGF0LnBhcmFtWzBdXVtrZXlJdGVtLnByb3BdLnBhcnRLZXlzO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhcnRLZXlzKSAmJiBwYXJ0S2V5cy5pbmNsdWRlcyhwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDliIbph4/lsZ7mgKfovajpgZPlhoXlrZjlnKjlvZPliY3lhbPplK7luKdcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbdGhhdC5wYXJhbVswXV1bcHJvcF0ua2V5RnJhbWVzLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICAoa2V5RnJhbWU6IElSYXdLZXlGcmFtZSkgPT4ga2V5SXRlbS5mcmFtZSA9PT0ga2V5RnJhbWUuZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEucHJvcCA9PT0gcHJvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy/ljrvph41cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuc29tZSgocmVzSXRlbSkgPT4gcmVzSXRlbS5rZXkgPT09IGRhdGEua2V5KSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lOiBkYXRhLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBkYXRhLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3A6IGRhdGEucHJvcCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YS5kdW1wLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogZGF0YS5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogaXRlbS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LnBhcmFtWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOWIhumHj+eItui9qOmBk1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudEtleSA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbdGhhdC5wYXJhbVswXV1ba2V5SXRlbS5wcm9wXS5wYXJlbnRQcm9wS2V5O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyZW50S2V5ID09PSAnc3RyaW5nJyAmJiBwYXJlbnRLZXkgPT09IHByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YiG6YeP5bGe5oCn6L2o6YGTXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWQjOWxnuaAp+i9qOmBk1xuICAgICAgICAgICAgICAgIGlmIChwcm9wICE9PSBrZXlJdGVtLnByb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHJlc3VsdCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIt+aWsOe7hOS7tlxuICAgICAqL1xuICAgIGFzeW5jIHJlZnJlc2godHlwZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIHRoYXQucmVmcmVzaFRhc2tOdW1iZXIgPSAwO1xuICAgICAgICBpZiAoIXRoYXQua2V5RnJhbWVzIHx8IHRoYXQuaGlkZGVuKSB7XG4gICAgICAgICAgICB0aGF0LmtleURhdGEgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGF0LmtleUZyYW1lcy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICB0aGF0LmtleURhdGEgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIEtleUZyYW1lcyA9IHRoYXQua2V5RnJhbWVzO1xuICAgICAgICBjb25zdCBrZXlzTWFwOiBSZWNvcmQ8bnVtYmVyLCBhbnk+ID0ge307XG4gICAgICAgIEtleUZyYW1lcy5mb3JFYWNoKChpdGVtLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBrZXlzTWFwW2l0ZW0uZnJhbWVdID0gdGhhdC5mb3JtYXRLZXkoaXRlbSwgaW5kZXgpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qga2V5RGF0YTogYW55W10gPSBPYmplY3QudmFsdWVzKGtleXNNYXApO1xuXG4gICAgICAgIGtleURhdGEuc29ydCgoYSwgYikgPT4gYS54IC0gYi54KTtcbiAgICAgICAgY29uc3QgcmVuZGVyS2V5cyA9IFtrZXlEYXRhWzBdXTtcbiAgICAgICAgY29uc3QgYWRkS2V5cyA9IChpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChrZXlEYXRhW2kgKyAxXS54IC0gcmVuZGVyS2V5c1tyZW5kZXJLZXlzLmxlbmd0aCAtIDFdLnggPiA1KSB7XG4gICAgICAgICAgICAgICAgcmVuZGVyS2V5cy5wdXNoKGtleURhdGFbaSArIDFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlEYXRhLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgYWRkS2V5cyhpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVuZGVyS2V5cy5sZW5ndGggIT09IGtleURhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGF0LmNvbWJpbmUgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhhdC5jb21iaW5lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5rZXlEYXRhID0gT2JqZWN0LmZyZWV6ZShyZW5kZXJLZXlzLm1hcCgoaXRlbSkgPT4gaXRlbS5pKSk7XG4gICAgfSxcblxuICAgIGNhbGNTZWxlY3RDbGFzcyhpc0ltYWdlOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFsnYWN0aXZlJ107XG4gICAgICAgIGlmIChpc0ltYWdlICYmIHRoYXQudHlwZSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goJ2ltYWdlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCgna2V5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgcXVlcnlLZXlTdHlsZSh4OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgaWYgKHRoYXQua2V5VHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgcmV0dXJuIGB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoJHt4IHwgMH1weCk7YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYHRyYW5zZm9ybTogdHJhbnNsYXRlWCgkeyh4IC0gMykgfCAwfXB4KSByb3RhdGUoNDVkZWcpO2A7XG4gICAgfSxcblxuICAgIG9uRHJhZ0xlYXZlKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgdGhhdC50aXBzID0gJyc7XG4gICAgICAgIGlmICghdGhhdC5kcmFnZ2FibGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhbmltYXRpb25FZGl0b3IudXBkYXRlTW91c2VGcmFtZSgpO1xuICAgIH0sXG4gICAgb25EcmFnT3ZlcihldmVudDogYW55KSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGF0LmRyYWdnYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBhZGRpdGlvbmFsLCB2YWx1ZSB9ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShFZGl0b3IuVUkuX19wcm90ZWN0ZWRfXy5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICBpZiAoYWRkaXRpb25hbCkge1xuICAgICAgICAgICAgYWRkaXRpb25hbC5mb3JFYWNoKChpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaW5mby50eXBlID09PSB0aGF0LnR5cGUudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZHMucHVzaChpbmZvLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSAmJiAhdXVpZHMuaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICAgICAgICB1dWlkcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXVpZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGF0LnRpcHMgPSBgJHt0aGF0LnQoJ2Fzc2V0X3R5cGVfc2hvdWxkX2JlJyl9ICR7dGhhdC50eXBlLnZhbHVlfWA7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZU1vdXNlRnJhbWUoeyB4OiBldmVudC54LCB5OiBldmVudC55IH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhhdC50aXBzID0gdGhhdC50KCdhc3NldF9wb3NpdGlvbl90aXBzJyk7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gJ2NvcHknO1xuICAgIH0sXG5cbiAgICBhc3luYyBvbkRyb3AoZXZlbnQ6IGFueSkge1xuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzO1xuICAgICAgICB0aGF0LnRpcHMgPSAnJztcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZU1vdXNlRnJhbWUoKTtcblxuICAgICAgICBjb25zdCBkcmFnSW5mb3MgPSBbXTtcbiAgICAgICAgY29uc3QgdXVpZHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgY29uc3QgeyBhZGRpdGlvbmFsLCB2YWx1ZSwgdHlwZSB9ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShFZGl0b3IuVUkuX19wcm90ZWN0ZWRfXy5EcmFnQXJlYS5jdXJyZW50RHJhZ0luZm8pKSB8fCB7fTtcblxuICAgICAgICBpZiAoYWRkaXRpb25hbCkge1xuICAgICAgICAgICAgYWRkaXRpb25hbC5mb3JFYWNoKChpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaW5mby50eXBlID09PSB0aGF0LnR5cGUudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdXVpZHMucHVzaChpbmZvLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgZHJhZ0luZm9zLnB1c2goaW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUgJiYgIXV1aWRzLmluY2x1ZGVzKHZhbHVlKSkge1xuICAgICAgICAgICAgdXVpZHMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICBkcmFnSW5mb3MucHVzaCh7IHR5cGUsIHZhbHVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dWlkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBmcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKGV2ZW50LngpO1xuICAgICAgICBjb25zdCBvZmZzZXRGcmFtZSA9IChhd2FpdCBhbmltYXRpb25FZGl0b3IuZ2V0Q29uZmlnKCdzcGFjaW5nRnJhbWUnKSkgfHwgMTtcbiAgICAgICAgZHJhZ0luZm9zLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoYS5uYW1lID4gYi5uYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjcmVhdGVLZXlJbmZvID0gW107XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkcmFnSW5mb3MpIHtcbiAgICAgICAgICAgIGlmIChpdGVtLnR5cGUgPT09IHRoYXQudHlwZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLnZhbHVlLmluZGV4T2YoJ0AnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdhc3NldC1kYicsICdxdWVyeS1hc3NldC1pbmZvJywgaXRlbS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRmFpbGVkIHRvIGNyZWF0ZSBrZXlmcmFtZTogQXNzZXQgbm90IGZvdW5kIC0gJHtpdGVtLnZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IE9iamVjdC5rZXlzKGFzc2V0LnN1YkFzc2V0cyk7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udmFsdWUgPSBhc3NldC5zdWJBc3NldHNbbmFtZVswXV0udXVpZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3JlYXRlS2V5SW5mby5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZTogeyB1dWlkOiBpdGVtLnZhbHVlIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LnBhcmFtWzBdLFxuICAgICAgICAgICAgICAgICAgICBwcm9wOiB0aGF0LnBhcmFtWzFdLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGZyYW1lID0gZnJhbWUgKyBvZmZzZXRGcmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhbmltYXRpb25DdHJsLmNyZWF0ZUtleUJhdGNoKGNyZWF0ZUtleUluZm8pO1xuICAgIH0sXG5cbiAgICAvLyDnlLHkuo7lm77niYflhbPplK7luKfnmoTlsZ7mgKfovajpgZPmoLflvI/kuIrpnIDopoHorr7nva7kuLrlj6/ku6XmjqXmlLbkuovku7bvvIzpgInkuK3ovoXliqnmoYbkvJrooqvopobnm5bvvIzpnIDopoHoh6rooYzliKTmlq3mmK/lkKbngrnlh7vlnKjovoXliqnmoYbojIPlm7TlhoVcbiAgICBvblJvd01vdXNlRG93bihldmVudDogTW91c2VFdmVudCkge1xuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbngrnlh7vlnKggc3RpY2sg6IyD5Zu05YaFXG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIGlmICghdGhhdC5zZWxlY3RJbmZvIHx8ICFhbmltYXRpb25FZGl0b3Iuc3RpY2tJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8g6byg5qCH5Y+z6ZSu6I+c5Y2VXG4gICAgICAgIGlmIChldmVudC5idXR0b24gPT09IDIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mby5sZWZ0IDwgZXZlbnQub2Zmc2V0WCAmJiBhbmltYXRpb25FZGl0b3Iuc3RpY2tJbmZvLndpZHRoICsgYW5pbWF0aW9uRWRpdG9yLnN0aWNrSW5mby5sZWZ0ID4gZXZlbnQub2Zmc2V0WCkge1xuICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdzdGljayc7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEluZm8hLnN0YXJ0WCA9IGV2ZW50Lng7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEluZm8hLm9mZnNldCA9IDA7XG4gICAgICAgICAgICB0aGF0LnNlbGVjdEluZm8hLm9mZnNldEZyYW1lID0gMDtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIEZsYWdzLnN0YXJ0RHJhZ1N0aWNrSW5mbyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnY2VudGVyJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBUT0RPIDMuMyDlj6/ku6Xmi4bliIbpgLvovpHvvIzlsIblpITnkIblt6Xlhbfor53ljZXni6zmtYvor5XlkITnp43mlbDmja7nmoTovpPlhaXovpPlh7pcbiAgICBhc3luYyBvbk1vdXNlRG93bihldmVudDogTW91c2VFdmVudCwgaW5kZXg6IG51bWJlcikge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aGF0OiBhbnkgPSB0aGlzOyAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGN1cnJlbnRLZXk6IElLZXlGcmFtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhhdC5rZXlGcmFtZXNbaW5kZXhdKSk7XG4gICAgICAgIGlmICh0aGF0LmRiS2V5Q2xpY2spIHtcbiAgICAgICAgICAgIGlmICh0aGF0LmRyYWdnYWJsZSAmJiBjdXJyZW50S2V5LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8g6LWE5rqQ57G75Z6L77yM6KaB5a6a5L2NIGFzc2V0cyDkvY3nva5cbiAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdhc3NldHMnLCAndHdpbmtsZScsIGN1cnJlbnRLZXkudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnVwZGF0ZUN1cnJlbnRGcmFtZShjdXJyZW50S2V5LmZyYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuZGJLZXlDbGljayA9IHRydWU7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGF0LmRiS2V5Q2xpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyYW0gPSB7XG4gICAgICAgICAgICBub2RlUGF0aDogdGhhdC5wYXJhbVswXSxcbiAgICAgICAgICAgIHByb3A6IGN1cnJlbnRLZXkucHJvcCxcbiAgICAgICAgICAgIGZyYW1lOiBjdXJyZW50S2V5LmZyYW1lLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOiKgueCuei9qOmBk+aVsOaNru+8jOmcgOimgeihpeWFheW9k+WJjeWFs+mUruW4p+eahOi9qOmBk+S/oeaBr1xuICAgICAgICAvLyBpZiAoIXRoYXQudHlwZSkge1xuICAgICAgICAvLyAgICAgcGFyYW1bMV0gPSBkYXRhLnByb3A7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gcGFyYW1bMl0gPSBkYXRhLmZyYW1lO1xuXG4gICAgICAgIGxldCBkcmFnSW5mbzogSVN0YXJ0RHJhZ0tleSA9IHRoYXQuc2VsZWN0SW5mbyB8fCB7fTtcbiAgICAgICAgLy8g5b2T5YmN54K55Ye755qE5YWz6ZSu5bin5piv5ZCm5Zyo6YCJ5oup6IyD5Zu05LmL5YaFXG4gICAgICAgIGNvbnN0IHBhcmFtSW5kZXggPSBhbmltYXRpb25FZGl0b3IuZ2V0UG9zaXRpb25BdFNlbGVjdChwYXJhbSk7XG4gICAgICAgIGNvbnN0IGhhc0N0cmwgPSBjaGVja0N0cmxPckNvbW1hbmQoZXZlbnQpO1xuICAgICAgICAvLyDlpITnkIYgY3RybCAvIGNvbW1hbmQg5aSa6YCJ5YWz6ZSu5bin55qE5oOF5Ya1XG4gICAgICAgIGlmICh0aGF0LnNlbGVjdEluZm8gJiYgaGFzQ3RybCAmJiBwYXJhbUluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgZHJhZ0luZm8ua2V5RnJhbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgIC4uLnBhcmFtLFxuICAgICAgICAgICAgICAgIC4uLmN1cnJlbnRLZXksXG4gICAgICAgICAgICAgICAgcmF3RnJhbWU6IGN1cnJlbnRLZXkuZnJhbWUsXG4gICAgICAgICAgICAgICAga2V5OiBjYWxjS2V5RnJhbWVLZXkoY3VycmVudEtleSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChwYXJhbUluZGV4ICE9PSAtMSAmJiBoYXNDdHJsKSB7XG4gICAgICAgICAgICAvLyBjdHJsIC8gY29tbWFuZFxuICAgICAgICAgICAgY29uc3QgcmVtb3ZlUGFyYW1zOiBJU2VsZWN0UGFyYW1bXSA9IFtdO1xuICAgICAgICAgICAgaWYgKCF0aGF0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGF0LmtleUZyYW1lcy5mb3JFYWNoKChrZXlmcmFtZTogSUtleUZyYW1lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXlmcmFtZS5mcmFtZSAhPT0gY3VycmVudEtleS5mcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZVBhcmFtcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LnBhcmFtWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcDoga2V5ZnJhbWUucHJvcCB8fCB0aGF0LnBhcmFtWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGtleWZyYW1lLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlUGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLnJlbW92ZVNlbGVjdEtleShyZW1vdmVQYXJhbXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcmFtSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAvLyDngrnlh7vkuobpnZ7pgInkuK3lhbPplK7luKfnmoTkvY3nva7ml7ZcbiAgICAgICAgICAgIGRyYWdJbmZvID0ge1xuICAgICAgICAgICAgICAgIHN0YXJ0WDogZXZlbnQueCxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IDAsXG4gICAgICAgICAgICAgICAgbm9kZVBhdGg6IHBhcmFtLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgIHByb3A6IHBhcmFtLnByb3AsXG4gICAgICAgICAgICAgICAga2V5RnJhbWVzOiBbe1xuICAgICAgICAgICAgICAgICAgICAuLi5wYXJhbSxcbiAgICAgICAgICAgICAgICAgICAgLi4uY3VycmVudEtleSxcbiAgICAgICAgICAgICAgICAgICAgcmF3RnJhbWU6IGN1cnJlbnRLZXkuZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIGtleTogY2FsY0tleUZyYW1lS2V5KGN1cnJlbnRLZXkpLFxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgIGxvY2F0aW9uOiAnbm9kZScsIC8vIGRlZmF1bHQgdmFsdWUsIHdpbGwgYmUgb3ZlcndyaXR0ZW4gYmVsb3dcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpITnkIbpgInkuK3nmoTlhbPplK7luKfkuLroioLngrnlhbPplK7luKfmiJbogIXliIbph4/kuLvovajpgZPml7bvvIzpnIDopoHpgInkuK3lpJrkuKrlhbPplK7luKdcbiAgICAgICAgaWYgKCF0aGF0LnR5cGUpIHtcbiAgICAgICAgICAgIHRoYXQua2V5RnJhbWVzLmZvckVhY2goKGtleWZyYW1lOiBJS2V5RnJhbWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ZnJhbWUuZnJhbWUgIT09IGN1cnJlbnRLZXkuZnJhbWUgfHwga2V5ZnJhbWUucHJvcCA9PT0gY3VycmVudEtleS5wcm9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZHJhZ0luZm8ua2V5RnJhbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogdGhhdC5wYXJhbVswXSxcbiAgICAgICAgICAgICAgICAgICAgcHJvcDoga2V5ZnJhbWUucHJvcCB8fCB0aGF0LnBhcmFtWzFdLFxuICAgICAgICAgICAgICAgICAgICBmcmFtZToga2V5ZnJhbWUuZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBrZXlmcmFtZS5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgeDoga2V5ZnJhbWUueCxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBjYWxjS2V5RnJhbWVLZXkoa2V5ZnJhbWUpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDnoa7orqTmmK/lkKbkuLrliIbph4/kuLvovajpgZPvvIzlsZXlvIDlkI7pgInkuK3lhoXlrrnpnIDopoHlkIzmraUgVE9ETyAzLjMg56e76Zmk6L+Z6YOo5YiG5aSE55CG77yM5Zyo6YCJ5Lit5pWw5o2u55qE5LqM5qyh5pW055CG5pe25Yqg5YWlXG4gICAgICAgICAgICBjb25zdCBwYXJ0S2V5cyA9IGFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wIS5wYXRoc0R1bXBbcGFyYW0ubm9kZVBhdGhdW3BhcmFtLnByb3BdLnBhcnRLZXlzO1xuICAgICAgICAgICAgcGFydEtleXMgJiYgcGFydEtleXMuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRQcm9wID0gYW5pbWF0aW9uQ3RybC5jbGlwc0R1bXAhLnBhdGhzRHVtcFtwYXJhbS5ub2RlUGF0aF1bcHJvcF07XG4gICAgICAgICAgICAgICAgaWYgKHBhcnRQcm9wICYmIHBhcnRQcm9wLmtleUZyYW1lcy5maW5kKChpdGVtKSA9PiBpdGVtLmZyYW1lID09PSBwYXJhbS5mcmFtZSAmJiBpdGVtLnByb3AgPT09IGN1cnJlbnRLZXkucHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZHJhZ0luZm8ua2V5RnJhbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IHRoYXQucGFyYW1bMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wOiBwcm9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGN1cnJlbnRLZXkuZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICByYXdGcmFtZTogY3VycmVudEtleS5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IGN1cnJlbnRLZXkueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY2FsY0tleUZyYW1lS2V5KGN1cnJlbnRLZXkpLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRyYWdJbmZvLnN0YXJ0WCA9IGV2ZW50Lng7XG4gICAgICAgIC8vIOebtOaOpeWcqOmAieS4reWFs+mUruW4p+S4iueCueWHu1xuICAgICAgICBpZiAoZHJhZ0luZm8uc29ydER1bXAgJiYgcGFyYW1JbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGRyYWdJbmZvLm9mZnNldCA9IDA7XG4gICAgICAgICAgICBkcmFnSW5mby5vZmZzZXRGcmFtZSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBkcmFnSW5mby5sb2NhdGlvbiA9IHRoYXQucGFyYW1bMV0gPyAncHJvcCcgOiAnbm9kZSc7XG4gICAgICAgIGFuaW1hdGlvbkVkaXRvci5zdGFydERyYWdLZXkoZHJhZ0luZm8sIGhhc0N0cmwpO1xuICAgIH0sXG5cbiAgICBvblBvcE1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgaWYgKHRoYXQubG9jayB8fCBldmVudC5idXR0b24gIT09IDIgfHwgKEZsYWdzLm1vdXNlRG93bk5hbWUgPT09ICdncmlkJyAmJiBGbGFncy5zdGFydERyYWdHcmlkSW5mbz8uc3RhcnQgIT09IGV2ZW50LngpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICcnO1xuICAgICAgICBGbGFncy5zdGFydERyYWdHcmlkSW5mbyA9IG51bGw7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0ICR0YXJnZXQ6IEhUTUxFbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBjb25zdCBuYW1lID0gJHRhcmdldC5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcbiAgICAgICAgLy8g6IqC54K56L2o6YGT5Y+q6IO956e76Zmk5YWz6ZSu5binXG4gICAgICAgIGlmICghdGhhdC50eXBlICYmIG5hbWUgIT09ICdrZXknKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5kZXggPSBOdW1iZXIoJHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2luZGV4JykpO1xuICAgICAgICBjb25zdCBmcmFtZSA9IGluZGV4ID8gdGhhdC5rZXlGcmFtZXNbaW5kZXhdLmZyYW1lIDogZ3JpZEN0cmwucGFnZVRvRnJhbWUoZXZlbnQueCk7XG4gICAgICAgIGNvbnN0IHBvcE1lbnVzOiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSA9IHR5cGVvZiBpbmRleCA9PT0gJ251bWJlcicgJiYgbmFtZSA9PT0gJ2tleScgPyB0aGF0LmdldEtleU1lbnUoaW5kZXgpIDogdGhhdC5nZXRQcm9wQ29udGV4dE1lbnUoZnJhbWUpO1xuICAgICAgICBwb3BNZW51cy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBgZnJhbWU6ICR7ZnJhbWV9YCxcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgRWRpdG9yLk1lbnUucG9wdXAoeyBtZW51OiBwb3BNZW51cyB9KTtcbiAgICB9LFxuXG4gICAgZ2V0S2V5TWVudShpbmRleDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IHRoYXQ6IGFueSA9IHRoaXM7XG4gICAgICAgIGxldCBpc0luU2VsZWN0ID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IG1lbnVNYXA6IFJlY29yZDxQb3BNZW51SXRlbVR5cGUsIEVkaXRvci5NZW51LkNvbnRleHRNZW51SXRlbT4gPSBnZXRQb3BNZW51TWFwKHRoYXQudHlwZSA/IG9uUHJvcEtleU1lbnVzIDogb25Ob2RlS2V5TWVudXMsIGZhbHNlKTtcbiAgICAgICAgY29uc3QgY3VycmVudEtleUluZm8gPSB7XG4gICAgICAgICAgICBmcmFtZTogdGhhdC5rZXlGcmFtZXNbaW5kZXhdLmZyYW1lLFxuICAgICAgICAgICAgcHJvcDogdGhhdC5wYXJhbVsxXSB8fCB0aGF0LmtleUZyYW1lc1tpbmRleF0ucHJvcCxcbiAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LnBhcmFtWzBdLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBwYXJhbXM6IElQcm9wUGFyYW1zIHwgdW5kZWZpbmVkID0ge1xuICAgICAgICAgICAgbm9kZVBhdGg6IHRoYXQucGFyYW1bMF0sXG4gICAgICAgICAgICBwcm9wOiBjdXJyZW50S2V5SW5mby5wcm9wLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB7IGZyYW1lIH0gPSB0aGF0LmtleUZyYW1lc1tpbmRleF07XG5cbiAgICAgICAgbGV0IGZyYW1lcyA9IFtmcmFtZV07XG4gICAgICAgIC8vIOWIpOaWreaYr+WQpuWcqOmAieS4reWFs+mUruW4p+WGhVxuICAgICAgICBpZiAodGhhdC5zZWxlY3RJbmZvICYmIEFycmF5LmlzQXJyYXkodGhhdC5zZWxlY3RJbmZvLmtleUZyYW1lcykpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGF0LnNlbGVjdEluZm8ua2V5RnJhbWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uZnJhbWUgPT09IGZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzSW5TZWxlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNJblNlbGVjdCkge1xuICAgICAgICAgICAgICAgIGZyYW1lcyA9IHRoYXQuc2VsZWN0SW5mby5rZXlGcmFtZXMubWFwKChpdGVtOiBJS2V5RnJhbWVEYXRhKSA9PiBpdGVtLmZyYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDlhbPplK7luKfljrvph43lkI7miY3og73kvZzkuLrmmK/lkKbpgInmi6nkuoblpJrkuKrkuI3lkIzkvY3nva7lhbPplK7luKfnmoTliKTmlq3mlrnlvI9cbiAgICAgICAgZnJhbWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGZyYW1lcykpO1xuICAgICAgICBpZiAoIXRoYXQudHlwZSAmJiBpc0luU2VsZWN0ICYmIGZyYW1lcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAvLyDmjpLliJflhbPplK7luKdcbiAgICAgICAgICAgIG1lbnVNYXAuc3BhY2luZ0tleXMuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBtZW51TWFwLnNwYWNpbmdLZXlzLmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkVkaXRvci5zcGFjaW5nU2VsZWN0ZWRLZXlzKGFuaW1hdGlvbkVkaXRvci5zcGFjaW5nRnJhbWUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAvLyDlnKjoioLngrnovajpgZPkuIrvvIzmlbDmja7pnIDopoHkvKDpgJLlpJrku71cbiAgICAgICAgY29uc3Qgbm9kZVBhcmFtczogSVByb3BQYXJhbXNbXSA9IFtdO1xuICAgICAgICBpZiAoIXRoYXQudHlwZSkge1xuICAgICAgICAgICAgdGhhdC5rZXlGcmFtZXMuZm9yRWFjaCgoaXRlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZyYW1lcy5pbmNsdWRlcyhpdGVtLmZyYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlUGFyYW1zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcDogaXRlbS5wcm9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IGN1cnJlbnRLZXlJbmZvLm5vZGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGl0ZW0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVudU1hcC5jb3B5S2V5LmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgbWVudU1hcC5jb3B5S2V5LmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY29weUtleShpc0luU2VsZWN0ID8gdW5kZWZpbmVkIDogT2JqZWN0LmFzc2lnbihwYXJhbXMsIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWU6IGZyYW1lc1swXSxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGFuaW1hdGlvbkVkaXRvci5jaGVja1Byb3BUeXBlSW5Db3B5S2V5SW5mbyh0aGF0LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUtleS5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBtZW51TWFwLnBhc3RlS2V5LmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLnBhc3RlS2V5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wOiBwYXJhbXMhLnByb3AsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlUGF0aDogcGFyYW1zIS5ub2RlUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUtleS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVtb3ZlUGFyYW1zID0gbm9kZVBhcmFtcy5sZW5ndGggPyBub2RlUGFyYW1zIDogcGFyYW1zO1xuICAgICAgICBtZW51TWFwLnJlbW92ZUtleS5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgbWVudU1hcC5yZW1vdmVLZXkuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICBhbmltYXRpb25DdHJsLnJlbW92ZUtleShpc0luU2VsZWN0ID8gdW5kZWZpbmVkIDogT2JqZWN0LmFzc2lnbihyZW1vdmVQYXJhbXMsIHtcbiAgICAgICAgICAgICAgICBmcmFtZTogZnJhbWVzWzBdLFxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhtZW51TWFwKTtcbiAgICB9LFxuXG4gICAgZ2V0UHJvcENvbnRleHRNZW51KGZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcbiAgICAgICAgY29uc3QgcGFyYW1zOiBJUHJvcFBhcmFtcyB8IHVuZGVmaW5lZCA9IHtcbiAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LnBhcmFtWzBdLFxuICAgICAgICAgICAgcHJvcDogdGhhdC5wYXJhbVsxXSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgbWVudU1hcDogUmVjb3JkPFBvcE1lbnVJdGVtVHlwZSwgRWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtPiA9IGdldFBvcE1lbnVNYXAob25Qcm9wQ29udGV4dE1lbnVzLCBmYWxzZSk7XG4gICAgICAgIC8vIOeCueWHu+WcqOmdnuWFs+mUruW4p+epuueZveWMuuWfn1xuICAgICAgICBtZW51TWFwLmNyZWF0ZUtleSA9IHtcbiAgICAgICAgICAgIC4uLnBvcE1lbnVNYXAuY3JlYXRlS2V5LFxuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGNsaWNrKCkge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY3JlYXRlS2V5KHtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQYXRoOiB0aGF0LnBhcmFtWzBdLFxuICAgICAgICAgICAgICAgICAgICBwcm9wOiB0aGF0LnBhcmFtWzFdLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8g5Zyo5bGe5oCn6L2o6YGT5LiK77yM5pa55Y+v5aSN5Yi244CB57KY6LS05YWz6ZSu5binXG4gICAgICAgIGlmIChhbmltYXRpb25FZGl0b3IuY2hlY2tQcm9wVHlwZUluQ29weUtleUluZm8odGhhdC50eXBlKSkge1xuICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUtleS5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIG1lbnVNYXAucGFzdGVLZXkuY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uQ3RybC5wYXN0ZUtleSh7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIHByb3A6IHBhcmFtcyEucHJvcCxcbiAgICAgICAgICAgICAgICAgICAgbm9kZVBhdGg6IHBhcmFtcyEubm9kZVBhdGgsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYmplY3QudmFsdWVzKG1lbnVNYXApO1xuICAgIH0sXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW91bnRlZCgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgdGhhdDogYW55ID0gdGhpcztcblxuICAgIHRoYXQuZm9ybWF0S2V5ID0gZ2V0Rm9ybWF0S2V5RnVuYyh0aGF0LmtleVR5cGUpO1xuICAgIGF3YWl0IHRoYXQucmVmcmVzaCgpO1xuICAgIHRoYXQuJHNldCh0aGF0LCAnc2VsZWN0S2V5JywgdGhhdC5jYWxjU2VsZWN0S2V5KHRoYXQuc2VsZWN0SW5mbykpO1xufVxuXG5mdW5jdGlvbiBnZXRMaW5lSW5mbyh4MTogbnVtYmVyLCB4MjogbnVtYmVyKSB7XG4gICAgY29uc3QgbWluID0gTWF0aC5taW4oeDEsIHgyKTtcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heCh4MSwgeDIpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IG1pbiB8IDAsXG4gICAgICAgIHc6IG1heCAtIG1pbixcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRGb3JtYXRLZXlGdW5jKHR5cGU6ICdrZXknIHwgJ2ltYWdlJykge1xuICAgIGlmICh0eXBlID09PSAnaW1hZ2UnKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBmb3JtYXRLZXkoa2V5ZnJhbWU6IElLZXlGcmFtZSwgaW5kZXg6IG51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBrZXlmcmFtZS54LFxuICAgICAgICAgICAgICAgIGk6IGluZGV4LFxuICAgICAgICAgICAgICAgIHZhbHVlOiBrZXlmcmFtZS52YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGZvcm1hdEtleShrZXlmcmFtZTogSUtleUZyYW1lLCBpbmRleDogbnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IGtleWZyYW1lLngsXG4gICAgICAgICAgICAgICAgaTogaW5kZXgsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH1cbn1cbiJdfQ==