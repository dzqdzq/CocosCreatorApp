"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuxCurveEditor = void 0;
const vue_js_1 = require("vue/dist/vue.js");
const animation_editor_1 = require("../../share/animation-editor");
const grid_ctrl_1 = require("../../share/grid-ctrl");
const ipc_event_1 = require("../../share/ipc-event");
const utils_1 = require("../../utils");
const store_aux_1 = require("./store-aux");
const store_base_1 = require("./store-base");
const store_grid_1 = require("./store-grid");
const use_curve_editor_1 = require("./use-curve-editor");
const DUMP_VALUE_TYPE = 'Float';
const CURVE_COLOR = "#7979D7" /* PURPLE */;
function useAuxCurveEditor(options) {
    const baseStore = (0, store_base_1.useBaseStore)();
    const auxCurveStore = (0, store_aux_1.useAuxCurveStore)();
    const currentClip = options.currentClip ?? (0, vue_js_1.computed)(() => baseStore.currentClip);
    const { element: curveEl, getElement, hide, paint, resize, show, visible, } = (0, use_curve_editor_1.useCurveEditor)({
        ...options,
        configure: (el) => {
            return animation_editor_1.animationEditor.configureCurveEditor(el);
        },
    });
    const lightCurve = (0, vue_js_1.ref)();
    const curveData = (0, vue_js_1.computed)(() => {
        const curves = auxCurveStore.curves;
        const selectedCurve = auxCurveStore.selectedCurve;
        if (curves.length < 1 || selectedCurve == null) {
            return null;
        }
        const data = {
            curveInfos: {},
            duration: 0,
            wrapMode: 0,
        };
        const keys = [];
        for (const keyframe of selectedCurve.keyframes) {
            if (keyframe.curve) {
                keys.push(keyframe.curve);
            }
        }
        data.curveInfos[selectedCurve.displayName] = {
            keys: keys,
            postWrapMode: selectedCurve.postExtrap,
            preWrapMode: selectedCurve.preExtrap,
            color: CURVE_COLOR,
        };
        return data;
    });
    const updateCurrentFrame = (frame) => {
        return animation_editor_1.animationEditor.updateCurrentFrame(frame);
    };
    // TODO: pass in from arguments
    const onCurveOperate = (operate, curveKeyFrames, targetFrame) => {
        // console.debug('curve operate', { operate, curveKeyFrames, targetFrame });
        if (!curveKeyFrames) {
            return;
        }
        switch (operate) {
            case 'select': {
                const selectKeyInfo = {
                    keyframes: [],
                    ctrl: false,
                    offset: 0,
                    offsetFrame: 0,
                    startX: 0,
                };
                for (const keysInfo of curveKeyFrames) {
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keysInfo.keys, DUMP_VALUE_TYPE);
                    const mappedKeys = keys.map((info, index) => {
                        const keyData = {
                            x: keysInfo.keys[index].key.canvas.x - grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                            frame: info.frame,
                            rawFrame: info.frame,
                            key: keysInfo.key,
                        };
                        return keyData;
                    });
                    selectKeyInfo.keyframes.push(...mappedKeys);
                }
                auxCurveStore.selectKeyInfo = selectKeyInfo;
                break;
            }
            // 双击跳转到某个关键帧位置
            case 'db-select': {
                const currentKeys = curveKeyFrames[0].keys;
                const keys = (0, utils_1.transformCtrlKeyToDump)(currentKeys, DUMP_VALUE_TYPE);
                updateCurrentFrame(keys[0].frame);
                break;
            }
            case 'select-curve': {
                lightCurve.value = {
                    name: curveKeyFrames[0].key,
                    color: CURVE_COLOR,
                };
                break;
            }
            case 'select-curve-clip': {
                lightCurve.value = {
                    name: curveKeyFrames[0].key,
                    color: CURVE_COLOR,
                };
                break;
            }
            case 'apply-bezier': {
                // 所有关键帧值的修改
                const curveName = curveKeyFrames[0].key;
                const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, DUMP_VALUE_TYPE);
                const modifyKeys = keys.map((item) => {
                    return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveName, item.frame, {
                        inTangent: item.inTangent,
                        outTangent: item.outTangent,
                        inTangentWeight: item.inTangentWeight,
                        outTangentWeight: item.outTangentWeight,
                        interpMode: item.interpMode,
                        tangentWeightMode: item.tangentWeightMode,
                    });
                });
                (0, ipc_event_1.IApplyOperation)(modifyKeys);
                break;
            }
            case 'scale-keys':
            case 'move-keys': {
                const moveKeys = [];
                const createKeys = [];
                const selectKeyInfo = {
                    keyframes: [],
                    ctrl: false,
                    offset: 0,
                    offsetFrame: 0,
                    startX: 0,
                };
                for (const curveInfo of curveKeyFrames) {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    for (let index = 0; index < keyInfos.length; index++) {
                        const item = keyInfos[index];
                        // 关键帧移动
                        const offsetFrameX = Math.round(item.key.point.x - item.raw.point.x);
                        const keyData = {
                            x: grid_ctrl_1.gridCtrl.grid.valueToPixelH(keys[index].frame) - grid_ctrl_1.gridCtrl.grid.xAxisOffset,
                            frame: keys[index].frame,
                            rawFrame: Math.round(item.raw.point.x),
                            offsetFrame: offsetFrameX,
                            key: curveInfo.key,
                        };
                        selectKeyInfo.keyframes.push(keyData);
                        const offsetFrameY = Math.round(item.key.point.y - item.raw.point.y);
                        if (!offsetFrameX && !offsetFrameY) {
                            continue;
                        }
                        if (offsetFrameX !== 0) {
                            moveKeys.push((0, ipc_event_1.moveAuxKeys)((0, vue_js_1.unref)(currentClip), curveInfo.key, [Math.round(item.raw.point.x)], offsetFrameX));
                        }
                        createKeys.push((0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, keys[index].frame, {
                            newValue: item.key.point.y,
                            inTangent: item.key.inTangent,
                            outTangent: item.key.outTangent,
                        }));
                    }
                }
                // 按顺序，先移动，再更新关键帧数据
                (0, ipc_event_1.IApplyOperation)([...moveKeys, ...createKeys]);
                auxCurveStore.selectKeyInfo = selectKeyInfo;
                break;
            }
            case 'tangent': {
                // 所有关键帧值的修改
                const targetProp = curveKeyFrames[0].key;
                const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, DUMP_VALUE_TYPE);
                const modifyKeys = keys.map((item) => {
                    return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), targetProp, item.frame, {
                        inTangent: item.inTangent,
                        broken: item.broken,
                        outTangent: item.outTangent,
                        inTangentWeight: item.inTangentWeight,
                        outTangentWeight: item.outTangentWeight,
                    });
                });
                (0, ipc_event_1.IApplyOperation)(modifyKeys);
                break;
            }
            // TODO 暂时没有调用，需要场景支持 broken 数据的修改
            case 'change-broken-state': {
                // 所有关键帧值的修改
                const curveName = curveKeyFrames[0].key;
                const keys = (0, utils_1.transformCtrlKeyToDump)(curveKeyFrames[0].keys, DUMP_VALUE_TYPE);
                const modifyKeys = keys.map((item) => {
                    return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveName, item.frame, {
                        broken: item.broken,
                    });
                });
                (0, ipc_event_1.IApplyOperation)(modifyKeys);
                break;
            }
            case 'create-keys': {
                // 粘贴接口目前也走新建关键帧处理
                const createKeysTask = [];
                for (const curveInfo of curveKeyFrames) {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    keys.forEach((targetKey, index) => {
                        createKeysTask.push((0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, keys[index].frame, {
                            inTangent: targetKey.inTangent,
                            outTangent: targetKey.outTangent,
                            newValue: targetKey.dump.value,
                            interpMode: targetKey.interpMode,
                            tangentWeightMode: targetKey.tangentWeightMode,
                            inTangentWeight: targetKey.inTangentWeight,
                            outTangentWeight: targetKey.outTangentWeight,
                        }));
                    });
                }
                (0, ipc_event_1.IApplyOperation)(createKeysTask);
                break;
            }
            case 'change-interp-mode': {
                // 所有关键帧值的修改
                const modifyCurveOfKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    modifyCurveOfKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame, {
                            inTangent: item.inTangent,
                            outTangent: item.outTangent,
                            interpMode: item.interpMode,
                        });
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(modifyCurveOfKeys);
                break;
            }
            case 'change-tangent-weight': {
                // 所有关键帧值的修改
                const modifyCurveOfKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    modifyCurveOfKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.modifyAuxCurveOfKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame, {
                            tangentWeightMode: item.tangentWeightMode,
                            inTangentWeight: item.inTangentWeight,
                            outTangentWeight: item.outTangentWeight,
                        });
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(modifyCurveOfKeys);
                break;
            }
            case 'remove-keys': {
                const removeKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    removeKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.removeAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame);
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(removeKeys);
                auxCurveStore.selectKeyInfo = null;
                break;
            }
            case 'move-curve': {
                const createKeys = [];
                curveKeyFrames.forEach((curveInfo) => {
                    const keyInfos = curveInfo.keys;
                    const keys = (0, utils_1.transformCtrlKeyToDump)(keyInfos, DUMP_VALUE_TYPE);
                    // 整条曲线的上下移动：所有关键帧值的修改
                    createKeys.push(...keys.map((item) => {
                        return (0, ipc_event_1.createAuxKey)((0, vue_js_1.unref)(currentClip), curveInfo.key, item.frame, {
                            newValue: item.dump.value,
                        });
                    }));
                });
                (0, ipc_event_1.IApplyOperation)(createKeys);
                break;
            }
            case 'copy': {
                // TODO: 支持多条曲线、多个关键帧的复制
                const srcCurve = curveKeyFrames[0];
                const srcKeyframe = srcCurve.keys[0];
                auxCurveStore.copyKeyframeSnap = {
                    clip: (0, vue_js_1.unref)(currentClip),
                    name: srcCurve.key,
                    frame: srcKeyframe.raw.point.x,
                    curve: {
                        ...srcKeyframe.raw,
                    },
                    dump: {
                        type: DUMP_VALUE_TYPE,
                        value: srcKeyframe.raw.point.y, // 当前帧对应的值
                    },
                };
                break;
            }
        }
    };
    const transformEvent = (0, store_grid_1.useTransformEvent)();
    // 监听其它操作导致 grid 改变时，同步到 curve editor
    transformEvent.onUpdate((key) => {
        if (key === 'aux_curve' || !grid_ctrl_1.gridCtrl.grid) {
            return;
        }
        const el = getElement();
        (0, grid_ctrl_1.syncAxisX)(grid_ctrl_1.gridCtrl.grid, el.curveCtrl.grid);
        paint(curveData.value);
    });
    // 处理 curve editor 发出的 transform 事件
    const onCurveTransform = () => {
        const el = getElement();
        if (grid_ctrl_1.gridCtrl.grid) {
            (0, grid_ctrl_1.syncAxisX)(el.curveCtrl.grid, grid_ctrl_1.gridCtrl.grid);
            transformEvent.emitUpdate('aux_curve');
        }
    };
    // FIXME: 仿照 prop 那边的实现，但不像预期的那样工作。还需要再排查。
    // 粘贴关键帧的 value 并不是复制的 value，而是鼠标位置表示的 value。
    const getCopyKeys = () => {
        const snap = auxCurveStore.copyKeyframeSnap;
        if (snap == null) {
            return [];
        }
        const copyKey = (0, utils_1.transDumpKeyToCurveKey)({
            ...snap.curve,
            frame: snap.frame,
            dump: snap.dump,
        });
        if (copyKey == null) {
            return [];
        }
        const keys = [
            {
                key: {
                    ...copyKey,
                    canvas: {
                        x: snap.frame,
                        y: snap.dump.value,
                    },
                },
                raw: snap.curve,
            },
        ];
        return [
            {
                key: snap.name,
                keys: keys,
            },
        ];
    };
    const configure = (uiCurve) => {
        animation_editor_1.animationEditor.configureCurveEditor(uiCurve);
        uiCurve.addEventListener('transform', onCurveTransform);
        uiCurve.curveCtrl.getCopyKeys = getCopyKeys;
        uiCurve.curveCtrl.on('operate', onCurveOperate);
    };
    // 把 clip.sample 同步设置到曲线中
    (0, vue_js_1.watchEffect)(() => {
        if (!curveEl.value) {
            return;
        }
        curveEl.value.sample = baseStore.currentSample;
    });
    (0, vue_js_1.watch)(curveData, (newData, oldData, onCleanup) => {
        let skip = false;
        (0, vue_js_1.nextTick)(() => {
            if (skip)
                return;
            paint(newData);
        });
        onCleanup(() => {
            skip = true;
        });
    }, {
        flush: 'post',
    });
    (0, vue_js_1.onMounted)(() => {
        (0, vue_js_1.nextTick)(() => {
            if (!curveEl.value) {
                return;
            }
            // FIXME: mounted 时设置曲线，但由于曲线编辑器默认没有显示，内部部分计算逻辑并不会生效，因此需要在第一次显示时再配置一次。
            // 可见 useCurveEditor 内部实现。
            configure(curveEl.value);
        });
    });
    (0, vue_js_1.onUnmounted)(() => {
        if (curveEl.value) {
            const uiCurve = curveEl.value;
            uiCurve.removeEventListener('transform', onCurveTransform);
            uiCurve.curveCtrl.off('operate', onCurveOperate);
        }
    });
    return {
        curveEl,
        visible: visible,
        show,
        hide,
        paint,
        onTransform: onCurveTransform,
        onOperate: onCurveOperate,
    };
}
exports.useAuxCurveEditor = useAuxCurveEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlLWF1eC1jdXJ2ZS1lZGl0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zb3VyY2UvcGFuZWwvdm0vaG9va3MvdXNlLWF1eC1jdXJ2ZS1lZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNENBV3lCO0FBZXpCLG1FQUEyRTtBQUUzRSxxREFBNEQ7QUFDNUQscURBTytCO0FBQy9CLHVDQUE2RTtBQUU3RSwyQ0FBK0M7QUFDL0MsNkNBQTRDO0FBQzVDLDZDQUFpRDtBQUNqRCx5REFBdUY7QUFFdkYsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDO0FBQ2hDLE1BQU0sV0FBVyx5QkFBb0IsQ0FBQztBQU90QyxTQUFnQixpQkFBaUIsQ0FBQyxPQUEyQjtJQUN6RCxNQUFNLFNBQVMsR0FBRyxJQUFBLHlCQUFZLEdBQUUsQ0FBQztJQUNqQyxNQUFNLGFBQWEsR0FBRyxJQUFBLDRCQUFnQixHQUFFLENBQUM7SUFFekMsTUFBTSxXQUFXLEdBQTBCLE9BQU8sQ0FBQyxXQUFXLElBQUksSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUV4RyxNQUFNLEVBQ0YsT0FBTyxFQUFFLE9BQU8sRUFDaEIsVUFBVSxFQUNWLElBQUksRUFDSixLQUFLLEVBQ0wsTUFBTSxFQUNOLElBQUksRUFDSixPQUFPLEdBQ1YsR0FBRyxJQUFBLGlDQUFjLEVBQUM7UUFDZixHQUFHLE9BQU87UUFDVixTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUNkLE9BQU8sa0NBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRCxDQUFDO0tBQ0osQ0FBQyxDQUFDO0lBRUgsTUFBTSxVQUFVLEdBQUcsSUFBQSxZQUFHLEdBQU8sQ0FBQztJQUU5QixNQUFNLFNBQVMsR0FBRyxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFO1FBQzVCLE1BQU0sTUFBTSxHQUFHLGFB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QUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztTQUNwRDtJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTztRQUNILE9BQU87UUFDUCxPQUFPLEVBQUUsT0FBTztRQUNoQixJQUFJO1FBQ0osSUFBSTtRQUNKLEtBQUs7UUFFTCxXQUFXLEVBQUUsZ0JBQWdCO1FBQzdCLFNBQVMsRUFBRSxjQUFjO0tBQzVCLENBQUM7QUFDTixDQUFDO0FBbmRELDhDQW1kQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgY29tcHV0ZWQsXG4gICAgcmVmLFxuICAgIHdhdGNoLFxuICAgIG9uTW91bnRlZCxcbiAgICBvblVubW91bnRlZCxcbiAgICBSZWYsXG4gICAgdW5yZWYsXG4gICAgbmV4dFRpY2ssXG4gICAgd2F0Y2hFZmZlY3QsXG4gICAgdG9SZWYsXG59IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBDdXJ2ZUVkaXRvciB9IGZyb20gJ0BlZGl0b3IvY3JlYXRvci11aS1raXQvZGlzdC9yZW5kZXJlcic7XG5cbmltcG9ydCB7XG4gICAgSVByb3BDdXJ2ZUR1bXBEYXRhLFxuICAgIElTZWxlY3RLZXlCYXNlLFxuICAgIEhUTUxDdXN0b21FbGVtZW50LFxuICAgIElDdXJ2ZUtleUluZm9zLFxuICAgIElLZXlmcmFtZURhdGFCYXNlLFxuICAgIElBbmlWTVRoaXMsXG4gICAgSUN1cnZlVmFsdWUsXG4gICAgSUN1cnZlS2V5ZnJhbWUsXG4gICAgTWF5YmVSZWYsXG4gICAgSUN0cmxLZXlmcmFtZSxcbn0gZnJvbSAnLi4vLi4vLi4vLi4vQHR5cGVzL3ByaXZhdGUnO1xuaW1wb3J0IHsgYW5pbWF0aW9uRWRpdG9yLCBDdXJ2ZUNvbG9yIH0gZnJvbSAnLi4vLi4vc2hhcmUvYW5pbWF0aW9uLWVkaXRvcic7XG5cbmltcG9ydCB7IGdyaWRDdHJsLCBzeW5jQXhpc1ggfSBmcm9tICcuLi8uLi9zaGFyZS9ncmlkLWN0cmwnO1xuaW1wb3J0IHtcbiAgICBJQXBwbHlPcGVyYXRpb24sXG4gICAgY3JlYXRlQXV4S2V5LFxuICAgIElBbmltT3BlcmF0aW9uLFxuICAgIHJlbW92ZUF1eEtleSxcbiAgICBtb3ZlQXV4S2V5cyxcbiAgICBtb2RpZnlBdXhDdXJ2ZU9mS2V5LFxufSBmcm9tICcuLi8uLi9zaGFyZS9pcGMtZXZlbnQnO1xuaW1wb3J0IHsgdHJhbnNmb3JtQ3RybEtleVRvRHVtcCwgdHJhbnNEdW1wS2V5VG9DdXJ2ZUtleSB9IGZyb20gJy4uLy4uL3V0aWxzJztcblxuaW1wb3J0IHsgdXNlQXV4Q3VydmVTdG9yZSB9IGZyb20gJy4vc3RvcmUtYXV4JztcbmltcG9ydCB7IHVzZUJhc2VTdG9yZSB9IGZyb20gJy4vc3RvcmUtYmFzZSc7XG5pbXBvcnQgeyB1c2VUcmFuc2Zvcm1FdmVudCB9IGZyb20gJy4vc3RvcmUtZ3JpZCc7XG5pbXBvcnQgeyB1c2VDdXJ2ZUVkaXRvciwgQ3VydmVPcGVyYXRlLCBDdXJ2ZU9wZXJhdGVIYW5kbGVyIH0gZnJvbSAnLi91c2UtY3VydmUtZWRpdG9yJztcblxuY29uc3QgRFVNUF9WQUxVRV9UWVBFID0gJ0Zsb2F0JztcbmNvbnN0IENVUlZFX0NPTE9SID0gQ3VydmVDb2xvci5QVVJQTEU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVXNlQXV4Q3VydmVPcHRpb25zIHtcbiAgICBzaXplOiB7IHdpZHRoOiBNYXliZVJlZjxudW1iZXI+OyBoZWlnaHQ6IE1heWJlUmVmPG51bWJlcj4gfTtcbiAgICBjdXJyZW50Q2xpcD86IFJlYWRvbmx5PFJlZjxzdHJpbmc+Pjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZUF1eEN1cnZlRWRpdG9yKG9wdGlvbnM6IFVzZUF1eEN1cnZlT3B0aW9ucykge1xuICAgIGNvbnN0IGJhc2VTdG9yZSA9IHVzZUJhc2VTdG9yZSgpO1xuICAgIGNvbnN0IGF1eEN1cnZlU3RvcmUgPSB1c2VBdXhDdXJ2ZVN0b3JlKCk7XG5cbiAgICBjb25zdCBjdXJyZW50Q2xpcDogUmVhZG9ubHk8UmVmPHN0cmluZz4+ID0gb3B0aW9ucy5jdXJyZW50Q2xpcCA/PyBjb21wdXRlZCgoKSA9PiBiYXNlU3RvcmUuY3VycmVudENsaXApO1xuXG4gICAgY29uc3Qge1xuICAgICAgICBlbGVtZW50OiBjdXJ2ZUVsLFxuICAgICAgICBnZXRFbGVtZW50LFxuICAgICAgICBoaWRlLFxuICAgICAgICBwYWludCxcbiAgICAgICAgcmVzaXplLFxuICAgICAgICBzaG93LFxuICAgICAgICB2aXNpYmxlLFxuICAgIH0gPSB1c2VDdXJ2ZUVkaXRvcih7XG4gICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIGNvbmZpZ3VyZTogKGVsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYW5pbWF0aW9uRWRpdG9yLmNvbmZpZ3VyZUN1cnZlRWRpdG9yKGVsKTtcbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGxpZ2h0Q3VydmUgPSByZWY8YW55PigpO1xuXG4gICAgY29uc3QgY3VydmVEYXRhID0gY29tcHV0ZWQoKCkgPT4ge1xuICAgICAgICBjb25zdCBjdXJ2ZXMgPSBhdXhDdXJ2ZVN0b3JlLmN1cnZlcztcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRDdXJ2ZSA9IGF1eEN1cnZlU3RvcmUuc2VsZWN0ZWRDdXJ2ZTtcblxuICAgICAgICBpZiAoY3VydmVzLmxlbmd0aCA8IDEgfHwgc2VsZWN0ZWRDdXJ2ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRhdGE6IElDdXJ2ZVZhbHVlID0ge1xuICAgICAgICAgICAgY3VydmVJbmZvczoge30sXG4gICAgICAgICAgICBkdXJhdGlvbjogMCxcbiAgICAgICAgICAgIHdyYXBNb2RlOiAwLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGtleXM6IElDdXJ2ZUtleWZyYW1lW10gPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleWZyYW1lIG9mIHNlbGVjdGVkQ3VydmUua2V5ZnJhbWVzKSB7XG4gICAgICAgICAgICBpZiAoa2V5ZnJhbWUuY3VydmUpIHtcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5ZnJhbWUuY3VydmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS5jdXJ2ZUluZm9zW3NlbGVjdGVkQ3VydmUuZGlzcGxheU5hbWVdID0ge1xuICAgICAgICAgICAga2V5czoga2V5cyxcbiAgICAgICAgICAgIHBvc3RXcmFwTW9kZTogc2VsZWN0ZWRDdXJ2ZS5wb3N0RXh0cmFwLFxuICAgICAgICAgICAgcHJlV3JhcE1vZGU6IHNlbGVjdGVkQ3VydmUucHJlRXh0cmFwLFxuICAgICAgICAgICAgY29sb3I6IENVUlZFX0NPTE9SLFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdXBkYXRlQ3VycmVudEZyYW1lID0gKGZyYW1lOiBudW1iZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIGFuaW1hdGlvbkVkaXRvci51cGRhdGVDdXJyZW50RnJhbWUoZnJhbWUpO1xuICAgIH07XG5cbiAgICAvLyBUT0RPOiBwYXNzIGluIGZyb20gYXJndW1lbnRzXG4gICAgY29uc3Qgb25DdXJ2ZU9wZXJhdGU6IEN1cnZlT3BlcmF0ZUhhbmRsZXIgPSAob3BlcmF0ZSwgY3VydmVLZXlGcmFtZXMsIHRhcmdldEZyYW1lKSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUuZGVidWcoJ2N1cnZlIG9wZXJhdGUnLCB7IG9wZXJhdGUsIGN1cnZlS2V5RnJhbWVzLCB0YXJnZXRGcmFtZSB9KTtcbiAgICAgICAgaWYgKCFjdXJ2ZUtleUZyYW1lcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChvcGVyYXRlKSB7XG4gICAgICAgICAgICBjYXNlICdzZWxlY3QnOiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0S2V5SW5mbzogSVNlbGVjdEtleUJhc2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIGtleWZyYW1lczogW10sXG4gICAgICAgICAgICAgICAgICAgIGN0cmw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldEZyYW1lOiAwLFxuICAgICAgICAgICAgICAgICAgICBzdGFydFg6IDAsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleXNJbmZvIG9mIGN1cnZlS2V5RnJhbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleXNJbmZvLmtleXMsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hcHBlZEtleXMgPSBrZXlzLm1hcCgoaW5mbywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleURhdGE6IElLZXlmcmFtZURhdGFCYXNlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGtleXNJbmZvLmtleXNbaW5kZXhdLmtleS5jYW52YXMueCAtIGdyaWRDdHJsLmdyaWQhLnhBeGlzT2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lOiBpbmZvLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd0ZyYW1lOiBpbmZvLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleToga2V5c0luZm8ua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXlEYXRhO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0S2V5SW5mby5rZXlmcmFtZXMucHVzaCguLi5tYXBwZWRLZXlzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhdXhDdXJ2ZVN0b3JlLnNlbGVjdEtleUluZm8gPSBzZWxlY3RLZXlJbmZvO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDlj4zlh7vot7PovazliLDmn5DkuKrlhbPplK7luKfkvY3nva5cbiAgICAgICAgICAgIGNhc2UgJ2RiLXNlbGVjdCc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50S2V5cyA9IGN1cnZlS2V5RnJhbWVzWzBdLmtleXM7XG4gICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoY3VycmVudEtleXMsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgdXBkYXRlQ3VycmVudEZyYW1lKGtleXNbMF0uZnJhbWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnc2VsZWN0LWN1cnZlJzoge1xuICAgICAgICAgICAgICAgIGxpZ2h0Q3VydmUudmFsdWUgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGN1cnZlS2V5RnJhbWVzWzBdLmtleSxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IENVUlZFX0NPTE9SLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdzZWxlY3QtY3VydmUtY2xpcCc6IHtcbiAgICAgICAgICAgICAgICBsaWdodEN1cnZlLnZhbHVlID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBjdXJ2ZUtleUZyYW1lc1swXS5rZXksXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiBDVVJWRV9DT0xPUixcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnYXBwbHktYmV6aWVyJzoge1xuICAgICAgICAgICAgICAgIC8vIOaJgOacieWFs+mUruW4p+WAvOeahOS/ruaUuVxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnZlTmFtZSA9IGN1cnZlS2V5RnJhbWVzWzBdLmtleTtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJ2ZUtleUZyYW1lc1swXS5rZXlzLCBEVU1QX1ZBTFVFX1RZUEUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUtleXMgPSBrZXlzIS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vZGlmeUF1eEN1cnZlT2ZLZXkodW5yZWYoY3VycmVudENsaXApLCBjdXJ2ZU5hbWUsIGl0ZW0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudDogaXRlbS5pblRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50OiBpdGVtLm91dFRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpblRhbmdlbnRXZWlnaHQ6IGl0ZW0uaW5UYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudFdlaWdodDogaXRlbS5vdXRUYW5nZW50V2VpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwTW9kZTogaXRlbS5pbnRlcnBNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFuZ2VudFdlaWdodE1vZGU6IGl0ZW0udGFuZ2VudFdlaWdodE1vZGUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihtb2RpZnlLZXlzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3NjYWxlLWtleXMnOlxuICAgICAgICAgICAgY2FzZSAnbW92ZS1rZXlzJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlS2V5czogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdEtleUluZm86IElTZWxlY3RLZXlCYXNlID0ge1xuICAgICAgICAgICAgICAgICAgICBrZXlmcmFtZXM6IFtdLFxuICAgICAgICAgICAgICAgICAgICBjdHJsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAwLFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRGcmFtZTogMCxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRYOiAwLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjdXJ2ZUluZm8gb2YgY3VydmVLZXlGcmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBrZXlJbmZvcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBrZXlJbmZvc1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlhbPplK7luKfnp7vliqhcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldEZyYW1lWCA9IE1hdGgucm91bmQoaXRlbS5rZXkucG9pbnQueCAtIGl0ZW0ucmF3LnBvaW50LngpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5RGF0YTogSUtleWZyYW1lRGF0YUJhc2UgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogZ3JpZEN0cmwuZ3JpZCEudmFsdWVUb1BpeGVsSChrZXlzW2luZGV4XS5mcmFtZSkgLSBncmlkQ3RybC5ncmlkIS54QXhpc09mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZToga2V5c1tpbmRleF0uZnJhbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3RnJhbWU6IE1hdGgucm91bmQoaXRlbS5yYXcucG9pbnQueCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWU6IG9mZnNldEZyYW1lWCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGN1cnZlSW5mby5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0S2V5SW5mby5rZXlmcmFtZXMucHVzaChrZXlEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldEZyYW1lWSA9IE1hdGgucm91bmQoaXRlbS5rZXkucG9pbnQueSAtIGl0ZW0ucmF3LnBvaW50LnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvZmZzZXRGcmFtZVggJiYgIW9mZnNldEZyYW1lWSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0RnJhbWVYICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUtleXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUF1eEtleXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnJlZihjdXJyZW50Q2xpcCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJ2ZUluZm8ua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW01hdGgucm91bmQoaXRlbS5yYXcucG9pbnQueCldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0RnJhbWVYLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVLZXlzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlQXV4S2V5KHVucmVmKGN1cnJlbnRDbGlwKSwgY3VydmVJbmZvLmtleSwga2V5c1tpbmRleF0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWU6IGl0ZW0ua2V5LnBvaW50LnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudDogaXRlbS5rZXkuaW5UYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRUYW5nZW50OiBpdGVtLmtleS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDmjInpobrluo/vvIzlhYjnp7vliqjvvIzlho3mm7TmlrDlhbPplK7luKfmlbDmja5cbiAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oWy4uLm1vdmVLZXlzLCAuLi5jcmVhdGVLZXlzXSk7XG4gICAgICAgICAgICAgICAgYXV4Q3VydmVTdG9yZS5zZWxlY3RLZXlJbmZvID0gc2VsZWN0S2V5SW5mbztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ3RhbmdlbnQnOiB7XG4gICAgICAgICAgICAgICAgLy8g5omA5pyJ5YWz6ZSu5bin5YC855qE5L+u5pS5XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UHJvcCA9IGN1cnZlS2V5RnJhbWVzWzBdLmtleTtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJ2ZUtleUZyYW1lc1swXS5rZXlzLCBEVU1QX1ZBTFVFX1RZUEUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUtleXMgPSBrZXlzLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kaWZ5QXV4Q3VydmVPZktleSh1bnJlZihjdXJyZW50Q2xpcCksIHRhcmdldFByb3AsIGl0ZW0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudDogaXRlbS5pblRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBicm9rZW46IGl0ZW0uYnJva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogaXRlbS5vdXRUYW5nZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5UYW5nZW50V2VpZ2h0OiBpdGVtLmluVGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IGl0ZW0ub3V0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24obW9kaWZ5S2V5cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUT0RPIOaaguaXtuayoeacieiwg+eUqO+8jOmcgOimgeWcuuaZr+aUr+aMgSBicm9rZW4g5pWw5o2u55qE5L+u5pS5XG4gICAgICAgICAgICBjYXNlICdjaGFuZ2UtYnJva2VuLXN0YXRlJzoge1xuICAgICAgICAgICAgICAgIC8vIOaJgOacieWFs+mUruW4p+WAvOeahOS/ruaUuVxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnZlTmFtZSA9IGN1cnZlS2V5RnJhbWVzWzBdLmtleTtcbiAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChjdXJ2ZUtleUZyYW1lc1swXS5rZXlzLCBEVU1QX1ZBTFVFX1RZUEUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUtleXMgPSBrZXlzIS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vZGlmeUF1eEN1cnZlT2ZLZXkodW5yZWYoY3VycmVudENsaXApLCBjdXJ2ZU5hbWUsIGl0ZW0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyb2tlbjogaXRlbS5icm9rZW4sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKG1vZGlmeUtleXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnY3JlYXRlLWtleXMnOiB7XG4gICAgICAgICAgICAgICAgLy8g57KY6LS05o6l5Y+j55uu5YmN5Lmf6LWw5paw5bu65YWz6ZSu5bin5aSE55CGXG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlS2V5c1Rhc2s6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGN1cnZlSW5mbyBvZiBjdXJ2ZUtleUZyYW1lcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChrZXlJbmZvcywgRFVNUF9WQUxVRV9UWVBFKTtcbiAgICAgICAgICAgICAgICAgICAga2V5cy5mb3JFYWNoKCh0YXJnZXRLZXksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVLZXlzVGFzay5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF1eEtleSh1bnJlZihjdXJyZW50Q2xpcCksIGN1cnZlSW5mby5rZXksIGtleXNbaW5kZXhdLmZyYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudDogdGFyZ2V0S2V5LmluVGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudDogdGFyZ2V0S2V5Lm91dFRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiB0YXJnZXRLZXkuZHVtcC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwTW9kZTogdGFyZ2V0S2V5LmludGVycE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhbmdlbnRXZWlnaHRNb2RlOiB0YXJnZXRLZXkudGFuZ2VudFdlaWdodE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudFdlaWdodDogdGFyZ2V0S2V5LmluVGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0VGFuZ2VudFdlaWdodDogdGFyZ2V0S2V5Lm91dFRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKGNyZWF0ZUtleXNUYXNrKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgJ2NoYW5nZS1pbnRlcnAtbW9kZSc6IHtcbiAgICAgICAgICAgICAgICAvLyDmiYDmnInlhbPplK7luKflgLznmoTkv67mlLlcbiAgICAgICAgICAgICAgICBjb25zdCBtb2RpZnlDdXJ2ZU9mS2V5czogSUFuaW1PcGVyYXRpb25bXSA9IFtdO1xuICAgICAgICAgICAgICAgIGN1cnZlS2V5RnJhbWVzLmZvckVhY2goKGN1cnZlSW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlJbmZvcyA9IGN1cnZlSW5mby5rZXlzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gdHJhbnNmb3JtQ3RybEtleVRvRHVtcChrZXlJbmZvcywgRFVNUF9WQUxVRV9UWVBFKTtcbiAgICAgICAgICAgICAgICAgICAgbW9kaWZ5Q3VydmVPZktleXMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmtleXMubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vZGlmeUF1eEN1cnZlT2ZLZXkodW5yZWYoY3VycmVudENsaXApLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudDogaXRlbS5pblRhbmdlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnQ6IGl0ZW0ub3V0VGFuZ2VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJwTW9kZTogaXRlbS5pbnRlcnBNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24obW9kaWZ5Q3VydmVPZktleXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSAnY2hhbmdlLXRhbmdlbnQtd2VpZ2h0Jzoge1xuICAgICAgICAgICAgICAgIC8vIOaJgOacieWFs+mUruW4p+WAvOeahOS/ruaUuVxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGlmeUN1cnZlT2ZLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgY3VydmVLZXlGcmFtZXMuZm9yRWFjaCgoY3VydmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleUluZm9zID0gY3VydmVJbmZvLmtleXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCBEVU1QX1ZBTFVFX1RZUEUpO1xuICAgICAgICAgICAgICAgICAgICBtb2RpZnlDdXJ2ZU9mS2V5cy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgLi4ua2V5cy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9kaWZ5QXV4Q3VydmVPZktleSh1bnJlZihjdXJyZW50Q2xpcCksIGN1cnZlSW5mby5rZXksIGl0ZW0uZnJhbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFuZ2VudFdlaWdodE1vZGU6IGl0ZW0udGFuZ2VudFdlaWdodE1vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFuZ2VudFdlaWdodDogaXRlbS5pblRhbmdlbnRXZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dFRhbmdlbnRXZWlnaHQ6IGl0ZW0ub3V0VGFuZ2VudFdlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIElBcHBseU9wZXJhdGlvbihtb2RpZnlDdXJ2ZU9mS2V5cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdyZW1vdmUta2V5cyc6IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVLZXlzOiBJQW5pbU9wZXJhdGlvbltdID0gW107XG4gICAgICAgICAgICAgICAgY3VydmVLZXlGcmFtZXMuZm9yRWFjaCgoY3VydmVJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleUluZm9zID0gY3VydmVJbmZvLmtleXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSB0cmFuc2Zvcm1DdHJsS2V5VG9EdW1wKGtleUluZm9zLCBEVU1QX1ZBTFVFX1RZUEUpO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVLZXlzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5rZXlzLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVBdXhLZXkodW5yZWYoY3VycmVudENsaXApLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgSUFwcGx5T3BlcmF0aW9uKHJlbW92ZUtleXMpO1xuICAgICAgICAgICAgICAgIGF1eEN1cnZlU3RvcmUuc2VsZWN0S2V5SW5mbyA9IG51bGw7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlICdtb3ZlLWN1cnZlJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNyZWF0ZUtleXM6IElBbmltT3BlcmF0aW9uW10gPSBbXTtcbiAgICAgICAgICAgICAgICBjdXJ2ZUtleUZyYW1lcy5mb3JFYWNoKChjdXJ2ZUluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5SW5mb3MgPSBjdXJ2ZUluZm8ua2V5cztcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5cyA9IHRyYW5zZm9ybUN0cmxLZXlUb0R1bXAoa2V5SW5mb3MsIERVTVBfVkFMVUVfVFlQRSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaVtOadoeabsue6v+eahOS4iuS4i+enu+WKqO+8muaJgOacieWFs+mUruW4p+WAvOeahOS/ruaUuVxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVLZXlzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5rZXlzLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjcmVhdGVBdXhLZXkodW5yZWYoY3VycmVudENsaXApLCBjdXJ2ZUluZm8ua2V5LCBpdGVtLmZyYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlOiBpdGVtLmR1bXAudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBJQXBwbHlPcGVyYXRpb24oY3JlYXRlS2V5cyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhc2UgJ2NvcHknOiB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzog5pSv5oyB5aSa5p2h5puy57q/44CB5aSa5Liq5YWz6ZSu5bin55qE5aSN5Yi2XG4gICAgICAgICAgICAgICAgY29uc3Qgc3JjQ3VydmUgPSBjdXJ2ZUtleUZyYW1lc1swXTtcbiAgICAgICAgICAgICAgICBjb25zdCBzcmNLZXlmcmFtZSA9IHNyY0N1cnZlLmtleXNbMF07XG5cbiAgICAgICAgICAgICAgICBhdXhDdXJ2ZVN0b3JlLmNvcHlLZXlmcmFtZVNuYXAgPSB7XG4gICAgICAgICAgICAgICAgICAgIGNsaXA6IHVucmVmKGN1cnJlbnRDbGlwKSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc3JjQ3VydmUua2V5LFxuICAgICAgICAgICAgICAgICAgICBmcmFtZTogc3JjS2V5ZnJhbWUucmF3LnBvaW50LngsIC8vIOW9k+WJjeaJgOWkhOeahOW4p1xuICAgICAgICAgICAgICAgICAgICBjdXJ2ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3JjS2V5ZnJhbWUucmF3LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkdW1wOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBEVU1QX1ZBTFVFX1RZUEUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc3JjS2V5ZnJhbWUucmF3LnBvaW50LnksIC8vIOW9k+WJjeW4p+WvueW6lOeahOWAvFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgdHJhbnNmb3JtRXZlbnQgPSB1c2VUcmFuc2Zvcm1FdmVudCgpO1xuICAgIC8vIOebkeWQrOWFtuWug+aTjeS9nOWvvOiHtCBncmlkIOaUueWPmOaXtu+8jOWQjOatpeWIsCBjdXJ2ZSBlZGl0b3JcbiAgICB0cmFuc2Zvcm1FdmVudC5vblVwZGF0ZSgoa2V5KSA9PiB7XG4gICAgICAgIGlmIChrZXkgPT09ICdhdXhfY3VydmUnIHx8ICFncmlkQ3RybC5ncmlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlbCA9IGdldEVsZW1lbnQoKTtcblxuICAgICAgICBzeW5jQXhpc1goZ3JpZEN0cmwuZ3JpZCwgZWwuY3VydmVDdHJsLmdyaWQpO1xuXG4gICAgICAgIHBhaW50KGN1cnZlRGF0YS52YWx1ZSk7XG4gICAgfSk7XG5cbiAgICAvLyDlpITnkIYgY3VydmUgZWRpdG9yIOWPkeWHuueahCB0cmFuc2Zvcm0g5LqL5Lu2XG4gICAgY29uc3Qgb25DdXJ2ZVRyYW5zZm9ybSA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgZWwgPSBnZXRFbGVtZW50KCk7XG4gICAgICAgIGlmIChncmlkQ3RybC5ncmlkKSB7XG4gICAgICAgICAgICBzeW5jQXhpc1goZWwuY3VydmVDdHJsLmdyaWQsIGdyaWRDdHJsLmdyaWQpO1xuXG4gICAgICAgICAgICB0cmFuc2Zvcm1FdmVudC5lbWl0VXBkYXRlKCdhdXhfY3VydmUnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBGSVhNRTog5Lu/54WnIHByb3Ag6YKj6L6555qE5a6e546w77yM5L2G5LiN5YOP6aKE5pyf55qE6YKj5qC35bel5L2c44CC6L+Y6ZyA6KaB5YaN5o6S5p+l44CCXG4gICAgLy8g57KY6LS05YWz6ZSu5bin55qEIHZhbHVlIOW5tuS4jeaYr+WkjeWItueahCB2YWx1Ze+8jOiAjOaYr+m8oOagh+S9jee9ruihqOekuueahCB2YWx1ZeOAglxuICAgIGNvbnN0IGdldENvcHlLZXlzID0gKCk6IElDdXJ2ZUtleUluZm9zW10gPT4ge1xuICAgICAgICBjb25zdCBzbmFwID0gYXV4Q3VydmVTdG9yZS5jb3B5S2V5ZnJhbWVTbmFwO1xuICAgICAgICBpZiAoc25hcCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb3B5S2V5ID0gdHJhbnNEdW1wS2V5VG9DdXJ2ZUtleSh7XG4gICAgICAgICAgICAuLi5zbmFwLmN1cnZlLFxuICAgICAgICAgICAgZnJhbWU6IHNuYXAuZnJhbWUsXG4gICAgICAgICAgICBkdW1wOiBzbmFwLmR1bXAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjb3B5S2V5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleXM6IElDdHJsS2V5ZnJhbWVbXSA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBrZXk6IHtcbiAgICAgICAgICAgICAgICAgICAgLi4uY29weUtleSxcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBzbmFwLmZyYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogc25hcC5kdW1wLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmF3OiBzbmFwLmN1cnZlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXTtcblxuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGtleTogc25hcC5uYW1lLFxuICAgICAgICAgICAgICAgIGtleXM6IGtleXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgIH07XG5cbiAgICBjb25zdCBjb25maWd1cmUgPSAodWlDdXJ2ZTogSFRNTEN1c3RvbUVsZW1lbnQpID0+IHtcbiAgICAgICAgYW5pbWF0aW9uRWRpdG9yLmNvbmZpZ3VyZUN1cnZlRWRpdG9yKHVpQ3VydmUpO1xuXG4gICAgICAgIHVpQ3VydmUuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNmb3JtJywgb25DdXJ2ZVRyYW5zZm9ybSk7XG5cbiAgICAgICAgdWlDdXJ2ZS5jdXJ2ZUN0cmwuZ2V0Q29weUtleXMgPSBnZXRDb3B5S2V5cztcblxuICAgICAgICB1aUN1cnZlLmN1cnZlQ3RybC5vbignb3BlcmF0ZScsIG9uQ3VydmVPcGVyYXRlKTtcbiAgICB9O1xuXG4gICAgLy8g5oqKIGNsaXAuc2FtcGxlIOWQjOatpeiuvue9ruWIsOabsue6v+S4rVxuICAgIHdhdGNoRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKCFjdXJ2ZUVsLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY3VydmVFbC52YWx1ZS5zYW1wbGUgPSBiYXNlU3RvcmUuY3VycmVudFNhbXBsZTtcbiAgICB9KTtcblxuICAgIHdhdGNoKFxuICAgICAgICBjdXJ2ZURhdGEsXG4gICAgICAgIChuZXdEYXRhLCBvbGREYXRhLCBvbkNsZWFudXApID0+IHtcbiAgICAgICAgICAgIGxldCBza2lwID0gZmFsc2U7XG5cbiAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHBhaW50KG5ld0RhdGEpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG9uQ2xlYW51cCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2tpcCA9IHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgZmx1c2g6ICdwb3N0JyxcbiAgICAgICAgfSxcbiAgICApO1xuXG4gICAgb25Nb3VudGVkKCgpID0+IHtcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjdXJ2ZUVsLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGSVhNRTogbW91bnRlZCDml7borr7nva7mm7Lnur/vvIzkvYbnlLHkuo7mm7Lnur/nvJbovpHlmajpu5jorqTmsqHmnInmmL7npLrvvIzlhoXpg6jpg6jliIborqHnrpfpgLvovpHlubbkuI3kvJrnlJ/mlYjvvIzlm6DmraTpnIDopoHlnKjnrKzkuIDmrKHmmL7npLrml7blho3phY3nva7kuIDmrKHjgIJcbiAgICAgICAgICAgIC8vIOWPr+ingSB1c2VDdXJ2ZUVkaXRvciDlhoXpg6jlrp7njrDjgIJcbiAgICAgICAgICAgIGNvbmZpZ3VyZShjdXJ2ZUVsLnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBvblVubW91bnRlZCgoKSA9PiB7XG4gICAgICAgIGlmIChjdXJ2ZUVsLnZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCB1aUN1cnZlID0gY3VydmVFbC52YWx1ZTtcblxuICAgICAgICAgICAgdWlDdXJ2ZS5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2Zvcm0nLCBvbkN1cnZlVHJhbnNmb3JtKTtcblxuICAgICAgICAgICAgdWlDdXJ2ZS5jdXJ2ZUN0cmwub2ZmKCdvcGVyYXRlJywgb25DdXJ2ZU9wZXJhdGUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjdXJ2ZUVsLFxuICAgICAgICB2aXNpYmxlOiB2aXNpYmxlLFxuICAgICAgICBzaG93LFxuICAgICAgICBoaWRlLFxuICAgICAgICBwYWludCxcblxuICAgICAgICBvblRyYW5zZm9ybTogb25DdXJ2ZVRyYW5zZm9ybSxcbiAgICAgICAgb25PcGVyYXRlOiBvbkN1cnZlT3BlcmF0ZSxcbiAgICB9O1xufVxuIl19