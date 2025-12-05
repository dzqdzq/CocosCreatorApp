"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuxiliaryCurveFrames = void 0;
const vue_js_1 = require("vue/dist/vue.js");
const lodash_1 = require("lodash");
const ipc_event_1 = require("../../share/ipc-event");
const hooks_1 = require("../hooks");
const directives_1 = require("../directives");
const preview_row_aux_1 = require("./preview-row-aux");
const animation_editor_1 = require("../../share/animation-editor");
const template = /* html */ `
    <div class="auxiliary-curves-frames">
        <div
            class="auxiliary-curves-frames__header content-device property-tools ns-resize"
            @mousedown="onHeaderMousedown"
        >
            <!-- TODO: should use ui-radio-group instead -->
            <div>
                <ui-prop
                    v-if="isPropEditable"
                    type="dump"
                    v-prop-dump="renderDump"
                    @change-dump="onFrameValueChange"
                    @confirm-dump="onFrameValueConfirm"
                ></ui-prop>
            </div>
            <div class="icon-group">
                <ui-icon :active="curveVisible" value="curve" @click="showCurve"></ui-icon>
                <ui-icon :active="!curveVisible" value="slider" @click="hideCurve"></ui-icon>
            </div>
        </div>

        <div
            ref="framesArea"
            name="aux-curves"
            class="auxiliary-curves-frames__content"
            @mousedown.self="onCurveAreaMousedown"
        >
            <div v-show="curveVisible" class="tw-full">
                <ui-curve-editor ref="curveEl" class="tw-block tw-full"></ui-curve-editor>
            </div>

            <div v-show="!curveVisible">
                <PreviewRow
                    v-for="(item, index) in curves"
                    :key="String(index) + '__' + item.displayName"
                    :name="item.displayName"
                    :hidden="false"
                    :key-frames="item.keyframes"
                    :list-index="index"
                    :update-position="$root.updatePosition"
                    :update-frame="$root.updateKeyFrame"
                    :update-select="$root.updateSelectKey"
                    :lock="false"
                    :offset="offset"
                    :select-info="selectedKeyInfo"
                    :scroll="scrollInfo"
                    :param="[]"
                    @select-key="updateSelectKey"
                    @remove-key="onKeyRemove"
                    @paste-key="onKeyPaste"
                    @create-key="onKeyCreate"
                ></PreviewRow>
            </div>
        </div>
    </div>
`;
exports.AuxiliaryCurveFrames = (0, vue_js_1.defineComponent)({
    name: 'AuxiliaryCurveFrames',
    components: {
        PreviewRow: preview_row_aux_1.PreviewRowAux,
    },
    directives: {
        propDump: directives_1.UiPropDump,
    },
    props: {
        offset: {
            type: Number,
            default: 0,
        },
        currentFrame: {
            type: Number,
            default: 0,
        },
    },
    setup(props, ctx) {
        const baseStore = (0, hooks_1.useBaseStore)();
        const auxCurveStore = (0, hooks_1.useAuxCurveStore)();
        const scrollInfo = (0, vue_js_1.ref)({});
        const framesArea = (0, vue_js_1.ref)();
        const currentClip = (0, vue_js_1.computed)(() => baseStore.currentClip);
        const areaSize = (0, hooks_1.useElementSize)(framesArea);
        const { curveEl, visible: curveVisible, show: showCurve, hide: hideCurve, } = (0, hooks_1.useAuxCurveEditor)({
            currentClip: currentClip,
            size: areaSize,
        });
        const curves = (0, vue_js_1.computed)(() => {
            return auxCurveStore.curves;
        });
        const selectedCurveName = (0, vue_js_1.toRef)(auxCurveStore, 'selectedCurveName');
        const selectedKeyInfo = (0, vue_js_1.toRef)(auxCurveStore, 'selectKeyInfo');
        const keyframeMap = (0, vue_js_1.computed)(() => {
            return auxCurveStore.curveNameMap;
        });
        // dump editing
        const { isEditable: isPropEditable, renderDump, update: updateDump, reset: resetDump } = useFrameDump();
        // dump change 的处理
        const onFrameValueChange = (e) => {
            const val = e.target?.dump?.value;
            if (!isPropEditable.value || !Number.isFinite(val)) {
                return;
            }
            const customData = {
                newValue: val,
            };
            // 参考之前的实现，通过 createKey 去覆盖已存在的 key
            (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), selectedCurveName.value, props.currentFrame, customData), {
                recordUndo: false,
            });
        };
        // dump confirm 的处理
        const onFrameValueConfirm = (e) => {
            const val = e.target?.dump?.value;
            if (!isPropEditable.value || !Number.isFinite(val)) {
                return;
            }
            const customData = {
                newValue: val,
            };
            (0, ipc_event_1.IApplyOperation)((0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), selectedCurveName.value, props.currentFrame, customData));
        };
        (0, vue_js_1.watch)(currentClip, () => {
            auxCurveStore.reset();
        });
        // 三者任一发生变化，都需要刷新 dump 数据
        (0, vue_js_1.watch)(() => [
            (0, vue_js_1.unref)(currentClip),
            selectedCurveName.value,
            // TODO: use local frame data to support `props.currentFrame` & Selected frame
            props.currentFrame,
        ], async ([clipId, curveName, currentFrame], _, onCleanup) => {
            updateDump(clipId, curveName, currentFrame);
        });
        // 用于强制刷新 dump 数据。
        // FIXME: 使用事件监听，或者把整套逻辑搬到 store 里面去
        (0, vue_js_1.watch)(() => auxCurveStore.selectedFrameDumpRenderKey, () => {
            updateDump((0, vue_js_1.unref)(currentClip), selectedCurveName.value, props.currentFrame);
        });
        // header resize
        const onHeaderMousedown = (event) => {
            animation_editor_1.animationEditor.onStartResize(event, 'auxCurve');
        };
        const updateSelectKey = (name, info) => {
            selectedCurveName.value = name;
            auxCurveStore.selectKeyInfo = info;
        };
        const onKeyRemove = (name, frame) => {
            // 是当前选中的曲线，需要刷新一次 dump 数据。（需要重新计算该点值
            // TODO: 理论上有需要刷新 dump 的情况有
            // 1. 删除的帧为当前帧的前一个、下一个关键帧时（当前帧位于两个关键帧之间）才需要重新计算
            // 2. 删除帧为当前帧
            if (name === selectedCurveName.value) {
                updateDump((0, vue_js_1.unref)(currentClip), selectedCurveName.value, frame);
            }
        };
        const onKeyPaste = (name, frame) => {
            if (name === selectedCurveName.value) {
                updateDump((0, vue_js_1.unref)(currentClip), selectedCurveName.value, frame);
            }
        };
        const onKeyCreate = (name, frame) => {
            if (name === selectedCurveName.value) {
                updateDump((0, vue_js_1.unref)(currentClip), selectedCurveName.value, frame);
            }
        };
        const onCurveAreaMousedown = (event) => {
            if (curveVisible.value) {
                return;
            }
            // 关键帧显示模式下，在空白区域点击时，清空辅助曲线的选中数据
            updateSelectKey('', null);
        };
        return {
            framesArea,
            curveEl,
            curveVisible,
            showCurve,
            hideCurve,
            scrollInfo,
            curves,
            selectedKeyInfo,
            keyframeMap,
            renderDump,
            isPropEditable,
            onFrameValueChange,
            onFrameValueConfirm,
            updateSelectKey,
            onKeyRemove,
            onKeyPaste,
            onKeyCreate,
            onHeaderMousedown,
            onCurveAreaMousedown,
        };
    },
    template: template,
});
// TODO: 考虑整合到 store 中，使得更新操作可以在其它地方触发
function useFrameDump() {
    const zeroTick = -1;
    const auxCurveStore = (0, hooks_1.useAuxCurveStore)();
    //
    const lock = (0, vue_js_1.ref)(zeroTick);
    // dump editing
    const renderDump = (0, vue_js_1.computed)({
        get: () => {
            return auxCurveStore.selectedFrameDump;
        },
        set: (val) => {
            auxCurveStore.selectedFrameDump = val;
        },
    });
    const isEditable = (0, vue_js_1.computed)(() => {
        return renderDump.value != null;
    });
    // TODO: 是否不应该提供参数？直接由 hook 参数绑定（或直接绑定到 store 的对应值
    const update = async (clipId, curveName, currentFrame) => {
        if (curveName === '' || clipId === '') {
            reset();
            return;
        }
        const thisTick = Date.now();
        lock.value = thisTick;
        const dump = await (0, ipc_event_1.getAuxCurveValueAtFrame)(clipId, curveName, currentFrame);
        if (lock.value !== thisTick) {
            return;
        }
        if ((0, lodash_1.isPlainObject)(dump)) {
            renderDump.value = {
                ...dump,
                // FIXME: 手动给 ui-prop 构造一个 label
                displayName: 'Value',
            };
        }
        else {
            renderDump.value = dump;
        }
    };
    const reset = () => {
        renderDump.value = null;
    };
    return {
        renderDump,
        isEditable,
        update,
        reset,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5LWN1cnZlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NvdXJjZS9wYW5lbC92bS9jb21wb25lbnRzL2F1eGlsaWFyeS1jdXJ2ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNENBYXlCO0FBQ3pCLG1DQUF1QztBQUd2QyxxREFBK0Y7QUFFL0Ysb0NBQTZGO0FBQzdGLDhDQUE2RDtBQUM3RCx1REFBa0Q7QUFDbEQsbUVBQStEO0FBRS9ELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3RDNCLENBQUM7QUFFVyxRQUFBLG9CQUFvQixHQUFHLElBQUEsd0JBQWUsRUFBQztJQUNoRCxJQUFJLEVBQUUsc0JBQXNCO0lBQzVCLFVBQVUsRUFBRTtRQUNSLFVBQVUsRUFBRSwrQkFBYTtLQUM1QjtJQUNELFVBQVUsRUFBRTtRQUNSLFFBQVEsRUFBRSx1QkFBVTtLQUNIO0lBQ3JCLEtBQUssRUFBRTtRQUNILE1BQU0sRUFBRTtZQUNKLElBQUksRUFBRSxNQUFNO1lBQ1osT0FBTyxFQUFFLENBQUM7U0FDYjtRQUNELFlBQVksRUFBRTtZQUNWLElBQUksRUFBRSxNQUFNO1lBQ1osT0FBTyxFQUFFLENBQUM7U0FDYjtLQUNKO0lBQ0QsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHO1FBQ1osTUFBTSxTQUFTLEdBQUcsSUFBQSxvQkFBWSxHQUFFLENBQUM7UUFDakMsTUFBTSxhQUFhLEdBQUcsSUFBQSx3QkFBZ0IsR0FBRSxDQUFDO1FBRXpDLE1BQU0sVUFBVSxHQUFHLElBQUEsWUFBRyxFQUFzQixFQUFFLENBQUMsQ0FBQztRQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFBLFlBQUcsR0FBZSxDQUFDO1FBQ3RDLE1BQU0sV0FBVyxHQUFHLElBQUEsaUJBQVEsRUFBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMs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Q0FBQztTQUMzQjtJQUNMLENBQUMsQ0FBQztJQUVGLE1BQU0sS0FBSyxHQUFHLEdBQUcsRUFBRTtRQUNmLFVBQVUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUMsQ0FBQztJQUVGLE9BQU87UUFDSCxVQUFVO1FBQ1YsVUFBVTtRQUVWLE1BQU07UUFDTixLQUFLO0tBQ1IsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIGNvbXB1dGVkLFxuICAgIHJlZixcbiAgICB3YXRjaCxcbiAgICBkZWZpbmVDb21wb25lbnQsXG4gICAgb25Nb3VudGVkLFxuICAgIG9uVW5tb3VudGVkLFxuICAgIFJlZixcbiAgICBQcm9wVHlwZSxcbiAgICB1bnJlZixcbiAgICBuZXh0VGljayxcbiAgICB3YXRjaEVmZmVjdCxcbiAgICB0b1JlZixcbn0gZnJvbSAndnVlL2Rpc3QvdnVlLmpzJztcbmltcG9ydCB7IGlzUGxhaW5PYmplY3QgfSBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgeyBJUHJvcEN1cnZlRHVtcERhdGEsIElTZWxlY3RLZXlCYXNlLCBIVE1MQ3VzdG9tRWxlbWVudCwgSUN1cnZlS2V5SW5mb3MgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5pbXBvcnQgeyBJQXBwbHlPcGVyYXRpb24sIGNyZWF0ZUF1eEtleSwgZ2V0QXV4Q3VydmVWYWx1ZUF0RnJhbWUgfSBmcm9tICcuLi8uLi9zaGFyZS9pcGMtZXZlbnQnO1xuXG5pbXBvcnQgeyB1c2VBdXhDdXJ2ZVN0b3JlLCB1c2VBdXhDdXJ2ZUVkaXRvciwgdXNlRWxlbWVudFNpemUsIHVzZUJhc2VTdG9yZSB9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7IExlZ2FjeURpcmVjdGl2ZXMsIFVpUHJvcER1bXAgfSBmcm9tICcuLi9kaXJlY3RpdmVzJztcbmltcG9ydCB7IFByZXZpZXdSb3dBdXggfSBmcm9tICcuL3ByZXZpZXctcm93LWF1eCc7XG5pbXBvcnQgeyBhbmltYXRpb25FZGl0b3IgfSBmcm9tICcuLi8uLi9zaGFyZS9hbmltYXRpb24tZWRpdG9yJztcblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbiAgICA8ZGl2IGNsYXNzPVwiYXV4aWxpYXJ5LWN1cnZlcy1mcmFtZXNcIj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3M9XCJhdXhpbGlhcnktY3VydmVzLWZyYW1lc19faGVhZGVyIGNvbnRlbnQtZGV2aWNlIHByb3BlcnR5LXRvb2xzIG5zLXJlc2l6ZVwiXG4gICAgICAgICAgICBAbW91c2Vkb3duPVwib25IZWFkZXJNb3VzZWRvd25cIlxuICAgICAgICA+XG4gICAgICAgICAgICA8IS0tIFRPRE86IHNob3VsZCB1c2UgdWktcmFkaW8tZ3JvdXAgaW5zdGVhZCAtLT5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPHVpLXByb3BcbiAgICAgICAgICAgICAgICAgICAgdi1pZj1cImlzUHJvcEVkaXRhYmxlXCJcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImR1bXBcIlxuICAgICAgICAgICAgICAgICAgICB2LXByb3AtZHVtcD1cInJlbmRlckR1bXBcIlxuICAgICAgICAgICAgICAgICAgICBAY2hhbmdlLWR1bXA9XCJvbkZyYW1lVmFsdWVDaGFuZ2VcIlxuICAgICAgICAgICAgICAgICAgICBAY29uZmlybS1kdW1wPVwib25GcmFtZVZhbHVlQ29uZmlybVwiXG4gICAgICAgICAgICAgICAgPjwvdWktcHJvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImljb24tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICA8dWktaWNvbiA6YWN0aXZlPVwiY3VydmVWaXNpYmxlXCIgdmFsdWU9XCJjdXJ2ZVwiIEBjbGljaz1cInNob3dDdXJ2ZVwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgICAgICA8dWktaWNvbiA6YWN0aXZlPVwiIWN1cnZlVmlzaWJsZVwiIHZhbHVlPVwic2xpZGVyXCIgQGNsaWNrPVwiaGlkZUN1cnZlXCI+PC91aS1pY29uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXZcbiAgICAgICAgICAgIHJlZj1cImZyYW1lc0FyZWFcIlxuICAgICAgICAgICAgbmFtZT1cImF1eC1jdXJ2ZXNcIlxuICAgICAgICAgICAgY2xhc3M9XCJhdXhpbGlhcnktY3VydmVzLWZyYW1lc19fY29udGVudFwiXG4gICAgICAgICAgICBAbW91c2Vkb3duLnNlbGY9XCJvbkN1cnZlQXJlYU1vdXNlZG93blwiXG4gICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgdi1zaG93PVwiY3VydmVWaXNpYmxlXCIgY2xhc3M9XCJ0dy1mdWxsXCI+XG4gICAgICAgICAgICAgICAgPHVpLWN1cnZlLWVkaXRvciByZWY9XCJjdXJ2ZUVsXCIgY2xhc3M9XCJ0dy1ibG9jayB0dy1mdWxsXCI+PC91aS1jdXJ2ZS1lZGl0b3I+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiB2LXNob3c9XCIhY3VydmVWaXNpYmxlXCI+XG4gICAgICAgICAgICAgICAgPFByZXZpZXdSb3dcbiAgICAgICAgICAgICAgICAgICAgdi1mb3I9XCIoaXRlbSwgaW5kZXgpIGluIGN1cnZlc1wiXG4gICAgICAgICAgICAgICAgICAgIDprZXk9XCJTdHJpbmcoaW5kZXgpICsgJ19fJyArIGl0ZW0uZGlzcGxheU5hbWVcIlxuICAgICAgICAgICAgICAgICAgICA6bmFtZT1cIml0ZW0uZGlzcGxheU5hbWVcIlxuICAgICAgICAgICAgICAgICAgICA6aGlkZGVuPVwiZmFsc2VcIlxuICAgICAgICAgICAgICAgICAgICA6a2V5LWZyYW1lcz1cIml0ZW0ua2V5ZnJhbWVzXCJcbiAgICAgICAgICAgICAgICAgICAgOmxpc3QtaW5kZXg9XCJpbmRleFwiXG4gICAgICAgICAgICAgICAgICAgIDp1cGRhdGUtcG9zaXRpb249XCIkcm9vdC51cGRhdGVQb3NpdGlvblwiXG4gICAgICAgICAgICAgICAgICAgIDp1cGRhdGUtZnJhbWU9XCIkcm9vdC51cGRhdGVLZXlGcmFtZVwiXG4gICAgICAgICAgICAgICAgICAgIDp1cGRhdGUtc2VsZWN0PVwiJHJvb3QudXBkYXRlU2VsZWN0S2V5XCJcbiAgICAgICAgICAgICAgICAgICAgOmxvY2s9XCJmYWxzZVwiXG4gICAgICAgICAgICAgICAgICAgIDpvZmZzZXQ9XCJvZmZzZXRcIlxuICAgICAgICAgICAgICAgICAgICA6c2VsZWN0LWluZm89XCJzZWxlY3RlZEtleUluZm9cIlxuICAgICAgICAgICAgICAgICAgICA6c2Nyb2xsPVwic2Nyb2xsSW5mb1wiXG4gICAgICAgICAgICAgICAgICAgIDpwYXJhbT1cIltdXCJcbiAgICAgICAgICAgICAgICAgICAgQHNlbGVjdC1rZXk9XCJ1cGRhdGVTZWxlY3RLZXlcIlxuICAgICAgICAgICAgICAgICAgICBAcmVtb3ZlLWtleT1cIm9uS2V5UmVtb3ZlXCJcbiAgICAgICAgICAgICAgICAgICAgQHBhc3RlLWtleT1cIm9uS2V5UGFzdGVcIlxuICAgICAgICAgICAgICAgICAgICBAY3JlYXRlLWtleT1cIm9uS2V5Q3JlYXRlXCJcbiAgICAgICAgICAgICAgICA+PC9QcmV2aWV3Um93PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuYDtcblxuZXhwb3J0IGNvbnN0IEF1eGlsaWFyeUN1cnZlRnJhbWVzID0gZGVmaW5lQ29tcG9uZW50KHtcbiAgICBuYW1lOiAnQXV4aWxpYXJ5Q3VydmVGcmFtZXMnLFxuICAgIGNvbXBvbmVudHM6IHtcbiAgICAgICAgUHJldmlld1JvdzogUHJldmlld1Jvd0F1eCxcbiAgICB9LFxuICAgIGRpcmVjdGl2ZXM6IHtcbiAgICAgICAgcHJvcER1bXA6IFVpUHJvcER1bXAsXG4gICAgfSBhcyBMZWdhY3lEaXJlY3RpdmVzLFxuICAgIHByb3BzOiB7XG4gICAgICAgIG9mZnNldDoge1xuICAgICAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgfSxcbiAgICAgICAgY3VycmVudEZyYW1lOiB7XG4gICAgICAgICAgICB0eXBlOiBOdW1iZXIsXG4gICAgICAgICAgICBkZWZhdWx0OiAwLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgc2V0dXAocHJvcHMsIGN0eCkge1xuICAgICAgICBjb25zdCBiYXNlU3RvcmUgPSB1c2VCYXNlU3RvcmUoKTtcbiAgICAgICAgY29uc3QgYXV4Q3VydmVTdG9yZSA9IHVzZUF1eEN1cnZlU3RvcmUoKTtcblxuICAgICAgICBjb25zdCBzY3JvbGxJbmZvID0gcmVmPFJlY29yZDxzdHJpbmcsIGFueT4+KHt9KTtcbiAgICAgICAgY29uc3QgZnJhbWVzQXJlYSA9IHJlZjxIVE1MRWxlbWVudD4oKTtcbiAgICAgICAgY29uc3QgY3VycmVudENsaXAgPSBjb21wdXRlZCgoKSA9PiBiYXNlU3RvcmUuY3VycmVudENsaXApO1xuXG4gICAgICAgIGNvbnN0IGFyZWFTaXplID0gdXNlRWxlbWVudFNpemUoZnJhbWVzQXJlYSk7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGN1cnZlRWwsXG4gICAgICAgICAgICB2aXNpYmxlOiBjdXJ2ZVZpc2libGUsXG4gICAgICAgICAgICBzaG93OiBzaG93Q3VydmUsXG4gICAgICAgICAgICBoaWRlOiBoaWRlQ3VydmUsXG4gICAgICAgIH0gPSB1c2VBdXhDdXJ2ZUVkaXRvcih7XG4gICAgICAgICAgICBjdXJyZW50Q2xpcDogY3VycmVudENsaXAsXG4gICAgICAgICAgICBzaXplOiBhcmVhU2l6ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY3VydmVzID0gY29tcHV0ZWQ8SVByb3BDdXJ2ZUR1bXBEYXRhW10+KCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhdXhDdXJ2ZVN0b3JlLmN1cnZlcztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRDdXJ2ZU5hbWUgPSB0b1JlZihhdXhDdXJ2ZVN0b3JlLCAnc2VsZWN0ZWRDdXJ2ZU5hbWUnKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRLZXlJbmZvID0gdG9SZWYoYXV4Q3VydmVTdG9yZSwgJ3NlbGVjdEtleUluZm8nKTtcbiAgICAgICAgY29uc3Qga2V5ZnJhbWVNYXAgPSBjb21wdXRlZCgoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXV4Q3VydmVTdG9yZS5jdXJ2ZU5hbWVNYXA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGR1bXAgZWRpdGluZ1xuICAgICAgICBjb25zdCB7IGlzRWRpdGFibGU6IGlzUHJvcEVkaXRhYmxlLCByZW5kZXJEdW1wLCB1cGRhdGU6IHVwZGF0ZUR1bXAsIHJlc2V0OiByZXNldER1bXAgfSA9IHVzZUZyYW1lRHVtcCgpO1xuICAgICAgICAvLyBkdW1wIGNoYW5nZSDnmoTlpITnkIZcbiAgICAgICAgY29uc3Qgb25GcmFtZVZhbHVlQ2hhbmdlID0gKGU6IEN1c3RvbUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSAoZS50YXJnZXQgYXMgYW55KT8uZHVtcD8udmFsdWU7XG5cbiAgICAgICAgICAgIGlmICghaXNQcm9wRWRpdGFibGUudmFsdWUgfHwgIU51bWJlci5pc0Zpbml0ZSh2YWwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjdXN0b21EYXRhID0ge1xuICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiB2YWwsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyDlj4LogIPkuYvliY3nmoTlrp7njrDvvIzpgJrov4cgY3JlYXRlS2V5IOWOu+imhuebluW3suWtmOWcqOeahCBrZXlcbiAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihjcmVhdGVBdXhLZXkodW5yZWYoY3VycmVudENsaXApLCBzZWxlY3RlZEN1cnZlTmFtZS52YWx1ZSwgcHJvcHMuY3VycmVudEZyYW1lLCBjdXN0b21EYXRhKSwge1xuICAgICAgICAgICAgICAgIHJlY29yZFVuZG86IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIGR1bXAgY29uZmlybSDnmoTlpITnkIZcbiAgICAgICAgY29uc3Qgb25GcmFtZVZhbHVlQ29uZmlybSA9IChlOiBDdXN0b21FdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsID0gKGUudGFyZ2V0IGFzIGFueSk/LmR1bXA/LnZhbHVlO1xuXG4gICAgICAgICAgICBpZiAoIWlzUHJvcEVkaXRhYmxlLnZhbHVlIHx8ICFOdW1iZXIuaXNGaW5pdGUodmFsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3VzdG9tRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZTogdmFsLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKGNyZWF0ZUF1eEtleSh1bnJlZihjdXJyZW50Q2xpcCksIHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlLCBwcm9wcy5jdXJyZW50RnJhbWUsIGN1c3RvbURhdGEpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB3YXRjaChjdXJyZW50Q2xpcCwgKCkgPT4ge1xuICAgICAgICAgICAgYXV4Q3VydmVTdG9yZS5yZXNldCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDkuInogIXku7vkuIDlj5HnlJ/lj5jljJbvvIzpg73pnIDopoHliLfmlrAgZHVtcCDmlbDmja5cbiAgICAgICAgd2F0Y2goXG4gICAgICAgICAgICAoKSA9PlxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgdW5yZWYoY3VycmVudENsaXApLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZEN1cnZlTmFtZS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogdXNlIGxvY2FsIGZyYW1lIGRhdGEgdG8gc3VwcG9ydCBgcHJvcHMuY3VycmVudEZyYW1lYCAmIFNlbGVjdGVkIGZyYW1lXG4gICAgICAgICAgICAgICAgICAgIHByb3BzLmN1cnJlbnRGcmFtZSxcbiAgICAgICAgICAgICAgICBdIGFzIGNvbnN0LFxuICAgICAgICAgICAgYXN5bmMgKFtjbGlwSWQsIGN1cnZlTmFtZSwgY3VycmVudEZyYW1lXSwgXywgb25DbGVhbnVwKSA9PiB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRHVtcChjbGlwSWQsIGN1cnZlTmFtZSwgY3VycmVudEZyYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICAgIC8vIOeUqOS6juW8uuWItuWIt+aWsCBkdW1wIOaVsOaNruOAglxuICAgICAgICAvLyBGSVhNRTog5L2/55So5LqL5Lu255uR5ZCs77yM5oiW6ICF5oqK5pW05aWX6YC76L6R5pCs5YiwIHN0b3JlIOmHjOmdouWOu1xuICAgICAgICB3YXRjaChcbiAgICAgICAgICAgICgpID0+IGF1eEN1cnZlU3RvcmUuc2VsZWN0ZWRGcmFtZUR1bXBSZW5kZXJLZXksXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRHVtcCh1bnJlZihjdXJyZW50Q2xpcCksIHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlLCBwcm9wcy5jdXJyZW50RnJhbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBoZWFkZXIgcmVzaXplXG4gICAgICAgIGNvbnN0IG9uSGVhZGVyTW91c2Vkb3duID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBhbmltYXRpb25FZGl0b3Iub25TdGFydFJlc2l6ZShldmVudCwgJ2F1eEN1cnZlJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdXBkYXRlU2VsZWN0S2V5ID0gKG5hbWU6IHN0cmluZywgaW5mbzogSVNlbGVjdEtleUJhc2UgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICBzZWxlY3RlZEN1cnZlTmFtZS52YWx1ZSA9IG5hbWU7XG4gICAgICAgICAgICBhdXhDdXJ2ZVN0b3JlLnNlbGVjdEtleUluZm8gPSBpbmZvO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9uS2V5UmVtb3ZlID0gKG5hbWU6IHN0cmluZywgZnJhbWU6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgLy8g5piv5b2T5YmN6YCJ5Lit55qE5puy57q/77yM6ZyA6KaB5Yi35paw5LiA5qyhIGR1bXAg5pWw5o2u44CC77yI6ZyA6KaB6YeN5paw6K6h566X6K+l54K55YC8XG4gICAgICAgICAgICAvLyBUT0RPOiDnkIborrrkuIrmnInpnIDopoHliLfmlrAgZHVtcCDnmoTmg4XlhrXmnIlcbiAgICAgICAgICAgIC8vIDEuIOWIoOmZpOeahOW4p+S4uuW9k+WJjeW4p+eahOWJjeS4gOS4quOAgeS4i+S4gOS4quWFs+mUruW4p+aXtu+8iOW9k+WJjeW4p+S9jeS6juS4pOS4quWFs+mUruW4p+S5i+mXtO+8ieaJjemcgOimgemHjeaWsOiuoeeul1xuICAgICAgICAgICAgLy8gMi4g5Yig6Zmk5bin5Li65b2T5YmN5binXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gc2VsZWN0ZWRDdXJ2ZU5hbWUudmFsdWUpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVEdW1wKHVucmVmKGN1cnJlbnRDbGlwKSwgc2VsZWN0ZWRDdXJ2ZU5hbWUudmFsdWUsIGZyYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvbktleVBhc3RlID0gKG5hbWU6IHN0cmluZywgZnJhbWU6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRHVtcCh1bnJlZihjdXJyZW50Q2xpcCksIHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlLCBmcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb25LZXlDcmVhdGUgPSAobmFtZTogc3RyaW5nLCBmcmFtZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gc2VsZWN0ZWRDdXJ2ZU5hbWUudmFsdWUpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVEdW1wKHVucmVmKGN1cnJlbnRDbGlwKSwgc2VsZWN0ZWRDdXJ2ZU5hbWUudmFsdWUsIGZyYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvbkN1cnZlQXJlYU1vdXNlZG93biA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGN1cnZlVmlzaWJsZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWFs+mUruW4p+aYvuekuuaooeW8j+S4i++8jOWcqOepuueZveWMuuWfn+eCueWHu+aXtu+8jOa4heepuui+heWKqeabsue6v+eahOmAieS4reaVsOaNrlxuICAgICAgICAgICAgdXBkYXRlU2VsZWN0S2V5KCcnLCBudWxsKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJhbWVzQXJlYSxcbiAgICAgICAgICAgIGN1cnZlRWwsXG4gICAgICAgICAgICBjdXJ2ZVZpc2libGUsXG4gICAgICAgICAgICBzaG93Q3VydmUsXG4gICAgICAgICAgICBoaWRlQ3VydmUsXG4gICAgICAgICAgICBzY3JvbGxJbmZvLFxuXG4gICAgICAgICAgICBjdXJ2ZXMsXG4gICAgICAgICAgICBzZWxlY3RlZEtleUluZm8sXG4gICAgICAgICAgICBrZXlmcmFtZU1hcCxcblxuICAgICAgICAgICAgcmVuZGVyRHVtcCxcbiAgICAgICAgICAgIGlzUHJvcEVkaXRhYmxlLFxuICAgICAgICAgICAgb25GcmFtZVZhbHVlQ2hhbmdlLFxuICAgICAgICAgICAgb25GcmFtZVZhbHVlQ29uZmlybSxcblxuICAgICAgICAgICAgdXBkYXRlU2VsZWN0S2V5LFxuICAgICAgICAgICAgb25LZXlSZW1vdmUsXG4gICAgICAgICAgICBvbktleVBhc3RlLFxuICAgICAgICAgICAgb25LZXlDcmVhdGUsXG5cbiAgICAgICAgICAgIG9uSGVhZGVyTW91c2Vkb3duLFxuICAgICAgICAgICAgb25DdXJ2ZUFyZWFNb3VzZWRvd24sXG4gICAgICAgIH07XG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG59KTtcblxuLy8gVE9ETzog6ICD6JmR5pW05ZCI5YiwIHN0b3JlIOS4re+8jOS9v+W+l+abtOaWsOaTjeS9nOWPr+S7peWcqOWFtuWug+WcsOaWueinpuWPkVxuZnVuY3Rpb24gdXNlRnJhbWVEdW1wKCkge1xuICAgIGNvbnN0IHplcm9UaWNrID0gLTE7XG4gICAgY29uc3QgYXV4Q3VydmVTdG9yZSA9IHVzZUF1eEN1cnZlU3RvcmUoKTtcblxuICAgIC8vXG4gICAgY29uc3QgbG9jayA9IHJlZih6ZXJvVGljayk7XG5cbiAgICAvLyBkdW1wIGVkaXRpbmdcbiAgICBjb25zdCByZW5kZXJEdW1wID0gY29tcHV0ZWQoe1xuICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhdXhDdXJ2ZVN0b3JlLnNlbGVjdGVkRnJhbWVEdW1wO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICh2YWwpID0+IHtcbiAgICAgICAgICAgIGF1eEN1cnZlU3RvcmUuc2VsZWN0ZWRGcmFtZUR1bXAgPSB2YWw7XG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBpc0VkaXRhYmxlID0gY29tcHV0ZWQoKCkgPT4ge1xuICAgICAgICByZXR1cm4gcmVuZGVyRHVtcC52YWx1ZSAhPSBudWxsO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzog5piv5ZCm5LiN5bqU6K+l5o+Q5L6b5Y+C5pWw77yf55u05o6l55SxIGhvb2sg5Y+C5pWw57uR5a6a77yI5oiW55u05o6l57uR5a6a5YiwIHN0b3JlIOeahOWvueW6lOWAvFxuICAgIGNvbnN0IHVwZGF0ZSA9IGFzeW5jIChjbGlwSWQ6IHN0cmluZywgY3VydmVOYW1lOiBzdHJpbmcsIGN1cnJlbnRGcmFtZTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGlmIChjdXJ2ZU5hbWUgPT09ICcnIHx8IGNsaXBJZCA9PT0gJycpIHtcbiAgICAgICAgICAgIHJlc2V0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aGlzVGljayA9IERhdGUubm93KCk7XG4gICAgICAgIGxvY2sudmFsdWUgPSB0aGlzVGljaztcblxuICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgZ2V0QXV4Q3VydmVWYWx1ZUF0RnJhbWUoY2xpcElkLCBjdXJ2ZU5hbWUsIGN1cnJlbnRGcmFtZSk7XG5cbiAgICAgICAgaWYgKGxvY2sudmFsdWUgIT09IHRoaXNUaWNrKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNQbGFpbk9iamVjdChkdW1wKSkge1xuICAgICAgICAgICAgcmVuZGVyRHVtcC52YWx1ZSA9IHtcbiAgICAgICAgICAgICAgICAuLi5kdW1wLFxuICAgICAgICAgICAgICAgIC8vIEZJWE1FOiDmiYvliqjnu5kgdWktcHJvcCDmnoTpgKDkuIDkuKogbGFiZWxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogJ1ZhbHVlJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW5kZXJEdW1wLnZhbHVlID0gZHVtcDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCByZXNldCA9ICgpID0+IHtcbiAgICAgICAgcmVuZGVyRHVtcC52YWx1ZSA9IG51bGw7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlckR1bXAsXG4gICAgICAgIGlzRWRpdGFibGUsXG5cbiAgICAgICAgdXBkYXRlLFxuICAgICAgICByZXNldCxcbiAgICB9O1xufVxuIl19