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
                <ui-curve-editor
                    ref="editor"
                    class="tw-block tw-full"
                    tabindex="0"
                    @transform="onTransform"
                    @focus="onCurveFocus"
                    @blur="onCurveBlur"
                ></ui-curve-editor>
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
        const { visible: curveVisible, show: showCurve, hide: hideCurve, onTransform, getExposedAPI, onBlur: onCurveBlur, onFocus: onCurveFocus, } = (0, hooks_1.useAuxCurveEditor)({
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
        const exposedAPI = getExposedAPI();
        // 重写部分 API 的实现
        const zoomToFit = () => {
            // TODO:
            if (!curveVisible.value) {
                return;
            }
            exposedAPI.zoomToFit();
        };
        const zoomToSelectedKeys = () => {
            if (!curveVisible.value) {
                return;
            }
            exposedAPI.zoomToSelectedKeys();
        };
        return {
            framesArea,
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
            onCurveBlur,
            onCurveFocus,
            onHeaderMousedown,
            onCurveAreaMousedown,
            onTransform,
            // public API & override
            ...getExposedAPI(),
            zoomToFit,
            zoomToSelectedKeys,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5LWN1cnZlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NvdXJjZS9wYW5lbC92bS9jb21wb25lbnRzL2F1eGlsaWFyeS1jdXJ2ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNENBYXlCO0FBQ3pCLG1DQUF1QztBQUd2QyxxREFBK0Y7QUFFL0Ysb0NBQTZGO0FBQzdGLDhDQUE2RDtBQUM3RCx1REFBa0Q7QUFDbEQsbUVBQStEO0FBRS9ELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0QzQixDQUFDO0FBRVcsUUFBQSxvQkFBb0IsR0FBRyxJQUFBLHdCQUFlLEVBQUM7SUFDaEQsSUFBSSxFQUFFLHNCQUFzQjtJQUM1QixVQUFVLEVBQUU7UUFDUixVQUFVLEVBQUUsK0JBQWE7S0FDNUI7SUFDRCxVQUFVLEVBQUU7UUFDUixRQUFRLEVBQUUsdUJBQVU7S0FDSDtJQUNyQixLQUFLLEVBQUU7UUFDSCxNQUFNLEVBQUU7WUFDSixJQUFJLEVBQUUsTUFBTTtZQUNaLE9BQU8sRUFBRSxDQUFDO1NBQ2I7UUFDRCxZQUFZLEVBQUU7WUFDVixJQUFJLEVBQUUsTUFBTTtZQUNaLE9BQU8sRUFBRSxDQUFDO1NBQ2I7S0FDSjtJQUNELEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRztRQUNaLE1BQU0sU0FBUyxHQUFHLElBQUEsb0JBQVksR0FBRSxDQUFDO1FBQ2pDLE1BQU0sYUFBYSxHQUFHLElBQUEsd0JBQWdCLEdBQUUsQ0FBQztRQUV6QyxNQUFNLFVBQVUsR0FBRyxJQUFBLFlBQUcsRUFBc0IsRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxVQUFVLEdBQUcsSUFBQSxZQUFHLEdBQWUsQ0FBQztRQUN0QyxNQUFNLFdBQVcsR0FBRyxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLENBQUMsU0FB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S0FBSyxFQUFFLElBQUksTUFBTSxLQUFLLEVBQUUsRUFBRTtZQUNuQyxLQUFLLEVBQUUsQ0FBQztZQUNSLE9BQU87U0FDVjtRQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztRQUV0QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsbUNBQXVCLEVBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUU1RSxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQ3pCLE9BQU87U0FDVjtRQUVELElBQUksSUFBQSxzQkFBYSxFQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3JCLFVBQVUsQ0FBQyxLQUFLLEdBQUc7Z0JBQ2YsR0FBRyxJQUFJO2dCQUNQLGdDQUFnQztnQkFDaEMsV0FBVyxFQUFFLE9BQU87YUFDdkIsQ0FBQztTQUNMO2FBQU07WUFDSCxVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztTQUMzQjtJQUNMLENBQUMsQ0FBQztJQUVGLE1BQU0sS0FBSyxHQUFHLEdBQUcsRUFBRTtRQUNmLFVBQVUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQzVCLENBQUMsQ0FBQztJQUVGLE9BQU87UUFDSCxVQUFVO1FBQ1YsVUFBVTtRQUVWLE1BQU07UUFDTixLQUFLO0tBQ1IsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIGNvbXB1dGVkLFxuICAgIHJlZixcbiAgICB3YXRjaCxcbiAgICBkZWZpbmVDb21wb25lbnQsXG4gICAgb25Nb3VudGVkLFxuICAgIG9uVW5tb3VudGVkLFxuICAgIFJlZixcbiAgICBQcm9wVHlwZSxcbiAgICB1bnJlZixcbiAgICBuZXh0VGljayxcbiAgICB3YXRjaEVmZmVjdCxcbiAgICB0b1JlZixcbn0gZnJvbSAndnVlL2Rpc3QvdnVlLmpzJztcbmltcG9ydCB7IGlzUGxhaW5PYmplY3QgfSBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgeyBJUHJvcEN1cnZlRHVtcERhdGEsIElTZWxlY3RLZXlCYXNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuaW1wb3J0IHsgSUFwcGx5T3BlcmF0aW9uLCBjcmVhdGVBdXhLZXksIGdldEF1eEN1cnZlVmFsdWVBdEZyYW1lIH0gZnJvbSAnLi4vLi4vc2hhcmUvaXBjLWV2ZW50JztcblxuaW1wb3J0IHsgdXNlQXV4Q3VydmVTdG9yZSwgdXNlQXV4Q3VydmVFZGl0b3IsIHVzZUVsZW1lbnRTaXplLCB1c2VCYXNlU3RvcmUgfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQgeyBMZWdhY3lEaXJlY3RpdmVzLCBVaVByb3BEdW1wIH0gZnJvbSAnLi4vZGlyZWN0aXZlcyc7XG5pbXBvcnQgeyBQcmV2aWV3Um93QXV4IH0gZnJvbSAnLi9wcmV2aWV3LXJvdy1hdXgnO1xuaW1wb3J0IHsgYW5pbWF0aW9uRWRpdG9yIH0gZnJvbSAnLi4vLi4vc2hhcmUvYW5pbWF0aW9uLWVkaXRvcic7XG5cbmNvbnN0IHRlbXBsYXRlID0gLyogaHRtbCAqLyBgXG4gICAgPGRpdiBjbGFzcz1cImF1eGlsaWFyeS1jdXJ2ZXMtZnJhbWVzXCI+XG4gICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzPVwiYXV4aWxpYXJ5LWN1cnZlcy1mcmFtZXNfX2hlYWRlciBjb250ZW50LWRldmljZSBwcm9wZXJ0eS10b29scyBucy1yZXNpemVcIlxuICAgICAgICAgICAgQG1vdXNlZG93bj1cIm9uSGVhZGVyTW91c2Vkb3duXCJcbiAgICAgICAgPlxuICAgICAgICAgICAgPCEtLSBUT0RPOiBzaG91bGQgdXNlIHVpLXJhZGlvLWdyb3VwIGluc3RlYWQgLS0+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIDx1aS1wcm9wXG4gICAgICAgICAgICAgICAgICAgIHYtaWY9XCJpc1Byb3BFZGl0YWJsZVwiXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJkdW1wXCJcbiAgICAgICAgICAgICAgICAgICAgdi1wcm9wLWR1bXA9XCJyZW5kZXJEdW1wXCJcbiAgICAgICAgICAgICAgICAgICAgQGNoYW5nZS1kdW1wPVwib25GcmFtZVZhbHVlQ2hhbmdlXCJcbiAgICAgICAgICAgICAgICAgICAgQGNvbmZpcm0tZHVtcD1cIm9uRnJhbWVWYWx1ZUNvbmZpcm1cIlxuICAgICAgICAgICAgICAgID48L3VpLXByb3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpY29uLWdyb3VwXCI+XG4gICAgICAgICAgICAgICAgPHVpLWljb24gOmFjdGl2ZT1cImN1cnZlVmlzaWJsZVwiIHZhbHVlPVwiY3VydmVcIiBAY2xpY2s9XCJzaG93Q3VydmVcIj48L3VpLWljb24+XG4gICAgICAgICAgICAgICAgPHVpLWljb24gOmFjdGl2ZT1cIiFjdXJ2ZVZpc2libGVcIiB2YWx1ZT1cInNsaWRlclwiIEBjbGljaz1cImhpZGVDdXJ2ZVwiPjwvdWktaWNvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2XG4gICAgICAgICAgICByZWY9XCJmcmFtZXNBcmVhXCJcbiAgICAgICAgICAgIG5hbWU9XCJhdXgtY3VydmVzXCJcbiAgICAgICAgICAgIGNsYXNzPVwiYXV4aWxpYXJ5LWN1cnZlcy1mcmFtZXNfX2NvbnRlbnRcIlxuICAgICAgICAgICAgQG1vdXNlZG93bi5zZWxmPVwib25DdXJ2ZUFyZWFNb3VzZWRvd25cIlxuICAgICAgICA+XG4gICAgICAgICAgICA8ZGl2IHYtc2hvdz1cImN1cnZlVmlzaWJsZVwiIGNsYXNzPVwidHctZnVsbFwiPlxuICAgICAgICAgICAgICAgIDx1aS1jdXJ2ZS1lZGl0b3JcbiAgICAgICAgICAgICAgICAgICAgcmVmPVwiZWRpdG9yXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ0dy1ibG9jayB0dy1mdWxsXCJcbiAgICAgICAgICAgICAgICAgICAgdGFiaW5kZXg9XCIwXCJcbiAgICAgICAgICAgICAgICAgICAgQHRyYW5zZm9ybT1cIm9uVHJhbnNmb3JtXCJcbiAgICAgICAgICAgICAgICAgICAgQGZvY3VzPVwib25DdXJ2ZUZvY3VzXCJcbiAgICAgICAgICAgICAgICAgICAgQGJsdXI9XCJvbkN1cnZlQmx1clwiXG4gICAgICAgICAgICAgICAgPjwvdWktY3VydmUtZWRpdG9yPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgdi1zaG93PVwiIWN1cnZlVmlzaWJsZVwiPlxuICAgICAgICAgICAgICAgIDxQcmV2aWV3Um93XG4gICAgICAgICAgICAgICAgICAgIHYtZm9yPVwiKGl0ZW0sIGluZGV4KSBpbiBjdXJ2ZXNcIlxuICAgICAgICAgICAgICAgICAgICA6a2V5PVwiU3RyaW5nKGluZGV4KSArICdfXycgKyBpdGVtLmRpc3BsYXlOYW1lXCJcbiAgICAgICAgICAgICAgICAgICAgOm5hbWU9XCJpdGVtLmRpc3BsYXlOYW1lXCJcbiAgICAgICAgICAgICAgICAgICAgOmhpZGRlbj1cImZhbHNlXCJcbiAgICAgICAgICAgICAgICAgICAgOmtleS1mcmFtZXM9XCJpdGVtLmtleWZyYW1lc1wiXG4gICAgICAgICAgICAgICAgICAgIDpsaXN0LWluZGV4PVwiaW5kZXhcIlxuICAgICAgICAgICAgICAgICAgICA6dXBkYXRlLXBvc2l0aW9uPVwiJHJvb3QudXBkYXRlUG9zaXRpb25cIlxuICAgICAgICAgICAgICAgICAgICA6dXBkYXRlLWZyYW1lPVwiJHJvb3QudXBkYXRlS2V5RnJhbWVcIlxuICAgICAgICAgICAgICAgICAgICA6dXBkYXRlLXNlbGVjdD1cIiRyb290LnVwZGF0ZVNlbGVjdEtleVwiXG4gICAgICAgICAgICAgICAgICAgIDpsb2NrPVwiZmFsc2VcIlxuICAgICAgICAgICAgICAgICAgICA6b2Zmc2V0PVwib2Zmc2V0XCJcbiAgICAgICAgICAgICAgICAgICAgOnNlbGVjdC1pbmZvPVwic2VsZWN0ZWRLZXlJbmZvXCJcbiAgICAgICAgICAgICAgICAgICAgOnNjcm9sbD1cInNjcm9sbEluZm9cIlxuICAgICAgICAgICAgICAgICAgICA6cGFyYW09XCJbXVwiXG4gICAgICAgICAgICAgICAgICAgIEBzZWxlY3Qta2V5PVwidXBkYXRlU2VsZWN0S2V5XCJcbiAgICAgICAgICAgICAgICAgICAgQHJlbW92ZS1rZXk9XCJvbktleVJlbW92ZVwiXG4gICAgICAgICAgICAgICAgICAgIEBwYXN0ZS1rZXk9XCJvbktleVBhc3RlXCJcbiAgICAgICAgICAgICAgICAgICAgQGNyZWF0ZS1rZXk9XCJvbktleUNyZWF0ZVwiXG4gICAgICAgICAgICAgICAgPjwvUHJldmlld1Jvdz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbmA7XG5cbmV4cG9ydCBjb25zdCBBdXhpbGlhcnlDdXJ2ZUZyYW1lcyA9IGRlZmluZUNvbXBvbmVudCh7XG4gICAgbmFtZTogJ0F1eGlsaWFyeUN1cnZlRnJhbWVzJyxcbiAgICBjb21wb25lbnRzOiB7XG4gICAgICAgIFByZXZpZXdSb3c6IFByZXZpZXdSb3dBdXgsXG4gICAgfSxcbiAgICBkaXJlY3RpdmVzOiB7XG4gICAgICAgIHByb3BEdW1wOiBVaVByb3BEdW1wLFxuICAgIH0gYXMgTGVnYWN5RGlyZWN0aXZlcyxcbiAgICBwcm9wczoge1xuICAgICAgICBvZmZzZXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgICAgIGRlZmF1bHQ6IDAsXG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRGcmFtZToge1xuICAgICAgICAgICAgdHlwZTogTnVtYmVyLFxuICAgICAgICAgICAgZGVmYXVsdDogMCxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHNldHVwKHByb3BzLCBjdHgpIHtcbiAgICAgICAgY29uc3QgYmFzZVN0b3JlID0gdXNlQmFzZVN0b3JlKCk7XG4gICAgICAgIGNvbnN0IGF1eEN1cnZlU3RvcmUgPSB1c2VBdXhDdXJ2ZVN0b3JlKCk7XG5cbiAgICAgICAgY29uc3Qgc2Nyb2xsSW5mbyA9IHJlZjxSZWNvcmQ8c3RyaW5nLCBhbnk+Pih7fSk7XG4gICAgICAgIGNvbnN0IGZyYW1lc0FyZWEgPSByZWY8SFRNTEVsZW1lbnQ+KCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRDbGlwID0gY29tcHV0ZWQoKCkgPT4gYmFzZVN0b3JlLmN1cnJlbnRDbGlwKTtcblxuICAgICAgICBjb25zdCBhcmVhU2l6ZSA9IHVzZUVsZW1lbnRTaXplKGZyYW1lc0FyZWEpO1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICB2aXNpYmxlOiBjdXJ2ZVZpc2libGUsXG4gICAgICAgICAgICBzaG93OiBzaG93Q3VydmUsXG4gICAgICAgICAgICBoaWRlOiBoaWRlQ3VydmUsXG4gICAgICAgICAgICBvblRyYW5zZm9ybSxcbiAgICAgICAgICAgIGdldEV4cG9zZWRBUEksXG4gICAgICAgICAgICBvbkJsdXI6IG9uQ3VydmVCbHVyLFxuICAgICAgICAgICAgb25Gb2N1czogb25DdXJ2ZUZvY3VzLFxuICAgICAgICB9ID0gdXNlQXV4Q3VydmVFZGl0b3Ioe1xuICAgICAgICAgICAgY3VycmVudENsaXA6IGN1cnJlbnRDbGlwLFxuICAgICAgICAgICAgc2l6ZTogYXJlYVNpemUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGN1cnZlcyA9IGNvbXB1dGVkPElQcm9wQ3VydmVEdW1wRGF0YVtdPigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXV4Q3VydmVTdG9yZS5jdXJ2ZXM7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkQ3VydmVOYW1lID0gdG9SZWYoYXV4Q3VydmVTdG9yZSwgJ3NlbGVjdGVkQ3VydmVOYW1lJyk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkS2V5SW5mbyA9IHRvUmVmKGF1eEN1cnZlU3RvcmUsICdzZWxlY3RLZXlJbmZvJyk7XG4gICAgICAgIGNvbnN0IGtleWZyYW1lTWFwID0gY29tcHV0ZWQoKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGF1eEN1cnZlU3RvcmUuY3VydmVOYW1lTWFwO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBkdW1wIGVkaXRpbmdcbiAgICAgICAgY29uc3QgeyBpc0VkaXRhYmxlOiBpc1Byb3BFZGl0YWJsZSwgcmVuZGVyRHVtcCwgdXBkYXRlOiB1cGRhdGVEdW1wLCByZXNldDogcmVzZXREdW1wIH0gPSB1c2VGcmFtZUR1bXAoKTtcbiAgICAgICAgLy8gZHVtcCBjaGFuZ2Ug55qE5aSE55CGXG4gICAgICAgIGNvbnN0IG9uRnJhbWVWYWx1ZUNoYW5nZSA9IChlOiBDdXN0b21FdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsID0gKGUudGFyZ2V0IGFzIGFueSk/LmR1bXA/LnZhbHVlO1xuXG4gICAgICAgICAgICBpZiAoIWlzUHJvcEVkaXRhYmxlLnZhbHVlIHx8ICFOdW1iZXIuaXNGaW5pdGUodmFsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3VzdG9tRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZTogdmFsLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8g5Y+C6ICD5LmL5YmN55qE5a6e546w77yM6YCa6L+HIGNyZWF0ZUtleSDljrvopobnm5blt7LlrZjlnKjnmoQga2V5XG4gICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oY3JlYXRlQXV4S2V5KHVucmVmKGN1cnJlbnRDbGlwKSwgc2VsZWN0ZWRDdXJ2ZU5hbWUudmFsdWUsIHByb3BzLmN1cnJlbnRGcmFtZSwgY3VzdG9tRGF0YSksIHtcbiAgICAgICAgICAgICAgICByZWNvcmRVbmRvOiBmYWxzZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICAvLyBkdW1wIGNvbmZpcm0g55qE5aSE55CGXG4gICAgICAgIGNvbnN0IG9uRnJhbWVWYWx1ZUNvbmZpcm0gPSAoZTogQ3VzdG9tRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IChlLnRhcmdldCBhcyBhbnkpPy5kdW1wPy52YWx1ZTtcblxuICAgICAgICAgICAgaWYgKCFpc1Byb3BFZGl0YWJsZS52YWx1ZSB8fCAhTnVtYmVyLmlzRmluaXRlKHZhbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbURhdGEgPSB7XG4gICAgICAgICAgICAgICAgbmV3VmFsdWU6IHZhbCxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihjcmVhdGVBdXhLZXkodW5yZWYoY3VycmVudENsaXApLCBzZWxlY3RlZEN1cnZlTmFtZS52YWx1ZSwgcHJvcHMuY3VycmVudEZyYW1lLCBjdXN0b21EYXRhKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgd2F0Y2goY3VycmVudENsaXAsICgpID0+IHtcbiAgICAgICAgICAgIGF1eEN1cnZlU3RvcmUucmVzZXQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5LiJ6ICF5Lu75LiA5Y+R55Sf5Y+Y5YyW77yM6YO96ZyA6KaB5Yi35pawIGR1bXAg5pWw5o2uXG4gICAgICAgIHdhdGNoKFxuICAgICAgICAgICAgKCkgPT5cbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIHVucmVmKGN1cnJlbnRDbGlwKSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRDdXJ2ZU5hbWUudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHVzZSBsb2NhbCBmcmFtZSBkYXRhIHRvIHN1cHBvcnQgYHByb3BzLmN1cnJlbnRGcmFtZWAgJiBTZWxlY3RlZCBmcmFtZVxuICAgICAgICAgICAgICAgICAgICBwcm9wcy5jdXJyZW50RnJhbWUsXG4gICAgICAgICAgICAgICAgXSBhcyBjb25zdCxcbiAgICAgICAgICAgIGFzeW5jIChbY2xpcElkLCBjdXJ2ZU5hbWUsIGN1cnJlbnRGcmFtZV0sIF8sIG9uQ2xlYW51cCkgPT4ge1xuICAgICAgICAgICAgICAgIHVwZGF0ZUR1bXAoY2xpcElkLCBjdXJ2ZU5hbWUsIGN1cnJlbnRGcmFtZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgICAgICAvLyDnlKjkuo7lvLrliLbliLfmlrAgZHVtcCDmlbDmja7jgIJcbiAgICAgICAgLy8gRklYTUU6IOS9v+eUqOS6i+S7tuebkeWQrO+8jOaIluiAheaKiuaVtOWll+mAu+i+keaQrOWIsCBzdG9yZSDph4zpnaLljrtcbiAgICAgICAgd2F0Y2goXG4gICAgICAgICAgICAoKSA9PiBhdXhDdXJ2ZVN0b3JlLnNlbGVjdGVkRnJhbWVEdW1wUmVuZGVyS2V5LFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHVwZGF0ZUR1bXAodW5yZWYoY3VycmVudENsaXApLCBzZWxlY3RlZEN1cnZlTmFtZS52YWx1ZSwgcHJvcHMuY3VycmVudEZyYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gaGVhZGVyIHJlc2l6ZVxuICAgICAgICBjb25zdCBvbkhlYWRlck1vdXNlZG93biA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgYW5pbWF0aW9uRWRpdG9yLm9uU3RhcnRSZXNpemUoZXZlbnQsICdhdXhDdXJ2ZScpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHVwZGF0ZVNlbGVjdEtleSA9IChuYW1lOiBzdHJpbmcsIGluZm86IElTZWxlY3RLZXlCYXNlIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgc2VsZWN0ZWRDdXJ2ZU5hbWUudmFsdWUgPSBuYW1lO1xuICAgICAgICAgICAgYXV4Q3VydmVTdG9yZS5zZWxlY3RLZXlJbmZvID0gaW5mbztcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvbktleVJlbW92ZSA9IChuYW1lOiBzdHJpbmcsIGZyYW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIC8vIOaYr+W9k+WJjemAieS4reeahOabsue6v++8jOmcgOimgeWIt+aWsOS4gOasoSBkdW1wIOaVsOaNruOAgu+8iOmcgOimgemHjeaWsOiuoeeul+ivpeeCueWAvFxuICAgICAgICAgICAgLy8gVE9ETzog55CG6K665LiK5pyJ6ZyA6KaB5Yi35pawIGR1bXAg55qE5oOF5Ya15pyJXG4gICAgICAgICAgICAvLyAxLiDliKDpmaTnmoTluKfkuLrlvZPliY3luKfnmoTliY3kuIDkuKrjgIHkuIvkuIDkuKrlhbPplK7luKfml7bvvIjlvZPliY3luKfkvY3kuo7kuKTkuKrlhbPplK7luKfkuYvpl7TvvInmiY3pnIDopoHph43mlrDorqHnrpdcbiAgICAgICAgICAgIC8vIDIuIOWIoOmZpOW4p+S4uuW9k+WJjeW4p1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRHVtcCh1bnJlZihjdXJyZW50Q2xpcCksIHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlLCBmcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb25LZXlQYXN0ZSA9IChuYW1lOiBzdHJpbmcsIGZyYW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBzZWxlY3RlZEN1cnZlTmFtZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZUR1bXAodW5yZWYoY3VycmVudENsaXApLCBzZWxlY3RlZEN1cnZlTmFtZS52YWx1ZSwgZnJhbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9uS2V5Q3JlYXRlID0gKG5hbWU6IHN0cmluZywgZnJhbWU6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlRHVtcCh1bnJlZihjdXJyZW50Q2xpcCksIHNlbGVjdGVkQ3VydmVOYW1lLnZhbHVlLCBmcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb25DdXJ2ZUFyZWFNb3VzZWRvd24gPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChjdXJ2ZVZpc2libGUudmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhbPplK7luKfmmL7npLrmqKHlvI/kuIvvvIzlnKjnqbrnmb3ljLrln5/ngrnlh7vml7bvvIzmuIXnqbrovoXliqnmm7Lnur/nmoTpgInkuK3mlbDmja5cbiAgICAgICAgICAgIHVwZGF0ZVNlbGVjdEtleSgnJywgbnVsbCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgZXhwb3NlZEFQSTogUmV0dXJuVHlwZTx0eXBlb2YgZ2V0RXhwb3NlZEFQST4gPSBnZXRFeHBvc2VkQVBJKCk7XG4gICAgICAgIC8vIOmHjeWGmemDqOWIhiBBUEkg55qE5a6e546wXG4gICAgICAgIGNvbnN0IHpvb21Ub0ZpdDogdHlwZW9mIGV4cG9zZWRBUElbJ3pvb21Ub0ZpdCddID0gKCkgPT4ge1xuICAgICAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgICAgIGlmICghY3VydmVWaXNpYmxlLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwb3NlZEFQSS56b29tVG9GaXQoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgem9vbVRvU2VsZWN0ZWRLZXlzOiB0eXBlb2YgZXhwb3NlZEFQSVsnem9vbVRvU2VsZWN0ZWRLZXlzJ10gPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWN1cnZlVmlzaWJsZS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cG9zZWRBUEkuem9vbVRvU2VsZWN0ZWRLZXlzKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyYW1lc0FyZWEsXG4gICAgICAgICAgICBjdXJ2ZVZpc2libGUsXG4gICAgICAgICAgICBzaG93Q3VydmUsXG4gICAgICAgICAgICBoaWRlQ3VydmUsXG4gICAgICAgICAgICBzY3JvbGxJbmZvLFxuXG4gICAgICAgICAgICBjdXJ2ZXMsXG4gICAgICAgICAgICBzZWxlY3RlZEtleUluZm8sXG4gICAgICAgICAgICBrZXlmcmFtZU1hcCxcblxuICAgICAgICAgICAgcmVuZGVyRHVtcCxcbiAgICAgICAgICAgIGlzUHJvcEVkaXRhYmxlLFxuICAgICAgICAgICAgb25GcmFtZVZhbHVlQ2hhbmdlLFxuICAgICAgICAgICAgb25GcmFtZVZhbHVlQ29uZmlybSxcblxuICAgICAgICAgICAgdXBkYXRlU2VsZWN0S2V5LFxuICAgICAgICAgICAgb25LZXlSZW1vdmUsXG4gICAgICAgICAgICBvbktleVBhc3RlLFxuICAgICAgICAgICAgb25LZXlDcmVhdGUsXG4gICAgICAgICAgICBvbkN1cnZlQmx1cixcbiAgICAgICAgICAgIG9uQ3VydmVGb2N1cyxcblxuICAgICAgICAgICAgb25IZWFkZXJNb3VzZWRvd24sXG4gICAgICAgICAgICBvbkN1cnZlQXJlYU1vdXNlZG93bixcbiAgICAgICAgICAgIG9uVHJhbnNmb3JtLFxuXG4gICAgICAgICAgICAvLyBwdWJsaWMgQVBJICYgb3ZlcnJpZGVcbiAgICAgICAgICAgIC4uLmdldEV4cG9zZWRBUEkoKSxcbiAgICAgICAgICAgIHpvb21Ub0ZpdCxcbiAgICAgICAgICAgIHpvb21Ub1NlbGVjdGVkS2V5cyxcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbn0pO1xuXG4vLyBUT0RPOiDogIPomZHmlbTlkIjliLAgc3RvcmUg5Lit77yM5L2/5b6X5pu05paw5pON5L2c5Y+v5Lul5Zyo5YW25a6D5Zyw5pa56Kem5Y+RXG5mdW5jdGlvbiB1c2VGcmFtZUR1bXAoKSB7XG4gICAgY29uc3QgemVyb1RpY2sgPSAtMTtcbiAgICBjb25zdCBhdXhDdXJ2ZVN0b3JlID0gdXNlQXV4Q3VydmVTdG9yZSgpO1xuXG4gICAgLy9cbiAgICBjb25zdCBsb2NrID0gcmVmKHplcm9UaWNrKTtcblxuICAgIC8vIGR1bXAgZWRpdGluZ1xuICAgIGNvbnN0IHJlbmRlckR1bXAgPSBjb21wdXRlZCh7XG4gICAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGF1eEN1cnZlU3RvcmUuc2VsZWN0ZWRGcmFtZUR1bXA7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogKHZhbCkgPT4ge1xuICAgICAgICAgICAgYXV4Q3VydmVTdG9yZS5zZWxlY3RlZEZyYW1lRHVtcCA9IHZhbDtcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGlzRWRpdGFibGUgPSBjb21wdXRlZCgoKSA9PiB7XG4gICAgICAgIHJldHVybiByZW5kZXJEdW1wLnZhbHVlICE9IG51bGw7XG4gICAgfSk7XG5cbiAgICAvLyBUT0RPOiDmmK/lkKbkuI3lupTor6Xmj5Dkvpvlj4LmlbDvvJ/nm7TmjqXnlLEgaG9vayDlj4LmlbDnu5HlrprvvIjmiJbnm7TmjqXnu5HlrprliLAgc3RvcmUg55qE5a+55bqU5YC8XG4gICAgY29uc3QgdXBkYXRlID0gYXN5bmMgKGNsaXBJZDogc3RyaW5nLCBjdXJ2ZU5hbWU6IHN0cmluZywgY3VycmVudEZyYW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKGN1cnZlTmFtZSA9PT0gJycgfHwgY2xpcElkID09PSAnJykge1xuICAgICAgICAgICAgcmVzZXQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRoaXNUaWNrID0gRGF0ZS5ub3coKTtcbiAgICAgICAgbG9jay52YWx1ZSA9IHRoaXNUaWNrO1xuXG4gICAgICAgIGNvbnN0IGR1bXAgPSBhd2FpdCBnZXRBdXhDdXJ2ZVZhbHVlQXRGcmFtZShjbGlwSWQsIGN1cnZlTmFtZSwgY3VycmVudEZyYW1lKTtcblxuICAgICAgICBpZiAobG9jay52YWx1ZSAhPT0gdGhpc1RpY2spIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1BsYWluT2JqZWN0KGR1bXApKSB7XG4gICAgICAgICAgICByZW5kZXJEdW1wLnZhbHVlID0ge1xuICAgICAgICAgICAgICAgIC4uLmR1bXAsXG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IOaJi+WKqOe7mSB1aS1wcm9wIOaehOmAoOS4gOS4qiBsYWJlbFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiAnVmFsdWUnLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbmRlckR1bXAudmFsdWUgPSBkdW1wO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHJlc2V0ID0gKCkgPT4ge1xuICAgICAgICByZW5kZXJEdW1wLnZhbHVlID0gbnVsbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyRHVtcCxcbiAgICAgICAgaXNFZGl0YWJsZSxcblxuICAgICAgICB1cGRhdGUsXG4gICAgICAgIHJlc2V0LFxuICAgIH07XG59XG4iXX0=