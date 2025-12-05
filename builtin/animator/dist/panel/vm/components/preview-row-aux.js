"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewRowAux = void 0;
const vue_js_1 = require("vue/dist/vue.js");
const lodash_1 = require("lodash");
const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
const grid_ctrl_1 = require("../../share/grid-ctrl");
const utils_1 = require("../../utils");
const pop_menu_1 = require("../../share/pop-menu");
const global_data_1 = require("../../share/global-data");
const hooks_1 = require("../hooks");
const template = /* html */ `
    <div :style="elStyle" class="content-item preview-row">
        <div
            tabindex="-1"
            class="row-wrap"
            :style="wrapStyle"
            @mousedown.self="onRowMousedown"
            @contextmenu="onRowContextmenu"
        >
            <!-- 关键帧显示 -->
            <div
                v-for="(frame, index) in keyFrames"
                :key="getFrameKey(frame)"
                :style="queryKeyStyle(frame.x)"
                :index="index"
                class="key"
                name="aux-key"
                @mousedown="onKeyMousedown($event, index)"
                @contextmenu="onKeyContextmenu($event, index)"
            ></div>

            <div
                v-for="(item, index) in selectKey"
                :key="'active_' + getFrameKey(item)"
                :style="queryKeyStyle(item.x)"
                class="active key"
                name="key"
            ></div>
        </div>
    </div>
`;
exports.PreviewRowAux = (0, vue_js_1.defineComponent)({
    name: 'PreviewRowAux',
    props: {
        name: { type: String, default: '' },
        keyFrames: { type: Array, default: () => [] },
        selectInfo: { type: Object, default: undefined },
        scroll: { type: Object, default: undefined },
        listIndex: { type: Number, default: 0 },
        offset: { type: Number, default: 0 },
        updateFrame: { type: Number, default: 0 },
        updatePosition: { type: Number, default: 0 },
        updateSelect: { type: Number, default: 0 },
        hidden: { type: Boolean, default: false },
    },
    emits: {
        'select-key': null,
        'remove-key': null,
        'paste-key': null,
        'create-key': null,
    },
    setup(props, ctx) {
        const baseStore = (0, hooks_1.useBaseStore)();
        const auxCurveStore = (0, hooks_1.useAuxCurveStore)();
        const selectedKeys = (0, vue_js_1.ref)([]);
        const offsetHeight = (0, vue_js_1.computed)(() => {
            return props.listIndex * animation_editor_1.animationEditor.LINE_HEIGHT - (props.scroll?.top ?? 0);
        });
        const elStyle = (0, vue_js_1.computed)(() => {
            return {
                transform: `translateY(${(0, vue_js_1.unref)(offsetHeight)}px)`,
                // pointerEvents: `none`,
            };
        });
        const wrapStyle = (0, vue_js_1.computed)(() => {
            return {
                transform: `translateX(${props.offset}px)`,
            };
        });
        (0, vue_js_1.watch)(() => props.selectInfo, (newValue, oldValue) => {
            if (!newValue) {
                selectedKeys.value = [];
                return;
            }
            selectedKeys.value = calcSelectKey(newValue);
        });
        (0, hooks_1.useTickUpdate)(() => props.updatePosition, () => {
            const _selectedKeys = (0, vue_js_1.unref)(selectedKeys);
            // update position x of selected keys
            if (_selectedKeys.length > 0) {
                for (const key of _selectedKeys) {
                    key.x = grid_ctrl_1.gridCtrl.frameToCanvas(key.frame);
                }
            }
        });
        function getFrameKey(keyframe) {
            return `${keyframe.frame}__${keyframe.prop}`;
        }
        function queryKeyStyle(x) {
            return {
                transform: `translateX(${Number.isFinite(x) ? x : 0}px) translateX(-50%) rotate(45deg)`,
            };
        }
        function copyKeyframe(frame) {
            const keyframe = props.keyFrames.find((item) => item.frame === frame);
            if (!keyframe || keyframe.curve == null || keyframe.dump == null) {
                return;
            }
            const snapshot = {
                clip: baseStore.currentClip,
                name: props.name,
                frame: keyframe.frame,
                curve: (0, lodash_1.cloneDeep)(keyframe.curve),
                dump: (0, lodash_1.cloneDeep)(keyframe.dump),
            };
            auxCurveStore.setCopyKeyframe(snapshot);
        }
        async function pasteKeyframe(destFrame) {
            const snap = auxCurveStore.copyKeyframeSnap;
            if (snap == null) {
                return;
            }
            const destData = {
                ...snap.curve,
                newValue: snap.dump.value,
            };
            return animation_ctrl_1.animationCtrl.copyAuxKey({
                name: snap.name,
                frame: snap.frame,
                data: destData,
            }, {
                name: props.name,
                frame: destFrame,
                data: destData,
            });
        }
        // FIXME: 参考 preview-row 的临时解决方案。避免右键菜单时触发拖拽
        function resetGridDragging() {
            global_data_1.Flags.mouseDownName = '';
            global_data_1.Flags.startDragGridInfo = null;
        }
        // key item events
        function onKeyContextmenu(e, index) {
            e.stopPropagation();
            resetGridDragging();
            const popMenus = getKeyMenu(index);
            // insert frame indicator in contextmenu
            if (index > -1 && index <= props.keyFrames.length - 1) {
                const keyframe = props.keyFrames[index];
                popMenus.push({
                    label: `Frame: ${keyframe.frame}`,
                    enabled: false,
                });
            }
            Editor.Menu.popup({
                x: e.pageX,
                y: e.pageY + 10,
                menu: popMenus,
            });
        }
        function onKeyMousedown(event, index) {
            if (event.button !== 0) {
                // only handle main button pressed
                return;
            }
            const hasCtrl = (0, utils_1.checkCtrlOrCommand)(event);
            const keyframe = props.keyFrames[index];
            const info = {
                keyframes: [
                    {
                        key: props.name,
                        rawFrame: keyframe.frame,
                        frame: keyframe.frame,
                        x: keyframe.x,
                        offsetFrame: 0,
                    },
                ],
                ctrl: hasCtrl,
                offset: 0,
                offsetFrame: 0,
                startX: event.x,
            };
            ctx.emit('select-key', props.name, info);
            if (hasCtrl) {
                return;
            }
            global_data_1.Flags.mouseDownName = 'aux-key';
        }
        function calcSelectKey(selectInfo) {
            if (!selectInfo || !selectInfo.keyframes || !animation_ctrl_1.animationCtrl.clipsDump) {
                return [];
            }
            const result = [];
            const framesAdded = new Set();
            const rowFrames = props.keyFrames;
            for (let i = 0; i < rowFrames.length; i++) {
                const rowFrame = rowFrames[i];
                //去重
                if (framesAdded.has(rowFrame.frame)) {
                    continue;
                }
                const shouldSelect = selectInfo.keyframes.find((item) => {
                    return item.key === rowFrame.prop && rowFrame.frame === item.rawFrame;
                });
                if (shouldSelect != null) {
                    result.push({
                        key: shouldSelect.key,
                        frame: shouldSelect.frame,
                        rawFrame: shouldSelect.rawFrame,
                        x: shouldSelect.x,
                        offsetFrame: shouldSelect.offsetFrame,
                    });
                    framesAdded.add(shouldSelect.frame);
                }
            }
            // console.debug('calc aux select key', JSON.stringify(result));
            return result;
        }
        function getKeyMenu(index) {
            let isInSelect = false;
            const menuMap = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onAuxKeyContextMenus, false);
            const curveName = props.name;
            const { frame } = props.keyFrames[index];
            let frames = [frame];
            // 判断是否在选中关键帧内
            if (props.selectInfo && Array.isArray(props.selectInfo.keyframes)) {
                for (const item of props.selectInfo.keyframes) {
                    if (item.key === curveName && item.frame === frame) {
                        isInSelect = true;
                        break;
                    }
                }
                if (isInSelect) {
                    frames = props.selectInfo.keyframes.map((item) => item.frame);
                }
            }
            // 关键帧去重后才能作为是否选择了多个不同位置关键帧的判断方式
            frames = Array.from(new Set(frames));
            // copy
            menuMap.copyAuxKey.enabled = frames.length > 0;
            menuMap.copyAuxKey.click = () => {
                if (frames.length < 1) {
                    return;
                }
                copyKeyframe(frame);
            };
            if (auxCurveStore.copyKeyframeSnap != null) {
                menuMap.pasteAuxKey.enabled = true;
                menuMap.pasteAuxKey.click = () => {
                    pasteKeyframe(frame).then(() => {
                        ctx.emit('paste-key', curveName, frame);
                    });
                };
            }
            else {
                menuMap.pasteAuxKey.enabled = false;
            }
            // remove
            menuMap.removeAuxKey.enabled = true;
            menuMap.removeAuxKey.click = () => {
                // if (!isInSelect) {
                //     return;
                // }
                animation_ctrl_1.animationCtrl.removeAuxKey(curveName, frame).then(() => {
                    ctx.emit('remove-key', curveName, frame);
                    // unselect if selected
                    if (isInSelect) {
                        ctx.emit('select-key', curveName, null);
                    }
                });
            };
            return Object.values(menuMap);
        }
        // row events
        function onRowMousedown(e) {
            ctx.emit('select-key', props.name, null);
        }
        function onRowContextmenu(event) {
            event.stopPropagation();
            resetGridDragging();
            const frame = grid_ctrl_1.gridCtrl.pageToFrame(event.x);
            // console.debug('row contextmenu', [props.name, frame]);
            const popMenus = getRowContextmenu(frame);
            popMenus.push({ ...pop_menu_1.popMenuMap.separator });
            popMenus.push({
                label: `frame: ${frame}`,
                enabled: false,
            });
            Editor.Menu.popup({ menu: popMenus });
        }
        function getRowContextmenu(frame) {
            const menuMap = (0, pop_menu_1.getPopMenuMap)(pop_menu_1.onAuxRowContextMenus, false);
            const curveName = props.name;
            // 点击在非关键帧空白区域
            menuMap.createAuxKey = {
                ...pop_menu_1.popMenuMap.createAuxKey,
                enabled: true,
                click() {
                    animation_ctrl_1.animationCtrl.createAuxKey(curveName, frame).then(() => {
                        ctx.emit('create-key', curveName, frame);
                    });
                },
            };
            if (auxCurveStore.copyKeyframeSnap != null) {
                menuMap.pasteAuxKey.enabled = true;
                menuMap.pasteAuxKey.click = () => {
                    pasteKeyframe(frame).then(() => {
                        ctx.emit('paste-key', curveName, frame);
                    });
                };
            }
            return Object.values(menuMap);
        }
        return {
            selectKey: selectedKeys,
            elStyle,
            wrapStyle,
            getKeyMenu,
            queryKeyStyle,
            getFrameKey,
            onKeyMousedown,
            onKeyContextmenu,
            onRowMousedown,
            onRowContextmenu,
        };
    },
    template: template,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1yb3ctYXV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc291cmNlL3BhbmVsL3ZtL2NvbXBvbmVudHMvcHJldmlldy1yb3ctYXV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRDQVV5QjtBQUN6QixtQ0FBbUM7QUFZbkMsK0RBQTJEO0FBQzNELG1FQUErRDtBQUMvRCxxREFBaUQ7QUFDakQsdUNBQWlEO0FBQ2pELG1EQU04QjtBQUM5Qix5REFBZ0Q7QUFFaEQsb0NBQXlFO0FBRXpFLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOEIzQixDQUFDO0FBRVcsUUFBQSxhQUFhLEdBQUcsSUFBQSx3QkFBZSxFQUFDO0lBQ3pDLElBQUksRUFBRSxlQUFlO0lBQ3JCLEtBQUssRUFBRTtRQUNILElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtRQUNuQyxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBaUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3pFLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFrQyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUU7UUFDNUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQXVDLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRTtRQUM3RSxTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUU7UUFDdkMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFO1FBQ3BDLFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRTtRQUN6QyxjQUFjLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFF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QU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELE9BQU87WUFDSCxTQUFTLEVBQUUsWUFBWTtZQUN2QixPQUFPO1lBQ1AsU0FBUztZQUVULFVBQVU7WUFDVixhQUFhO1lBQ2IsV0FBVztZQUNYLGNBQWM7WUFDZCxnQkFBZ0I7WUFFaEIsY0FBYztZQUNkLGdCQUFnQjtTQUNuQixDQUFDO0lBQ04sQ0FBQztJQUVELFFBQVEsRUFBRSxRQUFRO0NBQ3JCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUsIHtcbiAgICBkZWZpbmVDb21wb25lbnQsXG4gICAgUHJvcFR5cGUsXG4gICAgcmVmLFxuICAgIHVucmVmLFxuICAgIGNvbXB1dGVkLFxuICAgIHdhdGNoLFxuICAgIFJlZixcbiAgICBvblNjb3BlRGlzcG9zZSxcbiAgICB0b1JlZixcbn0gZnJvbSAndnVlL2Rpc3QvdnVlLmpzJztcbmltcG9ydCB7IGNsb25lRGVlcCB9IGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7XG4gICAgSUtleUZyYW1lLFxuICAgIElLZXlGcmFtZURhdGEsXG4gICAgSVNlbGVjdEtleUJhc2UsXG4gICAgSVJhd0tleUZyYW1lLFxuICAgIElLZXlmcmFtZURhdGFCYXNlLFxuICAgIElDb3B5QXV4S2V5U25hcHNob3QsXG4gICAgSUFuaW1Db3B5QXV4U3JjLFxufSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmltcG9ydCB7IGFuaW1hdGlvbkN0cmwgfSBmcm9tICcuLi8uLi9zaGFyZS9hbmltYXRpb24tY3RybCc7XG5pbXBvcnQgeyBhbmltYXRpb25FZGl0b3IgfSBmcm9tICcuLi8uLi9zaGFyZS9hbmltYXRpb24tZWRpdG9yJztcbmltcG9ydCB7IGdyaWRDdHJsIH0gZnJvbSAnLi4vLi4vc2hhcmUvZ3JpZC1jdHJsJztcbmltcG9ydCB7IGNoZWNrQ3RybE9yQ29tbWFuZCB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7XG4gICAgZ2V0UG9wTWVudU1hcCxcbiAgICBvbkF1eEtleUNvbnRleHRNZW51cyxcbiAgICBQb3BNZW51SXRlbVR5cGUsXG4gICAgcG9wTWVudU1hcCxcbiAgICBvbkF1eFJvd0NvbnRleHRNZW51cyxcbn0gZnJvbSAnLi4vLi4vc2hhcmUvcG9wLW1lbnUnO1xuaW1wb3J0IHsgRmxhZ3MgfSBmcm9tICcuLi8uLi9zaGFyZS9nbG9iYWwtZGF0YSc7XG5cbmltcG9ydCB7IHVzZUF1eEN1cnZlU3RvcmUsIHVzZUJhc2VTdG9yZSwgdXNlVGlja1VwZGF0ZSB9IGZyb20gJy4uL2hvb2tzJztcblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbiAgICA8ZGl2IDpzdHlsZT1cImVsU3R5bGVcIiBjbGFzcz1cImNvbnRlbnQtaXRlbSBwcmV2aWV3LXJvd1wiPlxuICAgICAgICA8ZGl2XG4gICAgICAgICAgICB0YWJpbmRleD1cIi0xXCJcbiAgICAgICAgICAgIGNsYXNzPVwicm93LXdyYXBcIlxuICAgICAgICAgICAgOnN0eWxlPVwid3JhcFN0eWxlXCJcbiAgICAgICAgICAgIEBtb3VzZWRvd24uc2VsZj1cIm9uUm93TW91c2Vkb3duXCJcbiAgICAgICAgICAgIEBjb250ZXh0bWVudT1cIm9uUm93Q29udGV4dG1lbnVcIlxuICAgICAgICA+XG4gICAgICAgICAgICA8IS0tIOWFs+mUruW4p+aYvuekuiAtLT5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICB2LWZvcj1cIihmcmFtZSwgaW5kZXgpIGluIGtleUZyYW1lc1wiXG4gICAgICAgICAgICAgICAgOmtleT1cImdldEZyYW1lS2V5KGZyYW1lKVwiXG4gICAgICAgICAgICAgICAgOnN0eWxlPVwicXVlcnlLZXlTdHlsZShmcmFtZS54KVwiXG4gICAgICAgICAgICAgICAgOmluZGV4PVwiaW5kZXhcIlxuICAgICAgICAgICAgICAgIGNsYXNzPVwia2V5XCJcbiAgICAgICAgICAgICAgICBuYW1lPVwiYXV4LWtleVwiXG4gICAgICAgICAgICAgICAgQG1vdXNlZG93bj1cIm9uS2V5TW91c2Vkb3duKCRldmVudCwgaW5kZXgpXCJcbiAgICAgICAgICAgICAgICBAY29udGV4dG1lbnU9XCJvbktleUNvbnRleHRtZW51KCRldmVudCwgaW5kZXgpXCJcbiAgICAgICAgICAgID48L2Rpdj5cblxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIHYtZm9yPVwiKGl0ZW0sIGluZGV4KSBpbiBzZWxlY3RLZXlcIlxuICAgICAgICAgICAgICAgIDprZXk9XCInYWN0aXZlXycgKyBnZXRGcmFtZUtleShpdGVtKVwiXG4gICAgICAgICAgICAgICAgOnN0eWxlPVwicXVlcnlLZXlTdHlsZShpdGVtLngpXCJcbiAgICAgICAgICAgICAgICBjbGFzcz1cImFjdGl2ZSBrZXlcIlxuICAgICAgICAgICAgICAgIG5hbWU9XCJrZXlcIlxuICAgICAgICAgICAgPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbmA7XG5cbmV4cG9ydCBjb25zdCBQcmV2aWV3Um93QXV4ID0gZGVmaW5lQ29tcG9uZW50KHtcbiAgICBuYW1lOiAnUHJldmlld1Jvd0F1eCcsXG4gICAgcHJvcHM6IHtcbiAgICAgICAgbmFtZTogeyB0eXBlOiBTdHJpbmcsIGRlZmF1bHQ6ICcnIH0sXG4gICAgICAgIGtleUZyYW1lczogeyB0eXBlOiBBcnJheSBhcyBQcm9wVHlwZTxJUmF3S2V5RnJhbWVbXT4sIGRlZmF1bHQ6ICgpID0+IFtdIH0sXG4gICAgICAgIHNlbGVjdEluZm86IHsgdHlwZTogT2JqZWN0IGFzIFByb3BUeXBlPElTZWxlY3RLZXlCYXNlPiwgZGVmYXVsdDogdW5kZWZpbmVkIH0sXG4gICAgICAgIHNjcm9sbDogeyB0eXBlOiBPYmplY3QgYXMgUHJvcFR5cGU8UmVjb3JkPHN0cmluZywgYW55Pj4sIGRlZmF1bHQ6IHVuZGVmaW5lZCB9LFxuICAgICAgICBsaXN0SW5kZXg6IHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0sXG4gICAgICAgIG9mZnNldDogeyB0eXBlOiBOdW1iZXIsIGRlZmF1bHQ6IDAgfSxcbiAgICAgICAgdXBkYXRlRnJhbWU6IHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0sXG4gICAgICAgIHVwZGF0ZVBvc2l0aW9uOiB7IHR5cGU6IE51bWJlciwgZGVmYXVsdDogMCB9LFxuICAgICAgICB1cGRhdGVTZWxlY3Q6IHsgdHlwZTogTnVtYmVyLCBkZWZhdWx0OiAwIH0sXG4gICAgICAgIGhpZGRlbjogeyB0eXBlOiBCb29sZWFuLCBkZWZhdWx0OiBmYWxzZSB9LFxuICAgIH0sXG4gICAgZW1pdHM6IHtcbiAgICAgICAgJ3NlbGVjdC1rZXknOiBudWxsLFxuICAgICAgICAncmVtb3ZlLWtleSc6IG51bGwsXG4gICAgICAgICdwYXN0ZS1rZXknOiBudWxsLFxuICAgICAgICAnY3JlYXRlLWtleSc6IG51bGwsXG4gICAgfSxcbiAgICBzZXR1cChwcm9wcywgY3R4KSB7XG4gICAgICAgIGNvbnN0IGJhc2VTdG9yZSA9IHVzZUJhc2VTdG9yZSgpO1xuICAgICAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdXNlQXV4Q3VydmVTdG9yZSgpO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkS2V5cyA9IHJlZjxJS2V5ZnJhbWVEYXRhQmFzZVtdPihbXSk7XG5cbiAgICAgICAgY29uc3Qgb2Zmc2V0SGVpZ2h0ID0gY29tcHV0ZWQoKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHByb3BzLmxpc3RJbmRleCAqIGFuaW1hdGlvbkVkaXRvci5MSU5FX0hFSUdIVCAtIChwcm9wcy5zY3JvbGw/LnRvcCA/PyAwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZWxTdHlsZSA9IGNvbXB1dGVkKCgpOiBQYXJ0aWFsPENTU1N0eWxlRGVjbGFyYXRpb24+ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlWSgke3VucmVmKG9mZnNldEhlaWdodCl9cHgpYCxcbiAgICAgICAgICAgICAgICAvLyBwb2ludGVyRXZlbnRzOiBgbm9uZWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgd3JhcFN0eWxlID0gY29tcHV0ZWQ8UGFydGlhbDxDU1NTdHlsZURlY2xhcmF0aW9uPj4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGVYKCR7cHJvcHMub2Zmc2V0fXB4KWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB3YXRjaChcbiAgICAgICAgICAgICgpID0+IHByb3BzLnNlbGVjdEluZm8sXG4gICAgICAgICAgICAobmV3VmFsdWU6IElTZWxlY3RLZXlCYXNlIHwgbnVsbCwgb2xkVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIW5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkS2V5cy52YWx1ZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRLZXlzLnZhbHVlID0gY2FsY1NlbGVjdEtleShuZXdWYWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuXG4gICAgICAgIHVzZVRpY2tVcGRhdGUoXG4gICAgICAgICAgICAoKSA9PiBwcm9wcy51cGRhdGVQb3NpdGlvbixcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBfc2VsZWN0ZWRLZXlzID0gdW5yZWYoc2VsZWN0ZWRLZXlzKTtcblxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBwb3NpdGlvbiB4IG9mIHNlbGVjdGVkIGtleXNcbiAgICAgICAgICAgICAgICBpZiAoX3NlbGVjdGVkS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIF9zZWxlY3RlZEtleXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleS54ID0gZ3JpZEN0cmwuZnJhbWVUb0NhbnZhcyhrZXkuZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcblxuICAgICAgICBmdW5jdGlvbiBnZXRGcmFtZUtleShrZXlmcmFtZTogSUtleUZyYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7a2V5ZnJhbWUuZnJhbWV9X18ke2tleWZyYW1lLnByb3B9YDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBxdWVyeUtleVN0eWxlKHg6IG51bWJlcik6IFBhcnRpYWw8Q1NTU3R5bGVEZWNsYXJhdGlvbj4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGVYKCR7TnVtYmVyLmlzRmluaXRlKHgpID8geCA6IDB9cHgpIHRyYW5zbGF0ZVgoLTUwJSkgcm90YXRlKDQ1ZGVnKWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29weUtleWZyYW1lKGZyYW1lOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleWZyYW1lID0gcHJvcHMua2V5RnJhbWVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uZnJhbWUgPT09IGZyYW1lKTtcbiAgICAgICAgICAgIGlmICgha2V5ZnJhbWUgfHwga2V5ZnJhbWUuY3VydmUgPT0gbnVsbCB8fCBrZXlmcmFtZS5kdW1wID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHNuYXBzaG90OiBJQ29weUF1eEtleVNuYXBzaG90ID0ge1xuICAgICAgICAgICAgICAgIGNsaXA6IGJhc2VTdG9yZS5jdXJyZW50Q2xpcCxcbiAgICAgICAgICAgICAgICBuYW1lOiBwcm9wcy5uYW1lLFxuICAgICAgICAgICAgICAgIGZyYW1lOiBrZXlmcmFtZS5mcmFtZSxcbiAgICAgICAgICAgICAgICBjdXJ2ZTogY2xvbmVEZWVwKGtleWZyYW1lLmN1cnZlKSxcbiAgICAgICAgICAgICAgICBkdW1wOiBjbG9uZURlZXAoa2V5ZnJhbWUuZHVtcCksXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBhdXhDdXJ2ZVN0b3JlLnNldENvcHlLZXlmcmFtZShzbmFwc2hvdCk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBmdW5jdGlvbiBwYXN0ZUtleWZyYW1lKGRlc3RGcmFtZTogbnVtYmVyKSB7XG4gICAgICAgICAgICBjb25zdCBzbmFwID0gYXV4Q3VydmVTdG9yZS5jb3B5S2V5ZnJhbWVTbmFwO1xuICAgICAgICAgICAgaWYgKHNuYXAgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRlc3REYXRhID0ge1xuICAgICAgICAgICAgICAgIC4uLnNuYXAuY3VydmUsXG4gICAgICAgICAgICAgICAgbmV3VmFsdWU6IHNuYXAuZHVtcC52YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9uQ3RybC5jb3B5QXV4S2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc25hcC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBmcmFtZTogc25hcC5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGVzdERhdGEsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb3BzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lOiBkZXN0RnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGRlc3REYXRhLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRklYTUU6IOWPguiAgyBwcmV2aWV3LXJvdyDnmoTkuLTml7bop6PlhrPmlrnmoYjjgILpgb/lhY3lj7PplK7oj5zljZXml7bop6blj5Hmi5bmi71cbiAgICAgICAgZnVuY3Rpb24gcmVzZXRHcmlkRHJhZ2dpbmcoKSB7XG4gICAgICAgICAgICBGbGFncy5tb3VzZURvd25OYW1lID0gJyc7XG4gICAgICAgICAgICBGbGFncy5zdGFydERyYWdHcmlkSW5mbyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBrZXkgaXRlbSBldmVudHNcbiAgICAgICAgZnVuY3Rpb24gb25LZXlDb250ZXh0bWVudShlOiBNb3VzZUV2ZW50LCBpbmRleDogbnVtYmVyKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICByZXNldEdyaWREcmFnZ2luZygpO1xuXG4gICAgICAgICAgICBjb25zdCBwb3BNZW51czogRWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtW10gPSBnZXRLZXlNZW51KGluZGV4KTtcblxuICAgICAgICAgICAgLy8gaW5zZXJ0IGZyYW1lIGluZGljYXRvciBpbiBjb250ZXh0bWVudVxuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEgJiYgaW5kZXggPD0gcHJvcHMua2V5RnJhbWVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlmcmFtZSA9IHByb3BzLmtleUZyYW1lc1tpbmRleF07XG4gICAgICAgICAgICAgICAgcG9wTWVudXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBgRnJhbWU6ICR7a2V5ZnJhbWUuZnJhbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEVkaXRvci5NZW51LnBvcHVwKHtcbiAgICAgICAgICAgICAgICB4OiBlLnBhZ2VYLFxuICAgICAgICAgICAgICAgIHk6IGUucGFnZVkgKyAxMCwgLy8g6YG/5YWN5oyh5L2P5p+Q5Lqb5YWz6ZSu5bin5oiW6ICF6YCg5oiQ6K+v54K55Ye7XG4gICAgICAgICAgICAgICAgbWVudTogcG9wTWVudXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uS2V5TW91c2Vkb3duKGV2ZW50OiBNb3VzZUV2ZW50LCBpbmRleDogbnVtYmVyKSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gb25seSBoYW5kbGUgbWFpbiBidXR0b24gcHJlc3NlZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgaGFzQ3RybCA9IGNoZWNrQ3RybE9yQ29tbWFuZChldmVudCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGtleWZyYW1lID0gcHJvcHMua2V5RnJhbWVzW2luZGV4XTtcblxuICAgICAgICAgICAgY29uc3QgaW5mbzogSVNlbGVjdEtleUJhc2UgPSB7XG4gICAgICAgICAgICAgICAga2V5ZnJhbWVzOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogcHJvcHMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBrZXlmcmFtZS5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lOiBrZXlmcmFtZS5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IGtleWZyYW1lLngsXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZTogMCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIGN0cmw6IGhhc0N0cmwsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgICAgICAgIG9mZnNldEZyYW1lOiAwLFxuICAgICAgICAgICAgICAgIHN0YXJ0WDogZXZlbnQueCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGN0eC5lbWl0KCdzZWxlY3Qta2V5JywgcHJvcHMubmFtZSwgaW5mbyk7XG5cbiAgICAgICAgICAgIGlmIChoYXNDdHJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgRmxhZ3MubW91c2VEb3duTmFtZSA9ICdhdXgta2V5JztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNhbGNTZWxlY3RLZXkoc2VsZWN0SW5mbzogSVNlbGVjdEtleUJhc2UpOiBJS2V5ZnJhbWVEYXRhQmFzZVtdIHtcbiAgICAgICAgICAgIGlmICghc2VsZWN0SW5mbyB8fCAhc2VsZWN0SW5mby5rZXlmcmFtZXMgfHwgIWFuaW1hdGlvbkN0cmwuY2xpcHNEdW1wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBJS2V5ZnJhbWVEYXRhQmFzZVtdID0gW107XG4gICAgICAgICAgICBjb25zdCBmcmFtZXNBZGRlZCA9IG5ldyBTZXQ8bnVtYmVyPigpO1xuXG4gICAgICAgICAgICBjb25zdCByb3dGcmFtZXMgPSBwcm9wcy5rZXlGcmFtZXM7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93RnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm93RnJhbWUgPSByb3dGcmFtZXNbaV07XG4gICAgICAgICAgICAgICAgLy/ljrvph41cbiAgICAgICAgICAgICAgICBpZiAoZnJhbWVzQWRkZWQuaGFzKHJvd0ZyYW1lLmZyYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hvdWxkU2VsZWN0ID0gc2VsZWN0SW5mby5rZXlmcmFtZXMuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5rZXkgPT09IHJvd0ZyYW1lLnByb3AgJiYgcm93RnJhbWUuZnJhbWUgPT09IGl0ZW0ucmF3RnJhbWU7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkU2VsZWN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBzaG91bGRTZWxlY3Qua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWU6IHNob3VsZFNlbGVjdC5mcmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBzaG91bGRTZWxlY3QucmF3RnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBzaG91bGRTZWxlY3QueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldEZyYW1lOiBzaG91bGRTZWxlY3Qub2Zmc2V0RnJhbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBmcmFtZXNBZGRlZC5hZGQoc2hvdWxkU2VsZWN0LmZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmRlYnVnKCdjYWxjIGF1eCBzZWxlY3Qga2V5JywgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRLZXlNZW51KGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgICAgIGxldCBpc0luU2VsZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBtZW51TWFwOiBSZWNvcmQ8UG9wTWVudUl0ZW1UeXBlLCBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW0+ID0gZ2V0UG9wTWVudU1hcChcbiAgICAgICAgICAgICAgICBvbkF1eEtleUNvbnRleHRNZW51cyxcbiAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IGN1cnZlTmFtZSA9IHByb3BzLm5hbWU7XG4gICAgICAgICAgICBjb25zdCB7IGZyYW1lIH0gPSBwcm9wcy5rZXlGcmFtZXNbaW5kZXhdO1xuXG4gICAgICAgICAgICBsZXQgZnJhbWVzID0gW2ZyYW1lXTtcbiAgICAgICAgICAgIC8vIOWIpOaWreaYr+WQpuWcqOmAieS4reWFs+mUruW4p+WGhVxuICAgICAgICAgICAgaWYgKHByb3BzLnNlbGVjdEluZm8gJiYgQXJyYXkuaXNBcnJheShwcm9wcy5zZWxlY3RJbmZvLmtleWZyYW1lcykpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcHJvcHMuc2VsZWN0SW5mby5rZXlmcmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0ua2V5ID09PSBjdXJ2ZU5hbWUgJiYgaXRlbS5mcmFtZSA9PT0gZnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzSW5TZWxlY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzSW5TZWxlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVzID0gcHJvcHMuc2VsZWN0SW5mby5rZXlmcmFtZXMubWFwKChpdGVtKSA9PiBpdGVtLmZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhbPplK7luKfljrvph43lkI7miY3og73kvZzkuLrmmK/lkKbpgInmi6nkuoblpJrkuKrkuI3lkIzkvY3nva7lhbPplK7luKfnmoTliKTmlq3mlrnlvI9cbiAgICAgICAgICAgIGZyYW1lcyA9IEFycmF5LmZyb20obmV3IFNldChmcmFtZXMpKTtcblxuICAgICAgICAgICAgLy8gY29weVxuICAgICAgICAgICAgbWVudU1hcC5jb3B5QXV4S2V5LmVuYWJsZWQgPSBmcmFtZXMubGVuZ3RoID4gMDtcbiAgICAgICAgICAgIG1lbnVNYXAuY29weUF1eEtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZnJhbWVzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb3B5S2V5ZnJhbWUoZnJhbWUpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGF1eEN1cnZlU3RvcmUuY29weUtleWZyYW1lU25hcCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUF1eEtleS5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBtZW51TWFwLnBhc3RlQXV4S2V5LmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwYXN0ZUtleWZyYW1lKGZyYW1lKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5lbWl0KCdwYXN0ZS1rZXknLCBjdXJ2ZU5hbWUsIGZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUF1eEtleS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlbW92ZVxuICAgICAgICAgICAgbWVudU1hcC5yZW1vdmVBdXhLZXkuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBtZW51TWFwLnJlbW92ZUF1eEtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpZiAoIWlzSW5TZWxlY3QpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICBhbmltYXRpb25DdHJsLnJlbW92ZUF1eEtleShjdXJ2ZU5hbWUsIGZyYW1lKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmVtaXQoJ3JlbW92ZS1rZXknLCBjdXJ2ZU5hbWUsIGZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdW5zZWxlY3QgaWYgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzSW5TZWxlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5lbWl0KCdzZWxlY3Qta2V5JywgY3VydmVOYW1lLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QudmFsdWVzKG1lbnVNYXApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcm93IGV2ZW50c1xuICAgICAgICBmdW5jdGlvbiBvblJvd01vdXNlZG93bihlOiBNb3VzZUV2ZW50KSB7XG4gICAgICAgICAgICBjdHguZW1pdCgnc2VsZWN0LWtleScsIHByb3BzLm5hbWUsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUm93Q29udGV4dG1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICByZXNldEdyaWREcmFnZ2luZygpO1xuXG4gICAgICAgICAgICBjb25zdCBmcmFtZSA9IGdyaWRDdHJsLnBhZ2VUb0ZyYW1lKGV2ZW50LngpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5kZWJ1Zygncm93IGNvbnRleHRtZW51JywgW3Byb3BzLm5hbWUsIGZyYW1lXSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHBvcE1lbnVzOiBFZGl0b3IuTWVudS5Db250ZXh0TWVudUl0ZW1bXSA9IGdldFJvd0NvbnRleHRtZW51KGZyYW1lKTtcblxuICAgICAgICAgICAgcG9wTWVudXMucHVzaCh7IC4uLnBvcE1lbnVNYXAuc2VwYXJhdG9yIH0pO1xuICAgICAgICAgICAgcG9wTWVudXMucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IGBmcmFtZTogJHtmcmFtZX1gLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBFZGl0b3IuTWVudS5wb3B1cCh7IG1lbnU6IHBvcE1lbnVzIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Um93Q29udGV4dG1lbnUoZnJhbWU6IG51bWJlcikge1xuICAgICAgICAgICAgY29uc3QgbWVudU1hcDogUmVjb3JkPFBvcE1lbnVJdGVtVHlwZSwgRWRpdG9yLk1lbnUuQ29udGV4dE1lbnVJdGVtPiA9IGdldFBvcE1lbnVNYXAoXG4gICAgICAgICAgICAgICAgb25BdXhSb3dDb250ZXh0TWVudXMsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBjdXJ2ZU5hbWUgPSBwcm9wcy5uYW1lO1xuXG4gICAgICAgICAgICAvLyDngrnlh7vlnKjpnZ7lhbPplK7luKfnqbrnmb3ljLrln59cbiAgICAgICAgICAgIG1lbnVNYXAuY3JlYXRlQXV4S2V5ID0ge1xuICAgICAgICAgICAgICAgIC4uLnBvcE1lbnVNYXAuY3JlYXRlQXV4S2V5LFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgY2xpY2soKSB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbkN0cmwuY3JlYXRlQXV4S2V5KGN1cnZlTmFtZSwgZnJhbWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmVtaXQoJ2NyZWF0ZS1rZXknLCBjdXJ2ZU5hbWUsIGZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChhdXhDdXJ2ZVN0b3JlLmNvcHlLZXlmcmFtZVNuYXAgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG1lbnVNYXAucGFzdGVBdXhLZXkuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbWVudU1hcC5wYXN0ZUF1eEtleS5jbGljayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcGFzdGVLZXlmcmFtZShmcmFtZSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguZW1pdCgncGFzdGUta2V5JywgY3VydmVOYW1lLCBmcmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LnZhbHVlcyhtZW51TWFwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZWxlY3RLZXk6IHNlbGVjdGVkS2V5cyxcbiAgICAgICAgICAgIGVsU3R5bGUsXG4gICAgICAgICAgICB3cmFwU3R5bGUsXG5cbiAgICAgICAgICAgIGdldEtleU1lbnUsXG4gICAgICAgICAgICBxdWVyeUtleVN0eWxlLFxuICAgICAgICAgICAgZ2V0RnJhbWVLZXksXG4gICAgICAgICAgICBvbktleU1vdXNlZG93bixcbiAgICAgICAgICAgIG9uS2V5Q29udGV4dG1lbnUsXG5cbiAgICAgICAgICAgIG9uUm93TW91c2Vkb3duLFxuICAgICAgICAgICAgb25Sb3dDb250ZXh0bWVudSxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxufSk7XG4iXX0=